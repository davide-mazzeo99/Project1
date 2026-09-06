import { db } from '@/db/db'
import { SANTANDER_ACCOUNT_ID, TRADE_REPUBLIC_ACCOUNT_ID } from '@/db/bootstrap'
import { lastMonths } from '@/lib/analytics/stats'
import { todayIso } from '@/lib/format'
import type { Budget, Holding, PortfolioSnapshot, Transaction } from '@/types'

const SEED_PREFIX = 'seed-'

function seedId(suffix: string): string {
  return `${SEED_PREFIX}${suffix}`
}

function randomBetween(min: number, max: number): number {
  return Math.round((min + Math.random() * (max - min)) * 100) / 100
}

function dayOf(month: string, day: number): string {
  return `${month}-${String(day).padStart(2, '0')}`
}

export async function loadSeedData(): Promise<void> {
  const months = lastMonths(6)
  const now = Date.now()
  const transactions: Transaction[] = []

  let cumulativeInvested = 0
  const snapshots: PortfolioSnapshot[] = []

  months.forEach((month, idx) => {
    const mk = (_day: number, suffix: string) => seedId(`${month}-${suffix}`)

    transactions.push(
      tx(mk(1, 'stipendio'), SANTANDER_ACCOUNT_ID, dayOf(month, 1), randomBetween(1780, 1920), 'Accredito stipendio', 'cat-stipendio', now),
      tx(mk(2, 'affitto'), SANTANDER_ACCOUNT_ID, dayOf(month, 2), -750, 'Bonifico affitto', 'cat-affitto', now, { isRecurring: true }),
      tx(mk(3, 'trasferimento-out'), SANTANDER_ACCOUNT_ID, dayOf(month, 3), -300, 'Giroconto verso Trade Republic', 'cat-trasferimenti', now, { isTransfer: true }),
      tx(mk(3, 'trasferimento-in'), TRADE_REPUBLIC_ACCOUNT_ID, dayOf(month, 3), 300, 'Accredito da Santander', 'cat-trasferimenti', now, { isTransfer: true }),
      tx(mk(3, 'investimento'), TRADE_REPUBLIC_ACCOUNT_ID, dayOf(month, 4), -300, 'Acquisto ETF MSCI World', 'cat-investimenti', now),
      tx(mk(5, 'bollette'), SANTANDER_ACCOUNT_ID, dayOf(month, 5), -randomBetween(75, 115), 'Bolletta luce e gas', 'cat-bollette', now, { isRecurring: true }),
      tx(mk(6, 'netflix'), SANTANDER_ACCOUNT_ID, dayOf(month, 6), -12.99, 'Netflix', 'cat-abbonamenti', now, { isRecurring: true }),
      tx(mk(6, 'spotify'), SANTANDER_ACCOUNT_ID, dayOf(month, 6), -9.99, 'Spotify', 'cat-abbonamenti', now, { isRecurring: true }),
      tx(mk(7, 'interessi'), TRADE_REPUBLIC_ACCOUNT_ID, dayOf(month, 7), randomBetween(2, 6), 'Interessi liquidità', 'cat-altre-entrate', now),
    )

    for (let i = 0; i < 4; i++) {
      const day = 8 + i * 5
      transactions.push(
        tx(mk(day, `spesa-${i}`), SANTANDER_ACCOUNT_ID, dayOf(month, Math.min(day, 28)), -randomBetween(18, 68), 'Supermercato', 'cat-spesa', now),
      )
    }
    for (let i = 0; i < 3; i++) {
      const day = 10 + i * 6
      transactions.push(
        tx(mk(day, `bar-${i}`), SANTANDER_ACCOUNT_ID, dayOf(month, Math.min(day, 28)), -randomBetween(6, 32), 'Bar / Ristorante', 'cat-ristoranti', now),
      )
    }
    transactions.push(
      tx(mk(12, 'trasporti'), SANTANDER_ACCOUNT_ID, dayOf(month, 12), -randomBetween(15, 42), 'Trasporti pubblici', 'cat-trasporti', now),
    )
    if (idx % 2 === 0) {
      transactions.push(
        tx(mk(20, 'shopping'), SANTANDER_ACCOUNT_ID, dayOf(month, 20), -randomBetween(25, 140), 'Shopping', 'cat-shopping', now),
      )
    }
    if (idx % 3 === 0) {
      transactions.push(
        tx(mk(22, 'salute'), SANTANDER_ACCOUNT_ID, dayOf(month, 22), -randomBetween(15, 60), 'Farmacia', 'cat-salute', now),
      )
    }

    cumulativeInvested += 300
    const growth = 1 + idx * 0.012 + Math.random() * 0.01
    const isCurrentMonth = idx === months.length - 1
    const snapshotDay = isCurrentMonth ? Math.min(28, new Date().getDate()) : 28
    snapshots.push({
      id: seedId(`snapshot-${month}`),
      date: dayOf(month, snapshotDay),
      totalValue: Math.round(cumulativeInvested * growth * 100) / 100,
      totalInvested: cumulativeInvested,
    })
  })

  // Never generate transactions/snapshots dated after today (the current month is in progress).
  const today = todayIso()
  const realisticTransactions = transactions.filter((t) => t.date <= today)
  const realisticSnapshots = snapshots.filter((s) => s.date <= today)

  const holdings: Holding[] = [
    { id: seedId('holding-msci-world'), name: 'ETF MSCI World', ticker: 'IWDA', quantity: 22, avgCost: 76.4, currentPrice: 81.2, lastPriceUpdate: today },
    { id: seedId('holding-sp500'), name: 'ETF S&P 500', ticker: 'VUAA', quantity: 8, avgCost: 92.1, currentPrice: 98.7, lastPriceUpdate: today },
    { id: seedId('holding-stock'), name: 'Apple Inc.', ticker: 'AAPL', quantity: 3, avgCost: 168.5, currentPrice: 175.3, lastPriceUpdate: today },
  ]

  const currentMonth = months[months.length - 1]
  const budgets: Budget[] = [
    { id: seedId(`budget-spesa`), month: currentMonth, categoryId: 'cat-spesa', amount: 350 },
    { id: seedId(`budget-ristoranti`), month: currentMonth, categoryId: 'cat-ristoranti', amount: 150 },
    { id: seedId(`budget-trasporti`), month: currentMonth, categoryId: 'cat-trasporti', amount: 80 },
    { id: seedId(`budget-shopping`), month: currentMonth, categoryId: 'cat-shopping', amount: 120 },
    { id: seedId(`budget-bollette`), month: currentMonth, categoryId: 'cat-bollette', amount: 120 },
  ]

  await db.transaction('rw', db.transactions, db.holdings, db.portfolioSnapshots, db.budgets, db.settings, async () => {
    await db.transactions.bulkAdd(realisticTransactions)
    await db.holdings.bulkAdd(holdings)
    await db.portfolioSnapshots.bulkAdd(realisticSnapshots)
    await db.budgets.bulkAdd(budgets)
    await db.settings.update('settings', { seedLoaded: true })
  })
}

