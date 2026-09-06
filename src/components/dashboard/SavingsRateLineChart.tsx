import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { format, parseISO } from 'date-fns'
import { it } from 'date-fns/locale'
import type { MonthlyStats } from '@/lib/analytics/stats'

interface SavingsRateLineChartProps {
  series: MonthlyStats[]
}

export function SavingsRateLineChart({ series }: SavingsRateLineChartProps) {
  const data = series.map((s) => ({
    label: format(parseISO(`${s.month}-01`), 'MMM', { locale: it }),
    rate: Math.round(s.savingsRate * 1000) / 10,
  }))

  return (
    <div className="h-44">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ left: 0, right: 4, top: 8 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-gray-100 dark:stroke-gray-800" />
          <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
          <YAxis
            tick={{ fontSize: 10, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v}%`}
            width={36}
          />
          <ReferenceLine y={0} stroke="#d1d5db" />
          <Tooltip
            formatter={(value: number) => [`${value}%`, 'Tasso di risparmio']}
            contentStyle={{ borderRadius: 12, fontSize: 12, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}
          />
          <Line type="monotone" dataKey="rate" stroke="#3182f6" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
      <p className="text-center text-[11px] text-gray-400">Tasso di risparmio %</p>
    </div>
  )
}
