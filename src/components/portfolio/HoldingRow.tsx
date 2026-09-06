import { formatCurrency, formatPercent } from '@/lib/format'
import type { HoldingMetrics } from '@/lib/analytics/portfolio'

export function HoldingRow({ metrics, onTap }: { metrics: HoldingMetrics; onTap: () => void }) {
  const { holding, value, pl, plPercent, weight } = metrics
  const positive = pl >= 0

  return (
    <button
      onClick={onTap}
      className="tap-target flex w-full items-center gap-3 px-3 py-3 text-left active:bg-gray-50 dark:active:bg-gray-800/60"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-1.5">
          <span className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">{holding.name}</span>
          {holding.ticker && <span className="shrink-0 text-xs text-gray-400">{holding.ticker}</span>}
          {holding.priceIsLive && (
            <span
              className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500"
              title="Prezzo aggiornato dal mercato"
            />
          )}
        </div>
        <span className="text-xs text-gray-400">
          {holding.quantity} × {formatCurrency(holding.currentPrice)} · peso {formatPercent(weight)}
        </span>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-sm font-semibold tabular-nums text-gray-900 dark:text-gray-100">{formatCurrency(value)}</p>
        <p className={`text-xs tabular-nums ${positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
          {positive ? '+' : ''}
          {formatCurrency(pl)} ({positive ? '+' : ''}
          {formatPercent(plPercent)})
        </p>
      </div>
    </button>
  )
}
