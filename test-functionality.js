// Investment Program - 내부 기능 테스트 스크립트
// 실행: node test-functionality.js

require('dotenv').config();
const yahooFinanceService = require('./services/yahooFinanceService');
const HuggingFaceDeepSeekService = require('./services/ai/simpleAIService');
const investmentRecommendationService = require('./services/investmentRecommendationService');
const NewsSeasonalAnalyzer = require('./services/news/newsSeasonalAnalyzer');
const NewsApiService = require('./services/news/newsApiService');

class FunctionalityTester {
  constructor() {
    this.aiService = new HuggingFaceDeepSeekService();
    this.newsSeasonalAnalyzer = new NewsSeasonalAnalyzer();
    this.newsApiService = new NewsApiService();
    
    this.testResults = {
      passed: 0,
      failed: 0,
      warnings: 0,
      details: []
    };
  }

  // 메인 테스트 실행
  async runAllTests() {
    console.log('🧪 투자 보조 프로그램 기능 테스트 시작...\n');
    console.log('=' .repeat(60));
    
    const startTime = Date.now();
    
    try {
      // 1. 기본 API 서비스 테스트
      await this.testYahooFinanceService();
      await this.testAIService();
      
      // 2. 뉴스 관련 서비스 테스트
      await this.testNewsServices();
      
      // 3. 통합 추천 시스템 테스트
      await this.testIntegratedRecommendationSystem();
      
      // 4. 성능 테스트
      await this.testPerformance();
      
    } catch (error) {
      this.logResult('❌', 'CRITICAL', 'Overall Test Suite', `전체 테스트 실패: ${error.message}`);
    }
    
    const endTime = Date.now();
    this.printSummary(endTime - startTime);
  }

  // Yahoo Finance 서비스 테스트
  async testYahooFinanceService() {
    console.log('📊 Yahoo Finance 서비스 테스트...');
    
    const testTickers = ['NVDA', 'MSFT', 'INVALID_TICKER'];
    
    for (const ticker of testTickers) {
      try {
        // 기본 데이터 테스트
        const quote = await yahooFinanceService.getQuoteSummary(ticker);
        if (ticker === 'INVALID_TICKER') {
          if (quote.error) {
            this.logResult('✅', 'PASS', `Yahoo-Quote-${ticker}`, '잘못된 티커 에러 핸들링 정상');
          } else {
            this.logResult('⚠️', 'WARN', `Yahoo-Quote-${ticker}`, '잘못된 티커에 대한 에러 처리 미흡');
          }
        } else {
          if (quote && quote.currentPrice && quote.currentPrice !== 'N/A') {
            this.logResult('✅', 'PASS', `Yahoo-Quote-${ticker}`, `현재가: $${quote.currentPrice}`);
          } else {
            this.logResult('❌', 'FAIL', `Yahoo-Quote-${ticker}`, '유효한 데이터를 받지 못함');
          }
        }

        // 기술적 분석 테스트 (유효한 티커만)
        if (ticker !== 'INVALID_TICKER') {
          const analysis = await yahooFinanceService.getTechnicalAnalysis(ticker);
          if (analysis && analysis.signal) {
            this.logResult('✅', 'PASS', `Yahoo-Analysis-${ticker}`, `분석 신호: ${analysis.signal}`);
          } else {
            this.logResult('❌', 'FAIL', `Yahoo-Analysis-${ticker}`, '기술적 분석 실패');
          }
        }

        await this.delay(500); // API 부하 방지
      } catch (error) {
        this.logResult('❌', 'FAIL', `Yahoo-${ticker}`, error.message);
      }
    }
  }

