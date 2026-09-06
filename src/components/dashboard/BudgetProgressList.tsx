import { CategoryIcon } from '@/lib/icons'
import { formatCurrency } from '@/lib/format'
import type { BudgetProgress } from '@/lib/analytics/budgetProgress'

const STATUS_BAR: Record<BudgetProgress['status'], string> = {
  ok: 'bg-emerald-500',
  warning: 'bg-amber-500',
  over: 'bg-red-500',
}

export function BudgetProgressList({ items }: { items: BudgetProgress[] }) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-gray-400">
        Nessun budget impostato. Aggiungine uno dalla scheda Budget o dalle categorie.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => (
        <div key={item.categoryId}>
          <div className="mb-1 flex items-center gap-2">
            <span
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white"
              style={{ backgroundColor: item.category.color }}
            >
              <CategoryIcon name={item.category.icon} className="h-3.5 w-3.5" />
            </span>
            <span className="min-w-0 flex-1 truncate text-sm text-gray-700 dark:text-gray-300">
              {item.category.name}
            </span>
            <span className="shrink-0 text-xs tabular-nums text-gray-400">
              {formatCurrency(item.spent)} / {formatCurrency(item.budget)}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
            <div
              className={`h-full rounded-full ${STATUS_BAR[item.status]}`}
              style={{ width: `${Math.min(100, item.ratio * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
