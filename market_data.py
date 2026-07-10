import sys, json, os
sys.path.insert(0, os.path.dirname(__file__))

from tradingview_mcp.core.services import screener_service, scanner_service, news_service, sentiment_service, multi_agent_service

# Import yfinance for price data
try:
    import yfinance as yf
    HAS_YF = True
except:
    HAS_YF = False

import requests

def get_binance_ticker(symbol):
    """Get real-time price from Binance"""
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
    """Get OHLCV from Binance"""
    sym = symbol.replace('-USD', '').replace('USDT', '') + 'USDT'
    try:
        r = requests.get(f'https://api.binance.com/api/v3/klines?symbol={sym}&interval={tf}&limit={limit}', timeout=5)
        raw = r.json()
        return [{'time': int(c[0]/1000), 'open': float(c[1]), 'high': float(c[2]), 'low': float(c[3]), 'close': float(c[4]), 'volume': float(c[5])} for c in raw]
    except: return []

def calc_indicators(candles):
    """Calculate RSI, EMA, MACD from candle data"""
    if len(candles) < 26: return {}
    closes = [c['close'] for c in candles]
    
    # RSI (14)
    deltas = [closes[i] - closes[i-1] for i in range(1, len(closes))]
    gains = [d if d > 0 else 0 for d in deltas]
    losses = [-d if d < 0 else 0 for d in deltas]
    avg_gain = sum(gains[-14:]) / 14
    avg_loss = sum(losses[-14:]) / 14
    rs = avg_gain / max(avg_loss, 0.001)
    rsi = 100 - (100 / (1 + rs))
    
    # EMA 20, 50
    k20 = 2/21; ema20 = closes[0]
    k50 = 2/51; ema50 = closes[0]
    for c in closes[1:]:
        ema20 = c * k20 + ema20 * (1 - k20)
        ema50 = c * k50 + ema50 * (1 - k50)
    
    # MACD
    k12 = 2/13; k26 = 2/27
    ema12 = closes[0]; ema26 = closes[0]
    for c in closes[1:]:
        ema12 = c * k12 + ema12 * (1 - k12)
        ema26 = c * k26 + ema26 * (1 - k26)
    macd_line = ema12 - ema26
    
    return {
        'rsi': round(rsi, 2),
        'ema20': round(ema20, 2),
        'ema50': round(ema50, 2),
        'macd': round(macd_line, 2),
        'price_vs_ema20': 'above' if closes[-1] > ema20 else 'below',
        'price_vs_ema50': 'above' if closes[-1] > ema50 else 'below',
    }

def analyze(symbol):
    """Full analysis of a symbol"""
    ticker = get_binance_ticker(symbol)
    candles = get_binance_candles(symbol, '15m', 100)
    indicators = calc_indicators(candles) if candles else {}
    
    # Get TradingView analysis
    tv_analysis = None
    try:
        tv_analysis = screener_service.analyze_coin(symbol, 'BINANCE')
    except: pass
    
    return {
        'ticker': ticker,
        'indicators': indicators,
        'candles_count': len(candles),
        'tv_analysis': tv_analysis,
    }

def scan_market():
    """Scan for top gainers"""
    try:
        return screener_service.fetch_trending_analysis('BINANCE', '15m', 10)
    except: return []

def get_news():
    """Get crypto news"""
    try:
        return news_service.fetch_news_summary()
    except: return {'items': []}

if __name__ == '__main__':
    cmd = sys.argv[1] if len(sys.argv) > 1 else 'analyze'
    symbol = sys.argv[2] if len(sys.argv) > 2 else 'BTC-USD'
    
    if cmd == 'analyze':
        print(json.dumps(analyze(symbol), indent=2))
    elif cmd == 'scan':
        print(json.dumps(scan_market(), indent=2))
    elif cmd == 'news':
        print(json.dumps(get_news(), indent=2))
    elif cmd == 'ticker':
        print(json.dumps(get_binance_ticker(symbol), indent=2))
    elif cmd == 'candles':
        tf = sys.argv[3] if len(sys.argv) > 3 else '15m'
        print(json.dumps(get_binance_candles(symbol, tf), indent=2))
