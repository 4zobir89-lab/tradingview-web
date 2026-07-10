/**
 * Binance API Client — Direct browser calls (Binance supports CORS).
 * No server-side proxy needed for market data, which eliminates cold starts on Vercel.
 */

const BASE = 'https://api.binance.com'
const FAPI_BASE = 'https://fapi.binance.com' // futures (fallback for some symbols)

/** Normalize any user-facing symbol (BTC-USD, BTCUSDT, BTC) to Binance format (BTCUSDT). */
export function toBinanceSymbol(input: string): string {
  if (!input) return 'BTCUSDT'
  const s = input.toUpperCase().replace(/-USD$/g, '').replace(/USDT$/g, '').replace(/-USDT$/g, '')
  return s + 'USDT'
}

/** Strip Binance suffix to get the base asset (BTCUSDT -> BTC). */
export function toBaseSymbol(input: string): string {
  return toBinanceSymbol(input).replace(/USDT$/, '')
}

async function getJSON(url: string, timeout = 8000): Promise<any> {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), timeout)
  try {
    const res = await fetch(url, { signal: ctrl.signal })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } finally {
    clearTimeout(t)
  }
}

/** Normalized 24h ticker — consistent field names across the app. */
export interface Ticker {
  symbol: string
  base: string
  price: number
  change: number
  changePct: number
  high24h: number
  low24h: number
  openPrice: number
  volume24h: number      // quote volume (USD)
  volumeBase: number     // base asset volume
  timestamp: number
}

export async function fetchTicker(input: string): Promise<Ticker> {
  const symbol = toBinanceSymbol(input)
  const d = await getJSON(`${BASE}/api/v3/ticker/24hr?symbol=${symbol}`)
  return {
    symbol: d.symbol,
    base: toBaseSymbol(input),
    price: parseFloat(d.lastPrice),
    change: parseFloat(d.priceChange),
    changePct: parseFloat(d.priceChangePercent),
    high24h: parseFloat(d.highPrice),
    low24h: parseFloat(d.lowPrice),
    openPrice: parseFloat(d.openPrice),
    volume24h: parseFloat(d.quoteVolume),
    volumeBase: parseFloat(d.volume),
    timestamp: Date.now(),
  }
}

export interface Candle {
  time: number   // seconds (UTC)
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export async function fetchCandles(input: string, interval = '15m', limit = 200): Promise<Candle[]> {
  const symbol = toBinanceSymbol(input)
  const raw = await getJSON(`${BASE}/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`)
  return raw.map((c: any[]) => ({
    time: Math.floor(c[0] / 1000),
    open: parseFloat(c[1]),
    high: parseFloat(c[2]),
    low: parseFloat(c[3]),
    close: parseFloat(c[4]),
    volume: parseFloat(c[5]),
  }))
}

export interface OrderBook {
  asks: [string, string][]
  bids: [string, string][]
  lastUpdateId: number
}

export async function fetchOrderBook(input: string, limit = 20): Promise<OrderBook> {
  const symbol = toBinanceSymbol(input)
  return getJSON(`${BASE}/api/v3/depth?symbol=${symbol}&limit=${limit}`)
}

/** Fetch tickers for multiple symbols in parallel (used by scanner & watchlist). */
export async function fetchMultipleTickers(inputs: string[]): Promise<Ticker[]> {
  const results = await Promise.all(
    inputs.map(s => fetchTicker(s).catch(() => null))
  )
  return results.filter((r): r is Ticker => r !== null)
}

/**
 * Real-time ticker stream via Binance WebSocket (direct from browser).
 * No server proxy needed — Binance public streams are CORS-enabled.
 */
export class TickerStream {
  private ws: WebSocket | null = null
  private symbol: string
  private handlers = new Set<(t: Partial<Ticker>) => void>()
  private reconnectAttempts = 0
  private reconnectTimer: number | null = null
  private closed = false

  constructor(input: string) {
    this.symbol = toBinanceSymbol(input)
  }

