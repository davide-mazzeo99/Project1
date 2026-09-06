import type { Budget, Category } from '@/types'

export interface BudgetProgress {
  categoryId: string
  category: Category
  budget: number
  spent: number
  ratio: number
  status: 'ok' | 'warning' | 'over'
}

/** Explicit per-month budget row wins; falls back to the category's default monthlyBudget. */
export function getEffectiveBudget(categoryId: string, month: string, budgets: Budget[], category: Category | undefined): number | undefined {
  const explicit = budgets.find((b) => b.categoryId === categoryId && b.month === month)
  if (explicit) return explicit.amount
  return category?.monthlyBudget
}

export function buildBudgetProgress(
  categoryTotals: Map<string, number>,
  categories: Category[],
  budgets: Budget[],
  month: string,
): BudgetProgress[] {
  const categoryById = new Map(categories.map((c) => [c.id, c]))
  const categoryIds = new Set([
    ...categories.filter((c) => c.type === 'expense' && (c.monthlyBudget || budgets.some((b) => b.categoryId === c.id && b.month === month))).map((c) => c.id),
  ])

  const results: BudgetProgress[] = []
  for (const categoryId of categoryIds) {
    const category = categoryById.get(categoryId)
    if (!category) continue
    const budget = getEffectiveBudget(categoryId, month, budgets, category)
    if (!budget) continue
    const spent = categoryTotals.get(categoryId) ?? 0
    const ratio = budget > 0 ? spent / budget : 0
    const status: BudgetProgress['status'] = ratio >= 1 ? 'over' : ratio >= 0.8 ? 'warning' : 'ok'
    results.push({ categoryId, category, budget, spent, ratio, status })
  }
  return results.sort((a, b) => b.ratio - a.ratio)
}
