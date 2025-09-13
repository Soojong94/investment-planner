// Monthly Recommendation Manager - 메인 컨트롤러
const MonthlyRecommendationManager = {
  initialized: false,
  initialAnalysisDone: false, // 초기 분석 실행 여부 플래그

  init() {
    if (this.initialized) return;
    this.loadMonthlyRecommendations();
    this.setupEventListeners();
    this.initialized = true;
  },

  setupEventListeners() {
    const refreshBtn = document.getElementById('refresh-recommendations');
    const sectorFilter = document.getElementById('sector-filter');

    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => this.loadMonthlyRecommendations());
    }
    if (sectorFilter) {
      sectorFilter.addEventListener('change', (e) => this.loadSectorRecommendations(e.target.value));
    }
  },

  // 데이터를 가져와서 반환하는 역할만 수행
  async fetchMonthlyRecommendations() {
    const response = await fetch('/api/recommendations/monthly');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  },

  async loadMonthlyRecommendations() {
    try {
      RecommendationUI.showLoading();
      const data = await this.fetchMonthlyRecommendations();

      // 페이지 로드 후 첫 실행 시에만 최고 점수 종목으로 자동 분석
      if (!this.initialAnalysisDone) {
        if (data && data.recommendations && data.recommendations.length > 0) {
          const bestStock = data.recommendations[0]; // API가 이미 정렬했으므로 첫 번째가 최고 점수
          const ticker = bestStock.ticker;



          // 최고 점수 종목으로 자동 설정
          this.setupBestStockAuto(ticker);

          this.initialAnalysisDone = true; // 플래그를 설정하여 다시 실행되지 않도록 함
        }
      }

      RecommendationUI.displayRecommendations(data);
    } catch (error) {
      console.error('Error loading monthly recommendations:', error);
      RecommendationUI.showError('추천 데이터를 불러오는 중 오류가 발생했습니다.');
    }
  },

  // 최고 점수 종목으로 자동 설정하는 메서드
  setupBestStockAuto(ticker) {
    // 단계별로 실행하여 안정성 향상
    let step = 0;

    const executeStep = () => {
      step++;

      switch (step) {
        case 1:
          // 1단계: TradingView 로딩 대기
          if (typeof TradingView !== 'undefined') {
            setTimeout(executeStep, 500);
          } else {
            setTimeout(executeStep, 1000);
            step--; // 단계 되돌리기
          }
          break;

        case 2:
          // 2단계: ChartManager로 TradingView 차트 업데이트
          if (window.ChartManager) {
            window.ChartManager.updateSymbol(ticker);

            // 추천 카드에서 해당 종목 하이라이트
            this.highlightBestStockCard(ticker);

            setTimeout(executeStep, 1000);
          } else {
            setTimeout(executeStep, 500);
            step--; // 단계 되돌리기
          }
          break;

        case 3:
          // 3단계: 상세 분석 시작
          if (window.StockDetailAnalyzer) {
            window.StockDetailAnalyzer.analyzeStock(ticker, 'auto_best_stock');
          } else {
            setTimeout(executeStep, 500);
            step--; // 단계 되돌리기
          }
          break;

        default:
          break;
      }
    };

    // 첫 단계 시작
    setTimeout(executeStep, 1500); // 1.5초 후 시작
  },

  // 최고 점수 카드 하이라이트
  highlightBestStockCard(ticker) {
    // 다음 틱에 실행하여 DOM이 완전히 렌더링된 후 실행
    setTimeout(() => {
      const card = document.querySelector(`[data-ticker="${ticker}"]`);
      if (card) {
        // 기존 선택 상태 제거
        document.querySelectorAll('.recommendation-card.selected').forEach(c => {
          c.classList.remove('selected');
        });

        // 최고 점수 카드 하이라이트
        card.classList.add('selected', 'best-pick');
      }
    }, 100);
  },

  async loadSectorRecommendations(sector) {
    try {
      RecommendationUI.showLoading();
      const endpoint = sector === 'all' ? '/api/recommendations/monthly' : `/api/recommendations/sector/${sector}`;
      const response = await fetch(endpoint);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      RecommendationUI.displayRecommendations(data);

    } catch (error) {
      console.error('Error loading sector recommendations:', error);
      RecommendationUI.showError('섹터 추천 데이터를 불러오는 중 오류가 발생했습니다.');
    }
  }
};

window.MonthlyRecommendationManager = MonthlyRecommendationManager;
