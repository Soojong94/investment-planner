const express = require('express');
const router = express.Router();
const yahooFinanceService = require('../services/yahooFinanceService');
// const huggingFaceService = require('../services/ai/huggingFaceService'); // 기존 서비스
const HuggingFaceDeepSeekService = require('../services/ai/simpleAIService'); // Hugging Face DeepSeek 서비스
const investmentRecommendationService = require('../services/investmentRecommendationService');

// AI 서비스 인스턴스 생성
const aiService = new HuggingFaceDeepSeekService();

// Route to get historical data for a specific ticker
// GET /api/historical/:ticker
router.get('/historical/:ticker', async (req, res) => {
  try {
    const ticker = req.params.ticker;
    const data = await yahooFinanceService.getHistoricalData(ticker);
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching historical data', error: error.message });
  }
});

// Route to get technical analysis for a specific ticker
// GET /api/analysis/:ticker
router.get('/analysis/:ticker', async (req, res) => {
  try {
    const ticker = req.params.ticker;
    const analysis = await yahooFinanceService.getTechnicalAnalysis(ticker);
    res.json(analysis);
  } catch (error) {
    res.status(500).json({ message: 'Error performing technical analysis', error: error.message });
  }
});

// Route to get seasonal analysis for a specific ticker
// GET /api/seasonal/:ticker
// Route to get seasonal analysis for a specific ticker
// GET /api/seasonal/:ticker
router.get('/seasonal/:ticker', async (req, res) => {
  try {
    const ticker = req.params.ticker;
    const analysis = await yahooFinanceService.getSeasonalAnalysis(ticker);
    res.json(analysis);
  } catch (error) {
    res.status(500).json({ message: 'Error performing seasonal analysis', error: error.message });
  }
});

// Hardcoded lists of AI and Semiconductor stocks
const aiStocks = [
  'NVDA', 'MSFT', 'GOOG', 'GOOGL', 'PLTR', 'AMD', 'AVGO', 'META', 'AAPL', 'TSLA',
  'CRWD', 'PANW', 'SNOW', 'SMCI', 'MRVL', 'AMZN', 'ADBE', 'NOW', 'ISRG', 'SNPS',
  'CDNS', 'WDAY', 'NXPI', 'ROK', 'BIDU', 'ALAB', 'SYM', 'TTD', 'TWLO', 'TEMP'
];

const semiconductorStocks = [
  'NVDA', 'TSM', 'AVGO', 'ASML', 'SSNLF', 'AMD', 'QCOM', 'AMAT', 'ARM', 'TXN',
  'INTC', 'MU', 'ADI', 'NXPI', 'MRVL', 'MPWR', 'ALAB', 'STM', 'ASX', 'GFS',
  'SWKS', 'MTSI', 'QRVO', 'RMBS', 'TSEM', 'CRUS', 'ALGM', 'PI', 'SMTC', 'SLAB'
];

// Route to get AI stocks
router.get('/stocks/ai', (req, res) => {
  res.json(aiStocks);
});

// Route to get Semiconductor stocks
router.get('/stocks/semiconductor', (req, res) => {
  res.json(semiconductorStocks);
});

// Route to get company information for a specific ticker
// GET /api/company-info/:ticker
router.get('/company-info/:ticker', async (req, res) => {
  try {
    const ticker = req.params.ticker;
    const companyInfo = await yahooFinanceService.getCompanyInfo(ticker);
    res.json({ description: companyInfo });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching company information', error: error.message });
  }
});

// Route to get quote summary for a specific ticker
// GET /api/quote/:ticker
router.get('/quote/:ticker', async (req, res) => {
  try {
    const ticker = req.params.ticker;
    const quote = await yahooFinanceService.getQuoteSummary(ticker);
    res.json(quote);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching quote summary', error: error.message });
  }
});

// Route to get investment score for a specific ticker
// GET /api/score/:ticker
router.get('/score/:ticker', async (req, res) => {
  try {
    const ticker = req.params.ticker;
    const score = await yahooFinanceService.calculateInvestmentScore(ticker);
    res.json(score);
  } catch (error) {
    res.status(500).json({ message: 'Error calculating investment score', error: error.message });
  }
});

// AI 관련 라우트 (개선된 안정적인 AI 서비스 사용)
// Route to get AI-based market sentiment
// GET /api/ai/sentiment
router.get('/ai/sentiment', async (req, res) => {
  try {
    const sentiment = await aiService.analyzeSentiment('MARKET', {});
    res.json(sentiment);
  } catch (error) {
    res.status(500).json({ message: 'Error analyzing market sentiment', error: error.message });
  }
});

