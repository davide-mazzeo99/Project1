import { Sheet } from '@/components/ui/Sheet'
import { TransactionRow } from '@/components/transactions/TransactionRow'
import { formatCurrency, formatMonthLabel } from '@/lib/format'
import type { Account, Category, Transaction } from '@/types'

interface CategoryDrilldownSheetProps {
  open: boolean
  onClose: () => void
  month: string
  categoryLabel: string
  transactions: Transaction[]
  categoryById: Map<string, Category>
  accountById: Map<string, Account>
  onOpenTransaction: (t: Transaction) => void
}

export function CategoryDrilldownSheet({
  open,
  onClose,
  month,
  categoryLabel,
  transactions,
  categoryById,
  accountById,
  onOpenTransaction,
}: CategoryDrilldownSheetProps) {
  const total = transactions.reduce((s, t) => s + Math.abs(t.amount), 0)

  return (
    <Sheet open={open} onClose={onClose} title={categoryLabel}>
      <p className="mb-2 text-xs text-gray-400">
        {formatMonthLabel(`${month}-01`)} · {transactions.length} transazioni · {formatCurrency(total)}
      </p>
      <div className="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-100 dark:divide-gray-800 dark:border-gray-800">
        {transactions.map((t) => (
          <TransactionRow
            key={t.id}
            transaction={t}
            category={t.categoryId ? categoryById.get(t.categoryId) : undefined}
            accountName={accountById.get(t.accountId)?.name}
            onTap={() => onOpenTransaction(t)}
          />
        ))}
        {transactions.length === 0 && (
          <p className="px-3 py-6 text-center text-sm text-gray-400">Nessuna transazione.</p>
        )}
      </div>
    </Sheet>
  )
}
