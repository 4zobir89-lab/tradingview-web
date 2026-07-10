/**
 * Technical Indicators — pure functions, client-side.
 * Moved from server.js so no server roundtrip is needed for analysis.
 * All functions accept number[] and return number[] of the same length (with nulls padded where needed).
 */

export function calcSMA(data: number[], period: number): (number | null)[] {
  const out: (number | null)[] = []
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) { out.push(null); continue }
    let sum = 0
    for (let j = i - period + 1; j <= i; j++) sum += data[j]
    out.push(sum / period)
  }
  return out
}

export function calcEMA(data: number[], period: number): number[] {
  if (data.length === 0) return []
  const k = 2 / (period + 1)
  const out: number[] = [data[0]]
  for (let i = 1; i < data.length; i++) {
    out.push(data[i] * k + out[i - 1] * (1 - k))
  }
  return out
}

export function calcRSI(closes: number[], period = 14): number[] {
  if (closes.length < period + 1) return []
  const rsi: number[] = []
  let gains = 0, losses = 0
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1]
    if (diff > 0) gains += diff; else losses -= diff
  }
  let avgGain = gains / period
  let avgLoss = losses / period
  rsi.push(avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss))
  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1]
    avgGain = (avgGain * (period - 1) + (diff > 0 ? diff : 0)) / period
    avgLoss = (avgLoss * (period - 1) + (diff < 0 ? -diff : 0)) / period
    rsi.push(avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss))
  }
  return rsi
}

export interface MACDResult {
  macdLine: number[]
  signalLine: number[]
  histogram: number[]
}

export function calcMACD(closes: number[], fast = 12, slow = 26, signal = 9): MACDResult {
  const emaFast = calcEMA(closes, fast)
  const emaSlow = calcEMA(closes, slow)
  const macdLine = emaFast.map((v, i) => v - emaSlow[i])
  const signalLine = calcEMA(macdLine, signal)
  const histogram = macdLine.map((v, i) => v - signalLine[i])
  return { macdLine, signalLine, histogram }
}

export interface BollingerResult {
  upper: (number | null)[]
  middle: (number | null)[]
  lower: (number | null)[]
}

export function calcBollinger(closes: number[], period = 20, stdDev = 2): BollingerResult {
  const middle = calcSMA(closes, period)
  const upper: (number | null)[] = []
  const lower: (number | null)[] = []
  for (let i = 0; i < closes.length; i++) {
    if (middle[i] === null) { upper.push(null); lower.push(null); continue }
    const mean = middle[i] as number
    let variance = 0
    for (let j = i - period + 1; j <= i; j++) variance += (closes[j] - mean) ** 2
    variance /= period
    const std = Math.sqrt(variance)
    upper.push(mean + stdDev * std)
    lower.push(mean - stdDev * std)
  }
  return { upper, middle, lower }
}

export function calcATR(highs: number[], lows: number[], closes: number[], period = 14): number[] {
  if (highs.length === 0) return []
  const tr: number[] = [highs[0] - lows[0]]
  for (let i = 1; i < highs.length; i++) {
    tr.push(Math.max(
      highs[i] - lows[i],
      Math.abs(highs[i] - closes[i - 1]),
      Math.abs(lows[i] - closes[i - 1])
    ))
  }
  return calcEMA(tr, period)
}

export interface ADXResult {
  adx: number[]
  plusDI: number[]
  minusDI: number[]
}

export function calcADX(highs: number[], lows: number[], closes: number[], period = 14): ADXResult {
  const plusDM: number[] = [], minusDM: number[] = [], tr: number[] = []
  for (let i = 1; i < highs.length; i++) {
    const upMove = highs[i] - highs[i - 1]
    const downMove = lows[i - 1] - lows[i]
    plusDM.push(upMove > downMove && upMove > 0 ? upMove : 0)
    minusDM.push(downMove > upMove && downMove > 0 ? downMove : 0)
    tr.push(Math.max(
      highs[i] - lows[i],
      Math.abs(highs[i] - closes[i - 1]),
      Math.abs(lows[i] - closes[i - 1])
    ))
  }
  const atr = calcEMA(tr, period)
  const plusDI = calcEMA(plusDM, period).map((v, i) => atr[i] ? (v / atr[i]) * 100 : 0)
  const minusDI = calcEMA(minusDM, period).map((v, i) => atr[i] ? (v / atr[i]) * 100 : 0)
  const dx = plusDI.map((v, i) => {
    const sum = v + minusDI[i]
    return sum ? Math.abs(v - minusDI[i]) / sum * 100 : 0
  })
  return { adx: calcEMA(dx, period), plusDI, minusDI }
}

export interface StochasticResult {
  k: (number | null)[]
  d: (number | null)[]
}

export function calcStochastic(highs: number[], lows: number[], closes: number[], kPeriod = 14, dPeriod = 3): StochasticResult {
  const k: (number | null)[] = []
  for (let i = 0; i < closes.length; i++) {
    if (i < kPeriod - 1) { k.push(null); continue }
    let highest = -Infinity, lowest = Infinity
    for (let j = i - kPeriod + 1; j <= i; j++) {
      if (highs[j] > highest) highest = highs[j]
      if (lows[j] < lowest) lowest = lows[j]
    }
    k.push(highest === lowest ? 50 : ((closes[i] - lowest) / (highest - lowest)) * 100)
  }
  // D = SMA of K (only over valid K values)
  const d: (number | null)[] = new Array(closes.length).fill(null)
  const validStart = kPeriod - 1 + dPeriod - 1
  for (let i = validStart; i < closes.length; i++) {
    let sum = 0, count = 0
    for (let j = i - dPeriod + 1; j <= i; j++) {
      if (k[j] !== null) { sum += k[j] as number; count++ }
    }
    d[i] = count === dPeriod ? sum / dPeriod : null
  }
  return { k, d }
}

export function calcVWAP(highs: number[], lows: number[], closes: number[], volumes: number[]): number[] {
  const out: number[] = []
  let cumVol = 0, cumTP = 0
  for (let i = 0; i < closes.length; i++) {
    const tp = (highs[i] + lows[i] + closes[i]) / 3
    cumTP += tp * volumes[i]
    cumVol += volumes[i]
    out.push(cumVol ? cumTP / cumVol : tp)
  }
  return out
}

export function calcSuperTrend(highs: number[], lows: number[], closes: number[], period = 10, multiplier = 3): number[] {
  const atr = calcATR(highs, lows, closes, period)
  const out: number[] = []
  let trend = 1
  let upperBand = 0, lowerBand = 0
  for (let i = 0; i < closes.length; i++) {
    const mid = (highs[i] + lows[i]) / 2
    const up = mid + multiplier * (atr[i] || 0)
    const down = mid - multiplier * (atr[i] || 0)
    if (i === 0) {
      upperBand = up; lowerBand = down; out.push(down); continue
    }
    if (closes[i] > upperBand) trend = 1
    if (closes[i] < lowerBand) trend = -1
    if (trend === 1) { lowerBand = Math.max(down, lowerBand); upperBand = up }
    else { upperBand = Math.min(up, upperBand); lowerBand = down }
    out.push(trend === 1 ? lowerBand : upperBand)
  }
  return out
}
