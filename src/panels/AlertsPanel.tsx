import { useState } from 'react'
import { useT } from '../shared/hooks'
import type { Alert } from '../types'

export default function AlertsPanel({ symbol }: { symbol: string }) {
  const tt = useT()
  const [alerts, setAlerts] = useState<Alert[]>([
    { id: '1', symbol: 'BTC-USD', type: 'price', condition: 'above', value: 70000, active: true, triggered: false },
    { id: '2', symbol: 'ETH-USD', type: 'rsi', condition: 'below', value: 30, active: true, triggered: false },
  ])
  const [newType, setNewType] = useState<Alert['type']>('price')
  const [newVal, setNewVal] = useState('')
  const [newCond, setNewCond] = useState<Alert['condition']>('above')

  const add = () => {
    if (!newVal) return
    setAlerts(p => [...p, {
      id: Date.now().toString(),
      symbol,
      type: newType,
      condition: newCond,
      value: Number(newVal),
      active: true,
      triggered: false,
    }])
    setNewVal('')
  }

  return (
    <div className="panel">
      <div className="panel-head">
        <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/>
          </svg>
          {tt('alerts.title')}
        </h3>
        <span className="badge badge-a">{alerts.filter(a => a.active).length} active</span>
      </div>
      <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* New Alert Form */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">{tt('alerts.new')}</span>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <select className="select" value={newType} onChange={e => setNewType(e.target.value as any)}>
                <option value="price">Price</option>
                <option value="rsi">RSI</option>
                <option value="ema">EMA</option>
                <option value="macd">MACD</option>
                <option value="volume">Volume</option>
              </select>
              <select className="select" value={newCond} onChange={e => setNewCond(e.target.value as any)}>
                <option value="above">Above</option>
                <option value="below">Below</option>
                <option value="crosses">Crosses</option>
              </select>
              <input className="input" type="number" placeholder="Value" value={newVal}
                onChange={e => setNewVal(e.target.value)} style={{ width: 100 }}
                onKeyDown={e => e.key === 'Enter' && add()} />
              <button className="btn btn-p" onClick={add}>+ Add</button>
            </div>
          </div>
        </div>

        {/* Alert List */}
        {alerts.map(a => (
          <div key={a.id} className={`alert-card ${a.triggered ? 'triggered' : ''}`}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontWeight: 600, fontSize: 13 }}>{a.symbol}</span>
                <span className={`badge badge-a`}>{a.type.toUpperCase()}</span>
                {a.triggered && <span className="badge badge-y">Triggered</span>}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
                {a.condition} ${a.value.toLocaleString()}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                className={`btn btn-sm ${a.active ? 'btn-g' : ''}`}
                onClick={() => setAlerts(p => p.map(x => x.id === a.id ? { ...x, active: !x.active } : x))}
              >
                {a.active ? 'ON' : 'OFF'}
              </button>
              <button
                className="btn btn-sm btn-ghost"
                onClick={() => setAlerts(p => p.filter(x => x.id !== a.id))}
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