  // AI 서비스 테스트
  async testAIService() {
    console.log('🤖 AI 서비스 테스트...');
    
    try {
      // API 상태 확인
      const status = await this.aiService.checkApiStatus();
      this.logResult('ℹ️', 'INFO', 'AI-Status', `모델: ${status.model || 'Unknown'}, 상태: ${status.status || 'Unknown'}`);

      // 센티멘트 분석 테스트
      const sentiment = await this.aiService.analyzeSentiment('NVDA', {});
      if (sentiment && sentiment.sentiment) {
        this.logResult('✅', 'PASS', 'AI-Sentiment', `센티멘트: ${sentiment.sentiment}, 신뢰도: ${(sentiment.confidence * 100).toFixed(1)}%`);
      } else {
        this.logResult('❌', 'FAIL', 'AI-Sentiment', '센티멘트 분석 실패');
      }

      // 주식 추천 테스트
      const recommendations = await this.aiService.getStockRecommendations(['NVDA', 'MSFT'], {});
      if (recommendations && recommendations.recommendations && recommendations.recommendations.length > 0) {
        this.logResult('✅', 'PASS', 'AI-Recommendations', `${recommendations.recommendations.length}개 추천 생성`);
      } else {
        this.logResult('❌', 'FAIL', 'AI-Recommendations', '주식 추천 실패');
      }

    } catch (error) {
      this.logResult('❌', 'FAIL', 'AI-Service', error.message);
    }
  }

  // 뉴스 서비스 테스트
  async testNewsServices() {
    console.log('📰 뉴스 서비스 테스트...');
    
    try {
      // 뉴스 API 서비스 테스트
      const stockNews = await this.newsApiService.getStockNews('NVDA', 3);
      if (stockNews && stockNews.news && stockNews.news.length > 0) {
        this.logResult('✅', 'PASS', 'News-Stock', `NVDA 뉴스 ${stockNews.news.length}개 수집`);
      } else {
        this.logResult('⚠️', 'WARN', 'News-Stock', '종목 뉴스 수집 제한적');
      }

      const marketNews = await this.newsApiService.getMarketNews(3);
      if (marketNews && marketNews.news && marketNews.news.length > 0) {
        this.logResult('✅', 'PASS', 'News-Market', `시장 뉴스 ${marketNews.news.length}개 생성`);
      } else {
        this.logResult('❌', 'FAIL', 'News-Market', '시장 뉴스 생성 실패');
      }

      // 뉴스 기반 시기별 분석 테스트
      const currentMonth = new Date().getMonth();
      const seasonalAnalysis = await this.newsSeasonalAnalyzer.analyzeNewsSeasonalScore('NVDA', currentMonth);
      if (seasonalAnalysis && seasonalAnalysis.seasonalScore !== undefined) {
        this.logResult('✅', 'PASS', 'News-Seasonal', `시기별 점수: ${seasonalAnalysis.seasonalScore}, 신뢰도: ${seasonalAnalysis.confidence}`);
      } else {
        this.logResult('❌', 'FAIL', 'News-Seasonal', '뉴스 기반 시기별 분석 실패');
      }

    } catch (error) {
      this.logResult('❌', 'FAIL', 'News-Services', error.message);
    }
  }

  // 통합 추천 시스템 테스트
  async testIntegratedRecommendationSystem() {
    console.log('🎯 통합 추천 시스템 테스트...');
    
    try {
      const currentMonth = new Date().getMonth();
      
      // 개별 종목 분석 테스트
      const stockAnalysis = await investmentRecommendationService.analyzeStockForMonth('NVDA', currentMonth);
      if (stockAnalysis && stockAnalysis.totalScore !== undefined) {
        this.logResult('✅', 'PASS', 'Recommendation-Single', 
          `NVDA 총점: ${stockAnalysis.totalScore}, 추천: ${stockAnalysis.recommendation}`);
      } else {
        this.logResult('❌', 'FAIL', 'Recommendation-Single', '개별 종목 분석 실패');
      }

      // 월별 추천 시스템 테스트 (소규모)
      const monthlyRec = await investmentRecommendationService.getMonthlyRecommendations(['NVDA', 'MSFT', 'AAPL']);
      if (monthlyRec && monthlyRec.recommendations && monthlyRec.recommendations.length > 0) {
        this.logResult('✅', 'PASS', 'Recommendation-Monthly', 
          `${monthlyRec.month} 추천 ${monthlyRec.recommendations.length}개 종목`);
      } else {
        this.logResult('❌', 'FAIL', 'Recommendation-Monthly', '월별 추천 시스템 실패');
      }

      // 섹터별 추천 테스트
      const sectorRec = await investmentRecommendationService.getSectorRecommendations('ai');
      if (sectorRec && sectorRec.recommendations && sectorRec.recommendations.length > 0) {
        this.logResult('✅', 'PASS', 'Recommendation-Sector', 
          `AI 섹터 추천 ${sectorRec.recommendations.length}개 종목`);
      } else {
        this.logResult('❌', 'FAIL', 'Recommendation-Sector', '섹터별 추천 실패');
      }

    } catch (error) {
      this.logResult('❌', 'FAIL', 'Integrated-System', error.message);
    }
  }

