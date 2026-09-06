import { useEffect, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Sheet } from '@/components/ui/Sheet'
import { addHolding, deleteHolding, updateHolding } from '@/db/repo/holdings'
import { useToast } from '@/components/ui/Toast'
import { parseDecimalInput } from '@/lib/amount'
import { formatDateShort } from '@/lib/format'
import type { AssetType, Holding } from '@/types'

export type HoldingDraft = Omit<Holding, 'id' | 'lastPriceUpdate'> & { id?: string; lastPriceUpdate?: string }

interface HoldingEditSheetProps {
  draft: HoldingDraft | null
  onClose: () => void
}

function toInputValue(value: number): string {
  return value ? String(value) : ''
}

export function HoldingEditSheet({ draft: initialDraft, onClose }: HoldingEditSheetProps) {
  const { showToast } = useToast()
  const [name, setName] = useState('')
  const [assetType, setAssetType] = useState<AssetType>('security')
  const [ticker, setTicker] = useState('')
  const [isin, setIsin] = useState('')
  const [quantityInput, setQuantityInput] = useState('')
  const [avgCostInput, setAvgCostInput] = useState('')
  const [currentPriceInput, setCurrentPriceInput] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [currentValueTouched, setCurrentValueTouched] = useState(false)

  useEffect(() => {
    setName(initialDraft?.name ?? '')
    setAssetType(initialDraft?.assetType ?? 'security')
    setTicker(initialDraft?.ticker ?? '')
    setIsin(initialDraft?.isin ?? '')
    setQuantityInput(initialDraft ? toInputValue(initialDraft.quantity) : '')
    setAvgCostInput(initialDraft ? toInputValue(initialDraft.avgCost) : '')
    setCurrentPriceInput(initialDraft ? toInputValue(initialDraft.currentPrice) : '')
    setConfirmDelete(false)
    // Editing an existing position already has a real value; only auto-mirror for a brand new one.
    setCurrentValueTouched(!!initialDraft?.id)
  }, [initialDraft])

  if (!initialDraft) return null

  const isAccumulation = assetType === 'accumulation'
  const quantity = parseDecimalInput(quantityInput)
  const avgCost = parseDecimalInput(avgCostInput)
  const currentPrice = parseDecimalInput(currentPriceInput)

  function handleAvgCostChange(raw: string) {
    setAvgCostInput(raw)
    // A new accumulation position starts at break-even until the user updates the current value themselves.
    if (isAccumulation && !currentValueTouched) setCurrentPriceInput(raw)
  }

  function handleCurrentPriceChange(raw: string) {
    setCurrentPriceInput(raw)
    setCurrentValueTouched(true)
  }

  async function handleSave() {
    if (!name.trim()) return
    if (isAccumulation && avgCost <= 0) return
    if (!isAccumulation && quantity <= 0) return
    const payload = {
      name,
      assetType,
      ticker: ticker || undefined,
      isin: isin || undefined,
      quantity: isAccumulation ? 1 : quantity,
      avgCost,
      currentPrice,
      priceIsLive: false,
      // Changing asset type invalidates any cached CoinGecko id from a previous lookup.
      coinGeckoId: assetType === 'crypto' ? initialDraft!.coinGeckoId : undefined,
    }
    if (initialDraft!.id) {
      await updateHolding(initialDraft!.id, payload)
      showToast('Posizione aggiornata')
    } else {
      await addHolding(payload)
      showToast('Posizione aggiunta')
    }
    onClose()
  }

  async function handleDelete() {
    if (!initialDraft?.id) return
    await deleteHolding(initialDraft.id)
    showToast('Posizione eliminata')
    onClose()
  }

  return (
    <Sheet
      open={!!initialDraft}
      onClose={onClose}
      title={initialDraft.id ? 'Modifica posizione' : 'Nuova posizione'}
      footer={
        <div className="flex gap-2">
          {initialDraft.id && (
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
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Es. Bitcoin"
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          />
        </label>

        <div>
          <p className="mb-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">Tipo</p>
          <div className="grid grid-cols-3 gap-2">
            {(['security', 'crypto', 'accumulation'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setAssetType(type)}
                className={`tap-target rounded-xl border py-2 text-sm font-semibold transition-colors ${
                  assetType === type
                    ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300'
                    : 'border-gray-200 bg-gray-50 text-gray-600 dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-300'
                }`}
              >
                {type === 'security' ? 'Azione/ETF' : type === 'crypto' ? 'Cripto' : 'Ad accumulo'}
              </button>
            ))}
          </div>
          <p className="mt-1 text-[11px] text-gray-400">
            {assetType === 'crypto'
              ? 'Il prezzo si aggiorna da CoinGecko usando il ticker qui sotto (es. BTC).'
              : assetType === 'security'
                ? 'Il prezzo si aggiorna da Twelve Data usando il ticker, se hai impostato una API key in Impostazioni.'
                : 'Per un piano di accumulo (PAC) senza una quantità di quote da seguire: aggiorna a mano il capitale versato e il valore attuale quando controlli la app della piattaforma.'}
          </p>
        </div>

        {!isAccumulation && (
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-xs font-medium text-gray-500 dark:text-gray-400">
              Ticker (opzionale)
              <input
                type="text"
                value={ticker}
                onChange={(e) => setTicker(e.target.value)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium text-gray-500 dark:text-gray-400">
              ISIN (opzionale)
              <input
                type="text"
                value={isin}
                onChange={(e) => setIsin(e.target.value)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              />
            </label>
          </div>
        )}

        {!isAccumulation && (
          <label className="flex flex-col gap-1 text-xs font-medium text-gray-500 dark:text-gray-400">
            Quantità
            <input
              type="text"
              inputMode="decimal"
              value={quantityInput}
              onChange={(e) => setQuantityInput(e.target.value)}
              placeholder="Es. 0,015"
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            />
          </label>
        )}

        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 text-xs font-medium text-gray-500 dark:text-gray-400">
            {isAccumulation ? 'Capitale versato (€)' : 'Prezzo medio carico (€)'}
            <input
              type="text"
              inputMode="decimal"
              value={avgCostInput}
              onChange={(e) => handleAvgCostChange(e.target.value)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-gray-500 dark:text-gray-400">
            {isAccumulation ? 'Valore attuale (€)' : 'Prezzo attuale (€)'}
            <input
              type="text"
              inputMode="decimal"
              value={currentPriceInput}
              onChange={(e) => handleCurrentPriceChange(e.target.value)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            />
          </label>
        </div>
        {initialDraft.lastPriceUpdate && (
          <p className="text-xs text-gray-400">
            Prezzo {initialDraft.priceIsLive ? 'aggiornato dal mercato' : 'inserito a mano'} il{' '}
            {formatDateShort(initialDraft.lastPriceUpdate)}
          </p>
        )}
      </div>
    </Sheet>
  )
}
