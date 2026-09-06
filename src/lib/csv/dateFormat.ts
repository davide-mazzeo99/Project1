export type DateFormat = 'DD/MM/YYYY' | 'YYYY-MM-DD'

const DMY_RE = /^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{4})$/
const YMD_RE = /^(\d{4})-(\d{1,2})-(\d{1,2})$/

function pad(n: number): string {
  return n.toString().padStart(2, '0')
}

function isValidDate(year: number, month: number, day: number): boolean {
  if (month < 1 || month > 12) return false
  const d = new Date(Date.UTC(year, month - 1, day))
  return d.getUTCFullYear() === year && d.getUTCMonth() === month - 1 && d.getUTCDate() === day
}

/** Parses a date string in the given format, returning an ISO YYYY-MM-DD string or null. */
export function parseDate(raw: string, format: DateFormat): string | null {
  const s = raw.trim()
  if (!s) return null

  if (format === 'DD/MM/YYYY') {
    const m = DMY_RE.exec(s)
    if (!m) return null
    const day = Number(m[1])
    const month = Number(m[2])
    const year = Number(m[3])
    if (!isValidDate(year, month, day)) return null
    return `${year}-${pad(month)}-${pad(day)}`
  }

  const m = YMD_RE.exec(s)
  if (!m) return null
  const year = Number(m[1])
  const month = Number(m[2])
  const day = Number(m[3])
  if (!isValidDate(year, month, day)) return null
  return `${year}-${pad(month)}-${pad(day)}`
}

/** Heuristically guesses whether samples use DD/MM/YYYY or YYYY-MM-DD. */
export function guessDateFormat(samples: string[]): DateFormat | null {
  let dmy = 0
  let ymd = 0
  for (const raw of samples) {
    const s = raw.trim()
    if (!s) continue
    if (YMD_RE.test(s)) ymd++
    else if (DMY_RE.test(s)) dmy++
  }
  if (dmy === 0 && ymd === 0) return null
  return dmy >= ymd ? 'DD/MM/YYYY' : 'YYYY-MM-DD'
}

export function looksLikeDate(samples: string[], minRatio = 0.6): boolean {
  const nonEmpty = samples.filter((s) => s.trim() !== '')
  if (nonEmpty.length === 0) return false
  const format = guessDateFormat(nonEmpty)
  if (!format) return false
  const parsed = nonEmpty.filter((s) => parseDate(s, format) !== null)
  return parsed.length / nonEmpty.length >= minRatio
}
