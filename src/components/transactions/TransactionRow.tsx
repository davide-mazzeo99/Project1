import { Users } from 'lucide-react'
import { CategoryIcon } from '@/lib/icons'
import { personalAmount } from '@/lib/analytics/splits'
import { formatCurrency } from '@/lib/format'
import type { Category, Transaction } from '@/types'

interface TransactionRowProps {
  transaction: Transaction
  category: Category | undefined
  accountName: string | undefined
  selected?: boolean
  selectionMode?: boolean
  onTap: () => void
}

export function TransactionRow({ transaction, category, accountName, selected, selectionMode, onTap }: TransactionRowProps) {
  const positive = transaction.amount > 0
  const isSplit = !!transaction.splits?.length
  const mine = personalAmount(transaction)

  return (
    <button
      type="button"
      onClick={onTap}
      className={`tap-target flex w-full items-center gap-3 px-4 py-2.5 text-left active:bg-gray-50 dark:active:bg-gray-800/60 ${
        selected ? 'bg-brand-50 dark:bg-brand-900/20' : ''
      }`}
    >
      {selectionMode && (
        <span
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
            selected ? 'border-brand-600 bg-brand-600' : 'border-gray-300 dark:border-gray-600'
          }`}
        >
          {selected && <span className="h-2 w-2 rounded-full bg-white" />}
        </span>
      )}
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white"
        style={{ backgroundColor: category?.color ?? '#94a3b8' }}
      >
        <CategoryIcon name={category?.icon ?? 'more-horizontal'} className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1">
          <span className="block truncate text-sm font-medium text-gray-900 dark:text-gray-100">
            {transaction.description || category?.name || 'Senza descrizione'}
          </span>
          {isSplit && <Users className="h-3 w-3 shrink-0 text-gray-400" />}
        </span>
        <span className="block truncate text-xs text-gray-400">
          {category?.name ?? 'Da categorizzare'} · {accountName}
          {isSplit && ` · tua quota ${formatCurrency(mine)}`}
        </span>
      </span>
      <span
        className={`shrink-0 text-sm font-semibold tabular-nums ${
          positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-900 dark:text-gray-100'
        }`}
      >
        {formatCurrency(transaction.amount, { signed: true })}
      </span>
    </button>
  )
}
