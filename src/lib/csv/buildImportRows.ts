import { parseAmount, type DecimalFormat } from '@/lib/csv/numberFormat'
import { parseDate, type DateFormat } from '@/lib/csv/dateFormat'
import { computeImportHash } from '@/lib/importHash'

export interface MappingConfig {
  hasHeaderRow: boolean
  dateColumn: number
  amountColumn: number
  descriptionColumn: number
  balanceColumn: number | null
  dateFormat: DateFormat
  decimalFormat: DecimalFormat
}

export interface ImportRowResult {
  rowIndex: number
  raw: string[]
  date: string | null
  amount: number | null
  description: string
  balance: number | null
  valid: boolean
  error?: string
  importHash: string
  /** true if this exact hash already exists in the DB, or appears earlier in this same file */
  isDuplicate: boolean
}

export function buildImportRows(rows: string[][], mapping: MappingConfig, accountId: string): ImportRowResult[] {
  const dataRows = mapping.hasHeaderRow ? rows.slice(1) : rows
  const seenInFile = new Set<string>()

  return dataRows.map((raw, i) => {
    const rawDate = raw[mapping.dateColumn] ?? ''
    const rawAmount = raw[mapping.amountColumn] ?? ''
    const description = (raw[mapping.descriptionColumn] ?? '').trim()
    const rawBalance = mapping.balanceColumn != null ? raw[mapping.balanceColumn] ?? '' : ''

    const date = parseDate(rawDate, mapping.dateFormat)
    const amount = parseAmount(rawAmount, mapping.decimalFormat)
    const balance = rawBalance ? parseAmount(rawBalance, mapping.decimalFormat) : null

    let error: string | undefined
    if (!date) error = 'Data non riconosciuta'
    else if (amount === null) error = 'Importo non riconosciuto'
    else if (!description) error = 'Descrizione mancante'

    const valid = !error
    const importHash = valid ? computeImportHash(accountId, date!, amount!, description) : ''
    const isDuplicate = valid && seenInFile.has(importHash)
    if (valid) seenInFile.add(importHash)

    return {
      rowIndex: i,
      raw,
      date,
      amount,
      description,
      balance,
      valid,
      error,
      importHash,
      isDuplicate,
    }
  })
}
