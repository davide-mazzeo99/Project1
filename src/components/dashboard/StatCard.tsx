import type { ReactNode } from 'react'

interface StatCardProps {
  label: string
  value: string
  tone?: 'default' | 'emerald' | 'red' | 'amber'
  hint?: ReactNode
}

const TONE_CLASSES: Record<NonNullable<StatCardProps['tone']>, string> = {
  default: 'text-gray-900 dark:text-gray-100',
  emerald: 'text-emerald-600 dark:text-emerald-400',
  red: 'text-red-500',
  amber: 'text-amber-500',
}

export function StatCard({ label, value, tone = 'default', hint }: StatCardProps) {
  return (
    <div className="rounded-2xl bg-white p-3.5 shadow-sm dark:bg-gray-900">
      <p className="text-xs text-gray-400">{label}</p>
      <p className={`mt-0.5 text-xl font-bold tabular-nums ${TONE_CLASSES[tone]}`}>{value}</p>
      {hint && <div className="mt-1 text-[11px] text-gray-400">{hint}</div>}
    </div>
  )
}