  connect() {
    if (this.closed) return
    const stream = `${this.symbol.toLowerCase()}@ticker`
    const url = `wss://stream.binance.com:9443/ws/${stream}`
    try {
      this.ws = new WebSocket(url)
    } catch {
      this.scheduleReconnect()
      return
    }

    this.ws.onopen = () => {
      this.reconnectAttempts = 0
    }

    this.ws.onmessage = (e) => {
      try {
        const d = JSON.parse(e.data)
        // Binance @ticker stream fields
        const ticker: Partial<Ticker> = {
          symbol: d.s,
          price: parseFloat(d.c),
          change: parseFloat(d.p),
          changePct: parseFloat(d.P),
          high24h: parseFloat(d.h),
          low24h: parseFloat(d.l),
          openPrice: parseFloat(d.o),
          volume24h: parseFloat(d.q),
          volumeBase: parseFloat(d.v),
          timestamp: Date.now(),
        }
        this.handlers.forEach(h => h(ticker))
      } catch {}
    }

    this.ws.onclose = () => {
      if (!this.closed) this.scheduleReconnect()
    }

    this.ws.onerror = () => {
      this.ws?.close()
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return
    this.reconnectAttempts++
    const delay = Math.min(1000 * 2 ** this.reconnectAttempts, 15000)
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null
      this.connect()
    }, delay)
  }

  on(cb: (t: Partial<Ticker>) => void): () => void {
    this.handlers.add(cb)
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) this.connect()
    return () => {
      this.handlers.delete(cb)
      if (this.handlers.size === 0) this.close()
    }
  }

  close() {
    this.closed = true
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    if (this.ws) {
      this.ws.onclose = null
      this.ws.onerror = null
      this.ws.onmessage = null
      try { this.ws.close() } catch {}
      this.ws = null
    }
  }
}

/** Multi-symbol ticker stream using combined stream connection. */
export class MultiTickerStream {
  private ws: WebSocket | null = null
  private symbols: string[]
  private handlers = new Map<string, Set<(t: Partial<Ticker>) => void>>()
  private reconnectAttempts = 0
  private reconnectTimer: number | null = null
  private closed = false

  constructor(inputs: string[]) {
    this.symbols = inputs.map(toBinanceSymbol)
  }

  connect() {
    if (this.closed || this.symbols.length === 0) return
    const streams = this.symbols
      .map(s => `${s.toLowerCase()}@ticker`)
      .join('/')
    const url = `wss://stream.binance.com:9443/stream?streams=${streams}`
    try {
      this.ws = new WebSocket(url)
    } catch {
      this.scheduleReconnect()
      return
    }

    this.ws.onopen = () => { this.reconnectAttempts = 0 }

    this.ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data)
        const d = msg.data
        if (!d || !d.s) return
        const sym = d.s
        const ticker: Partial<Ticker> = {
          symbol: sym,
          price: parseFloat(d.c),
          change: parseFloat(d.p),
          changePct: parseFloat(d.P),
          high24h: parseFloat(d.h),
          low24h: parseFloat(d.l),
          openPrice: parseFloat(d.o),
          volume24h: parseFloat(d.q),
          volumeBase: parseFloat(d.v),
          timestamp: Date.now(),
        }
        const cbs = this.handlers.get(sym)
        if (cbs) cbs.forEach(h => h(ticker))
      } catch {}
    }

    this.ws.onclose = () => {
      if (!this.closed) this.scheduleReconnect()
    }

    this.ws.onerror = () => { this.ws?.close() }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return
    this.reconnectAttempts++
    const delay = Math.min(1000 * 2 ** this.reconnectAttempts, 15000)
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null
      this.connect()
    }, delay)
  }

  subscribe(input: string, cb: (t: Partial<Ticker>) => void): () => void {
    const sym = toBinanceSymbol(input)
    if (!this.handlers.has(sym)) this.handlers.set(sym, new Set())
    this.handlers.get(sym)!.add(cb)
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) this.connect()
    return () => {
      this.handlers.get(sym)?.delete(cb)
    }
  }

  close() {
    this.closed = true
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    if (this.ws) {
      this.ws.onclose = null
      this.ws.onerror = null
      this.ws.onmessage = null
      try { this.ws.close() } catch {}
      this.ws = null
    }
  }
}
