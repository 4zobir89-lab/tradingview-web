import { useState } from 'react'
import { useTheme, useLocale, useT } from '../shared/hooks'

interface Props { activePanel: string; onPanelChange: (p: string) => void }

const AI_MODELS = [
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', icon: '⚡' },
  { id: 'gpt-4o', name: 'GPT-4o', icon: '🧠' },
  { id: 'claude-3-haiku', name: 'Claude 3', icon: '🎯' },
  { id: 'gemini-2.0-flash', name: 'Gemini Flash', icon: '💎' },
]

export default function Header({ activePanel, onPanelChange }: Props) {
  const [theme, toggleTheme] = useTheme()
  const [locale, setLocale] = useLocale()
  const tt = useT()
  const [search, setSearch] = useState('BTC-USD')
  const [showSettings, setShowSettings] = useState(false)
  const [showModelPicker, setShowModelPicker] = useState(false)
  const [selectedModel, setSelectedModel] = useState('gpt-4o-mini')

  const quickSymbols = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP']
  const currentModel = AI_MODELS.find(m => m.id === selectedModel) || AI_MODELS[0]

  const go = (sym: string) => { setSearch(sym + '-USD'); onPanelChange('chart:' + sym + '-USD') }

  return (
    <header className="app-header no-select">
      {/* Logo */}
      <div className="header-logo">
        <div className="header-logo-icon">T</div>
        <span className="header-logo-text">TradeX</span>
        <span className="header-logo-badge">PRO</span>
      </div>

      {/* Search */}
      <div className="header-search">
        <svg className="header-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
        </svg>
        <input value={search} onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && onPanelChange('chart:' + search)}
          placeholder={tt('common.search')} />
      </div>

      {/* Quick Symbols */}
      <div className="header-quick">
        {quickSymbols.map(s => (
          <button key={s} onClick={() => go(s)}>{s}</button>
        ))}
      </div>

      {/* Right Side */}
      <div className="header-right">
        {/* AI Model Selector */}
        <div className="header-model-selector">
          <button className="header-model-btn" onClick={() => setShowModelPicker(!showModelPicker)}>
            <span>{currentModel.icon}</span>
            <span>{currentModel.name}</span>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 9l6 6 6-6"/>
            </svg>
          </button>

          {showModelPicker && (
            <div className="header-model-dropdown animate-fade-in">
              {AI_MODELS.map(m => (
                <div
                  key={m.id}
                  className={`header-model-option ${m.id === selectedModel ? 'active' : ''}`}
                  onClick={() => { setSelectedModel(m.id); setShowModelPicker(false) }}
                >
                  <span style={{ fontSize: 16 }}>{m.icon}</span>
                  <div>
                    <div className="header-model-option-name">{m.name}</div>
                  </div>
                  {m.id === selectedModel && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" style={{ marginLeft: 'auto' }}>
                      <path d="M20 6L9 17l-5-5"/>
                    </svg>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Language */}
        <button className="header-lang-btn" onClick={() => setLocale(locale === 'en' ? 'ar' : 'en')}>
          {locale === 'en' ? 'عربي' : 'EN'}
        </button>

        {/* Theme */}
        <button className="header-btn" onClick={toggleTheme}>
          {theme === 'dark' ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          )}
        </button>

        {/* Settings */}
        <div style={{ position: 'relative' }}>
          <button className="header-btn" onClick={() => setShowSettings(!showSettings)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>
            </svg>
          </button>
          {showSettings && (
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
          )}
        </div>
      </div>
    </header>
  )
}
