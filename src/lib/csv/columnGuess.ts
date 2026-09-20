import { guessDecimalFormat, looksNumeric, parseAmount, type DecimalFormat } from '@/lib/csv/numberFormat'
import { guessDateFormat, looksLikeDate, parseDate, type DateFormat } from '@/lib/csv/dateFormat'

export type ColumnRole = 'date' | 'amount' | 'description' | 'balance'

export interface ColumnGuessResult {
  hasHeaderRow: boolean
  dateColumn: number
  amountColumn: number
  descriptionColumn: number
  balanceColumn: number | null
  dateFormat: DateFormat
  decimalFormat: DecimalFormat
  /** 0..1, how confident we are that all required columns were found reliably. */
  confidence: number
}

const HEADER_KEYWORDS: Record<ColumnRole, string[]> = {
  date: ['data', 'date', 'data operazione', 'data contabile', 'buchungstag', 'wertstellung', 'fecha'],
  amount: ['importo', 'amount', 'valore', 'movimento', 'betrag', 'importe', 'ammontare'],
  description: [
    'descrizione', 'description', 'causale', 'dettaglio', 'dettagli', 'verwendungszweck',
    'beschreibung', 'note', 'concepto', 'memo', 'reference', 'riferimento',
  ],
  balance: ['saldo', 'balance', 'saldo contabile', 'kontostand', 'running balance'],
}

/** True if the cell plausibly holds a number or a date (either supported format) — i.e. "data-like", not a label. */
function looksLikeDataCell(cell: string): boolean {
  if (!cell) return false
  if (parseAmount(cell, 'european') !== null || parseAmount(cell, 'standard') !== null) return true
  if (parseDate(cell, 'DD/MM/YYYY') !== null || parseDate(cell, 'YYYY-MM-DD') !== null) return true
  return false
}

/**
 * A genuine header row has (almost) no cells that parse as a number or date — header labels
 * are text. A genuine data row typically has only its description column as free text, with
 * date/amount/balance columns parsing successfully — so it scores far below the threshold.
 */
function looksLikeHeaderRow(row: string[], dataRows: string[][]): boolean {
  if (dataRows.length === 0) return false
  let nonEmpty = 0
  let textual = 0
  for (const raw of row) {
    const cell = raw?.trim() ?? ''
    if (!cell) continue
    nonEmpty++
    if (!looksLikeDataCell(cell)) textual++
  }
  if (nonEmpty === 0) return false
  return textual / nonEmpty >= 0.6
}

function matchHeaderRole(header: string): ColumnRole | null {
  const normalized = header.trim().toLowerCase()
  if (!normalized) return null
  for (const [role, keywords] of Object.entries(HEADER_KEYWORDS) as [ColumnRole, string[]][]) {
    if (keywords.some((kw) => normalized.includes(kw))) return role
  }
  return null
}

/**
 * Some banks print a "cover" block — account name, IBAN, current balance — before the actual
 * transaction table, in every export format (seen identically in both an Excel and a PDF export
 * of the same statement). Assuming row 0 is the header, as the rest of this file always did,
 * misreads that cover block: e.g. a "Saldo" label a few rows up gets mistaken for the real
 * balance column, silently offsetting every other column guess. This scans the first few rows for
 * the one genuine header — the one naming both a date and an amount column — so the caller can
 * trim everything above it before any column guessing happens.
 */
export function findHeaderRowIndex(rows: string[][], maxScan = 20): number | null {
  for (let i = 0; i < Math.min(maxScan, rows.length); i++) {
    const roles = new Set(rows[i].map(matchHeaderRole))
    if (roles.has('date') && roles.has('amount')) return i
  }
  return null
}

/**
 * Attempts to auto-detect which columns hold date / amount / description / balance,
 * using header text keywords first and cell-content heuristics as fallback/validation.
 */
