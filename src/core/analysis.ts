/**
 * Market Analysis — computes signal score from candle data.
 * Moved from server.js to client-side (pure math, no API key needed).
 */
import { fetchCandles, fetchTicker, fetchMultipleTickers, toBinanceSymbol, toBaseSymbol, type Candle, type Ticker } from './binance'
import {
  calcRSI, calcMACD, calcEMA, calcBollinger, calcATR, calcADX,
  calcStochastic, calcVWAP, calcSuperTrend
} from './indicators'

export type Signal = 'STRONG BUY' | 'BUY' | 'NEUTRAL' | 'SELL' | 'STRONG SELL'

export interface AnalysisResult {
  symbol: string
  base: string
  price: number
  change24h: number
  high24h: number
  low24h: number
  volume24h: number
  indicators: {
    rsi: number
    macd: { value: number; signal: number; histogram: number }
    ema20: number
    ema50: number
    bollinger: { upper: number; middle: number; lower: number }
    atr: number
    adx: number
    stochastic: { k: number; d: number }
    vwap: number
    superTrend: number
  }
  signal: Signal
  score: number          // 0-100, bullish probability
  bullish: number
  bearish: number
  timestamp: number
}

export async function analyzeSymbol(input: string): Promise<AnalysisResult> {
  const symbol = toBinanceSymbol(input)
  const [ticker, candles] = await Promise.all([
    fetchTicker(input),
    fetchCandles(input, '15m', 200),
  ])

  if (candles.length < 50) {
    throw new Error('Insufficient candle data for analysis')
  }

  const closes = candles.map(c => c.close)
  const highs = candles.map(c => c.high)
  const lows = candles.map(c => c.low)
  const volumes = candles.map(c => c.volume)

  const rsi = calcRSI(closes)
  const macd = calcMACD(closes)
  const ema20 = calcEMA(closes, 20)
  const ema50 = calcEMA(closes, 50)
  const bb = calcBollinger(closes)
  const atr = calcATR(highs, lows, closes)
  const adx = calcADX(highs, lows, closes)
  const stoch = calcStochastic(highs, lows, closes)
  const vwap = calcVWAP(highs, lows, closes, volumes)
  const superTrend = calcSuperTrend(highs, lows, closes)

  const i = closes.length - 1
  const lastRSI = rsi[rsi.length - 1]
  const lastMACDHist = macd.histogram[macd.histogram.length - 1]
  const lastEMA20 = ema20[ema20.length - 1]
  const lastEMA50 = ema50[ema50.length - 1]
  const lastBBUpper = bb.upper[bb.upper.length - 1] as number
  const lastBBLower = bb.lower[bb.lower.length - 1] as number
  const lastBBMid = bb.middle[bb.middle.length - 1] as number
  const lastADX = adx.adx[adx.adx.length - 1]
  const lastStochK = stoch.k[stoch.k.length - 1] as number
  const lastStochD = stoch.d[stoch.d.length - 1] as number
  const lastVWAP = vwap[vwap.length - 1]
  const lastST = superTrend[superTrend.length - 1]
  const lastClose = closes[i]

  // ── Signal scoring ────────────────────────────────────────────
  let bullish = 0, bearish = 0

  // RSI
  if (lastRSI < 30) bullish += 2
  else if (lastRSI > 70) bearish += 2
  else if (lastRSI < 45) bullish += 1
  else if (lastRSI > 55) bearish += 1

  // MACD histogram
  if (lastMACDHist > 0) bullish += 1; else bearish += 1

  // EMA trend
  if (lastEMA20 > lastEMA50) bullish += 2; else bearish += 2

  // Price vs EMA20
  if (lastClose > lastEMA20) bullish += 1; else bearish += 1

  // Bollinger
  if (lastClose <= lastBBLower) bullish += 1
  else if (lastClose >= lastBBUpper) bearish += 1

  // VWAP
  if (lastClose > lastVWAP) bullish += 1; else bearish += 1

  // SuperTrend
  if (lastClose > lastST) bullish += 2; else bearish += 2

  // Stochastic
  if (lastStochK < 20) bullish += 1
  else if (lastStochK > 80) bearish += 1

  const total = bullish + bearish
  const score = total ? (bullish / total) * 100 : 50

  let signal: Signal = 'NEUTRAL'
  if (score >= 70) signal = 'STRONG BUY'
  else if (score >= 58) signal = 'BUY'
  else if (score <= 30) signal = 'STRONG SELL'
  else if (score <= 42) signal = 'SELL'

  return {
    symbol,
    base: toBaseSymbol(input),
    price: ticker.price,
    change24h: ticker.changePct,
    high24h: ticker.high24h,
    low24h: ticker.low24h,
    volume24h: ticker.volume24h,
    indicators: {
      rsi: lastRSI,
      macd: {
        value: macd.macdLine[macd.macdLine.length - 1],
        signal: macd.signalLine[macd.signalLine.length - 1],
        histogram: lastMACDHist,
      },
      ema20: lastEMA20,
      ema50: lastEMA50,
      bollinger: { upper: lastBBUpper, middle: lastBBMid, lower: lastBBLower },
      atr: atr[atr.length - 1],
      adx: lastADX,
      stochastic: { k: lastStochK, d: lastStochD },
      vwap: lastVWAP,
      superTrend: lastST,
    },
    signal,
    score,
    bullish,
    bearish,
    timestamp: Date.now(),
  }
}

/** Quick scanner: returns top movers from a fixed universe. */
export const SCANNER_UNIVERSE = [
  'BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA', 'DOGE', 'DOT', 'AVAX', 'LINK',
  'LTC', 'ATOM', 'NEAR', 'APT', 'ARB', 'OP', 'FIL', 'INJ', 'MATIC', 'UNI',
  'SUI', 'SEI', 'TIA', 'ORDI', 'PEPE', 'SHIB', 'FTM', 'ALGO', 'EGLD', 'AAVE',
]

export interface ScanItem {
  symbol: string
  base: string
  price: number
  changePct: number
  volume: number
}

export async function scanMovers(): Promise<{ gainers: ScanItem[]; losers: ScanItem[]; all: ScanItem[] }> {
  const tickers = await fetchMultipleTickers(SCANNER_UNIVERSE)
  const items: ScanItem[] = tickers
    .filter(t => t.price > 0)
    .map(t => ({
      symbol: t.symbol,
      base: t.base,
      price: t.price,
      changePct: t.changePct,
      volume: t.volume24h,
    }))

  const gainers = [...items].sort((a, b) => b.changePct - a.changePct)
  const losers = [...items].sort((a, b) => a.changePct - b.changePct)
  const all = [...items].sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct))

  return { gainers, losers, all }
}


