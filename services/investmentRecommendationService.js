// Investment Recommendation Service - 종합 투자 추천 시스템
const yahooFinanceService = require('./yahooFinanceService');
const huggingFaceService = require('./ai/huggingFaceService'); // Hugging Face DeepSeek 모델 사용
const seasonalAnalysisService = require('./seasonalAnalysisService'); // 강화된 시기적 분석

class InvestmentRecommendationService {
  constructor() {
    this.weights = {
      technical: 0.4,      // 기술적 분석 가중치
      seasonal: 0.3,       // 시기적 분석 가중치  
      sentiment: 0.2,      // AI 센티멘트 가중치
      fundamental: 0.1     // 기본적 분석 가중치
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
      const marketSentiment = await huggingFaceService.analyzeSentiment();
      
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

  // 종목별 월별 분석
  async analyzeStockForMonth(ticker, month) {
    try {
      console.log(`Analyzing ${ticker} for month ${month + 1}`);
      
      // 병렬로 각종 분석 수행
      const [technicalData, enhancedSeasonalData, quoteData] = await Promise.all([
        yahooFinanceService.getTechnicalAnalysis(ticker),
        seasonalAnalysisService.getEnhancedSeasonalAnalysis(ticker, month), // DeepSeek 강화 시기적 분석
        yahooFinanceService.getQuoteSummary(ticker)
      ]);

      // 각 분석별 스코어 계산
      const technicalScore = this.calculateTechnicalScore(technicalData);
      const seasonalScore = enhancedSeasonalData.seasonalScore || 0.5; // DeepSeek AI로 업그레이드된 시기적 점수 사용
      const fundamentalScore = this.calculateFundamentalScore(quoteData);
      
      // 가중평균으로 총점 계산
      const totalScore = (
        technicalScore * this.weights.technical +
        seasonalScore * this.weights.seasonal +
        fundamentalScore * this.weights.fundamental
      );

      const recommendation = this.generateStockRecommendation(totalScore, technicalData, enhancedSeasonalData);
      
      return {
        ticker,
        totalScore: Math.round(totalScore * 100) / 100,
        technicalScore,
        seasonalScore,
        fundamentalScore,
        recommendation,
        details: {
          technical: technicalData,
          seasonal: enhancedSeasonalData, // DeepSeek AI 강화 시기적 분석 결과
          quote: quoteData
        },
        reasons: this.generateReasons(technicalScore, seasonalScore, fundamentalScore, month),
        seasonalInsights: enhancedSeasonalData // 추가 AI 인사이트
      };
    } catch (error) {
      console.error(`Error analyzing ${ticker}:`, error);
      return null;
    }
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

  // 시기적 분석 스코어 (0-1)
  calculateSeasonalScore(seasonalData, currentMonth) {
    if (!seasonalData || seasonalData.error) return 0.5;
    
    // 과거 데이터에서 현재 월의 성과 추출
    const monthPerformance = this.extractMonthPerformance(seasonalData, currentMonth);
    
    if (monthPerformance === null) return 0.5;
    
    // 수익률을 0-1 스코어로 변환
    // -10% ~ +10% 범위를 0-1로 매핑
    const normalizedScore = (monthPerformance + 10) / 20;
    return Math.max(0, Math.min(1, normalizedScore));
  }

  // 월별 성과 추출
  extractMonthPerformance(seasonalData, month) {
    try {
      // bestMonth와 worstMonth에서 해당 월의 수익률 추출
      const monthNames = ["1월", "2월", "3월", "4월", "5월", "6월", 
                         "7월", "8월", "9월", "10월", "11월", "12월"];
      const targetMonth = monthNames[month];
      
      // bestMonth 형태: "3월 (5.23%)" 
      if (seasonalData.bestMonth && seasonalData.bestMonth.includes(targetMonth)) {
        const match = seasonalData.bestMonth.match(/\(([+-]?\d+\.?\d*)%\)/);
        return match ? parseFloat(match[1]) : 5; // 기본값 5%
      }
      
      if (seasonalData.worstMonth && seasonalData.worstMonth.includes(targetMonth)) {
        const match = seasonalData.worstMonth.match(/\(([+-]?\d+\.?\d*)%\)/);
        return match ? parseFloat(match[1]) : -5; // 기본값 -5%
      }
      
      return 0; // 중립
    } catch (error) {
      console.error('Error extracting month performance:', error);
      return 0;
    }
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
  generateStockRecommendation(totalScore, technicalData, seasonalData) {
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

  // 추천 이유 생성
  generateReasons(technicalScore, seasonalScore, fundamentalScore, month) {
    const reasons = [];
    const monthNames = ["1월", "2월", "3월", "4월", "5월", "6월", 
                       "7월", "8월", "9월", "10월", "11월", "12월"];
    
    if (technicalScore > 0.6) {
      reasons.push('기술적 지표 양호');
    } else if (technicalScore < 0.4) {
      reasons.push('기술적 지표 부정적');
    }
    
    if (seasonalScore > 0.6) {
      reasons.push(`${monthNames[month]} 계절적 강세`);
    } else if (seasonalScore < 0.4) {
      reasons.push(`${monthNames[month]} 계절적 약세`);
    }
    
    if (fundamentalScore > 0.6) {
      reasons.push('펀더멘털 건실');
    } else if (fundamentalScore < 0.4) {
      reasons.push('밸류에이션 부담');
    }
    
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
}

module.exports = new InvestmentRecommendationService();
