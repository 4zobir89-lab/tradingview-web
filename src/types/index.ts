// ── Core Types ──────────────────────────────────────────
export type Theme = 'dark' | 'light'
export type Locale = 'en' | 'ar'
export type Direction = 'ltr' | 'rtl'
export type Timeframe = '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d' | '1w' | '1M'
export type ChartType = 'candlestick' | 'area' | 'line' | 'heikin-ashi' | 'renko'

export interface PriceData {
  symbol: string
  price: number
  previousClose: number
  change: number
  changePct: number
  high24h: number
  low24h: number
  volume24h: number
  marketCap?: number
}

export interface Candle {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume?: number
}

export interface Panel {
  id: string
  title: string
  visible: boolean
  width: number
  height: number
  x: number
  y: number
  minimized: boolean
}

export interface Indicator {
  id: string
  name: string
  enabled: boolean
  params: Record<string, number>
}

export interface Alert {
  id: string
  symbol: string
  type: 'price' | 'rsi' | 'ema' | 'macd' | 'volume' | 'breakout'
  condition: 'above' | 'below' | 'crosses'
  value: number
  active: boolean
  triggered: boolean
}

export interface Strategy {
  id: string
  name: string
  description: string
  conditions: string
  code?: string
}

export interface BacktestResult {
  equityCurve: number[]
  drawdown: number[]
  sharpe: number
  sortino: number
  profitFactor: number
  winRate: number
  totalTrades: number
  avgTrade: number
  expectancy: number
  maxDrawdown: number
}

export interface ScanResult {
  symbol: string
  signal: string
  type: 'bullish' | 'bearish' | 'neutral'
  strength: number
  timeframe: string
  timestamp: number
}

export interface TerminalCommand {
  cmd: string
  args: string[]
  timestamp: number
}

export interface NewsItem {
  title: string
  source: string
  published: string
  url?: string
}
