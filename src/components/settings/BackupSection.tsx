import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { AlertTriangle, Download, Upload } from 'lucide-react'
import { db } from '@/db/db'
import { Sheet } from '@/components/ui/Sheet'
import { useToast } from '@/components/ui/Toast'
import { downloadBackup, parseBackupFile, restoreBackup, type ParsedBackupResult } from '@/lib/backup/exportImport'
import { formatDateShort } from '@/lib/format'

function daysSince(timestamp: number): number {
  return Math.floor((Date.now() - timestamp) / (1000 * 60 * 60 * 24))
}

export function BackupSection() {
  const { showToast } = useToast()
  const settings = useLiveQuery(() => db.settings.get('settings'), [])
  const [pendingImport, setPendingImport] = useState<ParsedBackupResult | null>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const [restoring, setRestoring] = useState(false)

  const lastBackupAt = settings?.lastBackupAt
  const days = lastBackupAt ? daysSince(lastBackupAt) : null

  async function handleExport() {
    await downloadBackup()
    showToast('Backup esportato')
  }

  async function handleFileSelected(file: File) {
    setImportError(null)
    const result = await parseBackupFile(file)
    if (!result.ok) {
      setImportError(result.error)
      return
    }
    setPendingImport(result)
  }

  async function handleConfirmRestore() {
    if (!pendingImport) return
    setRestoring(true)
    try {
      await restoreBackup(pendingImport.backup)
      showToast('Backup ripristinato')
      setPendingImport(null)
    } finally {
      setRestoring(false)
    }
  }

  return (
    <div>
      <h2 className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wide text-gray-400">Backup</h2>

      {days !== null && days >= 30 && (
        <div className="mb-2 flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Non fai un backup da {days} giorni. iOS può cancellare i dati dell'app se resta inutilizzata a lungo:
            esportane uno ora per essere al sicuro.
          </span>
        </div>
      )}

      <div className="flex flex-col gap-2 rounded-xl bg-white p-3.5 shadow-sm dark:bg-gray-900">
        <p className="text-xs text-gray-400">
          {lastBackupAt ? `Ultimo backup: ${formatDateShort(new Date(lastBackupAt).toISOString().slice(0, 10))}` : 'Nessun backup ancora effettuato'}
        </p>

        <button
          onClick={handleExport}
          className="tap-target flex items-center justify-center gap-2 rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white active:bg-brand-700"
        >
          <Download className="h-4 w-4" /> Esporta backup (JSON)
        </button>

        <label className="tap-target flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-gray-100 py-2.5 text-sm font-semibold text-gray-700 active:bg-gray-200 dark:bg-gray-800 dark:text-gray-200">
          <Upload className="h-4 w-4" /> Ripristina da backup
          <input
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFileSelected(file)
              e.target.value = ''
            }}
          />
        </label>

        {importError && <p className="text-xs text-red-500">{importError}</p>}
      </div>

      <Sheet
        open={!!pendingImport}
        onClose={() => setPendingImport(null)}
        title="Ripristinare il backup?"
        footer={
          <div className="flex gap-2">
            <button
              onClick={() => setPendingImport(null)}
              className="tap-target flex-1 rounded-xl bg-gray-100 py-2.5 text-sm font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-200"
            >
              Annulla
            </button>
            <button
              onClick={handleConfirmRestore}
              disabled={restoring}
              className="tap-target flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white active:bg-red-700 disabled:opacity-50"
            >
              {restoring ? 'Ripristino...' : 'Sostituisci tutto'}
            </button>
          </div>
        }
      >
        {pendingImport && (
          <div className="flex flex-col gap-2 text-sm text-gray-600 dark:text-gray-300">
            <p className="font-medium text-red-500">
              Questa operazione sostituirà TUTTI i dati attuali dell'app con quelli del backup. Non è reversibile.
            </p>
            <p>Il backup contiene:</p>
            <ul className="list-disc pl-5 text-xs text-gray-500 dark:text-gray-400">
              <li>{pendingImport.counts.transactions} transazioni</li>
              <li>{pendingImport.counts.categories} categorie</li>
              <li>{pendingImport.counts.rules} regole</li>
              <li>{pendingImport.counts.holdings} posizioni di portafoglio</li>
              <li>{pendingImport.counts.budgets} budget</li>
            </ul>
          </div>
        )}
      </Sheet>
    </div>
  )
}
