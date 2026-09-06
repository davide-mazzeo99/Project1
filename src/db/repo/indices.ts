import { db } from '@/db/db'
import { makeId } from '@/lib/id'
import { todayIso } from '@/lib/format'
import { fetchIndexQuote } from '@/lib/prices/fetchPrices'
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
  { name: 'CAC 40 (Francia)', ticker: 'CAC', region: 'mondo' },
  { name: 'FTSE 100 (Regno Unito)', ticker: 'UKX', region: 'mondo' },
  { name: 'Euro Stoxx 50', ticker: 'STOXX50E', region: 'mondo' },
  { name: 'Nikkei 225 (Giappone)', ticker: 'N225', region: 'mondo' },
  { name: 'Hang Seng (Hong Kong)', ticker: 'HSI', region: 'mondo' },
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
}

/** Aggiorna i prezzi di tutti gli indici da Twelve Data, best-effort: nessuna chiave = nessun aggiornamento. */
export async function refreshIndexPrices(apiKey: string | undefined): Promise<RefreshIndicesResult> {
  if (!apiKey) return { updated: 0, failed: 0 }
  const indices = await db.marketIndices.toArray()
  let updated = 0
  let failed = 0

  await Promise.all(
    indices.map(async (index) => {
      const result = await fetchIndexQuote(index.ticker, apiKey)
      if (!result) {
        failed++
        return
      }
      await db.marketIndices.update(index.id, {
        currentPrice: result.price,
        changePercent: result.changePercent,
        lastPriceUpdate: todayIso(),
      })
      updated++
    }),
  )

  return { updated, failed }
}
