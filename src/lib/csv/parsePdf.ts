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
 * Reads a text-based PDF bank statement (not a scan — no OCR) and reconstructs it into the same
 * string[][] shape the CSV/Excel pipeline expects. PDFs have no real table structure: pdf.js only
 * gives us each word's text and its (x, y) position on the page. Rows are reconstructed by
 * clustering words with near-identical y (same line), then columns by splitting each line wherever
 * the horizontal gap between consecutive words is wide relative to normal word spacing — a rough
 * but workable proxy for a genuine column boundary in table-like statements. Because this is
 * inherently a best-effort heuristic (unlike a real CSV/Excel table), the caller always routes the
 * result through the same editable column-mapping step so the user can fix anything misread before
 * importing.
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

  return rows
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

  return lines.map((line) => {
    const sortedLine = [...line].sort((a, b) => a.x - b.x)
    const cells: string[] = []
    let cellWords: string[] = [sortedLine[0].text]
    let prevEnd = sortedLine[0].x + sortedLine[0].width

    for (let i = 1; i < sortedLine.length; i++) {
      const item = sortedLine[i]
      const gap = item.x - prevEnd
      if (gap > item.fontSize * COLUMN_GAP_EM) {
        cells.push(cellWords.join(' '))
        cellWords = [item.text]
      } else {
        cellWords.push(item.text)
      }
      prevEnd = item.x + item.width
    }
    cells.push(cellWords.join(' '))
    return cells
  })
}
