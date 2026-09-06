import { addMonths, format, parseISO, subMonths } from 'date-fns'
import type { Category, Transaction } from '@/types'

export const RENT_CATEGORY_ID = 'cat-affitto'
export const UNCATEGORIZED_KEY = 'uncategorized'

export interface MonthlyStats {
  month: string
  income: number
  expenses: number
  investments: number
  transfers: number
  savings: number
  savingsRate: number
  rentAmount: number
  rentRatio: number
  /** Absolute expense total per categoryId (or 'uncategorized'), expense-classified transactions only. */
  categoryTotals: Map<string, number>
  transactionCount: number
}

function isTransferLike(t: Transaction, category: Category | undefined): boolean {
  return t.isTransfer || category?.type === 'transfer'
}

/** True for transactions that count as "real" spending: not income, not a transfer, not an investment. */
export function isRealExpense(t: Transaction, category: Category | undefined): boolean {
  return t.amount < 0 && !isTransferLike(t, category) && category?.type !== 'investment'
}

/** Per-day total of real expenses (absolute value) for the given month, keyed by ISO date. */
export function buildDailyExpenseTotals(
  transactions: Transaction[],
  categoryById: Map<string, Category>,
  month: string,
): Map<string, number> {
  const totals = new Map<string, number>()
  for (const t of transactions) {
    if (!t.date.startsWith(month)) continue
    const category = t.categoryId ? categoryById.get(t.categoryId) : undefined
    if (!isRealExpense(t, category)) continue
    totals.set(t.date, (totals.get(t.date) ?? 0) + Math.abs(t.amount))
  }
  return totals
}

export function computeMonthlyStats(
  transactions: Transaction[],
  categoryById: Map<string, Category>,
  month: string,
): MonthlyStats {
  const monthTx = transactions.filter((t) => t.date.startsWith(month))

  let income = 0
  let expenses = 0
  let investments = 0
  let transfers = 0
  let rentAmount = 0
  const categoryTotals = new Map<string, number>()

  for (const t of monthTx) {
    const category = t.categoryId ? categoryById.get(t.categoryId) : undefined

    if (isTransferLike(t, category)) {
      transfers += Math.abs(t.amount)
      continue
    }
    if (category?.type === 'investment') {
      investments += Math.abs(t.amount)
      continue
    }
    if (t.amount > 0) {
      income += t.amount
      continue
    }

    const absAmount = Math.abs(t.amount)
    expenses += absAmount
    const key = category?.id ?? UNCATEGORIZED_KEY
    categoryTotals.set(key, (categoryTotals.get(key) ?? 0) + absAmount)
    if (category?.id === RENT_CATEGORY_ID) rentAmount += absAmount
  }

  const savings = income - expenses
  const savingsRate = income > 0 ? savings / income : 0
  const rentRatio = income > 0 ? rentAmount / income : 0

  return {
    month,
    income,
    expenses,
    investments,
    transfers,
    savings,
    savingsRate,
    rentAmount,
    rentRatio,
    categoryTotals,
    transactionCount: monthTx.length,
  }
}

/** Returns the last `count` YYYY-MM month keys, ascending, ending at `endMonth` (defaults to current month). */
export function lastMonths(count: number, endMonth?: string): string[] {
  const end = endMonth ? parseISO(`${endMonth}-01`) : new Date()
  const months: string[] = []
  for (let i = count - 1; i >= 0; i--) {
    months.push(format(subMonths(end, i), 'yyyy-MM'))
  }
  return months
}

export function shiftMonth(month: string, delta: number): string {
  const date = parseISO(`${month}-01`)
  return format(delta >= 0 ? addMonths(date, delta) : subMonths(date, -delta), 'yyyy-MM')
}

export function buildMonthlySeries(
  transactions: Transaction[],
  categoryById: Map<string, Category>,
  months: string[],
): MonthlyStats[] {
  return months.map((m) => computeMonthlyStats(transactions, categoryById, m))
}

export function average(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((s, v) => s + v, 0) / values.length
}

export interface SpendingPace {
  status: 'ahead' | 'ontrack' | 'behind'
  expectedSoFar: number
  spentSoFar: number
  diff: number
}

/**
 * Compares month-to-date spending against a linear pace toward `referenceMonthlyAmount`
 * (a budget total or a historical average). "ahead" = spending faster than expected.
 */
export function computeSpendingPace(
  spentSoFar: number,
  referenceMonthlyAmount: number,
  daysElapsed: number,
  daysInMonth: number,
): SpendingPace | null {
  if (referenceMonthlyAmount <= 0 || daysInMonth <= 0) return null
  const expectedSoFar = referenceMonthlyAmount * (daysElapsed / daysInMonth)
  const diff = spentSoFar - expectedSoFar
  const tolerance = referenceMonthlyAmount * 0.05
  const status: SpendingPace['status'] = diff > tolerance ? 'ahead' : diff < -tolerance ? 'behind' : 'ontrack'
  return { status, expectedSoFar, spentSoFar, diff }
}
