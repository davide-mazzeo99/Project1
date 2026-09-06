import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { format, parseISO } from 'date-fns'
import { it } from 'date-fns/locale'
import type { MonthlyStats } from '@/lib/analytics/stats'

interface RentRatioLineChartProps {
  series: MonthlyStats[]
  thresholdPct?: number
}

export function RentRatioLineChart({ series, thresholdPct = 30 }: RentRatioLineChartProps) {
  const data = series.map((s) => ({
    label: format(parseISO(`${s.month}-01`), 'MMM', { locale: it }),
    rent: Math.round(s.rentRatio * 1000) / 10,
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
          <ReferenceLine y={thresholdPct} stroke="#f59e0b" strokeDasharray="4 4" />
          <Tooltip
            formatter={(value: number) => [`${value}%`, 'Affitto / entrate']}
            contentStyle={{ borderRadius: 12, fontSize: 12, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}
          />
          <Line type="monotone" dataKey="rent" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
      <p className="text-center text-[11px] text-gray-400">Affitto / entrate % (soglia {thresholdPct}%)</p>
    </div>
  )
}
