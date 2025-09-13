// Main client script - handles initialization and coordination
document.addEventListener('DOMContentLoaded', () => {
  // Initialize all components
  try {
    if (window.SeasonalAnalysis) {
      SeasonalAnalysis.init();
    }
  } catch (e) {
    console.error('SeasonalAnalysis init failed:', e);
  }
  
  try {
    if (window.StockSelector) {
      StockSelector.init();
    }
  } catch (e) {
    console.error('StockSelector init failed:', e);
  }
  
  try {
    if (window.TooltipManager) {
      TooltipManager.init();
    }
  } catch (e) {
    console.error('TooltipManager init failed:', e);
  }
  
  // 새로운 월별 추천 시스템 초기화
  if (window.MonthlyRecommendationManager) {
    try {
      MonthlyRecommendationManager.init();
    } catch (e) {
      console.error('MonthlyRecommendationManager init failed:', e);
    }
  }
});
