import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Copy, Trash2 } from 'lucide-react'
import { db } from '@/db/db'
import { Sheet } from '@/components/ui/Sheet'
import { CategoryGrid } from '@/components/transactions/CategoryGrid'
import { deleteTransaction, duplicateTransaction, updateTransaction } from '@/db/repo/transactions'
import { createRule } from '@/db/repo/rules'
import { useToast } from '@/components/ui/Toast'
import { parseDecimalInput } from '@/lib/amount'
import type { Transaction } from '@/types'

interface TransactionEditSheetProps {
  transaction: Transaction | null
  onClose: () => void
}

export function TransactionEditSheet({ transaction, onClose }: TransactionEditSheetProps) {
  const { showToast } = useToast()
  const accounts = useLiveQuery(() => db.accounts.toArray(), [])
  const [form, setForm] = useState<Transaction | null>(transaction)
  const [amountInput, setAmountInput] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [wasUncategorized, setWasUncategorized] = useState(false)
  const [makeRule, setMakeRule] = useState(false)
  const [rulePattern, setRulePattern] = useState('')

  useEffect(() => {
    setForm(transaction)
    setAmountInput(transaction ? String(Math.abs(transaction.amount)) : '')
    setConfirmDelete(false)
    setWasUncategorized(!transaction?.categoryId)
    setMakeRule(false)
    setRulePattern(transaction?.description.trim() ?? '')
  }, [transaction])

  if (!form) return null

  const isExpenseLike = form.amount < 0
  const justCategorized = wasUncategorized && !!form.categoryId

  async function handleSave() {
    if (!form) return
    await updateTransaction(form.id, {
      accountId: form.accountId,
      date: form.date,
      amount: form.amount,
      description: form.description,
      categoryId: form.categoryId,
      isRecurring: form.isRecurring,
      isTransfer: form.isTransfer,
      notes: form.notes,
    })
    if (justCategorized && makeRule && rulePattern.trim() && form.categoryId) {
      await createRule({ matchType: 'contains', pattern: rulePattern.trim(), categoryId: form.categoryId })
      showToast('Modifiche salvate e regola creata')
    } else {
      showToast('Modifiche salvate')
    }
    onClose()
  }

  async function handleDelete() {
    if (!form) return
    await deleteTransaction(form.id)
    showToast('Transazione eliminata')
    onClose()
  }

  async function handleDuplicate() {
    if (!form) return
    await duplicateTransaction(form.id)
    showToast('Transazione duplicata su oggi')
    onClose()
  }

  return (
    <Sheet
      open={!!transaction}
      onClose={onClose}
      title="Modifica transazione"
      footer={
        <div className="flex gap-2">
          <button
            onClick={handleDuplicate}
            className="tap-target flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gray-100 py-2.5 text-sm font-semibold text-gray-700 active:bg-gray-200 dark:bg-gray-800 dark:text-gray-200"
          >
            <Copy className="h-4 w-4" /> Duplica
          </button>
          <button
            onClick={() => (confirmDelete ? handleDelete() : setConfirmDelete(true))}
            className={`tap-target flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold ${
              confirmDelete
                ? 'bg-red-600 text-white active:bg-red-700'
                : 'bg-red-50 text-red-600 active:bg-red-100 dark:bg-red-950/40'
            }`}
          >
            <Trash2 className="h-4 w-4" /> {confirmDelete ? 'Conferma?' : 'Elimina'}
          </button>
          <button
            onClick={handleSave}
            className="tap-target flex-[1.4] rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white active:bg-brand-700"
          >
            Salva
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1 text-sm font-medium text-gray-500 dark:text-gray-400">
            <input
              type="radio"
              checked={isExpenseLike}
              onChange={() => setForm({ ...form, amount: -Math.abs(parseDecimalInput(amountInput)) })}
            />
            Uscita
          </label>
          <label className="flex items-center gap-1 text-sm font-medium text-gray-500 dark:text-gray-400">
            <input
              type="radio"
              checked={!isExpenseLike}
              onChange={() => setForm({ ...form, amount: Math.abs(parseDecimalInput(amountInput)) })}
            />
            Entrata
          </label>
        </div>

        <input
          type="text"
          inputMode="decimal"
          value={amountInput}
          onChange={(e) => {
            setAmountInput(e.target.value)
            const v = Math.abs(parseDecimalInput(e.target.value))
            setForm({ ...form, amount: isExpenseLike ? -v : v })
          }}
          className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-lg font-semibold text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
        />

        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 text-xs font-medium text-gray-500 dark:text-gray-400">
            Conto
            <select
              value={form.accountId}
              onChange={(e) => setForm({ ...form, accountId: e.target.value })}
              className="rounded-lg border border-gray-200 bg-white px-2 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            >
              {accounts?.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-gray-500 dark:text-gray-400">
            Data
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="rounded-lg border border-gray-200 bg-white px-2 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            />
          </label>
        </div>

        <label className="flex flex-col gap-1 text-xs font-medium text-gray-500 dark:text-gray-400">
          Descrizione
          <input
            type="text"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="rounded-lg border border-gray-200 bg-white px-2 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          />
        </label>

        <label className="flex flex-col gap-1 text-xs font-medium text-gray-500 dark:text-gray-400">
          Note (opzionale)
          <textarea
            value={form.notes ?? ''}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={2}
            className="rounded-lg border border-gray-200 bg-white px-2 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          />
        </label>

        <label className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2.5 text-sm text-gray-700 dark:bg-gray-800/50 dark:text-gray-300">
          Ricorrente
          <input
            type="checkbox"
            checked={form.isRecurring}
            onChange={(e) => setForm({ ...form, isRecurring: e.target.checked })}
            className="h-5 w-5"
          />
        </label>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Categoria</p>
          <CategoryGrid
            selectedId={form.categoryId}
            onSelect={(cat) => setForm({ ...form, categoryId: cat.id, isTransfer: cat.type === 'transfer' })}
          />
        </div>

        {justCategorized && (
          <div className="rounded-xl bg-brand-50 p-3 dark:bg-brand-900/20">
            <label className="flex items-center justify-between text-sm text-gray-700 dark:text-gray-300">
              Crea regola per transazioni simili
              <input
                type="checkbox"
                checked={makeRule}
                onChange={(e) => setMakeRule(e.target.checked)}
                className="h-5 w-5"
              />
            </label>
            {makeRule && (
              <>
                <input
                  type="text"
                  value={rulePattern}
                  onChange={(e) => setRulePattern(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                />
                <p className="mt-1 text-[11px] text-gray-400">
                  Le prossime transazioni la cui descrizione contiene questo testo verranno categorizzate
                  automaticamente.
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </Sheet>
  )
}
