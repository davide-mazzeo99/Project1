import { read, utils } from 'xlsx'

/**
 * Reads the first sheet of an Excel file (.xlsx/.xls) into the same string[][] shape the CSV
 * pipeline expects, so column-guessing, mapping and rule-based categorization all work unchanged
 * regardless of whether the bank exported a spreadsheet or a plain CSV. `raw: false` formats each
 * cell using its own number/date format (as Excel would display it) instead of a raw serial
 * number, so dates and amounts come out as recognizable text like a CSV export would contain.
 */
export function parseExcelRows(buffer: ArrayBuffer): string[][] {
  const workbook = read(buffer, { type: 'array', cellDates: true })
  const sheetName = workbook.SheetNames[0]
  if (!sheetName) return []
  const sheet = workbook.Sheets[sheetName]
  const rows = utils.sheet_to_json<string[]>(sheet, { header: 1, raw: false, defval: '', dateNF: 'dd/mm/yyyy' })
  return rows.map((row) => row.map((cell) => String(cell ?? '').trim())).filter((row) => row.some((cell) => cell !== ''))
}
