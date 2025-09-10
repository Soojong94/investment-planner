// 종목 추천 시스템
class StockRecommendationSystem {
  constructor() {
    this.analyzer = new InvestmentAnalyzer();
    this.stockLists = {
      ai: ['NVDA', 'MSFT', 'GOOG', 'META', 'AAPL', 'TSLA', 'AMD', 'PLTR', 'AVGO', 'AMZN'],
      semiconductor: ['NVDA', 'TSM', 'AVGO', 'AMD', 'QCOM', 'AMAT', 'INTC', 'MU', 'ADI', 'MRVL'],
      popular: ['SPY', 'QQQ', 'AAPL', 'MSFT', 'NVDA', 'TSLA', 'AMZN', 'GOOG', 'META', 'BRK-B']
    };
  }

  // 월별 추천 종목 생성
  async generateMonthlyRecommendations(category = 'all') {
    try {
      console.log(`Generating monthly recommendations for category: ${category}`);
      
      const stocksToAnalyze = this.getStocksForCategory(category);
      const analyses = [];
      
      // 병렬 분석 (3개씩 배치로 처리하여 API 부하 감소)
      for (let i = 0; i < stocksToAnalyze.length; i += 3) {
        const batch = stocksToAnalyze.slice(i, i + 3);
        const batchResults = await Promise.all(
          batch.map(ticker => this.analyzer.analyzeStock(ticker))
        );
        analyses.push(...batchResults);
        
        // 배치 간 짧은 지연
        if (i + 3 < stocksToAnalyze.length) {
          await this.delay(1000);
        }
      }
      
      // 성공적으로 분석된 종목만 필터링
      const validAnalyses = analyses.filter(analysis => analysis.success);
      
      // 각 종목에 대한 투자 점수 계산
      const scoredStocks = validAnalyses.map(analysis => {
        const investmentScore = this.analyzer.calculateInvestmentScore(analysis);
        return {
          ...analysis,
          investmentScore
        };
      });
      
      // 점수순 정렬
      const sortedStocks = scoredStocks.sort((a, b) => 
        b.investmentScore.totalScore - a.investmentScore.totalScore
      );
      
      // 상위 5개 추천
      const topRecommendations = sortedStocks.slice(0, 5);
      
      return {
        month: this.getCurrentMonthName(),
        category,
        totalAnalyzed: analyses.length,
        successfulAnalyses: validAnalyses.length,
        recommendations: topRecommendations,
        generatedAt: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('Error generating monthly recommendations:', error);
      return {
        error: error.message,
        month: this.getCurrentMonthName(),
        category,
        recommendations: [],
        generatedAt: new Date().toISOString()
      };
    }
  }

  // 특정 카테고리의 종목 목록 반환
  getStocksForCategory(category) {
    switch (category) {
      case 'ai':
        return this.stockLists.ai;
      case 'semiconductor':
        return this.stockLists.semiconductor;
      case 'popular':
        return this.stockLists.popular;
      case 'all':
        // 중복 제거하여 모든 카테고리 합치기
        const allStocks = [...this.stockLists.ai, ...this.stockLists.semiconductor, ...this.stockLists.popular];
        return [...new Set(allStocks)];
      default:
        return this.stockLists.popular;
    }
  }

  // 현재 월 이름 반환
  getCurrentMonthName() {
    const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', 
                       '7월', '8월', '9월', '10월', '11월', '12월'];
    return monthNames[new Date().getMonth()];
  }

  // 지연 함수
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 추천 결과를 UI에 표시
  displayRecommendations(recommendations) {
    const container = document.getElementById('monthly-recommendations-content');
    if (!container) {
      console.error('Recommendations container not found');
      return;
    }

    if (recommendations.error) {
      container.innerHTML = `
        <div class="error-message">
          <h4>추천 생성 중 오류 발생</h4>
          <p>${recommendations.error}</p>
        </div>
      `;
      return;
    }

    const { month, category, recommendations: stocks, totalAnalyzed, successfulAnalyses } = recommendations;

    let html = `
      <div class="recommendations-header">
        <h3>${month} 추천 종목 (${category})</h3>
        <p class="analysis-summary">총 ${totalAnalyzed}개 종목 중 ${successfulAnalyses}개 분석 완료</p>
      </div>
      <div class="recommendations-list">
    `;

    if (stocks.length === 0) {
      html += '<p class="no-recommendations">현재 추천할 종목이 없습니다.</p>';
    } else {
      stocks.forEach((stock, index) => {
        const score = stock.investmentScore;
        const scorePercentage = (score.totalScore * 100).toFixed(0);
        
        html += `
          <div class="recommendation-item" data-ticker="${stock.ticker}">
            <div class="recommendation-rank">${index + 1}</div>
            <div class="recommendation-details">
              <div class="ticker-name">
                <span class="ticker">${stock.ticker}</span>
                <span class="recommendation-badge ${score.recommendation.toLowerCase().replace(' ', '-')}">${score.recommendation}</span>
              </div>
              <div class="score-info">
                <div class="total-score">종합점수: ${scorePercentage}/100</div>
                <div class="confidence">신뢰도: ${score.confidence}</div>
              </div>
              <div class="score-breakdown">
                <span class="score-item">기술: ${(score.technicalScore * 100).toFixed(0)}</span>
                <span class="score-item">펀더멘털: ${(score.fundamentalScore * 100).toFixed(0)}</span>
                <span class="score-item">계절성: ${(score.seasonalScore * 100).toFixed(0)}</span>
              </div>
              <div class="recommendation-reason">${score.reason}</div>
            </div>
            <button class="analyze-button" onclick="this.selectStock('${stock.ticker}')">분석</button>
          </div>
        `;
      });
    }

    html += '</div>';
    container.innerHTML = html;

    // 클릭 이벤트 추가
    container.querySelectorAll('.recommendation-item').forEach(item => {
      item.addEventListener('click', () => {
        const ticker = item.dataset.ticker;
        this.selectStockForAnalysis(ticker);
      });
    });
  }

  // 종목 선택하여 상세 분석
  selectStockForAnalysis(ticker) {
    console.log(`Selecting ${ticker} for detailed analysis`);
    
    // TradingView 차트 업데이트
    if (window.ChartManager) {
      ChartManager.updateSymbol(ticker);
    }
    
    // 상세 분석 실행
    if (window.StockDetailAnalyzer) {
      StockDetailAnalyzer.analyzeStock(ticker);
    }
    
    // 종목 선택 표시 업데이트
    document.querySelectorAll('.stock-ticker').forEach(el => {
      el.classList.remove('selected');
      if (el.textContent === ticker) {
        el.classList.add('selected');
      }
    });
  }
}

// 전역 객체로 내보내기
window.StockRecommendationSystem = StockRecommendationSystem;
