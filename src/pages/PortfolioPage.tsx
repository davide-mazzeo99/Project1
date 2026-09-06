import { useEffect, useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Plus } from 'lucide-react'
import { db } from '@/db/db'
import { StatCard } from '@/components/dashboard/StatCard'
import { ChartCard } from '@/components/dashboard/ChartCard'
import { AllocationPieChart } from '@/components/portfolio/AllocationPieChart'
import { HoldingRow } from '@/components/portfolio/HoldingRow'
import { HoldingEditSheet, type HoldingDraft } from '@/components/portfolio/HoldingEditSheet'
import { computePortfolioSummary } from '@/lib/analytics/portfolio'
import { ensureMonthlySnapshot } from '@/db/repo/holdings'
import { formatCurrency, formatPercent } from '@/lib/format'
import type { Holding } from '@/types'

export function PortfolioPage() {
  const holdings = useLiveQuery(() => db.holdings.toArray(), [], [] as Holding[])
  const [draft, setDraft] = useState<HoldingDraft | null>(null)

  useEffect(() => {
    ensureMonthlySnapshot()
  }, [holdings.length])

  const summary = useMemo(() => computePortfolioSummary(holdings), [holdings])
  const positive = summary.totalPl >= 0

  return (
    <div className="flex flex-col gap-4 px-4 pb-24 pt-4">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Portafoglio</h1>

      {holdings.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl bg-white p-6 text-center shadow-sm dark:bg-gray-900">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Nessuna posizione ancora</p>
          <p className="text-xs text-gray-400">Aggiungi le tue posizioni Trade Republic per vedere valore e P/L.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Valore totale" value={formatCurrency(summary.totalValue)} />
            <StatCard label="Capitale versato" value={formatCurrency(summary.totalCost)} />
          </div>
          <ChartCard title="Rendimento" subtitle="Plusvalenza/minusvalenza non realizzata, rispetto al capitale versato">
            <p className={`text-2xl font-bold tabular-nums ${positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
              {positive ? '+' : ''}
              {formatCurrency(summary.totalPl)}{' '}
              <span className="text-base font-semibold">
                ({positive ? '+' : ''}
                {formatPercent(summary.totalPlPercent)})
              </span>
            </p>
            <p className="mt-1 text-xs text-gray-400">
              Non conta come risparmio finché non venduto: il capitale versato resta la misura di quanto hai
              effettivamente investito.
            </p>
          </ChartCard>

          <ChartCard title="Allocazione">
            <AllocationPieChart holdings={summary.holdings} />
          </ChartCard>

          <ChartCard title="Posizioni">
            <div className="-mx-4 -my-2 divide-y divide-gray-100 dark:divide-gray-800">
              {summary.holdings.map((m) => (
                <HoldingRow
                  key={m.holding.id}
                  metrics={m}
                  onTap={() => setDraft({ ...m.holding })}
                />
              ))}
            </div>
          </ChartCard>
        </>
      )}

      <button
        onClick={() => setDraft({ name: '', ticker: '', isin: '', quantity: 0, avgCost: 0, currentPrice: 0 })}
        aria-label="Nuova posizione"
        className="fixed bottom-24 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-white shadow-lg active:bg-brand-700"
      >
        <Plus className="h-6 w-6" />
      </button>

      <HoldingEditSheet draft={draft} onClose={() => setDraft(null)} />
    </div>
  )
}