export async function clearSeedData(): Promise<void> {
  await db.transaction('rw', db.transactions, db.holdings, db.portfolioSnapshots, db.budgets, db.settings, async () => {
    const [txIds, holdingIds, snapshotIds, budgetIds] = await Promise.all([
      db.transactions.filter((t) => t.id.startsWith(SEED_PREFIX)).primaryKeys(),
      db.holdings.filter((h) => h.id.startsWith(SEED_PREFIX)).primaryKeys(),
      db.portfolioSnapshots.filter((s) => s.id.startsWith(SEED_PREFIX)).primaryKeys(),
      db.budgets.filter((b) => b.id.startsWith(SEED_PREFIX)).primaryKeys(),
    ])
    await db.transactions.bulkDelete(txIds)
    await db.holdings.bulkDelete(holdingIds)
    await db.portfolioSnapshots.bulkDelete(snapshotIds)
    await db.budgets.bulkDelete(budgetIds)
    await db.settings.update('settings', { seedLoaded: false })
  })
}

function tx(
  id: string,
  accountId: string,
  date: string,
  amount: number,
  description: string,
  categoryId: string,
  now: number,
  extra: Partial<Pick<Transaction, 'isRecurring' | 'isTransfer'>> = {},
): Transaction {
  return {
    id,
    accountId,
    date,
    amount,
    description,
    rawDescription: description,
    categoryId,
    isRecurring: extra.isRecurring ?? false,
    isTransfer: extra.isTransfer ?? false,
    importHash: null,
    tags: [],
    createdAt: now,
    updatedAt: now,
  }
}
