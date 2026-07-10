/**
 * Vercel Serverless Function: AI Chat
 * Uses Node.js style (req, res) for maximum Vercel compatibility.
 * Set env vars in Vercel: AI_API_KEY, AI_API_URL
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { message, symbol = 'BTC-USD', model = 'deepseek-v4-flash-free', marketContext: clientContext = '' } = req.body || {}

  if (!message) {
    return res.status(400).json({ error: 'Message required' })
  }

  // Use market context from client (Binance CORS works from browser)
  // Fallback: try server-side fetch if client didn't provide context
  let marketContext = clientContext
  if (!marketContext) {
    try {
      const binanceSym = symbol.toUpperCase().replace(/-USD$/, '').replace(/USDT$/, '') + 'USDT'
      const tickerRes = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${binanceSym}`).then(r => r.json())

      if (tickerRes.lastPrice) {
        const price = parseFloat(tickerRes.lastPrice)
        const change = parseFloat(tickerRes.priceChangePercent)
        const high = parseFloat(tickerRes.highPrice)
        const low = parseFloat(tickerRes.lowPrice)
        const volume = parseFloat(tickerRes.quoteVolume)

        marketContext = `

=== بيانات السوق اللحظية من Binance ===
العملة: ${symbol}
السعر الحالي: $${price.toLocaleString()}
التغيير 24 ساعة: ${change.toFixed(2)}%
أعلى 24 ساعة: $${high.toLocaleString()}
أدنى 24 ساعة: $${low.toLocaleString()}
الحجم: $${(volume / 1e6).toFixed(1)}M

ملاحظة: هذه بيانات لحظية حقيقية. استخدمها في تحليلك.`
      }
    } catch {
      marketContext = '\n\n(لا تتوفر بيانات السوق حالياً)'
    }
  }

  const messages = [
    { role: 'system', content: TRADING_SYSTEM_PROMPT },
    { role: 'user', content: message + (marketContext ? '\n\n' + marketContext : '') },
  ]

  try {
    const modelId = AI_MODELS[model] ? model : 'deepseek-v4-flash-free'
    const ctrl = new AbortController()
    const timeout = setTimeout(() => ctrl.abort(), 40000)

    const aiRes = await fetch(AI_API_URL, {
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

    if (!aiRes.ok) {
      const errBody = await aiRes.text()
      throw new Error(`AI API ${aiRes.status}: ${errBody.slice(0, 200)}`)
    }

    const data = await aiRes.json()
    const msg = data.choices?.[0]?.message
    const text = msg?.content?.trim() || msg?.reasoning_content?.trim()

    return res.status(200).json({
      response: text || 'No response from AI',
      model,
      timestamp: new Date().toISOString(),
    })
  } catch (e: any) {
    return res.status(200).json({
      response: `⚠️ عذراً، لا أستطيع الاتصال بخدمة الذكاء الاصطناعي حالياً.\n\nلكن يمكنني مساعدتك:\n\n• اكتب "تحليل BTC" لتحليل عملة بتكوين\n• اكتب "مؤشرات" لرؤية المؤشرات الفنية\n• اكتب "استراتيجية" لاقتراح استراتيجية\n• اكتب "مساعدة" لرؤية جميع الأوامر`,
      model: 'fallback',
      error: e.message,
      timestamp: new Date().toISOString(),
    })
  }
}
