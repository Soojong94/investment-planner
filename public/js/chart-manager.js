// TradingView Chart Manager
const ChartManager = {
  init() {
    console.log('ChartManager initialized');
  },

  updateSymbol(ticker) {
    const fullSymbol = CONFIG.exchangeMapping[ticker] || `NASDAQ:${ticker}`;
    console.log('Attempting to update TradingView symbol to:', fullSymbol);
    
    // 새로운 심볼 추적 시스템에 직접 전달
    if (window.TradingViewSymbolTracker) {
      console.log('Using new symbol tracking system');
      window.TradingViewSymbolTracker.setSymbol(fullSymbol);
    }
    
    const recreateWidget = () => {
      console.log('Recreating TradingView widget with new symbol:', fullSymbol);
      
      // 기존 위젯 제거
      const container = document.getElementById('tradingview_b4321');
      if (container) {
        container.innerHTML = '';
      }
      
      try {
        // 새 위젯 생성
        window.myTradingViewWidget = new TradingView.widget({
          "width": "100%",
          "height": 480,
          "symbol": fullSymbol,
          "interval": "D",
          "timezone": "Etc/UTC",
          "theme": "light",
          "style": "1",
          "locale": "kr",
          "toolbar_bg": "#f1f3f6",
          "enable_publishing": false,
          "allow_symbol_change": true,
          "container_id": "tradingview_b4321",
          "onready": function() {
            window.tradingViewWidgetReady = true;
            console.log('TradingView widget recreated successfully with symbol:', fullSymbol);
            
            // 심볼 추적 시스템에 업데이트
            if (window.TradingViewSymbolTracker) {
              window.TradingViewSymbolTracker.currentSymbol = fullSymbol;
            }
          }
        });
        
        NotificationManager.show(`차트가 ${ticker}로 변경되었습니다`, 'success');
        
      } catch (error) {
        console.error('Error recreating TradingView widget:', error);
        NotificationManager.show('차트 업데이트에 실패했습니다', 'error');
      }
    };
    
    // TradingView 라이브러리가 로드되었는지 확인
    if (typeof TradingView !== 'undefined') {
      recreateWidget();
    } else {
      console.log('Waiting for TradingView library to load...');
      const checkTradingView = setInterval(() => {
        if (typeof TradingView !== 'undefined') {
          clearInterval(checkTradingView);
          recreateWidget();
        }
      }, 100);
      
      // 5초 후 타임아웃
      setTimeout(() => {
        clearInterval(checkTradingView);
        console.error('Timeout waiting for TradingView library');
        NotificationManager.show('TradingView 라이브러리 로딩 타임아웃', 'error');
      }, 5000);
    }
  }
};
