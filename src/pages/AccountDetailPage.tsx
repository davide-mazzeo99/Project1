import { useEffect, useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, Pencil, Plus } from 'lucide-react'
import { db } from '@/db/db'
import { TransactionRow } from '@/components/transactions/TransactionRow'
import { QuickAddSheet } from '@/components/transactions/QuickAddSheet'
import { TransactionEditSheet } from '@/components/transactions/TransactionEditSheet'
import { computeAccountBalance, computeAccountBalanceFor } from '@/lib/analytics/accountBalance'
import { parseDecimalInput } from '@/lib/amount'
import { setOpeningBalance } from '@/db/repo/accounts'
import { useToast } from '@/components/ui/Toast'
import { formatCurrency, formatDateLabel } from '@/lib/format'
import type { Category, Transaction } from '@/types'

export function AccountDetailPage() {
  const { accountId = '' } = useParams()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [quickAddOpen, setQuickAddOpen] = useState(false)
  const [editing, setEditing] = useState<Transaction | null>(null)
  const [editingOpeningBalance, setEditingOpeningBalance] = useState(false)
  const [openingBalanceInput, setOpeningBalanceInput] = useState('')

  const account = useLiveQuery(() => db.accounts.get(accountId), [accountId])
  const categories = useLiveQuery(() => db.categories.toArray(), [], [] as Category[])
  const allTransactions = useLiveQuery(() => db.transactions.toArray(), [], [] as Transaction[])

  useEffect(() => {
    setOpeningBalanceInput(String(account?.openingBalance ?? 0))
  }, [account?.openingBalance])

  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories])
  const accountTransactions = useMemo(
    () =>
      allTransactions
        .filter((t) => t.accountId === accountId)
        .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt),
    [allTransactions, accountId],
  )
  const transactionsTotal = useMemo(
    () => computeAccountBalance(allTransactions, accountId),
    [allTransactions, accountId],
  )
  const balance = useMemo(
    () => (account ? computeAccountBalanceFor(allTransactions, account) : 0),
    [allTransactions, account],
  )

  const groups = useMemo(() => {
    const map = new Map<string, Transaction[]>()
    for (const t of accountTransactions) {
      const arr = map.get(t.date) ?? []
      arr.push(t)
      map.set(t.date, arr)
    }
    return Array.from(map.entries())
  }, [accountTransactions])

  async function handleSaveOpeningBalance() {
    await setOpeningBalance(accountId, parseDecimalInput(openingBalanceInput))
    showToast('Saldo iniziale aggiornato')
    setEditingOpeningBalance(false)
  }

  if (!account) {
    return (
      <div className="px-4 pt-4">
        <button
          onClick={() => navigate('/')}
          className="tap-target -ml-2 flex items-center justify-center rounded-full text-gray-500 active:bg-gray-200 dark:text-gray-400 dark:active:bg-gray-800"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      </div>
    )
  }

  return (
    <div className="pb-24">
      <div className="px-4 pt-4">
        <div className="mb-3 flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="tap-target -ml-2 flex items-center justify-center rounded-full text-gray-500 active:bg-gray-200 dark:text-gray-400 dark:active:bg-gray-800"
            aria-label="Indietro"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{account.name}</h1>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-gray-900">
          <p className="text-xs text-gray-400">Saldo attuale</p>
          <p className="text-2xl font-bold tabular-nums text-gray-900 dark:text-gray-100">{formatCurrency(balance)}</p>

          <button
            onClick={() => setEditingOpeningBalance((v) => !v)}
            className="tap-target mt-2 flex items-center gap-1.5 text-xs text-gray-400"
          >
            <Pencil className="h-3 w-3" />
            Saldo iniziale: {formatCurrency(account.openingBalance ?? 0)}
          </button>

          {editingOpeningBalance && (
            <div className="mt-2 rounded-xl bg-gray-50 p-3 dark:bg-gray-800/50">
              <p className="mb-2 text-[11px] text-gray-400">
                Il saldo che il conto aveva già prima di iniziare a registrare le transazioni in app. Si somma allo
                storico ({formatCurrency(transactionsTotal, { signed: true })}) per dare il saldo attuale.
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  inputMode="decimal"
                  value={openingBalanceInput}
                  onChange={(e) => setOpeningBalanceInput(e.target.value)}
                  className="flex-1 rounded-lg border border-gray-200 bg-white px-2 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                />
                <button
                  onClick={handleSaveOpeningBalance}
                  className="tap-target rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white active:bg-brand-700"
                >
                  Salva
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {groups.length === 0 && (
        <div className="mt-16 flex flex-col items-center gap-2 px-6 text-center text-gray-400">
          <p className="text-sm">Nessuna transazione su questo conto. Tocca + per aggiungerne una.</p>
        </div>
      )}

      <div className="mt-4">
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
                    accountName={account.name}
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
        aria-label="Nuova transazione su questo conto"
        className="fixed bottom-24 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-white shadow-lg active:bg-brand-700"
      >
        <Plus className="h-6 w-6" />
      </button>

      <QuickAddSheet open={quickAddOpen} onClose={() => setQuickAddOpen(false)} defaultAccountId={accountId} />
      <TransactionEditSheet transaction={editing} onClose={() => setEditing(null)} />
    </div>
  )
}
