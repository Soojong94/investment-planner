// Performance Optimizer - API 호출 최적화 및 배치 처리
class PerformanceOptimizer {
  constructor() {
    this.requestQueue = [];
    this.batchSize = 3;
    this.batchDelay = 1000; // 1초 지연
    this.processing = false;
  }

  /**
   * 배치 처리를 위한 요청 추가
   */
  addToBatch(requestFunction, priority = 'normal') {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({
        id: Date.now() + Math.random(),
        requestFunction,
        priority,
        resolve,
        reject,
        timestamp: Date.now()
      });
      
      if (!this.processing) {
        this.processBatch();
      }
    });
  }

  /**
   * 배치 단위로 요청 처리
   */
  async processBatch() {
    if (this.processing || this.requestQueue.length === 0) return;
    
    this.processing = true;
    
    try {
      // 우선순위별 정렬
      this.requestQueue.sort((a, b) => {
        const priorityOrder = { high: 3, normal: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });
      
      while (this.requestQueue.length > 0) {
        const batch = this.requestQueue.splice(0, this.batchSize);
        
        // 병렬 처리
        const results = await Promise.allSettled(
          batch.map(async (request) => {
            try {
              const result = await request.requestFunction();
              request.resolve(result);
              return { success: true, id: request.id };
            } catch (error) {
              request.reject(error);
              return { success: false, id: request.id, error: error.message };
            }
          })
        );
        
        console.log(`Batch processed: ${results.length} requests`);
        
        // 다음 배치 전 지연
        if (this.requestQueue.length > 0) {
          await this.delay(this.batchDelay);
        }
      }
    } finally {
      this.processing = false;
    }
  }

  /**
   * 지연 함수
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 요청 큐 상태 확인
   */
  getQueueStatus() {
    return {
      queueLength: this.requestQueue.length,
      processing: this.processing,
      batchSize: this.batchSize,
      batchDelay: this.batchDelay
    };
  }

  /**
   * 설정 업데이트
   */
  updateSettings(settings) {
    if (settings.batchSize) this.batchSize = settings.batchSize;
    if (settings.batchDelay) this.batchDelay = settings.batchDelay;
  }
}

// 캐시 최적화 클래스
class CacheOptimizer {
  constructor() {
    this.caches = new Map();
    this.defaultTTL = 5 * 60 * 1000; // 5분
    this.maxCacheSize = 100;
  }

  /**
   * 통합 캐시 관리
   */
  createCache(name, ttl = this.defaultTTL) {
    if (this.caches.has(name)) {
      return this.caches.get(name);
    }

    const cache = {
      data: new Map(),
      ttl,
      lastCleanup: Date.now()
    };

    this.caches.set(name, cache);
    return cache;
  }

  /**
   * 캐시에서 데이터 가져오기
   */
  get(cacheName, key) {
    const cache = this.caches.get(cacheName);
    if (!cache) return null;

    const item = cache.data.get(key);
    if (!item) return null;

    // TTL 확인
    if (Date.now() - item.timestamp > cache.ttl) {
      cache.data.delete(key);
      return null;
    }

    return item.value;
  }

  /**
   * 캐시에 데이터 저장
   */
  set(cacheName, key, value) {
    const cache = this.caches.get(cacheName);
    if (!cache) return false;

    // 캐시 크기 제한
    if (cache.data.size >= this.maxCacheSize) {
      this.cleanupOldEntries(cache);
    }

    cache.data.set(key, {
      value,
      timestamp: Date.now()
    });

    return true;
  }

  /**
   * 오래된 캐시 엔트리 정리
   */
  cleanupOldEntries(cache) {
    const now = Date.now();
    const entries = Array.from(cache.data.entries());
    
    // 시간순 정렬하여 오래된 것부터 삭제
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    const deleteCount = Math.floor(this.maxCacheSize * 0.3); // 30% 삭제
    for (let i = 0; i < deleteCount; i++) {
      cache.data.delete(entries[i][0]);
    }
  }

  /**
   * 전체 캐시 상태
   */
  getStatus() {
    const status = {};
    this.caches.forEach((cache, name) => {
      status[name] = {
        size: cache.data.size,
        ttl: cache.ttl,
        lastCleanup: cache.lastCleanup
      };
    });
    return status;
  }

  /**
   * 캐시 클리어
   */
  clear(cacheName = null) {
    if (cacheName) {
      const cache = this.caches.get(cacheName);
      if (cache) cache.data.clear();
    } else {
      this.caches.forEach(cache => cache.data.clear());
    }
  }
}

// 싱글톤 인스턴스 생성
const performanceOptimizer = new PerformanceOptimizer();
const cacheOptimizer = new CacheOptimizer();

module.exports = {
  PerformanceOptimizer,
  CacheOptimizer,
  performanceOptimizer,
  cacheOptimizer
};
