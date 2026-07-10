/**
 * Formatting utilities — consistent number/price formatting across the app.
 */

/** Format a price with appropriate decimal precision based on magnitude. */
export function formatPrice(value: number | null | undefined): string {
  if (value == null || isNaN(value)) return '--'
  const abs = Math.abs(value)
  let decimals: number
  if (abs >= 1000) decimals = 2
  else if (abs >= 1) decimals = 2
  else if (abs >= 0.01) decimals = 4
  else if (abs >= 0.0001) decimals = 6
  else decimals = 8
  return value.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

/** Format a price with $ prefix. */
export function formatUSD(value: number | null | undefined): string {
  if (value == null || isNaN(value)) return '--'
  return '$' + formatPrice(value)
}

/** Format a percentage with sign. */
export function formatPct(value: number | null | undefined, decimals = 2): string {
  if (value == null || isNaN(value)) return '--'
  const sign = value >= 0 ? '+' : ''
  return sign + value.toFixed(decimals) + '%'
}

/** Format large USD volumes: 1.2B, 345M, 12.3K. */
export function formatVolume(value: number | null | undefined): string {
  if (value == null || isNaN(value)) return '--'
  const abs = Math.abs(value)
  if (abs >= 1e9) return '$' + (value / 1e9).toFixed(2) + 'B'
  if (abs >= 1e6) return '$' + (value / 1e6).toFixed(1) + 'M'
  if (abs >= 1e3) return '$' + (value / 1e3).toFixed(1) + 'K'
  return '$' + value.toFixed(2)
}

/** Format a compact number: 1.2M, 345K. */
export function formatCompact(value: number | null | undefined): string {
  if (value == null || isNaN(value)) return '--'
  const abs = Math.abs(value)
  if (abs >= 1e9) return (value / 1e9).toFixed(2) + 'B'
  if (abs >= 1e6) return (value / 1e6).toFixed(2) + 'M'
  if (abs >= 1e3) return (value / 1e3).toFixed(1) + 'K'
  return value.toFixed(0)
}

/** Format a timestamp to HH:MM in the user's locale. */
export function formatTime(ts: number, locale = 'en'): string {
  return new Date(ts).toLocaleTimeString(locale === 'ar' ? 'ar-EG' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Format a timestamp to a relative time (e.g. "2h ago"). */
export function formatRelative(ts: number): string {
  const diff = Date.now() - ts
  const sec = Math.floor(diff / 1000)
  if (sec < 60) return 'just now'
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  const day = Math.floor(hr / 24)
  return `${day}d ago`
}

/** Get the color for a signal string. */
export function signalColor(signal: string): string {
  if (signal.includes('STRONG BUY')) return 'var(--green)'
  if (signal.includes('BUY')) return 'var(--green)'
  if (signal.includes('STRONG SELL')) return 'var(--red)'
  if (signal.includes('SELL')) return 'var(--red)'
  return 'var(--text-2)'
}

/** Get the color for RSI value. */
export function rsiColor(rsi: number): string {
  if (rsi < 30) return 'var(--green)'
  if (rsi > 70) return 'var(--red)'
  return 'var(--text-1)'
}
