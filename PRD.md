# PRD: TradeX Pro — لوحة تحكم التداول الاحترافية

## 1. نظرة عامة

لوحة تحكم ويب احترافية للتحليل الفني وأدوات التداول. تتكامل مع Binance API للبيانات اللحظية وOpenCode AI للتحليل الذكي.

### الهدف
- تحليل فني لحظي مع مؤشرات احترافية
- مساعد ذكاء اصطناعي متعدد النماذج
- اختبار رجعي للاستراتيجيات
- واجهة مستخدم احترافية (React + TypeScript)

### التقنيات
- **Frontend:** React 18 + TypeScript + Vite
- **Backend:** Node.js + Express
- **بيانات:** Binance API (لحظي)
- **ذكاء اصطناعي:** OpenCode AI API
- **مخططات:** Lightweight Charts (TradingView)

---

## 2. المستخدمون

| المستخدم | الاستخدام |
|----------|-----------|
| Trader محترف | تحليل فني لحظي + اتخاذ قرارات |
| مبتدئ في التداول | تعلم التحليل الفني من البيانات الحية |
| مطور استراتيجيات | اختبار رجعي للاستراتيجيات |

---

## 3. المكونات الرئيسية

### 3.1 الشارت التفاعلي (TradingChart)
- عرض شموع Japanese Candlesticks
- خطوط Bollinger Bands
- خطوط EMA (20, 50)
- SuperTrend
- VWAP
- حجم التداول (Volume)
- أزرار تبديل الفريمات الزمنية: 5m, 15m, 1h, 4h, 1D

### 3.2 مساعد الذكاء الاصطناعي (AIAssistantPanel)

**النماذج المدعومة:**

| المعرف | الاسم | الوصف |
|--------|-------|-------|
| `deepseek-v4-flash-free` | DeepSeek V4 Flash | ⚡ سريع ومجاني |
| `mimo-v2.5-free` | MiMo V2.5 | 🤖 مجاني |
| `north-mini-code-free` | North Mini Code | 🧠 مجاني |
| `nemotron-3-ultra-free` | Nemotron 3 Ultra | 🎯 مجاني |
| `big-pickle` | Big Pickle | 🥒 مجاني |

**الأوامر السريعة:**
- 📊 تحليل فني شامل
- 🎯 استراتيجية تداول
- ⚖️ مقارنة بين العملات
- ⚠️ إدارة مخاطر
- 📈 مؤشرات فنية
- 🔮 توقعات

**كيف يعمل:**
1. المستخدم يرسل سؤال
2. الخادم يجلب بيانات لحظية من Binance
3. البيانات تُرفق مع الرسالة للنموذج
4. النموذج يرد بتحليل بناءً على بيانات حقيقية

### 3.3 الماسح الذكي (SmartScanner)
- فلترة العملات حسب المؤشرات
- Top Gainers / Losers
- إشارات الشراء والبيع

### 3.4 قائمة المراقبة (Watchlist)
- مراقبة عملات محددة
- تحديث الأسعار لحظياً
- عرض التغيير اليومي

### 3.5 الطرفية (Terminal)
- سجل الأوامر والعمليات
- معلومات النظام

---

## 4. الـ APIs

### 4.1 بيانات السوق (Binance)

| Method | Endpoint | الوصف |
|--------|----------|-------|
| GET | `/api/ticker/:symbol` | سعر لحظي |
| GET | `/api/candles/:symbol` | شموع متتالية |
| GET | `/api/orderbook/:symbol` | كتاب الأوامر |
| GET | `/api/analysis/:symbol` | تحليل شامل |
| GET | `/api/multi-analysis/:symbol` | تحليل متعدد الفريمات |
| GET | `/api/gainers/:exchange/:timeframe/:limit` | أعلى صعود |
| GET | `/api/smart-volume/:symbol` | مسح ذكي للحجم |
| GET | `/api/candle-pattern/:symbol` | أنماط الشموع |

### 4.2 الذكاء الاصطناعي

| Method | Endpoint | الوصف | Body |
|--------|----------|-------|------|
| POST | `/api/chat` | محادثة AI | `{ message, symbol, model }` |

**示例:**
```json
{
  "message": "حلل BTC تحليل فني",
  "symbol": "BTC-USD",
  "model": "deepseek-v4-flash-free"
}
```

**رد:**
```json
{
  "response": "بناءً على البيانات اللحظية...",
  "model": "deepseek-v4-flash-free",
  "timestamp": "2026-07-10T20:00:00.000Z"
}
```

### 4.3 اختبار رجعي

| Method | Endpoint | الوصف | Body |
|--------|----------|-------|------|
| POST | `/api/backtest` | اختبار استراتيجية | `{ symbol, strategy, timeframe, period }` |

