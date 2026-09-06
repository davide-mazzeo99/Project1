import { formatCurrency, formatDateShort } from '@/lib/format'
import type { ImportRowResult } from '@/lib/csv/buildImportRows'

interface ImportSummaryStepProps {
  results: ImportRowResult[]
  savePreset: boolean
  onSavePresetChange: (v: boolean) => void
  presetName: string
  onPresetNameChange: (v: string) => void
}

export function ImportSummaryStep({ results, savePreset, onSavePresetChange, presetName, onPresetNameChange }: ImportSummaryStepProps) {
  const newRows = results.filter((r) => r.valid && !r.isDuplicate)
  const duplicateRows = results.filter((r) => r.valid && r.isDuplicate)
  const invalidRows = results.filter((r) => !r.valid)

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-2">
        <Stat label="Nuove" value={newRows.length} tone="emerald" />
        <Stat label="Duplicate" value={duplicateRows.length} tone="gray" />
        <Stat label="Non valide" value={invalidRows.length} tone="red" />
      </div>

      {newRows.length > 0 && (
        <p className="text-xs text-gray-400">
          Le nuove transazioni verranno importate come <strong>da categorizzare</strong>: potrai assegnare le categorie
          dopo (o farlo fare automaticamente dalle regole, se ne hai già create).
        </p>
      )}

      {invalidRows.length > 0 && (
        <div className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600 dark:bg-red-950/30 dark:text-red-400">
          {invalidRows.length} riga/e non importabili con la mappatura attuale (data o importo non riconosciuti).
          Torna indietro e correggi la mappatura se il numero è alto.
        </div>
      )}

      <div>
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">
          Anteprima nuove transazioni ({Math.min(newRows.length, 50)} di {newRows.length})
        </p>
        <div className="max-h-64 divide-y divide-gray-100 overflow-y-auto rounded-xl border border-gray-100 dark:divide-gray-800 dark:border-gray-800">
          {newRows.slice(0, 50).map((r) => (
            <div key={r.rowIndex} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
              <span className="min-w-0 flex-1 truncate text-gray-700 dark:text-gray-300">{r.description}</span>
              <span className="shrink-0 text-xs text-gray-400">{r.date ? formatDateShort(r.date) : ''}</span>
              <span className="shrink-0 font-semibold tabular-nums text-gray-900 dark:text-gray-100">
                {formatCurrency(r.amount ?? 0, { signed: true })}
              </span>
            </div>
          ))}
          {newRows.length === 0 && (
            <p className="px-3 py-4 text-center text-sm text-gray-400">Nessuna transazione nuova da importare.</p>
          )}
        </div>
      </div>

      <div className="rounded-xl bg-gray-50 p-3 dark:bg-gray-800/50">
        <label className="flex items-center justify-between text-sm text-gray-700 dark:text-gray-300">
          Salva questa mappatura come preset riutilizzabile
          <input
            type="checkbox"
            checked={savePreset}
            onChange={(e) => onSavePresetChange(e.target.checked)}
            className="h-5 w-5"
          />
        </label>
        {savePreset && (
          <input
            type="text"
            value={presetName}
            onChange={(e) => onPresetNameChange(e.target.value)}
            placeholder="Nome preset"
            className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          />
        )}
      </div>
    </div>
  )
}

function Stat({ label, value, tone }: { label: string; value: number; tone: 'emerald' | 'gray' | 'red' }) {
  const toneClasses = {
    emerald: 'text-emerald-600 dark:text-emerald-400',
    gray: 'text-gray-500 dark:text-gray-400',
    red: 'text-red-500',
  }[tone]
  return (
    <div className="rounded-xl bg-gray-50 py-3 text-center dark:bg-gray-800/50">
      <div className={`text-xl font-bold tabular-nums ${toneClasses}`}>{value}</div>
      <div className="text-[11px] text-gray-400">{label}</div>
    </div>
  )
}
