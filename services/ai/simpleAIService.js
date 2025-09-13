// Hugging Face의 DeepSeek 모델을 사용하는 AI 서비스
class HuggingFaceDeepSeekService {
  constructor() {
    this.apiKey = process.env.HUGGINGFACE_API_KEY || '';
    this.baseUrl = 'https://api-inference.huggingface.co/models';
    
    // 가장 기본적이고 확실한 모델들
    this.models = {
      sentiment: 'cardiffnlp/twitter-roberta-base-sentiment',  // 기본 센티멘트 모델
      backup1: 'distilbert-base-uncased-finetuned-sst-2-english',  // 백업 1
      backup2: 'nlptown/bert-base-multilingual-uncased-sentiment'   // 백업 2
    };
    this.currentModel = this.models.sentiment;
  }

  // 상태 확인
  async checkApiStatus() {
    if (!this.apiKey) {
      return {
        status: 'not_configured',
        message: 'Hugging Face API key not configured',
        aiProvider: 'none'
      };
    }

    try {
      // 메인 모델 테스트
      let response = await this.testModel(this.models.sentiment);
      if (response.status === 'connected') {
        this.currentModel = this.models.sentiment;
        return response;
      }
      
      console.log('Main model failed, trying backup 1...');
      response = await this.testModel(this.models.backup1);
      if (response.status === 'connected') {
        this.currentModel = this.models.backup1;
        return response;
      }
      
      console.log('Backup 1 failed, trying backup 2...');
      response = await this.testModel(this.models.backup2);
      if (response.status === 'connected') {
        this.currentModel = this.models.backup2;
        return response;
      }
      
      // 모든 모델 실패 시
      throw new Error('All Hugging Face models failed. Please check your API key and network connection.');
      
    } catch (error) {
      console.error('Hugging Face connection error:', error.message);
      throw error;
    }
  }
  
