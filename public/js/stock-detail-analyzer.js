// Stock Detail Analyzer - 상세 종목 분석 전용
const StockDetailAnalyzer = {

  async analyzeStock(ticker) {
    console.log('=== StockDetailAnalyzer.analyzeStock called ===');
    console.log('Ticker:', ticker);
    
    try {
      // 선택 종목 분석 섹션으로 스크롤
      const analysisSection = document.getElementById('selected-stock-analysis');
      if (analysisSection) {
        analysisSection.scrollIntoView({ behavior: 'smooth' });
        this.showLoadingState(ticker);
      }

      console.log('Making API calls for:', ticker);
      
      // API 호출들을 병렬로 실행
      const [analysisResponse, scoreResponse, quoteResponse, companyResponse] = await Promise.all([
        fetch(`/api/analysis/${ticker}`),
        fetch(`/api/score/${ticker}`),
        fetch(`/api/quote/${ticker}`),
        fetch(`/api/company-info/${ticker}`)
      ]);
      
      console.log('API responses received:', {
        analysis: analysisResponse.ok,
        score: scoreResponse.ok,
        quote: quoteResponse.ok,
        company: companyResponse.ok
      });

      const [analysis, score, quote, company] = await Promise.all([
        analysisResponse.ok ? analysisResponse.json() : null,
        scoreResponse.ok ? scoreResponse.json() : null,
        quoteResponse.ok ? quoteResponse.json() : null,
        companyResponse.ok ? companyResponse.json() : null
      ]);
      
      console.log('Parsed API data:', {
        analysis: !!analysis,
        score: !!score,
        quote: !!quote,
        company: !!company
      });

      // 결과 표시
      this.displayAnalysis(ticker, analysis, score, quote, company);
      
      console.log('Analysis display completed for:', ticker);

    } catch (error) {
      console.error('Error analyzing stock:', error);
      this.showErrorState(ticker);
    }
  },

  showLoadingState(ticker) {
    const headerDiv = document.getElementById('selected-stock-header');
    if (headerDiv) {
      headerDiv.innerHTML = `<h3>${ticker} 분석 중...</h3>`;
    }
  },

  showErrorState(ticker) {
    const headerDiv = document.getElementById('selected-stock-header');
    if (headerDiv) {
      headerDiv.innerHTML = `<h3>${ticker} 분석 오류</h3><p>분석 중 오류가 발생했습니다.</p>`;
    }
  },

  displayAnalysis(ticker, analysis, score, quote, company) {
    this.updateHeader(ticker, quote);
    this.updateFundamentals(quote);
    this.updateTechnicalAnalysis(analysis, score);
    this.updateCompanyDescription(company);
  },

  updateHeader(ticker, quote) {
    const headerDiv = document.getElementById('selected-stock-header');
    if (headerDiv) {
      headerDiv.innerHTML = `
        <h3>${ticker} 상세 분석</h3>
        <div class="stock-price-info">
          ${quote && quote.currentPrice ? `
            <span class="current-price">$${quote.currentPrice}</span>
            <span class="price-change ${quote.changePercent && quote.changePercent.includes('-') ? 'negative' : 'positive'}">
              ${quote.changePercent}%
            </span>
          ` : ''}
        </div>
      `;
    }
  },

  updateFundamentals(quote) {
    const fundamentalsDiv = document.getElementById('selected-stock-fundamentals');
    if (fundamentalsDiv && quote) {
      fundamentalsDiv.innerHTML = `
        <div class="fundamental-grid">
          <div class="fundamental-item">
            <span class="label">P/E 비율:</span>
            <span class="value">${quote.peRatio || 'N/A'}</span>
          </div>
          <div class="fundamental-item">
            <span class="label">시가총액:</span>
            <span class="value">${quote.marketCap ? this.formatMarketCap(quote.marketCap) : 'N/A'}</span>
          </div>
          <div class="fundamental-item">
            <span class="label">52주 고가:</span>
            <span class="value">$${quote.fiftyTwoWeekHigh || 'N/A'}</span>
          </div>
          <div class="fundamental-item">
            <span class="label">52주 저가:</span>
            <span class="value">$${quote.fiftyTwoWeekLow || 'N/A'}</span>
          </div>
          <div class="fundamental-item">
            <span class="label">거래량:</span>
            <span class="value">${quote.volume ? this.formatVolume(quote.volume) : 'N/A'}</span>
          </div>
          <div class="fundamental-item">
            <span class="label">배당수익률:</span>
            <span class="value">${quote.dividendYield || 'N/A'}${quote.dividendYield !== 'N/A' ? '%' : ''}</span>
          </div>
        </div>
      `;
    }
  },

  updateTechnicalAnalysis(analysis, score) {
    const detailsDiv = document.getElementById('selected-stock-details');
    if (!detailsDiv) return;

    let content = '';
    
    // 기술적 분석 섹션
    if (analysis) {
      content += `
        <div class="analysis-section">
          <h4>기술적 분석</h4>
          <div class="technical-summary">
            <div class="signal-badge ${this.getSignalClass(analysis.signal)}">${analysis.signal}</div>
            <div class="confidence-badge">신뢰도: ${analysis.confidence}</div>
            <div class="trend-badge">추세: ${analysis.trendStrength}</div>
          </div>
          
          <div class="technical-indicators">
            <div class="indicator-grid">
              ${this.createIndicatorItems(analysis)}
            </div>
          </div>
          
          ${analysis.signals ? `
          <div class="signals-section">
            <h5>기술적 신호</h5>
            <ul class="signals-list">
              ${analysis.signals.map(signal => `<li>${signal}</li>`).join('')}
            </ul>
          </div>` : ''}
          
          ${analysis.analysis ? `<div class="analysis-summary"><p>${analysis.analysis}</p></div>` : ''}
        </div>
      `;
    }
    
    // 종합 점수 섹션 (상세 시기적/펀더멘털 설명 추가)
    if (score) {
      content += `
        <div class="score-section">
          <h4>종합 투자 점수</h4>
          <div class="score-display">
            <div class="total-score-large">
              <span class="score-number">${(score.totalScore * 100).toFixed(0)}</span>
              <span class="score-suffix">/100</span>
            </div>
            <div class="recommendation-large">${score.recommendation}</div>
          </div>
          
          <div class="score-breakdown-detailed">
            ${this.createDetailedScoreBreakdown(score)}
          </div>
          
          ${score.reasons ? `
          <div class="reasons-detailed">
            <h5>추천 근거</h5>
            <div class="reasons-tags">
              ${score.reasons.map(reason => `<span class="reason-tag">${reason}</span>`).join('')}
            </div>
          </div>` : ''}
        </div>
      `;
    }

    detailsDiv.innerHTML = content;
  },

  createIndicatorItems(analysis) {
    const indicators = [
      { key: 'currentPrice', label: '현재가', value: analysis.currentPrice, prefix: '$' },
      { key: 'sma50', label: 'SMA50', value: analysis.sma50, prefix: '$' },
      { key: 'sma200', label: 'SMA200', value: analysis.sma200, prefix: '$' },
      { key: 'rsi', label: 'RSI', value: analysis.rsi },
      { key: 'macd', label: 'MACD', value: analysis.macd }
    ];

    return indicators
      .filter(indicator => indicator.value)
      .map(indicator => `
        <div class="indicator-item">
          <span class="label">${indicator.label}:</span>
          <span class="value">${indicator.prefix || ''}${indicator.value}</span>
        </div>
      `).join('');
  },

  createDetailedScoreBreakdown(score) {
    let html = '';
    
    // 기술적 분석 상세
    if (score.technicalScore !== undefined) {
      const techScore = (score.technicalScore * 100).toFixed(0);
      const techDetails = score.details?.technical;
      html += `
        <div class="score-item-detailed">
          <div class="score-header">
            <span class="score-label">기술적 분석</span>
            <div class="score-bar">
              <div class="score-fill technical" style="width: ${techScore}%"></div>
            </div>
            <span class="score-value">${techScore}</span>
          </div>
          ${techDetails ? `
          <div class="score-details">
            <p><strong>매매신호:</strong> ${techDetails.signal} (신뢰도: ${techDetails.confidence})</p>
            <p><strong>추세강도:</strong> ${techDetails.trendStrength} - ${this.getTrendDescription(techDetails.trendStrength)}</p>
            ${techDetails.rsi ? `<p><strong>RSI ${techDetails.rsi}:</strong> ${this.getRSIDescription(parseFloat(techDetails.rsi))}</p>` : ''}
            ${techDetails.sma50 && techDetails.sma200 ? `<p><strong>이평선:</strong> ${this.getMovingAverageDescription(techDetails)}</p>` : ''}
          </div>` : ''}
        </div>
      `;
    }
    
    // 시기적 분석 상세
    if (score.seasonalScore !== undefined) {
      const seasonalScore = (score.seasonalScore * 100).toFixed(0);
      const seasonalDetails = score.details?.seasonal;
      html += `
        <div class="score-item-detailed">
          <div class="score-header">
            <span class="score-label">계절적 분석</span>
            <div class="score-bar">
              <div class="score-fill seasonal" style="width: ${seasonalScore}%"></div>
            </div>
            <span class="score-value">${seasonalScore}</span>
          </div>
          ${seasonalDetails ? `
          <div class="score-details">
            <p><strong>최고 성과 월:</strong> ${seasonalDetails.bestMonth}</p>
            <p><strong>최저 성과 월:</strong> ${seasonalDetails.worstMonth}</p>
            <p><strong>시기적 추천:</strong> ${this.getSeasonalRecommendation(seasonalDetails)}</p>
          </div>` : ''}
        </div>
      `;
    }
    
    // 펀더멘털 분석 상세
    if (score.fundamentalScore !== undefined) {
      const fundamentalScore = (score.fundamentalScore * 100).toFixed(0);
      const quoteDetails = score.details?.quote;
      html += `
        <div class="score-item-detailed">
          <div class="score-header">
            <span class="score-label">펀더멘털 분석</span>
            <div class="score-bar">
              <div class="score-fill fundamental" style="width: ${fundamentalScore}%"></div>
            </div>
            <span class="score-value">${fundamentalScore}</span>
          </div>
          ${quoteDetails ? `
          <div class="score-details">
            ${quoteDetails.peRatio && quoteDetails.peRatio !== 'N/A' ? `
            <p><strong>P/E 비율:</strong> ${quoteDetails.peRatio}배 - ${this.getPERatioDescription(parseFloat(quoteDetails.peRatio))}</p>` : ''}
            ${quoteDetails.dividendYield && quoteDetails.dividendYield !== 'N/A' ? `
            <p><strong>배당수익률:</strong> ${quoteDetails.dividendYield}% - ${this.getDividendDescription(parseFloat(quoteDetails.dividendYield))}</p>` : ''}
            ${quoteDetails.currentPrice && quoteDetails.fiftyTwoWeekHigh && quoteDetails.fiftyTwoWeekLow ? `
            <p><strong>52주 대비 위치:</strong> ${this.get52WeekPositionDescription(quoteDetails)}</p>` : ''}
          </div>` : ''}
        </div>
      `;
    }
    
    return html;
  },

  updateCompanyDescription(company) {
    const descriptionDiv = document.getElementById('selected-stock-description');
    if (descriptionDiv && company) {
      descriptionDiv.innerHTML = `
        <div class="company-description">
          <h4>회사 소개</h4>
          <div class="description-text">
            ${company.description || '회사 설명을 불러올 수 없습니다.'}
          </div>
        </div>
      `;
    }
  },

  // 상세 분석 설명 함수들
  getTrendDescription(trendStrength) {
    const descriptions = {
      'Strong': '강한 추세로 지속적인 방향성을 보임',
      'Moderate': '중간 강도의 추세로 안정적인 움직임',
      'Weak': '약한 추세로 횡보 또는 변동성 높음'
    };
    return descriptions[trendStrength] || '추세 분석 정보 없음';
  },

  getRSIDescription(rsi) {
    if (rsi >= 70) {
      return `과매수 구간으로 조정 가능성 있음 (70 이상)`;
    } else if (rsi <= 30) {
      return `과매도 구간으로 반등 기회 가능 (30 이하)`;
    } else if (rsi >= 50) {
      return `상승 모멘텀 유지 중 (중립선 50 상단)`;
    } else {
      return `하락 압력 존재 (중립선 50 하단)`;
    }
  },

  getMovingAverageDescription(techDetails) {
    const sma50 = parseFloat(techDetails.sma50);
    const sma200 = parseFloat(techDetails.sma200);
    const currentPrice = parseFloat(techDetails.currentPrice);
    
    if (sma50 > sma200) {
      return `골든크로스 형성 중 (단기>장기 이평선), 상승 추세 지속 가능성`;
    } else {
      return `데스크로스 상태 (단기<장기 이평선), 하락 추세 주의`;
    }
  },

  getSeasonalRecommendation(seasonalDetails) {
    // null 또는 undefined 체크
    if (!seasonalDetails) {
      return '계절적 분석 데이터가 없습니다.';
    }
    
    const bestMonth = seasonalDetails.bestMonth;
    const worstMonth = seasonalDetails.worstMonth;
    const currentMonth = new Date().getMonth() + 1;
    
    // 월 데이터가 없는 경우 기본 메시지 반환
    if (!bestMonth && !worstMonth) {
      return '계절적 패턴 분석을 위해 더 많은 데이터가 필요합니다.';
    }
    
    // 최고 성과 월에서 월 번호 추출
    const bestMonthNum = bestMonth ? this.extractMonthNumber(bestMonth) : 0;
    const worstMonthNum = worstMonth ? this.extractMonthNumber(worstMonth) : 0;
    
    if (bestMonthNum > 0 && currentMonth === bestMonthNum) {
      return `현재 월이 역사적 최고 성과 월입니다. 매수 적기일 가능성`;
    } else if (worstMonthNum > 0 && currentMonth === worstMonthNum) {
      return `현재 월이 역사적 최저 성과 월입니다. 신중한 접근 필요`;
    } else if (bestMonthNum > 0 && Math.abs(currentMonth - bestMonthNum) <= 1) {
      return `최고 성과 월 근처로 긍정적 시기적 요인`;
    } else if (bestMonthNum > 0) {
      return `시기적으로는 중립적, ${bestMonthNum}월경 강세 예상`;
    } else {
      return '계절적 패턴 분석 중입니다.';
    }
  },

  extractMonthNumber(monthString) {
    // null, undefined, 빈 문자열 체크
    if (!monthString || typeof monthString !== 'string') {
      return 0;
    }
    
    const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
    for (let i = 0; i < monthNames.length; i++) {
      if (monthString.includes(monthNames[i])) {
        return i + 1;
      }
    }
    
    // 영어 월 이름도 체크
    const englishMonthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                               'July', 'August', 'September', 'October', 'November', 'December'];
    for (let i = 0; i < englishMonthNames.length; i++) {
      if (monthString.toLowerCase().includes(englishMonthNames[i].toLowerCase())) {
        return i + 1;
      }
    }
    
    // 숫자 형태 체크 (1, 2, 3... 또는 01, 02, 03...)
    const monthMatch = monthString.match(/(\d{1,2})/);
    if (monthMatch) {
      const monthNum = parseInt(monthMatch[1]);
      if (monthNum >= 1 && monthNum <= 12) {
        return monthNum;
      }
    }
    
    return 0;
  },

  getPERatioDescription(peRatio) {
    if (peRatio < 15) {
      return `저평가 구간 (15배 미만), 가치투자 관점에서 매력적`;
    } else if (peRatio < 25) {
      return `적정 평가 구간 (15-25배), 업계 평균 수준`;
    } else if (peRatio < 35) {
      return `고평가 구간 (25-35배), 성장성 대비 검토 필요`;
    } else {
      return `과도한 고평가 (35배 이상), 밸류에이션 부담 높음`;
    }
  },

  getDividendDescription(dividendYield) {
    if (dividendYield >= 4) {
      return `높은 배당 수익률, 인컴 투자자에게 매력적`;
    } else if (dividendYield >= 2) {
      return `적정 배당 수익률, 안정적인 배당 정책`;
    } else if (dividendYield >= 1) {
      return `낮은 배당 수익률, 성장주 성향`;
    } else {
      return `미미한 배당, 성장 재투자 중심 기업`;
    }
  },

  get52WeekPositionDescription(quoteDetails) {
    const current = parseFloat(quoteDetails.currentPrice);
    const high = parseFloat(quoteDetails.fiftyTwoWeekHigh);
    const low = parseFloat(quoteDetails.fiftyTwoWeekLow);
    const position = ((current - low) / (high - low)) * 100;
    
    if (position >= 80) {
      return `52주 고점 근처 (${position.toFixed(0)}%), 고점 돌파 시 추가 상승 가능`;
    } else if (position >= 60) {
      return `52주 상단 구간 (${position.toFixed(0)}%), 상승 모멘텀 양호`;
    } else if (position >= 40) {
      return `52주 중간 구간 (${position.toFixed(0)}%), 중립적 위치`;
    } else if (position >= 20) {
      return `52주 하단 구간 (${position.toFixed(0)}%), 반등 기회 모색`;
    } else {
      return `52주 저점 근처 (${position.toFixed(0)}%), 저점 매수 기회 가능성`;
    }
  },
  getSignalClass(signal) {
    const classMap = {
      'Buy': 'signal-buy',
      'Sell': 'signal-sell',
      'Hold': 'signal-hold'
    };
    return classMap[signal] || 'signal-hold';
  },

  formatMarketCap(marketCap) {
    if (marketCap >= 1e12) {
      return `$${(marketCap / 1e12).toFixed(1)}T`;
    } else if (marketCap >= 1e9) {
      return `$${(marketCap / 1e9).toFixed(1)}B`;
    } else if (marketCap >= 1e6) {
      return `$${(marketCap / 1e6).toFixed(1)}M`;
    }
    return `$${marketCap}`;
  },

  formatVolume(volume) {
    if (volume >= 1e6) {
      return `${(volume / 1e6).toFixed(1)}M`;
    } else if (volume >= 1e3) {
      return `${(volume / 1e3).toFixed(1)}K`;
    }
    return volume.toString();
  }
};

window.StockDetailAnalyzer = StockDetailAnalyzer;
