// Recommendation UI Components - UI 표시 전용
const RecommendationUI = {
  
  displayRecommendations(data) {
    const container = document.getElementById('recommendations-content');
    if (!container) return;

    if (!data.recommendations || data.recommendations.length === 0) {
      container.innerHTML = '<div class="no-data">추천 종목이 없습니다.</div>';
      return;
    }

    const sentimentHtml = this.createMarketSentimentHtml(data.marketSentiment);
    const strategyHtml = this.createMonthlyStrategyHtml(data);
    const recommendationsHtml = this.createRecommendationCards(data.recommendations);

    container.innerHTML = `
      <div class="market-overview">
        ${sentimentHtml}
        ${strategyHtml}
      </div>
      <div class="recommendations-grid">
        ${recommendationsHtml}
      </div>
    `;

    this.addDetailButtonEvents();
  },

  createRecommendationCards(recommendations) {
    return recommendations.slice(0, 10).map((stock, index) => `
      <div class="recommendation-card ${this.getRecommendationClass(stock.recommendation)}" data-ticker="${stock.ticker}">
        <div class="card-header">
          <div class="rank-badge">${index + 1}</div>
          <div class="ticker-name">${stock.ticker}</div>
          <div class="recommendation-badge">${stock.recommendation}</div>
        </div>
        
        <div class="card-body">
          <div class="score-section">
            <div class="total-score">
              <span class="score-label">종합점수</span>
              <span class="score-value">${(stock.totalScore * 100).toFixed(0)}/100</span>
            </div>
            <div class="score-breakdown">
              <div class="score-item">
                <span class="tooltip-term">기술</span>
                <span class="score">${(stock.technicalScore * 100).toFixed(0)}</span>
              </div>
              ${stock.seasonalScore !== undefined ? `
              <div class="score-item">
                <span class="tooltip-term">시기</span>
                <span class="score">${(stock.seasonalScore * 100).toFixed(0)}</span>
              </div>` : ''}
            </div>
          </div>
          
          <div class="reasons-section">
            <div class="reasons-title">추천 이유</div>
            <div class="reasons-list">
              ${stock.reasons.map(reason => `<span class="reason-tag">${reason}</span>`).join('')}
            </div>
          </div>
        </div>
        
        <div class="card-footer">
          <button class="btn-detail" data-ticker="${stock.ticker}">상세 분석</button>
        </div>
      </div>
    `).join('');
  },

  createMarketSentimentHtml(sentiment) {
    if (!sentiment) return '';
    
    const sentimentClass = this.getSentimentClass(sentiment.sentiment);
    return `
      <div id="market-sentiment" class="sentiment-card">
        <h3>시장 센티멘트</h3>
        <div class="sentiment-content">
          <div class="sentiment-indicator ${sentimentClass}">
            <div class="sentiment-label">${this.getSentimentLabel(sentiment.sentiment)}</div>
            <div class="confidence-score">신뢰도: ${(sentiment.confidence * 100).toFixed(0)}%</div>
          </div>
          <div class="sentiment-recommendation">${sentiment.recommendation}</div>
          ${sentiment.mock ? '<div class="mock-notice">* FinBERT 모델 사용 중</div>' : ''}
        </div>
      </div>
    `;
  },

  createMonthlyStrategyHtml(data) {
    if (!data.summary) return '';
    
    return `
      <div id="monthly-strategy" class="strategy-card">
        <h3>이번달 전략 (${data.month})</h3>
        <div class="strategy-content">
          <div class="strategy-overview">${data.summary.overview}</div>
          <div class="top-pick">${data.summary.topPick}</div>
          <div class="strategy-text">${data.summary.strategy}</div>
          <div class="risk-indicator">
            <span class="risk-label">리스크 레벨:</span>
            <span class="risk-value ${data.riskLevel}">${this.getRiskLabel(data.riskLevel)}</span>
          </div>
        </div>
      </div>
    `;
  },

  addDetailButtonEvents() {
    const detailButtons = document.querySelectorAll('.btn-detail');
    detailButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        const ticker = button.dataset.ticker;
        console.log('Detail button clicked for:', ticker);
        StockDetailAnalyzer.analyzeStock(ticker);
      });
    });
  },

  showLoading() {
    const container = document.getElementById('recommendations-content');
    if (container) {
      container.innerHTML = '<div class="loading-spinner"><p>월별 추천 종목을 분석 중입니다...</p></div>';
    }
  },

  showError(message) {
    const container = document.getElementById('recommendations-content');
    if (container) {
      container.innerHTML = `<div class="error-placeholder">${message}</div>`;
    }
  },

  // 스타일 클래스 헬퍼들
  getRecommendationClass(recommendation) {
    const classMap = {
      '강력 추천': 'strong-buy',
      '추천': 'buy', 
      '보통': 'hold',
      '비추천': 'sell'
    };
    return classMap[recommendation] || 'hold';
  },

  getSentimentClass(sentiment) {
    const classMap = {
      'positive': 'sentiment-positive',
      'negative': 'sentiment-negative',
      'neutral': 'sentiment-neutral'
    };
    return classMap[sentiment] || 'sentiment-neutral';
  },

  getSentimentLabel(sentiment) {
    const labelMap = {
      'positive': '긍정적',
      'negative': '부정적', 
      'neutral': '중립적'
    };
    return labelMap[sentiment] || '중립적';
  },

  getRiskLabel(riskLevel) {
    const labelMap = {
      'low': '낮음',
      'medium': '보통',
      'high': '높음'
    };
    return labelMap[riskLevel] || '보통';
  }
};

window.RecommendationUI = RecommendationUI;
