// 월별 시장 특성 데이터
const monthlyCharacteristics = {
  0: { // 1월
    name: '신년 효과',
    historicalTrend: 'positive',
    keyFactors: ['신년 효과', '소형주 강세', '새로운 투자 자금 유입'],
    sectors: ['small-cap', 'growth', 'emerging'],
    riskLevel: 'medium'
  },
  1: { // 2월
    name: '실적 시즌',
    historicalTrend: 'volatile',
    keyFactors: ['4분기 실적 발표', '밸런타인 소비', '짧은 거래일'],
    sectors: ['retail', 'consumer', 'tech'],
    riskLevel: 'high'
  },
  2: { // 3월
    name: '분기말 효과',
    historicalTrend: 'volatile',
    keyFactors: ['분기말 리밸런싱', '세금 정산', '펀드 매매'],
    sectors: ['finance', 'reits', 'utilities'],
    riskLevel: 'high'
  },
  3: { // 4월
    name: '봄 랠리',
    historicalTrend: 'positive',
    keyFactors: ['4월 효과', '세금 환급', '기업 가이던스'],
    sectors: ['growth', 'tech', 'consumer'],
    riskLevel: 'low'
  },
  4: { // 5월
    name: 'Sell in May',
    historicalTrend: 'negative',
    keyFactors: ['Sell in May 격언', '여름 비수기 진입', '유럽 휴가'],
    sectors: ['defensive', 'utilities', 'staples'],
    riskLevel: 'medium'
  },
  5: { // 6월
    name: '여름 시작',
    historicalTrend: 'neutral',
    keyFactors: ['FOMC 회의', '분기말', '여름 휴가 준비'],
    sectors: ['value', 'dividend', 'defensive'],
    riskLevel: 'medium'
  },
  6: { // 7월
    name: '실적 시즌',
    historicalTrend: 'positive',
    keyFactors: ['2분기 실적', '여름 소비', '기술주 집중'],
    sectors: ['tech', 'consumer', 'travel'],
    riskLevel: 'medium'
  },
  7: { // 8월
    name: '여름 휴가철',
    historicalTrend: 'volatile',
    keyFactors: ['낮은 거래량', '휴가철 효과', '잭슨홀 심포지엄'],
    sectors: ['large-cap', 'stable', 'dividend'],
    riskLevel: 'high'
  },
  8: { // 9월
    name: '가을 시작',
    historicalTrend: 'negative',
    keyFactors: ['휴가 복귀', '새 학기', '역사적 약세'],
    sectors: ['education', 'back-to-school', 'defensive'],
    riskLevel: 'high'
  },
  9: { // 10월
    name: '실적 시즌',
    historicalTrend: 'volatile',
    keyFactors: ['3분기 실적', '핼러윈 효과', '연말 전망'],
    sectors: ['tech', 'finance', 'industrial'],
    riskLevel: 'high'
  },
  10: { // 11월
    name: '연말 랠리 시작',
    historicalTrend: 'positive',
    keyFactors: ['추수감사절', '블랙프라이데이', '연말 랠리'],
    sectors: ['retail', 'consumer', 'small-cap'],
    riskLevel: 'medium'
  },
  11: { // 12월
    name: '산타 랠리',
    historicalTrend: 'positive',
    keyFactors: ['산타 랠리', '세금 매도', '연말 보너스'],
    sectors: ['growth', 'small-cap', 'momentum'],
    riskLevel: 'low'
  }
};

const monthlyRiskFactors = {
  0: ['신년 변동성', '소형주 과열', '저유동성'],
  1: ['실적 서프라이즈', '짧은 거래일', '밸런타인 소비 영향'],
  2: ['분기말 리밸런싱', '세금 매도', '금리 변동'],
  3: ['실적 기대감 과열', '가이던스 하향', '봄 변동성'],
  4: ['Sell in May 효과', '여름 비수기', '유럽 휴가'],
  5: ['FOMC 불확실성', '분기말 압박', '여름 침체'],
  6: ['실적 압박', '가이던스 리스크', '여름 변동성'],
  7: ['휴가철 저유동성', '잭슨홀 리스크', '8월 효과'],
  8: ['9월 효과', '변동성 증가', '분기말 압박'],
  9: ['실적 시즌 리스크', '연말 전망 불확실성', '10월 효과'],
  10: ['연말 정산 압박', '펀드 리밸런싱', '세금 매도'],
  11: ['연말 집중 현상', '세금 로스 셀링', '포트폴리오 정리']
};

const monthlyOpportunities = {
  0: ['신년 효과 활용', '소형주 모멘텀', '새로운 자금 유입'],
  1: ['실적 서프라이즈 수혜', '밸런타인 소비주', '단기 트레이딩'],
  2: ['리밸런싱 기회', '세금 환급 수혜', '분기말 효과'],
  3: ['봄 랠리 수혜', '성장주 강세', '가이던스 개선'],
  4: ['방어주 로테이션', '배당주 선호', '안정성 추구'],
  5: ['밸류 발굴 기회', '저평가 매수', '분산투자'],
  6: ['실적 개선 수혜', '기술주 집중', '여름 소비'],
  7: ['대형주 안정성', '배당 수익', '선별적 투자'],
  8: ['저가 매수 기회', '교육 관련주', '신학기 효과'],
  9: ['실적 개선 기대', '4분기 전망', '연말 랠리 준비'],
  10: ['연말 랠리 시작', '소비 관련주', '소형주 부활'],
  11: ['산타 랠리', '성장주 강세', '연말 보너스 효과']
};

const monthNames = ["1월", "2월", "3월", "4월", "5월", "6월", 
                   "7월", "8월", "9월", "10월", "11월", "12월"];

module.exports = {
  monthlyCharacteristics,
  monthlyRiskFactors,
  monthlyOpportunities,
  monthNames
};
