import { computeAccountBalanceFor } from '@/lib/analytics/accountBalance'
import type { Account, PortfolioSnapshot, Transaction } from '@/types'

export interface NetWorthPoint {
  month: string
  liquidity: number
  portfolio: number
  netWorth: number
}

/**
 * Cumulative liquidity (opening balances + running balance of every account, checking and
 * brokerage alike — e.g. uninvested cash sitting on Trade Republic still counts) plus
 * portfolio value at each month-end. Portfolio value carries forward the last known
 * snapshot (0 until one exists).
 */
export function buildNetWorthSeries(
  transactions: Transaction[],
  accounts: Account[],
  months: string[],
  portfolioSnapshots: PortfolioSnapshot[],
): NetWorthPoint[] {
  const allTx = [...transactions].sort((a, b) => a.date.localeCompare(b.date))
  const openingBalanceTotal = accounts.reduce((sum, a) => sum + (a.openingBalance ?? 0), 0)

  const snapshotByMonth = new Map<string, number>()
  for (const s of [...portfolioSnapshots].sort((a, b) => a.date.localeCompare(b.date))) {
    snapshotByMonth.set(s.date.slice(0, 7), s.totalValue)
  }

  let txPointer = 0
  let liquidity = openingBalanceTotal
  let lastPortfolioValue = 0
  const points: NetWorthPoint[] = []

  for (const month of months) {
    const monthEndExclusive = nextMonthKey(month)
    while (txPointer < allTx.length && allTx[txPointer].date < `${monthEndExclusive}-01`) {
      liquidity += allTx[txPointer].amount
      txPointer++
    }
    if (snapshotByMonth.has(month)) lastPortfolioValue = snapshotByMonth.get(month)!
    points.push({ month, liquidity, portfolio: lastPortfolioValue, netWorth: liquidity + lastPortfolioValue })
  }

  return points
}

export interface NetWorthBreakdown {
  perAccount: { account: Account; balance: number }[]
  liquidityTotal: number
  portfolioValue: number
  total: number
}

/** Current net worth: every account's balance (opening balance + transactions) plus the live portfolio value. */
export function computeCurrentNetWorth(
  accounts: Account[],
  transactions: Transaction[],
  portfolioValue: number,
): NetWorthBreakdown {
  const perAccount = accounts.map((account) => ({
    account,
    balance: computeAccountBalanceFor(transactions, account),
  }))
  const liquidityTotal = perAccount.reduce((sum, a) => sum + a.balance, 0)
  return { perAccount, liquidityTotal, portfolioValue, total: liquidityTotal + portfolioValue }
}

function nextMonthKey(month: string): string {
  const [year, m] = month.split('-').map(Number)
  const nextMonth = m === 12 ? 1 : m + 1
  const nextYear = m === 12 ? year + 1 : year
  return `${nextYear}-${String(nextMonth).padStart(2, '0')}`
}
