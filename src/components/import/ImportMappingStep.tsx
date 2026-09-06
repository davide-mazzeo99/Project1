import type { DecimalFormat } from '@/lib/csv/numberFormat'
import type { DateFormat } from '@/lib/csv/dateFormat'
import type { DetectedEncoding } from '@/lib/csv/decode'

export interface MappingState {
  hasHeaderRow: boolean
  delimiter: string
  encoding: DetectedEncoding
  dateColumn: number
  amountColumn: number
  descriptionColumn: number
  balanceColumn: number | null
  dateFormat: DateFormat
  decimalFormat: DecimalFormat
}

interface ImportMappingStepProps {
  rows: string[][]
  mapping: MappingState
  onChange: (mapping: MappingState) => void
  autoDetected: boolean
}

const DELIMITER_LABELS: Record<string, string> = { ',': 'Virgola (,)', ';': 'Punto e virgola (;)', '\t': 'Tabulazione' }
const ROLE_FIELDS: { key: 'dateColumn' | 'amountColumn' | 'descriptionColumn'; label: string }[] = [
  { key: 'dateColumn', label: 'Data' },
  { key: 'amountColumn', label: 'Importo' },
  { key: 'descriptionColumn', label: 'Descrizione' },
]

export function ImportMappingStep({ rows, mapping, onChange, autoDetected }: ImportMappingStepProps) {
  const columnCount = Math.max(1, ...rows.slice(0, 10).map((r) => r.length))
  const headerRow = mapping.hasHeaderRow ? rows[0] : null
  const previewRows = (mapping.hasHeaderRow ? rows.slice(1) : rows).slice(0, 10)

  function columnLabel(idx: number): string {
    const header = headerRow?.[idx]?.trim()
    return header ? header : `Colonna ${idx + 1}`
  }

  return (
    <div className="flex flex-col gap-4">
      <div
        className={`rounded-xl px-3 py-2 text-xs ${
          autoDetected
            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
            : 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400'
        }`}
      >
        {autoDetected
          ? 'Colonne rilevate automaticamente: controlla l’anteprima e conferma.'
          : 'Formato non riconosciuto automaticamente: assegna tu le colonne qui sotto.'}
      </div>

      <label className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2.5 text-sm text-gray-700 dark:bg-gray-800/50 dark:text-gray-300">
        La prima riga è un'intestazione
        <input
          type="checkbox"
          checked={mapping.hasHeaderRow}
          onChange={(e) => onChange({ ...mapping, hasHeaderRow: e.target.checked })}
          className="h-5 w-5"
        />
      </label>

      <div className="no-scrollbar overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-800">
        <table className="min-w-full border-collapse text-xs">
          <thead>
            <tr>
              {Array.from({ length: columnCount }).map((_, idx) => (
                <th key={idx} className="whitespace-nowrap border-b border-gray-100 bg-gray-50 px-2 py-1.5 text-left font-medium text-gray-500 dark:border-gray-800 dark:bg-gray-800/50 dark:text-gray-400">
                  {columnLabel(idx)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {previewRows.map((row, ri) => (
              <tr key={ri} className="odd:bg-white even:bg-gray-50/50 dark:odd:bg-gray-900 dark:even:bg-gray-800/20">
                {Array.from({ length: columnCount }).map((_, ci) => (
                  <td key={ci} className="whitespace-nowrap border-b border-gray-50 px-2 py-1 text-gray-700 dark:border-gray-800/60 dark:text-gray-300">
                    {row[ci] ?? ''}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {ROLE_FIELDS.map(({ key, label }) => (
          <label key={key} className="flex flex-col gap-1 text-xs font-medium text-gray-500 dark:text-gray-400">
            Colonna {label}
            <select
              value={mapping[key]}
              onChange={(e) => onChange({ ...mapping, [key]: Number(e.target.value) })}
              className="rounded-lg border border-gray-200 bg-white px-2 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            >
              {Array.from({ length: columnCount }).map((_, idx) => (
                <option key={idx} value={idx}>
                  {columnLabel(idx)}
                </option>
              ))}
            </select>
          </label>
        ))}

        <label className="flex flex-col gap-1 text-xs font-medium text-gray-500 dark:text-gray-400">
          Colonna Saldo (opzionale)
          <select
            value={mapping.balanceColumn ?? -1}
            onChange={(e) => onChange({ ...mapping, balanceColumn: Number(e.target.value) === -1 ? null : Number(e.target.value) })}
            className="rounded-lg border border-gray-200 bg-white px-2 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          >
            <option value={-1}>Nessuna</option>
            {Array.from({ length: columnCount }).map((_, idx) => (
              <option key={idx} value={idx}>
                {columnLabel(idx)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-xs font-medium text-gray-500 dark:text-gray-400">
          Formato data
          <select
            value={mapping.dateFormat}
            onChange={(e) => onChange({ ...mapping, dateFormat: e.target.value as DateFormat })}
            className="rounded-lg border border-gray-200 bg-white px-2 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          >
            <option value="DD/MM/YYYY">GG/MM/AAAA</option>
            <option value="YYYY-MM-DD">AAAA-MM-GG</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-gray-500 dark:text-gray-400">
          Formato numeri
          <select
            value={mapping.decimalFormat}
            onChange={(e) => onChange({ ...mapping, decimalFormat: e.target.value as DecimalFormat })}
            className="rounded-lg border border-gray-200 bg-white px-2 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          >
            <option value="european">Europeo (1.234,56)</option>
            <option value="standard">Standard (1,234.56)</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-gray-500 dark:text-gray-400">
          Separatore
          <select
            value={mapping.delimiter}
            onChange={(e) => onChange({ ...mapping, delimiter: e.target.value })}
            className="rounded-lg border border-gray-200 bg-white px-2 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          >
            {Object.entries(DELIMITER_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-gray-500 dark:text-gray-400">
          Encoding
          <select
            value={mapping.encoding}
            onChange={(e) => onChange({ ...mapping, encoding: e.target.value as DetectedEncoding })}
            className="rounded-lg border border-gray-200 bg-white px-2 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          >
            <option value="utf-8">UTF-8</option>
            <option value="iso-8859-1">ISO-8859-1</option>
          </select>
        </label>
      </div>
    </div>
  )
}