**الاستراتيجيات:**
- RSI Oversold
- Bollinger Reversal
- EMA Crossover
- MACD Divergence
- Support Bounce

### 4.4 صحة النظام

| Method | Endpoint | الوصف |
|--------|----------|-------|
| GET | `/api/health` | فحص الصحة |

**رد:**
```json
{
  "status": "ok",
  "timestamp": "2026-07-10T20:00:00.000Z"
}
```

---

## 5. البنية التقنية

### 5.1 هيكل المشروع
```
tradingview-web/
├── package.json           # تبعيات المشروع
├── server.js              # Express server + Binance API + AI Chat
├── vite.config.ts         # إعدادات Vite
├── tsconfig.json          # إعدادات TypeScript
├── index.html             # الصفحة الرئيسية
├── PRD.md                 # هذا الملف
├── src/
│   ├── main.tsx           # نقطة الدخول
│   ├── App.tsx            # التطبيق الرئيسي
│   ├── core/
│   │   └── api.ts         # دوال API
│   ├── components/
│   │   ├── TradingChart.tsx
│   │   ├── Header.tsx
│   │   └── ...
│   ├── panels/
│   │   ├── AIAssistantPanel.tsx
│   │   ├── SmartScanner.tsx
│   │   ├── Watchlist.tsx
│   │   └── Terminal.tsx
│   └── shared/
│       └── hooks.ts
└── dist/                  # ملفات البناء
```

### 5.2 التبعيات
```json
{
  "dependencies": {
    "express": "^4.21.0",
    "lightweight-charts": "^4.2.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "ws": "^8.21.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.0",
    "typescript": "^5.5.0",
    "vite": "^5.4.0"
  }
}
```

---

## 6. إعدادات الخادم

### 6.1 المتغيرات
```javascript
// Binance API (عام، لا يحتاج مفتاح)
const BINANCE_BASE = 'https://api.binance.com';

// OpenCode AI
const AI_API_KEY = 'sk-...';
const AI_API_URL = 'https://opencode.ai/zen/v1/chat/completions';
```

### 6.2 الـ Timeouts
```javascript
// aiChat: 30 ثانية
// fullAnalysis: 12 ثانية  
// binanceGet: 8 ثوانٍ
```

---

## 7. التشغيل

### 7.1 التثبيت
```bash
cd tradingview-web
npm install
```

### 7.2 التشغيل
```bash
# تشغيل الخادم والواجهة معاً
npm run dev

# أو تشغيل منفصل
node server.js    # الخادم على بورت 3000
npm run dev       # الواجهة على بورت 5173
```

### 7.3 الوصول
```
http://localhost:5173
```

---

## 8. المؤشرات الفنية المدعومة

| المؤشر | الوصف |
|--------|-------|
| RSI | مؤشر القوة النسبية |
| MACD | تقارب وتباعد المتوسطات |
| EMA | المتوسط الأسي (20, 50) |
| Bollinger Bands | نطاقات بولنجر |
| ADX | مؤشر الاتجاه المتوسط |
| VWAP | متوسط السعر المرجح بالحجم |
| SuperTrend | مؤشر الاتجاه |
| Stochastic | مؤشر ستوكاستيك |
| ATR | المدى الحقيقي المتوسط |
| Ichimoku | سحابة إيشيموكي |

---

## 9. إشارات التحليل الفني

| الإشارة | الشرط |
|---------|-------|
| STRONG BUY | RSI < 30 + MACD > 0 + EMA20 > EMA50 |
| BUY | RSI < 40 + السعر > VWAP |
| NEUTRAL | بين الشراء والبيع |
| SELL | RSI > 60 + السعر < VWAP |
| STRONG SELL | RSI > 70 + MACD < 0 + EMA20 < EMA50 |

---

## 10. التوسع المستقبلي

| الميزة | الوصف | الأولوية |
|--------|-------|----------|
| WebSocket | تحديث لحظي بدون refresh | عالية |
| TradingView MCP | تكامل مع MCP server | عالية |
| Auth | تسجيل دخول | متوسطة |
| Alerts | تنبيهات سعرية | متوسطة |
| Export | تصدير التحليلات | منخفضة |

---

## 11.KNOWN ISSUES

| المشكلة | الحالة | الحل |
|---------|--------|------|
| Binance API بطيء أحياناً | معروف | timeout 12 ثانية |
| بعض النماذج لا تتبع system prompt | معروف | إرسال البيانات في user message |
| لا يوجد WebSocket بعد | مُخطط | إضافة مستقبلاً |

---

**تاريخ الإنشاء:** 2026-07-10
**الآخر تحديث:** 2026-07-10
**الإصدار:** 2.0.0
**الحالة:** ✅ يعمل — بيانات لحظية + AI متعدد النماذج
