// Monthly Recommendation Manager - 메인 컨트롤러
const MonthlyRecommendationManager = {
  initialized: false,

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

  async loadMonthlyRecommendations() {
    try {
      RecommendationUI.showLoading();
      const response = await fetch('/api/recommendations/monthly');
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data = await response.json();
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
