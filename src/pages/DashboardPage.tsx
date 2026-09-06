import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { ChevronLeft, ChevronRight, Sparkles, Trash2 } from 'lucide-react'
import { db } from '@/db/db'
import { StatCard } from '@/components/dashboard/StatCard'
import { ChartCard } from '@/components/dashboard/ChartCard'
import { CategoryDonutChart } from '@/components/dashboard/CategoryDonutChart'
import { CategoryDrilldownSheet } from '@/components/dashboard/CategoryDrilldownSheet'
import { IncomeExpenseBarChart } from '@/components/dashboard/IncomeExpenseBarChart'
import { SavingsRateLineChart } from '@/components/dashboard/SavingsRateLineChart'
import { NetWorthAreaChart } from '@/components/dashboard/NetWorthAreaChart'
import { RentRatioLineChart } from '@/components/dashboard/RentRatioLineChart'
import { DailyHeatmap } from '@/components/dashboard/DailyHeatmap'
import { BudgetProgressList } from '@/components/dashboard/BudgetProgressList'
import { TransactionEditSheet } from '@/components/transactions/TransactionEditSheet'
import { BackupReminderBanner } from '@/components/BackupReminderBanner'
import {
  average,
  buildDailyExpenseTotals,
  buildMonthlySeries,
  computeMonthlyStats,
  computeSpendingPace,
  isRealExpense,
  lastMonths,
  shiftMonth,
} from '@/lib/analytics/stats'
import { buildNetWorthSeries } from '@/lib/analytics/netWorth'
import { buildBudgetProgress } from '@/lib/analytics/budgetProgress'
import { currentMonth as getCurrentMonth, formatCurrency, formatMonthLabel, formatPercent } from '@/lib/format'
import { loadSeedData, clearSeedData } from '@/db/seed'
import { useToast } from '@/components/ui/Toast'
import type { Account, Budget, Category, PortfolioSnapshot, Transaction } from '@/types'

const RENT_THRESHOLD = 0.3

