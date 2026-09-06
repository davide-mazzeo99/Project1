import { useEffect, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Sheet } from '@/components/ui/Sheet'
import { addHolding, deleteHolding, updateHolding } from '@/db/repo/holdings'
import { useToast } from '@/components/ui/Toast'
import { formatDateShort } from '@/lib/format'
import type { Holding } from '@/types'

export type HoldingDraft = Omit<Holding, 'id' | 'lastPriceUpdate'> & { id?: string; lastPriceUpdate?: string }

interface HoldingEditSheetProps {
  draft: HoldingDraft | null
  onClose: () => void
}

export function HoldingEditSheet({ draft: initialDraft, onClose }: HoldingEditSheetProps) {
  const { showToast } = useToast()
  const [draft, setDraft] = useState<HoldingDraft | null>(initialDraft)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    setDraft(initialDraft)
    setConfirmDelete(false)
  }, [initialDraft])

  if (!draft) return null

  async function handleSave() {
    if (!draft || !draft.name.trim() || draft.quantity <= 0) return
    if (draft.id) {
      await updateHolding(draft.id, {
        name: draft.name,
        ticker: draft.ticker || undefined,
        isin: draft.isin || undefined,
        quantity: draft.quantity,
        avgCost: draft.avgCost,
        currentPrice: draft.currentPrice,
      })
      showToast('Posizione aggiornata')
    } else {
      await addHolding({
        name: draft.name,
        ticker: draft.ticker || undefined,
        isin: draft.isin || undefined,
        quantity: draft.quantity,
        avgCost: draft.avgCost,
        currentPrice: draft.currentPrice,
      })
      showToast('Posizione aggiunta')
    }
    onClose()
  }

  async function handleDelete() {
    if (!draft?.id) return
    await deleteHolding(draft.id)
    showToast('Posizione eliminata')
    onClose()
  }

  return (
    <Sheet
      open={!!initialDraft}
      onClose={onClose}
      title={draft.id ? 'Modifica posizione' : 'Nuova posizione'}
      footer={
        <div className="flex gap-2">
          {draft.id && (
            <button
              onClick={() => (confirmDelete ? handleDelete() : setConfirmDelete(true))}
              className={`tap-target flex items-center justify-center gap-1.5 rounded-xl px-4 text-sm font-semibold ${
                confirmDelete ? 'bg-red-600 text-white' : 'bg-red-50 text-red-600 dark:bg-red-950/40'
              }`}
            >
              <Trash2 className="h-4 w-4" /> {confirmDelete ? 'Conferma?' : ''}
            </button>
          )}
          <button
            onClick={handleSave}
            className="tap-target flex-1 rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white active:bg-brand-700"
          >
            Salva
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-xs font-medium text-gray-500 dark:text-gray-400">
          Nome
          <input
            type="text"
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            placeholder="Es. ETF MSCI World"
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 text-xs font-medium text-gray-500 dark:text-gray-400">
            Ticker (opzionale)
            <input
              type="text"
              value={draft.ticker ?? ''}
              onChange={(e) => setDraft({ ...draft, ticker: e.target.value })}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-gray-500 dark:text-gray-400">
            ISIN (opzionale)
            <input
              type="text"
              value={draft.isin ?? ''}
              onChange={(e) => setDraft({ ...draft, isin: e.target.value })}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            />
          </label>
        </div>

        <label className="flex flex-col gap-1 text-xs font-medium text-gray-500 dark:text-gray-400">
          Quantità
          <input
            type="number"
            inputMode="decimal"
            value={draft.quantity || ''}
            onChange={(e) => setDraft({ ...draft, quantity: Number.parseFloat(e.target.value) || 0 })}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 text-xs font-medium text-gray-500 dark:text-gray-400">
            Prezzo medio carico (€)
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              value={draft.avgCost || ''}
              onChange={(e) => setDraft({ ...draft, avgCost: Number.parseFloat(e.target.value) || 0 })}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-gray-500 dark:text-gray-400">
            Prezzo attuale (€)
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              value={draft.currentPrice || ''}
              onChange={(e) => setDraft({ ...draft, currentPrice: Number.parseFloat(e.target.value) || 0 })}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            />
          </label>
        </div>
        {draft.lastPriceUpdate && (
          <p className="text-xs text-gray-400">Prezzo aggiornato il {formatDateShort(draft.lastPriceUpdate)}</p>
        )}
      </div>
    </Sheet>
  )
}
