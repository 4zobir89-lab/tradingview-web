import type { Locale } from '../types'

const translations: Record<Locale, Record<string, string>> = {
  en: {
    // App
    'app.title': 'TradeX',
    'app.subtitle': 'Professional Trading Platform',

    // Navigation
    'nav.chart': 'Chart',
    'nav.watchlist': 'Watchlist',
    'nav.portfolio': 'Portfolio',
    'nav.positions': 'Positions',
    'nav.orders': 'Orders',
    'nav.orderbook': 'Order Book',
    'nav.market': 'Market',
    'nav.screener': 'Screener',
    'nav.alerts': 'Alerts',
    'nav.ai': 'AI Assistant',
    'nav.strategy': 'Strategy Builder',
    'nav.backtest': 'Backtest',
    'nav.scanner': 'Scanner',
    'nav.news': 'News',
    'nav.calendar': 'Economic Calendar',
    'nav.terminal': 'Terminal',
    'nav.logs': 'Logs',

    // Chart
    'chart.timeframe': 'Timeframe',
    'chart.type': 'Chart Type',
    'chart.indicators': 'Indicators',
    'chart.tools': 'Drawing Tools',
    'chart.candlestick': 'Candlestick',
    'chart.area': 'Area',
    'chart.line': 'Line',
    'chart.heikinashi': 'Heikin Ashi',
    'chart.renko': 'Renko',

    // Indicators
    'ind.rsi': 'RSI',
    'ind.macd': 'MACD',
    'ind.ema': 'EMA',
    'ind.sma': 'SMA',
    'ind.vwap': 'VWAP',
    'ind.atr': 'ATR',
    'ind.adx': 'ADX',
    'ind.cci': 'CCI',
    'ind.stochastic': 'Stochastic',
    'ind.bollinger': 'Bollinger Bands',
    'ind.supertrend': 'SuperTrend',
    'ind.ichimoku': 'Ichimoku',
    'ind.obv': 'OBV',
    'ind.volumeProfile': 'Volume Profile',

    // Dashboard
    'dash.price': 'Price',
    'dash.change24h': '24H Change',
    'dash.volume24h': '24H Volume',
    'dash.high': 'High',
    'dash.low': 'Low',
    'dash.spread': 'Spread',
    'dash.marketCap': 'Market Cap',
    'dash.fearGreed': 'Fear & Greed',
    'dash.sentiment': 'Sentiment',
    'dash.trend': 'Trend',
    'dash.momentum': 'Momentum',
    'dash.volatility': 'Volatility',

    // AI Assistant
    'ai.title': 'AI Assistant',
    'ai.placeholder': 'Ask me anything about the market...',
    'ai.analyze': 'Analyze',
    'ai.scanOpps': 'Find opportunities',
    'ai.compare': 'Compare',
    'ai.strategy': 'Create strategy',

    // Strategy Builder
    'strategy.title': 'Strategy Builder',
    'strategy.name': 'Strategy Name',
    'strategy.conditions': 'Conditions (Natural Language)',
    'strategy.placeholder': 'e.g., If EMA20 crosses EMA50 and RSI < 35 and volume is above average, then buy.',
    'strategy.compile': 'Compile Strategy',
    'strategy.save': 'Save',
    'strategy.test': 'Test',

    // Backtest
    'backtest.title': 'Backtesting',
    'backtest.run': 'Run Backtest',
    'backtest.pause': 'Pause',
    'backtest.stop': 'Stop',
    'backtest.equityCurve': 'Equity Curve',
    'backtest.drawdown': 'Drawdown',
    'backtest.sharpe': 'Sharpe Ratio',
    'backtest.winRate': 'Win Rate',
    'backtest.profitFactor': 'Profit Factor',
    'backtest.totalTrades': 'Total Trades',
    'backtest.export': 'Export Results',

    // Scanner
    'scanner.title': 'Market Scanner',
    'scanner.breakouts': 'Breakouts',
    'scanner.volumeSpike': 'Volume Spike',
    'scanner.rsiSignals': 'RSI Signals',
    'scanner.macdCross': 'MACD Cross',
    'scanner.trendChange': 'Trend Change',
    'scanner.liquiditySweep': 'Liquidity Sweep',

    // Alerts
    'alerts.title': 'Alerts',
    'alerts.new': 'New Alert',
    'alerts.active': 'Active',
    'alerts.triggered': 'Triggered',
    'alerts.price': 'Price Alert',
    'alerts.rsi': 'RSI Alert',
    'alerts.ema': 'EMA Alert',

    // Terminal
    'terminal.title': 'Terminal',
    'terminal.placeholder': 'Type a command...',
    'terminal.help': 'Help',

    // Market
    'market.gainers': 'Top Gainers',
    'market.losers': 'Top Losers',
    'market.volume': 'Top Volume',
    'market.refresh': 'Refresh',

    // News
    'news.title': 'Market News',
    'news.noNews': 'No news available',

    // Common
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.retry': 'Retry',
    'common.close': 'Close',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.search': 'Search...',
    'common.noData': 'No data available',
    'common.buy': 'Buy',
    'common.sell': 'Sell',
    'common.short': 'Short',
    'common.long': 'Long',
    'common.pnl': 'P&L',
    'common.balance': 'Balance',
    'common.total': 'Total',

    // Settings
    'settings.title': 'Settings',
    'settings.theme': 'Theme',
    'settings.language': 'Language',
    'settings.dark': 'Dark',
    'settings.light': 'Light',
  },
  ar: {
    // App
    'app.title': 'TradeX',
    'app.subtitle': 'منصة تداول احترافية',

    // Navigation
    'nav.chart': 'الشَّارت',
    'nav.watchlist': 'قائمة المراقبة',
    'nav.portfolio': 'المحفظة',
    'nav.positions': 'المراكز',
    'nav.orders': 'الأوامر',
    'nav.orderbook': 'دفتر الأوامر',
    'nav.market': 'السوق',
    'nav.screener': 'الماسح',
    'nav.alerts': 'التنبيهات',
    'nav.ai': 'مساعد الذكاء الاصطناعي',
    'nav.strategy': 'منشئ الاستراتيجيات',
    'nav.backtest': 'الاختبار الرجعي',
    'nav.scanner': 'الماسح الذكي',
    'nav.news': 'الأخبار',
    'nav.calendar': 'التقويم الاقتصادي',
    'nav.terminal': 'الطرفية',
    'nav.logs': 'السجلات',

    // Chart
    'chart.timeframe': 'الإطار الزمني',
    'chart.type': 'نوع الشَّارت',
    'chart.indicators': 'المؤشرات',
    'chart.tools': 'أدوات الرسم',
    'chart.candlestick': 'شموع يابانية',
    'chart.area': 'منطقة',
    'chart.line': 'خط',
    'chart.heikinashi': 'هايكين أشي',
    'chart.renko': 'رينكو',

    // Indicators
    'ind.rsi': 'مؤشر القوة النسبية',
    'ind.macd': 'ماكد',
    'ind.ema': 'المتوسط الأسي',
    'ind.sma': 'المتوسط البسيط',
    'ind.vwap': 'متوسط السعر المرجح بالحجم',
    'ind.atr': 'متوسط المدى الحقيقي',
    'ind.adx': 'مؤشر الاتجاه',
    'ind.cci': 'مؤشر سعر السلع',
    'ind.stochastic': 'ستوكاستيك',
    'ind.bollinger': 'نطاق بولنجر',
    'ind.supertrend': 'الاتجاه الخارق',
    'ind.ichimoku': 'إيتشيموكو',
    'ind.obv': 'حجم التداول المتراكم',
    'ind.volumeProfile': 'بروفايل الحجم',

    // Dashboard
    'dash.price': 'السعر',
    'dash.change24h': 'التغيير خلال 24 ساعة',
    'dash.volume24h': 'حجم التداول 24 ساعة',
    'dash.high': 'الأعلى',
    'dash.low': 'الأدنى',
    'dash.spread': 'السبريد',
    'dash.marketCap': 'القيمة السوقية',
    'dash.fearGreed': 'الخوف والطمع',
    'dash.sentiment': 'المشاعر',
    'dash.trend': 'الاتجاه',
    'dash.momentum': 'الزخم',
    'dash.volatility': 'التقلبات',

    // AI Assistant
    'ai.title': 'مساعد الذكاء الاصطناعي',
    'ai.placeholder': 'اسألني أي شيء عن السوق...',
    'ai.analyze': 'حلّل',
    'ai.scanOpps': 'ابحث عن فرص',
    'ai.compare': 'قارن',
    'ai.strategy': 'أنشئ استراتيجية',

    // Strategy Builder
    'strategy.title': 'منشئ الاستراتيجيات',
    'strategy.name': 'اسم الاستراتيجية',
    'strategy.conditions': 'الشروط (بلغة طبيعية)',
    'strategy.placeholder': 'مثال: إذا تقاطع EMA20 مع EMA50 وكان RSI أقل من 35 والحجم أعلى من المتوسط، اشترِ.',
    'strategy.compile': 'ترجم الاستراتيجية',
    'strategy.save': 'حفظ',
    'strategy.test': 'اختبار',

    // Backtest
    'backtest.title': 'الاختبار الرجعي',
    'backtest.run': 'شغّل الاختبار',
    'backtest.pause': 'إيقاف مؤقت',
    'backtest.stop': 'إيقاف',
    'backtest.equityCurve': 'منحنى حقوق الملكية',
    'backtest.drawdown': 'التراجع',
    'backtest.sharpe': 'نسبة شارب',
    'backtest.winRate': 'نسبة الربح',
    'backtest.profitFactor': 'عامل الربح',
    'backtest.totalTrades': 'إجمالي الصفقات',
    'backtest.export': 'تصدير النتائج',

    // Scanner
    'scanner.title': 'ماسح السوق',
    'scanner.breakouts': 'الاختراقات',
    'scanner.volumeSpike': 'ارتفاع الحجم',
    'scanner.rsiSignals': 'إشارات RSI',
    'scanner.macdCross': 'تقاطع ماكد',
    'scanner.trendChange': 'تغيير الاتجاه',
    'scanner.liquiditySweep': 'مسح السيولة',

    // Alerts
    'alerts.title': 'التنبيهات',
    'alerts.new': 'تنبيه جديد',
    'alerts.active': 'نشط',
    'alerts.triggered': 'مُفعّل',
    'alerts.price': 'تنبيه سعر',
    'alerts.rsi': 'تنبيه RSI',
    'alerts.ema': 'تنبيه EMA',

    // Terminal
    'terminal.title': 'الطرفية',
    'terminal.placeholder': 'اكتب أمراً...',
    'terminal.help': 'مساعدة',

    // Market
    'market.gainers': 'الأكثر صعوداً',
    'market.losers': 'الأكثر هبوطاً',
    'market.volume': 'الأكثر حجماً',
    'market.refresh': 'تحديث',

    // News
    'news.title': 'أخبار السوق',
    'news.noNews': 'لا توجد أخبار',

    // Common
    'common.loading': 'جاري التحميل...',
    'common.error': 'خطأ',
    'common.retry': 'إعادة المحاولة',
    'common.close': 'إغلاق',
    'common.save': 'حفظ',
    'common.cancel': 'إلغاء',
    'common.delete': 'حذف',
    'common.search': 'بحث...',
    'common.noData': 'لا توجد بيانات',
    'common.buy': 'شراء',
    'common.sell': 'بيع',
    'common.short': 'بيع عادي',
    'common.long': 'شراء عادي',
    'common.pnl': 'الربح/الخسارة',
    'common.balance': 'الرصيد',
    'common.total': 'الإجمالي',

    // Settings
    'settings.title': 'الإعدادات',
    'settings.theme': 'المظهر',
    'settings.language': 'اللغة',
    'settings.dark': 'داكن',
    'settings.light': 'فاتح',
  }
}

let currentLocale: Locale = (localStorage.getItem('locale') as Locale) || 'en'
const listeners = new Set<() => void>()

export function t(key: string): string {
  return translations[currentLocale]?.[key] || translations.en[key] || key
}

export function getLocale(): Locale { return currentLocale }
export function setLocale(locale: Locale) {
  currentLocale = locale
  localStorage.setItem('locale', locale)
  document.documentElement.lang = locale
  document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr'
  listeners.forEach(fn => fn())
}
export function onLocaleChange(fn: () => void) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
export function getDirection(): 'ltr' | 'rtl' {
  return currentLocale === 'ar' ? 'rtl' : 'ltr'
}
