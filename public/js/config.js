// Configuration and constants
const CONFIG = {
  sectorETFs: {
    'S&P 500': 'SPY',
    'Technology': 'XLK',
    'Healthcare': 'XLV',
    'Finance': 'XLF',
  },

  // API endpoints
  endpoints: {
    historical: '/api/historical',
    analysis: '/api/analysis', 
    seasonal: '/api/seasonal',
    quote: '/api/quote',
    company_info: '/api/company-info',
    ai_stocks: '/api/stocks/ai',
    semiconductor_stocks: '/api/stocks/semiconductor',
    ai_sentiment: '/api/ai/sentiment',
    ai_recommendations: '/api/ai/recommendations',
    ai_status: '/api/ai/status',
    // 새로운 종합 추천 시스템 엔드포인트
    monthly_recommendations: '/api/recommendations/monthly',
    sector_recommendations: '/api/recommendations/sector',
    stock_score: '/api/score',
    enhanced_ai_recommendations: '/api/ai/recommendations/enhanced'
  },

  // Exchange mapping for accurate TradingView symbols
  exchangeMapping: {
    // 대형 AI/Tech 기업들
    'NVDA': 'NASDAQ:NVDA',
    'MSFT': 'NASDAQ:MSFT',
    'GOOG': 'NASDAQ:GOOG',
    'GOOGL': 'NASDAQ:GOOGL',
    'META': 'NASDAQ:META',
    'AAPL': 'NASDAQ:AAPL',
    'TSLA': 'NASDAQ:TSLA',
    'AMZN': 'NASDAQ:AMZN',
    'NFLX': 'NASDAQ:NFLX',
    'CRM': 'NYSE:CRM',
    
    // AI 전문 기업들
    'PLTR': 'NYSE:PLTR',
    'SNOW': 'NYSE:SNOW',
    'CRWD': 'NASDAQ:CRWD',
    'PANW': 'NASDAQ:PANW',
    'NOW': 'NYSE:NOW',
    'WDAY': 'NASDAQ:WDAY',
    'ADBE': 'NASDAQ:ADBE',
    'ORCL': 'NYSE:ORCL',
    'ADSK': 'NASDAQ:ADSK',
    'INTU': 'NASDAQ:INTU',
    
    // 신흥 AI 기업들
    'SMCI': 'NASDAQ:SMCI',
    'ALAB': 'NASDAQ:ALAB',
    'SYM': 'NYSE:SYM',
    'TTD': 'NASDAQ:TTD',
    'TWLO': 'NYSE:TWLO',
    'TEMP': 'NYSE:TEMP',
    'SPLK': 'NASDAQ:SPLK',
    'OKTA': 'NASDAQ:OKTA',
    'ZS': 'NASDAQ:ZS',
    'DDOG': 'NASDAQ:DDOG',
    
    // 메가캡 반도체
    'TSM': 'NYSE:TSM',
    'AVGO': 'NASDAQ:AVGO',
    'ASML': 'NASDAQ:ASML',
    'AMD': 'NASDAQ:AMD',
    'QCOM': 'NASDAQ:QCOM',
    'TXN': 'NASDAQ:TXN',
    'INTC': 'NASDAQ:INTC',
    'MU': 'NASDAQ:MU',
    'ADI': 'NASDAQ:ADI',
    
    // 중형 반도체
    'AMAT': 'NASDAQ:AMAT',
    'ARM': 'NASDAQ:ARM',
    'NXPI': 'NASDAQ:NXPI',
    'MRVL': 'NASDAQ:MRVL',
    'MPWR': 'NASDAQ:MPWR',
    'LRCX': 'NASDAQ:LRCX',
    'KLAC': 'NASDAQ:KLAC',
    'SNPS': 'NASDAQ:SNPS',
    'CDNS': 'NASDAQ:CDNS',
    
    // 소형/전문 반도체
    'STM': 'NYSE:STM',
    'SWKS': 'NASDAQ:SWKS',
    'QRVO': 'NASDAQ:QRVO',
    'RMBS': 'NASDAQ:RMBS',
    'CRUS': 'NASDAQ:CRUS',
    'ALGM': 'NASDAQ:ALGM',
    'PI': 'NASDAQ:PI',
    'SMTC': 'NASDAQ:SMTC',
    'SLAB': 'NASDAQ:SLAB',
    'SITM': 'NASDAQ:SITM',
    
    // ETFs
    'SPY': 'NYSEARCA:SPY',
    'XLK': 'NYSEARCA:XLK',
    'XLV': 'NYSEARCA:XLV',
    'XLF': 'NYSEARCA:XLF'
  }
};

