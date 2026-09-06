import type { Transaction } from '@/types'

/** Running balance of an account: sum of every transaction that belongs to it (transfers included, since they're real money movements). */
export function computeAccountBalance(transactions: Transaction[], accountId: string): number {
  return transactions.filter((t) => t.accountId === accountId).reduce((sum, t) => sum + t.amount, 0)
}
