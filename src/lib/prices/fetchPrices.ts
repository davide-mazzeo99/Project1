/**
 * Live price lookups. Crypto uses CoinGecko's free public API (no key, EUR-native).
 * Stocks/ETFs/indices use Twelve Data (needs the user's own free API key from Impostazioni).
 * Both are best-effort: any network error, missing key, unknown symbol or rate limit
 * simply resolves to a failure the caller can fall back on — the app must keep working
 * fully offline, and callers should never surface a raw exception to the user.
 */

const COINGECKO_BASE = 'https://api.coingecko.com/api/v3'
const TWELVE_DATA_BASE = 'https://api.twelvedata.com'

/**
 * Twelve Data's free "Basic" plan allows 8 requests per minute. Refreshing several
 * holdings/indices used to fire them all at once with Promise.all, which blew straight
 * through that limit and made every single request fail with "nessun ticker aggiornato" —
 * looking exactly like a bad ticker even though every symbol was fine.
 */
const TWELVE_DATA_BATCH_SIZE = 8
const TWELVE_DATA_BATCH_COOLDOWN_MS = 61_000

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Runs `task` for each item while respecting Twelve Data's 8-requests-per-minute limit: up
 * to 8 items run in parallel per batch, then — only if more remain — the runner waits out
 * the rest of the minute before starting the next batch. For 8 or fewer items (the common
 * case: most portfolios/index lists) this is instant, no waiting at all.
 */
export async function runTwelveDataBatched<T>(items: T[], task: (item: T) => Promise<void>): Promise<void> {
  for (let i = 0; i < items.length; i += TWELVE_DATA_BATCH_SIZE) {
    const batch = items.slice(i, i + TWELVE_DATA_BATCH_SIZE)
    await Promise.all(batch.map(task))
    if (i + TWELVE_DATA_BATCH_SIZE < items.length) await sleep(TWELVE_DATA_BATCH_COOLDOWN_MS)
  }
}

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

/**
 * Why a request failed, so the UI can say something more useful than "check the ticker"
 * when the real cause is a rate limit or a bad key. Twelve Data sometimes answers with
 * HTTP 200 and the error inside the JSON body instead of a matching HTTP status, so both
 * are checked.
 */
export type TwelveDataFailureReason = 'rate_limited' | 'invalid_key' | 'not_found' | 'other'

function classifyTwelveDataFailure(status: number, body: unknown): TwelveDataFailureReason {
  const code = typeof (body as { code?: unknown })?.code === 'number' ? (body as { code: number }).code : status
  if (code === 429) return 'rate_limited'
  if (code === 401 || code === 403) return 'invalid_key'
  if (code === 400 || code === 404) return 'not_found'
  return 'other'
}

export type TwelveDataOutcome<T> = { ok: true; value: T } | { ok: false; reason: TwelveDataFailureReason }

async function twelveDataGet<T>(url: string, extract: (data: any) => T | null): Promise<TwelveDataOutcome<T>> {
  try {
    const res = await fetch(url)
    let data: any = null
    try {
      data = await res.json()
    } catch {
      data = null
    }
    if (!res.ok || data?.status === 'error') {
      return { ok: false, reason: classifyTwelveDataFailure(res.status, data) }
    }
    const value = extract(data)
    if (value === null) return { ok: false, reason: 'not_found' }
    return { ok: true, value }
  } catch {
    return { ok: false, reason: 'other' }
  }
}

/** Fetches the latest price for a stock/ETF ticker from Twelve Data, in its native currency. */
export async function fetchSecurityPrice(ticker: string, apiKey: string): Promise<TwelveDataOutcome<number>> {
  if (!ticker.trim() || !apiKey.trim()) return { ok: false, reason: 'other' }
  return twelveDataGet(`${TWELVE_DATA_BASE}/price?symbol=${encodeURIComponent(ticker)}&apikey=${encodeURIComponent(apiKey)}`, (data) => {
    const price = Number.parseFloat(data?.price)
    return Number.isFinite(price) ? price : null
  })
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
  const outcome = await twelveDataGet(
    `${TWELVE_DATA_BASE}/symbol_search?symbol=${encodeURIComponent(query)}&apikey=${encodeURIComponent(apiKey)}`,
    (data) => (Array.isArray(data?.data) ? data.data : null),
  )
  if (!outcome.ok) return []
  return (outcome.value as any[]).map((r) => ({
    symbol: r.symbol,
    name: r.instrument_name,
    exchange: r.exchange,
    instrumentType: r.instrument_type,
  }))
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
export async function fetchIndexQuote(symbol: string, apiKey: string): Promise<TwelveDataOutcome<IndexQuoteResult>> {
  if (!symbol.trim() || !apiKey.trim()) return { ok: false, reason: 'other' }
  return twelveDataGet(`${TWELVE_DATA_BASE}/quote?symbol=${encodeURIComponent(symbol)}&apikey=${encodeURIComponent(apiKey)}`, (data) => {
    const price = Number.parseFloat(data?.close)
    if (!Number.isFinite(price)) return null
    const changePercent = Number.parseFloat(data?.percent_change)
    return { price, changePercent: Number.isFinite(changePercent) ? changePercent : null }
  })
}
