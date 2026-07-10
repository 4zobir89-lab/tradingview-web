import { useState, useRef, useEffect } from 'react'
import { useT } from '../shared/hooks'

interface Line { type: 'in'|'out'|'err'|'info'; text: string }

export default function TerminalPanel({ symbol, onCommand }: { symbol: string; onCommand: (c: string) => void }) {
  const tt = useT()
  const [hist, setHist] = useState<Line[]>([
    { type: 'info', text: '╔══════════════════════════════════════════╗' },
    { type: 'info', text: '║   TradeX Terminal v3.0                  ║' },
    { type: 'info', text: '║   Type "help" for commands              ║' },
    { type: 'info', text: '╚══════════════════════════════════════════╝' },
  ])
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => { scrollRef.current?.scrollTo(0, 99999) }, [hist])

  const exec = (raw: string) => {
    const t = raw.trim()
    if (!t) return
    setHist(p => [...p, { type: 'in', text: `> ${t}` }])
    const [cmd, ...args] = t.split(/\s+/)
    const c = cmd.toLowerCase()
    let out = ''

    switch (c) {
      case 'help':
        out = `Available Commands:
  analyze <sym>  - Analyze a symbol
  scan           - Open market scanner
  watch <sym>    - Open watchlist
  price <sym>    - Show chart
  strategy       - Strategy builder
  backtest       - Run backtest
  alerts         - Manage alerts
  market         - Market overview
  news           - Latest news
  chart <sym>    - Open chart
  clear          - Clear terminal
  help           - Show this help`
        break
      case 'clear': setHist([]); return
      case 'analyze':
        onCommand('ai')
        out = `Analyzing ${args[0] || symbol}...`
        break
      case 'scan':
        onCommand('scanner')
        out = 'Opening scanner...'
        break
      case 'watch':
        onCommand('watchlist')
        out = `Watching ${args[0] || symbol}`
        break
      case 'price':
        onCommand('chart:' + (args[0] || symbol))
        out = `Chart: ${args[0] || symbol}`
        break
      case 'strategy':
        onCommand('strategy')
        out = 'Opening strategy builder...'
        break
      case 'backtest':
        onCommand('backtest')
        out = 'Opening backtest...'
        break
      case 'alerts':
        onCommand('alerts')
        out = 'Opening alerts...'
        break
      case 'market':
        onCommand('market')
        out = 'Opening market...'
        break
      case 'news':
        onCommand('news')
        out = 'Opening news...'
        break
      case 'chart':
        onCommand('chart:' + (args[0] || symbol))
        out = `Chart: ${args[0] || symbol}`
        break
      case 'ai':
        onCommand('ai')
        out = 'Opening AI Assistant...'
        break
      default:
        out = `Unknown command: ${c}. Type "help" for available commands.`
    }
    setHist(p => [...p, { type: 'out', text: out }])
  }

  return (
    <div className="panel">
      <div className="panel-head">
        <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
            <path d="M4 17l6-6-6-6M12 19h8"/>
          </svg>
          {tt('terminal.title')}
        </h3>
        <span style={{ fontSize: 10, color: 'var(--text-4)', fontFamily: 'var(--font-mono)' }}>
          C:\TradeX&gt;
        </span>
      </div>
      <div ref={scrollRef} className="term-body">
        {hist.map((l, i) => (
          <div key={i} style={{
            color: l.type === 'in' ? 'var(--accent)' :
                   l.type === 'err' ? 'var(--red)' :
                   l.type === 'info' ? 'var(--purple)' : 'var(--text-2)'
          }}>
            {l.text}
          </div>
        ))}
      </div>
      <div className="term-input-bar">
        <span className="term-prompt">&gt;</span>
        <input
          className="term-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { exec(input); setInput('') } }}
          placeholder={tt('terminal.placeholder')}
          autoFocus
        />
      </div>
    </div>
  )
}
