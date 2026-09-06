import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router-dom'
import { AlertTriangle, X } from 'lucide-react'
import { db } from '@/db/db'

function daysSince(timestamp: number): number {
  return Math.floor((Date.now() - timestamp) / (1000 * 60 * 60 * 24))
}

export function BackupReminderBanner() {
  const settings = useLiveQuery(() => db.settings.get('settings'), [])
  const hasTransactions = useLiveQuery(() => db.transactions.count(), [], 0) > 0
  const [dismissed, setDismissed] = useState(false)

  if (dismissed || !hasTransactions) return null

  const lastBackupAt = settings?.lastBackupAt
  const days = lastBackupAt ? daysSince(lastBackupAt) : null
  const shouldRemind = days === null || days >= 30
  if (!shouldRemind) return null

  return (
    <div className="flex items-start gap-2 rounded-2xl bg-amber-50 p-3.5 text-sm dark:bg-amber-950/30">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
      <div className="min-w-0 flex-1">
        <p className="font-medium text-amber-700 dark:text-amber-400">
          {days === null ? 'Non hai ancora fatto un backup' : `Non fai un backup da ${days} giorni`}
        </p>
        <p className="mt-0.5 text-xs text-amber-600/80 dark:text-amber-400/70">
          I tuoi dati sono solo su questo dispositivo. Esportane una copia dalle Impostazioni.
        </p>
        <Link
          to="/impostazioni"
          className="mt-1.5 inline-block text-xs font-semibold text-amber-700 underline dark:text-amber-400"
        >
          Vai al backup
        </Link>
      </div>
      <button
        onClick={() => setDismissed(true)}
        aria-label="Chiudi"
        className="tap-target -mr-1 -mt-1 flex items-center justify-center text-amber-500"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
