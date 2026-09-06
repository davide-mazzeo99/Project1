import Papa from 'papaparse'

export interface ParsedCsv {
  delimiter: string
  rows: string[][]
}

const CANDIDATE_DELIMITERS = [',', ';', '\t']

/** Parses raw CSV text into rows of strings, auto-detecting the delimiter unless one is given. */
export function parseCsvRows(text: string, delimiterOverride?: string): ParsedCsv {
  const result = Papa.parse<string[]>(text, {
    delimiter: delimiterOverride ?? '',
    skipEmptyLines: true,
  })

  const delimiter = delimiterOverride ?? (result.meta.delimiter || guessDelimiterFallback(text))
  const rows = (result.data as unknown[][]).map((row) => row.map((cell) => String(cell ?? '')))
  return { delimiter, rows }
}

/** Manual fallback delimiter detection, used if PapaParse's guess looks unreliable. */
function guessDelimiterFallback(text: string): string {
  const firstLines = text.split(/\r\n|\n|\r/).slice(0, 5)
  const scores = CANDIDATE_DELIMITERS.map((delim) => {
    const counts = firstLines.map((line) => line.split(delim).length - 1)
    const nonZero = counts.filter((c) => c > 0)
    if (nonZero.length === 0) return { delim, score: -1 }
    const consistent = nonZero.every((c) => c === nonZero[0])
    return { delim, score: consistent ? nonZero[0] : nonZero[0] - 1 }
  })
  scores.sort((a, b) => b.score - a.score)
  return scores[0]?.score > 0 ? scores[0].delim : ','
}
