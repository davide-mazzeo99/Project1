import type { Person, Transaction } from '@/types'

/** Sum of what other people owe on this transaction (0 if it's not split). */
export function splitOwedTotal(t: Transaction): number {
  return (t.splits ?? []).reduce((sum, s) => sum + s.amount, 0)
}

/**
 * The portion of a transaction's amount that's actually "mine" once other people's shares
 * are excluded — this is what should count toward personal spending stats (dashboard,
 * budget), as opposed to `transaction.amount`, which is the real bank movement and stays
 * unchanged for account-balance purposes.
 */
export function personalAmount(t: Transaction): number {
  if (!t.splits || t.splits.length === 0) return t.amount
  return t.amount + splitOwedTotal(t)
}

export interface PersonBalanceEntry {
  transaction: Transaction
  split: NonNullable<Transaction['splits']>[number]
}

export interface PersonBalance {
  person: Person
  /** Sum of shares not yet marked as settled. */
  totalOwed: number
  settledTotal: number
  entries: PersonBalanceEntry[]
}

export function computePersonBalances(transactions: Transaction[], people: Person[]): PersonBalance[] {
  return people.map((person) => {
    const entries: PersonBalanceEntry[] = []
    let totalOwed = 0
    let settledTotal = 0
    for (const t of transactions) {
      const split = t.splits?.find((s) => s.personId === person.id)
      if (!split) continue
      entries.push({ transaction: t, split })
      if (split.settled) settledTotal += split.amount
      else totalOwed += split.amount
    }
    entries.sort((a, b) => b.transaction.date.localeCompare(a.transaction.date))
    return { person, totalOwed, settledTotal, entries }
  })
}
