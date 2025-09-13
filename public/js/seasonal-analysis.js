// Seasonal Analysis - handles individual stock seasonal pattern analysis
const SeasonalAnalysis = {
  currentTicker: null,

  init() {
    // 초기화 시에는 아무것도 표시하지 않음
  },

  // 개별 종목의 시기적 분석을 표시하는 메인 함수
  async displayIndividualSeasonalAnalysis(ticker) {
    this.currentTicker = ticker;

    const container = document.getElementById('seasonal-analysis-content');
    if (!container) {
      return;
    }

    // 로딩 상태 표시
    this.showLoadingState(container, ticker);

    try {
      // 현재는 Yahoo Finance API의 기본 시기적 분석만 사용
      // 나중에 Hugging Face API로 대체 예정
      const seasonalData = await this.fetchBasicSeasonalData(ticker);
      
      // 시기적 분석 결과 표시
      this.renderSeasonalAnalysis(container, ticker, seasonalData);
      
    } catch (error) {
      console.error(`Error fetching seasonal analysis for ${ticker}:`, error);
      this.showErrorState(container, ticker, error.message);
    }
  },

  // 기본 시기적 데이터 가져오기 (현재 구현)
  async fetchBasicSeasonalData(ticker) {
    const response = await fetch(`${CONFIG.endpoints.seasonal}/${ticker}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch seasonal data for ${ticker}`);
    }
    return await response.json();
  },

  // 향후 Hugging Face API로 고도화된 시기적 분석 (준비된 구조)
  async fetchAdvancedSeasonalData(ticker) {
    // TODO: Hugging Face API 연동
    // 1. 월별 상세 수익률 (12개월 차트)
    // 2. 계절별 분석 (봄/여름/가을/겨울)  
    // 3. 분기별 실적 패턴
    // 4. 요일별 수익률 패턴
    // 5. 연중 최고/최저 구간
    // 6. AI 기반 시기적 추천
    
    const response = await fetch(`${CONFIG.endpoints.seasonal}/detailed/${ticker}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch advanced seasonal data for ${ticker}`);
    }
    return await response.json();
  },

  // 로딩 상태 표시
  showLoadingState(container, ticker) {
    container.innerHTML = `
      <div class="seasonal-analysis-header">
        <h3>${ticker} 시기적 분석</h3>
        <div class="loading-spinner">
          <p>🔄 시기적 패턴을 분석하고 있습니다...</p>
        </div>
      </div>
    `;
  },

  // 에러 상태 표시
  showErrorState(container, ticker, errorMessage) {
    container.innerHTML = `
      <div class="seasonal-analysis-header">
        <h3>${ticker} 시기적 분석</h3>
        <div class="error-message">
          <p>❌ 시기적 분석을 불러오는데 실패했습니다.</p>
          <p class="error-details">${errorMessage}</p>
          <button onclick="SeasonalAnalysis.displayIndividualSeasonalAnalysis('${ticker}')" class="retry-button">
            다시 시도
          </button>
        </div>
      </div>
    `;
  },

  // 시기적 분석 결과 렌더링
  renderSeasonalAnalysis(container, ticker, data) {
    const chartsContainer = document.getElementById('seasonal-charts-container');
    const insightsContainer = document.getElementById('seasonal-insights-container');

    container.innerHTML = `
      <div class="seasonal-analysis-header">
        <h3>${ticker} 시기적 분석</h3>
        <p class="analysis-subtitle">과거 데이터를 기반으로 한 시기적 패턴 분석</p>
      </div>
    `;

    // 기본 시기적 정보 표시 (현재 구현)
    this.renderBasicSeasonalInfo(container, data);

    // 향후 추가될 고급 차트들을 위한 컨테이너 준비
    this.prepareAdvancedChartContainers(container);
  },

  // 기본 시기적 정보 렌더링 (현재 구현)
  renderBasicSeasonalInfo(container, data) {
    const basicInfoDiv = document.createElement('div');
    basicInfoDiv.className = 'basic-seasonal-info';
    
    basicInfoDiv.innerHTML = `
      <div class="seasonal-summary-grid">
        <div class="seasonal-card best-month">
          <h4>📈 최고 성과 월</h4>
          <p class="month-name">${data.bestMonth || 'N/A'}</p>
          <p class="month-detail">역사적으로 가장 좋은 성과를 보인 달</p>
        </div>
        <div class="seasonal-card worst-month">
          <h4>📉 최저 성과 월</h4>
          <p class="month-name">${data.worstMonth || 'N/A'}</p>
          <p class="month-detail">역사적으로 부진했던 달</p>
        </div>
      </div>
      
      <div class="upgrade-notice">
        <h4>🚀 고도화 예정</h4>
        <p>AI 기반 상세 시기적 분석이 곧 추가됩니다:</p>
        <ul>
          <li>📊 월별 상세 수익률 차트</li>
          <li>🌱 계절별 패턴 분석</li>
          <li>📈 분기별 실적 트렌드</li>
          <li>📅 요일별 수익률 패턴</li>
          <li>🎯 AI 기반 시기적 투자 추천</li>
        </ul>
      </div>
    `;
    
    container.appendChild(basicInfoDiv);
  },

  // 향후 고급 차트를 위한 컨테이너 준비
  prepareAdvancedChartContainers(container) {
    const advancedSection = document.createElement('div');
    advancedSection.className = 'advanced-seasonal-section';
    advancedSection.style.display = 'none'; // 현재는 숨김
    
    advancedSection.innerHTML = `
      <div class="advanced-charts-grid">
        <div id="monthly-returns-chart" class="chart-container">
          <h4>월별 수익률 패턴</h4>
          <!-- 차트가 여기에 렌더링됩니다 -->
        </div>
        <div id="seasonal-patterns-chart" class="chart-container">
          <h4>계절별 성과 분석</h4>
          <!-- 차트가 여기에 렌더링됩니다 -->
        </div>
        <div id="quarterly-trends-chart" class="chart-container">
          <h4>분기별 트렌드</h4>
          <!-- 차트가 여기에 렌더링됩니다 -->
        </div>
        <div id="weekday-patterns-chart" class="chart-container">
          <h4>요일별 패턴</h4>
          <!-- 차트가 여기에 렌더링됩니다 -->
        </div>
      </div>
      
      <div id="ai-insights-section" class="ai-insights">
        <h4>🤖 AI 시기적 분석 인사이트</h4>
        <!-- AI 분석 결과가 여기에 표시됩니다 -->
      </div>
    `;
    
    container.appendChild(advancedSection);
  },

  // 향후 Hugging Face API 연동 시 호출될 메서드
  async enableAdvancedAnalysis(ticker) {
    console.log(`Enabling advanced seasonal analysis for ${ticker}`);
    
    try {
      // Hugging Face API 호출
      const advancedData = await this.fetchAdvancedSeasonalData(ticker);
      
      // 고급 차트 렌더링
      this.renderAdvancedCharts(advancedData);
      
      // 고급 섹션 표시
      const advancedSection = document.querySelector('.advanced-seasonal-section');
      if (advancedSection) {
        advancedSection.style.display = 'block';
      }
      
    } catch (error) {
      console.error('Error enabling advanced seasonal analysis:', error);
    }
  },

  // 향후 구현될 고급 차트 렌더링
  renderAdvancedCharts(data) {
    // TODO: 차트 라이브러리 사용하여 시각화
    // 1. 월별 수익률 바차트
    // 2. 계절별 방사형 차트  
    // 3. 분기별 라인차트
    // 4. 요일별 히트맵
    console.log('Advanced charts will be rendered here', data);
  },

  // 현재 표시된 종목 확인
  getCurrentTicker() {
    return this.currentTicker;
  },

  // 분석 초기화
  clearAnalysis() {
    this.currentTicker = null;
    const container = document.getElementById('seasonal-analysis-content');
    if (container) {
      container.innerHTML = '<p>종목을 선택하면 상세한 시기적 분석이 표시됩니다.</p>';
    }
  }
};

// 전역에서 접근 가능하도록 등록
window.SeasonalAnalysis = SeasonalAnalysis;