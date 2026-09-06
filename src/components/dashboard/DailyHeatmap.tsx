import { useState } from 'react'
import { endOfMonth, format, getDay, parseISO } from 'date-fns'
import { formatCurrency } from '@/lib/format'

interface DailyHeatmapProps {
  month: string
  dailyTotals: Map<string, number>
}

const WEEKDAY_LABELS = ['L', 'M', 'M', 'G', 'V', 'S', 'D']

function intensityClass(ratio: number): string {
  if (ratio === 0) return 'bg-gray-100 dark:bg-gray-800'
  if (ratio < 0.25) return 'bg-brand-100 dark:bg-brand-900/40'
  if (ratio < 0.5) return 'bg-brand-300 dark:bg-brand-800/70'
  if (ratio < 0.75) return 'bg-brand-500'
  return 'bg-brand-700'
}

export function DailyHeatmap({ month, dailyTotals }: DailyHeatmapProps) {
  const [selected, setSelected] = useState<string | null>(null)
  const monthStart = parseISO(`${month}-01`)
  const monthEnd = endOfMonth(monthStart)
  const daysInMonth = monthEnd.getDate()
  const max = Math.max(1, ...Array.from(dailyTotals.values()))

  const firstWeekday = (getDay(monthStart) + 6) % 7 // Monday = 0
  const cells: (string | null)[] = Array.from({ length: firstWeekday }, () => null)
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(`${month}-${String(d).padStart(2, '0')}`)
  }

  return (
    <div>
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-gray-400">
        {WEEKDAY_LABELS.map((w, i) => (
          <span key={i}>{w}</span>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((date, i) => {
          if (!date) return <div key={i} />
          const value = dailyTotals.get(date) ?? 0
          const ratio = value / max
          return (
            <button
              key={date}
              onClick={() => setSelected(date)}
              className={`tap-target flex aspect-square items-center justify-center rounded-md text-[10px] font-medium ${intensityClass(ratio)} ${
                ratio >= 0.5 ? 'text-white' : 'text-gray-600 dark:text-gray-300'
              }`}
            >
              {Number(date.slice(-2))}
            </button>
          )
        })}
      </div>
      {selected && (
        <p className="mt-2 text-center text-xs text-gray-500 dark:text-gray-400">
          {format(parseISO(selected), 'd MMMM')}: <strong>{formatCurrency(dailyTotals.get(selected) ?? 0)}</strong> di
          spese
        </p>
      )}
    </div>
  )
}
