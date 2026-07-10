import { useState, useEffect } from 'react'
import { api, subscribeTicker } from '../core/api'
import { useT } from '../shared/hooks'

export default function DashboardPanel({ symbol }: { symbol: string }) {
  const tt = useT()
  const [ticker, setTicker] = useState<any>(null)
  const [analysis, setAnalysis] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      api.ticker(symbol).catch(() => null),
      api.analysis(symbol).catch(() => null),
    ]).then(([t, a]) => {
      setTicker(t)
      setAnalysis(a)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [symbol])

  // Real-time price updates
  useEffect(() => {
    return subscribeTicker(symbol, (data) => {
      setTicker((prev: any) => prev ? {
        ...prev,
        price: data.price,
        change_pct: data.change_pct,
        high24h: data.high24h,
        low24h: data.low24h,
        volume24h: data.volume24h,
      } : prev)
    })
  }, [symbol])

  if (loading) return (
    <div className="panel">
      <div className="panel-head"><h3>{tt('nav.market')}</h3></div>
      <div className="panel-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="animate-pulse" style={{ color: 'var(--text-3)' }}>{tt('common.loading')}</div>
      </div>
    </div>
  )

  if (!ticker) return (
    <div className="panel">
      <div className="panel-head"><h3>{tt('nav.market')}</h3></div>
      <div className="panel-body" style={{ color: 'var(--text-3)', textAlign: 'center', padding: 32 }}>{tt('common.noData')}</div>
    </div>
  )

  const isUp = (ticker.change_pct ?? 0) >= 0
  const sym = (ticker.symbol || 'BTCUSDT').replace('USDT', '')

  return (
    <div className="panel">
      <div className="panel-head">
        <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
            <path d="M3 3v18h18"/>
            <path d="M18 17V9M13 17V5M8 17v-3"/>
          </svg>
          {tt('nav.market')} — {sym}
        </h3>
        <span style={{ fontSize: 9, color: 'var(--green)', display: 'flex', alignItems: 'center', gap: 4 }}>
          <span className="chart-loading-dot" style={{ background: 'var(--green)' }} />
          LIVE
        </span>
      </div>
      <div className="panel-body">
        <div className="dash-grid">
          <div className="dash-card" style={{ gridColumn: 'span 2' }}>
            <div className="dash-label">{tt('dash.price')}</div>
            <div className="dash-val" style={{ color: isUp ? 'var(--green)' : 'var(--red)', fontSize: 20 }}>
              ${Number(ticker.price || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="dash-card">
            <div className="dash-label">{tt('dash.change24h')}</div>
            <div className="dash-val" style={{ color: isUp ? 'var(--green)' : 'var(--red)' }}>
              {isUp ? '+' : ''}{Number(ticker.change_pct ?? 0).toFixed(2)}%
            </div>
          </div>
          <div className="dash-card">
            <div className="dash-label">{tt('dash.high')}</div>
            <div className="dash-val" style={{ color: 'var(--green)' }}>
              {ticker.high24h ? `$${Number(ticker.high24h).toLocaleString()}` : '--'}
            </div>
          </div>
          <div className="dash-card">
            <div className="dash-label">{tt('dash.low')}</div>
            <div className="dash-val" style={{ color: 'var(--red)' }}>
              {ticker.low24h ? `$${Number(ticker.low24h).toLocaleString()}` : '--'}
            </div>
          </div>
          <div className="dash-card">
            <div className="dash-label">{tt('dash.volume24h')}</div>
            <div className="dash-val">
              {ticker.volume24h ? `$${(Number(ticker.volume24h) / 1e6).toFixed(1)}M` : '--'}
            </div>
          </div>
          <div className="dash-card">
            <div className="dash-label">Open</div>
            <div className="dash-val">
              {ticker.openPrice ? `$${Number(ticker.openPrice).toLocaleString()}` : '--'}
            </div>
          </div>
          {analysis && (
            <>
              <div className="dash-card">
                <div className="dash-label">Signal</div>
                <div className="dash-val" style={{
                  color: analysis.signal?.includes('BUY') ? 'var(--green)' :
                         analysis.signal?.includes('SELL') ? 'var(--red)' : 'var(--accent)'
                }}>
                  {analysis.signal || 'N/A'}
                </div>
              </div>
              <div className="dash-card">
                <div className="dash-label">RSI</div>
                <div className="dash-val" style={{
                  color: analysis.indicators?.rsi < 30 ? 'var(--green)' :
                         analysis.indicators?.rsi > 70 ? 'var(--red)' : 'var(--text-1)'
                }}>
                  {analysis.indicators?.rsi?.toFixed(1) || 'N/A'}
                </div>
              </div>
              <div className="dash-card">
                <div className="dash-label">MACD</div>
                <div className="dash-val" style={{
                  color: analysis.indicators?.macd?.histogram > 0 ? 'var(--green)' : 'var(--red)'
                }}>
                  {analysis.indicators?.macd?.histogram?.toFixed(2) || 'N/A'}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
