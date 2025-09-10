// Hugging Face 서비스 - FinBERT 모델을 사용하도록 최종 수정
class HuggingFaceService {
  constructor() {
    this.apiKey = process.env.HUGGINGFACE_API_KEY || '';
    this.baseUrl = 'https://api-inference.huggingface.co/models';
    
    // 금융 특화 모델인 FinBERT를 기본 모델로 지정
    this.model = 'ProsusAI/finbert';
  }

  // 상태 확인
  async checkApiStatus() {
    if (!this.apiKey) {
      return {
        status: 'not_configured',
        message: 'Hugging Face API key not configured'
      };
    }
    try {
      const response = await this.makeApiCall("test");
      return {
        status: response.ok ? 'connected' : 'error',
        message: response.ok ? `Connected to ${this.model}` : `API error: ${response.status}`
      };
    } catch (error) {
      return {
        status: 'error',
        message: error.message
      };
    }
  }

  // API 호출 로직
  async makeApiCall(inputs, timeout = 10000) {
    return await fetch(`${this.baseUrl}/${this.model}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ inputs }),
      signal: AbortSignal.timeout(timeout)
    });
  }

  // 센티멘트 분석 (FinBERT 사용)
  async analyzeSentiment(ticker, marketData = {}) {
    if (!this.apiKey) {
      return this.getMockSentiment(ticker);
    }

    try {
      const prompt = `Stock analysis for ${ticker}.`;
      const response = await this.makeApiCall(prompt);

      if (!response.ok) {
        // 503 에러는 모델 로딩 중이므로, mock 데이터 사용
        if (response.status === 503) {
          console.warn(`Model ${this.model} is loading, using mock data for ${ticker}.`);
          return this.getMockSentiment(ticker);
        }
        throw new Error(`API error: ${response.status}`);
      }

      const result = await response.json();
      return this.parseSentimentResult(result, ticker);
      
    } catch (error) {
      console.error(`AI analysis failed for ${ticker}, using mock:`, error.message);
      return this.getMockSentiment(ticker);
    }
  }

  // 결과 파싱 (안정성 대폭 강화)
  parseSentimentResult(result, ticker) {
    try {
      // FinBERT는 보통 [{ label: 'positive', score: 0.9 }] 형태의 배열을 반환
      if (Array.isArray(result) && result.length > 0 && Array.isArray(result[0])) {
        const scores = result[0];
        let sentiment = 'neutral';
        let confidence = 0.5;

        const positiveScore = scores.find(s => s && s.label && typeof s.label === 'string' && s.label.toLowerCase() === 'positive')?.score || 0;
        const negativeScore = scores.find(s => s && s.label && typeof s.label === 'string' && s.label.toLowerCase() === 'negative')?.score || 0;
        const neutralScore = scores.find(s => s && s.label && typeof s.label === 'string' && s.label.toLowerCase() === 'neutral')?.score || 0;

        if (positiveScore > negativeScore && positiveScore > neutralScore) {
          sentiment = 'positive';
          confidence = positiveScore;
        } else if (negativeScore > positiveScore && negativeScore > neutralScore) {
          sentiment = 'negative';
          confidence = negativeScore;
        } else {
          sentiment = 'neutral';
          confidence = neutralScore;
        }

        return {
          sentiment,
          confidence,
          recommendation: this.generateRecommendation(sentiment),
          reasoning: `FinBERT AI analysis for ${ticker}`,
          model: this.model,
          timestamp: new Date().toISOString()
        };
      }
    } catch (error) {
      console.error('Parse error:', error, 'Raw result:', JSON.stringify(result));
    }
    
    // 파싱 실패 시에도 Mock 데이터 반환
    console.warn(`Failed to parse AI response for ${ticker}, using mock.`);
    return this.getMockSentiment(ticker);
  }

  // Mock 센티멘트
  getMockSentiment(ticker) {
    const sentiments = ['positive', 'neutral', 'negative'];
    const sentiment = sentiments[Math.floor(Math.random() * sentiments.length)];
    
    return {
      sentiment,
      confidence: 0.5 + Math.random() * 0.2,
      recommendation: this.generateRecommendation(sentiment),
      reasoning: `Mock AI analysis for ${ticker}`,
      model: 'mock',
      timestamp: new Date().toISOString()
    };
  }

  // 추천 생성
  generateRecommendation(sentiment) {
    const recommendations = {
      positive: '긍정적 신호 - 매수 고려',
      neutral: '중립적 신호 - 관망',
      negative: '부정적 신호 - 주의'
    };
    return recommendations[sentiment] || recommendations.neutral;
  }

  // (사용하지 않는 함수, 단순화)
  async getStockRecommendations(stockData = [], marketConditions = {}) {
    return { recommendations: [], reasoning: 'Function not in use' };
  }
}

module.exports = new HuggingFaceService();
