/** Normalizes a description for hashing: lowercase, collapse whitespace, strip punctuation noise. */
function normalizeDescription(description: string): string {
  return description
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Simple deterministic 32-bit hash (FNV-1a), stringified as hex — no crypto API dependency. */
function fnv1a(input: string): string {
  let hash = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return (hash >>> 0).toString(16).padStart(8, '0')
}

/** Builds a dedup key from date + amount + normalized description, scoped to an account. */
export function computeImportHash(accountId: string, date: string, amount: number, description: string): string {
  const normalized = normalizeDescription(description)
  const amountKey = amount.toFixed(2)
  return fnv1a(`${accountId}|${date}|${amountKey}|${normalized}`)
}
