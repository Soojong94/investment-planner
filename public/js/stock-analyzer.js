// Stock Analyzer - handles individual stock analysis display
const StockAnalyzer = {
  async displayQuoteSummary(ticker) {
    const headerDiv = document.getElementById('selected-stock-header');
    const fundamentalsDiv = document.getElementById('selected-stock-fundamentals');
    
    headerDiv.innerHTML = `<h3>${ticker}</h3><p>기본 정보 로딩 중...</p>`;
    fundamentalsDiv.innerHTML = '';

    try {
      const response = await fetch(`${CONFIG.endpoints.quote}/${ticker}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch quote for ${ticker}`);
      }
      const data = await response.json();

      if (data.error) {
        headerDiv.innerHTML = `<h3>${ticker}</h3><p>데이터 로드 오류</p>`;
        return;
      }

      // Format price change
      const changePercent = parseFloat(data.changePercent);
      const changeClass = changePercent >= 0 ? 'positive' : 'negative';
      const changeSymbol = changePercent >= 0 ? '+' : '';

      // Header with price info
      headerDiv.innerHTML = `
        <h3>${ticker}</h3>
        <div class="price-info">
          <span class="current-price">$${data.currentPrice}</span>
          <span class="price-change ${changeClass}">${changeSymbol}${data.changePercent}%</span>
        </div>
      `;

      // Fundamentals grid
      const formatValue = (value, suffix = '') => {
        if (value === 'N/A' || value === null || value === undefined) return 'N/A';
        if (typeof value === 'number' && value > 1000000000) {
          return `${(value / 1000000000).toFixed(1)}B${suffix}`;
        } else if (typeof value === 'number' && value > 1000000) {
          return `${(value / 1000000).toFixed(1)}M${suffix}`;
        }
        return `${value}${suffix}`;
      };

      fundamentalsDiv.innerHTML = `
        <h4>기본 정보</h4>
        <div class="fundamentals-grid">
          <div class="fundamental-item">
            <div class="label tooltip-term" data-term="시가총액">시가총액</div>
            <div class="value">${formatValue(data.marketCap)}</div>
          </div>
          <div class="fundamental-item">
            <div class="label tooltip-term" data-term="P/E 비율">P/E 비율</div>
            <div class="value">${data.peRatio !== 'N/A' ? parseFloat(data.peRatio).toFixed(2) : 'N/A'}</div>
          </div>
          <div class="fundamental-item">
            <div class="label tooltip-term" data-term="배당 수익률">배당 수익률</div>
            <div class="value">${data.dividendYield !== 'N/A' ? data.dividendYield + '%' : 'N/A'}</div>
          </div>
          <div class="fundamental-item">
            <div class="label tooltip-term" data-term="52주 최고가">52주 최고가</div>
            <div class="value">$${data.fiftyTwoWeekHigh}</div>
          </div>
          <div class="fundamental-item">
            <div class="label tooltip-term" data-term="52주 최저가">52주 최저가</div>
            <div class="value">$${data.fiftyTwoWeekLow}</div>
          </div>
          <div class="fundamental-item">
            <div class="label tooltip-term" data-term="거래량">거래량</div>
            <div class="value">${formatValue(data.volume)}</div>
          </div>
          <div class="fundamental-item">
            <div class="label tooltip-term" data-term="평균 거래량">평균 거래량</div>
            <div class="value">${formatValue(data.avgVolume)}</div>
          </div>
          <div class="fundamental-item">
            <div class="label tooltip-term" data-term="베타">베타</div>
            <div class="value">${data.beta !== 'N/A' ? parseFloat(data.beta).toFixed(2) : 'N/A'}</div>
          </div>
        </div>
      `;
    } catch (error) {
      console.error(`Error fetching quote summary for ${ticker}:`, error);
      headerDiv.innerHTML = `<h3>${ticker}</h3><p>기본 정보 로드 오류</p>`;
    }
  },

  async displayTechnicalAnalysis(ticker) {
    const selectedStockDetails = document.getElementById('selected-stock-details');
    selectedStockDetails.innerHTML = `<h4>기술적 분석 로딩 중...</h4>`;

    try {
      // Fetch technical analysis data
      const technicalResponse = await fetch(`${CONFIG.endpoints.analysis}/${ticker}`);
      
      if (!technicalResponse.ok) {
        throw new Error(`Failed to fetch analysis for ${ticker}`);
      }
      
      const technicalData = await technicalResponse.json();
      this.renderTechnicalAnalysis(technicalData);
      
      // 새로운 시기적 분석 모듈 호출
      if (window.SeasonalAnalysis) {
        await window.SeasonalAnalysis.displayIndividualSeasonalAnalysis(ticker);
      }
      
    } catch (error) {
      console.error(`Error fetching selected stock analysis for ${ticker}:`, error);
      selectedStockDetails.innerHTML = `<h4>기술적 분석</h4><p>분석 로드 중 오류 발생.</p>`;
    }
  },

  renderTechnicalAnalysis(technicalData) {
    const selectedStockDetails = document.getElementById('selected-stock-details');
    
    let signalClass = '';
    if (technicalData.signal === 'Buy') {
      signalClass = 'signal-buy';
    } else if (technicalData.signal === 'Sell') {
      signalClass = 'signal-sell';
    }

    // Format confidence class
    let confidenceClass = '';
    if (technicalData.confidence === 'High') {
      confidenceClass = 'confidence-high';
    } else if (technicalData.confidence === 'Moderate') {
      confidenceClass = 'confidence-moderate';
    } else {
      confidenceClass = 'confidence-low';
    }

    // Format trend strength class
    let trendClass = '';
    if (technicalData.trendStrength === 'Strong') {
      trendClass = 'trend-strong';
    } else if (technicalData.trendStrength === 'Moderate') {
      trendClass = 'trend-moderate';
    } else {
      trendClass = 'trend-weak';
    }

    selectedStockDetails.innerHTML = `
      <div class="analysis-section">
        <h4>기술적 분석</h4>
        
        <div class="technical-summary">
          <div class="signal-box">
            <span class="signal ${signalClass} tooltip-term" data-term="${technicalData.signal}">${technicalData.signal}</span>
            <span class="confidence ${confidenceClass} tooltip-term" data-term="신뢰도">신뢰도: ${technicalData.confidence}</span>
            <span class="trend-strength ${trendClass} tooltip-term" data-term="추세 강도">추세: ${technicalData.trendStrength}</span>
          </div>
        </div>

        <div class="indicators-grid">
          <div class="indicator-item">
            <span class="label tooltip-term" data-term="50-day SMA">50일 SMA</span>
            <span class="value">${technicalData.sma50 ? '$' + technicalData.sma50 : 'N/A'}</span>
          </div>
          <div class="indicator-item">
            <span class="label tooltip-term" data-term="200-day SMA">200일 SMA</span>
            <span class="value">${technicalData.sma200 ? '$' + technicalData.sma200 : 'N/A'}</span>
          </div>
          <div class="indicator-item">
            <span class="label tooltip-term" data-term="RSI">RSI</span>
            <span class="value">${technicalData.rsi || 'N/A'}</span>
          </div>
          <div class="indicator-item">
            <span class="label tooltip-term" data-term="MACD">MACD</span>
            <span class="value">${technicalData.macd || 'N/A'}</span>
          </div>
        </div>

        ${technicalData.bollingerBands && technicalData.bollingerBands.upper ? `
        <div class="bollinger-section">
          <h5>볼린저 밴드</h5>
          <div class="bollinger-grid">
            <div class="bollinger-item">
              <span class="label tooltip-term" data-term="볼린저 밴드">상한선</span>
              <span class="value">$${technicalData.bollingerBands.upper}</span>
            </div>
            <div class="bollinger-item">
              <span class="label tooltip-term" data-term="볼린저 밴드">중간선</span>
              <span class="value">$${technicalData.bollingerBands.middle}</span>
            </div>
            <div class="bollinger-item">
              <span class="label tooltip-term" data-term="볼린저 밴드">하한선</span>
              <span class="value">$${technicalData.bollingerBands.lower}</span>
            </div>
          </div>
        </div>
        ` : ''}

        ${technicalData.signals && technicalData.signals.length > 0 ? `
        <div class="signals-section">
          <h5>분석 신호</h5>
          <ul class="signals-list">
            ${technicalData.signals.map(signal => `<li>• ${signal}</li>`).join('')}
          </ul>
        </div>
        ` : ''}

        <div class="analysis-conclusion">
          <strong>종합 분석:</strong> ${technicalData.analysis || '분석 데이터를 사용할 수 없습니다.'}
        </div>
      </div>
      

    `;
  },

  async displayCompanyInfo(ticker) {
    const companyInfoContainer = document.getElementById('selected-stock-description');
    companyInfoContainer.innerHTML = '<h4>회사 소개</h4><p>회사 정보 로딩 중...</p>';
    
    try {
      const response = await fetch(`${CONFIG.endpoints.company_info}/${ticker}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch company info for ${ticker}`);
      }
      const data = await response.json();
      companyInfoContainer.innerHTML = `
        <h4>회사 소개</h4>
        <p>${data.description}</p>
      `;
    } catch (error) {
      console.error(`Error fetching company info for ${ticker}:`, error);
      companyInfoContainer.innerHTML = '<h4>회사 소개</h4><p>회사 소개 로드 중 오류 발생.</p>';
    }
  }
};
