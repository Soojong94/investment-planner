// 개선된 종목 상세 분석기
class ImprovedStockAnalyzer {
  constructor() {
    this.analyzer = new InvestmentAnalyzer();
  }

  // 안전한 종목 분석
  async analyzeStock(ticker) {
    try {
      console.log(`=== 개선된 분석 시작: ${ticker} ===`);
      
      // 로딩 상태 표시
      this.showLoadingState(ticker);
      
      // 종목 분석 실행
      const analysisData = await this.analyzer.analyzeStock(ticker);
      
      if (!analysisData.success) {
        this.showErrorState(ticker, analysisData.error);
        return;
      }
      
      // 투자 점수 계산
      const investmentScore = this.analyzer.calculateInvestmentScore(analysisData);
      
      // 결과 표시
      this.displayAnalysisResults(ticker, analysisData, investmentScore);
      
      console.log(`=== 분석 완료: ${ticker} ===`);
      
    } catch (error) {
      console.error(`Error in improved analysis for ${ticker}:`, error);
      this.showErrorState(ticker, error.message);
    }
  }

  // 로딩 상태 표시
  showLoadingState(ticker) {
    const headerElement = document.getElementById('selected-stock-header');
    const detailsElement = document.getElementById('selected-stock-details');
    const fundamentalsElement = document.getElementById('selected-stock-fundamentals');
    
    if (headerElement) {
      headerElement.innerHTML = `
        <h3>${ticker} 분석 중...</h3>
        <div class="loading-indicator">
          <span class="loading-spinner"></span>
          <span>데이터를 가져오는 중입니다</span>
        </div>
      `;
    }
    
    if (detailsElement) {
      detailsElement.innerHTML = '<div class="loading-placeholder">기술적 분석 중...</div>';
    }
    
    if (fundamentalsElement) {
      fundamentalsElement.innerHTML = '<div class="loading-placeholder">펀더멘털 분석 중...</div>';
    }
  }

  // 오류 상태 표시
  showErrorState(ticker, errorMessage) {
    const headerElement = document.getElementById('selected-stock-header');
    if (headerElement) {
      headerElement.innerHTML = `
        <h3>${ticker} 분석 오류</h3>
        <div class="error-message">
          <p>분석 중 오류가 발생했습니다: ${errorMessage}</p>
          <button onclick="window.improvedAnalyzer.analyzeStock('${ticker}')" class="retry-button">다시 시도</button>
        </div>
      `;
    }
  }

  // 분석 결과 표시
  displayAnalysisResults(ticker, analysisData, investmentScore) {
    this.updateHeader(ticker, analysisData.quote, investmentScore);
    this.updateFundamentals(analysisData.quote);
    this.updateTechnicalAnalysis(analysisData.analysis, investmentScore);
    this.updateCompanyInfo(analysisData.company);
  }

