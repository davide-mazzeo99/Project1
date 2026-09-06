export type Institution = 'santander' | 'traderepublic'
export type AccountType = 'checking' | 'brokerage'
export type CategoryType = 'income' | 'expense' | 'investment' | 'transfer'
export type MatchType = 'contains' | 'regex'

export interface Account {
  id: string
  name: string
  type: AccountType
  institution: Institution
  currency: 'EUR'
  /** Saldo del conto prima di iniziare a registrare le transazioni in app. Sommato allo storico per il saldo attuale. */
  openingBalance?: number
}

export interface TransactionSplit {
  personId: string
  /** Positive amount owed by this person for their share of the expense. */
  amount: number
  settled: boolean
}

export interface Transaction {
  id: string
  accountId: string
  /** ISO date string, YYYY-MM-DD */
  date: string
  /** Negative = uscita, positive = entrata */
  amount: number
  description: string
  rawDescription: string
  categoryId: string | null
  subcategoryId?: string | null
  isRecurring: boolean
  isTransfer: boolean
  importHash: string | null
  notes?: string
  tags: string[]
  createdAt: number
  updatedAt: number
  /** Quote di questa spesa dovute da altre persone (es. coinquilino) — il resto è "mio". */
  splits?: TransactionSplit[]
}

/** Someone you split shared expenses with (e.g. a flatmate) — not an app user, just a name for the ledger. */
export interface Person {
  id: string
  name: string
}

export interface Category {
  id: string
  name: string
  type: CategoryType
  color: string
  icon: string
  monthlyBudget?: number
  isFixed: boolean
  isDefault?: boolean
}

export interface Rule {
  id: string
  matchType: MatchType
  pattern: string
  categoryId: string
  priority: number
  createdAt: number
}

export type AssetType = 'security' | 'crypto'

export interface Holding {
  id: string
  name: string
  ticker?: string
  isin?: string
  quantity: number
  avgCost: number
  currentPrice: number
  lastPriceUpdate: string
  /** 'crypto' looks up the price on CoinGecko, 'security' (default) on Twelve Data. */
  assetType?: AssetType
  /** Resolved CoinGecko coin id, cached after the first successful lookup by ticker. */
  coinGeckoId?: string
  /** true if lastPriceUpdate came from an automatic market lookup rather than a manual edit. */
  priceIsLive?: boolean
}

export interface PortfolioSnapshot {
  id: string
  /** YYYY-MM-DD */
  date: string
  totalValue: number
  totalInvested: number
}

export interface Budget {
  id: string
  /** YYYY-MM */
  month: string
  categoryId: string
  amount: number
}

export interface ImportPreset {
  id: string
  name: string
  institution: Institution | 'custom'
  delimiter: string
  encoding: string
  dateColumn: number
  amountColumn: number
  descriptionColumn: number
  balanceColumn?: number
  dateFormat: 'DD/MM/YYYY' | 'YYYY-MM-DD'
  decimalFormat: 'european' | 'standard'
  hasHeaderRow: boolean
  createdAt: number
}

export interface Settings {
  id: string
  lastBackupAt?: number
  priceApiKey?: string
  seedLoaded?: boolean
}
