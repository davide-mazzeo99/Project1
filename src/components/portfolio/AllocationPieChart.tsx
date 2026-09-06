import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { formatCurrency, formatPercent } from '@/lib/format'
import type { HoldingMetrics } from '@/lib/analytics/portfolio'

const PALETTE = ['#3182f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899', '#84cc16']

export function AllocationPieChart({ holdings }: { holdings: HoldingMetrics[] }) {
  if (holdings.length === 0) {
    return <p className="py-10 text-center text-sm text-gray-400">Nessuna posizione ancora.</p>
  }

  const data = holdings.map((h, i) => ({
    name: h.holding.name,
    value: h.value,
    color: PALETTE[i % PALETTE.length],
  }))

  return (
    <div>
      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius="55%" outerRadius="90%" paddingAngle={2} stroke="none">
              {data.map((d) => (
                <Cell key={d.name} fill={d.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number, name) => [formatCurrency(value), name]}
              contentStyle={{ borderRadius: 12, fontSize: 12, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 flex flex-col gap-1.5">
        {data.map((d) => (
          <div key={d.name} className="flex items-center gap-2 px-1.5 py-0.5">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: d.color }} />
            <span className="min-w-0 flex-1 truncate text-xs text-gray-600 dark:text-gray-300">{d.name}</span>
            <span className="shrink-0 text-xs font-semibold tabular-nums text-gray-900 dark:text-gray-100">
              {formatCurrency(d.value)}
            </span>
            <span className="w-10 shrink-0 text-right text-[10px] text-gray-400">
              {formatPercent(d.value / (holdings.reduce((s, h) => s + h.value, 0) || 1))}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
