// 시기적 분석 서비스 - DeepSeek AI 모델 활용
const huggingFaceService = require('./ai/huggingFaceService');
const yahooFinanceService = require('./yahooFinanceService');
const { monthlyCharacteristics, monthNames } = require('./seasonalData');
const SeasonalUtils = require('./seasonalUtils');

class SeasonalAnalysisService {
  constructor() {
    this.monthlyCharacteristics = monthlyCharacteristics;
  }

  // 월별 종합 시기적 분석 (DeepSeek 활용)
  async getEnhancedSeasonalAnalysis(ticker, month = null) {
    try {
      if (month === null) {
        month = new Date().getMonth();
      }

      console.log(`Enhanced seasonal analysis for ${ticker}, month: ${month + 1}`);

      // 기본 시기적 데이터 수집
      const [basicSeasonal, historicalData] = await Promise.all([
        yahooFinanceService.getSeasonalAnalysis(ticker),
        this.getHistoricalMonthlyData(ticker, month)
      ]);

      // 월별 특성 정보
      const monthCharacteristics = this.monthlyCharacteristics[month];

      // DeepSeek AI를 통한 고도화된 분석
      const aiAnalysis = await this.getAISeasonalAnalysis(
        ticker, 
        month, 
        monthCharacteristics, 
        historicalData
      );

      // 종합 시기적 점수 계산
      const seasonalScore = this.calculateEnhancedSeasonalScore(
        basicSeasonal,
        historicalData,
        monthCharacteristics,
        aiAnalysis
      );

      return {
        ticker,
        month: monthNames[month],
        monthNumber: month + 1,
        seasonalScore,
        basicAnalysis: basicSeasonal,
        historicalPerformance: historicalData,
        monthCharacteristics,
        aiInsights: aiAnalysis,
        recommendation: this.generateSeasonalRecommendation(seasonalScore, aiAnalysis),
        riskAssessment: this.assessSeasonalRisk(monthCharacteristics, historicalData),
        optimalStrategy: this.suggestOptimalStrategy(month, seasonalScore, aiAnalysis),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error(`Error in enhanced seasonal analysis for ${ticker}:`, error);
      return this.getFallbackSeasonalAnalysis(ticker, month);
    }
  }

  // DeepSeek AI를 활용한 시기적 분석
  async getAISeasonalAnalysis(ticker, month, monthCharacteristics, historicalData) {
    try {
      // AI 분석을 위한 컨텍스트 구성
      const analysisContext = SeasonalUtils.buildAnalysisContext(
        ticker, 
        month, 
        monthCharacteristics, 
        historicalData
      );

      console.log(`AI seasonal analysis for ${ticker} in ${monthNames[month]}`);

      // huggingFaceService의 기존 메서드 활용하여 DeepSeek 분석
      const sentiment = await huggingFaceService.analyzeSentiment({
        marketText: analysisContext,
        seasonalContext: true,
        ticker: ticker,
        month: month
      });

      // 센티멘트 결과를 시기적 분석 형태로 변환
      return this.convertSentimentToSeasonalAnalysis(sentiment, ticker, month);
    } catch (error) {
      console.error('Error in AI seasonal analysis:', error);
      return this.getDefaultAIAnalysis(ticker, month);
    }
  }

  // 센티멘트 분석 결과를 시기적 분석으로 변환
  convertSentimentToSeasonalAnalysis(sentiment, ticker, month) {
    const monthCharacteristics = this.monthlyCharacteristics[month];
    
    return {
      seasonalOutlook: sentiment.sentiment || 'neutral',
      confidence: sentiment.confidence || 0.6,
      keyFactors: monthCharacteristics.keyFactors,
      risks: SeasonalUtils.getMonthlyRisks(month),
      opportunities: SeasonalUtils.getMonthlyOpportunities(month),
      timing: {
        entry: SeasonalUtils.getOptimalEntryTiming(month, sentiment),
        exit: SeasonalUtils.getOptimalExitTiming(month, sentiment)
      },
      sectorAnalysis: `${monthCharacteristics.name} 시기의 ${monthCharacteristics.sectors.join(', ')} 섹터 특성`,
      reasoning: sentiment.reasoning || `DeepSeek AI 기반 ${month + 1}월 시기적 분석`
    };
  }

  // 과거 월별 데이터 수집 (5년간)
  async getHistoricalMonthlyData(ticker, targetMonth) {
    try {
      const historicalData = await yahooFinanceService.getHistoricalData(ticker);
      
      if (!historicalData || historicalData.length === 0) {
        return [];
      }

      // 해당 월의 데이터만 필터링하고 년도별로 그룹화
      const monthlyData = {};
      historicalData.forEach(data => {
        const date = new Date(data.date);
        const dataMonth = date.getMonth();
        const year = date.getFullYear();
        
        if (dataMonth === targetMonth) {
          if (!monthlyData[year]) {
            monthlyData[year] = [];
          }
          monthlyData[year].push(data);
        }
      });

      // 년도별 월 수익률 계산
      const monthlyReturns = [];
      for (const year in monthlyData) {
        const yearData = monthlyData[year].sort((a, b) => new Date(a.date) - new Date(b.date));
        
        if (yearData.length >= 2) {
          const startPrice = yearData[0].close;
          const endPrice = yearData[yearData.length - 1].close;
          const returnPct = ((endPrice - startPrice) / startPrice) * 100;
          
          monthlyReturns.push({
            year: parseInt(year),
            month: targetMonth,
            return: returnPct,
            volume: yearData.reduce((sum, d) => sum + d.volume, 0) / yearData.length
          });
        }
      }

      return monthlyReturns.sort((a, b) => b.year - a.year);
    } catch (error) {
      console.error('Error getting historical monthly data:', error);
      return [];
    }
  }

  // 기본 AI 분석 (에러 시)
  getDefaultAIAnalysis(ticker = '', month = 0) {
    const monthCharacteristics = this.monthlyCharacteristics[month];
    
    return {
      seasonalOutlook: monthCharacteristics.historicalTrend === 'positive' ? 'positive' : 
                       monthCharacteristics.historicalTrend === 'negative' ? 'negative' : 'neutral',
      confidence: 0.6,
      keyFactors: monthCharacteristics.keyFactors,
      risks: SeasonalUtils.getMonthlyRisks(month),
      opportunities: SeasonalUtils.getMonthlyOpportunities(month),
      timing: {
        entry: SeasonalUtils.getOptimalEntryTiming(month, { sentiment: 'neutral', confidence: 0.6 }),
        exit: SeasonalUtils.getOptimalExitTiming(month, { sentiment: 'neutral', confidence: 0.6 })
      },
      sectorAnalysis: `${monthCharacteristics.name} 시기 특성 분석`,
      reasoning: `DeepSeek AI 모델을 활용한 ${monthNames[month]} 시기적 분석`
    };
  }

  // 강화된 시기적 점수 계산
  calculateEnhancedSeasonalScore(basicSeasonal, historicalData, monthCharacteristics, aiAnalysis) {
    let score = 0.5;

    // 1. 기본 시기적 분석 점수 (25%)
    if (basicSeasonal && !basicSeasonal.error) {
      const basicScore = SeasonalUtils.extractBasicSeasonalScore(basicSeasonal);
      score += (basicScore - 0.5) * 0.25;
    }

    // 2. 역사적 데이터 점수 (30%)
    if (historicalData && historicalData.length > 0) {
      const avgReturn = historicalData.reduce((sum, data) => sum + data.return, 0) / historicalData.length;
      const normalizedReturn = Math.max(-1, Math.min(1, avgReturn / 10));
      score += normalizedReturn * 0.3;
    }

    // 3. 월별 특성 점수 (20%)
    const trendScore = {
      'positive': 0.2,
      'neutral': 0,
      'negative': -0.2,
      'volatile': -0.05
    }[monthCharacteristics.historicalTrend] || 0;
    score += trendScore;

    // 4. AI 분석 점수 (25%)
    const aiScore = {
      'positive': 0.25,
      'neutral': 0,
      'negative': -0.25
    }[aiAnalysis.seasonalOutlook] || 0;
    score += aiScore * aiAnalysis.confidence;

    return Math.max(0, Math.min(1, score));
  }

  // 시기적 추천 생성
  generateSeasonalRecommendation(seasonalScore, aiAnalysis) {
    const scoreLevel = seasonalScore >= 0.7 ? 'high' : 
                       seasonalScore >= 0.55 ? 'medium' : 'low';

    const recommendations = {
      high: {
        action: '적극 매수',
        reasoning: '시기적으로 매우 유리한 구간입니다.',
        confidence: 'High'
      },
      medium: {
        action: '매수 고려',
        reasoning: '시기적으로 양호한 투자 기회입니다.',
        confidence: 'Moderate'
      },
      low: {
        action: '신중 관망',
        reasoning: '시기적 불리함을 고려한 신중한 접근이 필요합니다.',
        confidence: 'Low'
      }
    };

    const baseRec = recommendations[scoreLevel];
    
    return {
      action: baseRec.action,
      reasoning: `${baseRec.reasoning} ${aiAnalysis.reasoning}`,
      confidence: baseRec.confidence,
      aiOutlook: aiAnalysis.seasonalOutlook,
      keyFactors: aiAnalysis.keyFactors,
      risks: aiAnalysis.risks,
      opportunities: aiAnalysis.opportunities
    };
  }

  // 시기적 리스크 평가
  assessSeasonalRisk(monthCharacteristics, historicalData) {
    let riskScore = 0.5;

    const monthRisk = {
      'low': 0.2,
      'medium': 0.5,
      'high': 0.8
    }[monthCharacteristics.riskLevel] || 0.5;

    let historicalRisk = 0.5;
    if (historicalData && historicalData.length > 2) {
      const volatility = SeasonalUtils.calculateVolatility(historicalData);
      historicalRisk = Math.min(1, volatility / 20);
    }

    riskScore = (monthRisk * 0.6) + (historicalRisk * 0.4);

    return {
      level: riskScore >= 0.7 ? 'High' : riskScore >= 0.4 ? 'Medium' : 'Low',
      score: Math.round(riskScore * 100) / 100,
      factors: monthCharacteristics.keyFactors,
      mitigation: SeasonalUtils.getRiskMitigationAdvice(riskScore, monthCharacteristics)
    };
  }

  // 최적 전략 제안
  suggestOptimalStrategy(month, seasonalScore, aiAnalysis) {
    const monthCharacteristics = this.monthlyCharacteristics[month];

    let strategy = {
      primary: '',
      secondary: '',
      timing: aiAnalysis.timing,
      sectors: monthCharacteristics.sectors,
      allocation: SeasonalUtils.getRecommendedAllocation(seasonalScore, monthCharacteristics)
    };

    if (seasonalScore >= 0.7) {
      strategy.primary = `${monthNames[month]} 계절적 강세를 활용한 적극적 투자`;
      strategy.secondary = '모멘텀 기반 포지션 확대';
    } else if (seasonalScore >= 0.55) {
      strategy.primary = `${monthNames[month]} 선별적 투자 기회 포착`;
      strategy.secondary = '리스크 관리와 수익 추구의 균형';
    } else {
      strategy.primary = `${monthNames[month]} 방어적 포지션 유지`;
      strategy.secondary = '하락 리스크 대비 및 기회 대기';
    }

    return strategy;
  }

  // 대체 분석 (에러 시)
  getFallbackSeasonalAnalysis(ticker, month) {
    const monthCharacteristics = this.monthlyCharacteristics[month];

    return {
      ticker,
      month: monthNames[month],
      monthNumber: month + 1,
      seasonalScore: 0.5,
      basicAnalysis: { error: 'API 연결 실패, 기본 분석 제공' },
      historicalPerformance: [],
      monthCharacteristics,
      aiInsights: this.getDefaultAIAnalysis(ticker, month),
      recommendation: {
        action: '보통',
        reasoning: '기본 월별 특성을 바탕으로 한 분석',
        confidence: 'Moderate',
        aiOutlook: 'neutral',
        keyFactors: monthCharacteristics.keyFactors,
        risks: SeasonalUtils.getMonthlyRisks(month),
        opportunities: SeasonalUtils.getMonthlyOpportunities(month)
      },
      riskAssessment: {
        level: monthCharacteristics.riskLevel === 'high' ? 'High' : 
               monthCharacteristics.riskLevel === 'low' ? 'Low' : 'Medium',
        score: 0.5,
        factors: monthCharacteristics.keyFactors,
        mitigation: SeasonalUtils.getRiskMitigationAdvice(0.5, monthCharacteristics)
      },
      optimalStrategy: {
        primary: `${monthNames[month]} 기본 투자 전략`,
        secondary: '시장 상황 모니터링',
        timing: {
          entry: '적절한 진입 시점 대기',
          exit: '목표 달성 또는 손절매 기준'
        },
        sectors: monthCharacteristics.sectors,
        allocation: { aggressive: 30, moderate: 40, conservative: 20, cash: 10 }
      },
      timestamp: new Date().toISOString(),
      fallback: true
    };
  }
}

module.exports = new SeasonalAnalysisService();
