import { db } from '@/db/db'
import { makeId } from '@/lib/id'
import { shiftMonth } from '@/lib/analytics/stats'
import type { Budget } from '@/types'

export async function listBudgetsForMonth(month: string): Promise<Budget[]> {
  return db.budgets.where('month').equals(month).toArray()
}

export async function upsertBudget(month: string, categoryId: string, amount: number): Promise<void> {
  const existing = await db.budgets.where('[month+categoryId]').equals([month, categoryId]).first()
  if (existing) {
    await db.budgets.update(existing.id, { amount })
  } else {
    await db.budgets.add({ id: makeId(), month, categoryId, amount })
  }
}

export async function deleteBudget(id: string): Promise<void> {
  await db.budgets.delete(id)
}

/** Copies every budget from the previous month into `month`, skipping categories that already have one. */
export async function copyFromPreviousMonth(month: string): Promise<number> {
  const previous = shiftMonth(month, -1)
  const [previousBudgets, currentBudgets] = await Promise.all([
    listBudgetsForMonth(previous),
    listBudgetsForMonth(month),
  ])
  const existingCategoryIds = new Set(currentBudgets.map((b) => b.categoryId))
  const toCopy = previousBudgets.filter((b) => !existingCategoryIds.has(b.categoryId))
  if (toCopy.length === 0) return 0

  await db.budgets.bulkAdd(toCopy.map((b) => ({ id: makeId(), month, categoryId: b.categoryId, amount: b.amount })))
  return toCopy.length
}

/**
 * Ensures every fixed category (e.g. Affitto, Abbonamenti) has a budget row for `month`,
 * pre-filled from the most recent known budget for that category, or its default monthlyBudget.
 */
export async function ensureFixedCategoryBudgets(month: string): Promise<void> {
  const [fixedCategories, currentBudgets, allBudgets] = await Promise.all([
    db.categories.filter((c) => c.isFixed).toArray(),
    listBudgetsForMonth(month),
    db.budgets.orderBy('month').reverse().toArray(),
  ])
  const existingCategoryIds = new Set(currentBudgets.map((b) => b.categoryId))
  const missing = fixedCategories.filter((c) => !existingCategoryIds.has(c.id))
  if (missing.length === 0) return

  const toAdd: Budget[] = []
  for (const category of missing) {
    const lastKnown = allBudgets.find((b) => b.categoryId === category.id && b.month < month)
    const amount = lastKnown?.amount ?? category.monthlyBudget
    if (amount) {
      toAdd.push({ id: makeId(), month, categoryId: category.id, amount })
    }
  }
  if (toAdd.length > 0) await db.budgets.bulkAdd(toAdd)
}
