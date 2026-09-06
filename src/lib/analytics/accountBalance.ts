import type { Account, Transaction } from '@/types'

/**
 * Running balance of an account: its opening balance (money already there before
 * tracking started) plus every transaction that belongs to it (transfers included,
 * since they're real money movements).
 */
export function computeAccountBalance(transactions: Transaction[], accountId: string, openingBalance = 0): number {
  return (
    openingBalance + transactions.filter((t) => t.accountId === accountId).reduce((sum, t) => sum + t.amount, 0)
  )
}

export function computeAccountBalanceFor(transactions: Transaction[], account: Account): number {
  return computeAccountBalance(transactions, account.id, account.openingBalance ?? 0)
}
