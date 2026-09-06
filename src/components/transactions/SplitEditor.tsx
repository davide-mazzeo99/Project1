import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Plus } from 'lucide-react'
import { db } from '@/db/db'
import { addPerson } from '@/db/repo/people'
import { parseDecimalInput } from '@/lib/amount'
import { formatCurrency } from '@/lib/format'
import type { Person, TransactionSplit } from '@/types'

interface SplitEditorProps {
  /** Absolute value of the transaction's amount. */
  totalAmount: number
  splits: TransactionSplit[]
  onChange: (splits: TransactionSplit[]) => void
}

export function SplitEditor({ totalAmount, splits, onChange }: SplitEditorProps) {
  const people = useLiveQuery(() => db.people.orderBy('name').toArray(), [], [] as Person[])
  const [newPersonName, setNewPersonName] = useState('')
  const [amountInputs, setAmountInputs] = useState<Record<string, string>>({})

  const selectedIds = new Set(splits.map((s) => s.personId))
  const owedTotal = splits.reduce((sum, s) => sum + s.amount, 0)
  const myShare = totalAmount - owedTotal

  function toggle(person: Person) {
    if (selectedIds.has(person.id)) {
      onChange(splits.filter((s) => s.personId !== person.id))
      return
    }
    const nextCount = splits.length + 1
    const equalShare = Math.round((totalAmount / (nextCount + 1)) * 100) / 100
    const next = [...splits, { personId: person.id, amount: equalShare, settled: false }]
    onChange(next)
    setAmountInputs((prev) => ({ ...prev, [person.id]: String(equalShare) }))
  }

  function setAmount(personId: string, raw: string) {
    setAmountInputs((prev) => ({ ...prev, [personId]: raw }))
    const amount = parseDecimalInput(raw)
    onChange(splits.map((s) => (s.personId === personId ? { ...s, amount } : s)))
  }

  async function handleAddPerson() {
    if (!newPersonName.trim()) return
    await addPerson(newPersonName)
    setNewPersonName('')
  }

  return (
    <div className="flex flex-col gap-3">
      {people.length === 0 && (
        <p className="text-xs text-gray-400">Aggiungi il nome di chi divide questa spesa con te.</p>
      )}

      {people.map((person) => {
        const split = splits.find((s) => s.personId === person.id)
        const checked = !!split
        return (
          <div key={person.id} className="flex items-center gap-2">
            <label className="flex flex-1 items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(person)}
                className="h-5 w-5 shrink-0"
              />
              {person.name}
            </label>
            {checked && (
              <div className="flex shrink-0 items-center gap-1">
                <input
                  type="text"
                  inputMode="decimal"
                  value={amountInputs[person.id] ?? String(split.amount)}
                  onChange={(e) => setAmount(person.id, e.target.value)}
                  className="w-20 rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-right text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                />
                <span className="text-xs text-gray-400">€</span>
              </div>
            )}
          </div>
        )
      })}

      <div className="flex items-center gap-2">
        <input
          type="text"
          value={newPersonName}
          onChange={(e) => setNewPersonName(e.target.value)}
          placeholder="Nome (es. Marco)"
          className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
        />
        <button
          type="button"
          onClick={handleAddPerson}
          className="tap-target flex items-center justify-center rounded-lg bg-gray-100 px-3 py-2 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
          aria-label="Aggiungi persona"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {splits.length > 0 && (
        <div className="rounded-xl bg-gray-50 px-3 py-2 text-sm dark:bg-gray-800/50">
          <div className="flex items-center justify-between">
            <span className="text-gray-500 dark:text-gray-400">La tua quota</span>
            <span
              className={`font-semibold tabular-nums ${myShare < 0 ? 'text-red-500' : 'text-gray-900 dark:text-gray-100'}`}
            >
              {formatCurrency(myShare)}
            </span>
          </div>
          {myShare < 0 && (
            <p className="mt-1 text-[11px] text-red-500">Le quote assegnate superano l'importo totale.</p>
          )}
        </div>
      )}
    </div>
  )
}
