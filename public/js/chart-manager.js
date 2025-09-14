// TradingView Chart Manager - 배포용 안정 버전
const ChartManager = {
  currentSymbol: null,
  widgetReady: false,

  init() {
    if (!Logger.isProduction) {
      Logger.log('📈 ChartManager 초기화됨');
    }
  },

  updateSymbol(ticker) {
    const fullSymbol = CONFIG.exchangeMapping[ticker] || `NASDAQ:${ticker}`;
    
    // 이미 같은 심볼이면 스킵
    if (this.currentSymbol === fullSymbol) {
      return;
    }
    
    // TradingView가 로드되었는지 확인
    if (typeof TradingView === 'undefined') {
      setTimeout(() => this.updateSymbol(ticker), 2000);
      return;
    }
    
    // 새로운 심볼 추적 시스템에 직접 전달
    if (window.TradingViewSymbolTracker) {
      window.TradingViewSymbolTracker.setSymbol(fullSymbol);
    }
    
    this.recreateWidget(ticker, fullSymbol);
  },

  recreateWidget(ticker, fullSymbol) {
    try {
      // 기존 위젯 제거
      const container = document.getElementById('tradingview_b4321');
      if (container) {
        container.innerHTML = '';
      }
      
      // 기존 위젯 참조 제거
      if (window.myTradingViewWidget) {
        try {
          window.myTradingViewWidget.remove();
        } catch (e) {
          // 조용히 무시
        }
        window.myTradingViewWidget = null;
      }
      
      // 잠시 대기 후 새 위젯 생성
      setTimeout(() => {
        try {
          window.myTradingViewWidget = new TradingView.widget({
            "width": "100%",
            "height": 480,
            "symbol": fullSymbol,
            "interval": "D",
            "timezone": "Etc/UTC",
            "theme": "dark",
            "style": "1",
            "locale": "kr",
            "toolbar_bg": "#131722",
            "enable_publishing": false,
            "allow_symbol_change": true,
            "container_id": "tradingview_b4321",
            "hide_side_toolbar": false,
            "studies": [],
            "onready": () => {
              this.widgetReady = true;
              this.currentSymbol = fullSymbol;
              
              // 심볼 추적 시스템에 업데이트
              if (window.TradingViewSymbolTracker) {
                window.TradingViewSymbolTracker.currentSymbol = fullSymbol;
              }
              
              // 전역 이벤트 발생시켜 다른 모듈에 알림
              const event = new CustomEvent('tradingViewSymbolChanged', { 
                detail: { ticker, fullSymbol } 
              });
              window.dispatchEvent(event);
            }
          });
          
        } catch (widgetError) {
          // 조용히 에러 처리
          if (!Logger.isProduction) {
            Logger.error('😱 TradingView 위젯 생성 실패:', widgetError);
          }
        }
      }, 200);
      
    } catch (error) {
      // 조용히 에러 처리
      if (!Logger.isProduction) {
        Logger.error('😱 위젯 재생성 중 오류:', error);
      }
    }
  },

  // 현재 표시 중인 심볼 반환
  getCurrentSymbol() {
    return this.currentSymbol;
  },

  // 강제로 심볼 업데이트 (캐시 무시)
  forceUpdateSymbol(ticker) {
    this.currentSymbol = null;
    this.updateSymbol(ticker);
  }
};

// 전역 등록
window.ChartManager = ChartManager;
