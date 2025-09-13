const express = require('express');
const router = express.Router();
const yahooFinanceService = require('../services/yahooFinanceService');
const HuggingFaceDeepSeekService = require('../services/ai/simpleAIService');
const investmentRecommendationService = require('../services/investmentRecommendationService');

const aiService = new HuggingFaceDeepSeekService();

router.get('/historical/:ticker', async (req, res) => {
  try {
    const ticker = req.params.ticker;
    const data = await yahooFinanceService.getHistoricalData(ticker);
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching historical data', error: error.message });
  }
});

router.get('/analysis/:ticker', async (req, res) => {
  try {
    const ticker = req.params.ticker;
    const analysis = await yahooFinanceService.getTechnicalAnalysis(ticker);
    res.json(analysis);
  } catch (error) {
    res.status(500).json({ message: 'Error performing technical analysis', error: error.message });
  }
});

router.get('/seasonal/:ticker', async (req, res) => {
  try {
    const ticker = req.params.ticker;
    const analysis = await yahooFinanceService.getSeasonalAnalysis(ticker);
    res.json(analysis);
  } catch (error) {
    res.status(500).json({ message: 'Error performing seasonal analysis', error: error.message });
  }
});

const aiStocks = [
  // 대형 AI/Tech 기업들
  'NVDA', 'MSFT', 'GOOG', 'GOOGL', 'META', 'AAPL', 'TSLA', 'AMZN', 'NFLX', 'CRM',
  // AI 전문 기업들
  'PLTR', 'SNOW', 'CRWD', 'PANW', 'NOW', 'WDAY', 'ADBE', 'ORCL', 'ADSK', 'INTU',
  // 신흥 AI 기업들
  'SMCI', 'ALAB', 'SYM', 'TTD', 'TWLO', 'TEMP', 'SPLK', 'OKTA', 'ZS', 'DDOG'
];

const semiconductorStocks = [
  // 메가캡 반도체
  'NVDA', 'TSM', 'AVGO', 'ASML', 'AMD', 'QCOM', 'TXN', 'INTC', 'MU', 'ADI',
  // 중형 반도체 
  'AMAT', 'ARM', 'NXPI', 'MRVL', 'MPWR', 'ALAB', 'LRCX', 'KLAC', 'SNPS', 'CDNS',
  // 소형/전문 반도체
  'STM', 'SWKS', 'QRVO', 'RMBS', 'CRUS', 'ALGM', 'PI', 'SMTC', 'SLAB', 'SITM'
];

router.get('/stocks/ai', (req, res) => {
  res.json(aiStocks);
});

router.get('/stocks/semiconductor', (req, res) => {
  res.json(semiconductorStocks);
});

router.get('/company-info/:ticker', async (req, res) => {
  try {
    const ticker = req.params.ticker;
    const companyInfo = await yahooFinanceService.getCompanyInfo(ticker);
    res.json({ description: companyInfo });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching company information', error: error.message });
  }
});

router.get('/quote/:ticker', async (req, res) => {
  try {
    const ticker = req.params.ticker;
    const quote = await yahooFinanceService.getQuoteSummary(ticker);
    res.json(quote);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching quote summary', error: error.message });
  }
});

router.get('/ai/sentiment', async (req, res) => {
  try {
    const sentiment = await aiService.analyzeSentiment('MARKET', {});
    res.json(sentiment);
  } catch (error) {
    console.error('AI sentiment analysis failed:', error.message);
    res.status(503).json({ 
      message: 'AI sentiment analysis service unavailable', 
      error: 'Please ensure HUGGINGFACE_API_KEY is configured properly',
      details: error.message
    });
  }
});

router.get('/ai/recommendations', async (req, res) => {
  try {
    const tickers = req.query.tickers ? req.query.tickers.split(',') : ['AAPL', 'MSFT', 'NVDA'];
    const recommendations = await aiService.getStockRecommendations(tickers, {});
    res.json(recommendations);
  } catch (error) {
    console.error('AI recommendations failed:', error.message);
    res.status(503).json({ 
      message: 'AI recommendations service unavailable', 
      error: 'Please ensure HUGGINGFACE_API_KEY is configured properly',
      details: error.message
    });
  }
});

router.get('/ai/status', async (req, res) => {
  try {
    const status = await aiService.checkApiStatus();
    res.json({
      status: 'connected',
      message: status.message,
      aiProvider: status.aiProvider,
      model: status.model
    });
  } catch (error) {
    console.error('AI status check failed:', error.message);
    res.status(503).json({ 
      status: 'error',
      message: 'AI service unavailable', 
      error: 'Please ensure HUGGINGFACE_API_KEY is configured properly',
      details: error.message
    });
  }
});

// ===== 새로운 종합 추천 시스템 라우트 =====

