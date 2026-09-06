import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { ChevronDown, Pencil } from 'lucide-react'
import { db } from '@/db/db'
import { Sheet } from '@/components/ui/Sheet'
import { NumericKeypad } from '@/components/transactions/NumericKeypad'
import { CategoryGrid } from '@/components/transactions/CategoryGrid'
import { appendDecimalSeparator, appendDigit, backspace, displayAmountBuffer, parseAmountBuffer } from '@/lib/amount'
import { addTransaction } from '@/db/repo/transactions'
import { todayIso, formatDateShort } from '@/lib/format'
import { useToast } from '@/components/ui/Toast'
import type { Category } from '@/types'

interface QuickAddSheetProps {
  open: boolean
  onClose: () => void
}

export function QuickAddSheet({ open, onClose }: QuickAddSheetProps) {
  const { showToast } = useToast()
  const accounts = useLiveQuery(() => db.accounts.toArray(), [])
  const [buffer, setBuffer] = useState('')
  const [accountId, setAccountId] = useState<string | null>(null)
  const [date, setDate] = useState(todayIso())
  const [description, setDescription] = useState('')
  const [showDetails, setShowDetails] = useState(false)
  const [saving, setSaving] = useState(false)

  const activeAccountId = accountId ?? accounts?.[0]?.id ?? ''
  const amount = parseAmountBuffer(buffer)

  function reset() {
    setBuffer('')
    setAccountId(null)
    setDate(todayIso())
    setDescription('')
    setShowDetails(false)
  }

  async function handleSelectCategory(category: Category) {
    if (amount <= 0 || !activeAccountId || saving) return
    setSaving(true)
    const signedAmount = category.type === 'income' ? Math.abs(amount) : -Math.abs(amount)
    try {
      await addTransaction({
        accountId: activeAccountId,
        date,
        amount: signedAmount,
        description: description.trim() || category.name,
        categoryId: category.id,
        isRecurring: false,
        isTransfer: category.type === 'transfer',
      })
      showToast('Transazione salvata')
      reset()
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet open={open} onClose={() => { reset(); onClose() }} title="Nuova transazione">
      <div className="flex flex-col gap-4">
        <div className="text-center">
          <div className="text-4xl font-bold tabular-nums text-gray-900 dark:text-gray-100">
            {displayAmountBuffer(buffer)} <span className="text-2xl text-gray-400">€</span>
          </div>
        </div>

        <NumericKeypad
          onDigit={(d) => setBuffer((b) => appendDigit(b, d))}
          onDecimal={() => setBuffer((b) => appendDecimalSeparator(b))}
          onBackspace={() => setBuffer((b) => backspace(b))}
        />

        <button
          type="button"
          onClick={() => setShowDetails((v) => !v)}
          className="tap-target flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2 text-sm text-gray-600 dark:bg-gray-800/50 dark:text-gray-300"
        >
          <span className="flex items-center gap-2">
            <Pencil className="h-3.5 w-3.5" />
            {accounts?.find((a) => a.id === activeAccountId)?.name} · {formatDateShort(date)}
            {description ? ` · ${description}` : ''}
          </span>
          <ChevronDown className={`h-4 w-4 transition-transform ${showDetails ? 'rotate-180' : ''}`} />
        </button>

        {showDetails && (
          <div className="grid grid-cols-2 gap-3 rounded-xl bg-gray-50 p-3 dark:bg-gray-800/50">
            <label className="flex flex-col gap-1 text-xs font-medium text-gray-500 dark:text-gray-400">
              Conto
              <select
                value={activeAccountId}
                onChange={(e) => setAccountId(e.target.value)}
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
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="rounded-lg border border-gray-200 bg-white px-2 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              />
            </label>
            <label className="col-span-2 flex flex-col gap-1 text-xs font-medium text-gray-500 dark:text-gray-400">
              Descrizione (opzionale)
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Es. Spesa Esselunga"
                className="rounded-lg border border-gray-200 bg-white px-2 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              />
            </label>
          </div>
        )}

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
            {amount > 0 ? 'Scegli una categoria per salvare' : 'Inserisci un importo, poi scegli la categoria'}
          </p>
          <div className={amount > 0 ? '' : 'pointer-events-none opacity-40'}>
            <CategoryGrid onSelect={handleSelectCategory} />
          </div>
        </div>
      </div>
    </Sheet>
  )
}
