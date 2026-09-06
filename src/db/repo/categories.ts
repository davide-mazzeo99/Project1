import { db } from '@/db/db'
import { makeId } from '@/lib/id'
import type { Category } from '@/types'

export async function addCategory(input: Omit<Category, 'id' | 'isDefault'>): Promise<Category> {
  const category: Category = { ...input, id: makeId(), isDefault: false }
  await db.categories.add(category)
  return category
}

export async function updateCategory(id: string, changes: Partial<Category>): Promise<void> {
  await db.categories.update(id, changes)
}

export async function deleteCategory(id: string): Promise<{ ok: true } | { ok: false; reason: string }> {
  const inUse = await db.transactions.where('categoryId').equals(id).count()
  if (inUse > 0) {
    return { ok: false, reason: `Categoria usata da ${inUse} transazioni: riassegnale prima di eliminarla.` }
  }
  const rulesUsing = await db.rules.where('categoryId').equals(id).count()
  await db.transaction('rw', db.categories, db.rules, async () => {
    await db.categories.delete(id)
    if (rulesUsing > 0) {
      const ruleIds = await db.rules.where('categoryId').equals(id).primaryKeys()
      await db.rules.bulkDelete(ruleIds)
    }
  })
  return { ok: true }
}
