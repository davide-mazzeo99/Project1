import { useEffect, useMemo, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { ChevronLeft, ExternalLink, Plus, RefreshCw, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { db } from '@/db/db'
import { Sheet } from '@/components/ui/Sheet'
import { SymbolSearchPicker } from '@/components/portfolio/SymbolSearchPicker'
import { useToast } from '@/components/ui/Toast'
import { ensureDefaultIndices, addIndex, deleteIndex, refreshIndexPrices, updateIndexTicker } from '@/db/repo/indices'
import { formatCurrency, formatPercent } from '@/lib/format'
import type { MarketIndex } from '@/types'

const INVESTING_URL = 'https://it.investing.com/indices/major-indices'

/** Ogni quanto riprovare l'aggiornamento mentre la pagina resta aperta, come nel Portafoglio. */
const AUTO_REFRESH_INTERVAL_MS = 5 * 60 * 1000

function IndexRow({ index, onTap }: { index: MarketIndex; onTap: () => void }) {
  const positive = (index.changePercent ?? 0) >= 0
  return (
    <button
      onClick={onTap}
      className="tap-target flex w-full items-center gap-3 px-3 py-3 text-left active:bg-gray-50 dark:active:bg-gray-800/60"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">{index.name}</p>
        <p className="text-xs text-gray-400">{index.ticker}</p>
      </div>
      {index.currentPrice !== null ? (
        <div className="shrink-0 text-right">
          <p className="text-sm font-semibold tabular-nums text-gray-900 dark:text-gray-100">
            {formatCurrency(index.currentPrice)}
          </p>
          {index.changePercent !== null && (
            <p className={`text-xs tabular-nums ${positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
              {positive ? '+' : ''}
              {formatPercent(index.changePercent / 100, 2)}
            </p>
          )}
        </div>
      ) : (
        <p className="shrink-0 text-xs text-gray-400">Non aggiornato</p>
      )}
    </button>
  )
}

export function MarketsPage() {
  const { showToast } = useToast()
  const indices = useLiveQuery(() => db.marketIndices.toArray(), [], [] as MarketIndex[])
  const settings = useLiveQuery(() => db.settings.get('settings'), [])
  const [editing, setEditing] = useState<MarketIndex | null>(null)
  const [tickerInput, setTickerInput] = useState('')
  const [draft, setDraft] = useState<{ name: string; ticker: string; region: 'italia' | 'mondo' } | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [lastRefreshAt, setLastRefreshAt] = useState<Date | null>(null)
  const autoRefreshedRef = useRef(false)
  const refreshingRef = useRef(false)

  useEffect(() => {
    ensureDefaultIndices()
  }, [])

  useEffect(() => {
    setTickerInput(editing?.ticker ?? '')
  }, [editing])

  async function handleRefresh(silent = false) {
    if (indices.length === 0 || refreshingRef.current) return
    refreshingRef.current = true
    setRefreshing(true)
    try {
      const { updated, failed } = await refreshIndexPrices(settings?.priceApiKey)
      setLastRefreshAt(new Date())
      if (!silent || updated > 0) {
        if (!settings?.priceApiKey) {
          showToast('Manca la API key Twelve Data in Impostazioni')
        } else if (updated === 0) {
          showToast(failed > 0 ? 'Nessun indice aggiornato: controlla i ticker' : 'Nessun indice da aggiornare')
        } else {
          showToast(`${updated} indici aggiornati${failed > 0 ? `, ${failed} non trovati` : ''}`)
        }
      }
    } finally {
      refreshingRef.current = false
      setRefreshing(false)
    }
  }

  useEffect(() => {
    if (autoRefreshedRef.current || indices.length === 0) return
    autoRefreshedRef.current = true
    handleRefresh(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [indices.length])

  useEffect(() => {
    if (indices.length === 0) return
    const id = setInterval(() => handleRefresh(true), AUTO_REFRESH_INTERVAL_MS)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [indices.length, settings?.priceApiKey])

  const italia = useMemo(() => indices.filter((i) => i.region === 'italia'), [indices])
  const mondo = useMemo(() => indices.filter((i) => i.region === 'mondo'), [indices])

  async function handleSaveTicker() {
    if (!editing) return
    await updateIndexTicker(editing.id, tickerInput)
    setEditing(null)
    showToast('Ticker aggiornato')
  }

  async function handleDelete() {
    if (!editing) return
    await deleteIndex(editing.id)
    setEditing(null)
    showToast('Indice rimosso')
  }

  async function handleAddIndex() {
    if (!draft || !draft.name.trim() || !draft.ticker.trim()) return
    await addIndex(draft)
    setDraft(null)
    showToast('Indice aggiunto')
  }

  return (
    <div className="px-4 pb-24 pt-4">
      <div className="mb-2 flex items-center gap-2">
        <Link
          to="/portafoglio"
          className="tap-target -ml-2 flex items-center justify-center rounded-full text-gray-500 active:bg-gray-200 dark:text-gray-400 dark:active:bg-gray-800"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h1 className="flex-1 text-2xl font-bold text-gray-900 dark:text-gray-100">Mercati</h1>
        {lastRefreshAt && (
          <span className="text-[11px] text-gray-400">
            Aggiornato alle {lastRefreshAt.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
        <button
          onClick={() => handleRefresh(false)}
          disabled={refreshing}
          aria-label="Aggiorna indici"
          className="tap-target flex items-center justify-center rounded-full text-gray-500 active:bg-gray-200 disabled:opacity-50 dark:text-gray-400 dark:active:bg-gray-800"
        >
          <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <p className="mb-3 text-xs text-gray-400">
        Solo di riferimento: gli indici non contano nel valore o nel P/L del Portafoglio, dato che non sono una
        posizione investita. I prezzi arrivano da Twelve Data (stessa API key di Azionario/Obbligazionario in
        Impostazioni) e si aggiornano da soli ogni 5 minuti mentre resti su questa scheda. Se un indice mostra
        "Non aggiornato", il ticker di default potrebbe non corrispondere a quello usato da Twelve Data: toccalo
        per correggerlo.
      </p>

      {italia.length > 0 && (
        <>
          <h2 className="mb-1.5 mt-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Italia</h2>
          <div className="divide-y divide-gray-100 overflow-hidden rounded-xl bg-white dark:divide-gray-800 dark:bg-gray-900">
            {italia.map((index) => (
              <IndexRow key={index.id} index={index} onTap={() => setEditing(index)} />
            ))}
          </div>
        </>
      )}

      {mondo.length > 0 && (
        <>
          <h2 className="mb-1.5 mt-4 text-xs font-semibold uppercase tracking-wide text-gray-400">Mondo</h2>
          <div className="divide-y divide-gray-100 overflow-hidden rounded-xl bg-white dark:divide-gray-800 dark:bg-gray-900">
            {mondo.map((index) => (
              <IndexRow key={index.id} index={index} onTap={() => setEditing(index)} />
            ))}
          </div>
        </>
      )}

      <button
        onClick={() => setDraft({ name: '', ticker: '', region: 'mondo' })}
        className="tap-target mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gray-100 py-2.5 text-sm font-semibold text-gray-600 active:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
      >
        <Plus className="h-4 w-4" /> Aggiungi indice
      </button>

      <a
        href={INVESTING_URL}
        target="_blank"
        rel="noreferrer"
        className="tap-target mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-white py-2.5 text-sm font-semibold text-brand-600 shadow-sm active:bg-gray-50 dark:bg-gray-900 dark:active:bg-gray-800/60"
      >
        <ExternalLink className="h-4 w-4" /> Apri l'elenco completo su Investing.com
      </a>

      <Sheet
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing?.name ?? ''}
        footer={
          <div className="flex gap-2">
            <button
              onClick={handleDelete}
              className="tap-target flex items-center justify-center gap-1.5 rounded-xl bg-red-50 px-4 text-sm font-semibold text-red-600 active:bg-red-100 dark:bg-red-950/40"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button
              onClick={handleSaveTicker}
              className="tap-target flex-1 rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white active:bg-brand-700"
            >
              Salva
            </button>
          </div>
        }
      >
        <label className="flex flex-col gap-1 text-xs font-medium text-gray-500 dark:text-gray-400">
          Ticker Twelve Data
          <input
            type="text"
            value={tickerInput}
            onChange={(e) => setTickerInput(e.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          />
        </label>
        <SymbolSearchPicker apiKey={settings?.priceApiKey} onPick={(r) => setTickerInput(r.symbol)} />
      </Sheet>

      <Sheet
        open={!!draft}
        onClose={() => setDraft(null)}
        title="Nuovo indice"
        footer={
          <button
            onClick={handleAddIndex}
            className="tap-target w-full rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white active:bg-brand-700"
          >
            Aggiungi
          </button>
        }
      >
        {draft && (
          <div className="flex flex-col gap-4">
            <label className="flex flex-col gap-1 text-xs font-medium text-gray-500 dark:text-gray-400">
              Nome
              <input
                type="text"
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                placeholder="Es. IBEX 35"
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium text-gray-500 dark:text-gray-400">
              Ticker Twelve Data
              <input
                type="text"
                value={draft.ticker}
                onChange={(e) => setDraft({ ...draft, ticker: e.target.value })}
                placeholder="Es. IBEX"
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              />
            </label>
            <SymbolSearchPicker
              apiKey={settings?.priceApiKey}
              onPick={(r) => setDraft({ ...draft, ticker: r.symbol, name: draft.name || r.name })}
            />
            <div>
              <p className="mb-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">Regione</p>
              <div className="grid grid-cols-2 gap-2">
                {(['italia', 'mondo'] as const).map((region) => (
                  <button
                    key={region}
                    type="button"
                    onClick={() => setDraft({ ...draft, region })}
                    className={`tap-target rounded-xl border py-2 text-sm font-semibold capitalize transition-colors ${
                      draft.region === region
                        ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300'
                        : 'border-gray-200 bg-gray-50 text-gray-600 dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-300'
                    }`}
                  >
                    {region}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </Sheet>
    </div>
  )
}
