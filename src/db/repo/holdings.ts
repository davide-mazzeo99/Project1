import { db } from '@/db/db'
import { makeId } from '@/lib/id'
import { todayIso } from '@/lib/format'
import { computePortfolioSummary } from '@/lib/analytics/portfolio'
import { fetchCryptoPrice, fetchSecurityPrice } from '@/lib/prices/fetchPrices'
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
}

/**
 * Refreshes every holding's price from the market, best-effort: crypto via CoinGecko
 * (works without a key for light usage, more reliable with the optional `coinGeckoApiKey`),
 * securities/bonds via Twelve Data (needs `apiKey`, skipped as `missingApiKey` if absent).
 * Never throws — offline, rate-limited or unrecognised holdings just keep their last price.
 */
export async function refreshHoldingPrices(apiKey: string | undefined, coinGeckoApiKey?: string): Promise<RefreshResult> {
  const holdings = await db.holdings.toArray()
  let updated = 0
  let failed = 0
  let missingApiKey = 0

  await Promise.all(
    holdings.map(async (holding) => {
      if (holding.assetType === 'accumulation') return

      const isCrypto = holding.assetType === 'crypto'
      const query = holding.ticker?.trim() || holding.name.trim()
      if (!query) {
        failed++
        return
      }

      if (isCrypto) {
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
        return
      }

      if (!apiKey) {
        failed++
        missingApiKey++
        return
      }
      const price = await fetchSecurityPrice(query, apiKey)
      if (price === null) {
        failed++
        return
      }
      await db.holdings.update(holding.id, {
        currentPrice: price,
        lastPriceUpdate: todayIso(),
        priceIsLive: true,
      })
      updated++
    }),
  )

  return { updated, failed, missingApiKey }
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