  // 헤더 업데이트
  updateHeader(ticker, quote, investmentScore) {
    const headerElement = document.getElementById('selected-stock-header');
    if (!headerElement) return;

    const currentPrice = quote?.currentPrice || 'N/A';
    const changePercent = quote?.changePercent || 'N/A';
    const isNegative = changePercent.toString().includes('-');
    
    headerElement.innerHTML = `
      <div class="stock-header-content">
        <h3>${ticker} 상세 분석</h3>
        <div class="stock-price-section">
          <div class="price-info">
            <span class="current-price">$${currentPrice}</span>
            <span class="price-change ${isNegative ? 'negative' : 'positive'}">
              ${changePercent}%
            </span>
          </div>
          <div class="investment-score-summary">
            <div class="score-circle">
              <span class="score-number">${(investmentScore.totalScore * 100).toFixed(0)}</span>
              <span class="score-label">점</span>
            </div>
            <div class="recommendation-info">
              <span class="recommendation ${investmentScore.recommendation.toLowerCase().replace(' ', '-')}">${investmentScore.recommendation}</span>
              <span class="confidence">${investmentScore.confidence} 신뢰도</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // 펀더멘털 정보 업데이트
  updateFundamentals(quote) {
    const fundamentalsElement = document.getElementById('selected-stock-fundamentals');
    if (!fundamentalsElement || !quote) return;

    fundamentalsElement.innerHTML = `
      <div class="fundamentals-grid">
        <div class="fundamental-item">
          <span class="label">P/E 비율</span>
          <span class="value">${quote.peRatio || 'N/A'}</span>
        </div>
        <div class="fundamental-item">
          <span class="label">시가총액</span>
          <span class="value">${this.formatMarketCap(quote.marketCap)}</span>
        </div>
        <div class="fundamental-item">
          <span class="label">52주 고가</span>
          <span class="value">$${quote.fiftyTwoWeekHigh || 'N/A'}</span>
        </div>
        <div class="fundamental-item">
          <span class="label">52주 저가</span>
          <span class="value">$${quote.fiftyTwoWeekLow || 'N/A'}</span>
        </div>
        <div class="fundamental-item">
          <span class="label">거래량</span>
          <span class="value">${this.formatVolume(quote.volume)}</span>
        </div>
        <div class="fundamental-item">
          <span class="label">배당수익률</span>
          <span class="value">${quote.dividendYield || 'N/A'}${quote.dividendYield !== 'N/A' ? '%' : ''}</span>
        </div>
      </div>
    `;
  }

  // 기술적 분석 업데이트
  updateTechnicalAnalysis(analysis, investmentScore) {
    const detailsElement = document.getElementById('selected-stock-details');
    if (!detailsElement) return;

    let html = `
      <div class="analysis-container">
        <div class="investment-score-detailed">
          <h4>종합 투자 점수</h4>
          <div class="score-breakdown">
            <div class="score-item">
              <span class="score-label">기술적 분석</span>
              <div class="score-bar">
                <div class="score-fill technical" style="width: ${investmentScore.technicalScore * 100}%"></div>
              </div>
              <span class="score-value">${(investmentScore.technicalScore * 100).toFixed(0)}</span>
            </div>
            <div class="score-item">
              <span class="score-label">펀더멘털</span>
              <div class="score-bar">
                <div class="score-fill fundamental" style="width: ${investmentScore.fundamentalScore * 100}%"></div>
              </div>
              <span class="score-value">${(investmentScore.fundamentalScore * 100).toFixed(0)}</span>
            </div>
            <div class="score-item">
              <span class="score-label">계절성</span>
              <div class="score-bar">
                <div class="score-fill seasonal" style="width: ${investmentScore.seasonalScore * 100}%"></div>
              </div>
              <span class="score-value">${(investmentScore.seasonalScore * 100).toFixed(0)}</span>
            </div>
          </div>
          <div class="recommendation-summary">
            <strong>추천 근거:</strong> ${investmentScore.reason}
          </div>
        </div>
    `;

    if (analysis && !analysis.error) {
      html += `
        <div class="technical-analysis-section">
          <h4>기술적 분석</h4>
          <div class="technical-indicators">
            <div class="indicator-grid">
              ${analysis.currentPrice ? `<div class="indicator-item"><span class="label">현재가:</span><span class="value">$${analysis.currentPrice}</span></div>` : ''}
              ${analysis.sma50 ? `<div class="indicator-item"><span class="label">SMA50:</span><span class="value">$${analysis.sma50}</span></div>` : ''}
              ${analysis.sma200 ? `<div class="indicator-item"><span class="label">SMA200:</span><span class="value">$${analysis.sma200}</span></div>` : ''}
              ${analysis.rsi ? `<div class="indicator-item"><span class="label">RSI:</span><span class="value">${analysis.rsi}</span></div>` : ''}
              ${analysis.macd ? `<div class="indicator-item"><span class="label">MACD:</span><span class="value">${analysis.macd}</span></div>` : ''}
            </div>
          </div>
          ${analysis.signal ? `
          <div class="signal-section">
            <div class="signal-badge ${this.getSignalClass(analysis.signal)}">${analysis.signal}</div>
            ${analysis.confidence ? `<div class="confidence-badge">신뢰도: ${analysis.confidence}</div>` : ''}
            ${analysis.trendStrength ? `<div class="trend-badge">추세: ${analysis.trendStrength}</div>` : ''}
          </div>` : ''}
        </div>
      `;
    }

    html += '</div>';
    detailsElement.innerHTML = html;
  }

  // 회사 정보 업데이트
  updateCompanyInfo(company) {
    const descriptionElement = document.getElementById('selected-stock-description');
    if (!descriptionElement) return;

    if (company) {
      descriptionElement.innerHTML = `
        <div class="company-description">
          <h4>회사 소개</h4>
          <div class="description-text">
            ${company.description || company || '회사 정보를 불러올 수 없습니다.'}
          </div>
        </div>
      `;
    } else {
      descriptionElement.innerHTML = `
        <div class="company-description">
          <h4>회사 소개</h4>
          <div class="description-text">회사 정보를 불러오는 중...</div>
        </div>
      `;
    }
  }

  // 유틸리티 함수들
  formatMarketCap(marketCap) {
    if (!marketCap || marketCap === 'N/A') return 'N/A';
    const num = parseFloat(marketCap);
    if (num >= 1e12) return `$${(num / 1e12).toFixed(1)}T`;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(1)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(1)}M`;
    return `$${num}`;
  }

  formatVolume(volume) {
    if (!volume || volume === 'N/A') return 'N/A';
    const num = parseFloat(volume);
    if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
    return num.toString();
  }

  getSignalClass(signal) {
    const classMap = {
      'Buy': 'signal-buy',
      'Sell': 'signal-sell',
      'Hold': 'signal-hold'
    };
    return classMap[signal] || 'signal-hold';
  }
}

// 전역 객체로 내보내기
window.ImprovedStockAnalyzer = ImprovedStockAnalyzer;