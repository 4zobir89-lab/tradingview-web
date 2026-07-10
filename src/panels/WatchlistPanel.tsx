import { useState, useEffect } from 'react'
import { api, subscribeTicker } from '../core/api'
import { useT } from '../shared/hooks'

export default function WatchlistPanel({ symbol, onSelect }: { symbol: string; onSelect: (s: string) => void }) {
  const tt = useT()
  const [items, setItems] = useState<Map<string, any>>(new Map())
  const [loading, setLoading] = useState(true)
  const symbols = ['BTC-USD', 'ETH-USD', 'SOL-USD', 'BNB-USD', 'XRP-USD', 'ADA-USD', 'DOGE-USD', 'DOT-USD', 'AVAX-USD', 'LINK-USD', 'MATIC-USD', 'UNI-USD', 'LTC-USD', 'ATOM-USD', 'NEAR-USD', 'APT-USD', 'ARBUSDT', 'OPUSDT']

  // Initial load
  useEffect(() => {
    let mounted = true
    Promise.all(symbols.map(s => api.ticker(s).catch(() => null)))
      .then(results => {
        if (!mounted) return
        const map = new Map<string, any>()
        results.forEach((r, i) => { if (r && !r.error) map.set(symbols[i], { ...r, _sym: symbols[i] }) })
        setItems(map)
        setLoading(false)
      })
    return () => { mounted = false }
  }, [])

  // Real-time updates for all symbols
  useEffect(() => {
    const unsubs = symbols.map(s => {
      return subscribeTicker(s, (data) => {
        setItems(prev => {
          const next = new Map(prev)
          const existing = next.get(s)
          if (existing) next.set(s, { ...existing, price: data.price, change_pct: data.change_pct, volume24h: data.volume24h })
          return next
        })
      })
    })
    return () => unsubs.forEach(u => u())
  }, [])

  const sortedSymbols = [...symbols].sort((a, b) => {
    const itemA = items.get(a)
    const itemB = items.get(b)
    if (!itemA || !itemB) return 0
    const volA = itemA.volume24h || itemA.quoteVolume || 0
    const volB = itemB.volume24h || itemB.quoteVolume || 0
    return volB - volA
  })

  return (
    <div className="panel">
      <div className="panel-head">
        <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
          {tt('nav.watchlist')}
        </h3>
        <span style={{ fontSize: 9, color: 'var(--green)', display: 'flex', alignItems: 'center', gap: 4 }}>
          <span className="chart-loading-dot" style={{ background: 'var(--green)' }} />
          LIVE
        </span>
      </div>
      <div className="panel-body" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-3)' }}>
            <div className="animate-pulse">{tt('common.loading')}</div>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="t">
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th style={{ textAlign: 'right' }}>Price</th>
                  <th style={{ textAlign: 'right' }}>24h %</th>
                  <th style={{ textAlign: 'right' }}>Vol</th>
                </tr>
              </thead>
              <tbody>
                {sortedSymbols.map(s => {
                  const item = items.get(s)
                  if (!item) return null
                  const isUp = (item.change_pct ?? 0) >= 0
                  const name = (item.symbol || s.split('-')[0]).replace('USDT', '')
                  return (
                    <tr key={s} onClick={() => onSelect(s)}
                      style={{ background: s === symbol ? 'var(--accent-subtle)' : undefined }}>
                      <td style={{ fontWeight: 600 }}>{name}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                        ${Number(item.price || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <span className={`badge ${isUp ? 'badge-g' : 'badge-r'}`}>
                          {isUp ? '+' : ''}{Number(item.change_pct ?? 0).toFixed(2)}%
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-3)' }}>
                        {item.volume24h ? '$' + (item.volume24h / 1e6).toFixed(0) + 'M' : '--'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
