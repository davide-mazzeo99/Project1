import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { ChevronRight, Tag, Wand2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { db } from '@/db/db'
import { useToast } from '@/components/ui/Toast'
import { BackupSection } from '@/components/settings/BackupSection'

export function SettingsPage() {
  const { showToast } = useToast()
  const settings = useLiveQuery(() => db.settings.get('settings'), [])
  const [apiKey, setApiKey] = useState('')

  useEffect(() => {
    setApiKey(settings?.priceApiKey ?? '')
  }, [settings?.priceApiKey])

  async function handleSaveApiKey() {
    await db.settings.update('settings', { priceApiKey: apiKey.trim() || undefined })
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
      </div>

      <h2 className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wide text-gray-400">Portafoglio</h2>
      <div className="rounded-xl bg-white p-3.5 shadow-sm dark:bg-gray-900">
        <label className="flex flex-col gap-1 text-xs font-medium text-gray-500 dark:text-gray-400">
          API key prezzi (opzionale)
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
          In questa versione i prezzi si aggiornano solo manualmente dalla scheda Portafoglio: nessuna chiamata di
          rete viene mai fatta. Il campo è pronto per un eventuale aggiornamento automatico futuro — l'app continuerà
          comunque a funzionare interamente offline anche senza chiave impostata.
        </p>
      </div>

      <BackupSection />
    </div>
  )
}
