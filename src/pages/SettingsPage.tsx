import { useEffect, useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { ChevronRight, Tag, Users, Wand2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { db } from '@/db/db'
import { useToast } from '@/components/ui/Toast'
import { BackupSection } from '@/components/settings/BackupSection'
import { computePersonBalances } from '@/lib/analytics/splits'
import { formatCurrency } from '@/lib/format'
import type { Person, Transaction } from '@/types'

export function SettingsPage() {
  const { showToast } = useToast()
  const settings = useLiveQuery(() => db.settings.get('settings'), [])
  const [apiKey, setApiKey] = useState('')
  const [coinGeckoApiKey, setCoinGeckoApiKey] = useState('')
  const people = useLiveQuery(() => db.people.toArray(), [], [] as Person[])
  const transactions = useLiveQuery(() => db.transactions.toArray(), [], [] as Transaction[])
  const totalOwedToMe = useMemo(
    () => computePersonBalances(transactions, people).reduce((sum, b) => sum + b.totalOwed, 0),
    [transactions, people],
  )

  useEffect(() => {
    setApiKey(settings?.priceApiKey ?? '')
    setCoinGeckoApiKey(settings?.coinGeckoApiKey ?? '')
  }, [settings?.priceApiKey, settings?.coinGeckoApiKey])

  async function handleSaveApiKey() {
    await db.settings.update('settings', { priceApiKey: apiKey.trim() || undefined })
    showToast('Preferenze salvate')
  }

  async function handleSaveCoinGeckoApiKey() {
    await db.settings.update('settings', { coinGeckoApiKey: coinGeckoApiKey.trim() || undefined })
    showToast('Preferenze salvate')
  }

  return (
    <div className="px-4 pt-4">
      <h1 className="mb-3 text-2xl font-bold text-gray-900 dark:text-gray-100">Impostazioni</h1>

      <div className="divide-y divide-gray-100 overflow-hidden rounded-xl bg-white dark:divide-gray-800 dark:bg-gray-900">
        <Link
          to="/impostazioni/categorie"
          className="tap-target flex items-center gap-3 px-3 py-3 active:bg-gray-50 dark:active:bg-gray-800/60"
        >
          <Tag className="h-5 w-5 text-gray-400" />
          <span className="flex-1 text-sm font-medium text-gray-900 dark:text-gray-100">Categorie</span>
          <ChevronRight className="h-4 w-4 text-gray-300" />
        </Link>
        <Link
          to="/impostazioni/regole"
          className="tap-target flex items-center gap-3 px-3 py-3 active:bg-gray-50 dark:active:bg-gray-800/60"
        >
          <Wand2 className="h-5 w-5 text-gray-400" />
          <span className="flex-1 text-sm font-medium text-gray-900 dark:text-gray-100">Regole di categorizzazione</span>
          <ChevronRight className="h-4 w-4 text-gray-300" />
        </Link>
        <Link
          to="/impostazioni/persone"
          className="tap-target flex items-center gap-3 px-3 py-3 active:bg-gray-50 dark:active:bg-gray-800/60"
        >
          <Users className="h-5 w-5 text-gray-400" />
          <span className="flex-1 text-sm font-medium text-gray-900 dark:text-gray-100">Persone</span>
          {totalOwedToMe > 0 && (
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
              {formatCurrency(totalOwedToMe)}
            </span>
          )}
          <ChevronRight className="h-4 w-4 text-gray-300" />
        </Link>
      </div>

      <h2 className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wide text-gray-400">Portafoglio</h2>
      <div className="rounded-xl bg-white p-3.5 shadow-sm dark:bg-gray-900">
        <label className="flex flex-col gap-1 text-xs font-medium text-gray-500 dark:text-gray-400">
          API key Twelve Data (per azionario e obbligazionario)
          <input
            type="text"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            onBlur={handleSaveApiKey}
            placeholder="Non configurata"
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          />
        </label>
        <p className="mt-2 text-xs text-gray-400">
          Serve una API key gratuita tua da{' '}
          <a href="https://twelvedata.com/pricing" target="_blank" rel="noreferrer" className="underline">
            Twelve Data
          </a>{' '}
          (creane una sul loro sito e incollala qui). Se i prezzi non si aggiornano nonostante la chiave sia
          corretta, controlla nella dashboard Twelve Data, sotto "API Usage" → domini autorizzati, che il dominio
          da cui apri l'app sia nell'elenco: senza questo il browser blocca la richiesta.
        </p>

        <label className="mt-4 flex flex-col gap-1 text-xs font-medium text-gray-500 dark:text-gray-400">
          API key CoinGecko Demo (opzionale, per le cripto)
          <input
            type="text"
            value={coinGeckoApiKey}
            onChange={(e) => setCoinGeckoApiKey(e.target.value)}
            onBlur={handleSaveCoinGeckoApiKey}
            placeholder="Non configurata"
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          />
        </label>
        <p className="mt-2 text-xs text-gray-400">
          Le cripto si aggiornano da{' '}
          <a href="https://www.coingecko.com/en/developers/dashboard" target="_blank" rel="noreferrer" className="underline">
            CoinGecko
          </a>
          : funziona anche senza chiave con un uso leggero, ma se i prezzi smettono di aggiornarsi crea una chiave
          "Demo" gratuita sul loro sito e incollala qui per un accesso più affidabile.
        </p>

        <p className="mt-3 border-t border-gray-100 pt-3 text-xs text-gray-400 dark:border-gray-800">
          Ogni volta che apri la scheda Portafoglio, e poi ogni 5 minuti mentre la tieni aperta, l'app riprova
          automaticamente ad aggiornare tutti i prezzi — puoi anche forzarlo subito con l'icona in alto nella
          scheda. Il prezzo resta comunque sempre modificabile a mano, e se sei offline o una chiave manca l'app
          continua a funzionare con l'ultimo prezzo salvato — nessuna funzione smette di funzionare senza rete.
        </p>
      </div>

      <BackupSection />
    </div>
  )
}
