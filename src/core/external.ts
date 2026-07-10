/**
 * External market data — real APIs (all support CORS, called directly from browser).
 * Replaces the mock/random data in the old server.js.
 */

/** Fear & Greed Index from alternative.me (CORS-enabled, free, no key). */
export interface SentimentData {
  fearGreedIndex: number
  fearGreedLabel: string
  fearGreedYesterday: number
  fearGreedLastWeek: number
  sentiment: 'bullish' | 'bearish' | 'neutral'
  timestamp: number
}

export async function fetchSentiment(): Promise<SentimentData> {
  const res = await fetch('https://api.alternative.me/fng/?limit=8&format=json')
  const data = await res.json()
  const current = data.data[0]
  const yesterday = data.data[1]
  const lastWeek = data.data[7] || data.data[data.data.length - 1]

  const value = parseInt(current.value)
  const labels: Record<string, string> = {
    'Extreme Fear': 'خوف شديد',
    'Fear': 'خوف',
    'Neutral': 'محايد',
    'Greed': 'طمع',
    'Extreme Greed': 'طمع شديد',
  }

  let sentiment: 'bullish' | 'bearish' | 'neutral' = 'neutral'
  if (value >= 60) sentiment = 'bullish'
  else if (value <= 40) sentiment = 'bearish'

  return {
    fearGreedIndex: value,
    fearGreedLabel: labels[current.value_classification] || current.value_classification,
    fearGreedYesterday: parseInt(yesterday.value),
    fearGreedLastWeek: parseInt(lastWeek.value),
    sentiment,
    timestamp: Date.now(),
  }
}

/** Global crypto market overview from CoinGecko (CORS-enabled, free, no key). */
export interface MarketOverview {
  totalMarketCap: number
  totalVolume: number
  marketCapChange24h: number
  btcDominance: number
  ethDominance: number
  activeCryptos: number
  timestamp: number
}

export async function fetchMarketOverview(): Promise<MarketOverview> {
  const res = await fetch('https://api.coingecko.com/api/v3/global')
  const data = await res.json()
  const d = data.data

  return {
    totalMarketCap: d.total_market_cap.usd,
    totalVolume: d.total_volume.usd,
    marketCapChange24h: d.market_cap_change_percentage_24h_usd,
    btcDominance: d.market_cap_percentage.btc,
    ethDominance: d.market_cap_percentage.eth,
    activeCryptos: d.active_cryptocurrencies,
    timestamp: Date.now(),
  }
}

/** Crypto news — fetched via Vercel serverless function (RSS aggregation, no API key). */
export interface NewsItem {
  title: string
  source: string
  publishedAt: number
  url: string
  body: string
  imageUrl?: string
  categories: string[]
}

export async function fetchNews(): Promise<NewsItem[]> {
  const res = await fetch('/api/news?limit=30')
  if (!res.ok) return []
  const items = await res.json()
  return Array.isArray(items) ? items : []
}
