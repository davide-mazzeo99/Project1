import { db } from '@/db/db'
import { makeId } from '@/lib/id'
import { todayIso } from '@/lib/format'
import { fetchIndexQuote, runTwelveDataBatched } from '@/lib/prices/fetchPrices'
import type { MarketIndex } from '@/types'

/**
 * Simboli Twelve Data comuni per i principali indici italiani e mondiali. Sono un punto di
 * partenza ragionevole ma non garantiti: se uno non si aggiorna, il ticker resta modificabile
 * a mano dalla pagina Mercati, come per le posizioni del Portafoglio.
 */
const DEFAULT_INDICES: Array<Pick<MarketIndex, 'name' | 'ticker' | 'region'>> = [
  { name: 'FTSE MIB', ticker: 'FTSEMIB', region: 'italia' },
  { name: 'S&P 500', ticker: 'SPX', region: 'mondo' },
  { name: 'Dow Jones', ticker: 'DJI', region: 'mondo' },
  { name: 'Nasdaq Composite', ticker: 'IXIC', region: 'mondo' },
  { name: 'DAX (Germania)', ticker: 'DAX', region: 'mondo' },
  { name: 'FTSE 100 (Regno Unito)', ticker: 'UKX', region: 'mondo' },
  { name: 'Euro Stoxx 50', ticker: 'STOXX50E', region: 'mondo' },
  { name: 'Nikkei 225 (Giappone)', ticker: 'N225', region: 'mondo' },
]

/**
 * Crea la lista di indici di default alla prima apertura della pagina Mercati. La transazione
 * serializza il check-e-scrivi contro chiamate concorrenti (es. React StrictMode che monta due
 * volte in sviluppo, o due tab aperte sulla stessa app), altrimenti entrambe leggerebbero
 * "count=0" prima che la prima scrittura sia commit, duplicando i default.
 */
export async function ensureDefaultIndices(): Promise<void> {
  await db.transaction('rw', db.marketIndices, async () => {
    const count = await db.marketIndices.count()
    if (count > 0) return
    const rows: MarketIndex[] = DEFAULT_INDICES.map((def) => ({
      id: makeId(),
      ...def,
      currentPrice: null,
      changePercent: null,
    }))
    await db.marketIndices.bulkAdd(rows)
  })
}

export async function listIndices(): Promise<MarketIndex[]> {
  return db.marketIndices.toArray()
}

export async function updateIndexTicker(id: string, ticker: string): Promise<void> {
  await db.marketIndices.update(id, { ticker: ticker.trim(), currentPrice: null, changePercent: null })
}

export async function addIndex(input: Pick<MarketIndex, 'name' | 'ticker' | 'region'>): Promise<MarketIndex> {
  const index: MarketIndex = { id: makeId(), ...input, currentPrice: null, changePercent: null }
  await db.marketIndices.add(index)
  return index
}

export async function deleteIndex(id: string): Promise<void> {
  await db.marketIndices.delete(id)
}

export interface RefreshIndicesResult {
  updated: number
  failed: number
  /** Di quanti `failed` la causa è certa: limite di richieste al minuto di Twelve Data raggiunto. */
  rateLimited: number
  /** Di quanti `failed` la causa è certa: la API key Twelve Data non è valida. */
  invalidKey: number
}

/**
 * Aggiorna i prezzi di tutti gli indici da Twelve Data, best-effort: nessuna chiave = nessun
 * aggiornamento. Il piano gratuito di Twelve Data permette solo 8 richieste al minuto, quindi
 * gli indici vengono interrogati a gruppi di 8 (istantaneo se sono 8 o meno) con una pausa fra
 * un gruppo e l'altro solo se ce ne sono altri — richiederli tutti in parallelo faceva fallire
 * ogni singola richiesta, cosa che sembrava un ticker sbagliato ma non lo era.
 */
export async function refreshIndexPrices(apiKey: string | undefined): Promise<RefreshIndicesResult> {
  if (!apiKey) return { updated: 0, failed: 0, rateLimited: 0, invalidKey: 0 }
  const indices = await db.marketIndices.toArray()
  let updated = 0
  let failed = 0
  let rateLimited = 0
  let invalidKey = 0

  await runTwelveDataBatched(indices, async (index) => {
    const outcome = await fetchIndexQuote(index.ticker, apiKey)
    if (!outcome.ok) {
      failed++
      if (outcome.reason === 'rate_limited') rateLimited++
      if (outcome.reason === 'invalid_key') invalidKey++
    } else {
      await db.marketIndices.update(index.id, {
        currentPrice: outcome.value.price,
        changePercent: outcome.value.changePercent,
        lastPriceUpdate: todayIso(),
      })
      updated++
    }
  })

  return { updated, failed, rateLimited, invalidKey }
}
