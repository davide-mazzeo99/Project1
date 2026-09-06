import { db } from '@/db/db'
import { makeId } from '@/lib/id'
import { findMatchingCategory } from '@/lib/rules/engine'
import type { MatchType, Rule } from '@/types'

export async function listRules(): Promise<Rule[]> {
  return db.rules.orderBy('priority').toArray()
}

export async function createRule(input: { matchType: MatchType; pattern: string; categoryId: string }): Promise<Rule> {
  const count = await db.rules.count()
  const rule: Rule = {
    id: makeId(),
    matchType: input.matchType,
    pattern: input.pattern,
    categoryId: input.categoryId,
    priority: count,
    createdAt: Date.now(),
  }
  await db.rules.add(rule)
  return rule
}

export async function deleteRule(id: string): Promise<void> {
  await db.rules.delete(id)
}

/** Scans all uncategorized transactions and applies the first matching rule to each. Returns how many were categorized. */
export async function applyRulesToUncategorized(): Promise<number> {
  const [rules, uncategorized] = await Promise.all([
    db.rules.toArray(),
    db.transactions.filter((t) => !t.categoryId).toArray(),
  ])
  if (rules.length === 0 || uncategorized.length === 0) return 0

  let count = 0
  const now = Date.now()
  await db.transaction('rw', db.transactions, async () => {
    for (const tx of uncategorized) {
      const categoryId = findMatchingCategory(rules, tx.description)
      if (categoryId) {
        await db.transactions.update(tx.id, { categoryId, updatedAt: now })
        count++
      }
    }
  })
  return count
}
