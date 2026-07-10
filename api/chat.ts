/**
 * Vercel Serverless Function: AI Chat
 * Protects the AI API key by keeping it server-side.
 * Set these env vars in Vercel project settings:
 *   - AI_API_KEY
 *   - AI_API_URL (optional, defaults to OpenCode)
 */

const AI_API_KEY = process.env.AI_API_KEY || ''
const AI_API_URL = process.env.AI_API_URL || 'https://opencode.ai/zen/v1/chat/completions'

const AI_MODELS: Record<string, string> = {
  'deepseek-v4-flash-free': 'DeepSeek V4 Flash Free',
  'mimo-v2.5-free': 'MiMo V2.5 Free',
  'big-pickle': 'Big Pickle',
  'north-mini-code-free': 'North Mini Code Free',
  'nemotron-3-ultra-free': 'Nemotron 3 Ultra Free',
}

const TRADING_SYSTEM_PROMPT = `أنت TradeX AI، خبير التداول والأسواق المالية.

مهمتك: قدم تحاليل فنية دقيقة بناءً على بيانات السوق الحقيقية المرفقة أدناه.

البيانات المُرفقة هي بيانات لحظية من Binance — استخدمها دائماً في تحليلك.
لا تقل أبداً أنك لا تملك بيانات. البيانات موجودة في كل رسالة.

قواعد إجبارية:
1. استخدم الأسعار والمؤشرات الفنية المُرفقة في كل رد
2. أعطِ توصيات واضحة (شراء/بيع/انتظار) مع نقاط الدخول والخروج
3. أحذر من المخاطر دائماً
4. إذا سأل المستخدم عن بيانات: أخبره أن البيانات لحظية من Binance
5. الرد بالعربية إذا كان السؤال بالعربية، وبالإنجليزية إذا كان بالإنجليزية

تنسيق الردود:
- السعر الحالي والمؤشرات الرئيسية أولاً
- التوصية بوضوح
- نقاط الدخول والخروج
- وقف الخسارة وجني الأرباح
- تنبيه المخاطر`

interface ChatBody {
  message: string
  symbol?: string
  model?: string
}

export const config = {
  maxDuration: 45,
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const { message, symbol = 'BTC-USD', model = 'deepseek-v4-flash-free' } = (await req.json()) as ChatBody

  if (!message) {
    return new Response(JSON.stringify({ error: 'Message required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Try to fetch real market context from Binance (server-side, no CORS issue)
  let marketContext = ''
  try {
    const binanceSym = symbol.toUpperCase().replace(/-USD$/, '').replace(/USDT$/, '') + 'USDT'
    const [tickerRes, klinesRes] = await Promise.all([
      fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${binanceSym}`).then(r => r.json()),
      fetch(`https://api.binance.com/api/v3/klines?symbol=${binanceSym}&interval=15m&limit=200`).then(r => r.json()),
    ])

    if (tickerRes.lastPrice) {
      const price = parseFloat(tickerRes.lastPrice)
      const change = parseFloat(tickerRes.priceChangePercent)
      const high = parseFloat(tickerRes.highPrice)
      const low = parseFloat(tickerRes.lowPrice)
      const volume = parseFloat(tickerRes.quoteVolume)

      // Quick RSI
      const closes = klinesRes.map((c: any[]) => parseFloat(c[4]))
      const rsi = calcRSI(closes)
      const lastRSI = rsi[rsi.length - 1] || 50

      // Quick EMA
      const ema20 = calcEMA(closes, 20)
      const ema50 = calcEMA(closes, 50)

      marketContext = `

=== بيانات السوق اللحظية من Binance ===
العملة: ${symbol}
السعر الحالي: $${price.toLocaleString()}
التغيير 24 ساعة: ${change.toFixed(2)}%
أعلى 24 ساعة: $${high.toLocaleString()}
أدنى 24 ساعة: $${low.toLocaleString()}
الحجم: $${(volume / 1e6).toFixed(1)}M

المؤشرات الفنية:
- RSI(14): ${lastRSI.toFixed(1)}
- EMA20: $${ema20[ema20.length - 1].toLocaleString()}
- EMA50: $${ema50[ema50.length - 1].toLocaleString()}

ملاحظة: هذه بيانات لحظية حقيقية. استخدمها في تحليلك.`
    }
  } catch {
    marketContext = '\n\n(لا تتوفر بيانات السوق حالياً)'
  }

  const messages = [
    { role: 'system', content: TRADING_SYSTEM_PROMPT },
    { role: 'user', content: message + (marketContext ? '\n\n' + marketContext : '') },
  ]

  try {
    const modelId = AI_MODELS[model] ? model : 'deepseek-v4-flash-free'
    const ctrl = new AbortController()
    const timeout = setTimeout(() => ctrl.abort(), 40000)

    const res = await fetch(AI_API_URL, {
      method: 'POST',
      signal: ctrl.signal,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AI_API_KEY}`,
      },
      body: JSON.stringify({
        model: modelId,
        messages,
        temperature: 0.7,
        max_tokens: 4000,
      }),
    })

    clearTimeout(timeout)

    if (!res.ok) {
      const errBody = await res.text()
      throw new Error(`AI API ${res.status}: ${errBody.slice(0, 200)}`)
    }

    const data = await res.json()
    const msg = data.choices?.[0]?.message
    const text = msg?.content?.trim() || msg?.reasoning_content?.trim()

    return new Response(JSON.stringify({
      response: text || 'No response from AI',
      model,
      timestamp: new Date().toISOString(),
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (e: any) {
    return new Response(JSON.stringify({
      response: `⚠️ عذراً، لا أستطيع الاتصال بخدمة الذكاء الاصطناعي حالياً.\n\nلكن يمكنني مساعدتك:\n\n• اكتب "تحليل BTC" لتحليل عملة بتكوين\n• اكتب "مؤشرات" لرؤية المؤشرات الفنية\n• اكتب "استراتيجية" لاقتراح استراتيجية\n• اكتب "مساعدة" لرؤية جميع الأوامر`,
      model: 'fallback',
      error: e.message,
      timestamp: new Date().toISOString(),
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

// ── Helper: RSI (server-side) ──────────────────────────────────
function calcRSI(closes: number[], period = 14): number[] {
  if (closes.length < period + 1) return [50]
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

function calcEMA(data: number[], period: number): number[] {
  if (data.length === 0) return [0]
  const k = 2 / (period + 1)
  const out: number[] = [data[0]]
  for (let i = 1; i < data.length; i++) out.push(data[i] * k + out[i - 1] * (1 - k))
  return out
}
