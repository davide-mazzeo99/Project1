import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { formatCurrency, formatPercent } from '@/lib/format'
import type { Category } from '@/types'

interface CategoryDonutChartProps {
  categoryTotals: Map<string, number>
  categoryById: Map<string, Category>
  /** categoryId, or 'uncategorized' for the fallback bucket */
  onSelectCategory: (categoryKey: string) => void
}

export function CategoryDonutChart({ categoryTotals, categoryById, onSelectCategory }: CategoryDonutChartProps) {
  const entries = Array.from(categoryTotals.entries())
    .map(([id, value]) => ({
      id,
      value,
      name: id === 'uncategorized' ? 'Da categorizzare' : categoryById.get(id)?.name ?? 'Sconosciuta',
      color: id === 'uncategorized' ? '#94a3b8' : categoryById.get(id)?.color ?? '#94a3b8',
    }))
    .sort((a, b) => b.value - a.value)

  const total = entries.reduce((s, e) => s + e.value, 0)

  if (entries.length === 0 || total === 0) {
    return <p className="py-10 text-center text-sm text-gray-400">Nessuna spesa questo mese.</p>
  }

  return (
    <div>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={entries}
              dataKey="value"
              nameKey="name"
              innerRadius="58%"
              outerRadius="90%"
              paddingAngle={2}
              stroke="none"
              onClick={(entry) => onSelectCategory(entry.id)}
            >
              {entries.map((e) => (
                <Cell key={e.id} fill={e.color} className="cursor-pointer" />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number, _name, item) => [
                formatCurrency(value),
                item.payload.name,
              ]}
              contentStyle={{ borderRadius: 12, fontSize: 12, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-2 flex flex-col gap-1.5">
        {entries.slice(0, 6).map((e) => (
          <button
            key={e.id}
            onClick={() => onSelectCategory(e.id)}
            className="tap-target flex items-center gap-2 rounded-lg px-1.5 py-1 text-left active:bg-gray-50 dark:active:bg-gray-800/60"
          >
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: e.color }} />
            <span className="min-w-0 flex-1 truncate text-xs text-gray-600 dark:text-gray-300">{e.name}</span>
            <span className="shrink-0 text-xs font-semibold tabular-nums text-gray-900 dark:text-gray-100">
              {formatCurrency(e.value)}
            </span>
            <span className="w-10 shrink-0 text-right text-[10px] text-gray-400">
              {formatPercent(e.value / total)}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
