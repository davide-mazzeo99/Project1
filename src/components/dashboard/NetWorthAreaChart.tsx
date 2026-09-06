import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { format, parseISO } from 'date-fns'
import { it } from 'date-fns/locale'
import { formatCompactCurrency, formatCurrency } from '@/lib/format'
import type { NetWorthPoint } from '@/lib/analytics/netWorth'

interface NetWorthAreaChartProps {
  series: NetWorthPoint[]
}

export function NetWorthAreaChart({ series }: NetWorthAreaChartProps) {
  const data = series.map((p) => ({
    label: format(parseISO(`${p.month}-01`), 'MMM', { locale: it }),
    'Patrimonio netto': Math.round(p.netWorth * 100) / 100,
  }))

  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ left: 0, right: 4, top: 8 }}>
          <defs>
            <linearGradient id="netWorthGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3182f6" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#3182f6" stopOpacity={0.02} />
            </linearGradient>
          </defs>
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
            formatter={(value: number) => [formatCurrency(value), 'Patrimonio netto']}
            contentStyle={{ borderRadius: 12, fontSize: 12, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}
          />
          <Area type="monotone" dataKey="Patrimonio netto" stroke="#3182f6" strokeWidth={2.5} fill="url(#netWorthGradient)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
