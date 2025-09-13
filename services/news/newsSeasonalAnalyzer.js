// News-based Seasonal Analyzer - 최신 뉴스 기반 시기별 점수 분석
const SimpleAIService = require('../ai/simpleAIService');
const NewsApiService = require('./newsApiService');
const seasonalScoreCache = require('../seasonalScoreCache');

class NewsSeasonalAnalyzer {
  constructor() {
    this.aiService = new SimpleAIService();
    this.newsApiService = new NewsApiService();
    
    // 분석 결과 캐싱 (5분)
    this.analysisCache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5분
    
    // 계절별 기본 가중치 (Historical Patterns)
    this.seasonalWeights = {
      // 월별 기본 패턴 (0-11)
      0: { tech: 0.75, growth: 0.8, defensive: 0.5 }, // 1월 - 신년 효과
      1: { tech: 0.65, growth: 0.7, defensive: 0.6 }, // 2월
      2: { tech: 0.6, growth: 0.65, defensive: 0.7 }, // 3월 - 분기말
      3: { tech: 0.8, growth: 0.85, defensive: 0.5 }, // 4월 - 4월 효과
      4: { tech: 0.5, growth: 0.45, defensive: 0.8 }, // 5월 - Sell in May
      5: { tech: 0.55, growth: 0.5, defensive: 0.75 }, // 6월
      6: { tech: 0.6, growth: 0.55, defensive: 0.7 }, // 7월
      7: { tech: 0.45, growth: 0.4, defensive: 0.8 }, // 8월 - 여름 비수기
      8: { tech: 0.7, growth: 0.75, defensive: 0.6 }, // 9월 - 가을 랠리
      9: { tech: 0.75, growth: 0.8, defensive: 0.55 }, // 10월
      10: { tech: 0.85, growth: 0.9, defensive: 0.4 }, // 11월 - 연말 랠리
      11: { tech: 0.9, growth: 0.95, defensive: 0.3 } // 12월 - 산타 랠리
    };

    // 종목별 섹터 분류
    this.sectorMapping = {
      // AI/Tech Stocks
      'NVDA': 'tech', 'AMD': 'tech', 'AVGO': 'tech', 'GOOGL': 'tech', 'GOOG': 'tech',
      'MSFT': 'tech', 'META': 'tech', 'AAPL': 'tech', 'TSLA': 'tech', 'PLTR': 'tech',
      'CRWD': 'tech', 'PANW': 'tech', 'SNOW': 'tech', 'SMCI': 'tech', 'MRVL': 'tech',
      'AMZN': 'tech', 'ADBE': 'tech', 'NOW': 'tech', 'ISRG': 'tech', 'SNPS': 'tech',
      
      // Semiconductor Stocks
      'TSM': 'tech', 'ASML': 'tech', 'QCOM': 'tech', 'AMAT': 'tech', 'ARM': 'tech',
      'TXN': 'tech', 'INTC': 'tech', 'MU': 'tech', 'ADI': 'tech', 'NXPI': 'tech',
      
      // Growth Stocks
      'TEMP': 'growth', 'ROK': 'growth', 'BIDU': 'growth'
    };
  }

