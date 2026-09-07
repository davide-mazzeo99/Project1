import { useState } from 'react'
import { Search } from 'lucide-react'
import { searchSymbols, type SymbolSearchResult } from '@/lib/prices/fetchPrices'

/**
 * Cerca il simbolo giusto direttamente su Twelve Data invece di doverlo indovinare: i simboli
 * usati per indici/azioni/ETF non seguono sempre le convenzioni comuni (es. Yahoo Finance).
 */
export function SymbolSearchPicker({
  apiKey,
  onPick,
}: {
  apiKey: string | undefined
  onPick: (result: SymbolSearchResult) => void
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SymbolSearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [searched, setSearched] = useState(false)

  async function handleSearch() {
    if (!apiKey || !query.trim() || searching) return
    setSearching(true)
    try {
      setResults(await searchSymbols(query, apiKey))
      setSearched(true)
    } finally {
      setSearching(false)
    }
  }

  if (!apiKey) {
    return (
      <p className="mt-2 text-[11px] text-amber-600 dark:text-amber-400">
        Serve la API key Twelve Data in Impostazioni per cercare i simboli disponibili.
      </p>
    )
  }

  return (
    <div className="mt-3 flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Cerca per nome, es. Apple o FTSE MIB"
          className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
        />
        <button
          type="button"
          onClick={handleSearch}
          disabled={searching}
          className="tap-target flex items-center justify-center rounded-lg bg-gray-100 px-3 py-2 text-gray-600 disabled:opacity-50 dark:bg-gray-800 dark:text-gray-300"
          aria-label="Cerca simbolo"
        >
          <Search className="h-4 w-4" />
        </button>
      </div>

      {results.length > 0 && (
        <div className="max-h-56 divide-y divide-gray-100 overflow-y-auto rounded-lg border border-gray-100 dark:divide-gray-800 dark:border-gray-800">
          {results.slice(0, 8).map((r) => (
            <button
              key={`${r.symbol}-${r.exchange}`}
              type="button"
              onClick={() => onPick(r)}
              className="tap-target flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left active:bg-gray-50 dark:active:bg-gray-800/60"
            >
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {r.symbol} <span className="font-normal text-gray-400">· {r.exchange}</span>
              </span>
              <span className="text-xs text-gray-400">
                {r.name} · {r.instrumentType}
              </span>
            </button>
          ))}
        </div>
      )}
      {searched && !searching && results.length === 0 && (
        <p className="text-[11px] text-gray-400">Nessun risultato per "{query}".</p>
      )}
    </div>
  )
}