export function guessColumns(rows: string[][]): ColumnGuessResult | null {
  if (rows.length === 0) return null

  const maybeHeader = rows[0]
  const dataCandidates = rows.slice(1, 30)
  const hasHeaderRow = looksLikeHeaderRow(maybeHeader, dataCandidates)
  const sampleRows = hasHeaderRow ? rows.slice(1, 30) : rows.slice(0, 30)
  if (sampleRows.length === 0) return null

  const columnCount = Math.max(...rows.slice(0, 30).map((r) => r.length))
  const roleByColumn = new Map<number, ColumnRole>()

  if (hasHeaderRow) {
    maybeHeader.forEach((header, idx) => {
      const role = matchHeaderRole(header)
      if (role && !Array.from(roleByColumn.values()).includes(role)) {
        roleByColumn.set(idx, role)
      }
    })
  }

  // Content-based fallback for any role not yet found via headers.
  const columns: string[][] = []
  for (let c = 0; c < columnCount; c++) {
    columns.push(sampleRows.map((r) => r[c] ?? ''))
  }

  const decimalFormat =
    roleByColumn.size > 0 && Array.from(roleByColumn.entries()).find(([, r]) => r === 'amount')
      ? guessDecimalFormat(columns[[...roleByColumn].find(([, r]) => r === 'amount')![0]])
      : guessDecimalFormat(columns.flat())

  if (!Array.from(roleByColumn.values()).includes('date')) {
    let best = -1
    let bestScore = 0
    columns.forEach((col, idx) => {
      if (roleByColumn.has(idx)) return
      const dmy = guessDateFormat(col)
      if (dmy && looksLikeDate(col)) {
        const score = col.filter((v) => v.trim() !== '').length
        if (score > bestScore) {
          bestScore = score
          best = idx
        }
      }
    })
    if (best >= 0) roleByColumn.set(best, 'date')
  }

  if (!Array.from(roleByColumn.values()).includes('amount')) {
    let best = -1
    let bestScore = 0
    columns.forEach((col, idx) => {
      if (roleByColumn.has(idx)) return
      if (looksNumeric(col, decimalFormat)) {
        const score = col.filter((v) => v.trim() !== '').length
        if (score > bestScore) {
          bestScore = score
          best = idx
        }
      }
    })
    if (best >= 0) roleByColumn.set(best, 'amount')
  }

  if (!Array.from(roleByColumn.values()).includes('description')) {
    let best = -1
    let bestLen = 0
    columns.forEach((col, idx) => {
      if (roleByColumn.has(idx)) return
      const avgLen = col.reduce((s, v) => s + v.length, 0) / (col.length || 1)
      if (avgLen > bestLen) {
        bestLen = avgLen
        best = idx
      }
    })
    if (best >= 0) roleByColumn.set(best, 'description')
  }

  const dateColumn = [...roleByColumn].find(([, r]) => r === 'date')?.[0] ?? -1
  const amountColumn = [...roleByColumn].find(([, r]) => r === 'amount')?.[0] ?? -1
  const descriptionColumn = [...roleByColumn].find(([, r]) => r === 'description')?.[0] ?? -1
  const balanceColumn = [...roleByColumn].find(([, r]) => r === 'balance')?.[0] ?? null

  if (dateColumn === -1 || amountColumn === -1 || descriptionColumn === -1) return null

  const dateFormat = guessDateFormat(columns[dateColumn]) ?? 'DD/MM/YYYY'
  const finalDecimalFormat = guessDecimalFormat(columns[amountColumn])

  const dateOk = looksLikeDate(columns[dateColumn])
  const amountOk = looksNumeric(columns[amountColumn], finalDecimalFormat)
  const confidence = (dateOk ? 0.5 : 0) + (amountOk ? 0.5 : 0)

  return {
    hasHeaderRow,
    dateColumn,
    amountColumn,
    descriptionColumn,
    balanceColumn,
    dateFormat,
    decimalFormat: finalDecimalFormat,
    confidence,
  }
}
