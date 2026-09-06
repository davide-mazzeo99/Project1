import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { ChevronDown, Pencil } from 'lucide-react'
import { db } from '@/db/db'
import { Sheet } from '@/components/ui/Sheet'
import { NumericKeypad } from '@/components/transactions/NumericKeypad'
import { CategoryGrid } from '@/components/transactions/CategoryGrid'
import { appendDecimalSeparator, appendDigit, backspace, displayAmountBuffer, parseAmountBuffer } from '@/lib/amount'
import { addTransaction, createSantanderToTradeRepublicTransfer } from '@/db/repo/transactions'
import { todayIso, formatDateShort, formatCurrency } from '@/lib/format'
import { useToast } from '@/components/ui/Toast'
import type { Category } from '@/types'

interface QuickAddSheetProps {
  open: boolean
  onClose: () => void
  /** Pre-selects this account (e.g. when opened from an account's detail page). */
  defaultAccountId?: string
}

export function QuickAddSheet({ open, onClose, defaultAccountId }: QuickAddSheetProps) {
  const { showToast } = useToast()
  const accounts = useLiveQuery(() => db.accounts.toArray(), [])
  const [buffer, setBuffer] = useState('')
  const [accountId, setAccountId] = useState<string | null>(defaultAccountId ?? null)
  const [date, setDate] = useState(todayIso())
  const [description, setDescription] = useState('')
  const [showDetails, setShowDetails] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) setAccountId(defaultAccountId ?? null)
  }, [open, defaultAccountId])

  const activeAccountId = accountId ?? accounts?.[0]?.id ?? ''
  const amount = parseAmountBuffer(buffer)

  function reset() {
    setBuffer('')
    setAccountId(defaultAccountId ?? null)
    setDate(todayIso())
    setDescription('')
    setShowDetails(false)
  }

  async function handleSelectCategory(category: Category) {
    if (amount <= 0 || saving) return

    if (category.type === 'transfer') {
      setSaving(true)
      try {
        await createSantanderToTradeRepublicTransfer({
          amount,
          date,
          categoryId: category.id,
          description: description.trim() || undefined,
        })
        showToast(`Trasferiti ${formatCurrency(amount)} da Santander a Trade Republic`)
        reset()
        onClose()
      } finally {
        setSaving(false)
      }
      return
    }

    if (!activeAccountId) return
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
        isTransfer: false,
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

        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">Conto</p>
          <div className="grid grid-cols-2 gap-2">
            {accounts?.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => setAccountId(a.id)}
                className={`tap-target rounded-xl border py-2 text-sm font-semibold transition-colors ${
                  activeAccountId === a.id
                    ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300'
                    : 'border-gray-200 bg-gray-50 text-gray-600 dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-300'
                }`}
              >
                {a.name}
              </button>
            ))}
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
            {formatDateShort(date)}
            {description ? ` · ${description}` : ''}
          </span>
          <ChevronDown className={`h-4 w-4 transition-transform ${showDetails ? 'rotate-180' : ''}`} />
        </button>

        {showDetails && (
          <div className="grid grid-cols-1 gap-3 rounded-xl bg-gray-50 p-3 dark:bg-gray-800/50">
            <label className="flex flex-col gap-1 text-xs font-medium text-gray-500 dark:text-gray-400">
              Data
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="rounded-lg border border-gray-200 bg-white px-2 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium text-gray-500 dark:text-gray-400">
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
          <p className="mb-2 -mt-1 text-[11px] text-gray-400">
            "Trasferimenti" sposta sempre l'importo da Santander a Trade Republic, a prescindere dal conto scelto sopra.
          </p>
          <div className={amount > 0 ? '' : 'pointer-events-none opacity-40'}>
            <CategoryGrid onSelect={handleSelectCategory} />
          </div>
        </div>
      </div>
    </Sheet>
  )
}
