import { useT } from '../shared/hooks'

export default function Footer({ apiStatus }: { apiStatus: 'ok' | 'error' | 'loading' }) {
  const tt = useT()
  return (
    <footer className="app-footer no-select">
      <div className="footer-status">
        <span className={`footer-dot ${apiStatus === 'ok' ? 'ok' : apiStatus === 'error' ? 'err' : 'load'}`} />
        <span>{apiStatus === 'ok' ? 'Connected' : apiStatus === 'error' ? 'Disconnected' : 'Connecting...'}</span>
      </div>
      <div className="footer-info">
        <span>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
          </svg>
          {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </span>
        <span>TradeX Pro v3.0</span>
      </div>
    </footer>
  )
}
