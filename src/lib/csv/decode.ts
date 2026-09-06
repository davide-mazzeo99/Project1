export type DetectedEncoding = 'utf-8' | 'iso-8859-1'

/**
 * Reads a File's bytes and decodes as UTF-8 when valid, otherwise falls back
 * to ISO-8859-1 (Latin-1 / Windows-1252-compatible for our purposes).
 */
export async function decodeFileText(file: File): Promise<{ text: string; encoding: DetectedEncoding }> {
  const buffer = await file.arrayBuffer()

  try {
    const utf8Decoder = new TextDecoder('utf-8', { fatal: true })
    const text = utf8Decoder.decode(buffer)
    // Reject if it decoded "successfully" but contains the UTF-8 replacement
    // character pattern typical of a mis-decoded Latin-1 file (rare with fatal:true, kept as a safety net).
    if (!text.includes('�')) {
      return { text: stripBom(text), encoding: 'utf-8' }
    }
  } catch {
    // fall through to Latin-1
  }

  const latin1Decoder = new TextDecoder('iso-8859-1')
  return { text: stripBom(latin1Decoder.decode(buffer)), encoding: 'iso-8859-1' }
}

function stripBom(text: string): string {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text
}

export function decodeTextWith(buffer: ArrayBuffer, encoding: DetectedEncoding): string {
  const decoder = new TextDecoder(encoding)
  return stripBom(decoder.decode(buffer))
}
