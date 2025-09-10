// 시기적 분석 유틸리티 함수들
const { monthlyCharacteristics, monthlyRiskFactors, monthlyOpportunities, monthNames } = require('./seasonalData');

class SeasonalUtils {
  // 변동성 계산
  static calculateVolatility(returns) {
    if (!returns || returns.length < 2) return 0;
    
    const avgReturn = returns.reduce((sum, data) => sum + data.return, 0) / returns.length;
    const variance = returns.reduce((sum, data) => sum + Math.pow(data.return - avgReturn, 2), 0) / returns.length;
    return Math.sqrt(variance);
  }

  // 월별 리스크 요인 가져오기
  static getMonthlyRisks(month) {
    return monthlyRiskFactors[month] || ['일반적인 시장 리스크'];
  }

  // 월별 투자 기회 가져오기
  static getMonthlyOpportunities(month) {
    return monthlyOpportunities[month] || ['시기적 투자 기회'];
  }

  // 최적 진입 시점 결정
  static getOptimalEntryTiming(month, sentiment) {
    const monthCharacteristics = monthlyCharacteristics[month];
    
    if (sentiment.sentiment === 'positive' && monthCharacteristics.historicalTrend === 'positive') {
      return '월초 적극적 진입 권장';
    } else if (monthCharacteristics.historicalTrend === 'volatile') {
      return '변동성 활용한 분할 매수';
    } else if (monthCharacteristics.historicalTrend === 'negative') {
      return '하락 시 저가 매수 기회 대기';
    }
    
    return '시장 상황 모니터링 후 진입';
  }

  // 최적 청산 시점 결정
  static getOptimalExitTiming(month, sentiment) {
    const monthCharacteristics = monthlyCharacteristics[month];
    
    if (monthCharacteristics.riskLevel === 'high') {
      return '목표 수익률 달성 시 신속 청산';
    } else if (sentiment.confidence < 0.6) {
      return '불확실성 증가 시 부분 청산';
    }
    
    return '월말 또는 추세 변화 시점';
  }

  // 리스크 완화 조언
  static getRiskMitigationAdvice(riskScore, monthCharacteristics) {
    if (riskScore >= 0.7) {
      return [
        '포지션 크기 축소 고려',
        '손절매 라인 설정',
        '분산투자 강화',
        '변동성 낮은 자산 혼합'
      ];
    } else if (riskScore >= 0.4) {
      return [
        '적절한 포지션 관리',
        '시장 모니터링 강화',
        '부분 매매 전략 활용'
      ];
    } else {
      return [
        '상대적으로 안정적인 구간',
        '계획된 투자 전략 실행',
        '기회 포착에 집중'
      ];
    }
  }

  // 권장 자산 배분
  static getRecommendedAllocation(seasonalScore, monthCharacteristics) {
    let allocation = {
      aggressive: 0,
      moderate: 0,
      conservative: 0,
      cash: 0
    };

    if (seasonalScore >= 0.7 && monthCharacteristics.riskLevel !== 'high') {
      allocation = { aggressive: 60, moderate: 30, conservative: 10, cash: 0 };
    } else if (seasonalScore >= 0.55) {
      allocation = { aggressive: 40, moderate: 40, conservative: 15, cash: 5 };
    } else {
      allocation = { aggressive: 20, moderate: 30, conservative: 35, cash: 15 };
    }

    return allocation;
  }

  // 분석 컨텍스트 구성
  static buildAnalysisContext(ticker, month, monthCharacteristics, historicalData) {
    let context = `시기적 투자 분석 요청:\n\n`;
    context += `종목: ${ticker}\n`;
    context += `대상 월: ${monthNames[month]}\n`;
    context += `월별 특성: ${monthCharacteristics.name}\n`;
    context += `역사적 추세: ${monthCharacteristics.historicalTrend}\n`;
    context += `주요 요인: ${monthCharacteristics.keyFactors.join(', ')}\n`;
    context += `선호 섹터: ${monthCharacteristics.sectors.join(', ')}\n`;
    context += `리스크 레벨: ${monthCharacteristics.riskLevel}\n\n`;

    if (historicalData && historicalData.length > 0) {
      const avgReturn = historicalData.reduce((sum, data) => sum + data.return, 0) / historicalData.length;
      const volatility = this.calculateVolatility(historicalData);
      context += `과거 ${monthNames[month]} 성과:\n`;
      context += `- 평균 수익률: ${avgReturn.toFixed(2)}%\n`;
      context += `- 변동성: ${volatility.toFixed(2)}%\n`;
      context += `- 데이터 포인트: ${historicalData.length}개\n\n`;
    }

    const currentYear = new Date().getFullYear();
    context += `분석 시점: ${currentYear}년 ${monthNames[month]}\n`;
    context += `현재 시장 환경: AI 기술 혁신, 반도체 호황, 연준 금리 정책 변화\n\n`;
    context += `${ticker} 종목의 ${monthNames[month]} 투자 적합성을 분석해주세요.`;

    return context;
  }

  // 기본 시기적 분석에서 점수 추출
  static extractBasicSeasonalScore(basicSeasonal) {
    try {
      const currentMonth = new Date().getMonth();
      const targetMonth = monthNames[currentMonth];

      if (basicSeasonal.bestMonth && basicSeasonal.bestMonth.includes(targetMonth)) {
        const match = basicSeasonal.bestMonth.match(/\(([+-]?\d+\.?\d*)%\)/);
        if (match) {
          const returnPct = parseFloat(match[1]);
          return Math.max(0, Math.min(1, (returnPct + 10) / 20));
        }
        return 0.8;
      }

      if (basicSeasonal.worstMonth && basicSeasonal.worstMonth.includes(targetMonth)) {
        const match = basicSeasonal.worstMonth.match(/\(([+-]?\d+\.?\d*)%\)/);
        if (match) {
          const returnPct = parseFloat(match[1]);
          return Math.max(0, Math.min(1, (returnPct + 10) / 20));
        }
        return 0.2;
      }

      return 0.5;
    } catch (error) {
      return 0.5;
    }
  }
}

module.exports = SeasonalUtils;
