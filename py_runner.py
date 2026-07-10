import json, sys
sys.path.insert(0, '/usr/local/lib/python3.13/dist-packages')
from tradingview_mcp.core.services import yahoo_finance_service
from tradingview_mcp.core.services import screener_service
from tradingview_mcp.core.services import scanner_service
from tradingview_mcp.core.services import multi_agent_service
from tradingview_mcp.core.services import news_service
from tradingview_mcp.core.services import sentiment_service
from tradingview_mcp.core.services import backtest_service

code = sys.argv[1]
exec(code)
print(json.dumps(result))
