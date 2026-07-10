import sys, json, os, requests

sys.path.insert(0, os.path.dirname(__file__))

def get_binance_ticker(symbol):
    sym = symbol.replace('-USD', '').replace('USDT', '') + 'USDT'
    try:
        r = requests.get(f'https://api.binance.com/api/v3/ticker/24hr?symbol={sym}', timeout=5)
        d = r.json()
        return {
            'symbol': d['symbol'], 'price': float(d['lastPrice']),
            'change': float(d['priceChange']), 'change_pct': float(d['priceChangePercent']),
            'high24h': float(d['highPrice']), 'low24h': float(d['lowPrice']),
            'volume24h': float(d['quoteVolume']),
        }
    except: return None

def get_binance_candles(symbol, tf='15m', limit=100):
    sym = symbol.replace('-USD', '').replace('USDT', '') + 'USDT'
    try:
        r = requests.get(f'https://api.binance.com/api/v3/klines?symbol={sym}&interval={tf}&limit={limit}', timeout=5)
        raw = r.json()
        return [{'time': int(c[0]/1000), 'open': float(c[1]), 'high': float(c[2]), 'low': float(c[3]), 'close': float(c[4]), 'volume': float(c[5])} for c in raw]
    except: return []

def calc_indicators(candles):
    if len(candles) < 26: return {}
    closes = [c['close'] for c in candles]
    deltas = [closes[i] - closes[i-1] for i in range(1, len(closes))]
    gains = [d if d > 0 else 0 for d in deltas]
    losses = [-d if d < 0 else 0 for d in deltas]
    avg_gain = sum(gains[-14:]) / 14
    avg_loss = sum(losses[-14:]) / 14
    rs = avg_gain / max(avg_loss, 0.001)
    rsi = 100 - (100 / (1 + rs))
    k20 = 2/21; ema20 = closes[0]
    k50 = 2/51; ema50 = closes[0]
    for c in closes[1:]:
        ema20 = c * k20 + ema20 * (1 - k20)
        ema50 = c * k50 + ema50 * (1 - k50)
    k12 = 2/13; k26 = 2/27
    ema12 = closes[0]; ema26 = closes[0]
    for c in closes[1:]:
        ema12 = c * k12 + ema12 * (1 - k12)
        ema26 = c * k26 + ema26 * (1 - k26)
    macd_line = ema12 - ema26
    return {
        'rsi': round(rsi, 2), 'ema20': round(ema20, 2), 'ema50': round(ema50, 2), 'macd': round(macd_line, 2),
        'price_vs_ema20': 'above' if closes[-1] > ema20 else 'below',
        'price_vs_ema50': 'above' if closes[-1] > ema50 else 'below',
    }

