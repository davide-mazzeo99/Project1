import { db } from '@/db/db'
import { DEFAULT_CATEGORIES } from '@/db/defaultCategories'
import type { Account } from '@/types'

export const SANTANDER_ACCOUNT_ID = 'acc-santander'
export const TRADE_REPUBLIC_ACCOUNT_ID = 'acc-traderepublic'

const DEFAULT_ACCOUNTS: Account[] = [
  { id: SANTANDER_ACCOUNT_ID, name: 'Santander', type: 'checking', institution: 'santander', currency: 'EUR' },
  { id: TRADE_REPUBLIC_ACCOUNT_ID, name: 'Trade Republic', type: 'brokerage', institution: 'traderepublic', currency: 'EUR' },
]

/** Ensures accounts, default categories and the settings row exist. Safe to call on every boot. */
export async function ensureBootstrapData(): Promise<void> {
  await db.transaction('rw', db.accounts, db.categories, db.settings, async () => {
    const accountCount = await db.accounts.count()
    if (accountCount === 0) {
      await db.accounts.bulkAdd(DEFAULT_ACCOUNTS)
    }

    const existingCategoryIds = new Set(await db.categories.toCollection().primaryKeys())
    const missing = DEFAULT_CATEGORIES.filter((c) => !existingCategoryIds.has(c.id))
    if (missing.length > 0) {
      await db.categories.bulkAdd(missing)
    }

    const settings = await db.settings.get('settings')
    if (!settings) {
      await db.settings.add({ id: 'settings' })
    }
  })
}
