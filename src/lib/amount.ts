/** Appends a digit to an amount buffer (e.g. "12,5"), capping decimals at 2. */
export function appendDigit(buffer: string, digit: string): string {
  const [, decimals] = buffer.split(',')
  if (decimals !== undefined && decimals.length >= 2) return buffer
  if (buffer === '0') return digit
  return buffer + digit
}

export function appendDecimalSeparator(buffer: string): string {
  if (buffer.includes(',')) return buffer
  if (buffer === '') return '0,'
  return buffer + ','
}

export function backspace(buffer: string): string {
  return buffer.slice(0, -1)
}

export function parseAmountBuffer(buffer: string): number {
  if (!buffer) return 0
  const normalized = buffer.replace(',', '.')
  const value = Number.parseFloat(normalized)
  return Number.isFinite(value) ? value : 0
}

export function displayAmountBuffer(buffer: string): string {
  return buffer === '' ? '0' : buffer
}