export function DashboardPage() {
  const { showToast } = useToast()
  const [month, setMonth] = useState(getCurrentMonth())
  const [drilldownKey, setDrilldownKey] = useState<string | null>(null)
  const [editing, setEditing] = useState<Transaction | null>(null)
  const [seeding, setSeeding] = useState(false)

  const transactions = useLiveQuery(() => db.transactions.toArray(), [], [] as Transaction[])
  const categories = useLiveQuery(() => db.categories.toArray(), [], [] as Category[])
  const accounts = useLiveQuery(() => db.accounts.toArray(), [], [] as Account[])
  const budgets = useLiveQuery(() => db.budgets.toArray(), [], [] as Budget[])
  const portfolioSnapshots = useLiveQuery(() => db.portfolioSnapshots.toArray(), [], [] as PortfolioSnapshot[])
  const settings = useLiveQuery(() => db.settings.get('settings'), [], undefined)

  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories])
  const accountById = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts])

  const months12 = useMemo(() => lastMonths(12, month), [month])
  const series12 = useMemo(
    () => buildMonthlySeries(transactions, categoryById, months12),
    [transactions, categoryById, months12],
  )
  const currentStats = useMemo(
    () => computeMonthlyStats(transactions, categoryById, month),
    [transactions, categoryById, month],
  )
  const previousStats = useMemo(
    () => computeMonthlyStats(transactions, categoryById, shiftMonth(month, -1)),
    [transactions, categoryById, month],
  )
  const prior6 = useMemo(
    () => buildMonthlySeries(transactions, categoryById, lastMonths(7, month).slice(0, 6)),
    [transactions, categoryById, month],
  )
  const netWorthSeries = useMemo(
    () => buildNetWorthSeries(transactions, accounts, months12, portfolioSnapshots),
    [transactions, accounts, months12, portfolioSnapshots],
  )
  const dailyTotals = useMemo(
    () => buildDailyExpenseTotals(transactions, categoryById, month),
    [transactions, categoryById, month],
  )
  const budgetProgress = useMemo(
    () => buildBudgetProgress(currentStats.categoryTotals, categories, budgets, month),
    [currentStats, categories, budgets, month],
  )

  const avgIncome6 = average(prior6.map((s) => s.income))
  const avgExpenses6 = average(prior6.map((s) => s.expenses))
  const avgSavingsRate6 = average(prior6.map((s) => s.savingsRate))

  const isCurrentMonth = month === getCurrentMonth()
  const pace = useMemo(() => {
    if (!isCurrentMonth) return null
    const today = new Date()
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
    const budgetTotal = budgetProgress.reduce((s, b) => s + b.budget, 0)
    const reference = budgetTotal > 0 ? budgetTotal : avgExpenses6
    return computeSpendingPace(currentStats.expenses, reference, today.getDate(), daysInMonth)
  }, [isCurrentMonth, currentStats, budgetProgress, avgExpenses6])

  const drilldownTransactions = useMemo(() => {
    if (!drilldownKey) return []
    return transactions
      .filter((t) => t.date.startsWith(month))
      .filter((t) => {
        const category = t.categoryId ? categoryById.get(t.categoryId) : undefined
        if (!isRealExpense(t, category)) return false
        return drilldownKey === 'uncategorized' ? !t.categoryId : t.categoryId === drilldownKey
      })
      .sort((a, b) => b.date.localeCompare(a.date))
  }, [drilldownKey, transactions, month, categoryById])

  const drilldownLabel =
    drilldownKey === 'uncategorized' ? 'Da categorizzare' : categoryById.get(drilldownKey ?? '')?.name ?? ''

  async function handleLoadSeed() {
    setSeeding(true)
    try {
      await loadSeedData()
      showToast('Dati di esempio caricati')
    } finally {
      setSeeding(false)
    }
  }

  async function handleClearSeed() {
    setSeeding(true)
    try {
      await clearSeedData()
      showToast('Dati di esempio rimossi')
    } finally {
      setSeeding(false)
    }
  }

  const noData = transactions.length === 0

  const incomeDiff = previousStats.income > 0 ? (currentStats.income - previousStats.income) / previousStats.income : null
  const expensesDiff =
    previousStats.expenses > 0 ? (currentStats.expenses - previousStats.expenses) / previousStats.expenses : null

  return (
    <div className="flex flex-col gap-4 px-4 pb-6 pt-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
        {!noData && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setMonth((m) => shiftMonth(m, -1))}
              className="tap-target flex items-center justify-center rounded-full text-gray-400 active:bg-gray-200 dark:active:bg-gray-800"
              aria-label="Mese precedente"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="min-w-[7.5rem] text-center text-sm font-medium text-gray-600 dark:text-gray-300">
              {formatMonthLabel(`${month}-01`)}
            </span>
            <button
              onClick={() => !isCurrentMonth && setMonth((m) => shiftMonth(m, 1))}
              disabled={isCurrentMonth}
              className="tap-target flex items-center justify-center rounded-full text-gray-400 active:bg-gray-200 disabled:opacity-30 dark:active:bg-gray-800"
              aria-label="Mese successivo"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>

      {noData && (
        <div className="flex flex-col items-center gap-3 rounded-2xl bg-white p-6 text-center shadow-sm dark:bg-gray-900">
          <Sparkles className="h-8 w-8 text-brand-500" />
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Nessun dato ancora</p>
            <p className="mt-1 text-xs text-gray-400">
              Aggiungi qualche transazione, importa un CSV, oppure carica dei dati di esempio per vedere subito la
              dashboard popolata.
            </p>
          </div>
          <button
            onClick={handleLoadSeed}
            disabled={seeding}
            className="tap-target rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white active:bg-brand-700 disabled:opacity-50"
          >
            {seeding ? 'Caricamento...' : 'Carica dati di esempio'}
          </button>
        </div>
      )}

      {!noData && (
        <>
          <BackupReminderBanner />

          <div className="grid grid-cols-2 gap-3">
            <StatCard
              label="Entrate"
              value={formatCurrency(currentStats.income)}
              tone="emerald"
              hint={`${diffHint(incomeDiff, true)} · media 6m ${formatCurrency(avgIncome6)}`}
            />
            <StatCard
              label="Spese"
              value={formatCurrency(currentStats.expenses)}
              tone="red"
              hint={`${diffHint(expensesDiff, false)} · media 6m ${formatCurrency(avgExpenses6)}`}
            />
            <StatCard label="Risparmio netto" value={formatCurrency(currentStats.savings)} />
            <StatCard
              label="Tasso di risparmio"
              value={formatPercent(currentStats.savingsRate)}
              tone={currentStats.savingsRate >= 0.2 ? 'emerald' : currentStats.savingsRate >= 0 ? 'amber' : 'red'}
              hint={`Media 6 mesi: ${formatPercent(avgSavingsRate6)}`}
            />
          </div>

          <ChartCard title="Affitto / entrate" subtitle={`Soglia di riferimento ${formatPercent(RENT_THRESHOLD)}`}>
            <div className="flex items-center gap-4">
              <p
                className={`text-3xl font-bold tabular-nums ${
                  currentStats.rentRatio > RENT_THRESHOLD ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {formatPercent(currentStats.rentRatio)}
              </p>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                <div
                  className={`h-full rounded-full ${currentStats.rentRatio > RENT_THRESHOLD ? 'bg-red-500' : 'bg-emerald-500'}`}
                  style={{ width: `${Math.min(100, currentStats.rentRatio * 100)}%` }}
                />
              </div>
            </div>
            <p className="mt-1 text-xs text-gray-400">{formatCurrency(currentStats.rentAmount)} di affitto questo mese</p>
          </ChartCard>

          {pace && (
            <div
              className={`rounded-2xl p-3.5 text-sm ${
                pace.status === 'ahead'
                  ? 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400'
                  : pace.status === 'behind'
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
                    : 'bg-gray-50 text-gray-600 dark:bg-gray-800/50 dark:text-gray-300'
              }`}
            >
              <strong>Ritmo di spesa: </strong>
              {pace.status === 'ahead' &&
                `stai spendendo più veloce del previsto, ${formatCurrency(pace.diff)} sopra al ritmo atteso.`}
              {pace.status === 'behind' &&
                `sei sotto ritmo, hai un margine di circa ${formatCurrency(-pace.diff)} rispetto all'atteso.`}
              {pace.status === 'ontrack' && 'sei in linea con il ritmo di spesa atteso per questo punto del mese.'}
            </div>
          )}

          <ChartCard title="Budget del mese">
            <BudgetProgressList items={budgetProgress} />
          </ChartCard>

          <ChartCard title="Spese per categoria" subtitle="Tocca una fetta per vedere le transazioni">
            <CategoryDonutChart categoryTotals={currentStats.categoryTotals} categoryById={categoryById} onSelectCategory={setDrilldownKey} />
          </ChartCard>

          <ChartCard title="Entrate, spese e investimenti" subtitle="Ultimi 12 mesi">
            <IncomeExpenseBarChart series={series12} />
          </ChartCard>

          <ChartCard title="Tasso di risparmio" subtitle="Ultimi 12 mesi">
            <SavingsRateLineChart series={series12} />
          </ChartCard>

          <ChartCard title="Patrimonio netto" subtitle="Liquidità + portafoglio, ultimi 12 mesi">
            <NetWorthAreaChart series={netWorthSeries} />
          </ChartCard>

          <ChartCard title="Affitto nel tempo" subtitle="Percentuale sulle entrate, ultimi 12 mesi">
            <RentRatioLineChart series={series12} thresholdPct={RENT_THRESHOLD * 100} />
          </ChartCard>

          <ChartCard title="Spese giornaliere" subtitle={formatMonthLabel(`${month}-01`)}>
            <DailyHeatmap month={month} dailyTotals={dailyTotals} />
          </ChartCard>

          {settings?.seedLoaded && (
            <button
              onClick={handleClearSeed}
              disabled={seeding}
              className="tap-target flex items-center justify-center gap-2 rounded-xl bg-gray-100 py-2.5 text-sm font-medium text-gray-500 active:bg-gray-200 disabled:opacity-50 dark:bg-gray-800/60 dark:text-gray-400"
            >
              <Trash2 className="h-4 w-4" /> Rimuovi dati di esempio
            </button>
          )}
        </>
      )}

      <CategoryDrilldownSheet
        open={!!drilldownKey}
        onClose={() => setDrilldownKey(null)}
        month={month}
        categoryLabel={drilldownLabel}
        transactions={drilldownTransactions}
        categoryById={categoryById}
        accountById={accountById}
        onOpenTransaction={(t) => {
          setDrilldownKey(null)
          setEditing(t)
        }}
      />
      <TransactionEditSheet transaction={editing} onClose={() => setEditing(null)} />
    </div>
  )
}

function diffHint(diff: number | null, higherIsGood: boolean): string {
  if (diff === null) return 'Nessun confronto disponibile'
  const sign = diff >= 0 ? '+' : ''
  const good = higherIsGood ? diff >= 0 : diff <= 0
  const arrow = good ? '↑' : '↓'
  return `${arrow} ${sign}${formatPercent(diff)} vs mese scorso`
}
