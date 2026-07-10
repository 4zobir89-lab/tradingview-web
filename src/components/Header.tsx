import { useState, useEffect } from 'react'
import { useTheme, useLocale, useT } from '../shared/hooks'
import { fetchTicker } from '../core/binance'
import { formatPrice, formatPct } from '../core/format'

interface Props {
  activePanel: string
  onPanelChange: (p: string) => void
  onMenuClick?: () => void
}

const QUICK_SYMBOLS = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP']

export default function Header({ activePanel, onPanelChange, onMenuClick }: Props) {
  const [theme, toggleTheme] = useTheme()
  const [locale, setLocale] = useLocale()
  const tt = useT()
  const [search, setSearch] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [prices, setPrices] = useState<Record<string, { price: number; changePct: number }>>({})

  // Live price ticker for quick symbols
  useEffect(() => {
    let mounted = true
    Promise.all(QUICK_SYMBOLS.map(s => fetchTicker(s).catch(() => null))).then(results => {
      if (!mounted) return
      const map: Record<string, { price: number; changePct: number }> = {}
      results.forEach((r, i) => {
        if (r) map[QUICK_SYMBOLS[i]] = { price: r.price, changePct: r.changePct }
      })
      setPrices(map)
    })
    const iv = setInterval(() => {
      Promise.all(QUICK_SYMBOLS.map(s => fetchTicker(s).catch(() => null))).then(results => {
        if (!mounted) return
        const map: Record<string, { price: number; changePct: number }> = {}
        results.forEach((r, i) => {
          if (r) map[QUICK_SYMBOLS[i]] = { price: r.price, changePct: r.changePct }
        })
        setPrices(map)
      })
    }, 10000)
    return () => { mounted = false; clearInterval(iv) }
  }, [])

  const go = (sym: string) => {
    setSearch(sym)
    onPanelChange('chart:' + sym + '-USD')
  }

  const handleSearch = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && search.trim()) {
      const q = search.trim().toUpperCase()
      const sym = q.includes('-') || q.includes('USDT') ? q : q + '-USD'
      onPanelChange('chart:' + sym)
    }
  }

  return (
    <header className="app-header no-select">
      {/* Mobile menu button (hamburger) */}
      {onMenuClick && (
        <button className="header-menu-btn" onClick={onMenuClick} aria-label="Menu">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M3 12h18M3 6h18M3 18h18" />
          </svg>
        </button>
      )}

      {/* Logo */}
      <div className="header-logo" onClick={() => onPanelChange('chart')}>
        <div className="header-logo-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M3 17l6-6 4 4 8-8" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M14 7h7v7" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <span className="header-logo-text">TradeX</span>
        <span className="header-logo-badge">PRO</span>
      </div>

      {/* Live Price Ticker */}
      <div className="header-prices">
        {QUICK_SYMBOLS.map(s => {
          const p = prices[s]
          if (!p) return (
            <div key={s} className="header-price-item">
              <span className="header-price-sym">{s}</span>
              <span className="header-price-val">--</span>
            </div>
          )
          const isUp = p.changePct >= 0
          return (
            <button
              key={s}
              className="header-price-item"
              onClick={() => go(s)}
            >
              <span className="header-price-sym">{s}</span>
              <span className="header-price-val">${formatPrice(p.price)}</span>
              <span className="header-price-chg" style={{ color: isUp ? 'var(--green)' : 'var(--red)' }}>
                {formatPct(p.changePct)}
              </span>
            </button>
          )
        })}
      </div>

      {/* Search */}
      <div className="header-search">
        <svg className="header-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
        </svg>
        <input value={search} onChange={e => setSearch(e.target.value)}
          onKeyDown={handleSearch}
          placeholder={tt('common.search') + ' (BTC, ETH...)'} />
        <kbd className="header-search-kbd">↵</kbd>
      </div>

      {/* Right Side */}
      <div className="header-right">
        {/* Language */}
        <button className="header-lang-btn" onClick={() => setLocale(locale === 'en' ? 'ar' : 'en')} title="Language">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
          </svg>
          <span>{locale === 'en' ? 'ع' : 'EN'}</span>
        </button>

        {/* Theme */}
        <button className="header-btn" onClick={toggleTheme} title={theme === 'dark' ? 'Light mode' : 'Dark mode'}>
          {theme === 'dark' ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="5"/>
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          )}
        </button>

        {/* Settings */}
        <div style={{ position: 'relative' }}>
          <button className="header-btn" onClick={() => setShowSettings(!showSettings)} title="Settings">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>
            </svg>
          </button>
          {showSettings && (
            <>
              <div className="header-backdrop" onClick={() => setShowSettings(false)} />
              <div className="header-dropdown animate-fade-in">
                <div className="header-dropdown-row">
                  <span className="header-dropdown-label">{tt('settings.theme')}</span>
                  <button className="header-dropdown-btn" onClick={toggleTheme}>
                    {theme === 'dark' ? tt('settings.dark') : tt('settings.light')}
                  </button>
                </div>
                <div className="header-dropdown-row">
                  <span className="header-dropdown-label">{tt('settings.language')}</span>
                  <button className="header-dropdown-btn" onClick={() => setLocale(locale === 'en' ? 'ar' : 'en')}>
                    {locale === 'en' ? 'العربية' : 'English'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
