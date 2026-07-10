/**
 * Unified API layer — wraps binance.ts, analysis.ts, external.ts.
 * The app calls these methods; no Express server is required for market data.
 * Only AI chat goes through a Vercel serverless function (to protect the API key).
 */
import {
  fetchTicker, fetchCandles, fetchOrderBook, fetchMultipleTickers,
  TickerStream, MultiTickerStream,
  toBinanceSymbol, toBaseSymbol,
  type Ticker, type Candle, type OrderBook,
} from './binance'
import { analyzeSymbol, scanMovers, SCANNER_UNIVERSE, type AnalysisResult, type ScanItem } from './analysis'
import { fetchSentiment, fetchMarketOverview, fetchNews, type SentimentData, type MarketOverview, type NewsItem } from './external'

export const api = {
  // ── Health (always ok — no server dependency) ────────────────
  health: async () => ({ status: 'ok', timestamp: new Date().toISOString() }),

  // ── Market data (direct Binance calls) ───────────────────────
  ticker: (s: string): Promise<Ticker> => fetchTicker(s),
  price: async (s: string) => {
    const t = await fetchTicker(s)
    return { price: t.price, symbol: t.symbol }
  },
  candles: async (s: string, tf = '15m', limit = 200) => {
    const candles = await fetchCandles(s, tf, limit)
    return { candles, count: candles.length }
  },
  orderbook: (s: string): Promise<OrderBook> => fetchOrderBook(s),

  // ── Analysis (client-side computation) ───────────────────────
  analysis: (s: string): Promise<AnalysisResult> => analyzeSymbol(s),
  multiAnalysis: (s: string): Promise<AnalysisResult> => analyzeSymbol(s),
  multiAgent: async (s: string) => {
    const analysis = await analyzeSymbol(s)
    return {
      ...analysis,
      agents: [
        { name: 'Technical Analyst', signal: analysis.signal, confidence: Math.round(analysis.score) },
        { name: 'Trend Following', signal: analysis.indicators.ema20 > analysis.indicators.ema50 ? 'BUY' : 'SELL', confidence: 75 },
        { name: 'Mean Reversion', signal: analysis.indicators.rsi < 30 ? 'BUY' : analysis.indicators.rsi > 70 ? 'SELL' : 'NEUTRAL', confidence: 65 },
        { name: 'Volume Analysis', signal: analysis.volume24h > 1e9 ? 'BULLISH' : 'NEUTRAL', confidence: 55 },
      ],
    }
  },

  // ── Scanner ──────────────────────────────────────────────────
  gainers: async (_exchange: string, _tf: string, limit: number): Promise<ScanItem[]> => {
    const { gainers } = await scanMovers()
    return gainers.slice(0, limit)
  },
  losers: async (_exchange: string, _tf: string, limit: number): Promise<ScanItem[]> => {
    const { losers } = await scanMovers()
    return losers.slice(0, limit)
  },
  scanAll: async (): Promise<{ gainers: ScanItem[]; losers: ScanItem[]; all: ScanItem[] }> => scanMovers(),

  // ── Market overview (real CoinGecko data) ────────────────────
  market: async (): Promise<MarketOverview> => fetchMarketOverview(),

  // ── News (real CryptoCompare feed) ───────────────────────────
  news: async (): Promise<NewsItem[]> => fetchNews(),

  // ── Sentiment (real Fear & Greed Index) ──────────────────────
  sentiment: async (): Promise<SentimentData> => fetchSentiment(),

  // ── AI Chat (Vercel serverless function) ─────────────────────
  chat: async (message: string, symbol = 'BTC-USD', model = 'deepseek-v4-flash-free') => {
    // Fetch market data client-side (Binance CORS works from browser, not always from Vercel)
    let marketContext = ''
    try {
      const [ticker, analysis] = await Promise.all([
        fetchTicker(symbol).catch(() => null),
        analyzeSymbol(symbol).catch(() => null),
      ])
      if (ticker) {
        marketContext = `\n\n=== بيانات السوق اللحظية من Binance ===
العملة: ${symbol}
السعر الحالي: $${ticker.price.toLocaleString()}
التغيير 24 ساعة: ${ticker.changePct.toFixed(2)}%
أعلى 24 ساعة: $${ticker.high24h.toLocaleString()}
أدنى 24 ساعة: $${ticker.low24h.toLocaleString()}
الحجم: $${(ticker.volume24h / 1e6).toFixed(1)}M`
        if (analysis) {
          marketContext += `

المؤشرات الفنية:
- RSI(14): ${analysis.indicators.rsi.toFixed(1)}
- MACD Histogram: ${analysis.indicators.macd.histogram.toFixed(2)}
- EMA20: $${analysis.indicators.ema20.toLocaleString()}
- EMA50: $${analysis.indicators.ema50.toLocaleString()}
- Bollinger Upper: $${analysis.indicators.bollinger.upper.toLocaleString()}
- Bollinger Lower: $${analysis.indicators.bollinger.lower.toLocaleString()}
- ADX: ${analysis.indicators.adx.toFixed(1)}
- VWAP: $${analysis.indicators.vwap.toLocaleString()}
- SuperTrend: $${analysis.indicators.superTrend.toLocaleString()}

إشارة التحليل: ${analysis.signal} (النتيجة: ${analysis.score.toFixed(0)}%)
ملاحظة: هذه بيانات لحظية حقيقية. استخدمها في تحليلك.`
        }
      }
    } catch {}

    const r = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, symbol, model, marketContext }),
    })
    if (!r.ok) throw new Error(`AI API ${r.status}`)
    return r.json()
  },

  // ── Backtest (client-side simulation) ────────────────────────
  backtest: async (body: { symbol: string; strategy: string; timeframe: string; period: number }) => {
    return runBacktest(body)
  },
}

