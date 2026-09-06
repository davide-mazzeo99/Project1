import { Landmark, TrendingUp } from 'lucide-react'
import { formatCurrency } from '@/lib/format'
import type { NetWorthBreakdown as NetWorthBreakdownData } from '@/lib/analytics/netWorth'

export function NetWorthBreakdown({ data }: { data: NetWorthBreakdownData }) {
  return (
    <div className="mb-3 flex flex-col gap-2">
      {data.perAccount.map(({ account, balance }) => {
        const Icon = account.type === 'brokerage' ? TrendingUp : Landmark
        return (
          <div key={account.id} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
              <Icon className="h-3.5 w-3.5" />
              {account.name}
            </span>
            <span className="font-medium tabular-nums text-gray-900 dark:text-gray-100">{formatCurrency(balance)}</span>
          </div>
        )
      })}
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500 dark:text-gray-400">Portafoglio (posizioni)</span>
        <span className="font-medium tabular-nums text-gray-900 dark:text-gray-100">
          {formatCurrency(data.portfolioValue)}
        </span>
      </div>
      <div className="mt-1 flex items-center justify-between border-t border-gray-100 pt-2 dark:border-gray-800">
        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">Patrimonio netto totale</span>
        <span className="text-lg font-bold tabular-nums text-gray-900 dark:text-gray-100">
          {formatCurrency(data.total)}
        </span>
      </div>
    </div>
  )
}
