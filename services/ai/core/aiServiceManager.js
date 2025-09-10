// AI 서비스 매니저 - 여러 AI 서비스를 관리하고 fallback 제공
const AIServiceBase = require('./aiServiceBase');

class AIServiceManager extends AIServiceBase {
  constructor() {
    super('AIServiceManager');
    this.services = new Map();
    this.primaryService = null;
    this.fallbackServices = [];
    this.retryConfig = {
      maxRetries: 2,
      retryDelay: 1000,
      backoffMultiplier: 2
    };
  }

  // 서비스 등록
  registerService(name, service, isPrimary = false) {
    this.services.set(name, service);
    
    if (isPrimary || !this.primaryService) {
      this.primaryService = name;
    } else {
      this.fallbackServices.push(name);
    }
    
    console.log(`✅ Registered AI service: ${name} ${isPrimary ? '(Primary)' : '(Fallback)'}`);
  }

  // 사용 가능한 서비스 찾기
  async findAvailableService(operation = 'general') {
    // 먼저 primary 서비스 시도
    if (this.primaryService && this.services.has(this.primaryService)) {
      const service = this.services.get(this.primaryService);
      try {
        const status = await service.checkStatus();
        if (status.success) {
          return { name: this.primaryService, service };
        }
      } catch (error) {
        console.log(`Primary service ${this.primaryService} not available: ${error.message}`);
      }
    }

    // fallback 서비스들 시도
    for (const serviceName of this.fallbackServices) {
      if (this.services.has(serviceName)) {
        const service = this.services.get(serviceName);
        try {
          const status = await service.checkStatus();
          if (status.success) {
            console.log(`Using fallback service: ${serviceName}`);
            return { name: serviceName, service };
          }
        } catch (error) {
          console.log(`Fallback service ${serviceName} not available: ${error.message}`);
        }
      }
    }

    return null;
  }

  // 재시도 로직이 있는 요청 실행
  async executeWithRetry(operation, ...args) {
    this.incrementRequestCount();
    
    for (let attempt = 1; attempt <= this.retryConfig.maxRetries + 1; attempt++) {
      try {
        const availableService = await this.findAvailableService(operation);
        
        if (!availableService) {
          throw new Error('No AI services available');
        }

        const { name, service } = availableService;
        console.log(`[Attempt ${attempt}] Using service: ${name} for ${operation}`);
        
        const result = await service[operation](...args);
        
        if (result && !result.error) {
          this.successCount++;
          return this.getSuccessResponse(result, operation);
        } else {
          throw new Error(result?.message || 'Service returned error result');
        }
      } catch (error) {
        console.log(`[Attempt ${attempt}] ${operation} failed: ${error.message}`);
        
        if (attempt <= this.retryConfig.maxRetries) {
          const delay = this.retryConfig.retryDelay * Math.pow(this.retryConfig.backoffMultiplier, attempt - 1);
          console.log(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          return this.handleError(error, operation);
        }
      }
    }
  }

  // 센티멘트 분석
  async analyzeSentiment(marketData = {}) {
    return this.executeWithRetry('analyzeSentiment', marketData);
  }

  // 주식 추천
  async getStockRecommendations(stockData = [], marketData = {}) {
    return this.executeWithRetry('getStockRecommendations', stockData, marketData);
  }

  // 전체 상태 확인
  async checkStatus() {
    const serviceStatuses = {};
    
    for (const [name, service] of this.services) {
      try {
        const status = await service.checkStatus();
        serviceStatuses[name] = {
          available: status.success,
          ...status
        };
      } catch (error) {
        serviceStatuses[name] = {
          available: false,
          error: error.message
        };
      }
    }

    const availableServices = Object.values(serviceStatuses).filter(s => s.available).length;
    const totalServices = this.services.size;

    return this.getSuccessResponse({
      manager: this.getStats(),
      services: serviceStatuses,
      summary: {
        totalServices,
        availableServices,
        primaryService: this.primaryService,
        fallbackServices: this.fallbackServices
      }
    }, 'checkStatus');
  }

  // Mock 데이터 서비스 (fallback의 fallback)
  getMockService() {
    return {
      serviceName: 'MockAI',
      async checkStatus() {
        return { success: true, message: 'Mock service always available' };
      },
      async analyzeSentiment(marketData) {
        const sentiments = ['positive', 'neutral', 'negative'];
        const randomSentiment = sentiments[Math.floor(Math.random() * sentiments.length)];
        
        return {
          sentiment: randomSentiment,
          confidence: 0.6 + Math.random() * 0.3,
          recommendation: `Mock ${randomSentiment} sentiment analysis`,
          reasoning: 'Mock AI analysis - configure real API keys for accurate results',
          model: 'mock-ai',
          timestamp: new Date().toISOString()
        };
      },
      async getStockRecommendations(stockData, marketData) {
        const mockStocks = ['NVDA', 'MSFT', 'AAPL', 'GOOG', 'META'];
        
        return {
          recommendations: mockStocks.map((ticker, index) => ({
            ticker,
            score: 85 - index * 5,
            signal: index < 2 ? 'Buy' : index < 4 ? 'Hold' : 'Sell',
            confidence: 'Medium',
            reasoning: `Mock analysis for ${ticker}`
          })),
          reasoning: 'Mock AI recommendations - configure real API keys for accurate analysis',
          model: 'mock-ai',
          timestamp: new Date().toISOString()
        };
      }
    };
  }
}

module.exports = AIServiceManager;