  /**
   * 종목별 최신 뉴스 기반 시기별 점수 계산
   */
  async analyzeNewsSeasonalScore(ticker, month) {
    try {
      console.log(`🔍 Analyzing seasonal score for ${ticker} in month ${month + 1}`);
      
      // 캐시 확인
      const cacheKey = `${ticker}_${month}`;
      const cached = this.analysisCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        console.log(`Using cached analysis for ${ticker}`);
        return {
          ...cached.data,
          fromCache: true,
          lastUpdated: cached.timestamp
        };
      }
      
      // 1. 기본 계절적 점수 계산
      const baseSeasonalScore = this.calculateBaseSeasonalScore(ticker, month);
      
      // 2. 실제 뉴스 데이터 수집
      const stockNews = await this.newsApiService.getStockNews(ticker, 5);
      const marketNews = await this.newsApiService.getMarketNews(3);
      
      // 3. 뉴스 기반 감정 분석
      const newsImpact = await this.analyzeRealNews(ticker, stockNews);
      const marketSentiment = await this.analyzeMarketNews(marketNews);
      
      // 4. 종합 시기별 점수 계산 (뉴스 + 시장 센티멘트 + 역사적 패턴)
      const finalSeasonalScore = this.calculateFinalSeasonalScore(
        baseSeasonalScore,
        newsImpact,
        marketSentiment,
        month
      );
      
      // 5. 뉴스 기반 시기별 인사이트 생성
      const insights = await this.generateNewsBasedInsights(ticker, month, newsImpact, marketSentiment, stockNews, marketNews);
      
      const result = {
        ticker,
        month: month + 1,
        seasonalScore: Math.round(finalSeasonalScore * 100) / 100, // 통일된 점수 사용
        baseSeasonalScore,
        newsImpact: {
          ...newsImpact,
          relatedNews: stockNews.news.slice(0, 3) // 정보용
        },
        marketSentiment: {
          ...marketSentiment,
          relatedNews: marketNews.news.slice(0, 2) // 정보용
        },
        insights,
        recommendation: this.generateRecommendation(finalSeasonalScore), // 통일된 점수 기준
        confidence: this.calculateConfidence(newsImpact, marketSentiment),
        newsAnalysis: {
          totalNewsAnalyzed: stockNews.news.length + marketNews.news.length,
          stockNewsCount: stockNews.news.length,
          marketNewsCount: marketNews.news.length,
          averageRelevance: this.calculateAverageRelevance(stockNews, marketNews)
        },
        // AI 모델 정보 추가
        model: this.aiService.currentModel || 'cardiffnlp/twitter-roberta-base-sentiment',
        aiProvider: 'Hugging Face + Historical Pattern',
        lastUpdated: new Date().toISOString(),
        fromCache: false
      };
      
      // 캐시에 저장
      this.analysisCache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });
      
      // 점수를 전역 캐시에 저장 (계절적 분석에서 사용)
      seasonalScoreCache.setScore(ticker, month, result.seasonalScore);
      
      return result;
      
    } catch (error) {
      console.error(`❌ Error analyzing seasonal score for ${ticker}:`, error);
      
      // 에러 시 기본 계절적 점수만 반환
      const fallbackScore = this.calculateUnifiedSeasonalScore(ticker, month);
      return {
        ticker,
        month: month + 1,
        seasonalScore: fallbackScore,
        baseSeasonalScore: fallbackScore,
        newsImpact: { 
          sentiment: 'neutral', 
          confidence: 0.5, 
          impact: 0,
          relatedNews: []
        },
        marketSentiment: { 
          sentiment: 'neutral', 
          confidence: 0.5,
          relatedNews: []
        },
        insights: [`${ticker}에 대한 기본적인 ${this.getMonthName(month)} 계절 분석입니다.`],
        recommendation: this.generateRecommendation(fallbackScore),
        confidence: 0.8,
        newsAnalysis: {
          totalNewsAnalyzed: 0,
          stockNewsCount: 0,
          marketNewsCount: 0,
          averageRelevance: 0
        },
        // AI 모델 정보 추가 (에러 시에도)
        model: 'Seasonal Pattern Analysis (Fallback)',
        aiProvider: 'Historical Data',
        error: error.message,
        lastUpdated: new Date().toISOString(),
        fromCache: false
      };
    }
  }

  /**
   * 기본 계절적 점수 계산 (과거 패턴 기반)
   */
  calculateBaseSeasonalScore(ticker, month) {
    const sector = this.sectorMapping[ticker.toUpperCase()] || 'tech';
    const monthWeights = this.seasonalWeights[month];
    
    if (!monthWeights) {
      return 0.5; // 기본값
    }
    
    return monthWeights[sector] || 0.5;
  }

  /**
   * 통일된 계절적 점수 계삸 (모든 종목 동일 방식)
   * 모든 복잡한 요인 제거, 오직 월별 고정 점수만 사용
   */
  calculateUnifiedSeasonalScore(ticker, month) {
    // 모든 종목이 동일한 월별 점수를 받도록 통일
    const monthlyScores = {
      0: 0.75,  // 1월 - 신년 효과
      1: 0.65,  // 2월
      2: 0.60,  // 3월 - 분기말
      3: 0.80,  // 4월 - 4월 효과
      4: 0.50,  // 5월 - Sell in May
      5: 0.55,  // 6월
      6: 0.60,  // 7월
      7: 0.45,  // 8월 - 여름 비수기
      8: 0.70,  // 9월 - 가을 랠리
      9: 0.75,  // 10월
      10: 0.85, // 11월 - 연말 랠리
      11: 0.90  // 12월 - 산타 랠리
    };
    
    return monthlyScores[month] || 0.65; // 기본값
  }

  /**
   * 종합 시기별 점수 계산 (뉴스 + 시장 센티멘트 + 역사적 패턴)
   */
  calculateFinalSeasonalScore(baseScore, newsImpact, marketSentiment, month) {
    // 가중치 설정
    const weights = {
      base: 0.4,      // 기본 계절 패턴
      news: 0.35,     // 개별 종목 뉴스
      market: 0.25    // 시장 전반 뉴스
    };
    
    // 뉴스 영향도 점수화 (-1~1을 0~1로 변환)
    const newsScore = Math.max(0, Math.min(1, 0.5 + (newsImpact.score * 0.5)));
    
    // 시장 감정 점수화
    let marketScore = 0.5;
    if (marketSentiment.sentiment === 'positive') {
      marketScore = 0.6 + (marketSentiment.confidence * 0.4);
    } else if (marketSentiment.sentiment === 'negative') {
      marketScore = 0.4 - (marketSentiment.confidence * 0.4);
    }
    
    // 가중 평균으로 최종 점수 계산
    const finalScore = (
      baseScore * weights.base +
      newsScore * weights.news +
      marketScore * weights.market
    );
    
    // 신뢰도에 따른 조정
    const confidenceAdjustment = (newsImpact.confidence + marketSentiment.confidence) / 2;
    const adjustedScore = finalScore * (0.7 + confidenceAdjustment * 0.3);
    
    return Math.max(0, Math.min(1, adjustedScore));
  }
  generateSimpleInsights(ticker, month, seasonalScore) {
    const monthName = this.getMonthName(month);
    const insights = [];
    
    // 계절적 점수에 따른 기본 인사이트
    if (seasonalScore >= 0.8) {
      insights.push(`📈 ${monthName}은 역사적으로 ${ticker} 같은 기술주에게 매우 유리한 시기입니다.`);
      insights.push('💡 연말 랠리 또는 신년 효과로 인해 상승 모멘텀이 강할 가능성이 높습니다.');
    } else if (seasonalScore >= 0.65) {
      insights.push(`📈 ${monthName}은 ${ticker}에게 비교적 좋은 시기로 평가됩니다.`);
      insights.push('📋 계절적 패턴을 고려한 적극적 투자를 검토해볼 수 있습니다.');
    } else if (seasonalScore >= 0.5) {
      insights.push(`📋 ${monthName}은 ${ticker}에게 중립적인 시기입니다.`);
      insights.push('🔍 다른 투자 요인들을 종합적으로 고려하여 결정하세요.');
    } else {
      insights.push(`⚠️ ${monthName}은 역사적으로 ${ticker}에게 주의가 필요한 시기입니다.`);
      insights.push('📊 여름 비수기 또는 시장 조정 가능성을 고려하여 신중한 접근이 필요합니다.');
    }
    
    // 월별 특성 추가
    const monthlyTrends = {
      0: '신년 효과로 소형주와 성장주가 강세를 보이는 시기입니다.', // 1월
      1: '실적 발표 시즌으로 단기 변동성이 증가할 수 있습니다.', // 2월
      2: '분기말 효과로 기관 리밸런싱이 예상되는 시기입니다.', // 3월
      3: '4월 효과로 역사적으로 주식 시장이 강세를 보이는 구간입니다.', // 4월
      4: 'Sell in May 격언에 따라 주의가 필요한 시기입니다.', // 5월
      5: '여름체 비수기 진입으로 저평가 가치주 발굴 기회입니다.', // 6월
      6: '분기 실적 시즌 임박으로 실적 기대치 점검이 중요합니다.', // 7월
      7: '여름 휴가체로 거래량 감소와 변동성 확대가 가능합니다.', // 8월
      8: '가을 시즌 시작으로 연말까지 상승 랠리를 기대할 수 있습니다.', // 9월
      9: '분기 실적 시즌으로 연말 전망이 중요한 시점입니다.', // 10월
      10: '연말 정산 효과와 연말 랠리가 경합하는 시기입니다.', // 11월
      11: '산타 랠리 시즌으로 소형주와 성장주 선호도가 증가합니다.' // 12월
    };
    
    if (monthlyTrends[month]) {
      insights.push(`📅 ${monthlyTrends[month]}`);
    }
    
    return insights;
  }
  /**
   * 실제 뉴스 데이터 기반 감정 분석 (정보용)
   */
  async analyzeRealNews(ticker, stockNewsData) {
    try {
      console.log(`📰 Analyzing ${stockNewsData.news.length} real news items for ${ticker}`);
      
      if (!stockNewsData.news || stockNewsData.news.length === 0) {
        return {
          sentiment: 'neutral',
          score: 0,
          confidence: 0.5,
          impact: 0,
          keyFactors: [`${ticker} 관련 뉴스 분석 불가`],
          source: 'No News Available'
        };
      }

      // 뉴스 제목들의 감정 분석
      let positiveCount = 0;
      let negativeCount = 0;
      let totalRelevance = 0;
      const keyFactors = [];
      
      stockNewsData.news.forEach(newsItem => {
        const sentiment = newsItem.sentiment || this.analyzeTitleSentiment(newsItem.title);
        const relevance = newsItem.relevanceScore || 0.7;
        
        if (sentiment === 'positive') {
          positiveCount += relevance;
        } else if (sentiment === 'negative') {
          negativeCount += relevance;
        }
        
        totalRelevance += relevance;
        
        // 주요 요인 추출
        if (newsItem.title && newsItem.title.length > 10) {
          keyFactors.push(newsItem.title.substring(0, 50) + (newsItem.title.length > 50 ? '...' : ''));
        }
      });
      
      // 전체적인 감정 결정
      let overallSentiment = 'neutral';
      let sentimentScore = 0;
      let confidence = Math.min(totalRelevance / stockNewsData.news.length, 1.0);
      
      if (positiveCount > negativeCount * 1.2) {
        overallSentiment = 'positive';
        sentimentScore = (positiveCount - negativeCount) / totalRelevance;
      } else if (negativeCount > positiveCount * 1.2) {
        overallSentiment = 'negative';
        sentimentScore = -(negativeCount - positiveCount) / totalRelevance;
      }
      
      return {
        sentiment: overallSentiment,
        score: Math.max(-1, Math.min(1, sentimentScore)), // -1 ~ 1 범위로 제한
        confidence: confidence,
        impact: this.calculateNewsImpact(sentimentScore),
        keyFactors: keyFactors.slice(0, 5), // 상위 5개 요인
        source: `Real News Analysis (${stockNewsData.news.length} items)`,
        newsCount: stockNewsData.news.length,
        sourceBreakdown: this.getNewsSourceBreakdown(stockNewsData.news)
      };
      
    } catch (error) {
      console.error(`Error analyzing real news for ${ticker}:`, error);
      return {
        sentiment: 'neutral',
        score: 0,
        confidence: 0.5,
        impact: 0,
        keyFactors: ['뉴스 분석 중 오류 발생'],
        source: 'Error'
      };
    }
  }

  /**
   * 시장 전반적 뉴스 분석 (실제 뉴스 데이터 사용)
   */
  async analyzeMarketNews(marketNewsData) {
    try {
      console.log(`🌍 Analyzing ${marketNewsData?.news?.length || 0} market news items`);
      
      if (!marketNewsData || !marketNewsData.news || marketNewsData.news.length === 0) {
        return {
          sentiment: 'neutral',
          confidence: 0.5,
          keyThemes: ['시장 뉴스 분석 불가'],
          source: 'No Market News'
        };
      }

      let positiveCount = 0;
      let negativeCount = 0;
      const keyThemes = [];
      let totalRelevance = 0;
      
      marketNewsData.news.forEach(newsItem => {
        const sentiment = newsItem.sentiment || this.analyzeTitleSentiment(newsItem.title);
        const relevance = newsItem.relevanceScore || 0.8;
        
        if (sentiment === 'positive') {
          positiveCount += relevance;
        } else if (sentiment === 'negative') {
          negativeCount += relevance;
        }
        
        totalRelevance += relevance;
        
        // 주요 테마 추출
        if (newsItem.title) {
          keyThemes.push(newsItem.title.substring(0, 40) + (newsItem.title.length > 40 ? '...' : ''));
        }
      });
      
      let overallSentiment = 'neutral';
      let confidence = Math.min(totalRelevance / marketNewsData.news.length, 1.0);
      
      if (positiveCount > negativeCount * 1.1) {
        overallSentiment = 'positive';
      } else if (negativeCount > positiveCount * 1.1) {
        overallSentiment = 'negative';
      }
      
      return {
        sentiment: overallSentiment,
        confidence: confidence,
        keyThemes: keyThemes.slice(0, 4), // 상위 4개 테마
        source: `Market News Analysis (${marketNewsData.news.length} items)`,
        newsCount: marketNewsData.news.length,
        sentimentBreakdown: {
          positive: positiveCount,
          negative: negativeCount,
          neutral: totalRelevance - positiveCount - negativeCount
        }
      };
      
    } catch (error) {
      console.error('Error analyzing market news:', error);
      return {
        sentiment: 'neutral',
        confidence: 0.5,
        keyThemes: ['시장 분석 중 오류 발생'],
        source: 'Error'
      };
    }
  }

  /**
   * 뉴스 기반 시기별 인사이트 생성
   */
  async generateNewsBasedInsights(ticker, month, newsImpact, marketSentiment, stockNews, marketNews) {
    try {
      const monthName = this.getMonthName(month);
      const sector = this.sectorMapping[ticker.toUpperCase()] || 'tech';
      const insights = [];
      
      // 뉴스 기반 인사이트 생성
      if (newsImpact.keyFactors && newsImpact.keyFactors.length > 0) {
        insights.push(`📰 최신 뉴스: ${newsImpact.keyFactors[0]}`);
      }
      
      // 계절적 + 뉴스 센티멘트 조합 인사이트
      if (newsImpact.sentiment === 'positive' && this.getSeasonalTrend(month, sector) === '유리한') {
        insights.push(`🔥 ${monthName}은 ${sector} 섹터에 유리한 시기이며, 최근 뉴스도 긍정적입니다.`);
      } else if (newsImpact.sentiment === 'negative') {
        insights.push(`⚠️ 최근 뉴스가 부정적이므로 ${monthName} 투자 시 신중한 접근이 필요합니다.`);
      }
      
      // 시장 전반 분위기 인사이트
      if (marketSentiment.keyThemes && marketSentiment.keyThemes.length > 0) {
        insights.push(`🌍 시장 이슈: ${marketSentiment.keyThemes[0]}`);
      }
      
      // 뉴스 개수 기반 인사이트
      const totalNewsCount = stockNews.news.length + marketNews.news.length;
      if (totalNewsCount >= 5) {
        insights.push(`📊 ${totalNewsCount}개 뉴스를 분석한 결과, ${newsImpact.confidence > 0.7 ? '높은' : '보통'} 신뢰도의 분석입니다.`);
      }
      
      // 구체적인 투자 조언
      if (newsImpact.sentiment === 'positive' && marketSentiment.sentiment === 'positive') {
        insights.push(`💡 종목 및 시장 뉴스가 모두 긍정적이므로 적극적 투자를 고려해볼 수 있습니다.`);
      } else if (newsImpact.sentiment === 'negative' || marketSentiment.sentiment === 'negative') {
        insights.push(`🔍 부정적인 뉴스 요인이 있으므로 추가 정보 확인 후 투자 결정을 권장합니다.`);
      }
      
      return insights.length > 0 ? insights : [
        `${monthName}에 대한 뉴스 기반 시기적 분석을 완료했습니다.`,
        `${ticker} 종목의 최신 동향을 지속적으로 모니터링하세요.`
      ];
      
    } catch (error) {
      console.error('Error generating news-based insights:', error);
      return [
        `${this.getMonthName(month)}에 대한 기본적인 분석을 제공합니다.`,
        `뉴스 기반 인사이트 생성 중 오류가 발생했습니다.`
      ];
    }
  }

  /**
   * 종합 시기별 점수 계산
   */
  calculateFinalSeasonalScore(baseScore, newsImpact, marketSentiment, month) {
    // 가중치 설정
    const weights = {
      base: 0.4,      // 기본 계절 패턴
      news: 0.35,     // 개별 종목 뉴스
      market: 0.25    // 시장 전반 뉴스
    };
    
    // 뉴스 영향도 점수화 (-1~1을 0~1로 변환)
    const newsScore = Math.max(0, Math.min(1, 0.5 + (newsImpact.score * 0.5)));
    
    // 시장 감정 점수화
    let marketScore = 0.5;
    if (marketSentiment.sentiment === 'positive') {
      marketScore = 0.6 + (marketSentiment.confidence * 0.4);
    } else if (marketSentiment.sentiment === 'negative') {
      marketScore = 0.4 - (marketSentiment.confidence * 0.4);
    }
    
    // 가중 평균으로 최종 점수 계산
    const finalScore = (
      baseScore * weights.base +
      newsScore * weights.news +
      marketScore * weights.market
    );
    
    // 신뢰도에 따른 조정
    const confidenceAdjustment = (newsImpact.confidence + marketSentiment.confidence) / 2;
    const adjustedScore = finalScore * (0.7 + confidenceAdjustment * 0.3);
    
    return Math.max(0, Math.min(1, adjustedScore));
  }

  /**
   * 시기별 인사이트 생성
   */
  async generateSeasonalInsights(ticker, month, newsImpact, marketSentiment) {
    try {
      const monthName = this.getMonthName(month);
      const sector = this.sectorMapping[ticker.toUpperCase()] || 'tech';
      
      const prompt = `Generate Korean investment insights for ${ticker} in ${monthName} based on:
      Seasonal Pattern: ${sector} stocks in ${monthName}
      Recent News: ${newsImpact.sentiment} 
      Market: ${marketSentiment.sentiment}
      
      Provide 3-4 actionable Korean insights about timing and opportunities.`;
      
      const response = await this.aiService.generateInsight(prompt);
      const insights = this.parseInsights(response);
      
      return insights.length > 0 ? insights : [
        `${monthName}은 ${sector} 섹터에 ${this.getSeasonalTrend(month, sector)} 시기입니다.`,
        `현재 뉴스 감정은 ${this.translateSentiment(newsImpact.sentiment)}이므로 ${this.getSentimentAdvice(newsImpact.sentiment)}`,
        `시장 전반적으로는 ${this.translateSentiment(marketSentiment.sentiment)} 분위기입니다.`
      ];
      
    } catch (error) {
      console.error('Error generating insights:', error);
      const monthName = this.getMonthName(month);
      return [
        `${monthName}에 대한 기본적인 계절 분석을 제공합니다.`,
        `${ticker} 종목의 최신 동향을 주의 깊게 모니터링하세요.`
      ];
    }
  }

  // Helper 메소드들
  
  /**
   * 제목 기반 감정 분석
   */
  analyzeTitleSentiment(title) {
    if (!title) return 'neutral';

    const positiveWords = ['up', 'rise', 'gain', 'bull', 'strong', 'beat', 'exceed', 'growth', 'positive', '상승', '강세', '성장', '긍정', 'surge', 'soar', 'jump'];
    const negativeWords = ['down', 'fall', 'drop', 'bear', 'weak', 'miss', 'decline', 'loss', 'negative', '하락', '약세', '감소', '부정', 'crash', 'plunge', 'tumble'];

    const lowerTitle = title.toLowerCase();
    
    const positiveCount = positiveWords.filter(word => lowerTitle.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerTitle.includes(word)).length;

    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  /**
   * 뉴스 소스 분석
   */
  getNewsSourceBreakdown(newsItems) {
    const sources = {};
    newsItems.forEach(item => {
      const source = item.source || 'Unknown';
      sources[source] = (sources[source] || 0) + 1;
    });
    return sources;
  }

  /**
   * 평균 관련성 점수 계산
   */
  calculateAverageRelevance(stockNews, marketNews) {
    const allNews = [...stockNews.news, ...marketNews.news];
    if (allNews.length === 0) return 0;
    
    const totalRelevance = allNews.reduce((sum, news) => sum + (news.relevanceScore || 0.7), 0);
    return Math.round((totalRelevance / allNews.length) * 100) / 100;
  }

  /**
   * 캐시 관리 메서드들
   */
  clearAnalysisCache() {
    this.analysisCache.clear();
    this.newsApiService.clearCache();
    console.log('All analysis caches cleared');
  }

  getCacheStatus() {
    return {
      analysisCache: {
        size: this.analysisCache.size,
        timeout: this.cacheTimeout,
        items: Array.from(this.analysisCache.keys())
      },
      newsCache: this.newsApiService.getCacheStatus()
    };
  }
  parseNewsResponse(response) {
    try {
      if (typeof response === 'string') {
        const jsonMatch = response.match(/\{[^{}]*\}/g);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[jsonMatch.length - 1]);
        }
        const sentiment = response.toLowerCase().includes('positive') ? 'positive' :
                         response.toLowerCase().includes('negative') ? 'negative' : 'neutral';
        return { sentiment, score: 0, confidence: 0.5 };
      }
      return response || {};
    } catch (error) {
      console.error('Error parsing news response:', error);
      return { sentiment: 'neutral', score: 0, confidence: 0.5 };
    }
  }

  calculateNewsImpact(score) {
    return Math.abs(score) * 0.3; // 최대 30% 영향
  }

  generateRecommendation(score) {
    if (score >= 0.75) return '강력 추천';
    if (score >= 0.6) return '추천';
    if (score >= 0.4) return '보통';
    return '주의';
  }

  calculateConfidence(newsImpact, marketSentiment) {
    return (newsImpact.confidence + marketSentiment.confidence) / 2;
  }

  getMonthName(month) {
    const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월',
                       '7월', '8월', '9월', '10월', '11월', '12월'];
    return monthNames[month] || '월';
  }

  getSeasonalTrend(month, sector) {
    const score = this.seasonalWeights[month]?.[sector] || 0.5;
    if (score >= 0.7) return '유리한';
    if (score >= 0.5) return '보통의';
    return '불리한';
  }

  translateSentiment(sentiment) {
    const translations = {
      'positive': '긍정적',
      'negative': '부정적', 
      'neutral': '중립적'
    };
    return translations[sentiment] || '중립적';
  }

  getSentimentAdvice(sentiment) {
    const advice = {
      'positive': '적극적인 투자를 고려해볼 수 있습니다.',
      'negative': '신중한 접근이 필요합니다.',
      'neutral': '균형잡힌 접근이 적절합니다.'
    };
    return advice[sentiment] || '시장 상황을 면밀히 관찰하세요.';
  }

  parseInsights(response) {
    try {
      if (typeof response !== 'string') {
        return ['AI 인사이트 생성 중 오류가 발생했습니다.'];
      }

      const sentences = response
        .split(/[.!?\n]/) 
        .map(s => s.trim())
        .filter(s => s.length > 10 && !s.includes('AI') && !s.includes('분석'))
        .slice(0, 4);

      return sentences.length > 0 ? sentences : ['종합적인 시장 분석이 필요합니다.'];
    } catch (error) {
      console.error('Error parsing insights:', error);
      return ['인사이트 분석 중 오류가 발생했습니다.'];
    }
  }

  /**
   * 뉴스 기반 시기별 인사이트 생성
   */
  async generateNewsBasedInsights(ticker, month, newsImpact, marketSentiment, stockNews, marketNews) {
    try {
      const monthName = this.getMonthName(month);
      const insights = [];
      
      // 뉴스 기반 인사이트 생성
      if (newsImpact.keyFactors && newsImpact.keyFactors.length > 0) {
        insights.push(`📰 최신 뉴스: ${newsImpact.keyFactors[0]}`);
      }
      
      // 계절적 + 뉴스 센티멘트 조합 인사이트
      if (newsImpact.sentiment === 'positive') {
        insights.push(`🔥 ${monthName}은 계절적으로 유리하며, 최근 뉴스도 긍정적입니다.`);
      } else if (newsImpact.sentiment === 'negative') {
        insights.push(`⚠️ 최근 뉴스가 부정적이므로 ${monthName} 투자 시 신중한 접근이 필요합니다.`);
      }
      
      // 시장 전반 분위기 인사이트
      if (marketSentiment.keyThemes && marketSentiment.keyThemes.length > 0) {
        insights.push(`🌍 시장 이슈: ${marketSentiment.keyThemes[0]}`);
      }
      
      return insights.length > 0 ? insights : [
        `${monthName}에 대한 뉴스 기반 시기적 분석을 완료했습니다.`,
        `${ticker} 종목의 최신 동향을 지속적으로 모니터링하세요.`
      ];
      
    } catch (error) {
      console.error('Error generating news-based insights:', error);
      return [
        `${this.getMonthName(month)}에 대한 기본적인 분석을 제공합니다.`,
        `뉴스 기반 인사이트 생성 중 오류가 발생했습니다.`
      ];
    }
  }

  /**
   * 시장 뉴스 분석
   */
  async analyzeMarketNews(marketNewsData) {
    try {
      if (!marketNewsData.news || marketNewsData.news.length === 0) {
        return {
          sentiment: 'neutral',
          confidence: 0.5,
          keyThemes: ['시장 뉴스 분석 불가'],
          source: 'No Market News Available'
        };
      }

      let positiveCount = 0;
      let negativeCount = 0;
      const keyThemes = [];
      
      marketNewsData.news.forEach(newsItem => {
        const sentiment = newsItem.sentiment || this.analyzeTitleSentiment(newsItem.title);
        
        if (sentiment === 'positive') positiveCount++;
        else if (sentiment === 'negative') negativeCount++;
        
        // 주요 테마 추출
        if (newsItem.title && keyThemes.length < 2) {
          keyThemes.push(newsItem.title.substring(0, 50));
        }
      });
      
      const totalNews = marketNewsData.news.length;
      let overallSentiment = 'neutral';
      let confidence = 0.5;
      
      if (positiveCount > negativeCount) {
        overallSentiment = 'positive';
        confidence = Math.min(0.9, 0.5 + (positiveCount / totalNews) * 0.4);
      } else if (negativeCount > positiveCount) {
        overallSentiment = 'negative';
        confidence = Math.min(0.9, 0.5 + (negativeCount / totalNews) * 0.4);
      }
      
      return {
        sentiment: overallSentiment,
        confidence: Math.round(confidence * 100) / 100,
        keyThemes: keyThemes.length > 0 ? keyThemes : ['시장 전반 동향'],
        totalAnalyzed: totalNews,
        sentimentBreakdown: {
          positive: positiveCount,
          negative: negativeCount,
          neutral: totalNews - positiveCount - negativeCount
        },
        source: 'Market News Analysis'
      };
      
    } catch (error) {
      console.error('Error analyzing market news:', error);
      return {
        sentiment: 'neutral',
        confidence: 0.5,
        keyThemes: ['시장 분석 오류'],
        error: error.message
      };
    }
  }
}

module.exports = NewsSeasonalAnalyzer;