  // 성능 테스트
  async testPerformance() {
    console.log('⚡ 성능 테스트...');
    
    try {
      const startTime = Date.now();
      
      // 동시 API 호출 테스트
      const promises = [
        yahooFinanceService.getQuoteSummary('NVDA'),
        yahooFinanceService.getQuoteSummary('MSFT'),
        this.aiService.analyzeSentiment('AAPL', {})
      ];
      
      const results = await Promise.allSettled(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      const successCount = results.filter(r => r.status === 'fulfilled').length;
      
      if (duration < 10000) { // 10초 이내
        this.logResult('✅', 'PASS', 'Performance-Speed', `병렬 처리 ${duration}ms (${successCount}/${results.length} 성공)`);
      } else {
        this.logResult('⚠️', 'WARN', 'Performance-Speed', `병렬 처리 ${duration}ms - 느림`);
      }

      // 메모리 사용량 체크
      const memUsage = process.memoryUsage();
      const memMB = Math.round(memUsage.heapUsed / 1024 / 1024);
      
      if (memMB < 100) {
        this.logResult('✅', 'PASS', 'Performance-Memory', `메모리 사용량: ${memMB}MB`);
      } else {
        this.logResult('⚠️', 'WARN', 'Performance-Memory', `메모리 사용량: ${memMB}MB - 높음`);
      }

    } catch (error) {
      this.logResult('❌', 'FAIL', 'Performance', error.message);
    }
  }

  // 결과 로깅
  logResult(icon, status, component, message) {
    const timestamp = new Date().toLocaleTimeString('ko-KR');
    console.log(`${icon} [${timestamp}] ${component}: ${message}`);
    
    this.testResults.details.push({
      timestamp,
      status,
      component,
      message,
      icon
    });
    
    switch (status) {
      case 'PASS':
        this.testResults.passed++;
        break;
      case 'FAIL':
      case 'CRITICAL':
        this.testResults.failed++;
        break;
      case 'WARN':
        this.testResults.warnings++;
        break;
    }
  }

  // 최종 요약 출력
  printSummary(duration) {
    console.log('\n' + '=' .repeat(60));
    console.log('📋 테스트 결과 요약');
    console.log('=' .repeat(60));
    
    console.log(`🕐 실행 시간: ${(duration / 1000).toFixed(2)}초`);
    console.log(`✅ 성공: ${this.testResults.passed}개`);
    console.log(`❌ 실패: ${this.testResults.failed}개`);
    console.log(`⚠️ 경고: ${this.testResults.warnings}개`);
    
    const totalTests = this.testResults.passed + this.testResults.failed + this.testResults.warnings;
    const successRate = totalTests > 0 ? (this.testResults.passed / totalTests * 100).toFixed(1) : 0;
    
    console.log(`📊 성공률: ${successRate}%`);
    
    if (this.testResults.failed === 0) {
      console.log('\n🎉 모든 핵심 기능이 정상 작동합니다!');
    } else if (this.testResults.failed <= 2) {
      console.log('\n⚠️ 일부 기능에 문제가 있지만 프로그램은 사용 가능합니다.');
    } else {
      console.log('\n🚨 여러 기능에 문제가 있습니다. 점검이 필요합니다.');
    }
    
    // 환경 정보
    console.log('\n📋 환경 정보:');
    console.log(`- Node.js: ${process.version}`);
    console.log(`- 플랫폼: ${process.platform}`);
    console.log(`- Hugging Face API: ${process.env.HUGGINGFACE_API_KEY ? '설정됨' : '미설정'}`);
    console.log(`- DeepSeek API: ${process.env.DEEPSEEK_API_KEY ? '설정됨' : '미설정'}`);
    
    console.log('\n💡 사용법:');
    console.log('- 개발 서버: npm start');
    console.log('- 프로덕션: npm run prod');
    console.log('- 웹 접속: http://localhost:3000');
  }

  // 지연 함수
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 메인 실행
if (require.main === module) {
  const tester = new FunctionalityTester();
  tester.runAllTests().catch(console.error);
}

module.exports = FunctionalityTester;
