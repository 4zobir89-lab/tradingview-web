import { useEffect, useRef, useState, useCallback } from 'react'
import { createChart, ColorType, CrosshairMode, type IChartApi, type ISeriesApi } from 'lightweight-charts'
import { api, subscribeKline, subscribeTicker } from '../core/api'
import { useT } from '../shared/hooks'
import type { Timeframe } from '../types'
import { formatPrice, formatPct } from '../core/format'

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
  // Refs to avoid re-subscribing WebSocket on every render
  const lastCandleRef = useRef<any>(null)
  const timeframeRef = useRef<Timeframe>('15m')
  const indsRef = useRef({ ema20: false, ema50: false, bb: false })

  const [timeframe, setTimeframe] = useState<Timeframe>('15m')
  const [loading, setLoading] = useState(true)
  const [ticker, setTicker] = useState<any>(null)
  const [showInd, setShowInd] = useState(false)
  const [inds, setInds] = useState({ ema20: false, ema50: false, bb: false })
  const [flash, setFlash] = useState<'up' | 'down' | null>(null)

  // Sync refs
  useEffect(() => { timeframeRef.current = timeframe }, [timeframe])
  useEffect(() => { indsRef.current = inds }, [inds])

  // ── Init chart (once) ──────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || chartRef.current) return

    const dark = document.documentElement.getAttribute('data-theme') === 'dark'
    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: dark ? '#0f1114' : '#ffffff' },
        textColor: dark ? '#94a3b8' : '#64748b',
        fontSize: 11,
        fontFamily: "'JetBrains Mono', monospace",
      },
      grid: {
        vertLines: { color: dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.06)' },
        horzLines: { color: dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.06)' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: dark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)', width: 1, style: 3 },
        horzLine: { color: dark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)', width: 1, style: 3 },
      },
      rightPriceScale: {
        borderColor: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)',
        scaleMargins: { top: 0.08, bottom: 0.22 },
      },
      timeScale: {
        borderColor: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)',
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 4,
        barSpacing: 8,
      },
      handleScroll: { vertTouchDrag: false },
      handleScale: { axisPressedMouseMove: true, mouseWheel: true, pinch: true },
    })
    chartRef.current = chart

    const ro = new ResizeObserver(() => {
      if (containerRef.current) {
        chart.applyOptions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        })
      }
    })
    ro.observe(containerRef.current)

    return () => {
      ro.disconnect()
      chart.remove()
      chartRef.current = null
    }
  }, [])

  // ── Theme change: update chart colors ──────────────────────────
  useEffect(() => {
    const observer = new MutationObserver(() => {
      if (!chartRef.current) return
      const dark = document.documentElement.getAttribute('data-theme') === 'dark'
      chartRef.current.applyOptions({
        layout: {
          background: { type: ColorType.Solid, color: dark ? '#0f1114' : '#ffffff' },
          textColor: dark ? '#94a3b8' : '#64748b',
        },
        grid: {
          vertLines: { color: dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.06)' },
          horzLines: { color: dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.06)' },
        },
        rightPriceScale: {
          borderColor: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)',
        },
        timeScale: {
          borderColor: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)',
        },
      })
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => observer.disconnect()
  }, [])

  // ── Load candles on symbol/timeframe change ────────────────────
  const loadData = useCallback(async () => {
    if (!chartRef.current) return
    setLoading(true)
    try {
      const [candleData, tickerData] = await Promise.all([
        api.candles(symbol, timeframe, 300).catch(() => ({ candles: [] })),
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
        upColor: '#22c55e',
        downColor: '#ef4444',
        borderDownColor: '#ef4444',
        borderUpColor: '#22c55e',
        wickDownColor: '#ef4444',
        wickUpColor: '#22c55e',
        priceLineVisible: true,
        priceLineStyle: 2,
        priceLineColor: 'rgba(59,130,246,0.4)',
      })
      cs.setData(candles.map(c => ({ ...c, time: c.time as any })))
      seriesRef.current = cs

      // Volume
      const vol = chart.addHistogramSeries({
        priceFormat: { type: 'volume' },
        priceScaleId: 'vol',
        priceLineVisible: false,
        lastValueVisible: false,
      })
      chart.priceScale('vol').applyOptions({ scaleMargins: { top: 0.85, bottom: 0 } })
      vol.setData(candles.map(c => ({
        time: c.time as any,
        value: c.volume,
        color: c.close >= c.open ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)',
      })))
      volumeRef.current = vol

      // EMA indicators (only if enabled)
      const closes = candles.map(c => c.close)
      if (inds.ema20) {
        const ema = calcEMA(closes, 20)
        const s = chart.addLineSeries({
          color: '#eab308', lineWidth: 1,
          priceLineVisible: false, lastValueVisible: false,
          crosshairMarkerVisible: false,
        })
        s.setData(candles.map((c, i) => ({ time: c.time as any, value: ema[i] })))
        ema20Ref.current = s
      }
      if (inds.ema50) {
        const ema = calcEMA(closes, 50)
        const s = chart.addLineSeries({
          color: '#a855f7', lineWidth: 1,
          priceLineVisible: false, lastValueVisible: false,
          crosshairMarkerVisible: false,
        })
        s.setData(candles.map((c, i) => ({ time: c.time as any, value: ema[i] })))
        ema50Ref.current = s
      }
      if (inds.bb) {
        const bb = calcBollinger(closes, 20, 2)
        const upper = chart.addLineSeries({
          color: 'rgba(59,130,246,0.6)', lineWidth: 1,
          priceLineVisible: false, lastValueVisible: false,
          crosshairMarkerVisible: false,
        })
        const lower = chart.addLineSeries({
          color: 'rgba(59,130,246,0.6)', lineWidth: 1,
          priceLineVisible: false, lastValueVisible: false,
          crosshairMarkerVisible: false,
        })
        upper.setData(candles.map((c, i) => ({ time: c.time as any, value: bb.upper[i] as number })))
        lower.setData(candles.map((c, i) => ({ time: c.time as any, value: bb.lower[i] as number })))
        bbUpperRef.current = upper
        bbLowerRef.current = lower
      }

      chart.timeScale().fitContent()
      lastCandleRef.current = candles[candles.length - 1]
    } catch (e) {
      console.error('Chart load error:', e)
    } finally {
      setLoading(false)
    }
  }, [symbol, timeframe, inds])

  useEffect(() => { loadData() }, [loadData])

  // ── Real-time kline updates (LIVE chart) ───────────────────────
  // Uses refs so the WebSocket subscription doesn't re-run on every tick
  useEffect(() => {
    const unsub = subscribeKline(symbol, timeframe, (k) => {
      const series = seriesRef.current
      const vol = volumeRef.current
      if (!series) return

      // Update candlestick
      const candle = {
        time: k.time as any,
        open: k.open,
        high: k.high,
        low: k.low,
        close: k.close,
      }
      series.update(candle)

      // Update volume
      if (vol) {
        vol.update({
          time: k.time as any,
          value: k.volume,
          color: k.close >= k.open ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)',
        })
      }

      // Track last candle
      lastCandleRef.current = { ...candle, volume: k.volume }

      // Flash effect on price change
      const prev = lastCandleRef.current?.close
      if (prev !== undefined && k.close !== prev) {
        setFlash(k.close > prev ? 'up' : 'down')
        setTimeout(() => setFlash(null), 200)
      }
    })
    return unsub
  }, [symbol, timeframe])

  // ── Real-time ticker updates (price header + info bar) ─────────
  useEffect(() => {
    const unsub = subscribeTicker(symbol, (data) => {
      setTicker((prev: any) => prev ? {
        ...prev,
        price: data.price ?? prev.price,
        changePct: data.changePct ?? prev.changePct,
        high24h: data.high24h ?? prev.high24h,
        low24h: data.low24h ?? prev.low24h,
        volume24h: data.volume24h ?? prev.volume24h,
      } : prev)
    })
    return unsub
  }, [symbol])

  const changePct = ticker?.changePct ?? 0
  const isUp = changePct >= 0
  const currentPrice = ticker?.price ?? 0

  return (
    <div className="chart-panel">
      <div className="chart-header">
        <div className="chart-header-left">
          <span className="chart-symbol">{symbol}</span>
          {ticker && (
            <>
              <span
                className={`chart-price ${flash ? `flash-${flash}` : ''}`}
                style={{ color: isUp ? 'var(--green)' : 'var(--red)' }}
              >
                ${formatPrice(currentPrice)}
              </span>
              <span className={`chart-change ${isUp ? 'up' : 'down'}`}>
                {isUp ? '▲' : '▼'} {formatPct(changePct)}
              </span>
            </>
          )}
          {loading && <span className="chart-loading-dot" />}
          {!loading && (
            <span className="live-badge">
              <span className="live-dot" />
              LIVE
            </span>
          )}
        </div>
        <div className="chart-header-right">
          <div className="chart-tf-bar">
            {TIMEFRAMES.map(tf => (
              <button
                key={tf}
                className={`tf-btn ${timeframe === tf ? 'active' : ''}`}
                onClick={() => setTimeframe(tf)}
              >
                {tf}
              </button>
            ))}
          </div>
          <button
            className={`chart-ind-btn ${showInd ? 'active' : ''}`}
            onClick={() => setShowInd(!showInd)}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
            </svg>
            <span className="ind-btn-label">{tt('chart.indicators')}</span>
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
            <button
              key={ind.key}
              className={`ind-chip ${inds[ind.key] ? 'on' : ''}`}
              onClick={() => setInds(p => ({ ...p, [ind.key]: !p[ind.key] }))}
            >
              <span style={{ color: ind.color }}>●</span>
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
          <span className="info-item">O <b>{ticker.openPrice ? formatPrice(Number(ticker.openPrice)) : '--'}</b></span>
          <span className="info-item">H <b className="text-green">{ticker.high24h ? formatPrice(Number(ticker.high24h)) : '--'}</b></span>
          <span className="info-item">L <b className="text-red">{ticker.low24h ? formatPrice(Number(ticker.low24h)) : '--'}</b></span>
          <span className="info-item">C <b style={{ color: isUp ? 'var(--green)' : 'var(--red)' }}>{currentPrice ? formatPrice(currentPrice) : '--'}</b></span>
          <span className="info-item">Vol <b>{ticker.volume24h ? '$' + (ticker.volume24h / 1e6).toFixed(1) + 'M' : '--'}</b></span>
        </div>
      )}
    </div>
  )
}

// ── Indicators (client-side) ─────────────────────────────────────
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
      sma.push(null); upper.push(null); lower.push(null)
      continue
    }
    let sum = 0
    for (let j = i - period + 1; j <= i; j++) sum += data[j]
    const mean = sum / period
    let variance = 0
    for (let j = i - period + 1; j <= i; j++) variance += (data[j] - mean) ** 2
    variance /= period
    const std = Math.sqrt(variance)
    sma.push(mean)
    upper.push(mean + stdDev * std)
    lower.push(mean - stdDev * std)
  }

  return { upper, middle: sma, lower }
}