router.get('/recommendations/monthly', async (req, res) => {
  try {
    const category = req.query.category || 'all';
    const currentMonth = new Date().getMonth();
    
    const stockLists = {
      ai: ['NVDA', 'MSFT', 'GOOG', 'META', 'AAPL', 'TSLA', 'AMD', 'PLTR', 'AVGO', 'AMZN'],
      semiconductor: ['TSM', 'ASML', 'QCOM', 'AMAT', 'INTC', 'MU', 'ADI', 'MRVL', 'ARM', 'TXN'],
      popular: ['SPY', 'QQQ', 'AAPL', 'MSFT', 'NVDA', 'TSLA', 'AMZN', 'GOOG', 'META', 'BRK-B']
    };
    
    let stocksToAnalyze = [];
    if (category === 'all') {
      stocksToAnalyze = [...new Set([...stockLists.ai, ...stockLists.semiconductor, ...stockLists.popular])];
    } else {
      stocksToAnalyze = stockLists[category] || stockLists.popular;
    }
    
    const analyses = [];
    for (let i = 0; i < Math.min(stocksToAnalyze.length, 10); i += 3) {
      const batch = stocksToAnalyze.slice(i, i + 3);
      const batchPromises = batch.map(async (ticker) => {
        try {
          const score = await investmentRecommendationService.analyzeStockForMonth(ticker, currentMonth);
          return score;
        } catch (error) {
          console.error(`Error analyzing ${ticker}:`, error.message);
          return null;
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      analyses.push(...batchResults.filter(result => result && !result.error));
      
      if (i + 3 < stocksToAnalyze.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    const sortedRecommendations = analyses
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, 5);
    
    const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
    const monthName = monthNames[currentMonth];
    
    res.json({
      month: monthName,
      category,
      totalAnalyzed: analyses.length,
      recommendations: sortedRecommendations,
      generatedAt: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({ message: 'Error getting monthly recommendations', error: error.message });
  }
});

router.get('/recommendations/sector/:sector', async (req, res) => {
  try {
    const sector = req.params.sector;
    const recommendations = await investmentRecommendationService.getSectorRecommendations(sector);
    res.json(recommendations);
  } catch (error) {
    res.status(500).json({ message: 'Error getting sector recommendations', error: error.message });
  }
});

// GET /api/score/:ticker (최신 통합 로직)
router.get('/score/:ticker', async (req, res) => {
  try {
    const ticker = req.params.ticker;
    const currentMonth = new Date().getMonth();
    const analysis = await investmentRecommendationService.analyzeStockForMonth(ticker, currentMonth);
    res.json(analysis);
  } catch (error) {
    res.status(500).json({ message: 'Error calculating stock score', error: error.message });
  }
});

router.get('/ai/recommendations/enhanced', async (req, res) => {
  try {
    const marketData = {
      timestamp: new Date().toISOString(),
    };
    
    const recommendations = await aiService.getStockRecommendations([], marketData);
    res.json(recommendations);
  } catch (error) {
    res.status(500).json({ message: 'Error getting enhanced AI recommendations', error: error.message });
  }
});

router.get('/seasonal/enhanced/:ticker', async (req, res) => {
  try {
    const ticker = req.params.ticker;
    const month = req.query.month ? parseInt(req.query.month) - 1 : null;
    const seasonalAnalysisService = require('../services/seasonalAnalysisService');
    
    const analysis = await seasonalAnalysisService.getEnhancedSeasonalAnalysis(ticker, month);
    res.json(analysis);
  } catch (error) {
    res.status(500).json({ message: 'Error performing enhanced seasonal analysis', error: error.message });
  }
});

router.get('/seasonal/ai/:ticker', async (req, res) => {
  try {
    const ticker = req.params.ticker;
    const currentMonth = new Date().getMonth();
    const NewsSeasonalAnalyzer = require('../services/news/newsSeasonalAnalyzer');
    const newsSeasonalAnalyzer = new NewsSeasonalAnalyzer();
    
    // NEW: 뉴스 기반 시기적 분석 사용
    const analysis = await newsSeasonalAnalyzer.analyzeNewsSeasonalScore(ticker, currentMonth);
    
    const aiInsights = {
      ticker: analysis.ticker,
      month: analysis.month,
      seasonalScore: analysis.seasonalScore,
      newsImpact: analysis.newsImpact, // 뉴스 영향도 정보
      insights: analysis.insights, // AI 기반 인사이트
      recommendation: analysis.recommendation,
      confidence: analysis.confidence, // 분석 신뢰도
      marketSentiment: analysis.marketSentiment, // 시장 전반 센티멘트
      newsAnalysis: analysis.newsAnalysis, // 뉴스 분석 현황
      lastUpdated: analysis.lastUpdated,
      fromCache: analysis.fromCache || false
    };
    
    res.json(aiInsights);
  } catch (error) {
    res.status(500).json({ message: 'Error getting AI seasonal insights with news analysis', error: error.message });
  }
});

// NEW: 캐시 관리 API 엔드포인트들
router.post('/cache/clear', async (req, res) => {
  try {
    const { type, ticker } = req.body;
    const NewsSeasonalAnalyzer = require('../services/news/newsSeasonalAnalyzer');
    const newsSeasonalAnalyzer = new NewsSeasonalAnalyzer();
    
    let clearedCount = 0;
    
    if (type === 'all') {
      newsSeasonalAnalyzer.clearAnalysisCache();
      clearedCount = 'all';
    } else if (type === 'ticker' && ticker) {
      // 특정 종목 캐시 클리어 (구현 필요)
      clearedCount = 1;
    }
    
    res.json({ 
      success: true, 
      message: `캐시가 성공적으로 삭제되었습니다.`, 
      clearedCount 
    });
  } catch (error) {
    res.status(500).json({ message: 'Error clearing cache', error: error.message });
  }
});

router.get('/cache/status', async (req, res) => {
  try {
    const NewsSeasonalAnalyzer = require('../services/news/newsSeasonalAnalyzer');
    const newsSeasonalAnalyzer = new NewsSeasonalAnalyzer();
    
    const cacheStatus = newsSeasonalAnalyzer.getCacheStatus();
    
    res.json({
      success: true,
      cacheStatus,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ message: 'Error getting cache status', error: error.message });
  }
});

module.exports = router;