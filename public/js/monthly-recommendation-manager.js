// Monthly Recommendation Manager - 메인 컨트롤러
const MonthlyRecommendationManager = {
  initialized: false,
  initialAnalysisDone: false, // 초기 분석 실행 여부 플래그

  init() {
    if (this.initialized) return;
    console.log('Initializing Monthly Recommendation Manager');
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

          console.log(`Initial analysis trigger: Highest score stock is ${ticker}.`);
          
          // 다른 모듈을 호출하여 차트와 상세 분석을 업데이트
          if (ChartManager) ChartManager.updateSymbol(ticker);
          if (StockDetailAnalyzer) StockDetailAnalyzer.analyzeStock(ticker);

          this.initialAnalysisDone = true; // 플래그를 설정하여 다시 실행되지 않도록 함
        }
      }

      RecommendationUI.displayRecommendations(data);
    } catch (error) {
      console.error('Error loading monthly recommendations:', error);
      RecommendationUI.showError('추천 데이터를 불러오는 중 오류가 발생했습니다.');
    }
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
