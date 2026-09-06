import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { ChevronLeft, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { db } from '@/db/db'
import { deletePerson } from '@/db/repo/people'
import { setSplitSettled } from '@/db/repo/transactions'
import { computePersonBalances } from '@/lib/analytics/splits'
import { formatCurrency, formatDateShort } from '@/lib/format'
import { useToast } from '@/components/ui/Toast'
import type { Person, Transaction } from '@/types'

export function PeoplePage() {
  const { showToast } = useToast()
  const people = useLiveQuery(() => db.people.orderBy('name').toArray(), [], [] as Person[])
  const transactions = useLiveQuery(() => db.transactions.toArray(), [], [] as Transaction[])
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const balances = useMemo(() => computePersonBalances(transactions, people), [transactions, people])

  async function handleSettleAll(person: Person) {
    const balance = balances.find((b) => b.person.id === person.id)
    if (!balance) return
    for (const entry of balance.entries) {
      if (!entry.split.settled) {
        await setSplitSettled(entry.transaction.id, person.id, true)
      }
    }
    showToast(`Saldato con ${person.name}`)
  }

  async function handleDelete(person: Person) {
    await deletePerson(person.id)
    showToast('Persona eliminata')
  }

  return (
    <div className="px-4 pb-4 pt-4">
      <div className="mb-2 flex items-center gap-2">
        <Link
          to="/impostazioni"
          className="tap-target -ml-2 flex items-center justify-center rounded-full text-gray-500 active:bg-gray-200 dark:text-gray-400 dark:active:bg-gray-800"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Persone</h1>
      </div>

      <p className="mb-3 text-xs text-gray-400">
        Chi divide le spese con te. Aggiungi una persona dalla scheda di modifica di una transazione, con "Dividi con
        qualcuno".
      </p>

      {balances.length === 0 && (
        <p className="mt-8 text-center text-sm text-gray-400">
          Nessuna persona ancora. Dividi una spesa da una transazione per iniziare.
        </p>
      )}

      <div className="flex flex-col gap-3">
        {balances.map(({ person, totalOwed, settledTotal, entries }) => (
          <div key={person.id} className="rounded-2xl bg-white p-3.5 shadow-sm dark:bg-gray-900">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setExpandedId((id) => (id === person.id ? null : person.id))}
                className="tap-target -ml-1 flex-1 text-left"
              >
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{person.name}</p>
                <p className={`text-lg font-bold tabular-nums ${totalOwed > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}`}>
                  {totalOwed > 0 ? `ti deve ${formatCurrency(totalOwed)}` : 'in pari'}
                </p>
              </button>
              <button
                onClick={() => handleDelete(person)}
                className="tap-target flex items-center justify-center text-gray-300 active:text-red-500"
                aria-label="Elimina persona"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            {totalOwed > 0 && (
              <button
                onClick={() => handleSettleAll(person)}
                className="tap-target mt-2 w-full rounded-xl bg-emerald-50 py-2 text-xs font-semibold text-emerald-700 active:bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400"
              >
                Segna tutto come saldato
              </button>
            )}

            {expandedId === person.id && (
              <div className="mt-3 divide-y divide-gray-100 border-t border-gray-100 dark:divide-gray-800 dark:border-gray-800">
                {entries.map(({ transaction, split }) => (
                  <div key={transaction.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-gray-700 dark:text-gray-300">{transaction.description}</p>
                      <p className="text-xs text-gray-400">{formatDateShort(transaction.date)}</p>
                    </div>
                    <span className={`shrink-0 font-medium tabular-nums ${split.settled ? 'text-gray-400 line-through' : 'text-gray-900 dark:text-gray-100'}`}>
                      {formatCurrency(split.amount)}
                    </span>
                    <button
                      onClick={() => setSplitSettled(transaction.id, person.id, !split.settled)}
                      className="tap-target shrink-0 text-xs font-semibold text-brand-600"
                    >
                      {split.settled ? 'Riapri' : 'Salda'}
                    </button>
                  </div>
                ))}
                {settledTotal > 0 && (
                  <p className="pt-2 text-[11px] text-gray-400">Già saldato in totale: {formatCurrency(settledTotal)}</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
