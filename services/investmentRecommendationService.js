// Investment Recommendation Service - 종합 투자 추천 시스템
const yahooFinanceService = require('./yahooFinanceService');
const SimpleAIService = require('./ai/simpleAIService'); // AI 서비스 직접 사용
const seasonalAnalysisService = require('./seasonalAnalysisService'); // 기존 시기적 분석
const NewsSeasonalAnalyzer = require('./news/newsSeasonalAnalyzer'); // NEW: 뉴스 기반 시기적 분석

const aiService = new SimpleAIService(); // AI 서비스 인스턴스화
const newsSeasonalAnalyzer = new NewsSeasonalAnalyzer(); // NEW: 뉴스 기반 분석기

class InvestmentRecommendationService {
  constructor() {
    // 가중치 재조정 (총합 1.0)
    this.weights = {
      technical: 0.35,     // 기술적 분석
      seasonal: 0.25,      // AI 강화 시기적 분석
      sentiment: 0.2,      // AI 종목 센티멘트
      fundamental: 0.2     // 기본적 분석
    };
  }

  // 이번달 추천 종목 생성
  async getMonthlyRecommendations(stockList = []) {
    try {
      const currentMonth = new Date().getMonth(); // 0-11
      const monthNames = ["1월", "2월", "3월", "4월", "5월", "6월", 
                         "7월", "8월", "9월", "10월", "11월", "12월"];
      
      console.log(`Generating monthly recommendations for ${monthNames[currentMonth]}`);
      
      // 기본 종목 리스트 설정
      if (stockList.length === 0) {
        stockList = await this.getDefaultStockList();
      }

      // 각 종목에 대한 종합 분석
      const stockAnalyses = await Promise.all(
        stockList.map(ticker => this.analyzeStockForMonth(ticker, currentMonth))
      );

      // 유효한 분석 결과만 필터링
      const validAnalyses = stockAnalyses.filter(analysis => analysis && analysis.totalScore > 0);
      
      // 스코어 기준 정렬
      const sortedStocks = validAnalyses.sort((a, b) => b.totalScore - a.totalScore);
      
      // 상위 10개 선택
      const topRecommendations = sortedStocks.slice(0, 10);
      
      // AI 센티멘트 분석
      const marketSentiment = await aiService.analyzeSentiment('MARKET');
      
      return {
        month: monthNames[currentMonth],
        monthNumber: currentMonth + 1,
        recommendations: topRecommendations,
        marketSentiment: marketSentiment,
        summary: this.generateMonthlySummary(currentMonth, topRecommendations, marketSentiment),
        riskLevel: this.calculateOverallRisk(topRecommendations, marketSentiment),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error generating monthly recommendations:', error);
      return this.getMockMonthlyRecommendations();
    }
  }

  // 종목별 월별 분석 (뉴스 기반 시기별 분석 통합 버전)
  async analyzeStockForMonth(ticker, month) {
    try {
      console.log(`🔍 Analyzing ${ticker} for month ${month + 1} with NEWS-ENHANCED logic...`);
      
      // 병렬로 모든 분석 데이터 수집 (뉴스 기반 시기별 분석 포함)
      const [technicalData, newsSeasonalData, quoteData, sentimentData] = await Promise.all([
        yahooFinanceService.getTechnicalAnalysis(ticker),
        newsSeasonalAnalyzer.analyzeNewsSeasonalScore(ticker, month), // NEW: 뉴스 기반 시기별 분석
        yahooFinanceService.getQuoteSummary(ticker),
        aiService.analyzeSentiment(ticker) // 개별 종목 센티멘트 분석
      ]);

      console.log(`📊 ${ticker} seasonal analysis:`, {
        newsSeasonalScore: newsSeasonalData.seasonalScore,
        confidence: newsSeasonalData.confidence,
        newsImpact: newsSeasonalData.newsImpact?.sentiment
      });

      // 각 분석별 스코어 계산 (통일된 시기적 점수 사용)
      const technicalScore = this.calculateTechnicalScore(technicalData);
      const seasonalScore = newsSeasonalData.seasonalScore || 0.65; // 통일된 시기적 점수 사용
      const fundamentalScore = this.calculateFundamentalScore(quoteData);
      const sentimentScore = this.calculateSentimentScore(sentimentData); // 센티멘트 점수 계산

      // 새로운 가중치로 총점 계산
      const totalScore = (
        technicalScore * this.weights.technical +
        seasonalScore * this.weights.seasonal +
        fundamentalScore * this.weights.fundamental +
        sentimentScore * this.weights.sentiment // 센티멘트 점수 반영
      );

      const recommendation = this.generateStockRecommendation(totalScore);
      
      return {
        ticker,
        totalScore: Math.round(totalScore * 100) / 100,
        technicalScore,
        seasonalScore, // 통일된 시기적 점수
        fundamentalScore,
        sentimentScore,
        recommendation,
        details: {
          technical: technicalData,
          newsSeasonalAnalysis: newsSeasonalData, // NEW: 통일된 시기적 분석 결과
          quote: quoteData,
          sentiment: sentimentData
        },
        reasons: this.generateEnhancedReasons(technicalScore, seasonalScore, fundamentalScore, sentimentScore, newsSeasonalData, month),
        seasonalInsights: newsSeasonalData.insights || [], // 간단한 시기적 인사이트 사용
        newsImpact: newsSeasonalData.newsImpact, // 뉴스 영향도 정보 (정보용)
        confidence: newsSeasonalData.confidence || 0.8, // 분석 신뢰도
        // AI 모델 정보 추가
        model: aiService.currentModel || newsSeasonalData.model || 'Hybrid Analysis',
        aiProvider: newsSeasonalData.aiProvider || 'Multi-Source Analysis',
        analysisComponents: {
          technical: 'Yahoo Finance',
          seasonal: newsSeasonalData.aiProvider || 'Historical Pattern',
          fundamental: 'Yahoo Finance',
          sentiment: 'Hugging Face'
        }
      };
    } catch (error) {
      console.error(`Error analyzing ${ticker}:`, error);
      return null;
    }
  }

  // AI 센티멘트 점수 계산 함수 (0-1)
  calculateSentimentScore(sentimentData) {
    if (!sentimentData || sentimentData.error) return 0.5;

    let score = 0.5; // 중립
    if (sentimentData.sentiment === 'positive') {
      score = 0.7 + (sentimentData.confidence * 0.3); // 0.7 ~ 1.0
    } else if (sentimentData.sentiment === 'negative') {
      score = 0.3 - (sentimentData.confidence * 0.3); // 0.0 ~ 0.3
    }
    return Math.max(0, Math.min(1, score));
  }

  // 기술적 분석 스코어 (0-1)
  calculateTechnicalScore(technicalData) {
    if (!technicalData || technicalData.error) return 0;
    
    let score = 0.5; // 기본값
    
    // 매매 신호
    if (technicalData.signal === 'Buy') {
      score += 0.3;
    } else if (technicalData.signal === 'Sell') {
      score -= 0.3;
    }
    
    // 신뢰도
    if (technicalData.confidence === 'High') {
      score += 0.2;
    } else if (technicalData.confidence === 'Low') {
      score -= 0.1;
    }
    
    // 추세 강도
    if (technicalData.trendStrength === 'Strong') {
      score += 0.15;
    } else if (technicalData.trendStrength === 'Weak') {
      score -= 0.1;
    }
    
    // RSI 과매도/과매수 체크
    if (technicalData.rsi) {
      const rsi = parseFloat(technicalData.rsi);
      if (rsi < 30) {
        score += 0.1; // 과매도 - 매수 기회
      } else if (rsi > 70) {
        score -= 0.1; // 과매수 - 주의
      }
    }
    
    return Math.max(0, Math.min(1, score));
  }

  // 기본적 분석 스코어 (0-1)
  calculateFundamentalScore(quoteData) {
    if (!quoteData || quoteData.error) return 0.5;
    
    let score = 0.5;
    
    // P/E 비율 평가
    if (quoteData.peRatio && quoteData.peRatio !== 'N/A') {
      const pe = parseFloat(quoteData.peRatio);
      if (pe > 0 && pe < 15) {
        score += 0.1; // 저평가
      } else if (pe > 30) {
        score -= 0.1; // 고평가
      }
    }
    
    // 배당 수익률
    if (quoteData.dividendYield && quoteData.dividendYield !== 'N/A') {
      const dividend = parseFloat(quoteData.dividendYield);
      if (dividend > 2) {
        score += 0.05; // 좋은 배당
      }
    }
    
    // 52주 대비 현재 위치
    if (quoteData.currentPrice && quoteData.fiftyTwoWeekHigh && quoteData.fiftyTwoWeekLow) {
      const current = parseFloat(quoteData.currentPrice);
      const high = parseFloat(quoteData.fiftyTwoWeekHigh);
      const low = parseFloat(quoteData.fiftyTwoWeekLow);
      
      const position = (current - low) / (high - low);
      if (position < 0.3) {
        score += 0.1; // 52주 저점 근처
      } else if (position > 0.9) {
        score -= 0.05; // 52주 고점 근처
      }
    }
    
    return Math.max(0, Math.min(1, score));
  }

  // 종목 추천 생성
  generateStockRecommendation(totalScore) {
    if (totalScore >= 0.7) {
      return '강력 추천';
    } else if (totalScore >= 0.6) {
      return '추천';
    } else if (totalScore >= 0.4) {
      return '보통';
    } else {
      return '비추천';
    }
  }

  // 추천 이유 생성 (센티멘트 추가)
  generateReasons(technicalScore, seasonalScore, fundamentalScore, sentimentScore, month) {
    const reasons = [];
    const monthNames = ["1월", "2월", "3월", "4월", "5월", "6월", 
                       "7월", "8월", "9월", "10월", "11월", "12월"];
    
    if (technicalScore > 0.65) reasons.push('기술적 지표 양호');
    if (seasonalScore > 0.65) reasons.push(`${monthNames[month]} 계절적 강세`);
    if (fundamentalScore > 0.65) reasons.push('펀더멘털 건실');
    if (sentimentScore > 0.65) reasons.push('AI 센티멘트 긍정적');

    if (technicalScore < 0.4) reasons.push('기술적 지표 부정적');
    if (seasonalScore < 0.4) reasons.push(`${monthNames[month]} 계절적 약세`);
    if (fundamentalScore < 0.4) reasons.push('밸류에이션 부담');
    if (sentimentScore < 0.4) reasons.push('AI 센티멘트 부정적');
    
    return reasons.length > 0 ? reasons : ['종합적 분석 결과'];
  }

  // 월별 요약 생성
  generateMonthlySummary(month, recommendations, sentiment) {
    const monthNames = ["1월", "2월", "3월", "4월", "5월", "6월", 
                       "7월", "8월", "9월", "10월", "11월", "12월"];
    
    const topStock = recommendations[0];
    const avgScore = recommendations.reduce((sum, stock) => sum + stock.totalScore, 0) / recommendations.length;
    
    return {
      overview: `${monthNames[month]} 투자 전망: ${sentiment.sentiment === 'positive' ? '긍정적' : 
                 sentiment.sentiment === 'negative' ? '부정적' : '중립적'}`,
      topPick: topStock ? `최고 추천: ${topStock.ticker} (점수: ${topStock.totalScore})` : '추천 종목 없음',
      averageScore: Math.round(avgScore * 100) / 100,
      marketCondition: sentiment.recommendation,
      strategy: this.getMonthlyStrategy(month, sentiment)
    };
  }

  // 월별 투자 전략
  getMonthlyStrategy(month, sentiment) {
    const strategies = {
      0: "신년 효과로 소형주 강세 예상. 성장주 비중 확대 검토",      // 1월
      1: "실적 발표 시즌. 서프라이즈 가능성 높은 종목 주목",        // 2월  
      2: "분기말 효과. 기관 리밸런싱으로 변동성 증가 예상",         // 3월
      3: "4월 효과 시작. 역사적으로 주식 시장 강세 구간",          // 4월
      4: "Sell in May 격언 주의. 방어적 포지션 고려",             // 5월
      5: "여름철 비수기 진입. 저평가 가치주 발굴 기회",            // 6월
      6: "실적 시즌 임박. 2분기 실적 기대치 점검 필요",           // 7월
      7: "여름 휴가철. 거래량 감소로 변동성 확대 가능",            // 8월
      8: "가을 시즌 시작. 연말까지 상승 랠리 기대감",             // 9월
      9: "3분기 실적 시즌. 연말 전망 중요한 시점",               // 10월
      10: "연말 정산 효과. 세금 매도 압력과 연말 랠리 경합",       // 11월
      11: "산타 랠리 시즌. 소형주와 성장주 선호도 증가"           // 12월
    };
    
    let strategy = strategies[month] || "시장 상황을 면밀히 모니터링하세요.";
    
    // 센티멘트에 따른 전략 조정
    if (sentiment.sentiment === 'negative') {
      strategy += " 현재 부정적인 시장 분위기를 고려하여 보수적 접근이 필요합니다.";
    } else if (sentiment.sentiment === 'positive') {
      strategy += " 긍정적인 시장 분위기를 활용한 적극적 투자를 고려해보세요.";
    }
    
    return strategy;
  }

  // 전체 리스크 레벨 계산
  calculateOverallRisk(recommendations, sentiment) {
    if (!recommendations || recommendations.length === 0) return 'high';
    
    const avgScore = recommendations.reduce((sum, stock) => sum + stock.totalScore, 0) / recommendations.length;
    const sentimentRisk = sentiment.confidence > 0.7 ? 0 : (sentiment.confidence < 0.5 ? 0.3 : 0.1);
    
    const riskScore = (1 - avgScore) + sentimentRisk;
    
    if (riskScore < 0.3) return 'low';
    if (riskScore < 0.6) return 'medium';
    return 'high';
  }

  // 기본 종목 리스트
  async getDefaultStockList() {
    // AI + 반도체 종목 통합
    return [
      // AI 주요 종목
      'NVDA', 'MSFT', 'GOOG', 'GOOGL', 'META', 'AMD', 'AVGO', 'AAPL', 'TSLA', 'PLTR',
      'CRWD', 'PANW', 'SNOW', 'SMCI', 'MRVL', 'AMZN', 'ADBE', 'NOW', 'ISRG', 'SNPS',
      // 반도체 주요 종목  
      'TSM', 'ASML', 'QCOM', 'AMAT', 'ARM', 'TXN', 'INTC', 'MU', 'ADI', 'NXPI'
    ];
  }

  // Mock 데이터 (에러 시 대체)
  getMockMonthlyRecommendations() {
    const currentMonth = new Date().getMonth();
    const monthNames = ["1월", "2월", "3월", "4월", "5월", "6월", 
                       "7월", "8월", "9월", "10월", "11월", "12월"];
    
    return {
      month: monthNames[currentMonth],
      monthNumber: currentMonth + 1,
      recommendations: [
        {
          ticker: 'NVDA',
          totalScore: 0.85,
          technicalScore: 0.9,
          seasonalScore: 0.8,
          fundamentalScore: 0.7,
          recommendation: '강력 추천',
          reasons: ['기술적 지표 양호', '시장 선도주', 'AI 성장 동력']
        },
        {
          ticker: 'MSFT',
          totalScore: 0.78,
          technicalScore: 0.8,
          seasonalScore: 0.75,
          fundamentalScore: 0.8,
          recommendation: '추천',
          reasons: ['안정적 성장', '클라우드 확장', '배당 매력']
        }
      ],
      marketSentiment: {
        sentiment: 'neutral',
        confidence: 0.65,
        recommendation: 'Mock 분석 - API 키 설정 후 정확한 분석 가능'
      },
      summary: {
        overview: `${monthNames[currentMonth]} 투자 전망: 중립적`,
        topPick: 'Mock 데이터',
        averageScore: 0.75,
        marketCondition: 'API 설정 필요',
        strategy: 'Mock 전략 - 실제 API 연동 후 정확한 전략 제공'
      },
      riskLevel: 'medium',
      timestamp: new Date().toISOString(),
      mock: true
    };
  }

  // 섹터별 추천 (추가 기능)
  async getSectorRecommendations(sector = 'all') {
    try {
      const sectorStocks = {
        ai: ['NVDA', 'MSFT', 'GOOG', 'META', 'AMD', 'PLTR', 'CRWD', 'PANW', 'SNOW', 'ADBE'],
        semiconductor: ['TSM', 'AVGO', 'ASML', 'QCOM', 'AMAT', 'ARM', 'TXN', 'INTC', 'MU', 'ADI'],
        all: await this.getDefaultStockList()
      };
      
      const stockList = sectorStocks[sector] || sectorStocks.all;
      const currentMonth = new Date().getMonth();
      
      const sectorAnalysis = await Promise.all(
        stockList.map(ticker => this.analyzeStockForMonth(ticker, currentMonth))
      );
      
      const validAnalysis = sectorAnalysis.filter(analysis => analysis && analysis.totalScore > 0);
      const sortedStocks = validAnalysis.sort((a, b) => b.totalScore - a.totalScore);
      
      return {
        sector,
        recommendations: sortedStocks.slice(0, 5),
        sectorScore: sortedStocks.reduce((sum, stock) => sum + stock.totalScore, 0) / sortedStocks.length,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting sector recommendations:', error);
      return { sector, recommendations: [], error: error.message };
    }
  }

  // 향상된 추천 이유 생성 (뉴스 기반 시기적 분석 포함)
  generateEnhancedReasons(technicalScore, seasonalScore, fundamentalScore, sentimentScore, newsSeasonalData, month) {
    const reasons = [];
    const monthNames = ["1월", "2월", "3월", "4월", "5월", "6월", 
                       "7월", "8월", "9월", "10월", "11월", "12월"];
    
    // 기술적 분석
    if (technicalScore > 0.65) reasons.push('기술적 지표 양호');
    else if (technicalScore < 0.4) reasons.push('기술적 지표 부정적');
    
    // 뉴스 강화 시기적 분석
    if (seasonalScore > 0.65) {
      const newsImpact = newsSeasonalData.newsImpact;
      if (newsImpact && newsImpact.sentiment === 'positive') {
        reasons.push(`${monthNames[month]} 계절적 강세 + 긍정적 뉴스`);
      } else {
        reasons.push(`${monthNames[month]} 계절적 강세`);
      }
    } else if (seasonalScore < 0.4) {
      const newsImpact = newsSeasonalData.newsImpact;
      if (newsImpact && newsImpact.sentiment === 'negative') {
        reasons.push(`${monthNames[month]} 계절적 약세 + 부정적 뉴스`);
      } else {
        reasons.push(`${monthNames[month]} 계절적 약세`);
      }
    }
    
    // 펀더멘틈 분석
    if (fundamentalScore > 0.65) reasons.push('펀더멘틈 건실');
    else if (fundamentalScore < 0.4) reasons.push('밸류에이션 부담');
    
    // 센티멘트 분석
    if (sentimentScore > 0.65) reasons.push('AI 센티멘트 긍정적');
    else if (sentimentScore < 0.4) reasons.push('AI 센티멘트 부정적');
    
    // 뉴스 영향도를 통한 추가 인사이트
    if (newsSeasonalData.newsImpact) {
      const { keyFactors, confidence } = newsSeasonalData.newsImpact;
      if (confidence > 0.7 && keyFactors && keyFactors.length > 0) {
        const mainFactor = keyFactors[0].substring(0, 20); // 첫 번째 요인의 짧은 버전
        reasons.push(`핵심 요인: ${mainFactor}`);
      }
    }
    
    return reasons.length > 0 ? reasons : ['종합적 뉴스 기반 분석'];
  }
}

module.exports = new InvestmentRecommendationService();