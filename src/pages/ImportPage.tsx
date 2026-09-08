import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { db } from '@/db/db'
import { makeId } from '@/lib/id'
import { decodeFileText, decodeTextWith } from '@/lib/csv/decode'
import { parseCsvRows } from '@/lib/csv/parse'
import { parseExcelRows } from '@/lib/csv/parseExcel'
import { guessColumns } from '@/lib/csv/columnGuess'
import { buildImportRows, type ImportRowResult } from '@/lib/csv/buildImportRows'
import { getPresetForInstitution, savePreset } from '@/db/repo/importPresets'
import { findMatchingCategory } from '@/lib/rules/engine'
import { ImportUploadStep } from '@/components/import/ImportUploadStep'
import { ImportMappingStep, type MappingState } from '@/components/import/ImportMappingStep'
import { ImportSummaryStep } from '@/components/import/ImportSummaryStep'
import { useToast } from '@/components/ui/Toast'
import { SANTANDER_ACCOUNT_ID } from '@/db/bootstrap'
import type { Institution } from '@/types'

type Step = 'upload' | 'mapping' | 'summary'

const STEP_LABELS: Record<Step, string> = {
  upload: 'Importa estratto conto',
  mapping: 'Mappa le colonne',
  summary: 'Riepilogo import',
}

function isExcelFile(file: File): boolean {
  return /\.xlsx?$/i.test(file.name) || file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || file.type === 'application/vnd.ms-excel'
}

