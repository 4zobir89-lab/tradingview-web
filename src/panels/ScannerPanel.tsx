import { useState, useEffect } from 'react'
import { api } from '../core/api'
import { useT } from '../shared/hooks'

export default function ScannerPanel() {
  const tt = useT()
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [scanType, setScanType] = useState('all')

  useEffect(() => {
    setLoading(true)
    api.scanAll()
      .then(({ all, gainers, losers }) => {
        let data = scanType === 'losers' ? losers : scanType === 'gainers' ? gainers : all
        setResults(data.slice(0, 20))
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [scanType])

  return (
    <div className="panel">
      <div className="panel-head">
        <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
          </svg>
          {tt('nav.scanner')}
        </h3>
        <div className="tabs">
          {[
            { id: 'all', label: 'All' },
            { id: 'gainers', label: tt('market.gainers') },
            { id: 'losers', label: tt('market.losers') },
          ].map(tab => (
            <button key={tab.id} className={`tab ${scanType === tab.id ? 'active' : ''}`} onClick={() => setScanType(tab.id)}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      <div className="panel-body" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-3)' }}>
            <div className="animate-pulse">{tt('common.loading')}</div>
          </div>
        ) : results.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-3)' }}>{tt('common.noData')}</div>
        ) : (
          <div className="table-wrap">
            <table className="t">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Symbol</th>
                  <th style={{ textAlign: 'right' }}>Price</th>
                  <th style={{ textAlign: 'right' }}>24h %</th>
                  <th style={{ textAlign: 'right' }}>Volume</th>
                </tr>
              </thead>
              <tbody>
                {results.map((item, i) => {
                  const ch = item.changePct ?? 0
                  const isUp = ch >= 0
                  const sym = item.base || (item.symbol || '').replace('USDT', '')
                  return (
                    <tr key={item.symbol || i}>
                      <td style={{ color: 'var(--text-4)' }}>{i + 1}</td>
                      <td style={{ fontWeight: 600 }}>{sym}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                        ${Number(item.price || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <span className={`badge ${isUp ? 'badge-g' : 'badge-r'}`}>
                          {isUp ? '+' : ''}{Number(ch).toFixed(2)}%
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-3)' }}>
                        {item.volume ? '$' + (item.volume / 1e6).toFixed(1) + 'M' : '--'}
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
