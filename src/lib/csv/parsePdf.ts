import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist'
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

GlobalWorkerOptions.workerSrc = workerSrc

interface TextItem {
  text: string
  x: number
  y: number
  width: number
  fontSize: number
}

interface Cell {
  text: string
  x: number
}

/** Text items on the same line differ in y by less than this (in PDF points) — accounts for small baseline jitter. */
const SAME_LINE_TOLERANCE = 2
/**
 * A horizontal gap wider than this multiple of the item's own font size reads as a column break
 * rather than a space within one field. Comparing against font size (not the *previous* item's
 * width, which was the original — broken — approach) matters because a long description column
 * has a large width of its own; sizing the threshold off of it made the gap to the next column
 * look tiny by comparison and column boundaries went undetected. A normal inter-word space is
 * roughly a quarter of the font size, while a genuine column gap in a tabular layout is typically
 * several times that, so this ratio comfortably separates the two.
 */
const COLUMN_GAP_EM = 1.3
/**
 * A vertical gap between one line and the next wider than this multiple of the font size starts a
 * new transaction row; a narrower gap means this line is a continuation of the row above. Real
 * bank statements routinely print a transaction across several lines — an extra "value date" line,
 * a wrapped description, a commission note — all packed at normal single-line spacing (~1.2-1.3x
 * font size) directly under the entry they belong to, while distinct entries are spaced further
 * apart (~3x font size in samples seen). This ratio sits in the gap between those two spacings.
 */
const NEW_ROW_GAP_EM = 1.6

const ITALIAN_MONTHS: Record<string, string> = {
  gen: '01',
  feb: '02',
  mar: '03',
  apr: '04',
  mag: '05',
  giu: '06',
  lug: '07',
  ago: '08',
  set: '09',
  ott: '10',
  nov: '11',
  dic: '12',
}
/** Matches PDF-rendered dates like "20 set 2026" (day, Italian month abbreviation, year). */
const ITALIAN_DATE_RE = /^(\d{1,2})\s+([a-zà-ù]{3,4})\.?\s+(\d{4})$/i

/**
 * Normalizes a PDF-rendered Italian textual date ("20 set 2026") to DD/MM/YYYY so it flows through
 * the date parsing the rest of the app already supports. This is specific to how PDF statements
 * render dates for humans to read, not something a CSV/Excel dateFormat picker needs to know about,
 * so the normalization happens here at the PDF-parsing boundary instead of widening the shared
 * date parser for every import source.
 */
function normalizeItalianDate(text: string): string {
  const m = ITALIAN_DATE_RE.exec(text.trim())
  if (!m) return text
  const month = ITALIAN_MONTHS[m[2].toLowerCase()]
  if (!month) return text
  return `${m[1].padStart(2, '0')}/${month}/${m[3]}`
}

/**
 * Reads a text-based PDF bank statement (not a scan — no OCR) and reconstructs it into the same
 * string[][] shape the CSV/Excel pipeline expects. PDFs have no real table structure: pdf.js only
 * gives us each word's text and its (x, y) position on the page. Rows are reconstructed by
 * clustering words with near-identical y into lines, splitting each line into columns wherever the
 * horizontal gap is wide relative to normal word spacing, and folding lines that sit at normal
 * line-spacing under the entry above (rather than starting a fresh, more widely-spaced row) into
 * that entry as extra description text. Because this is inherently a best-effort heuristic (unlike
 * a real CSV/Excel table), the caller always routes the result through the same editable
 * column-mapping step so the user can fix anything misread before importing.
 */
export async function parsePdfRows(buffer: ArrayBuffer): Promise<string[][]> {
  const pdf = await getDocument({ data: buffer }).promise
  const rows: string[][] = []

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum)
    const content = await page.getTextContent()

    const items: TextItem[] = content.items
      .map((raw) => {
        const item = raw as { str?: string; transform?: number[]; width?: number }
        const text = item.str?.trim()
        if (!text || !item.transform) return null
        // transform is [scaleX, skewX, skewY, scaleY, x, y]; scaleY approximates the font size for
        // the axis-aligned (unrotated, unskewed) text typical of a bank statement export.
        const fontSize = Math.abs(item.transform[3]) || Math.abs(item.transform[0]) || 10
        return { text, x: item.transform[4], y: item.transform[5], width: item.width ?? 0, fontSize }
      })
      .filter((v): v is TextItem => v !== null)

    rows.push(...reconstructRows(items))
  }

  return rows.map((row) => row.map(normalizeItalianDate))
}

function reconstructRows(items: TextItem[]): string[][] {
  if (items.length === 0) return []

  const sorted = [...items].sort((a, b) => b.y - a.y || a.x - b.x)
  const lines: TextItem[][] = []
  let currentLine: TextItem[] = [sorted[0]]

  for (let i = 1; i < sorted.length; i++) {
    const item = sorted[i]
    const lineY = currentLine[0].y
    if (Math.abs(item.y - lineY) <= SAME_LINE_TOLERANCE) {
      currentLine.push(item)
    } else {
      lines.push(currentLine)
      currentLine = [item]
    }
  }
  lines.push(currentLine)

  const rows: Cell[][] = []
  let prevY: number | null = null

  for (const line of lines) {
    const cells = splitLineIntoCells(line)
    const gap = prevY === null ? Infinity : prevY - line[0].y
    prevY = line[0].y

    if (rows.length > 0 && gap <= line[0].fontSize * NEW_ROW_GAP_EM) {
      appendContinuation(rows[rows.length - 1], cells)
    } else {
      rows.push(cells)
    }
  }

  return rows.map((row) => row.map((cell) => cell.text))
}

function splitLineIntoCells(line: TextItem[]): Cell[] {
  const sortedLine = [...line].sort((a, b) => a.x - b.x)
  const cells: Cell[] = []
  let words: string[] = [sortedLine[0].text]
  let cellX = sortedLine[0].x
  let prevEnd = sortedLine[0].x + sortedLine[0].width

  for (let i = 1; i < sortedLine.length; i++) {
    const item = sortedLine[i]
    const gap = item.x - prevEnd
    if (gap > item.fontSize * COLUMN_GAP_EM) {
      cells.push({ text: words.join(' '), x: cellX })
      words = [item.text]
      cellX = item.x
    } else {
      words.push(item.text)
    }
    prevEnd = item.x + item.width
  }
  cells.push({ text: words.join(' '), x: cellX })
  return cells
}

/**
 * A continuation line (a wrapped description, a "value date" footnote, a commission note) has no
 * columns of its own — fold its text into whichever cell of the parent row is currently longest,
 * since in a tabular statement that's reliably the free-text description column rather than a
 * short date, amount or balance field.
 */
function appendContinuation(row: Cell[], continuationCells: Cell[]): void {
  if (row.length === 0) return
  let target = row[0]
  for (const cell of row) {
    if (cell.text.length > target.text.length) target = cell
  }
  const extra = continuationCells.map((c) => c.text).join(' ')
  target.text = `${target.text} ${extra}`.trim()
}
