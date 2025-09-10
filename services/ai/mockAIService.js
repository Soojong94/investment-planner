// Mock AI 서비스 - 테스트 및 fallback용
const AIServiceBase = require('./core/aiServiceBase');

class MockAIService extends AIServiceBase {
  constructor() {
    super('MockAI');
    this.isConnected = true; // Mock 서비스는 항상 연결됨
    
    // Mock 데이터 템플릿
    this.sentimentTemplates = {
      positive: {
        sentiments: ['positive'],
        confidences: [0.75, 0.8, 0.85],
        recommendations: [
          '긍정적인 시장 분위기에서 기술주 투자를 검토하세요.',
          '시장 상승 모멘텀을 활용한 성장주 포지션을 고려하세요.',
          '낙관적 센티멘트로 공격적 포트폴리오를 검토해보세요.'
        ],
        reasonings: [
          '기술주 강세와 실적 개선 기대감',
          'AI 및 반도체 섹터 성장 지속',
          '연말 상승 랠리 기대감 확산'
        ]
      },
      neutral: {
        sentiments: ['neutral'],
        confidences: [0.6, 0.65, 0.7],
        recommendations: [
          '중립적 시장에서 분산투자로 리스크를 관리하세요.',
          '관망세가 필요한 시점입니다. 현금 비중을 유지하세요.',
          '안정적인 배당주와 방어적 섹터를 고려하세요.'
        ],
        reasonings: [
          '경제 지표 혼재와 정책 불확실성',
          '실적 시즌 결과 엇갈림',
          '지정학적 리스크와 인플레이션 우려'
        ]
      },
      negative: {
        sentiments: ['negative'],
        confidences: [0.7, 0.75, 0.8],
        recommendations: [
          '부정적 센티멘트에서 방어적 포지션을 취하세요.',
          '현금 비중을 늘리고 변동성이 낮은 자산을 고려하세요.',
          '하락 리스크 대비로 보수적인 투자 전략이 필요합니다.'
        ],
        reasonings: [
          '금리 상승 우려와 성장 둔화',
          '기업 실적 부진과 밸류에이션 부담',
          '거시경제 불안과 시장 조정 압력'
        ]
      }
    };

    this.stockData = {
      'NVDA': { baseScore: 85, volatility: 5, sector: 'ai' },
      'MSFT': { baseScore: 82, volatility: 3, sector: 'tech' },
      'AAPL': { baseScore: 80, volatility: 4, sector: 'tech' },
      'GOOG': { baseScore: 78, volatility: 4, sector: 'tech' },
      'META': { baseScore: 75, volatility: 6, sector: 'social' },
      'AMD': { baseScore: 72, volatility: 7, sector: 'semiconductor' },
      'TSM': { baseScore: 70, volatility: 5, sector: 'semiconductor' },
      'AVGO': { baseScore: 68, volatility: 4, sector: 'semiconductor' },
      'QCOM': { baseScore: 65, volatility: 5, sector: 'semiconductor' },
      'AMZN': { baseScore: 63, volatility: 6, sector: 'cloud' }
    };
  }

  // 상태 확인 (항상 성공)
  async checkStatus() {
    this.incrementRequestCount();
    this.successCount++;
    
    return this.getSuccessResponse({
      connected: true,
      message: 'Mock AI service is always available',
      features: ['sentiment_analysis', 'stock_recommendations'],
      note: 'This is a mock service for testing. Configure real API keys for production use.'
    }, 'checkStatus');
  }

  // Mock 센티멘트 분석
  async analyzeSentiment(marketData = {}) {
    this.incrementRequestCount();
    
    // 시뮬레이션 지연
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
    
    // 현재 시간 기반으로 패턴 생성 (일관성 있는 랜덤)
    const hour = new Date().getHours();
    const sentimentType = this.determineSentimentType(hour, marketData);
    const template = this.sentimentTemplates[sentimentType];
    
    const randomIndex = Math.floor(Math.random() * template.confidences.length);
    
    const result = {
      sentiment: sentimentType,
      confidence: template.confidences[randomIndex] + (Math.random() - 0.5) * 0.1,
      recommendation: template.recommendations[randomIndex],
      reasoning: template.reasonings[randomIndex],
      marketText: this.generateMarketText(marketData),
      model: 'mock-ai-v1.0',
      timestamp: new Date().toISOString(),
      mock: true
    };
    
    this.successCount++;
    return result;
  }

