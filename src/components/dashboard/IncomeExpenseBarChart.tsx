import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { format, parseISO } from 'date-fns'
import { it } from 'date-fns/locale'
import { formatCompactCurrency, formatCurrency } from '@/lib/format'
import type { MonthlyStats } from '@/lib/analytics/stats'

interface IncomeExpenseBarChartProps {
  series: MonthlyStats[]
}

const COLORS = { income: '#10b981', expenses: '#ef4444', investments: '#8b5cf6' }

export function IncomeExpenseBarChart({ series }: IncomeExpenseBarChartProps) {
  const data = series.map((s) => ({
    month: s.month,
    label: format(parseISO(`${s.month}-01`), 'MMM', { locale: it }),
    Entrate: s.income,
    Spese: s.expenses,
    Investimenti: s.investments,
  }))

  return (
    <div>
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={2} margin={{ left: 0, right: 4, top: 4 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-gray-100 dark:stroke-gray-800" />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fontSize: 10, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => formatCompactCurrency(v)}
              width={44}
            />
            <Tooltip
              formatter={(value: number, name) => [formatCurrency(value), name]}
              contentStyle={{ borderRadius: 12, fontSize: 12, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}
            />
            <Bar dataKey="Entrate" stackId="flow" fill={COLORS.income} maxBarSize={18} />
            <Bar dataKey="Spese" stackId="flow" fill={COLORS.expenses} maxBarSize={18} />
            <Bar dataKey="Investimenti" stackId="flow" fill={COLORS.investments} radius={[3, 3, 0, 0]} maxBarSize={18} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-1 flex justify-center gap-4">
        {Object.entries(COLORS).map(([key, color]) => (
          <span key={key} className="flex items-center gap-1 text-[10px] text-gray-400">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
            {key === 'income' ? 'Entrate' : key === 'expenses' ? 'Spese' : 'Investimenti'}
          </span>
        ))}
      </div>
    </div>
  )
}