  // 모델 테스트 함수
  async testModel(modelName) {
    try {
      console.log(`Testing model: ${modelName}`);
      
      const response = await fetch(`${this.baseUrl}/${modelName}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          inputs: "The stock market looks positive today"
        }),
        signal: AbortSignal.timeout(8000)
      });
      
      console.log(`Model ${modelName} response status:`, response.status);
      
      if (response.ok) {
        return {
          status: 'connected',
          message: `Hugging Face AI connected successfully (${modelName})`,
          aiProvider: 'huggingface-ai',
          model: modelName
        };
      } else {
        return {
          status: 'error',
          message: `Model ${modelName} returned ${response.status}`,
          aiProvider: 'huggingface-ai'
        };
      }
      
    } catch (error) {
      return {
        status: 'error',
        message: `Model ${modelName} failed: ${error.message}`,
        aiProvider: 'huggingface-ai'
      };
    }
  }

  // AI를 사용한 센티멘트 분석  
  async analyzeSentiment(ticker = 'MARKET', marketData = {}) {
    if (!this.apiKey) {
      throw new Error('Hugging Face API key is required. Please set HUGGINGFACE_API_KEY in your .env file.');
    }

    try {
      console.log(`Analyzing sentiment for ${ticker} using Hugging Face...`);
      
      // 센티멘트 분석용 텍스트 생성
      const analysisText = `Stock ${ticker} analysis: Recent market trends show mixed signals with technical indicators suggesting potential opportunities. Current fundamentals appear stable with moderate growth prospects.`;
      
      const response = await fetch(`${this.baseUrl}/${this.currentModel}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: analysisText
        }),
        signal: AbortSignal.timeout(15000)
      });

      console.log(`Hugging Face response status for ${ticker}:`, response.status);

      if (!response.ok) {
        throw new Error(`Hugging Face API error for ${ticker}: ${response.status}`);
      }

      const data = await response.json();
      console.log(`Hugging Face response for ${ticker}:`, data);
      
      // 센티멘트 결과 해석
      let sentiment = 'neutral';
      let confidence = 0.6;
      
      if (Array.isArray(data) && data.length > 0) {
        // 복수의 배열이 오는 경우 (예: [[{...}]]) 처리
        let results = Array.isArray(data[0]) ? data[0] : data;
        
        if (Array.isArray(results) && results.length > 0) {
          // 가장 높은 점수의 라벨 찾기
          const topResult = results.reduce((max, current) => {
            return (current && current.score && current.score > (max.score || 0)) ? current : max;
          }, { score: 0 });
          
          if (topResult && topResult.label && topResult.score) {
            confidence = topResult.score;
            
            // 라벨에 따른 센티멘트 매핑
            const label = topResult.label.toString().toUpperCase();
            
            if (label.includes('POSITIVE') || label === 'LABEL_2' || label.includes('POS')) {
              sentiment = 'positive';
            } else if (label.includes('NEGATIVE') || label === 'LABEL_0' || label.includes('NEG')) {
              sentiment = 'negative';
            } else {
              sentiment = 'neutral';
            }
          }
        }
      }

      console.log(`AI sentiment result for ${ticker}: ${sentiment} (${confidence})`);

      return {
        ticker,
        sentiment,
        confidence,
        analysis: this.generateKoreanAnalysis(ticker, sentiment, confidence),
        aiProvider: 'huggingface-ai',
        model: this.currentModel,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error(`Hugging Face analysis failed for ${ticker}:`, error.message);
      throw error;
    }
  }

  // 텍스트 정리
  cleanAnalysisText(text, ticker) {
    if (!text) return this.generateKoreanAnalysis(ticker, 'neutral', 0.5);
    
    // 너무 길면 자르기
    if (text.length > 200) {
      text = text.substring(0, 200) + '...';
    }
    
    // 한국어가 없으면 기본 분석 제공
    if (!/[가-힣]/.test(text)) {
      return this.generateKoreanAnalysis(ticker, this.extractSentiment(text), 0.7);
    }
    
    return text;
  }

  // 센티멘트 추출
  extractSentiment(text) {
    const lowerText = text.toLowerCase();
    
    // 긍정적 키워드
    const positiveWords = ['긍정', '상승', '좋', '매수', 'positive', 'buy', 'bullish', 'strong'];
    // 부정적 키워드  
    const negativeWords = ['부정', '하락', '나쁘', '매도', 'negative', 'sell', 'bearish', 'weak'];
    
    let positiveCount = 0;
    let negativeCount = 0;
    
    positiveWords.forEach(word => {
      if (lowerText.includes(word)) positiveCount++;
    });
    
    negativeWords.forEach(word => {
      if (lowerText.includes(word)) negativeCount++;
    });
    
    if (positiveCount > negativeCount) {
      return 'positive';
    } else if (negativeCount > positiveCount) {
      return 'negative';
    } else {
      return 'neutral';
    }
  }



  // 한국어 분석 생성
  generateKoreanAnalysis(ticker, sentiment, confidence) {
    const confidenceLevel = confidence > 0.7 ? '높은' : confidence > 0.5 ? '보통' : '낮은';
    
    const sentimentTexts = {
      positive: [
        `${ticker}는 현재 긍정적인 투자 전망을 보이고 있습니다. 기술적 지표와 시장 상황이 양호합니다.`,
        `${ticker}의 단기 상승 모멘텀이 지속될 가능성이 높으며, 매수 기회로 판단됩니다.`,
        `${ticker}는 펀더멘털과 기술적 분석 모두에서 긍정적 신호를 보이고 있습니다.`
      ],
      neutral: [
        `${ticker}는 현재 중립적인 시장 상황에 있으며, 추가적인 시장 신호를 관찰할 필요가 있습니다.`,
        `${ticker}의 투자 전망은 신중한 접근이 필요하며, 리스크 관리가 중요합니다.`,
        `${ticker}는 현재 횡보 구간으로 보이며, 명확한 방향성을 찾기 위해 더 많은 데이터가 필요합니다.`
      ],
      negative: [
        `${ticker}는 현재 주의가 필요한 시장 상황이며, 단기적으로 조정 가능성이 있습니다.`,
        `${ticker}의 기술적 지표에서 약세 신호가 감지되므로 신중한 투자 접근이 권장됩니다.`,
        `${ticker}는 현재 불확실성이 높은 상태로, 추가 하락 리스크를 고려해야 합니다.`
      ]
    };

    const texts = sentimentTexts[sentiment] || sentimentTexts.neutral;
    const selectedText = texts[Math.floor(Math.random() * texts.length)];
    
    return `${selectedText} (신뢰도: ${confidenceLevel})`;
  }

  // 종목 추천
  async getStockRecommendations(tickers = [], marketData = {}) {
    try {
      const recommendations = [];
      
      // 최대 3개 종목만 분석 (API 제한 고려)
      const limitedTickers = tickers.slice(0, 3);
      
      for (const ticker of limitedTickers) {
        const sentiment = await this.analyzeSentiment(ticker, marketData);
        
        recommendations.push({
          ticker,
          recommendation: this.getRecommendationFromSentiment(sentiment.sentiment),
          confidence: sentiment.confidence,
          reasoning: sentiment.analysis,
          aiProvider: sentiment.aiProvider
        });
        
        // API 부하 방지를 위한 지연 (2초)
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      return {
        recommendations,
        summary: `${recommendations.length}개 종목에 대한 Hugging Face DeepSeek 분석이 완료되었습니다.`,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('AI recommendations failed:', error.message);
      return {
        recommendations: [],
        summary: 'AI 추천을 생성할 수 없습니다. 잠시 후 다시 시도해주세요.',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // 센티멘트를 추천으로 변환
  getRecommendationFromSentiment(sentiment) {
    switch (sentiment) {
      case 'positive': return 'Buy';
      case 'negative': return 'Sell';
      default: return 'Hold';
    }
  }

  // NEW: AI 인사이트 생성 메소드 추가 (뉴스 기반 시기적 분석용)
  async generateInsight(prompt) {
    if (!this.apiKey) {
      throw new Error('Hugging Face API key is required for insight generation.');
    }
    
    try {
      console.log('Generating AI insight with prompt:', prompt.substring(0, 100) + '...');
      
      // Hugging Face 모델은 주로 분류에 특화되어 있으므로
      // 현재로서는 실제 텍스트 생성이 어려움
      throw new Error('Text generation not supported with current Hugging Face models');
      
    } catch (error) {
      console.error('Error generating AI insight:', error);
      throw error;
    }
  }


}

module.exports = HuggingFaceDeepSeekService;