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

/** Resolves a ticker/name to a CoinGecko coin id and fetches its EUR price. */
export async function fetchCryptoPrice(query: string, cachedCoinGeckoId?: string): Promise<CryptoPriceResult | null> {
  try {
    const coinId = cachedCoinGeckoId ?? (await resolveCoinGeckoId(query))
    if (!coinId) return null

    const res = await fetch(`${COINGECKO_BASE}/simple/price?ids=${encodeURIComponent(coinId)}&vs_currencies=eur`)
    if (!res.ok) return null
    const data = await res.json()
    const price = data?.[coinId]?.eur
    if (typeof price !== 'number') return null
    return { price, coinGeckoId: coinId }
  } catch {
    return null
  }
}

async function resolveCoinGeckoId(query: string): Promise<string | null> {
  try {
    const res = await fetch(`${COINGECKO_BASE}/search?query=${encodeURIComponent(query)}`)
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
