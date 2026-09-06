import Dexie, { type Table } from 'dexie'
import type {
  Account,
  Budget,
  Category,
  Holding,
  ImportPreset,
  MarketIndex,
  Person,
  PortfolioSnapshot,
  Rule,
  Settings,
  Transaction,
} from '@/types'

export class BudgetDB extends Dexie {
  accounts!: Table<Account, string>
  transactions!: Table<Transaction, string>
  categories!: Table<Category, string>
  rules!: Table<Rule, string>
  holdings!: Table<Holding, string>
  portfolioSnapshots!: Table<PortfolioSnapshot, string>
  budgets!: Table<Budget, string>
  importPresets!: Table<ImportPreset, string>
  settings!: Table<Settings, string>
  people!: Table<Person, string>
  marketIndices!: Table<MarketIndex, string>

  constructor() {
    super('budget-db')

    this.version(1).stores({
      accounts: 'id, institution, type',
      transactions:
        'id, accountId, date, categoryId, isTransfer, isRecurring, importHash, [accountId+date]',
      categories: 'id, type, isDefault',
      rules: 'id, priority, categoryId',
      holdings: 'id, ticker, isin',
      portfolioSnapshots: 'id, date',
      budgets: 'id, month, categoryId, [month+categoryId]',
      importPresets: 'id, institution',
      settings: 'id',
    })

    this.version(2).stores({
      people: 'id, name',
    })

    this.version(3).stores({
      marketIndices: 'id, region',
    })
  }
}

export const db = new BudgetDB()
