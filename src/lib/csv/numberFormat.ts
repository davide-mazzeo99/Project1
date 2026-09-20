export type DecimalFormat = 'european' | 'standard'

/**
 * Parses a monetary string in either European (1.234,56) or standard
 * (1,234.56 or 1234.56) format. Returns null if it cannot be parsed as a number.
 */
export function parseAmount(raw: string, format: DecimalFormat): number | null {
  if (raw == null) return null
  let s = raw.trim()
  if (s === '') return null

  // Normalize the Unicode minus sign (U+2212, "−") to a plain ASCII hyphen — PDF-rendered
  // statements often use it instead of "-", and it wouldn't otherwise be recognized as a sign.
  s = s.replace(/−/g, '-')

  // Strip currency symbols, spaces (incl. non-breaking) and a trailing sign convention like "12,50-"
  s = s.replace(/[€$\s ]/g, '')
  let negative = false
  if (s.startsWith('-')) {
    negative = true
    s = s.slice(1)
  } else if (s.startsWith('+')) {
    s = s.slice(1)
  } else if (s.endsWith('-')) {
    negative = true
    s = s.slice(0, -1)
  }
  if (s.startsWith('(') && s.endsWith(')')) {
    negative = true
    s = s.slice(1, -1)
  }

  if (s === '') return null

  let normalized: string
  if (format === 'european') {
    // thousands = '.', decimal = ','
    normalized = s.replace(/\./g, '').replace(',', '.')
  } else {
    // thousands = ',', decimal = '.'
    normalized = s.replace(/,/g, '')
  }

  if (!/^\d+(\.\d+)?$/.test(normalized)) return null
  const value = Number.parseFloat(normalized)
  if (!Number.isFinite(value)) return null
  return negative ? -value : value
}

/** Heuristically guesses whether a column uses european or standard decimal notation. */
export function guessDecimalFormat(samples: string[]): DecimalFormat {
  let europeanVotes = 0
  let standardVotes = 0
  for (const raw of samples) {
    const s = raw.trim()
    const lastComma = s.lastIndexOf(',')
    const lastDot = s.lastIndexOf('.')
    if (lastComma === -1 && lastDot === -1) continue
    if (lastComma > lastDot) europeanVotes++
    else if (lastDot > lastComma) standardVotes++
  }
  return europeanVotes >= standardVotes ? 'european' : 'standard'
}

/** True if most of the sample strings parse as a number under the given format. */
export function looksNumeric(samples: string[], format: DecimalFormat, minRatio = 0.6): boolean {
  const nonEmpty = samples.filter((s) => s.trim() !== '')
  if (nonEmpty.length === 0) return false
  const parsed = nonEmpty.filter((s) => parseAmount(s, format) !== null)
  return parsed.length / nonEmpty.length >= minRatio
}
