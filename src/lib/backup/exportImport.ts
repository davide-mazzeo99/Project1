import { db } from '@/db/db'
import { backupSchema, type BackupFile } from '@/lib/backup/schema'

export async function buildBackup(): Promise<BackupFile> {
  const [accounts, transactions, categories, rules, holdings, portfolioSnapshots, budgets, importPresets, settings] =
    await Promise.all([
      db.accounts.toArray(),
      db.transactions.toArray(),
      db.categories.toArray(),
      db.rules.toArray(),
      db.holdings.toArray(),
      db.portfolioSnapshots.toArray(),
      db.budgets.toArray(),
      db.importPresets.toArray(),
      db.settings.toArray(),
    ])

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    data: { accounts, transactions, categories, rules, holdings, portfolioSnapshots, budgets, importPresets, settings },
  }
}

export async function downloadBackup(): Promise<void> {
  const backup = await buildBackup()
  const json = JSON.stringify(backup, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const stamp = new Date().toISOString().slice(0, 10)
  a.href = url
  a.download = `budget-backup-${stamp}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)

  await db.settings.update('settings', { lastBackupAt: Date.now() })
}

export interface ParsedBackupResult {
  ok: true
  backup: BackupFile
  counts: Record<string, number>
}
export interface ParsedBackupError {
  ok: false
  error: string
}

export async function parseBackupFile(file: File): Promise<ParsedBackupResult | ParsedBackupError> {
  let raw: unknown
  try {
    const text = await file.text()
    raw = JSON.parse(text)
  } catch {
    return { ok: false, error: 'Il file non è un JSON valido.' }
  }

  const result = backupSchema.safeParse(raw)
  if (!result.success) {
    return { ok: false, error: 'Il file non ha il formato di backup atteso da questa app.' }
  }

  const { data } = result.data
  return {
    ok: true,
    backup: result.data,
    counts: {
      transactions: data.transactions.length,
      categories: data.categories.length,
      rules: data.rules.length,
      holdings: data.holdings.length,
      budgets: data.budgets.length,
    },
  }
}

/** Replaces ALL local data with the contents of the backup. Irreversible. */
export async function restoreBackup(backup: BackupFile): Promise<void> {
  const { data } = backup
  await db.transaction(
    'rw',
    [db.accounts, db.transactions, db.categories, db.rules, db.holdings, db.portfolioSnapshots, db.budgets, db.importPresets, db.settings],
    async () => {
      await Promise.all([
        db.accounts.clear(),
        db.transactions.clear(),
        db.categories.clear(),
        db.rules.clear(),
        db.holdings.clear(),
        db.portfolioSnapshots.clear(),
        db.budgets.clear(),
        db.importPresets.clear(),
        db.settings.clear(),
      ])
      await Promise.all([
        db.accounts.bulkAdd(data.accounts),
        db.transactions.bulkAdd(data.transactions),
        db.categories.bulkAdd(data.categories),
        db.rules.bulkAdd(data.rules),
        db.holdings.bulkAdd(data.holdings),
        db.portfolioSnapshots.bulkAdd(data.portfolioSnapshots),
        db.budgets.bulkAdd(data.budgets),
        db.importPresets.bulkAdd(data.importPresets),
        db.settings.bulkAdd(data.settings),
      ])
    },
  )
}
