/**
 * Live price lookups. Crypto uses CoinGecko's free public API (no key, EUR-native).
 * Stocks/ETFs use Twelve Data (needs the user's own free API key from Impostazioni).
 * Both are best-effort: any network error, missing key, unknown symbol or rate limit
 * simply resolves to `null` so the caller can fall back to the last manual price —
 * the app must keep working fully offline.
 */

const COINGECKO_BASE = 'https://api.coingecko.com/api/v3'
const TWELVE_DATA_BASE = 'https://api.twelvedata.com'

export interface CryptoPriceResult {
  price: number
  coinGeckoId: string
}

/**
 * Resolves a ticker/name to a CoinGecko coin id and fetches its EUR price.
 * `apiKey` is an optional free "Demo" key (coingecko.com/en/developers/dashboard) — CoinGecko
 * has been tightening anonymous access over time, so a key makes this far more reliable, but
 * the lookup still tries without one since the public endpoint keeps working for light usage.
 */
export async function fetchCryptoPrice(
  query: string,
  cachedCoinGeckoId?: string,
  apiKey?: string,
): Promise<CryptoPriceResult | null> {
  try {
    const coinId = cachedCoinGeckoId ?? (await resolveCoinGeckoId(query, apiKey))
    if (!coinId) return null

    const res = await fetch(withDemoKey(`${COINGECKO_BASE}/simple/price?ids=${encodeURIComponent(coinId)}&vs_currencies=eur`, apiKey))
    if (!res.ok) return null
    const data = await res.json()
    const price = data?.[coinId]?.eur
    if (typeof price !== 'number') return null
    return { price, coinGeckoId: coinId }
  } catch {
    return null
  }
}

function withDemoKey(url: string, apiKey?: string): string {
  return apiKey?.trim() ? `${url}&x_cg_demo_api_key=${encodeURIComponent(apiKey.trim())}` : url
}

async function resolveCoinGeckoId(query: string, apiKey?: string): Promise<string | null> {
  try {
    const res = await fetch(withDemoKey(`${COINGECKO_BASE}/search?query=${encodeURIComponent(query)}`, apiKey))
    if (!res.ok) return null
    const data = await res.json()
    const coins = data?.coins as { id: string; symbol: string }[] | undefined
    if (!coins || coins.length === 0) return null
    const exactSymbolMatch = coins.find((c) => c.symbol.toLowerCase() === query.trim().toLowerCase())
    return (exactSymbolMatch ?? coins[0]).id
  } catch {
    return null
  }
}

/** Fetches the latest price for a stock/ETF ticker from Twelve Data, in its native currency. */
export async function fetchSecurityPrice(ticker: string, apiKey: string): Promise<number | null> {
  if (!ticker.trim() || !apiKey.trim()) return null
  try {
    const res = await fetch(
      `${TWELVE_DATA_BASE}/price?symbol=${encodeURIComponent(ticker)}&apikey=${encodeURIComponent(apiKey)}`,
    )
    if (!res.ok) return null
    const data = await res.json()
    const price = Number.parseFloat(data?.price)
    return Number.isFinite(price) ? price : null
  } catch {
    return null
  }
}

export interface SymbolSearchResult {
  symbol: string
  name: string
  exchange: string
  instrumentType: string
}

/**
 * Cerca su Twelve Data i simboli che corrispondono a un nome o ticker (es. "FTSE MIB" o "IWDA"),
 * cosí l'utente può scegliere quello giusto invece di doverlo indovinare — i simboli usati da
 * Twelve Data per indici/azioni/ETF non seguono sempre le convenzioni comuni (es. Yahoo Finance).
 */
export async function searchSymbols(query: string, apiKey: string): Promise<SymbolSearchResult[]> {
  if (!query.trim() || !apiKey.trim()) return []
  try {
    const res = await fetch(
      `${TWELVE_DATA_BASE}/symbol_search?symbol=${encodeURIComponent(query)}&apikey=${encodeURIComponent(apiKey)}`,
    )
    if (!res.ok) return []
    const data = await res.json()
    const results = data?.data as
      | { symbol: string; instrument_name: string; exchange: string; instrument_type: string }[]
      | undefined
    if (!results) return []
    return results.map((r) => ({
      symbol: r.symbol,
      name: r.instrument_name,
      exchange: r.exchange,
      instrumentType: r.instrument_type,
    }))
  } catch {
    return []
  }
}

export interface IndexQuoteResult {
  price: number
  /** Variazione percentuale rispetto alla chiusura precedente (es. 0.4 = +0,4%). */
  changePercent: number | null
}

/**
 * Fetches the latest quote for a market index (e.g. FTSE MIB, S&P 500) from Twelve Data's
 * `/quote` endpoint, which — unlike `/price` — also returns the daily percent change.
 */
export async function fetchIndexQuote(symbol: string, apiKey: string): Promise<IndexQuoteResult | null> {
  if (!symbol.trim() || !apiKey.trim()) return null
  try {
    const res = await fetch(
      `${TWELVE_DATA_BASE}/quote?symbol=${encodeURIComponent(symbol)}&apikey=${encodeURIComponent(apiKey)}`,
    )
    if (!res.ok) return null
    const data = await res.json()
    const price = Number.parseFloat(data?.close)
    if (!Number.isFinite(price)) return null
    const changePercent = Number.parseFloat(data?.percent_change)
    return { price, changePercent: Number.isFinite(changePercent) ? changePercent : null }
  } catch {
    return null
  }
}
