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

// Bottom nav: 5 most-used panels for quick access
const MOBILE_NAV = [
  { id: 'chart', icon: 'M3 3v18h18', label: 'nav.chart' },
  { id: 'watchlist', icon: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 9a3 3 0 100 6 3 3 0 000-6z', label: 'nav.watchlist' },
  { id: 'scanner', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z', label: 'nav.scanner' },
  { id: 'ai', icon: 'M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7h1.27c.34-.6.99-1 1.73-1a2 2 0 110 4c-.74 0-1.39-.4-1.73-1H20a7 7 0 01-7 7v1.27c.6.34 1 .99 1 1.73a2 2 0 11-4 0c0-.74.4-1.39 1-1.73V20a7 7 0 01-7-7H2.73c-.34.6-.99 1-1.73 1a2 2 0 110-4c.74 0 1.39.4 1.73 1H4a7 7 0 017-7V5.73c-.6-.34-1-.99-1-1.73a2 2 0 012-2z', label: 'nav.ai' },
  { id: 'market', icon: 'M3 3v18h18 M18 17V9M13 17V5M8 17v-3', label: 'nav.market' },
]

export default function App() {
  const tt = useT()
  const [activePanel, setActivePanel] = useState('chart')
  const [symbol, setSymbol] = useState('BTC-USD')
  const [apiStatus, setApiStatus] = useState<'ok' | 'error' | 'loading'>('loading')
  const [drawerOpen, setDrawerOpen] = useState(false)

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
    // Close drawer when a panel is selected (mobile)
    setDrawerOpen(false)
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
      <Header
        activePanel={activePanel}
        onPanelChange={handlePanelChange}
        onMenuClick={() => setDrawerOpen(true)}
      />

      {/* Sidebar: fixed on desktop, drawer on mobile */}
      <Sidebar
        activePanel={activePanel}
        onPanelChange={handlePanelChange}
        drawerOpen={drawerOpen}
        onCloseDrawer={() => setDrawerOpen(false)}
      />

      {/* Backdrop for mobile drawer */}
      {drawerOpen && (
        <div className="drawer-backdrop" onClick={() => setDrawerOpen(false)} />
      )}

      <main className="main-content">
        {renderPanel()}
      </main>

      {/* Mobile bottom nav — quick access to top 5 panels */}
      <nav className="mobile-nav">
        {MOBILE_NAV.map(p => (
          <button
            key={p.id}
            className={`mobile-nav-btn ${activePanel === p.id ? 'active' : ''}`}
            onClick={() => handlePanelChange(p.id)}
          >
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
      <div className="panel-head">
        <h3>{tt('nav.portfolio')}</h3>
        <span className="badge badge-y">Demo</span>
      </div>
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
        <div style={{ marginTop: 16, padding: 12, background: 'var(--bg-2)', border: '1px solid var(--border-1)', borderRadius: 'var(--radius-md)', fontSize: 12, color: 'var(--text-3)' }}>
          ⚡ This is a demo portfolio. Connect your exchange API keys in Settings to track real positions.
        </div>
      </div>
    </div>
  )
}
