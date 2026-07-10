import { useEffect, useRef, useState, useCallback } from 'react'
import { createChart, ColorType, CrosshairMode, type IChartApi, type ISeriesApi } from 'lightweight-charts'
import { api, subscribeTicker } from '../core/api'
import { useT } from '../shared/hooks'
import type { Timeframe } from '../types'

interface ChartProps { symbol: string }

const TIMEFRAMES: Timeframe[] = ['1m', '5m', '15m', '30m', '1h', '4h', '1d']

export default function ChartPanel({ symbol }: ChartProps) {
  const tt = useT()
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
  const volumeRef = useRef<ISeriesApi<'Histogram'> | null>(null)
  const ema20Ref = useRef<ISeriesApi<'Line'> | null>(null)
  const ema50Ref = useRef<ISeriesApi<'Line'> | null>(null)
  const bbUpperRef = useRef<ISeriesApi<'Line'> | null>(null)
  const bbLowerRef = useRef<ISeriesApi<'Line'> | null>(null)

  const [timeframe, setTimeframe] = useState<Timeframe>('15m')
  const [loading, setLoading] = useState(true)
  const [ticker, setTicker] = useState<any>(null)
  const [showInd, setShowInd] = useState(false)
  const [inds, setInds] = useState({ ema20: false, ema50: false, bb: false })
  const [lastCandle, setLastCandle] = useState<any>(null)

  // Init chart
  useEffect(() => {
    if (!containerRef.current || chartRef.current) return
    const dark = document.documentElement.getAttribute('data-theme') === 'dark'
    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: dark ? '#0f1114' : '#ffffff' },
        textColor: dark ? '#94a3b8' : '#64748b',
        fontSize: 11,
      },
      grid: {
        vertLines: { color: dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.06)' },
        horzLines: { color: dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.06)' },
      },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: {
        borderColor: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)',
        scaleMargins: { top: 0.05, bottom: 0.2 },
      },
      timeScale: {
        borderColor: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)',
        timeVisible: true,
      },
      handleScroll: { vertTouchDrag: false },
    })
    chartRef.current = chart
    const ro = new ResizeObserver(() => {
      if (containerRef.current) chart.applyOptions({ width: containerRef.current.clientWidth, height: containerRef.current.clientHeight })
    })
    ro.observe(containerRef.current)
    return () => { ro.disconnect(); chart.remove(); chartRef.current = null }
  }, [])

  // Load candles
  const loadData = useCallback(async () => {
    if (!chartRef.current) return
    setLoading(true)
    try {
      const [candleData, tickerData] = await Promise.all([
        api.candles(symbol, timeframe, 200).catch(() => ({ candles: [] })),
        api.ticker(symbol).catch(() => null),
      ])
      setTicker(tickerData)
      const chart = chartRef.current
      const candles = candleData.candles || []
      if (candles.length === 0) { setLoading(false); return }

      // Remove old series
      ;[seriesRef, volumeRef, ema20Ref, ema50Ref, bbUpperRef, bbLowerRef].forEach(r => {
        if (r.current) { try { chart.removeSeries(r.current) } catch {} r.current = null }
      })

      // Candlestick
      const cs = chart.addCandlestickSeries({
        upColor: '#22c55e', downColor: '#ef4444',
        borderDownColor: '#ef4444', borderUpColor: '#22c55e',
        wickDownColor: '#ef4444', wickUpColor: '#22c55e',
      })
      cs.setData(candles.map(c => ({ ...c, time: c.time as any })))
      seriesRef.current = cs

      // Volume
      const vol = chart.addHistogramSeries({ priceFormat: { type: 'volume' }, priceScaleId: 'vol' })
      chart.priceScale('vol').applyOptions({ scaleMargins: { top: 0.85, bottom: 0 } })
      vol.setData(candles.map(c => ({
        time: c.time as any, value: c.volume,
        color: c.close >= c.open ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)',
      })))
      volumeRef.current = vol

      // EMA indicators
      if (inds.ema20) {
        const closes = candles.map(c => c.close)
        const ema = calcEMA(closes, 20)
        const s = chart.addLineSeries({ color: '#eab308', lineWidth: 1, priceLineVisible: false, lastValueVisible: false })
        s.setData(candles.map((c, i) => ({ time: c.time as any, value: ema[i] })))
        ema20Ref.current = s
      }
      if (inds.ema50) {
        const closes = candles.map(c => c.close)
        const ema = calcEMA(closes, 50)
        const s = chart.addLineSeries({ color: '#a855f7', lineWidth: 1, priceLineVisible: false, lastValueVisible: false })
        s.setData(candles.map((c, i) => ({ time: c.time as any, value: ema[i] })))
        ema50Ref.current = s
      }
      if (inds.bb) {
        const closes = candles.map(c => c.close)
        const bb = calcBollinger(closes, 20, 2)
        const upper = chart.addLineSeries({ color: 'rgba(59,130,246,0.5)', lineWidth: 1, priceLineVisible: false, lastValueVisible: false })
        const lower = chart.addLineSeries({ color: 'rgba(59,130,246,0.5)', lineWidth: 1, priceLineVisible: false, lastValueVisible: false })
        upper.setData(candles.map((c, i) => ({ time: c.time as any, value: bb.upper[i] })))
        lower.setData(candles.map((c, i) => ({ time: c.time as any, value: bb.lower[i] })))
        bbUpperRef.current = upper
        bbLowerRef.current = lower
      }

      chart.timeScale().fitContent()
      setLastCandle(candles[candles.length - 1])
    } catch (e) { console.error('Chart:', e) }
    finally { setLoading(false) }
  }, [symbol, timeframe, inds])

  useEffect(() => { loadData() }, [loadData])

  // Real-time updates via WebSocket
  useEffect(() => {
    const unsub = subscribeTicker(symbol, (data) => {
      setTicker((prev: any) => prev ? { ...prev, price: data.price, changePct: data.changePct } : prev)
      // Update last candle
      if (seriesRef.current && lastCandle) {
        const now = Math.floor(Date.now() / 1000)
        const tfSec: Record<string, number> = { '1m': 60, '5m': 300, '15m': 900, '30m': 1800, '1h': 3600, '4h': 14400, '1d': 86400, '1w': 604800, '1M': 2592000 }
        const candleTime = Math.floor(now / (tfSec[timeframe] || 900)) * (tfSec[timeframe] || 900)
        if (candleTime === lastCandle.time) {
          // Update current candle
          const updated = { ...lastCandle, close: data.price ?? lastCandle.close, high: Math.max(lastCandle.high, data.price ?? 0), low: Math.min(lastCandle.low, data.price ?? 0) }
          seriesRef.current.update(updated)
          setLastCandle(updated)
        } else if (candleTime > lastCandle.time) {
          // New candle
          const newCandle = { time: candleTime as any, open: lastCandle.close, high: data.price ?? 0, low: data.price ?? 0, close: data.price ?? 0, volume: 0 }
          seriesRef.current.update(newCandle)
          setLastCandle(newCandle)
        }
      }
    })
    return unsub
  }, [symbol, timeframe, lastCandle])

  const changePct = ticker?.changePct ?? 0
  const isUp = changePct >= 0

  return (
    <div className="chart-panel">
      <div className="chart-header">
        <div className="chart-header-left">
          <span className="chart-symbol">{symbol}</span>
          {ticker && (
            <>
              <span className="chart-price" style={{ color: isUp ? 'var(--green)' : 'var(--red)' }}>
                ${Number(ticker.price || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
              <span className={`chart-change ${isUp ? 'up' : 'down'}`}>
                {isUp ? '+' : ''}{changePct.toFixed(2)}%
              </span>
            </>
          )}
          {loading && <span className="chart-loading-dot" />}
          {!loading && (
            <span style={{ fontSize: 9, color: 'var(--green)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span className="chart-loading-dot" style={{ background: 'var(--green)' }} />
              LIVE
            </span>
          )}
        </div>
        <div className="chart-header-right">
          <div className="chart-tf-bar">
            {TIMEFRAMES.map(tf => (
              <button key={tf} className={`tf-btn ${timeframe === tf ? 'active' : ''}`}
                onClick={() => setTimeframe(tf)}>{tf}</button>
            ))}
          </div>
          <button className={`chart-ind-btn ${showInd ? 'active' : ''}`} onClick={() => setShowInd(!showInd)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
            </svg>
            Indicators
          </button>
        </div>
      </div>

      {showInd && (
        <div className="chart-ind-bar">
          {([
            { key: 'ema20', label: 'EMA 20', color: '#eab308' },
            { key: 'ema50', label: 'EMA 50', color: '#a855f7' },
            { key: 'bb', label: 'Bollinger', color: '#3b82f6' },
          ] as const).map(ind => (
            <button key={ind.key} className={`ind-chip ${inds[ind.key] ? 'on' : ''}`}
              onClick={() => setInds(p => ({ ...p, [ind.key]: !p[ind.key] }))}>
              <span style={{ color: ind.color, marginRight: 4 }}>●</span>
              {ind.label}
            </button>
          ))}
        </div>
      )}

      <div ref={containerRef} className="chart-canvas">
        {loading && (
          <div className="chart-overlay">
            <div className="animate-pulse">{tt('common.loading')}</div>
          </div>
        )}
      </div>

      {ticker && (
        <div className="chart-info-bar">
          <span>O <b style={{ color: 'var(--text-1)' }}>{ticker.openPrice ? Number(ticker.openPrice).toLocaleString() : '--'}</b></span>
          <span>H <b style={{ color: 'var(--green)' }}>{ticker.high24h ? Number(ticker.high24h).toLocaleString() : '--'}</b></span>
          <span>L <b style={{ color: 'var(--red)' }}>{ticker.low24h ? Number(ticker.low24h).toLocaleString() : '--'}</b></span>
          <span>C <b style={{ color: isUp ? 'var(--green)' : 'var(--red)' }}>{ticker.price ? Number(ticker.price).toLocaleString() : '--'}</b></span>
          <span>Vol <b style={{ color: 'var(--text-1)' }}>{ticker.volume24h ? '$' + (ticker.volume24h / 1e6).toFixed(1) + 'M' : '--'}</b></span>
        </div>
      )}
    </div>
  )
}

function calcEMA(data: number[], period: number): number[] {
  const k = 2 / (period + 1)
  const ema: number[] = [data[0]]
  for (let i = 1; i < data.length; i++) ema.push(data[i] * k + ema[i - 1] * (1 - k))
  return ema
}

function calcBollinger(data: number[], period: number, stdDev: number) {
  const sma: (number | null)[] = []
  const upper: (number | null)[] = []
  const lower: (number | null)[] = []

  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      sma.push(null)
      upper.push(null)
      lower.push(null)
      continue
    }
    const slice = data.slice(i - period + 1, i + 1)
    const mean = slice.reduce((a, b) => a + b, 0) / period
    const variance = slice.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / period
    const std = Math.sqrt(variance)
    sma.push(mean)
    upper.push(mean + stdDev * std)
    lower.push(mean - stdDev * std)
  }

  return { upper, middle: sma, lower }
}
