import { useState, useEffect, useCallback } from 'react'
import { api } from '../core/api'
import { useT } from '../shared/hooks'

export default function OrderBookPanel({ symbol }: { symbol: string }) {
  const tt = useT()
  const [asks, setAsks] = useState<any[]>([])
  const [bids, setBids] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const d = await api.orderbook(symbol)
      setAsks((d.asks || []).slice(0, 15).reverse())
      setBids((d.bids || []).slice(0, 15))
      setLoading(false)
    } catch { setLoading(false) }
  }, [symbol])

  useEffect(() => {
    load()
    const iv = setInterval(load, 3000)
    return () => clearInterval(iv)
  }, [load])

  const maxAmt = Math.max(
    ...asks.map((a: any[]) => parseFloat(a[1])),
    ...bids.map((b: any[]) => parseFloat(b[1])),
    0.01
  )
  const spread = asks.length && bids.length
    ? (parseFloat(asks[asks.length - 1][0]) - parseFloat(bids[0][0])).toFixed(2)
    : '0'

  return (
    <div className="panel">
      <div className="panel-head">
        <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
            <path d="M4 6h16M4 10h16M4 14h16M4 18h16"/>
          </svg>
          {tt('nav.orderbook')}
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
          <>
            <div className="ob-header">
              <span>Price</span>
              <span style={{ textAlign: 'right' }}>Amount</span>
              <span style={{ textAlign: 'right' }}>Total</span>
            </div>
            {asks.map((a: any[], i: number) => {
              const price = parseFloat(a[0])
              const amt = parseFloat(a[1])
              return (
                <div key={i} className="ob-row ask">
                  <div className="ob-bg" style={{ width: `${(amt / maxAmt) * 100}%` }} />
                  <span style={{ color: 'var(--red)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                    {price.toLocaleString()}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, textAlign: 'right' }}>
                    {amt.toFixed(4)}
                  </span>
                  <span style={{ color: 'var(--text-4)', fontFamily: 'var(--font-mono)', fontSize: 11, textAlign: 'right' }}>
                    {(amt * price).toFixed(2)}
                  </span>
                </div>
              )
            })}
            <div className="ob-spread">
              <span style={{ color: 'var(--red)' }}>
                {asks.length ? `$${parseFloat(asks[asks.length - 1][0]).toLocaleString()}` : '--'}
              </span>
              <span style={{ color: 'var(--text-4)', margin: '0 8px', fontSize: 10 }}>
                spread ${spread}
              </span>
              <span style={{ color: 'var(--green)' }}>
                {bids.length ? `$${parseFloat(bids[0][0]).toLocaleString()}` : '--'}
              </span>
            </div>
            {bids.map((b: any[], i: number) => {
              const price = parseFloat(b[0])
              const amt = parseFloat(b[1])
              return (
                <div key={i} className="ob-row bid">
                  <div className="ob-bg" style={{ width: `${(amt / maxAmt) * 100}%` }} />
                  <span style={{ color: 'var(--green)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                    {price.toLocaleString()}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, textAlign: 'right' }}>
                    {amt.toFixed(4)}
                  </span>
                  <span style={{ color: 'var(--text-4)', fontFamily: 'var(--font-mono)', fontSize: 11, textAlign: 'right' }}>
                    {(amt * price).toFixed(2)}
                  </span>
                </div>
              )
            })}
          </>
        )}
      </div>
    </div>
  )
}
