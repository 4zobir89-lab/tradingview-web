const BASE = '/api'

async function get<T = any>(path: string): Promise<T> {
  const r = await fetch(`${BASE}${path}`)
  if (!r.ok) throw new Error(`API ${r.status}`)
  return r.json()
}

async function post<T = any>(path: string, body: any): Promise<T> {
  const r = await fetch(`${BASE}${path}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  })
  if (!r.ok) throw new Error(`API ${r.status}`)
  return r.json()
}

function sym(s: string) { return s.replace(/-USD/gi, '').replace(/USDT/gi, '') }

export const api = {
  health: () => get('/health'),
  ticker: (s: string) => get(`/ticker/${sym(s)}`),
  price: (s: string) => get(`/price/${s}`),
  analysis: (s: string) => get(`/analysis/${sym(s)}`),
  multiAnalysis: (s: string) => get(`/multi-analysis/${sym(s)}`),
  candles: (s: string, tf: string = '15m', limit: number = 200) =>
    get(`/candles/${sym(s)}?timeframe=${tf}&limit=${limit}`),
  orderbook: (s: string) => get(`/orderbook/${sym(s)}`),
  gainers: (exchange: string, tf: string, limit: number) =>
    get(`/gainers/${exchange}/${tf}/${limit}`),
  losers: (exchange: string, tf: string, limit: number) =>
    get(`/losers/${exchange}/${tf}/${limit}`),
  backtest: (body: any) => post('/backtest', body),
  market: () => get('/market'),
  news: () => get('/news'),
  sentiment: () => get('/sentiment'),
  multiAgent: (s: string) => get(`/multi-agent/${sym(s)}`),
  chat: (message: string, symbol: string = 'BTC-USD') =>
    post('/chat', { message, symbol }),
}

// ── WebSocket for real-time ─────────────────────────────────────
type TickerCallback = (data: any) => void
const listeners = new Map<string, Set<TickerCallback>>()
let ws: WebSocket | null = null
let reconnectTimer: number | null = null

function connectWS() {
  const proto = location.protocol === 'https:' ? 'wss:' : 'ws:'
  ws = new WebSocket(`${proto}//${location.host}/ws`)
  ws.onmessage = (e) => {
    try {
      const msg = JSON.parse(e.data)
      if (msg.type === 'ticker') {
        const cbs = listeners.get(msg.symbol)
        if (cbs) for (const cb of cbs) cb(msg)
      }
    } catch {}
  }
  ws.onclose = () => { reconnectTimer = window.setTimeout(connectWS, 3000) }
  ws.onerror = () => ws?.close()
}

export function subscribeTicker(symbol: string, cb: TickerCallback) {
  const key = sym(symbol).toUpperCase() + 'USDT'
  if (!listeners.has(key)) listeners.set(key, new Set())
  listeners.get(key)!.add(cb)
  if (!ws || ws.readyState !== 1) connectWS()
  if (ws?.readyState === 1) ws.send(JSON.stringify({ type: 'subscribe', symbol: key }))
  return () => { listeners.get(key)?.delete(cb) }
}
