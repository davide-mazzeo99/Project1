import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Plus, Search, SlidersHorizontal } from 'lucide-react'
import { db } from '@/db/db'
import { TransactionRow } from '@/components/transactions/TransactionRow'
import { QuickAddSheet } from '@/components/transactions/QuickAddSheet'
import { TransactionEditSheet } from '@/components/transactions/TransactionEditSheet'
import { formatCurrency, formatDateLabel } from '@/lib/format'
import type { Transaction } from '@/types'

export function TransactionsPage() {
  const [quickAddOpen, setQuickAddOpen] = useState(false)
  const [editing, setEditing] = useState<Transaction | null>(null)
  const [search, setSearch] = useState('')
  const [accountFilter, setAccountFilter] = useState<string>('all')
  const [showFilters, setShowFilters] = useState(false)

  const accounts = useLiveQuery(() => db.accounts.toArray(), [])
  const categories = useLiveQuery(() => db.categories.toArray(), [])
  const transactions = useLiveQuery(() => db.transactions.orderBy('date').reverse().toArray(), [])

  const categoryById = useMemo(() => new Map(categories?.map((c) => [c.id, c]) ?? []), [categories])
  const accountById = useMemo(() => new Map(accounts?.map((a) => [a.id, a]) ?? []), [accounts])

  const filtered = useMemo(() => {
    if (!transactions) return []
    const q = search.trim().toLowerCase()
    return transactions.filter((t) => {
      if (accountFilter !== 'all' && t.accountId !== accountFilter) return false
      if (q && !t.description.toLowerCase().includes(q)) return false
      return true
    })
  }, [transactions, search, accountFilter])

  const groups = useMemo(() => {
    const map = new Map<string, Transaction[]>()
    for (const t of filtered) {
      const arr = map.get(t.date) ?? []
      arr.push(t)
      map.set(t.date, arr)
    }
    return Array.from(map.entries())
  }, [filtered])

  return (
    <div className="pb-4">
      <div className="sticky top-0 z-10 bg-gray-100/95 px-4 pb-2 pt-4 backdrop-blur dark:bg-gray-950/95">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Transazioni</h1>
          <button
            onClick={() => setShowFilters((v) => !v)}
            className="tap-target flex items-center justify-center rounded-full text-gray-500 active:bg-gray-200 dark:text-gray-400 dark:active:bg-gray-800"
            aria-label="Filtri"
          >
            <SlidersHorizontal className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-3 flex items-center gap-2 rounded-xl bg-white px-3 py-2 shadow-sm dark:bg-gray-900">
          <Search className="h-4 w-4 text-gray-400" />
          <input
            type="search"
            placeholder="Cerca transazioni..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-gray-900 outline-none placeholder:text-gray-400 dark:text-gray-100"
          />
        </div>

        {showFilters && (
          <div className="mt-2 flex gap-2 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setAccountFilter('all')}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${
                accountFilter === 'all'
                  ? 'bg-brand-600 text-white'
                  : 'bg-white text-gray-600 dark:bg-gray-900 dark:text-gray-300'
              }`}
            >
              Tutti i conti
            </button>
            {accounts?.map((a) => (
              <button
                key={a.id}
                onClick={() => setAccountFilter(a.id)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${
                  accountFilter === a.id
                    ? 'bg-brand-600 text-white'
                    : 'bg-white text-gray-600 dark:bg-gray-900 dark:text-gray-300'
                }`}
              >
                {a.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {groups.length === 0 && (
        <div className="mt-16 flex flex-col items-center gap-2 px-6 text-center text-gray-400">
          <p className="text-sm">
            {transactions?.length === 0
              ? 'Nessuna transazione ancora. Tocca + per aggiungerne una.'
              : 'Nessun risultato per questi filtri.'}
          </p>
        </div>
      )}

      <div className="mt-1">
        {groups.map(([date, items]) => {
          const dayTotal = items.reduce((sum, t) => sum + t.amount, 0)
          return (
            <div key={date}>
              <div className="flex items-center justify-between px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">
                <span>{formatDateLabel(date)}</span>
                <span className="tabular-nums">{formatCurrency(dayTotal, { signed: true })}</span>
              </div>
              <div className="divide-y divide-gray-100 bg-white dark:divide-gray-800 dark:bg-gray-900">
                {items.map((t) => (
                  <TransactionRow
                    key={t.id}
                    transaction={t}
                    category={t.categoryId ? categoryById.get(t.categoryId) : undefined}
                    accountName={accountById.get(t.accountId)?.name}
                    onTap={() => setEditing(t)}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <button
        onClick={() => setQuickAddOpen(true)}
        aria-label="Nuova transazione"
        className="fixed bottom-24 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-white shadow-lg active:bg-brand-700"
      >
        <Plus className="h-6 w-6" />
      </button>

      <QuickAddSheet open={quickAddOpen} onClose={() => setQuickAddOpen(false)} />
      <TransactionEditSheet transaction={editing} onClose={() => setEditing(null)} />
    </div>
  )
}
