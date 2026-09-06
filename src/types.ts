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

export type AssetType = 'security' | 'bond' | 'crypto' | 'accumulation'

export interface Holding {
  id: string
  name: string
  ticker?: string
  isin?: string
  /** Per 'accumulation' resta sempre 1: non c'è una quantità di quote da tracciare. */
  quantity: number
  /** Per 'accumulation' è il capitale versato totale, non un prezzo per unità. */
  avgCost: number
  /** Per 'accumulation' è il valore attuale totale, non un prezzo per unità. */
  currentPrice: number
  lastPriceUpdate: string
  /** 'crypto' looks up the price on CoinGecko, 'security' on Twelve Data, 'accumulation' (es. PAC ETF) è sempre manuale. */
  assetType?: AssetType
  /** Resolved CoinGecko coin id, cached after the first successful lookup by ticker. */
  coinGeckoId?: string
  /** true if lastPriceUpdate came from an automatic market lookup rather than a manual edit. */
  priceIsLive?: boolean
}

/**
 * Indice di borsa (es. FTSE MIB, S&P 500) seguito solo per riferimento nella pagina Mercati —
 * non è una posizione investita e non entra nei calcoli di valore/P&L del Portafoglio.
 */
export interface MarketIndex {
  id: string
  name: string
  /** Simbolo Twelve Data — modificabile a mano se quello di default non si aggiorna. */
  ticker: string
  region: 'italia' | 'mondo'
  currentPrice: number | null
  changePercent: number | null
  lastPriceUpdate?: string
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
  /** Twelve Data API key, per azioni/ETF/obbligazionari. */
  priceApiKey?: string
  /** CoinGecko "Demo" API key (opzionale), per rendere più affidabile l'aggiornamento cripto. */
  coinGeckoApiKey?: string
  seedLoaded?: boolean
}
