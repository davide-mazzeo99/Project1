import { z } from 'zod'

const accountSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['checking', 'brokerage']),
  institution: z.enum(['santander', 'traderepublic']),
  currency: z.literal('EUR'),
})

const transactionSchema = z.object({
  id: z.string(),
  accountId: z.string(),
  date: z.string(),
  amount: z.number(),
  description: z.string(),
  rawDescription: z.string(),
  categoryId: z.string().nullable(),
  subcategoryId: z.string().nullable().optional(),
  isRecurring: z.boolean(),
  isTransfer: z.boolean(),
  importHash: z.string().nullable(),
  notes: z.string().optional(),
  tags: z.array(z.string()),
  createdAt: z.number(),
  updatedAt: z.number(),
})

const categorySchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['income', 'expense', 'investment', 'transfer']),
  color: z.string(),
  icon: z.string(),
  monthlyBudget: z.number().optional(),
  isFixed: z.boolean(),
  isDefault: z.boolean().optional(),
})

const ruleSchema = z.object({
  id: z.string(),
  matchType: z.enum(['contains', 'regex']),
  pattern: z.string(),
  categoryId: z.string(),
  priority: z.number(),
  createdAt: z.number(),
})

const holdingSchema = z.object({
  id: z.string(),
  name: z.string(),
  ticker: z.string().optional(),
  isin: z.string().optional(),
  quantity: z.number(),
  avgCost: z.number(),
  currentPrice: z.number(),
  lastPriceUpdate: z.string(),
})

const portfolioSnapshotSchema = z.object({
  id: z.string(),
  date: z.string(),
  totalValue: z.number(),
  totalInvested: z.number(),
})

const budgetSchema = z.object({
  id: z.string(),
  month: z.string(),
  categoryId: z.string(),
  amount: z.number(),
})

const importPresetSchema = z.object({
  id: z.string(),
  name: z.string(),
  institution: z.enum(['santander', 'traderepublic', 'custom']),
  delimiter: z.string(),
  encoding: z.string(),
  dateColumn: z.number(),
  amountColumn: z.number(),
  descriptionColumn: z.number(),
  balanceColumn: z.number().optional(),
  dateFormat: z.enum(['DD/MM/YYYY', 'YYYY-MM-DD']),
  decimalFormat: z.enum(['european', 'standard']),
  hasHeaderRow: z.boolean(),
  createdAt: z.number(),
})

const settingsSchema = z.object({
  id: z.string(),
  lastBackupAt: z.number().optional(),
  priceApiKey: z.string().optional(),
  seedLoaded: z.boolean().optional(),
})

export const backupSchema = z.object({
  version: z.literal(1),
  exportedAt: z.string(),
  data: z.object({
    accounts: z.array(accountSchema),
    transactions: z.array(transactionSchema),
    categories: z.array(categorySchema),
    rules: z.array(ruleSchema),
    holdings: z.array(holdingSchema),
    portfolioSnapshots: z.array(portfolioSnapshotSchema),
    budgets: z.array(budgetSchema),
    importPresets: z.array(importPresetSchema),
    settings: z.array(settingsSchema),
  }),
})

export type BackupFile = z.infer<typeof backupSchema>
