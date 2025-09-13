// 분석 결과 캐싱 매니저 - API 호출 최적화
const AnalysisCacheManager = {
  // 캐시 설정
  cacheTimeout: 5 * 60 * 1000, // 5분
  cache: new Map(),
  
  /**
   * 캐시 키 생성
   */
  generateCacheKey(ticker, analysisType = 'full') {
    return `${ticker}_${analysisType}_${this.getCurrentHour()}`;
  },
  
  /**
   * 현재 시간 (시간 단위) - 같은 시간 내에서는 캐시 재사용
   */
  getCurrentHour() {
    const now = new Date();
    return `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}`;
  },
  
  /**
   * 캐시된 분석 결과 확인
   */
  getCachedAnalysis(ticker) {
    const cacheKey = this.generateCacheKey(ticker);
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    
    return null;
  },
  
  /**
   * 분석 결과 캐시에 저장
   */
  setCachedAnalysis(ticker, data) {
    const cacheKey = this.generateCacheKey(ticker);
    this.cache.set(cacheKey, {
      data: data,
      timestamp: Date.now()
    });
  },
  
  /**
   * 페이지 새로고침 감지 및 캐시 활용
   */
  handlePageRefresh(ticker, forceRefresh = false) {
    // 강제 새로고침이 아니고 캐시된 데이터가 있으면 재사용
    if (!forceRefresh) {
      const cached = this.getCachedAnalysis(ticker);
      if (cached) {
        return {
          useCache: true,
          data: cached
        };
      }
    }
    
    return {
      useCache: false,
      data: null
    };
  },
  
  /**
   * 캐시 상태 확인
   */
  getCacheStatus() {
    const now = Date.now();
    const validCaches = [];
    const expiredCaches = [];
    
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp < this.cacheTimeout) {
        validCaches.push(key);
      } else {
        expiredCaches.push(key);
      }
    }
    
    return {
      totalCaches: this.cache.size,
      validCaches: validCaches.length,
      expiredCaches: expiredCaches.length,
      cacheTimeout: this.cacheTimeout / 1000 / 60, // 분 단위
      validCacheKeys: validCaches
    };
  },
  
  /**
   * 만료된 캐시 정리
   */
  cleanExpiredCaches() {
    const now = Date.now();
    let cleanedCount = 0;
    
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp >= this.cacheTimeout) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned ${cleanedCount} expired caches`);
    }
    
    return cleanedCount;
  },
  
  /**
   * 모든 캐시 클리어
   */
  clearAllCaches() {
    const cacheCount = this.cache.size;
    this.cache.clear();
    console.log(`🗑️ Cleared all ${cacheCount} caches`);
    return cacheCount;
  },
  
  /**
   * 특정 종목 캐시 클리어
   */
  clearTickerCache(ticker) {
    const keysToDelete = [];
    for (const key of this.cache.keys()) {
      if (key.includes(ticker)) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.cache.delete(key));
    console.log(`🗑️ Cleared ${keysToDelete.length} caches for ${ticker}`);
    return keysToDelete.length;
  },
  
  /**
   * 사용자 액션에 따른 캐시 전략 결정
   */
  decideCacheStrategy(ticker, userAction) {
    const strategies = {
      // 새로고침 - 캐시 우선 사용
      'refresh': () => this.handlePageRefresh(ticker, false),
      
      // 종목 변경 - 새로운 분석 필요
      'ticker_change': () => ({ useCache: false, data: null }),
      
      // 강제 새로고침 (Ctrl+F5) - 캐시 무시
      'force_refresh': () => this.handlePageRefresh(ticker, true),
      
      // 일반 클릭 - 캐시 확인 후 결정
      'click': () => this.handlePageRefresh(ticker, false)
    };
    
    const strategy = strategies[userAction] || strategies['click'];
    return strategy();
  }
};

// 전역으로 사용할 수 있도록 등록
window.AnalysisCacheManager = AnalysisCacheManager;

// 주기적으로 만료된 캐시 정리 (5분마다)
setInterval(() => {
  AnalysisCacheManager.cleanExpiredCaches();
}, 5 * 60 * 1000);
