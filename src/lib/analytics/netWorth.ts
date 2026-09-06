import type { Account, PortfolioSnapshot, Transaction } from '@/types'

export interface NetWorthPoint {
  month: string
  liquidity: number
  portfolio: number
  netWorth: number
}

/**
 * Cumulative liquidity (running balance of checking accounts) plus portfolio value at each
 * month-end. Portfolio value carries forward the last known snapshot (0 until one exists).
 */
export function buildNetWorthSeries(
  transactions: Transaction[],
  accounts: Account[],
  months: string[],
  portfolioSnapshots: PortfolioSnapshot[],
): NetWorthPoint[] {
  const checkingAccountIds = new Set(accounts.filter((a) => a.type === 'checking').map((a) => a.id))
  const checkingTx = transactions
    .filter((t) => checkingAccountIds.has(t.accountId))
    .sort((a, b) => a.date.localeCompare(b.date))

  const snapshotByMonth = new Map<string, number>()
  for (const s of [...portfolioSnapshots].sort((a, b) => a.date.localeCompare(b.date))) {
    snapshotByMonth.set(s.date.slice(0, 7), s.totalValue)
  }

  let txPointer = 0
  let liquidity = 0
  let lastPortfolioValue = 0
  const points: NetWorthPoint[] = []

  for (const month of months) {
    const monthEndExclusive = nextMonthKey(month)
    while (txPointer < checkingTx.length && checkingTx[txPointer].date < `${monthEndExclusive}-01`) {
      liquidity += checkingTx[txPointer].amount
      txPointer++
    }
    if (snapshotByMonth.has(month)) lastPortfolioValue = snapshotByMonth.get(month)!
    points.push({ month, liquidity, portfolio: lastPortfolioValue, netWorth: liquidity + lastPortfolioValue })
  }

  return points
}

function nextMonthKey(month: string): string {
  const [year, m] = month.split('-').map(Number)
  const nextMonth = m === 12 ? 1 : m + 1
  const nextYear = m === 12 ? year + 1 : year
  return `${nextYear}-${String(nextMonth).padStart(2, '0')}`
}
