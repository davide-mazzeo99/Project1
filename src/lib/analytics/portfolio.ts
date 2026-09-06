import type { Holding } from '@/types'

export interface HoldingMetrics {
  holding: Holding
  value: number
  cost: number
  pl: number
  plPercent: number
  weight: number
}

export interface PortfolioSummary {
  totalValue: number
  totalCost: number
  totalPl: number
  totalPlPercent: number
  holdings: HoldingMetrics[]
}

export function computePortfolioSummary(holdings: Holding[]): PortfolioSummary {
  const totalValue = holdings.reduce((s, h) => s + h.quantity * h.currentPrice, 0)
  const totalCost = holdings.reduce((s, h) => s + h.quantity * h.avgCost, 0)
  const totalPl = totalValue - totalCost
  const totalPlPercent = totalCost > 0 ? totalPl / totalCost : 0

  const metrics: HoldingMetrics[] = holdings.map((h) => {
    const value = h.quantity * h.currentPrice
    const cost = h.quantity * h.avgCost
    const pl = value - cost
    return {
      holding: h,
      value,
      cost,
      pl,
      plPercent: cost > 0 ? pl / cost : 0,
      weight: totalValue > 0 ? value / totalValue : 0,
    }
  })

  metrics.sort((a, b) => b.value - a.value)

  return { totalValue, totalCost, totalPl, totalPlPercent, holdings: metrics }
}
