import { useEffect, useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { ChevronLeft, ChevronRight, Copy } from 'lucide-react'
import { db } from '@/db/db'
import { CategoryIcon } from '@/lib/icons'
import { formatCurrency, formatMonthLabel, currentMonth as getCurrentMonth } from '@/lib/format'
import { computeMonthlyStats, shiftMonth } from '@/lib/analytics/stats'
import { buildBudgetProgress, getEffectiveBudget } from '@/lib/analytics/budgetProgress'
import { copyFromPreviousMonth, ensureFixedCategoryBudgets, upsertBudget } from '@/db/repo/budgets'
import { useToast } from '@/components/ui/Toast'
import type { Budget, Category, Transaction } from '@/types'

export function BudgetPage() {
  const { showToast } = useToast()
  const [month, setMonth] = useState(getCurrentMonth())

  const categories = useLiveQuery(() => db.categories.toArray(), [], [] as Category[])
  const budgets = useLiveQuery(() => db.budgets.where('month').equals(month).toArray(), [month], [] as Budget[])
  const transactions = useLiveQuery(() => db.transactions.toArray(), [], [] as Transaction[])

  useEffect(() => {
    ensureFixedCategoryBudgets(month)
  }, [month])

  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories])
  const expenseCategories = useMemo(
    () => categories.filter((c) => c.type === 'expense').sort((a, b) => a.name.localeCompare(b.name, 'it')),
    [categories],
  )
  const stats = useMemo(() => computeMonthlyStats(transactions, categoryById, month), [transactions, categoryById, month])
  const progress = useMemo(
    () => buildBudgetProgress(stats.categoryTotals, categories, budgets, month),
    [stats, categories, budgets, month],
  )
  const progressByCategory = useMemo(() => new Map(progress.map((p) => [p.categoryId, p])), [progress])

  const totalBudget = progress.reduce((s, p) => s + p.budget, 0)
  const totalSpent = progress.reduce((s, p) => s + p.spent, 0)

  async function handleCopyPrevious() {
    const count = await copyFromPreviousMonth(month)
    showToast(count > 0 ? `${count} budget copiati dal mese precedente` : 'Nessun nuovo budget da copiare')
  }

  async function handleChangeBudget(categoryId: string, value: string) {
    const amount = Number.parseFloat(value)
    if (!Number.isFinite(amount) || amount < 0) return
    await upsertBudget(month, categoryId, amount)
  }

  return (
    <div className="flex flex-col gap-4 px-4 pb-24 pt-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Budget</h1>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setMonth((m) => shiftMonth(m, -1))}
            className="tap-target flex items-center justify-center rounded-full text-gray-400 active:bg-gray-200 dark:active:bg-gray-800"
            aria-label="Mese precedente"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="min-w-[7.5rem] text-center text-sm font-medium text-gray-600 dark:text-gray-300">
            {formatMonthLabel(`${month}-01`)}
          </span>
          <button
            onClick={() => setMonth((m) => shiftMonth(m, 1))}
            className="tap-target flex items-center justify-center rounded-full text-gray-400 active:bg-gray-200 dark:active:bg-gray-800"
            aria-label="Mese successivo"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-gray-900">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400">Totale budget</p>
            <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{formatCurrency(totalBudget)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">Speso finora</p>
            <p className={`text-lg font-bold ${totalSpent > totalBudget && totalBudget > 0 ? 'text-red-500' : 'text-gray-900 dark:text-gray-100'}`}>
              {formatCurrency(totalSpent)}
            </p>
          </div>
        </div>
        <button
          onClick={handleCopyPrevious}
          className="tap-target mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-gray-100 py-2 text-xs font-semibold text-gray-600 active:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
        >
          <Copy className="h-3.5 w-3.5" /> Copia budget dal mese precedente
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {expenseCategories.map((category) => {
          const p = progressByCategory.get(category.id)
          const budgetValue = getEffectiveBudget(category.id, month, budgets, category)
          const spent = stats.categoryTotals.get(category.id) ?? 0
          const ratio = budgetValue ? spent / budgetValue : 0
          const barColor = !budgetValue
            ? 'bg-gray-200 dark:bg-gray-700'
            : ratio >= 1
              ? 'bg-red-500'
              : ratio >= 0.8
                ? 'bg-amber-500'
                : 'bg-emerald-500'

          return (
            <div key={category.id} className="rounded-2xl bg-white p-3.5 shadow-sm dark:bg-gray-900">
              <div className="flex items-center gap-2.5">
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white"
                  style={{ backgroundColor: category.color }}
                >
                  <CategoryIcon name={category.icon} className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                  {category.name}
                  {category.isFixed && <span className="ml-1.5 text-[10px] text-gray-400">fissa</span>}
                </span>
                <span className="shrink-0 text-xs text-gray-400">{formatCurrency(spent)} speso</span>
              </div>

              <div className="mt-2 flex items-center gap-2">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                  <div className={`h-full rounded-full ${barColor}`} style={{ width: `${Math.min(100, ratio * 100)}%` }} />
                </div>
                <div className="flex shrink-0 items-center gap-1 text-sm">
                  <input
                    type="number"
                    inputMode="decimal"
                    defaultValue={budgetValue ?? ''}
                    onBlur={(e) => handleChangeBudget(category.id, e.target.value)}
                    placeholder="0"
                    className="w-16 rounded-lg border border-gray-200 bg-white px-2 py-1 text-right text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                  />
                  <span className="text-gray-400">€</span>
                </div>
              </div>

              {p?.status === 'over' && (
                <p className="mt-1.5 text-[11px] font-medium text-red-500">Budget superato</p>
              )}
              {p?.status === 'warning' && (
                <p className="mt-1.5 text-[11px] font-medium text-amber-500">Ti stai avvicinando al limite</p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
