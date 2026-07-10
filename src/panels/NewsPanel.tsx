import { useState, useEffect } from 'react'
import { api } from '../core/api'
import { useT } from '../shared/hooks'

export default function NewsPanel() {
  const tt = useT()
  const [news, setNews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.news().then(d => {
      const items = Array.isArray(d) ? d : Array.isArray(d?.news) ? d.news : Array.isArray(d?.items) ? d.items : []
      setNews(items)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const sourceColors: Record<string, string> = {
    'CryptoNews': 'var(--accent)',
    'CoinDesk': 'var(--green)',
    'Bloomberg': 'var(--purple)',
    'Reuters': 'var(--orange)',
    'DefiLlama': 'var(--cyan)',
    'The Block': 'var(--yellow)',
  }

  return (
    <div className="panel">
      <div className="panel-head">
        <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
            <path d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2"/>
          </svg>
          {tt('news.title')}
        </h3>
      </div>
      <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {loading ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-3)' }}>
            <div className="animate-pulse">{tt('common.loading')}</div>
          </div>
        ) : news.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-3)' }}>{tt('news.noNews')}</div>
        ) : (
          news.slice(0, 20).map((item, i) => (
            <div key={i} className="news-card">
              <div className="news-title">{item.title || item.headline || 'Untitled'}</div>
              <div className="news-meta">
                <span style={{ color: sourceColors[item.source] || 'var(--accent)' }}>
                  {item.source || item.publisher || ''}
                </span>
                <span>·</span>
                <span>{item.published || item.date || ''}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