  // Mock 주식 추천
  async getStockRecommendations(stockData = [], marketData = {}) {
    this.incrementRequestCount();
    
    // 시뮬레이션 지연
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200));
    
    const sentiment = await this.analyzeSentiment(marketData);
    const targetStocks = stockData.length > 0 ? stockData.slice(0, 10) : Object.keys(this.stockData);
    
    const recommendations = targetStocks.map(ticker => {
      const stockInfo = this.stockData[ticker] || { baseScore: 60, volatility: 5, sector: 'other' };
      const score = this.calculateMockScore(ticker, stockInfo, sentiment);
      
      return {
        ticker,
        score: Math.round(score),
        signal: this.determineSignal(score),
        confidence: this.determineConfidence(score, sentiment.confidence),
        reasoning: this.generateStockReasoning(ticker, stockInfo, sentiment)
      };
    });

    // 점수 기준 정렬
    recommendations.sort((a, b) => b.score - a.score);
    
    const result = {
      recommendations: recommendations.slice(0, 5),
      sentiment: sentiment,
      reasoning: this.generateOverallReasoning(sentiment, recommendations.slice(0, 5)),
      riskLevel: this.determineRiskLevel(sentiment),
      timeHorizon: 'short-term',
      model: 'mock-ai-v1.0',
      timestamp: new Date().toISOString(),
      mock: true,
      note: 'Mock AI recommendations for testing. Use real API keys for actual investment decisions.'
    };
    
    this.successCount++;
    return result;
  }

  // 센티멘트 타입 결정 (시간 기반 패턴)
  determineSentimentType(hour, marketData) {
    // 장 시간 (9-16시) 동안은 더 변동적
    if (hour >= 9 && hour <= 16) {
      // 볼륨이나 다른 지표가 있으면 활용
      if (marketData.volatility === 'high') return 'negative';
      if (marketData.trend === 'bullish') return 'positive';
      
      // 시간대별 패턴
      if (hour <= 11) return Math.random() > 0.4 ? 'positive' : 'neutral';
      if (hour <= 14) return Math.random() > 0.5 ? 'neutral' : 'negative';
      return Math.random() > 0.3 ? 'positive' : 'neutral';
    } else {
      // 장외 시간은 더 안정적
      return Math.random() > 0.6 ? 'neutral' : (Math.random() > 0.5 ? 'positive' : 'negative');
    }
  }

  // Mock 점수 계산
  calculateMockScore(ticker, stockInfo, sentiment) {
    let score = stockInfo.baseScore;
    
    // 센티멘트 영향
    const sentimentImpact = {
      positive: 1.1,
      neutral: 1.0,
      negative: 0.9
    };
    
    score *= sentimentImpact[sentiment.sentiment];
    
    // 랜덤 변동성 추가
    const volatilityRange = stockInfo.volatility;
    const randomFactor = (Math.random() - 0.5) * 2 * volatilityRange;
    score += randomFactor;
    
    // 섹터별 조정
    const sectorMultipliers = {
      ai: 1.05,
      semiconductor: 1.03,
      tech: 1.02,
      cloud: 1.01,
      social: 0.98,
      other: 1.0
    };
    
    score *= sectorMultipliers[stockInfo.sector] || 1.0;
    
    // 신뢰도 영향
    score *= (0.9 + sentiment.confidence * 0.2);
    
    return Math.max(30, Math.min(95, score));
  }

  // 매매 신호 결정
  determineSignal(score) {
    if (score >= 75) return 'Buy';
    if (score >= 60) return 'Hold';
    return 'Sell';
  }

  // 신뢰도 결정
  determineConfidence(score, sentimentConfidence) {
    if (sentimentConfidence > 0.8 && (score >= 80 || score <= 40)) return 'High';
    if (sentimentConfidence > 0.6 && score >= 65) return 'Moderate';
    return 'Low';
  }

  // 주식별 추천 이유 생성
  generateStockReasoning(ticker, stockInfo, sentiment) {
    const baseReasons = {
      'NVDA': 'AI 반도체 시장 선도, GPU 수요 급증',
      'MSFT': '클라우드 사업 성장, AI 기술 통합',
      'AAPL': '브랜드 파워와 생태계, 안정적 현금흐름',
      'GOOG': '검색 시장 독점, AI 연구 투자 확대',
      'META': '메타버스 투자, 광고 수익 모델 회복',
      'AMD': 'CPU/GPU 시장에서 경쟁력 강화',
      'TSM': '글로벌 반도체 파운드리 독점 지위',
      'AVGO': '다양한 반도체 포트폴리오',
      'QCOM': '5G 특허 수익, 모바일 칩 강세',
      'AMZN': 'AWS 클라우드 성장, 전자상거래 회복'
    };

    let reasoning = baseReasons[ticker] || `${stockInfo.sector} 섹터 내 안정적 포지션`;
    
    // 센티멘트 기반 추가 설명
    if (sentiment.sentiment === 'positive') {
      reasoning += ', 긍정적 시장 분위기로 상승 모멘텀 기대';
    } else if (sentiment.sentiment === 'negative') {
      reasoning += ', 하락장에서도 상대적 안정성 유지';
    } else {
      reasoning += ', 중립적 시장에서 선택적 투자 대상';
    }
    
    return reasoning;
  }

  // 전체 추천 이유 생성
  generateOverallReasoning(sentiment, recommendations) {
    const avgScore = recommendations.reduce((sum, rec) => sum + rec.score, 0) / recommendations.length;
    const topTicker = recommendations[0]?.ticker || 'N/A';
    
    return `Mock AI 분석 결과: ${sentiment.sentiment} 센티멘트 (신뢰도 ${(sentiment.confidence * 100).toFixed(0)}%)를 기반으로 ` +
           `평균 점수 ${avgScore.toFixed(0)}점의 추천 종목들을 선정했습니다. 최고 추천 종목은 ${topTicker}입니다. ` +
           `실제 투자 결정을 위해서는 실제 AI API를 사용하시기 바랍니다.`;
  }

  // 리스크 레벨 결정
  determineRiskLevel(sentiment) {
    if (sentiment.confidence > 0.8) {
      return sentiment.sentiment === 'positive' ? 'medium' : 'low';
    } else if (sentiment.confidence > 0.6) {
      return 'medium';
    } else {
      return 'high';
    }
  }

  // 시장 텍스트 생성
  generateMarketText(marketData) {
    const date = new Date().toLocaleDateString('ko-KR');
    let text = `${date} Mock 시장 분석: `;
    
    if (marketData && Object.keys(marketData).length > 0) {
      text += `입력된 시장 데이터를 기반으로 한 분석. `;
      if (marketData.trend) text += `트렌드: ${marketData.trend}. `;
      if (marketData.volatility) text += `변동성: ${marketData.volatility}. `;
    } else {
      text += `기본 시장 상황을 가정한 Mock 분석. `;
    }
    
    text += `실제 시장 분석을 위해서는 실제 AI API 서비스를 사용하시기 바랍니다.`;
    
    return text;
  }
}

module.exports = MockAIService;
