import { useState, useEffect } from 'react'
import { api, subscribeTicker } from '../core/api'
import { useT } from '../shared/hooks'
import { formatPrice, formatPct, formatVolume, formatCompact } from '../core/format'

export default function DashboardPanel({ symbol }: { symbol: string }) {
  const tt = useT()
  const [ticker, setTicker] = useState<any>(null)
  const [analysis, setAnalysis] = useState<any>(null)
  const [market, setMarket] = useState<any>(null)
  const [sentiment, setSentiment] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      api.ticker(symbol).catch(() => null),
      api.analysis(symbol).catch(() => null),
      api.market().catch(() => null),
      api.sentiment().catch(() => null),
    ]).then(([t, a, m, s]) => {
      setTicker(t)
      setAnalysis(a)
      setMarket(m)
      setSentiment(s)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [symbol])

  // Real-time price updates
  useEffect(() => {
    return subscribeTicker(symbol, (data) => {
      setTicker((prev: any) => prev ? {
        ...prev,
        price: data.price,
        changePct: data.changePct,
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

  const isUp = (ticker.changePct ?? 0) >= 0
  const sym = ticker.base || (ticker.symbol || 'BTCUSDT').replace('USDT', '')

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
      <div className="panel-body" style={{ overflow: 'auto' }}>
        {/* Symbol-specific data */}
        <div className="dash-label" style={{ marginBottom: 8 }}>{sym} / USDT</div>
        <div className="dash-grid" style={{ marginBottom: 16 }}>
          <div className="dash-card" style={{ gridColumn: 'span 2' }}>
            <div className="dash-label">{tt('dash.price')}</div>
            <div className="dash-val" style={{ color: isUp ? 'var(--green)' : 'var(--red)', fontSize: 20 }}>
              ${formatPrice(ticker.price)}
            </div>
          </div>
          <div className="dash-card">
            <div className="dash-label">{tt('dash.change24h')}</div>
            <div className="dash-val" style={{ color: isUp ? 'var(--green)' : 'var(--red)' }}>
              {formatPct(ticker.changePct)}
            </div>
          </div>
          <div className="dash-card">
            <div className="dash-label">{tt('dash.high')}</div>
            <div className="dash-val" style={{ color: 'var(--green)' }}>
              {ticker.high24h ? `$${formatPrice(ticker.high24h)}` : '--'}
            </div>
          </div>
          <div className="dash-card">
            <div className="dash-label">{tt('dash.low')}</div>
            <div className="dash-val" style={{ color: 'var(--red)' }}>
              {ticker.low24h ? `$${formatPrice(ticker.low24h)}` : '--'}
            </div>
          </div>
          <div className="dash-card">
            <div className="dash-label">{tt('dash.volume24h')}</div>
            <div className="dash-val">
              {formatVolume(ticker.volume24h)}
            </div>
          </div>
          <div className="dash-card">
            <div className="dash-label">Open</div>
            <div className="dash-val">
              {ticker.openPrice ? `$${formatPrice(ticker.openPrice)}` : '--'}
            </div>
          </div>
        </div>

        {/* Analysis indicators */}
        {analysis && (
          <>
            <div className="dash-label" style={{ marginBottom: 8 }}>Technical Analysis</div>
            <div className="dash-grid" style={{ marginBottom: 16 }}>
              <div className="dash-card" style={{ gridColumn: 'span 2' }}>
                <div className="dash-label">Signal</div>
                <div className="dash-val" style={{
                  color: analysis.signal?.includes('BUY') ? 'var(--green)' :
                         analysis.signal?.includes('SELL') ? 'var(--red)' : 'var(--accent)',
                  fontSize: 16,
                }}>
                  {analysis.signal || 'N/A'}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-4)', marginTop: 2 }}>
                  Score: {analysis.score?.toFixed(0)}% • Bull: {analysis.bullish} Bear: {analysis.bearish}
                </div>
              </div>
              <div className="dash-card">
                <div className="dash-label">RSI (14)</div>
                <div className="dash-val" style={{
                  color: analysis.indicators?.rsi < 30 ? 'var(--green)' :
                         analysis.indicators?.rsi > 70 ? 'var(--red)' : 'var(--text-1)'
                }}>
                  {analysis.indicators?.rsi?.toFixed(1) || 'N/A'}
                </div>
              </div>
              <div className="dash-card">
                <div className="dash-label">MACD Hist</div>
                <div className="dash-val" style={{
                  color: analysis.indicators?.macd?.histogram > 0 ? 'var(--green)' : 'var(--red)'
                }}>
                  {analysis.indicators?.macd?.histogram?.toFixed(2) || 'N/A'}
                </div>
              </div>
              <div className="dash-card">
                <div className="dash-label">EMA 20</div>
                <div className="dash-val" style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>
                  {analysis.indicators?.ema20 ? `$${formatPrice(analysis.indicators.ema20)}` : 'N/A'}
                </div>
              </div>
              <div className="dash-card">
                <div className="dash-label">EMA 50</div>
                <div className="dash-val" style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>
                  {analysis.indicators?.ema50 ? `$${formatPrice(analysis.indicators.ema50)}` : 'N/A'}
                </div>
              </div>
              <div className="dash-card">
                <div className="dash-label">ADX</div>
                <div className="dash-val">
                  {analysis.indicators?.adx?.toFixed(1) || 'N/A'}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Global market overview */}
        {market && (
          <>
            <div className="dash-label" style={{ marginBottom: 8 }}>Global Market</div>
            <div className="dash-grid" style={{ marginBottom: 16 }}>
              <div className="dash-card">
                <div className="dash-label">Total Market Cap</div>
                <div className="dash-val" style={{ fontSize: 14 }}>
                  {formatVolume(market.totalMarketCap)}
                </div>
              </div>
              <div className="dash-card">
                <div className="dash-label">24h Volume</div>
                <div className="dash-val" style={{ fontSize: 14 }}>
                  {formatVolume(market.totalVolume)}
                </div>
              </div>
              <div className="dash-card">
                <div className="dash-label">MCap Change 24h</div>
                <div className="dash-val" style={{
                  color: market.marketCapChange24h >= 0 ? 'var(--green)' : 'var(--red)'
                }}>
                  {formatPct(market.marketCapChange24h)}
                </div>
              </div>
              <div className="dash-card">
                <div className="dash-label">BTC Dominance</div>
                <div className="dash-val" style={{ color: 'var(--accent)' }}>
                  {market.btcDominance?.toFixed(1)}%
                </div>
              </div>
              <div className="dash-card">
                <div className="dash-label">ETH Dominance</div>
                <div className="dash-val">
                  {market.ethDominance?.toFixed(1)}%
                </div>
              </div>
              <div className="dash-card">
                <div className="dash-label">Active Coins</div>
                <div className="dash-val">
                  {formatCompact(market.activeCryptos)}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Fear & Greed */}
        {sentiment && (
          <>
            <div className="dash-label" style={{ marginBottom: 8 }}>{tt('dash.fearGreed')}</div>
            <div className="dash-card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div>
                  <div className="dash-val" style={{ fontSize: 24, color: 'var(--accent)' }}>
                    {sentiment.fearGreedIndex}
                  </div>
                  <div className="dash-label">{sentiment.fearGreedLabel}</div>
                </div>
                <div style={{ textAlign: 'right', fontSize: 11, color: 'var(--text-3)' }}>
                  <div>Yesterday: <b style={{ color: 'var(--text-1)' }}>{sentiment.fearGreedYesterday}</b></div>
                  <div>Last Week: <b style={{ color: 'var(--text-1)' }}>{sentiment.fearGreedLastWeek}</b></div>
                </div>
              </div>
              <div className="fg-gauge">
                <div className="fg-marker" style={{ left: `${sentiment.fearGreedIndex}%` }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 9, color: 'var(--text-4)' }}>
                <span>Extreme Fear</span>
                <span>Neutral</span>
                <span>Extreme Greed</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
