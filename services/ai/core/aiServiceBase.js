// AI 서비스 기본 추상화 클래스
class AIServiceBase {
  constructor(serviceName = 'Unknown') {
    this.serviceName = serviceName;
    this.isConnected = false;
    this.lastError = null;
    this.requestCount = 0;
    this.successCount = 0;
  }

  // 서비스 상태 확인
  async checkStatus() {
    throw new Error('checkStatus method must be implemented');
  }

  // 센티멘트 분석
  async analyzeSentiment(text) {
    throw new Error('analyzeSentiment method must be implemented');
  }

  // 주식 추천
  async getStockRecommendations(stockData, marketData) {
    throw new Error('getStockRecommendations method must be implemented');
  }

  // 공통 에러 핸들링
  handleError(error, operation = 'unknown') {
    this.lastError = {
      operation,
      message: error.message,
      timestamp: new Date().toISOString(),
      service: this.serviceName
    };
    
    console.error(`[${this.serviceName}] ${operation} failed:`, error.message);
    return this.getErrorResponse(operation, error);
  }

  // 에러 응답 생성
  getErrorResponse(operation, error) {
    return {
      success: false,
      error: true,
      service: this.serviceName,
      operation,
      message: error.message,
      timestamp: new Date().toISOString()
    };
  }

  // 성공 응답 생성
  getSuccessResponse(data, operation = 'unknown') {
    this.successCount++;
    return {
      success: true,
      error: false,
      service: this.serviceName,
      operation,
      data,
      timestamp: new Date().toISOString()
    };
  }

  // 요청 카운터 증가
  incrementRequestCount() {
    this.requestCount++;
  }

  // 서비스 통계
  getStats() {
    return {
      service: this.serviceName,
      isConnected: this.isConnected,
      requestCount: this.requestCount,
      successCount: this.successCount,
      successRate: this.requestCount > 0 ? (this.successCount / this.requestCount * 100).toFixed(1) + '%' : '0%',
      lastError: this.lastError
    };
  }
}

module.exports = AIServiceBase;