def chat(user_message, symbol='BTC-USD'):
    ticker = get_binance_ticker(symbol)
    candles = get_binance_candles(symbol, '15m', 100)
    indicators = calc_indicators(candles) if candles else {}
    
    price = ticker['price'] if ticker else 0
    change_pct = ticker['change_pct'] if ticker else 0
    rsi = indicators.get('rsi', 0)
    ema20 = indicators.get('ema20', 0)
    ema50 = indicators.get('ema50', 0)
    macd = indicators.get('macd', 0)
    is_up = change_pct >= 0
    l = user_message.lower()
    
    if any(w in l for w in ['analyze', 'حلل', 'analysis', 'تحليل']):
        signal = 'HOLD'
        if rsi < 30: signal = 'BUY (RSI oversold)'
        elif rsi > 70: signal = 'SELL (RSI overbought)'
        if macd > 0: signal += ' + MACD bullish'
        
        response = f"""📊 تحليل شامل لـ {symbol}

💰 السعر: ${price:,.2f}
📈 التغيير 24س: {'+' if is_up else ''}{change_pct:.2f}%
📊 أعلى/أدنى: ${ticker['high24h']:,.2f} / ${ticker['low24h']:,.2f}
📦 الحجم 24س: ${ticker['volume24h']/1e6:,.1f}M

🔧 المؤشرات الفنية:
  • RSI(14): {rsi} {'⚠️ تشبع بيع' if rsi < 30 else '⚠️ تشبع شراء' if rsi > 70 else 'محايد'}
  • EMA20: ${ema20:,.2f} (السعر {'فوق' if indicators.get('price_vs_ema20') == 'above' else 'تحت'})
  • EMA50: ${ema50:,.2f} (السعر {'فوق' if indicators.get('price_vs_ema50') == 'above' else 'تحت'})
  • MACD: {macd} {'🟢 صاعد' if macd > 0 else '🔴 هابط'}

🎯 الإشارة: {signal}
💡 التوصية: {'شراء عند التصحيح' if 'BUY' in signal else 'بيع/انتظار' if 'SELL' in signal else 'انتظار إشارة أوضح'}"""
    
    elif any(w in l for w in ['scan', 'ابحث', 'فرص', 'screen']):
        try:
            from tradingview_mcp.core.services import screener_service
            gainers = screener_service.fetch_trending_analysis('BINANCE', '15m', 5)
            items = gainers if isinstance(gainers, list) else []
            response = '🔍 أفضل العملات صعوداً:\n\n'
            for i, x in enumerate(items[:5]):
                name = (x.get('symbol', '') or '').split(':').pop().replace('USDT', '')
                ch = x.get('changePercent', 0)
                response += f"{i+1}. {name} — {'+' if ch >= 0 else ''}{ch:.2f}%\n"
            if not items: response = 'لا توجد بيانات مؤقتاً - جرب لاحقاً'
        except Exception as e:
            response = f'خطأ في المسح: {str(e)}'
    
    elif any(w in l for w in ['compare', 'قارن']):
        syms = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT']
        response = '⚖️ مقارنة العملات:\n\n'
        for s in syms:
            try:
                r = requests.get(f'https://api.binance.com/api/v3/ticker/24hr?symbol={s}', timeout=5)
                d = r.json()
                p = float(d['lastPrice'])
                ch = float(d['priceChangePercent'])
                vol = float(d['quoteVolume']) / 1e6
                response += f"{s.replace('USDT','')}: ${p:,.2f} ({'+' if ch>=0 else ''}{ch:.2f}%) Vol: ${vol:.0f}M\n"
            except: pass
    
    elif any(w in l for w in ['strategy', 'استراتيجية', 'خطط']):
        if rsi < 30:
            strat = 'شراء فوري (RSI أقل من 30 — تشبع بيع)'
            entry = price * 0.99; tp = price * 1.05; sl = price * 0.97
        elif rsi > 70:
            strat = 'بيع/انتظار (RSI فوق 70 — تشبع شراء)'
            entry = price * 1.01; tp = price * 0.95; sl = price * 1.03
        else:
            strat = 'انتظار إشارة أوضح'
            entry = price * (0.98 if is_up else 1.02)
            tp = price * (1.05 if is_up else 0.95)
            sl = price * (0.95 if is_up else 1.05)
        
        response = f"""🤖 استراتيجية مقترحة:

📊 العملة: {symbol}
💰 السعر الحالي: ${price:,.2f}
📈 الاتجاه: {'صاعد 📈' if is_up else 'هابط 📉'}

🎯 الخطة:
  • الدخول: ${entry:,.2f}
  • الهدف: ${tp:,.2f} ({((tp/price-1)*100):+.1f}%)
  • وقف الخسارة: ${sl:,.2f} ({((sl/price-1)*100):+.1f}%)

💡 ملاحظة: استراتيجية مقترحة فقط. قم بتحليلك الخاص."""
    
    else:
        response = f"""مرحباً! أنا TradeX AI 🤖

السعر الحالي لـ {symbol}: ${price:,.2f} ({'+' if is_up else ''}{change_pct:.2f}%)

الأوامر:
• analyze / تحليل — تحليل فني شامل
• scan / ابحث — أفضل العملات
• compare / قارن — مقارنة BTC/ETH/SOL
• strategy / استراتيجية — خطة تداول مقترحة

أو اسأل عن أي شيء! 📊"""
    
    return {'response': response, 'data': {'ticker': ticker, 'indicators': indicators}}

if __name__ == '__main__':
    msg = sys.argv[1] if len(sys.argv) > 1 else 'مرحبا'
    sym = sys.argv[2] if len(sys.argv) > 2 else 'BTC-USD'
    result = chat(msg, sym)
    print(json.dumps(result, ensure_ascii=False))