// ── Real-time subscriptions ─────────────────────────────────────
const streams = new Map<string, TickerStream>()
let multiStream: MultiTickerStream | null = null

/** Subscribe to real-time ticker updates for a single symbol. */
export function subscribeTicker(symbol: string, cb: (data: Partial<Ticker>) => void): () => void {
  const binanceSym = toBinanceSymbol(symbol)
  let stream = streams.get(binanceSym)
  if (!stream) {
    stream = new TickerStream(symbol)
    streams.set(binanceSym, stream)
  }
  return stream.on(cb)
}

/** Subscribe to multiple symbols via a single combined stream (more efficient). */
export function subscribeMultiTicker(symbols: string[], cb: (symbol: string, data: Partial<Ticker>) => void): () => void {
  if (!multiStream) {
    multiStream = new MultiTickerStream(symbols)
  }
  const unsubs = symbols.map(s => {
    return multiStream!.subscribe(s, (data) => cb(toBinanceSymbol(s), data))
  })
  return () => unsubs.forEach(u => u())
}

// ── Backtest (client-side) ──────────────────────────────────────
async function runBacktest({ symbol, strategy, timeframe = '1h', period = 200 }: {
  symbol: string; strategy: string; timeframe: string; period: number
}) {
  const candles = await fetchCandles(symbol, timeframe, Math.min(period, 1000))
  if (candles.length < 50) throw new Error('Not enough data for backtest')

  const closes = candles.map(c => c.close)
  const rsi = calcRSIClient(closes)
  const ema20Arr = calcEMAClient(closes, 20)
  const ema50Arr = calcEMAClient(closes, 50)
  const bb = calcBBClient(closes, 20, 2)

  let equity = 10000
  let position = 0
  let entryPrice = 0
  let trades = 0
  let wins = 0
  let losses = 0
  let grossProfit = 0
  let grossLoss = 0
  const equityCurve: number[] = [equity]
  const trades_log: { entry: number; exit: number; pnl: number; time: number }[] = []

  const start = strategy === 'ema_crossover' ? 50 : 30

  for (let i = start; i < candles.length; i++) {
    const price = closes[i]
    const rsiIdx = i - (closes.length - rsi.length) // align RSI index
    const rsiVal = rsiIdx >= 0 ? rsi[rsiIdx] : 50

    // ── Entry conditions ──────────────────────────────────────
    if (position === 0) {
      let shouldBuy = false

      if (strategy === 'rsi_oversold' && rsiVal < 30) shouldBuy = true
      else if (strategy === 'ema_crossover' && ema20Arr[i] > ema50Arr[i] && ema20Arr[i - 1] <= ema50Arr[i - 1]) shouldBuy = true
      else if (strategy === 'bollinger_reversal' && bb.lower[i] !== null && price <= (bb.lower[i] as number)) shouldBuy = true
      else if (strategy === 'macd_divergence') {
        const macd = calcMACDClient(closes.slice(0, i + 1))
        const hist = macd.histogram[macd.histogram.length - 1]
        const prevHist = macd.histogram[macd.histogram.length - 2]
        if (hist > 0 && prevHist <= 0) shouldBuy = true
      }

      if (shouldBuy) {
        position = equity / price
        entryPrice = price
        equity = 0
        trades++
      }
    }
    // ── Exit conditions ───────────────────────────────────────
    else {
      let shouldSell = false

      if (strategy === 'rsi_oversold' && rsiVal > 70) shouldSell = true
      else if (strategy === 'ema_crossover' && ema20Arr[i] < ema50Arr[i] && ema20Arr[i - 1] >= ema50Arr[i - 1]) shouldSell = true
      else if (strategy === 'bollinger_reversal' && bb.upper[i] !== null && price >= (bb.upper[i] as number)) shouldSell = true
      else if (strategy === 'macd_divergence') {
        const macd = calcMACDClient(closes.slice(0, i + 1))
        const hist = macd.histogram[macd.histogram.length - 1]
        const prevHist = macd.histogram[macd.histogram.length - 2]
        if (hist < 0 && prevHist >= 0) shouldSell = true
      }

      if (shouldSell) {
        const pnl = position * (price - entryPrice)
        equity = position * price
        if (pnl > 0) { wins++; grossProfit += pnl }
        else { losses++; grossLoss += Math.abs(pnl) }
        trades_log.push({ entry: entryPrice, exit: price, pnl, time: candles[i].time })
        position = 0
        entryPrice = 0
      }
    }

    equityCurve.push(equity + position * price)
  }

  // Close any open position at the end
  if (position > 0) {
    const finalPrice = closes[closes.length - 1]
    const pnl = position * (finalPrice - entryPrice)
    equity = position * finalPrice
    if (pnl > 0) { wins++; grossProfit += pnl }
    else { losses++; grossLoss += Math.abs(pnl) }
    trades_log.push({ entry: entryPrice, exit: finalPrice, pnl, time: candles[candles.length - 1].time })
    position = 0
  }

  const finalEquity = equity
  const totalReturn = ((finalEquity - 10000) / 10000) * 100
  const maxDrawdown = calcMaxDrawdown(equityCurve)
  const winRate = trades ? (wins / trades) * 100 : 0
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : (grossProfit > 0 ? 99 : 0)
  const sharpe = calcSharpe(equityCurve)

  return {
    equityCurve,
    trades: trades_log,
    sharpe: sharpe.toFixed(2),
    winRate: winRate.toFixed(1),
    profitFactor: profitFactor.toFixed(2),
    totalTrades: trades,
    maxDrawdown: maxDrawdown.toFixed(1),
    expectancy: trades ? ((finalEquity - 10000) / trades).toFixed(2) : '0',
    totalReturn: totalReturn.toFixed(2),
    finalEquity: finalEquity.toFixed(2),
  }
}

