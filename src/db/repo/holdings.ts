import { db } from '@/db/db'
import { makeId } from '@/lib/id'
import { todayIso } from '@/lib/format'
import { computePortfolioSummary } from '@/lib/analytics/portfolio'
import { fetchCryptoPrice, fetchSecurityPrice, runTwelveDataBatched } from '@/lib/prices/fetchPrices'
import type { Holding } from '@/types'

export async function addHolding(input: Omit<Holding, 'id' | 'lastPriceUpdate'>): Promise<Holding> {
  const holding: Holding = { ...input, id: makeId(), lastPriceUpdate: todayIso() }
  await db.holdings.add(holding)
  return holding
}

export async function updateHolding(id: string, changes: Partial<Holding>): Promise<void> {
  await db.holdings.update(id, changes)
}

export async function deleteHolding(id: string): Promise<void> {
  await db.holdings.delete(id)
}

export async function updatePrice(id: string, price: number): Promise<void> {
  await db.holdings.update(id, { currentPrice: price, lastPriceUpdate: todayIso() })
}

export interface RefreshResult {
  updated: number
  failed: number
  /** Di quanti `failed` la causa è certa: manca la API key Twelve Data richiesta per azioni/obbligazionari. */
  missingApiKey: number
  /** Di quanti `failed` la causa è certa: limite di richieste al minuto di Twelve Data raggiunto. */
  rateLimited: number
  /** Di quanti `failed` la causa è certa: la API key Twelve Data non è valida. */
  invalidKey: number
}

/**
 * Refreshes every holding's price from the market, best-effort: crypto via CoinGecko
 * (works without a key for light usage, more reliable with the optional `coinGeckoApiKey`,
 * looked up in parallel — CoinGecko's limits are much looser), securities/bonds via Twelve
 * Data (needs `apiKey`, skipped as `missingApiKey` if absent). Twelve Data's free plan allows
 * only 8 requests/minute, so those are looked up in batches of 8 (instant for 8 or fewer
 * holdings) with a cooldown between batches only when there are more — firing them all in
 * parallel used to make every single one fail, which looked exactly like a bad ticker. Never
 * throws — offline or unrecognised holdings just keep their last price.
 */
export async function refreshHoldingPrices(apiKey: string | undefined, coinGeckoApiKey?: string): Promise<RefreshResult> {
  const holdings = await db.holdings.toArray()
  let updated = 0
  let failed = 0
  let missingApiKey = 0
  let rateLimited = 0
  let invalidKey = 0

  const cryptoHoldings = holdings.filter((h) => h.assetType === 'crypto')
  const marketHoldings = holdings.filter((h) => h.assetType !== 'crypto' && h.assetType !== 'accumulation')

  await Promise.all(
    cryptoHoldings.map(async (holding) => {
      const query = holding.ticker?.trim() || holding.name.trim()
      if (!query) {
        failed++
        return
      }
      const result = await fetchCryptoPrice(query, holding.coinGeckoId, coinGeckoApiKey)
      if (!result) {
        failed++
        return
      }
      await db.holdings.update(holding.id, {
        currentPrice: result.price,
        coinGeckoId: result.coinGeckoId,
        lastPriceUpdate: todayIso(),
        priceIsLive: true,
      })
      updated++
    }),
  )

  await runTwelveDataBatched(marketHoldings, async (holding) => {
    const query = holding.ticker?.trim() || holding.name.trim()
    if (!query) {
      failed++
      return
    }
    if (!apiKey) {
      failed++
      missingApiKey++
      return
    }
    const outcome = await fetchSecurityPrice(query, apiKey)
    if (!outcome.ok) {
      failed++
      if (outcome.reason === 'rate_limited') rateLimited++
      if (outcome.reason === 'invalid_key') invalidKey++
    } else {
      await db.holdings.update(holding.id, {
        currentPrice: outcome.value,
        lastPriceUpdate: todayIso(),
        priceIsLive: true,
      })
      updated++
    }
  })

  return { updated, failed, missingApiKey, rateLimited, invalidKey }
}

/** Creates a snapshot for the current month if one doesn't already exist. */
export async function ensureMonthlySnapshot(): Promise<void> {
  const month = todayIso().slice(0, 7)
  const existing = await db.portfolioSnapshots.where('date').startsWith(month).count()
  if (existing > 0) return

  const holdings = await db.holdings.toArray()
  if (holdings.length === 0) return

  const { totalValue, totalCost } = computePortfolioSummary(holdings)
  await db.portfolioSnapshots.add({
    id: makeId(),
    date: todayIso(),
    totalValue,
    totalInvested: totalCost,
  })
}
