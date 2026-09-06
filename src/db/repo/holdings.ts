import { db } from '@/db/db'
import { makeId } from '@/lib/id'
import { todayIso } from '@/lib/format'
import { computePortfolioSummary } from '@/lib/analytics/portfolio'
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
