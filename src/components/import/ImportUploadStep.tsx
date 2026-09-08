import { useLiveQuery } from 'dexie-react-hooks'
import { FileUp } from 'lucide-react'
import { db } from '@/db/db'
import type { Institution } from '@/types'

interface ImportUploadStepProps {
  accountId: string
  onAccountChange: (id: string) => void
  onFileSelected: (file: File) => void
  error: string | null
}

export function ImportUploadStep({ accountId, onAccountChange, onFileSelected, error }: ImportUploadStepProps) {
  const accounts = useLiveQuery(() => db.accounts.toArray(), [])

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Conto di destinazione</p>
        <div className="grid grid-cols-2 gap-2">
          {accounts?.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => onAccountChange(a.id)}
              className={`tap-target rounded-xl border p-3 text-left ${
                accountId === a.id
                  ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/30'
                  : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900'
              }`}
            >
              <span className="block text-sm font-semibold text-gray-900 dark:text-gray-100">{a.name}</span>
              <span className="block text-xs text-gray-400">
                {institutionLabel(a.institution)}
              </span>
            </button>
          ))}
        </div>
      </div>

      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-10 text-center dark:border-gray-700 dark:bg-gray-800/50">
        <FileUp className="h-8 w-8 text-gray-400" />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Seleziona file CSV o Excel</span>
        <span className="text-xs text-gray-400">Colonne, formato numeri e categorie rilevati automaticamente</span>
        <input
          type="file"
          accept=".csv,.txt,.xlsx,.xls,text/csv,text/plain,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) onFileSelected(file)
            e.target.value = ''
          }}
        />
      </label>

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  )
}

function institutionLabel(institution: Institution): string {
  return institution === 'santander' ? 'Santander' : 'Trade Republic'
}
