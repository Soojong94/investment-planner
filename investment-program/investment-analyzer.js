// 투자 보조 프로그램 - 핵심 분석 엔진
class InvestmentAnalyzer {
  constructor() {
    this.apiEndpoints = {
      quote: '/api/quote',
      analysis: '/api/analysis', 
      score: '/api/score',
      company: '/api/company-info'
    };
  }

  // 종목 분석 수행
  async analyzeStock(ticker) {
    try {
      console.log(`Starting analysis for ${ticker}`);
      
      const [quoteResponse, analysisResponse, scoreResponse, companyResponse] = await Promise.all([
        this.safeApiFetch(`${this.apiEndpoints.quote}/${ticker}`),
        this.safeApiFetch(`${this.apiEndpoints.analysis}/${ticker}`),
        this.safeApiFetch(`${this.apiEndpoints.score}/${ticker}`),
        this.safeApiFetch(`${this.apiEndpoints.company}/${ticker}`)
      ]);

      const results = {
        ticker,
        quote: quoteResponse.data,
        analysis: analysisResponse.data,
        score: scoreResponse.data,
        company: companyResponse.data,
        success: quoteResponse.success && analysisResponse.success,
        timestamp: new Date().toISOString()
      };

      return results;
    } catch (error) {
      console.error(`Error analyzing ${ticker}:`, error);
      return {
        ticker,
        error: error.message,
        success: false,
        timestamp: new Date().toISOString()
      };
    }
  }

  // 안전한 API 호출
  async safeApiFetch(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`API call failed: ${response.status}`);
      }
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.warn(`API fetch failed for ${url}:`, error.message);
      return { success: false, error: error.message, data: null };
    }
  }

  // 종합 점수 계산
  calculateInvestmentScore(analysisData) {
    const { quote, analysis, score } = analysisData;
    
    if (!quote || !analysis) {
      return {
        totalScore: 0.5,
        recommendation: 'Hold',
        confidence: 'Low',
        reason: '데이터 부족'
      };
    }

    const technicalScore = this.calculateTechnicalScore(analysis);
    const fundamentalScore = this.calculateFundamentalScore(quote);
    const seasonalScore = this.calculateSeasonalScore();

    const totalScore = (technicalScore * 0.4) + (fundamentalScore * 0.3) + (seasonalScore * 0.3);
    
    let recommendation = 'Hold';
    let confidence = 'Medium';

    if (totalScore >= 0.75) {
      recommendation = 'Strong Buy';
      confidence = 'High';
    } else if (totalScore >= 0.65) {
      recommendation = 'Buy';
      confidence = 'High';
    } else if (totalScore <= 0.35) {
      recommendation = 'Sell';
      confidence = 'Medium';
    } else if (totalScore <= 0.25) {
      recommendation = 'Strong Sell';
      confidence = 'High';
    }

    return {
      totalScore,
      technicalScore,
      fundamentalScore,
      seasonalScore,
      recommendation,
      confidence,
      reason: this.generateRecommendationReason(technicalScore, fundamentalScore, seasonalScore)
    };
  }

  // 기술적 분석 점수
  calculateTechnicalScore(analysis) {
    if (!analysis || analysis.error) return 0.5;
    
    let score = 0.5;
    
    // RSI 분석
    if (analysis.rsi) {
      const rsi = parseFloat(analysis.rsi);
      if (rsi < 30) score += 0.2; // 과매도
      else if (rsi > 70) score -= 0.1; // 과매수
      else if (rsi >= 45 && rsi <= 55) score += 0.1; // 중립
    }
    
    // 매매 신호
    if (analysis.signal === 'Buy') score += 0.3;
    else if (analysis.signal === 'Sell') score -= 0.3;
    
    // 추세 강도
    if (analysis.trendStrength === 'Strong') score += 0.2;
    else if (analysis.trendStrength === 'Weak') score -= 0.1;
    
    return Math.max(0, Math.min(1, score));
  }

  // 펀더멘털 분석 점수
  calculateFundamentalScore(quote) {
    if (!quote || quote.error) return 0.5;
    
    let score = 0.5;
    
    // P/E 비율
    if (quote.peRatio && quote.peRatio !== 'N/A') {
      const pe = parseFloat(quote.peRatio);
      if (pe > 0 && pe < 15) score += 0.2;
      else if (pe >= 15 && pe <= 25) score += 0.1;
      else if (pe > 35) score -= 0.1;
    }
    
    // 배당 수익률
    if (quote.dividendYield && quote.dividendYield !== 'N/A') {
      const dividend = parseFloat(quote.dividendYield);
      if (dividend >= 2) score += 0.1;
    }
    
    // 52주 대비 현재 위치
    if (quote.currentPrice && quote.fiftyTwoWeekHigh && quote.fiftyTwoWeekLow) {
      const current = parseFloat(quote.currentPrice);
      const high = parseFloat(quote.fiftyTwoWeekHigh);
      const low = parseFloat(quote.fiftyTwoWeekLow);
      
      if (current && high && low && high > low) {
        const position = ((current - low) / (high - low)) * 100;
        if (position <= 30) score += 0.15; // 저점 근처
        else if (position >= 80) score -= 0.05; // 고점 근처
      }
    }
    
    return Math.max(0, Math.min(1, score));
  }

  // 계절적 분석 점수
  calculateSeasonalScore() {
    const currentMonth = new Date().getMonth() + 1;
    
    // 일반적인 주식 시장 계절성 (간단한 모델)
    const seasonalFactors = {
      1: 0.6,  // 1월 - 신년 효과
      2: 0.5,  // 2월
      3: 0.7,  // 3월 - 분기말
      4: 0.8,  // 4월 - 봄 랠리
      5: 0.6,  // 5월 - Sell in May
      6: 0.5,  // 6월
      7: 0.5,  // 7월
      8: 0.4,  // 8월 - 여름 침체
      9: 0.4,  // 9월 - 약세 월
      10: 0.6, // 10월 - 변동성
      11: 0.7, // 11월 - 추수감사절 랠리
      12: 0.8  // 12월 - 연말 랠리
    };
    
    return seasonalFactors[currentMonth] || 0.5;
  }

  // 추천 근거 생성
  generateRecommendationReason(technical, fundamental, seasonal) {
    const reasons = [];
    
    if (technical >= 0.7) reasons.push('강한 기술적 신호');
    else if (technical <= 0.3) reasons.push('약한 기술적 신호');
    
    if (fundamental >= 0.7) reasons.push('우수한 펀더멘털');
    else if (fundamental <= 0.3) reasons.push('우려되는 밸류에이션');
    
    if (seasonal >= 0.7) reasons.push('유리한 계절적 요인');
    else if (seasonal <= 0.3) reasons.push('불리한 계절적 요인');
    
    return reasons.length > 0 ? reasons.join(', ') : '중립적 시장 상황';
  }
}

// 전역 객체로 내보내기
window.InvestmentAnalyzer = InvestmentAnalyzer;