function calcMaxDrawdown(equity: number[]): number {
  let peak = equity[0] || 1
  let maxDD = 0
  for (const v of equity) {
    if (v > peak) peak = v
    const dd = ((peak - v) / peak) * 100
    if (dd > maxDD) maxDD = dd
  }
  return maxDD
}

function calcSharpe(equity: number[]): number {
  if (equity.length < 2) return 0
  const returns: number[] = []
  for (let i = 1; i < equity.length; i++) {
    if (equity[i - 1] > 0) returns.push((equity[i] - equity[i - 1]) / equity[i - 1])
  }
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length
  const variance = returns.reduce((acc, r) => acc + (r - mean) ** 2, 0) / returns.length
  const std = Math.sqrt(variance)
  if (std === 0) return 0
  return (mean / std) * Math.sqrt(252) // annualized
}

// Local indicator wrappers (to avoid circular imports)
function calcRSIClient(closes: number[]) {
  // re-implemented here to avoid import cycle; matches indicators.ts
  if (closes.length < 15) return []
  const period = 14
  const rsi: number[] = []
  let gains = 0, losses = 0
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1]
    if (diff > 0) gains += diff; else losses -= diff
  }
  let avgGain = gains / period
  let avgLoss = losses / period
  rsi.push(avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss))
  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1]
    avgGain = (avgGain * (period - 1) + (diff > 0 ? diff : 0)) / period
    avgLoss = (avgLoss * (period - 1) + (diff < 0 ? -diff : 0)) / period
    rsi.push(avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss))
  }
  return rsi
}

function calcEMAClient(data: number[], period: number): number[] {
  if (data.length === 0) return []
  const k = 2 / (period + 1)
  const out: number[] = [data[0]]
  for (let i = 1; i < data.length; i++) out.push(data[i] * k + out[i - 1] * (1 - k))
  return out
}

function calcBBClient(closes: number[], period: number, stdDev: number) {
  const upper: (number | null)[] = []
  const lower: (number | null)[] = []
  for (let i = 0; i < closes.length; i++) {
    if (i < period - 1) { upper.push(null); lower.push(null); continue }
    let sum = 0
    for (let j = i - period + 1; j <= i; j++) sum += closes[j]
    const mean = sum / period
    let variance = 0
    for (let j = i - period + 1; j <= i; j++) variance += (closes[j] - mean) ** 2
    variance /= period
    const std = Math.sqrt(variance)
    upper.push(mean + stdDev * std)
    lower.push(mean - stdDev * std)
  }
  return { upper, lower }
}

function calcMACDClient(closes: number[]) {
  const emaFast = calcEMAClient(closes, 12)
  const emaSlow = calcEMAClient(closes, 26)
  const macdLine = emaFast.map((v, i) => v - emaSlow[i])
  const signalLine = calcEMAClient(macdLine, 9)
  const histogram = macdLine.map((v, i) => v - signalLine[i])
  return { macdLine, signalLine, histogram }
}
