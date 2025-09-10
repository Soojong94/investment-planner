// DeepSeek API 연동 서비스
const yahooFinanceService = require('../yahooFinanceService');

class DeepSeekService {
  constructor() {
    // 환경 변수에서 API 키를 가져오거나 기본값 설정
    this.apiKey = process.env.DEEPSEEK_API_KEY || '';
    this.baseUrl = 'https://api.deepseek.com/v1/chat/completions';
    this.model = 'deepseek-chat';
  }

  // API 요청 헬퍼 함수
  async makeRequest(messages, temperature = 0.7) {
    if (!this.apiKey) {
      throw new Error('DeepSeek API key not configured');
    }

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        messages: messages,
        temperature: temperature,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`DeepSeek API error: ${response.status} - ${errorText}`);
    }

    return await response.json();
  }

  // 시장 센티멘트 분석
  async analyzeSentiment(marketData = {}) {
    try {
      if (!this.apiKey) {
        return this.getMockSentiment();
      }

      const marketText = this.constructMarketText(marketData);
      
      const messages = [
        {
          role: "system",
          content: `당신은 전문적인 금융 분석가입니다. 제공된 시장 데이터를 바탕으로 시장 센티멘트를 분석해주세요.
          
응답 형식:
- sentiment: "positive", "negative", "neutral" 중 하나
- confidence: 0.0-1.0 사이의 신뢰도
- recommendation: 간단한 투자 조언 (50자 이내)
- reasoning: 분석 근거 (100자 이내)

JSON 형태로만 응답해주세요.`
        },
        {
          role: "user", 
          content: `다음 시장 상황을 분석해주세요:\n\n${marketText}`
        }
      ];

      const result = await this.makeRequest(messages, 0.3); // 낮은 temperature로 일관성 확보
      const analysis = this.parseSentimentResult(result);
      
      return {
        sentiment: analysis.sentiment,
        confidence: analysis.confidence,
        recommendation: analysis.recommendation,
        reasoning: analysis.reasoning,
        marketText: marketText,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error analyzing sentiment:', error);
      return this.getMockSentiment();
    }
  }

  // 시장 상황을 텍스트로 변환
  constructMarketText(marketData) {
    const currentDate = new Date().toLocaleDateString('ko-KR');
    let text = `${currentDate} 시장 분석:\n`;
    
    if (!marketData || Object.keys(marketData).length === 0) {
      // 기본 시장 상황 설명
      text += `
- 현재 미국 주식시장은 AI 및 기술주 중심의 상승세
- 연준의 금리 정책 변화에 따른 시장 변동성 존재
- 반도체 섹터는 AI 수요 증가로 주목받고 있음
- 지정학적 리스크와 인플레이션 우려가 혼재
- 기업 실적 발표 시즌에 따른 개별 종목 변동성 증가`;
    } else {
      // 실제 시장 데이터가 있다면 활용
      if (marketData.vixLevel) {
        text += `- VIX 지수: ${marketData.vixLevel} (${marketData.vixLevel > 20 ? '높은' : '낮은'} 변동성)\n`;
      }
      if (marketData.spyChange) {
        text += `- S&P 500 변동: ${marketData.spyChange > 0 ? '+' : ''}${marketData.spyChange}%\n`;
      }
      if (marketData.techPerformance) {
        text += `- 기술주 섹터 성과: ${marketData.techPerformance}\n`;
      }
    }
    
    return text;
  }

  // DeepSeek 응답 파싱
  parseSentimentResult(result) {
    try {
      const content = result.choices[0].message.content;
      // JSON 파싱 시도
      const parsed = JSON.parse(content);
      
      return {
        sentiment: this.normalizeSentimentLabel(parsed.sentiment),
        confidence: Math.max(0, Math.min(1, parsed.confidence || 0.5)),
        recommendation: parsed.recommendation || '시장 상황을 지켜보세요.',
        reasoning: parsed.reasoning || '종합적인 시장 분석 결과입니다.'
      };
    } catch (error) {
      console.error('Error parsing DeepSeek response:', error);
      // 파싱 실패 시 기본값 반환
      return {
        sentiment: 'neutral',
        confidence: 0.5,
        recommendation: '분석 결과를 파싱할 수 없습니다.',
        reasoning: 'API 응답 처리 중 오류가 발생했습니다.'
      };
    }
  }

  // 센티멘트 라벨 정규화
  normalizeSentimentLabel(label) {
    if (!label) return 'neutral';
    
    const normalized = label.toLowerCase();
    if (normalized.includes('positive') || normalized.includes('긍정')) return 'positive';
    if (normalized.includes('negative') || normalized.includes('부정')) return 'negative';
    return 'neutral';
  }

  // AI 기반 종목 추천
  async getStockRecommendations(stockData = [], marketConditions = {}) {
    try {
      if (!this.apiKey) {
        return this.getMockRecommendations();
      }

      // 현재 시장 상황 분석
      const sentiment = await this.analyzeSentiment(marketConditions);
      
      // 종목 데이터가 없다면 기본 종목들로 분석
      if (stockData.length === 0) {
        stockData = await this.getDefaultStocksForAnalysis();
      }

      // DeepSeek을 이용한 종목 분석
      const stockAnalysis = await this.analyzeStocksWithAI(stockData, sentiment);
      
      return {
        recommendations: stockAnalysis,
        sentiment: sentiment,
        reasoning: this.generateRecommendationReasoning(sentiment, stockAnalysis),
        riskLevel: this.determineRiskLevel(sentiment),
        timeHorizon: 'short-term',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting stock recommendations:', error);
      return this.getMockRecommendations();
    }
  }

  // DeepSeek을 이용한 종목 분석
  async analyzeStocksWithAI(stockList, sentiment) {
    try {
      const stocksText = stockList.slice(0, 10).join(', '); // 처음 10개만 분석
      
      const messages = [
        {
          role: "system",
          content: `당신은 전문 주식 분석가입니다. 현재 시장 센티멘트와 종목들을 고려하여 투자 추천을 해주세요.

응답 형식은 JSON 배열이어야 하며, 각 종목당 다음 형태여야 합니다:
[
  {
    "ticker": "NVDA",
    "score": 85,
    "signal": "Buy",
    "confidence": "High", 
    "reasoning": "AI 반도체 선도기업, 강한 수요 지속"
  }
]

점수는 0-100, signal은 Buy/Hold/Sell, confidence는 High/Moderate/Low로 해주세요.`
        },
        {
          role: "user",
          content: `현재 시장 센티멘트: ${sentiment.sentiment} (신뢰도: ${(sentiment.confidence * 100).toFixed(0)}%)
시장 상황: ${sentiment.reasoning}

분석할 종목들: ${stocksText}

각 종목에 대한 투자 추천을 JSON 형태로 제공해주세요.`
        }
      ];

      const result = await this.makeRequest(messages, 0.3);
      const analysis = this.parseStockAnalysis(result);
      
      return analysis.slice(0, 5); // 상위 5개만 반환
    } catch (error) {
      console.error('Error analyzing stocks with AI:', error);
      return this.getMockStockAnalysis();
    }
  }

  // 종목 분석 결과 파싱
  parseStockAnalysis(result) {
    try {
      const content = result.choices[0].message.content;
      // JSON 파싱 시도
      const parsed = JSON.parse(content);
      
      if (Array.isArray(parsed)) {
        return parsed.map(stock => ({
          ticker: stock.ticker,
          score: Math.max(0, Math.min(100, stock.score || 50)),
          signal: stock.signal || 'Hold',
          confidence: stock.confidence || 'Moderate',
          reasoning: stock.reasoning || 'AI 분석 결과'
        }));
      }
      
      return this.getMockStockAnalysis();
    } catch (error) {
      console.error('Error parsing stock analysis:', error);
      return this.getMockStockAnalysis();
    }
  }

  // 기본 종목들 가져오기
  async getDefaultStocksForAnalysis() {
    return ['NVDA', 'MSFT', 'GOOG', 'AMD', 'TSM', 'AVGO', 'AAPL', 'META', 'QCOM', 'INTC'];
  }

  // 추천 이유 생성
  generateRecommendationReasoning(sentiment, recommendations) {
    const marketCondition = sentiment.sentiment === 'positive' ? '긍정적' : 
                           sentiment.sentiment === 'negative' ? '부정적' : '중립적';
    
    return `현재 ${marketCondition}인 시장 분위기와 AI 분석을 종합하여 ${recommendations.length}개 종목을 추천합니다. ` +
           `${sentiment.reasoning}`;
  }

  // 리스크 레벨 결정
  determineRiskLevel(sentiment) {
    if (sentiment.confidence > 0.8) {
      return sentiment.sentiment === 'positive' ? 'medium' : 'low';
    } else if (sentiment.confidence > 0.6) {
      return 'medium';
    } else {
      return 'high';
    }
  }

  // Mock 센티멘트 (API 키 없을 때)
  getMockSentiment() {
    const sentiments = ['positive', 'neutral', 'negative'];
    const randomSentiment = sentiments[Math.floor(Math.random() * sentiments.length)];
    
    const recommendations = {
      positive: '시장이 강세를 보이고 있어 성장주 투자를 고려해보세요.',
      neutral: '시장이 중립적이니 분산투자로 리스크를 관리하세요.',
      negative: '시장이 약세이므로 방어적 포지션을 유지하세요.'
    };
    
    return {
      sentiment: randomSentiment,
      confidence: 0.65 + Math.random() * 0.25,
      recommendation: recommendations[randomSentiment],
      reasoning: 'Mock 분석 - API 키 설정 후 실제 분석 가능',
      marketText: "Mock 분석 - DeepSeek API 키가 설정되지 않음",
      timestamp: new Date().toISOString(),
      mock: true
    };
  }

  // Mock 추천 (API 키 없을 때)
  getMockRecommendations() {
    const mockStocks = [
      { ticker: 'NVDA', score: 85, signal: 'Buy', confidence: 'High', reasoning: 'AI 반도체 선도기업' },
      { ticker: 'MSFT', score: 78, signal: 'Buy', confidence: 'Moderate', reasoning: '클라우드 시장 확장' },
      { ticker: 'GOOGL', score: 72, signal: 'Hold', confidence: 'Moderate', reasoning: 'AI 기술 투자 지속' },
      { ticker: 'AMD', score: 68, signal: 'Buy', confidence: 'Moderate', reasoning: '데이터센터 수요 증가' },
      { ticker: 'TSM', score: 65, signal: 'Hold', confidence: 'High', reasoning: '반도체 파운드리 리더' }
    ];

    return {
      recommendations: mockStocks,
      sentiment: this.getMockSentiment(),
      reasoning: "Mock AI 분석 - DeepSeek API 키 설정 후 정확한 분석이 가능합니다.",
      riskLevel: 'medium',
      timeHorizon: 'short-term',
      timestamp: new Date().toISOString(),
      mock: true
    };
  }

  // Mock 종목 분석
  getMockStockAnalysis() {
    return [
      { ticker: 'NVDA', score: 85, signal: 'Buy', confidence: 'High', reasoning: 'AI 수요 폭증' },
      { ticker: 'MSFT', score: 78, signal: 'Buy', confidence: 'High', reasoning: 'Azure 성장' },
      { ticker: 'GOOG', score: 72, signal: 'Hold', confidence: 'Moderate', reasoning: 'AI 경쟁 심화' },
      { ticker: 'AMD', score: 68, signal: 'Buy', confidence: 'Moderate', reasoning: 'CPU 시장 회복' },
      { ticker: 'TSM', score: 65, signal: 'Hold', confidence: 'High', reasoning: '지정학적 리스크' }
    ];
  }

  // API 상태 확인
  async checkApiStatus() {
    if (!this.apiKey) {
      return {
        status: 'not_configured',
        message: 'DeepSeek API key not configured. Set DEEPSEEK_API_KEY environment variable.',
        mock_mode: true
      };
    }
    
    try {
      // 간단한 테스트 요청
      const messages = [
        {
          role: "user",
          content: "Hello, are you working?"
        }
      ];
      
      await this.makeRequest(messages);
      
      return {
        status: 'connected',
        message: 'DeepSeek API connected successfully',
        model: this.model
      };
    } catch (error) {
      return {
        status: 'error',
        message: `Connection failed: ${error.message}`,
        mock_mode: true
      };
    }
  }
}

module.exports = new DeepSeekService();
