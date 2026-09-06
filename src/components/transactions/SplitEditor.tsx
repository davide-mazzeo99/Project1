import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Plus } from 'lucide-react'
import { db } from '@/db/db'
import { addPerson } from '@/db/repo/people'
import { parseDecimalInput } from '@/lib/amount'
import type { Person, TransactionSplit } from '@/types'

interface SplitEditorProps {
  /** Absolute value of the transaction's amount. */
  totalAmount: number
  splits: TransactionSplit[]
  onChange: (splits: TransactionSplit[]) => void
}

function round2(value: number): number {
  return Math.round(value * 100) / 100
}

export function SplitEditor({ totalAmount, splits, onChange }: SplitEditorProps) {
  const people = useLiveQuery(() => db.people.orderBy('name').toArray(), [], [] as Person[])
  const [newPersonName, setNewPersonName] = useState('')
  const [amountInputs, setAmountInputs] = useState<Record<string, string>>({})
  const [mineInput, setMineInput] = useState<string | null>(null)

  const selectedIds = new Set(splits.map((s) => s.personId))
  const owedTotal = splits.reduce((sum, s) => sum + s.amount, 0)
  const mine = round2(totalAmount - owedTotal)

  function toggle(person: Person) {
    if (selectedIds.has(person.id)) {
      onChange(splits.filter((s) => s.personId !== person.id))
      setMineInput(null)
      return
    }
    const nextCount = splits.length + 1
    const equalShare = round2(totalAmount / (nextCount + 1))
    const next = [...splits, { personId: person.id, amount: equalShare, settled: false }]
    onChange(next)
    setAmountInputs((prev) => ({ ...prev, [person.id]: String(equalShare) }))
    setMineInput(null)
  }

  function setAmount(personId: string, raw: string) {
    setAmountInputs((prev) => ({ ...prev, [personId]: raw }))
    const amount = parseDecimalInput(raw)
    onChange(splits.map((s) => (s.personId === personId ? { ...s, amount } : s)))
    setMineInput(null)
  }

  /**
   * Editing your own share directly re-distributes the difference across everyone else,
   * proportionally to what they already owed (or evenly if nobody had an amount yet) — so a
   * 3-way Tricount-style split stays adjustable from either "quanto devono loro" or "quanto è mio".
   */
  function setMine(raw: string) {
    setMineInput(raw)
    if (splits.length === 0) return
    const newMine = parseDecimalInput(raw)
    const newOthersTotal = Math.max(0, round2(totalAmount - newMine))
    const oldOthersTotal = owedTotal

    let next: TransactionSplit[]
    if (oldOthersTotal > 0) {
      const factor = newOthersTotal / oldOthersTotal
      next = splits.map((s) => ({ ...s, amount: Math.max(0, round2(s.amount * factor)) }))
    } else {
      const evenShare = round2(newOthersTotal / splits.length)
      next = splits.map((s) => ({ ...s, amount: evenShare }))
    }
    onChange(next)
    setAmountInputs((prev) => {
      const nextInputs = { ...prev }
      next.forEach((s) => {
        nextInputs[s.personId] = String(s.amount)
      })
      return nextInputs
    })
  }

  async function handleAddPerson() {
    if (!newPersonName.trim()) return
    await addPerson(newPersonName)
    setNewPersonName('')
  }

  return (
    <div className="flex flex-col gap-3">
      {splits.length > 0 && (
        <div className="flex items-center gap-2 rounded-lg bg-white px-2 py-1.5 dark:bg-gray-900">
          <span className="flex-1 text-sm font-semibold text-gray-900 dark:text-gray-100">Io</span>
          <div className="flex shrink-0 items-center gap-1">
            <input
              type="text"
              inputMode="decimal"
              value={mineInput ?? String(mine)}
              onChange={(e) => setMine(e.target.value)}
              className={`w-20 rounded-lg border bg-white px-2 py-1.5 text-right text-sm font-semibold dark:bg-gray-900 ${
                mine < 0
                  ? 'border-red-300 text-red-500'
                  : 'border-gray-200 text-gray-900 dark:border-gray-700 dark:text-gray-100'
              }`}
            />
            <span className="text-xs text-gray-400">€</span>
          </div>
        </div>
      )}

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

      {splits.length > 0 && mine < 0 && (
        <p className="text-[11px] text-red-500">Le quote assegnate superano l'importo totale.</p>
      )}
    </div>
  )
}
