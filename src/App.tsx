import { useState, useEffect, useCallback } from 'react'
import { useT } from './shared/hooks'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import Footer from './components/Footer'
import ChartPanel from './charts/ChartPanel'
import DashboardPanel from './panels/DashboardPanel'
import WatchlistPanel from './panels/WatchlistPanel'
import ScannerPanel from './panels/ScannerPanel'
import AIAssistantPanel from './panels/AIAssistantPanel'
import StrategyPanel from './panels/StrategyPanel'
import BacktestPanel from './panels/BacktestPanel'
import AlertsPanel from './panels/AlertsPanel'
import NewsPanel from './panels/NewsPanel'
import TerminalPanel from './panels/TerminalPanel'
import OrderBookPanel from './panels/OrderBookPanel'
import { api } from './core/api'

const MOBILE_NAV = [
  { id: 'chart', icon: 'M3 3v18h18', label: 'nav.chart' },
  { id: 'watchlist', icon: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 9a3 3 0 100 6 3 3 0 000-6z', label: 'nav.watchlist' },
  { id: 'scanner', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z', label: 'nav.scanner' },
  { id: 'ai', icon: 'M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7h1.27c.34-.6.99-1 1.73-1a2 2 0 110 4c-.74 0-1.39-.4-1.73-1H20a7 7 0 01-7 7v1.27c.6.34 1 .99 1 1.73a2 2 0 11-4 0c0-.74.4-1.39 1-1.73V20a7 7 0 01-7-7H2.73c-.34.6-.99 1-1.73 1a2 2 0 110-4c.74 0 1.39.4 1.73 1H4a7 7 0 017-7V5.73c-.6-.34-1-.99-1-1.73a2 2 0 012-2z', label: 'nav.ai' },
  { id: 'terminal', icon: 'M4 17l6-6-6-6 M12 19h8', label: 'nav.terminal' },
]

export default function App() {
  const tt = useT()
  const [activePanel, setActivePanel] = useState('chart')
  const [symbol, setSymbol] = useState('BTC-USD')
  const [apiStatus, setApiStatus] = useState<'ok' | 'error' | 'loading'>('loading')

  useEffect(() => {
    api.health().then(() => setApiStatus('ok')).catch(() => setApiStatus('error'))
    const iv = setInterval(() => {
      api.health().then(() => setApiStatus('ok')).catch(() => setApiStatus('error'))
    }, 30000)
    return () => clearInterval(iv)
  }, [])

  const handlePanelChange = useCallback((panel: string) => {
    if (panel.startsWith('chart:')) {
      setSymbol(panel.replace('chart:', ''))
      setActivePanel('chart')
    } else {
      setActivePanel(panel)
    }
  }, [])

  const renderPanel = () => {
    switch (activePanel) {
      case 'chart': return <ChartPanel symbol={symbol} />
      case 'watchlist': return <WatchlistPanel symbol={symbol} onSelect={s => { setSymbol(s); setActivePanel('chart') }} />
      case 'portfolio': return <PortfolioPanel />
      case 'orderbook': return <OrderBookPanel symbol={symbol} />
      case 'scanner': return <ScannerPanel />
      case 'ai': return <AIAssistantPanel symbol={symbol} />
      case 'strategy': return <StrategyPanel />
      case 'backtest': return <BacktestPanel symbol={symbol} />
      case 'alerts': return <AlertsPanel symbol={symbol} />
      case 'news': return <NewsPanel />
      case 'terminal': return <TerminalPanel symbol={symbol} onCommand={handlePanelChange} />
      case 'market': return <DashboardPanel symbol={symbol} />
      default: return <ChartPanel symbol={symbol} />
    }
  }

  return (
    <div className="app-layout">
      <Header activePanel={activePanel} onPanelChange={handlePanelChange} />
      <Sidebar activePanel={activePanel} onPanelChange={handlePanelChange} />

      <main className="main-content">
        <div style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%' }}>
          {renderPanel()}
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="mobile-nav">
        {MOBILE_NAV.map(p => (
          <button key={p.id} className={`mobile-nav-btn ${activePanel === p.id ? 'active' : ''}`}
            onClick={() => handlePanelChange(p.id)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d={p.icon} />
            </svg>
            <span>{tt(p.label)}</span>
          </button>
        ))}
      </nav>

      <Footer apiStatus={apiStatus} />
    </div>
  )
}

function PortfolioPanel() {
  const tt = useT()
  return (
    <div className="panel">
      <div className="panel-head"><h3>{tt('nav.portfolio')}</h3></div>
      <div className="panel-body">
        <div className="dash-grid">
          {[
            { l: 'Total Balance', v: '$125,430.00', c: 'var(--text-1)' },
            { l: 'Unrealized P&L', v: '+$3,240.50', c: 'var(--green)' },
            { l: 'Today P&L', v: '-$180.20', c: 'var(--red)' },
            { l: 'Win Rate', v: '64.2%', c: 'var(--accent)' },
          ].map(m => (
            <div key={m.l} className="dash-card">
              <div className="dash-label">{m.l}</div>
              <div className="dash-val" style={{ color: m.c }}>{m.v}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 16 }}>
          <div className="dash-label" style={{ marginBottom: 8 }}>Open Positions</div>
          <div className="table-wrap">
            <table className="t">
              <thead><tr><th>Symbol</th><th>Side</th><th>Size</th><th>Entry</th><th>Mark</th><th>P&L</th></tr></thead>
              <tbody>
                {[
                  { s: 'BTC', side: 'Long', size: '0.5', entry: '64,200', mark: '65,100', pnl: '+$450' },
                  { s: 'ETH', side: 'Long', size: '5.0', entry: '3,400', mark: '3,380', pnl: '-$100' },
                  { s: 'SOL', side: 'Short', size: '50', entry: '180', mark: '175', pnl: '+$250' },
                ].map(p => (
                  <tr key={p.s}>
                    <td style={{ fontWeight: 600 }}>{p.s}</td>
                    <td><span className={`badge ${p.side === 'Long' ? 'badge-g' : 'badge-r'}`}>{p.side}</span></td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{p.size}</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>${p.entry}</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>${p.mark}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: p.pnl.startsWith('+') ? 'var(--green)' : 'var(--red)' }}>{p.pnl}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
