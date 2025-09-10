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
    stocks_ai: '/api/stocks/ai',
    stocks_semiconductor: '/api/stocks/semiconductor',
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
    // AI Stocks
    'NVDA': 'NASDAQ:NVDA',
    'MSFT': 'NASDAQ:MSFT',
    'GOOG': 'NASDAQ:GOOG',
    'GOOGL': 'NASDAQ:GOOGL',
    'PLTR': 'NYSE:PLTR',
    'AMD': 'NASDAQ:AMD',
    'AVGO': 'NASDAQ:AVGO',
    'META': 'NASDAQ:META',
    'AAPL': 'NASDAQ:AAPL',
    'TSLA': 'NASDAQ:TSLA',
    'CRWD': 'NASDAQ:CRWD',
    'PANW': 'NASDAQ:PANW',
    'SNOW': 'NYSE:SNOW',
    'SMCI': 'NASDAQ:SMCI',
    'MRVL': 'NASDAQ:MRVL',
    'AMZN': 'NASDAQ:AMZN',
    'ADBE': 'NASDAQ:ADBE',
    'NOW': 'NYSE:NOW',
    'ISRG': 'NASDAQ:ISRG',
    'SNPS': 'NASDAQ:SNPS',
    'CDNS': 'NASDAQ:CDNS',
    'WDAY': 'NASDAQ:WDAY',
    'NXPI': 'NASDAQ:NXPI',
    'ROK': 'NYSE:ROK',
    'BIDU': 'NASDAQ:BIDU',
    'ALAB': 'NASDAQ:ALAB',
    'SYM': 'NYSE:SYM',
    'TTD': 'NASDAQ:TTD',
    'TWLO': 'NYSE:TWLO',
    'TEMP': 'NYSE:TEMP',
    // Semiconductor Stocks
    'TSM': 'NYSE:TSM',
    'ASML': 'NASDAQ:ASML',
    'SSNLF': 'OTC:SSNLF',
    'QCOM': 'NASDAQ:QCOM',
    'AMAT': 'NASDAQ:AMAT',
    'ARM': 'NASDAQ:ARM',
    'TXN': 'NASDAQ:TXN',
    'INTC': 'NASDAQ:INTC',
    'MU': 'NASDAQ:MU',
    'ADI': 'NASDAQ:ADI',
    'MPWR': 'NASDAQ:MPWR',
    'STM': 'NYSE:STM',
    'ASX': 'NYSE:ASX',
    'GFS': 'NYSE:GFS',
    'SWKS': 'NASDAQ:SWKS',
    'MTSI': 'NASDAQ:MTSI',
    'QRVO': 'NASDAQ:QRVO',
    'RMBS': 'NASDAQ:RMBS',
    'TSEM': 'NYSE:TSEM',
    'CRUS': 'NASDAQ:CRUS',
    'ALGM': 'NASDAQ:ALGM',
    'PI': 'NASDAQ:PI',
    'SMTC': 'NASDAQ:SMTC',
    'SLAB': 'NASDAQ:SLAB',
    // ETFs
    'SPY': 'NYSEARCA:SPY',
    'XLK': 'NYSEARCA:XLK',
    'XLV': 'NYSEARCA:XLV',
    'XLF': 'NYSEARCA:XLF'
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
  }
};
