import { useT } from '../shared/hooks'

interface Props {
  activePanel: string
  onPanelChange: (p: string) => void
  drawerOpen?: boolean
  onCloseDrawer?: () => void
}

const panels = [
  { id: 'chart', icon: 'M3 3v18h18', label: 'nav.chart' },
  { id: 'watchlist', icon: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 9a3 3 0 100 6 3 3 0 000-6z', label: 'nav.watchlist' },
  { id: 'portfolio', icon: 'M21 12V7H5a2 2 0 010-4h14v4 M3 5v14a2 2 0 002 2h16v-5 M18 12a2 2 0 000 4h4v-4h-4z', label: 'nav.portfolio' },
  { id: 'orderbook', icon: 'M4 6h16M4 10h16M4 14h16M4 18h16', label: 'nav.orderbook' },
  { id: 'scanner', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z', label: 'nav.scanner' },
  { id: 'market', icon: 'M3 3v18h18 M18 17V9M13 17V5M8 17v-3', label: 'nav.market' },
  { id: 'ai', icon: 'M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7h1.27c.34-.6.99-1 1.73-1a2 2 0 110 4c-.74 0-1.39-.4-1.73-1H20a7 7 0 01-7 7v1.27c.6.34 1 .99 1 1.73a2 2 0 11-4 0c0-.74.4-1.39 1-1.73V20a7 7 0 01-7-7H2.73c-.34.6-.99 1-1.73 1a2 2 0 110-4c.74 0 1.39.4 1.73 1H4a7 7 0 017-7V5.73c-.6-.34-1-.99-1-1.73a2 2 0 012-2z', label: 'nav.ai' },
  { id: 'strategy', icon: 'M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z', label: 'nav.strategy' },
  { id: 'backtest', icon: 'M23 6l-9.5 9.5-5-5L1 18', label: 'nav.backtest' },
  { id: 'alerts', icon: 'M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 01-3.46 0', label: 'nav.alerts' },
  { id: 'news', icon: 'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2', label: 'nav.news' },
  { id: 'terminal', icon: 'M4 17l6-6-6-6 M12 19h8', label: 'nav.terminal' },
]

export default function Sidebar({ activePanel, onPanelChange, drawerOpen, onCloseDrawer }: Props) {
  const tt = useT()
  const cur = activePanel.split(':')[0]

  return (
    <>
      {/* Desktop sidebar (icon rail) */}
      <nav className="sidebar no-select">
        {panels.map(p => (
          <button
            key={p.id}
            className={`sidebar-btn ${cur === p.id ? 'active' : ''}`}
            onClick={() => onPanelChange(p.id)}
            aria-label={tt(p.label)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d={p.icon} />
            </svg>
            <span className="sidebar-tip">{tt(p.label)}</span>
          </button>
        ))}
      </nav>

      {/* Mobile drawer (slide-out panel with labels) */}
      <aside className={`sidebar-drawer ${drawerOpen ? 'open' : ''}`}>
        <div className="drawer-header">
          <span className="drawer-title">Menu</span>
          <button className="drawer-close" onClick={onCloseDrawer} aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="drawer-body">
          {panels.map(p => (
            <button
              key={p.id}
              className={`drawer-item ${cur === p.id ? 'active' : ''}`}
              onClick={() => onPanelChange(p.id)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d={p.icon} />
              </svg>
              <span>{tt(p.label)}</span>
            </button>
          ))}
        </div>
      </aside>
    </>
  )
}
