import { db } from '@/db/db'
import { makeId } from '@/lib/id'
import { todayIso } from '@/lib/format'
import { SANTANDER_ACCOUNT_ID, TRADE_REPUBLIC_ACCOUNT_ID } from '@/db/bootstrap'
import type { Transaction } from '@/types'

export type NewTransactionInput = Omit<
  Transaction,
  'id' | 'createdAt' | 'updatedAt' | 'rawDescription' | 'importHash' | 'tags'
> &
  Partial<Pick<Transaction, 'tags' | 'rawDescription' | 'importHash'>>

export async function addTransaction(input: NewTransactionInput): Promise<Transaction> {
  const now = Date.now()
  const tx: Transaction = {
    id: makeId(),
    tags: [],
    rawDescription: input.description,
    importHash: null,
    ...input,
    createdAt: now,
    updatedAt: now,
  }
  await db.transactions.add(tx)
  return tx
}

export async function updateTransaction(id: string, changes: Partial<Transaction>): Promise<void> {
  await db.transactions.update(id, { ...changes, updatedAt: Date.now() })
}

export async function deleteTransaction(id: string): Promise<void> {
  await db.transactions.delete(id)
}

export async function duplicateTransaction(id: string): Promise<Transaction | undefined> {
  const original = await db.transactions.get(id)
  if (!original) return undefined
  const now = Date.now()
  const copy: Transaction = {
    ...original,
    id: makeId(),
    date: todayIso(),
    importHash: null,
    createdAt: now,
    updatedAt: now,
  }
  await db.transactions.add(copy)
  return copy
}

export async function bulkSetCategory(ids: string[], categoryId: string): Promise<void> {
  const now = Date.now()
  await db.transaction('rw', db.transactions, async () => {
    for (const id of ids) {
      await db.transactions.update(id, { categoryId, updatedAt: now })
    }
  })
}

/**
 * "Trasferimenti" always means a movement of money from Santander (checking) to
 * Trade Republic (brokerage) in this app: creates the matching pair of linked
 * transactions in one go, instead of the usual single-account entry.
 */
export async function createSantanderToTradeRepublicTransfer(input: {
  amount: number
  date: string
  categoryId: string
  description?: string
}): Promise<[Transaction, Transaction]> {
  const now = Date.now()
  const outDescription = input.description?.trim() || 'Trasferimento a Trade Republic'
  const inDescription = input.description?.trim() || 'Accredito da Santander'

  const outgoing: Transaction = {
    id: makeId(),
    accountId: SANTANDER_ACCOUNT_ID,
    date: input.date,
    amount: -Math.abs(input.amount),
    description: outDescription,
    rawDescription: outDescription,
    categoryId: input.categoryId,
    isRecurring: false,
    isTransfer: true,
    importHash: null,
    tags: [],
    createdAt: now,
    updatedAt: now,
  }
  const incoming: Transaction = {
    id: makeId(),
    accountId: TRADE_REPUBLIC_ACCOUNT_ID,
    date: input.date,
    amount: Math.abs(input.amount),
    description: inDescription,
    rawDescription: inDescription,
    categoryId: input.categoryId,
    isRecurring: false,
    isTransfer: true,
    importHash: null,
    tags: [],
    createdAt: now,
    updatedAt: now,
  }

  await db.transactions.bulkAdd([outgoing, incoming])
  return [outgoing, incoming]
}
