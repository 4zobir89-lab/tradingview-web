import { useState, useEffect } from 'react'
import { api } from '../core/api'
import { useT } from '../shared/hooks'
import { formatRelative } from '../core/format'

export default function NewsPanel() {
  const tt = useT()
  const [news, setNews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    setLoading(true)
    setError(null)
    api.news().then(items => {
      setNews(Array.isArray(items) ? items : [])
      setLoading(false)
    }).catch(e => {
      setError(e.message)
      setLoading(false)
    })
  }, [])

  const categories = ['all', ...new Set(news.flatMap(n => n.categories || []).slice(0, 8))]
  const filtered = filter === 'all' ? news : news.filter(n => n.categories?.includes(filter))

  const sourceColors: Record<string, string> = {
    'CoinDesk': 'var(--green)',
    'CoinTelegraph': 'var(--accent)',
    'Bloomberg': 'var(--purple)',
    'Reuters': 'var(--orange)',
    'CryptoCompare': 'var(--cyan)',
    'Decrypt': 'var(--yellow)',
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
        <span style={{ fontSize: 10, color: 'var(--text-4)' }}>{filtered.length} articles</span>
      </div>
      {categories.length > 1 && (
        <div className="news-filters">
          {categories.slice(0, 6).map(cat => (
            <button
              key={cat}
              className={`news-filter-chip ${filter === cat ? 'active' : ''}`}
              onClick={() => setFilter(cat)}
            >
              {cat === 'all' ? 'All' : cat}
            </button>
          ))}
        </div>
      )}
      <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 8, overflow: 'auto' }}>
        {loading ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-3)' }}>
            <div className="animate-pulse">{tt('common.loading')}</div>
          </div>
        ) : error ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--red)' }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>⚠️</div>
            {error}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-3)' }}>{tt('news.noNews')}</div>
        ) : (
          filtered.slice(0, 25).map((item, i) => (
            <a
              key={i}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="news-card"
            >
              {item.imageUrl && (
                <div className="news-thumb" style={{ backgroundImage: `url(${item.imageUrl})` }} />
              )}
              <div className="news-content">
                <div className="news-title">{item.title}</div>
                <div className="news-body">{item.body?.slice(0, 120)}...</div>
                <div className="news-meta">
                  <span style={{ color: sourceColors[item.source] || 'var(--accent)' }}>
                    {item.source}
                  </span>
                  <span>·</span>
                  <span>{formatRelative(item.publishedAt)}</span>
                </div>
              </div>
            </a>
          ))
        )}
      </div>
    </div>
  )
}
