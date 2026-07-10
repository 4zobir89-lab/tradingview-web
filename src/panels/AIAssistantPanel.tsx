import { useState, useRef, useEffect, useCallback } from 'react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  model?: string
  timestamp: number
}

interface Conversation {
  id: string
  title: string
  messages: Message[]
  createdAt: number
}

const MODELS = [
  { id: 'deepseek-v4-flash-free', name: 'DeepSeek', icon: '⚡' },
  { id: 'mimo-v2.5-free', name: 'MiMo', icon: '🤖' },
  { id: 'big-pickle', name: 'Big Pickle', icon: '🥒' },
  { id: 'nemotron-3-ultra-free', name: 'Nemotron', icon: '🧠' },
]

function uid() { return Math.random().toString(36).slice(2, 10) }

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

export default function AIAssistantPanel({ symbol }: { symbol: string }) {
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    const saved = localStorage.getItem('trandex-ai-conversations')
    if (saved) return JSON.parse(saved)
    return [{ id: uid(), title: 'محادثة جديدة', messages: [], createdAt: Date.now() }]
  })
  const [activeId, setActiveId] = useState(() => conversations[0]?.id || '')
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedModel, setSelectedModel] = useState('deepseek-v4-flash-free')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const messagesEnd = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const active = conversations.find(c => c.id === activeId)
  const messages = active?.messages || []

  useEffect(() => {
    localStorage.setItem('trandex-ai-conversations', JSON.stringify(conversations))
  }, [conversations])

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  const updateConversation = useCallback((id: string, fn: (c: Conversation) => Conversation) => {
    setConversations(prev => prev.map(c => c.id === id ? fn(c) : c))
  }, [])

  const newConversation = () => {
    const c: Conversation = { id: uid(), title: 'محادثة جديدة', messages: [], createdAt: Date.now() }
    setConversations(prev => [c, ...prev])
    setActiveId(c.id)
    setSidebarOpen(false)
  }

  const deleteConversation = (id: string) => {
    setConversations(prev => {
      const next = prev.filter(c => c.id !== id)
      if (next.length === 0) {
        const c: Conversation = { id: uid(), title: 'محادثة جديدة', messages: [], createdAt: Date.now() }
        setActiveId(c.id)
        return [c]
      }
      if (id === activeId) setActiveId(next[0].id)
      return next
    })
  }

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || loading) return

    const userMsg: Message = { id: uid(), role: 'user', content: text, timestamp: Date.now() }
    updateConversation(activeId, c => ({
      ...c,
      messages: [...c.messages, userMsg],
      title: c.messages.length === 0 ? text.slice(0, 40) : c.title,
    }))
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, symbol, model: selectedModel }),
      })
      const data = await res.json()
      const botMsg: Message = {
        id: uid(), role: 'assistant',
        content: data.response || 'لم أتمكن من الرد',
        model: data.model,
        timestamp: Date.now(),
      }
      updateConversation(activeId, c => ({ ...c, messages: [...c.messages, botMsg] }))
    } catch (e: any) {
      updateConversation(activeId, c => ({
        ...c, messages: [...c.messages, {
          id: uid(), role: 'assistant',
          content: `⚠️ خطأ: ${e.message}`,
          timestamp: Date.now(),
        }],
      }))
    } finally { setLoading(false) }
  }

  const copyMessage = (id: string, content: string) => {
    navigator.clipboard.writeText(content)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const quickActions = [
    { label: '📊 تحليل', prompt: `حلل ${symbol} تحليل فني شامل` },
    { label: '🎯 استراتيجية', prompt: `أنشئ استراتيجية لـ ${symbol}` },
    { label: '⚠️ مخاطر', prompt: `خطة إدارة مخاطر لـ ${symbol}` },
    { label: '🔮 توقعات', prompt: `توقعات ${symbol} للأسبوع القادم` },
  ]

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Sidebar - Conversations */}
      <div style={{
        width: sidebarOpen ? 260 : 0,
        minWidth: sidebarOpen ? 260 : 0,
        background: 'var(--bg-1)',
        borderRight: '1px solid var(--border-1)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.2s var(--ease)',
        overflow: 'hidden',
      }}>
        <div style={{ padding: 12, borderBottom: '1px solid var(--border-1)' }}>
          <button onClick={newConversation} style={{
            width: '100%', padding: '10px 14px',
            background: 'var(--accent)', color: '#fff',
            border: 'none', borderRadius: 'var(--radius-md)',
            cursor: 'pointer', fontWeight: 600, fontSize: 13,
            display: 'flex', alignItems: 'center', gap: 8,
            justifyContent: 'center',
          }}>
            <span style={{ fontSize: 18 }}>+</span> محادثة جديدة
          </button>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: 8 }}>
          {conversations.map(c => (
            <div
              key={c.id}
              onClick={() => { setActiveId(c.id); setSidebarOpen(false) }}
              style={{
                padding: '10px 12px', borderRadius: 'var(--radius-md)',
                cursor: 'pointer', marginBottom: 4,
                background: c.id === activeId ? 'var(--accent-subtle)' : 'transparent',
                border: c.id === activeId ? '1px solid var(--accent-muted)' : '1px solid transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                transition: 'all 0.15s',
              }}
            >
              <span style={{
                fontSize: 13, color: c.id === activeId ? 'var(--accent)' : 'var(--text-2)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
              }}>
                {c.title}
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); deleteConversation(c.id) }}
                style={{
                  background: 'none', border: 'none', color: 'var(--text-4)',
                  cursor: 'pointer', padding: 4, borderRadius: 4,
                  opacity: 0.5, fontSize: 14,
                }}
                onMouseEnter={e => (e.target as HTMLElement).style.opacity = '1'}
                onMouseLeave={e => (e.target as HTMLElement).style.opacity = '0.5'}
              >×</button>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 16px',
          borderBottom: '1px solid var(--border-1)',
          background: 'var(--bg-1)',
        }}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{
            background: 'none', border: 'none', color: 'var(--text-2)',
            cursor: 'pointer', padding: 6, borderRadius: 6,
            display: 'flex', alignItems: 'center',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12h18M3 6h18M3 18h18" />
            </svg>
          </button>
          <div style={{ flex: 1, fontSize: 14, fontWeight: 600, color: 'var(--text-1)' }}>
            TradeX AI
          </div>
          {/* Model selector - compact */}
          <select
            value={selectedModel}
            onChange={e => setSelectedModel(e.target.value)}
            style={{
              background: 'var(--bg-3)', color: 'var(--text-2)',
              border: '1px solid var(--border-2)', borderRadius: 'var(--radius-md)',
              padding: '6px 10px', fontSize: 12, cursor: 'pointer',
              outline: 'none',
            }}
          >
            {MODELS.map(m => (
              <option key={m.id} value={m.id}>{m.icon} {m.name}</option>
            ))}
          </select>
        </div>

        {/* Messages */}
        <div style={{
          flex: 1, overflow: 'auto', padding: 16,
          display: 'flex', flexDirection: 'column', gap: 16,
        }}>
          {messages.length === 0 && (
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-4)', textAlign: 'center',
            }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>💬</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-2)', marginBottom: 8 }}>
                اسأل عن {symbol}
              </div>
              <div style={{ fontSize: 13, maxWidth: 300, lineHeight: 1.6 }}>
                بيانات لحظية من Binance • تحليل فني • استراتيجيات
              </div>
            </div>
          )}

          {messages.map(msg => (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              }}
            >
              <div style={{
                maxWidth: '80%',
                padding: '12px 16px',
                borderRadius: msg.role === 'user'
                  ? 'var(--radius-lg) var(--radius-lg) 4px var(--radius-lg)'
                  : 'var(--radius-lg) var(--radius-lg) var(--radius-lg) 4px',
                background: msg.role === 'user' ? 'var(--accent)' : 'var(--bg-3)',
                color: msg.role === 'user' ? '#fff' : 'var(--text-1)',
                fontSize: 14, lineHeight: 1.7,
                position: 'relative',
              }}>
                {/* Model tag */}
                {msg.role === 'assistant' && msg.model && (
                  <div style={{
                    fontSize: 10, color: 'var(--text-4)',
                    marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4,
                  }}>
                    {MODELS.find(m => m.id === msg.model)?.icon}{' '}
                    {MODELS.find(m => m.id === msg.model)?.name || msg.model}
                  </div>
                )}

                {/* Content */}
                <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {msg.content}
                </div>

                {/* Footer: time + actions */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  marginTop: 8, fontSize: 11,
                  color: msg.role === 'user' ? 'rgba(255,255,255,0.6)' : 'var(--text-5)',
                }}>
                  <span>{formatTime(msg.timestamp)}</span>
                  {msg.role === 'assistant' && (
                    <button
                      onClick={() => copyMessage(msg.id, msg.content)}
                      style={{
                        background: 'none', border: 'none',
                        color: 'inherit', cursor: 'pointer',
                        padding: 2, borderRadius: 4,
                        display: 'flex', alignItems: 'center',
                      }}
                      title="نسخ"
                    >
                      {copiedId === msg.id ? (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      ) : (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="9" y="9" width="13" height="13" rx="2" />
                          <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                        </svg>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div style={{
                padding: '12px 16px', borderRadius: 'var(--radius-lg)',
                background: 'var(--bg-3)', display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <div style={{ display: 'flex', gap: 4 }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{
                      width: 6, height: 6, borderRadius: '50%',
                      background: 'var(--text-4)',
                      animation: `pulse 1.2s ${i * 0.2}s infinite`,
                    }} />
                  ))}
                </div>
                <span style={{ fontSize: 13, color: 'var(--text-4)' }}>يكتب...</span>
              </div>
            </div>
          )}
          <div ref={messagesEnd} />
        </div>

        {/* Quick Actions */}
        {messages.length === 0 && (
          <div style={{
            display: 'flex', gap: 8, padding: '0 16px 12px',
            flexWrap: 'wrap',
          }}>
            {quickActions.map(a => (
              <button
                key={a.label}
                onClick={() => { setInput(a.prompt); inputRef.current?.focus() }}
                style={{
                  padding: '8px 14px', background: 'var(--bg-3)',
                  border: '1px solid var(--border-2)', borderRadius: 'var(--radius-full)',
                  color: 'var(--text-2)', fontSize: 12, cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => {
                  (e.target as HTMLElement).style.borderColor = 'var(--accent)'
                  ;(e.target as HTMLElement).style.color = 'var(--accent)'
                }}
                onMouseLeave={e => {
                  (e.target as HTMLElement).style.borderColor = 'var(--border-2)'
                  ;(e.target as HTMLElement).style.color = 'var(--text-2)'
                }}
              >
                {a.label}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div style={{
          padding: '12px 16px',
          borderTop: '1px solid var(--border-1)',
          background: 'var(--bg-1)',
        }}>
          <div style={{
            display: 'flex', gap: 8,
            background: 'var(--bg-2)',
            border: '1px solid var(--border-2)',
            borderRadius: 'var(--radius-lg)',
            padding: '8px 12px',
            alignItems: 'flex-end',
          }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  sendMessage()
                }
              }}
              placeholder={`اسأل عن ${symbol}...`}
              disabled={loading}
              rows={1}
              style={{
                flex: 1, background: 'none', border: 'none',
                color: 'var(--text-1)', fontSize: 14,
                resize: 'none', outline: 'none',
                fontFamily: 'inherit', lineHeight: 1.5,
                minHeight: 24, maxHeight: 120,
              }}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              style={{
                width: 36, height: 36,
                background: input.trim() ? 'var(--accent)' : 'var(--bg-4)',
                border: 'none', borderRadius: 'var(--radius-md)',
                color: input.trim() ? '#fff' : 'var(--text-4)',
                cursor: input.trim() ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s',
                flexShrink: 0,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.4; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  )
}
