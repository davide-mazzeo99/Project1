import { useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router-dom'
import { Landmark, TrendingUp } from 'lucide-react'
import { db } from '@/db/db'
import { computeAccountBalanceFor } from '@/lib/analytics/accountBalance'
import { formatCurrency } from '@/lib/format'
import type { Account, Transaction } from '@/types'

export function AccountCards() {
  const navigate = useNavigate()
  const accounts = useLiveQuery(() => db.accounts.toArray(), [], [] as Account[])
  const transactions = useLiveQuery(() => db.transactions.toArray(), [], [] as Transaction[])

  const balances = useMemo(
    () => new Map(accounts.map((a) => [a.id, computeAccountBalanceFor(transactions, a)])),
    [accounts, transactions],
  )

  if (accounts.length === 0) return null

  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Conti</p>
      <div className="grid grid-cols-2 gap-3">
        {accounts.map((a) => {
          const balance = balances.get(a.id) ?? 0
          const Icon = a.type === 'brokerage' ? TrendingUp : Landmark
          return (
            <button
              key={a.id}
              onClick={() => navigate(`/conti/${a.id}`)}
              className="tap-target flex flex-col items-start gap-1.5 rounded-2xl bg-white p-3.5 text-left shadow-sm active:bg-gray-50 dark:bg-gray-900 dark:active:bg-gray-800/60"
            >
              <span className="flex items-center gap-1.5 text-xs text-gray-400">
                <Icon className="h-3.5 w-3.5" />
                {a.name}
              </span>
              <span className="text-lg font-bold tabular-nums text-gray-900 dark:text-gray-100">
                {formatCurrency(balance)}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
