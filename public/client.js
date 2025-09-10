// Main client script - handles initialization and coordination
document.addEventListener('DOMContentLoaded', () => {
  console.log('Client-side script loaded.');
  
  // 모든 필수 올브젝트 확인
  console.log('Required objects check:', {
    StockDetailAnalyzer: !!window.StockDetailAnalyzer,
    NotificationManager: !!window.NotificationManager,
    SeasonalAnalysis: !!window.SeasonalAnalysis,
    StockSelector: !!window.StockSelector,
    TooltipManager: !!window.TooltipManager,
    MonthlyRecommendationManager: !!window.MonthlyRecommendationManager
  });
  
  // TradingView 위젯 상태 확인
  console.log('TradingView status:', {
    widgetReady: window.tradingViewWidgetReady,
    widget: !!window.myTradingViewWidget,
    TradingViewDefined: typeof TradingView !== 'undefined'
  });
  
  // StockDetailAnalyzer 방법 확인
  if (window.StockDetailAnalyzer) {
    console.log('StockDetailAnalyzer methods:', Object.getOwnPropertyNames(window.StockDetailAnalyzer));
  }
  
  // Initialize all components
  try {
    SeasonalAnalysis.init();
    console.log('SeasonalAnalysis initialized');
  } catch (e) {
    console.error('SeasonalAnalysis init failed:', e);
  }
  
  try {
    StockSelector.init();
    console.log('StockSelector initialized');
  } catch (e) {
    console.error('StockSelector init failed:', e);
  }
  
  try {
    TooltipManager.init();
    console.log('TooltipManager initialized');
  } catch (e) {
    console.error('TooltipManager init failed:', e);
  }
  
  // 새로운 월별 추천 시스템 초기화
  if (window.MonthlyRecommendationManager) {
    try {
      MonthlyRecommendationManager.init();
      console.log('MonthlyRecommendationManager initialized');
    } catch (e) {
      console.error('MonthlyRecommendationManager init failed:', e);
    }
  }
  
  
  
  console.log('Client initialization completed');
});