// Route to get AI stock recommendations
// GET /api/ai/recommendations
router.get('/ai/recommendations', async (req, res) => {
  try {
    const tickers = req.query.tickers ? req.query.tickers.split(',') : ['AAPL', 'MSFT', 'NVDA'];
    const recommendations = await aiService.getStockRecommendations(tickers, {});
    res.json(recommendations);
  } catch (error) {
    res.status(500).json({ message: 'Error getting AI recommendations', error: error.message });
  }
});

// Route to check AI service status
// GET /api/ai/status
router.get('/ai/status', async (req, res) => {
  try {
    const status = await aiService.checkApiStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ message: 'Error checking AI service status', error: error.message });
  }
});

// ===== 새로운 종합 추천 시스템 라우트 =====

// Route to get monthly investment recommendations with enhanced scoring
// GET /api/recommendations/monthly
router.get('/recommendations/monthly', async (req, res) => {
  try {
    const category = req.query.category || 'all';
    
    // 종목 리스트 정의
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
    
    // 분석 결과 수집
    const analyses = [];
    for (let i = 0; i < Math.min(stocksToAnalyze.length, 10); i += 3) {
      const batch = stocksToAnalyze.slice(i, i + 3);
      const batchPromises = batch.map(async (ticker) => {
        try {
          const score = await yahooFinanceService.calculateInvestmentScore(ticker);
          return score;
        } catch (error) {
          console.error(`Error analyzing ${ticker}:`, error.message);
          return null;
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      analyses.push(...batchResults.filter(result => result && !result.error));
      
      // 배치 간 지연
      if (i + 3 < stocksToAnalyze.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // 점수순 정렬 및 상위 5개 선택
    const sortedRecommendations = analyses
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, 5);
    
    const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
    const currentMonth = monthNames[new Date().getMonth()];
    
    res.json({
      month: currentMonth,
      category,
      totalAnalyzed: analyses.length,
      recommendations: sortedRecommendations,
      generatedAt: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({ message: 'Error getting monthly recommendations', error: error.message });
  }
});

// Route to get sector-specific recommendations
// GET /api/recommendations/sector/:sector
router.get('/recommendations/sector/:sector', async (req, res) => {
  try {
    const sector = req.params.sector;
    const recommendations = await investmentRecommendationService.getSectorRecommendations(sector);
    res.json(recommendations);
  } catch (error) {
    res.status(500).json({ message: 'Error getting sector recommendations', error: error.message });
  }
});

// Route to get comprehensive stock score
// GET /api/score/:ticker
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

// Route to get enhanced AI recommendations with market data
// GET /api/ai/recommendations/enhanced
router.get('/ai/recommendations/enhanced', async (req, res) => {
  try {
    // 시장 데이터 수집 (간단한 예시)
    const marketData = {
      timestamp: new Date().toISOString(),
      // 실제로는 여기서 VIX, S&P 500 등의 데이터를 가져올 수 있음
    };
    
    const recommendations = await huggingFaceService.getStockRecommendations([], marketData);
    res.json(recommendations);
  } catch (error) {
    res.status(500).json({ message: 'Error getting enhanced AI recommendations', error: error.message });
  }
});

// 새로운 DeepSeek 강화 시기적 분석 라우트
// Route to get enhanced seasonal analysis for a specific ticker
// GET /api/seasonal/enhanced/:ticker
router.get('/seasonal/enhanced/:ticker', async (req, res) => {
  try {
    const ticker = req.params.ticker;
    const month = req.query.month ? parseInt(req.query.month) - 1 : null; // 1-12를 0-11로 변환
    const seasonalAnalysisService = require('../services/seasonalAnalysisService');
    
    const analysis = await seasonalAnalysisService.getEnhancedSeasonalAnalysis(ticker, month);
    res.json(analysis);
  } catch (error) {
    res.status(500).json({ message: 'Error performing enhanced seasonal analysis', error: error.message });
  }
});

// Route to get seasonal analysis for current month with AI insights
// GET /api/seasonal/ai/:ticker
router.get('/seasonal/ai/:ticker', async (req, res) => {
  try {
    const ticker = req.params.ticker;
    const currentMonth = new Date().getMonth();
    const seasonalAnalysisService = require('../services/seasonalAnalysisService');
    
    const analysis = await seasonalAnalysisService.getEnhancedSeasonalAnalysis(ticker, currentMonth);
    
    // AI 인사이트만 추출하여 반환
    const aiInsights = {
      ticker: analysis.ticker,
      month: analysis.month,
      seasonalScore: analysis.seasonalScore,
      aiInsights: analysis.aiInsights,
      recommendation: analysis.recommendation,
      riskAssessment: analysis.riskAssessment,
      optimalStrategy: analysis.optimalStrategy,
      timestamp: analysis.timestamp
    };
    
    res.json(aiInsights);
  } catch (error) {
    res.status(500).json({ message: 'Error getting AI seasonal insights', error: error.message });
  }
});

module.exports = router;
