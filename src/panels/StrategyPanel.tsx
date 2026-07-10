import { useState } from 'react'
import { useT } from '../shared/hooks'
import type { Strategy } from '../types'

export default function StrategyPanel() {
  const tt = useT()
  const [name, setName] = useState('')
  const [conditions, setConditions] = useState('')
  const [compiled, setCompiled] = useState(false)
  const [strategies, setStrategies] = useState<Strategy[]>([
    { id: '1', name: 'EMA Crossover', description: 'اشترِ عندما يتقاطع EMA20 فوق EMA50 و RSI < 70', conditions: 'EMA20 > EMA50 and RSI < 70', code: 'if (ema20 > ema50 && rsi < 70) buy()' },
    { id: '2', name: 'RSI Reversal', description: 'اشترِ عندما ينزل RSI < 30 مع ارتفاع الحجم', conditions: 'RSI < 30 and volume > average', code: 'if (rsi < 30 && volume > avgVolume) buy()' },
    { id: '3', name: 'Bollinger Bounce', description: 'اشترِ عند الارتداد من الحد السفلي لبولنجر', conditions: 'Price touches Bollinger Lower and RSI < 40', code: 'if (price <= bbLower && rsi < 40) buy()' },
  ])

  const compile = () => {
    if (!conditions.trim()) return
    const s: Strategy = {
      id: Date.now().toString(),
      name: name || `Strategy ${strategies.length + 1}`,
      description: conditions.slice(0, 100),
      conditions,
      code: `// Auto-compiled\nif (${conditions.toLowerCase().replace(/and/g, '&&').replace(/or/g, '||')}) {\n  buy();\n}`,
    }
    setStrategies(p => [...p, s])
    setCompiled(true)
    setTimeout(() => setCompiled(false), 2000)
    setName('')
    setConditions('')
  }

  return (
    <div className="panel">
      <div className="panel-head">
        <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
            <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/>
          </svg>
          {tt('strategy.title')}
        </h3>
      </div>
      <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* New Strategy Form */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">إنشاء استراتيجية جديدة</span>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input className="input" placeholder={tt('strategy.name')} value={name} onChange={e => setName(e.target.value)} />
            <textarea className="input" placeholder={tt('strategy.placeholder')} value={conditions}
              onChange={e => setConditions(e.target.value)}
              style={{ minHeight: 80, resize: 'vertical', fontFamily: 'inherit' }} />
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-p" onClick={compile}>
                {compiled ? '✓ Compiled!' : tt('strategy.compile')}
              </button>
              <button className="btn" onClick={() => { setName(''); setConditions('') }}>{tt('common.cancel')}</button>
            </div>
          </div>
        </div>

        {/* Saved Strategies */}
        <div className="dash-label">الاستراتيجيات المحفوظة</div>
        {strategies.map(s => (
          <div key={s.id} className="strategy-card">
            <div className="strategy-header">
              <span className="strategy-name">{s.name}</span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn btn-sm btn-p">{tt('strategy.test')}</button>
                <button className="btn btn-sm btn-ghost">{tt('common.delete')}</button>
              </div>
            </div>
            <div className="strategy-desc">{s.description}</div>
            {s.code && <pre className="strategy-code">{s.code}</pre>}
          </div>
        ))}
      </div>
    </div>
  )
}
