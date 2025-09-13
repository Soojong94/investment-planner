// 시기적 분석 점수 공유를 위한 캐시
class SeasonalScoreCache {
  constructor() {
    this.cache = new Map();
    this.timeout = 5 * 60 * 1000; // 5분
  }

  setScore(ticker, month, score) {
    const key = `${ticker}_${month}`;
    this.cache.set(key, {
      score,
      timestamp: Date.now()
    });
    console.log(`📝 Cached seasonal score for ${ticker}: ${score}`);
  }

  getScore(ticker, month) {
    const key = `${ticker}_${month}`;
    const cached = this.cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < this.timeout) {
      console.log(`🎯 Retrieved cached score for ${ticker}: ${cached.score}`);
      return cached.score;
    }
    
    return null;
  }

  clearCache() {
    this.cache.clear();
    console.log('🧹 Seasonal score cache cleared');
  }
}

// 싱글톤 인스턴스
const scoreCache = new SeasonalScoreCache();
module.exports = scoreCache;
