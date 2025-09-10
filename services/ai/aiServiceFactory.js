// AI 서비스 팩토리 - 서비스 생성 및 초기화 관리
const AIServiceManager = require('./core/aiServiceManager');
const HuggingFaceService = require('./huggingFaceService');
const MockAIService = require('./mockAIService');

class AIServiceFactory {
  static instance = null;
  
  constructor() {
    if (AIServiceFactory.instance) {
      return AIServiceFactory.instance;
    }
    
    this.manager = new AIServiceManager();
    this.initialized = false;
    AIServiceFactory.instance = this;
  }

  // 싱글톤 인스턴스 반환
  static getInstance() {
    if (!AIServiceFactory.instance) {
      AIServiceFactory.instance = new AIServiceFactory();
    }
    return AIServiceFactory.instance;
  }

  // 서비스 초기화
  async initialize() {
    if (this.initialized) {
      console.log('AI services already initialized');
      return this.manager;
    }

    console.log('🚀 Initializing AI services...');

    try {
      // 1. Hugging Face 서비스 설정
      await this.setupHuggingFaceService();
      
      // 2. Mock 서비스 설정 (항상 fallback으로 사용)
      await this.setupMockService();
      
      // 3. 초기 상태 확인
      await this.performInitialHealthCheck();
      
      this.initialized = true;
      console.log('✅ AI services initialization completed');
      
      return this.manager;

    } catch (error) {
      console.error('❌ AI services initialization failed:', error);
      
      // 초기화 실패 시 Mock 서비스만으로라도 동작하도록
      await this.setupMockService();
      this.initialized = true;
      
      console.log('⚠️ Running with mock service only');
      return this.manager;
    }
  }

  // Hugging Face 서비스 설정
  async setupHuggingFaceService() {
    const hfApiKey = process.env.HUGGINGFACE_API_KEY;
    
    if (!hfApiKey || hfApiKey.trim() === '') {
      console.log('⚠️ Hugging Face API key not configured');
      return;
    }

    try {
      const hfService = new HuggingFaceService();
      
      // 연결 테스트
      console.log('🔍 Testing Hugging Face connection...');
      const status = await hfService.checkStatus();
      
      if (status.success) {
        this.manager.registerService('huggingface', hfService, true); // Primary
        console.log('✅ Hugging Face service registered as primary');
      } else {
        console.log('⚠️ Hugging Face service not available:', status.message);
      }
      
    } catch (error) {
      console.log('⚠️ Hugging Face service setup failed:', error.message);
    }
  }

  // Mock 서비스 설정
  async setupMockService() {
    try {
      const mockService = new MockAIService();
      
      // Mock 서비스는 항상 사용 가능
      const hasPrimaryService = this.manager.primaryService !== null;
      this.manager.registerService('mock', mockService, !hasPrimaryService);
      
      console.log('✅ Mock AI service registered as ' + (hasPrimaryService ? 'fallback' : 'primary'));
      
    } catch (error) {
      console.error('❌ Failed to setup mock service:', error);
      throw error; // Mock 서비스 실패는 심각한 문제
    }
  }

  // 초기 헬스 체크
  async performInitialHealthCheck() {
    console.log('🔍 Performing initial health check...');
    
    try {
      const status = await this.manager.checkStatus();
      
      if (status.success) {
        const summary = status.data.summary;
        console.log(`📊 Health check completed: ${summary.availableServices}/${summary.totalServices} services available`);
        
        if (summary.availableServices === 0) {
          throw new Error('No AI services are available');
        }
      } else {
        throw new Error('Health check failed: ' + status.message);
      }
      
    } catch (error) {
      console.error('❌ Health check failed:', error);
      throw error;
    }
  }

  // 서비스 매니저 반환
  getManager() {
    if (!this.initialized) {
      throw new Error('AI services not initialized. Call initialize() first.');
    }
    return this.manager;
  }

  // 빠른 센티멘트 분석
  async analyzeSentiment(marketData) {
    const manager = this.getManager();
    return await manager.analyzeSentiment(marketData);
  }

  // 빠른 주식 추천
  async getStockRecommendations(stockData, marketData) {
    const manager = this.getManager();
    return await manager.getStockRecommendations(stockData, marketData);
  }

  // 서비스 상태 확인
  async getStatus() {
    if (!this.initialized) {
      return {
        success: false,
        error: true,
        message: 'AI services not initialized',
        timestamp: new Date().toISOString()
      };
    }
    
    return await this.manager.checkStatus();
  }

  // 서비스 재시작
  async restart() {
    console.log('🔄 Restarting AI services...');
    
    this.initialized = false;
    this.manager = new AIServiceManager();
    
    return await this.initialize();
  }

  // 개발/테스트용 - Mock 서비스만 사용
  async initializeWithMockOnly() {
    console.log('🧪 Initializing with mock service only (development mode)');
    
    this.manager = new AIServiceManager();
    await this.setupMockService();
    this.initialized = true;
    
    console.log('✅ Mock-only initialization completed');
    return this.manager;
  }

  // 환경별 초기화
  async initializeForEnvironment(env = 'production') {
    switch (env) {
      case 'development':
      case 'test':
        return await this.initializeWithMockOnly();
      
      case 'production':
      case 'staging':
      default:
        return await this.initialize();
    }
  }
}

// 싱글톤 인스턴스 생성 및 내보내기
const aiServiceFactory = AIServiceFactory.getInstance();

module.exports = {
  AIServiceFactory,
  aiServiceFactory,
  // 편의 함수들
  initializeAI: () => aiServiceFactory.initialize(),
  getAIManager: () => aiServiceFactory.getManager(),
  analyzeMarketSentiment: (data) => aiServiceFactory.analyzeSentiment(data),
  getAIStockRecommendations: (stocks, market) => aiServiceFactory.getStockRecommendations(stocks, market),
  getAIStatus: () => aiServiceFactory.getStatus()
};
