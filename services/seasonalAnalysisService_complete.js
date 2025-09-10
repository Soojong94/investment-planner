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
