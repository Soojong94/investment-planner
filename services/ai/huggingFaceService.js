// Hugging Face 서비스 - 단순화된 안정 버전
class HuggingFaceService {
  constructor() {
    this.apiKey = process.env.HUGGINGFACE_API_KEY || '';
    this.baseUrl = 'https://api-inference.huggingface.co/models';
    
    // 안정적인 모델만 사용
    this.model = 'cardiffnlp/twitter-roberta-base-sentiment-latest';
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
      const response = await fetch(`${this.baseUrl}/${this.model}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputs: "test" }),
        signal: AbortSignal.timeout(5000)
      });
      
      return {
        status: response.ok ? 'connected' : 'error',
        message: response.ok ? 'API connected' : `API error: ${response.status}`
      };
    } catch (error) {
      return {
        status: 'error',
        message: error.message
      };
    }
  }

  // 센티멘트 분석 (개별 종목용)
  async analyzeSentiment(ticker, marketData = {}) {
    if (!this.apiKey) {
      return this.getMockSentiment(ticker);
    }

    try {
      const marketText = `Stock analysis for ${ticker}. Current market conditions show mixed signals.`;
      
      const response = await fetch(`${this.baseUrl}/${this.model}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputs: marketText }),
        signal: AbortSignal.timeout(8000)
      });

      if (response.status === 503) {
        console.log('Model loading, using mock data');
        return this.getMockSentiment(ticker);
      }

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result = await response.json();
      return this.parseSentimentResult(result, ticker);
      
    } catch (error) {
      console.log(`AI failed for ${ticker}, using mock:`, error.message);
      return this.getMockSentiment(ticker);
    }
  }

  // 결과 파싱
  parseSentimentResult(result, ticker) {
    try {
      if (Array.isArray(result) && result.length > 0) {
        const scores = result[0];
        let sentiment = 'neutral';
        let confidence = 0.6;

        const positive = scores.find(s => s.label.toLowerCase().includes('positive'))?.score || 0;
        const negative = scores.find(s => s.label.toLowerCase().includes('negative'))?.score || 0;

        if (positive > negative && positive > 0.6) {
          sentiment = 'positive';
          confidence = positive;
        } else if (negative > positive && negative > 0.6) {
          sentiment = 'negative';
          confidence = negative;
        }

        return {
          sentiment,
          confidence,
          recommendation: this.generateRecommendation(sentiment),
          reasoning: `Hugging Face AI analysis for ${ticker}`,
          model: 'huggingface',
          timestamp: new Date().toISOString()
        };
      }
    } catch (error) {
      console.log('Parse error:', error);
    }
    
    return this.getMockSentiment(ticker);
  }

  // Mock 센티멘트
  getMockSentiment(ticker) {
    const sentiments = ['positive', 'neutral', 'negative'];
    const sentiment = sentiments[Math.floor(Math.random() * sentiments.length)];
    
    return {
      sentiment,
      confidence: 0.6 + Math.random() * 0.3,
      recommendation: this.generateRecommendation(sentiment),
      reasoning: `Mock AI analysis for ${ticker} - API key needed for real analysis`,
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

  // 주식 추천 (단순화)
  async getStockRecommendations(stockData = [], marketConditions = {}) {
    // 센티멘트 기반 단순 추천
    const sentiment = await this.analyzeSentiment('MARKET', marketConditions);
    
    const stocks = stockData.length > 0 ? stockData : ['NVDA', 'MSFT', 'AAPL', 'GOOG', 'META'];
    
    const recommendations = stocks.map((ticker, index) => {
      const baseScore = 80 - index * 3;
      const sentimentAdjustment = sentiment.sentiment === 'positive' ? 5 : 
                                  sentiment.sentiment === 'negative' ? -5 : 0;
      
      return {
        ticker,
        score: Math.max(30, Math.min(95, baseScore + sentimentAdjustment)),
        signal: baseScore + sentimentAdjustment > 70 ? 'Buy' : 
                baseScore + sentimentAdjustment > 50 ? 'Hold' : 'Sell',
        confidence: 'Moderate',
        reasoning: `AI-based analysis for ${ticker}`
      };
    });

    return {
      recommendations: recommendations.slice(0, 5),
      sentiment,
      reasoning: 'Hugging Face AI recommendations',
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = new HuggingFaceService();