export function ImportPage() {
  const navigate = useNavigate()
  const { showToast } = useToast()

  const [step, setStep] = useState<Step>('upload')
  const [accountId, setAccountId] = useState(SANTANDER_ACCOUNT_ID)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [fileBuffer, setFileBuffer] = useState<ArrayBuffer | null>(null)
  const [rows, setRows] = useState<string[][]>([])
  const [mapping, setMapping] = useState<MappingState | null>(null)
  const [autoDetected, setAutoDetected] = useState(false)
  const [results, setResults] = useState<ImportRowResult[]>([])
  const [autoCategoryByRow, setAutoCategoryByRow] = useState<Map<number, string>>(new Map())
  const [savePresetChecked, setSavePresetChecked] = useState(false)
  const [presetName, setPresetName] = useState('')
  const [importing, setImporting] = useState(false)

  async function handleFileSelected(file: File) {
    setUploadError(null)
    try {
      const buffer = await file.arrayBuffer()
      const excel = isExcelFile(file)

      let parsedRows: string[][]
      let delimiter = ','
      let encoding: MappingState['encoding'] = 'utf-8'

      if (excel) {
        parsedRows = parseExcelRows(buffer)
      } else {
        const decoded = await decodeFileText(file)
        encoding = decoded.encoding
        const parsed = parseCsvRows(decoded.text)
        parsedRows = parsed.rows
        delimiter = parsed.delimiter
      }

      if (parsedRows.length === 0) {
        setUploadError('Il file sembra vuoto o non leggibile.')
        return
      }

      const account = await db.accounts.get(accountId)
      const institution: Institution | undefined = account?.institution
      const preset = institution ? await getPresetForInstitution(institution) : undefined
      const guess = guessColumns(parsedRows)

      let nextMapping: MappingState
      let detected = false

      if (preset) {
        nextMapping = {
          hasHeaderRow: preset.hasHeaderRow,
          sourceFormat: excel ? 'excel' : 'csv',
          delimiter: preset.delimiter,
          encoding: preset.encoding as MappingState['encoding'],
          dateColumn: preset.dateColumn,
          amountColumn: preset.amountColumn,
          descriptionColumn: preset.descriptionColumn,
          balanceColumn: preset.balanceColumn ?? null,
          dateFormat: preset.dateFormat,
          decimalFormat: preset.decimalFormat,
        }
        detected = true
      } else if (guess) {
        nextMapping = {
          hasHeaderRow: guess.hasHeaderRow,
          sourceFormat: excel ? 'excel' : 'csv',
          delimiter,
          encoding,
          dateColumn: guess.dateColumn,
          amountColumn: guess.amountColumn,
          descriptionColumn: guess.descriptionColumn,
          balanceColumn: guess.balanceColumn,
          dateFormat: guess.dateFormat,
          decimalFormat: guess.decimalFormat,
        }
        detected = guess.confidence >= 1
      } else {
        nextMapping = {
          hasHeaderRow: true,
          sourceFormat: excel ? 'excel' : 'csv',
          delimiter,
          encoding,
          dateColumn: 0,
          amountColumn: 1,
          descriptionColumn: 2,
          balanceColumn: null,
          dateFormat: 'DD/MM/YYYY',
          decimalFormat: 'european',
        }
        detected = false
      }

      setFileBuffer(buffer)
      setRows(parsedRows)
      setMapping(nextMapping)
      setAutoDetected(detected)
      setPresetName(institution === 'santander' ? 'Santander' : institution === 'traderepublic' ? 'Trade Republic' : 'Import personalizzato')
      setStep('mapping')
    } catch (err) {
      console.error(err)
      setUploadError('Impossibile leggere il file. Riprova o scegli un altro file.')
    }
  }

  function handleMappingChange(next: MappingState) {
    if (!mapping || !fileBuffer) {
      setMapping(next)
      return
    }
    if (next.sourceFormat === 'csv' && (next.encoding !== mapping.encoding || next.delimiter !== mapping.delimiter)) {
      const text = decodeTextWith(fileBuffer, next.encoding)
      const { rows: reparsed } = parseCsvRows(text, next.delimiter)
      setRows(reparsed)
    }
    setMapping(next)
  }

  async function handleMappingConfirm() {
    if (!mapping) return
    const computed = buildImportRows(rows, mapping, accountId)
    const validHashes = computed.filter((r) => r.valid).map((r) => r.importHash)
    const existing = validHashes.length
      ? await db.transactions.where('importHash').anyOf(validHashes).toArray()
      : []
    const existingHashes = new Set(existing.map((t) => t.importHash))
    const withDedup = computed.map((r) => ({
      ...r,
      isDuplicate: r.isDuplicate || (r.valid && existingHashes.has(r.importHash)),
    }))

    const rules = await db.rules.toArray()
    const autoCategory = new Map<number, string>()
    if (rules.length > 0) {
      for (const r of withDedup) {
        if (!r.valid || r.isDuplicate) continue
        const categoryId = findMatchingCategory(rules, r.description)
        if (categoryId) autoCategory.set(r.rowIndex, categoryId)
      }
    }

    setResults(withDedup)
    setAutoCategoryByRow(autoCategory)
    setStep('summary')
  }

  async function handleConfirmImport() {
    if (importing) return
    setImporting(true)
    try {
      const toInsert = results.filter((r) => r.valid && !r.isDuplicate)
      const now = Date.now()
      const account = await db.accounts.get(accountId)
      const transferCategoryIds = new Set(
        (await db.categories.where('type').equals('transfer').toArray()).map((c) => c.id),
      )

      await db.transaction('rw', db.transactions, db.importPresets, async () => {
        await db.transactions.bulkAdd(
          toInsert.map((r) => {
            const categoryId = autoCategoryByRow.get(r.rowIndex) ?? null
            return {
              id: makeId(),
              accountId,
              date: r.date!,
              amount: r.amount!,
              description: r.description,
              rawDescription: r.raw.join(' | '),
              categoryId,
              isRecurring: false,
              isTransfer: categoryId ? transferCategoryIds.has(categoryId) : false,
              importHash: r.importHash,
              tags: [],
              createdAt: now,
              updatedAt: now,
            }
          }),
        )

        if (savePresetChecked && mapping && account) {
          await savePreset({
            name: presetName.trim() || account.institution,
            institution: account.institution,
            delimiter: mapping.delimiter,
            encoding: mapping.encoding,
            dateColumn: mapping.dateColumn,
            amountColumn: mapping.amountColumn,
            descriptionColumn: mapping.descriptionColumn,
            balanceColumn: mapping.balanceColumn ?? undefined,
            dateFormat: mapping.dateFormat,
            decimalFormat: mapping.decimalFormat,
            hasHeaderRow: mapping.hasHeaderRow,
          })
        }
      })

      showToast(`${toInsert.length} transazioni importate`)
      navigate('/transazioni')
    } finally {
      setImporting(false)
    }
  }

  function goBack() {
    if (step === 'mapping') setStep('upload')
    else if (step === 'summary') setStep('mapping')
    else navigate('/transazioni')
  }

  return (
    <div className="px-4 pb-24 pt-4">
      <div className="mb-4 flex items-center gap-2">
        <button
          onClick={goBack}
          className="tap-target -ml-2 flex items-center justify-center rounded-full text-gray-500 active:bg-gray-200 dark:text-gray-400 dark:active:bg-gray-800"
          aria-label="Indietro"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{STEP_LABELS[step]}</h1>
      </div>

      {step === 'upload' && (
        <ImportUploadStep
          accountId={accountId}
          onAccountChange={setAccountId}
          onFileSelected={handleFileSelected}
          error={uploadError}
        />
      )}

      {step === 'mapping' && mapping && (
        <>
          <ImportMappingStep rows={rows} mapping={mapping} onChange={handleMappingChange} autoDetected={autoDetected} />
          <button
            onClick={handleMappingConfirm}
            className="tap-target mt-4 w-full rounded-xl bg-brand-600 py-3 text-sm font-semibold text-white active:bg-brand-700"
          >
            Continua
          </button>
        </>
      )}

      {step === 'summary' && (
        <>
          <ImportSummaryStep
            results={results}
            autoCategorizedRows={autoCategoryByRow.size}
            savePreset={savePresetChecked}
            onSavePresetChange={setSavePresetChecked}
            presetName={presetName}
            onPresetNameChange={setPresetName}
          />
          <button
            onClick={handleConfirmImport}
            disabled={importing || results.filter((r) => r.valid && !r.isDuplicate).length === 0}
            className="tap-target mt-4 w-full rounded-xl bg-brand-600 py-3 text-sm font-semibold text-white active:bg-brand-700 disabled:opacity-40"
          >
            {importing ? 'Importazione...' : `Importa ${results.filter((r) => r.valid && !r.isDuplicate).length} transazioni`}
          </button>
        </>
      )}
    </div>
  )
}
