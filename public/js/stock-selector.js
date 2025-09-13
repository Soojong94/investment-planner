// Stock Selector - handles stock list display and selection
const StockSelector = {
  init() {


    this.fetchStockList(CONFIG.endpoints.ai_stocks, 'ai-stocks');
    this.fetchStockList(CONFIG.endpoints.semiconductor_stocks, 'semiconductor-stocks');
  },

  async fetchStockList(url, containerId) {


    const container = document.querySelector(`#${containerId} .stock-list-grid`);
    if (!container) {
      console.error(`Container with ID ${containerId} not found.`);

      return;
    }


    container.innerHTML = '<p>로딩 중...</p>';

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch stock list from ${url}`);
      }
      const stocks = await response.json();

      container.innerHTML = '';
      stocks.forEach(stock => {
        const stockSpan = document.createElement('span');
        stockSpan.className = 'stock-ticker';
        stockSpan.textContent = stock;
        stockSpan.dataset.ticker = stock;

        stockSpan.addEventListener('click', () => {
          this.selectStock(stock, stockSpan);
        });
        container.appendChild(stockSpan);
      });


    } catch (error) {
      console.error(`Error fetching stock list from ${url}:`, error);
      container.innerHTML = '<p>종목 목록 로드 중 오류 발생.</p>';
    }
  },

  selectStock(ticker, element) {
    // Remove selection from all other tickers
    document.querySelectorAll('.stock-ticker').forEach(ticker => {
      ticker.classList.remove('selected');
    });

    // Add selection to clicked ticker
    element.classList.add('selected');

    // Update TradingView chart
    if (window.ChartManager) {
      ChartManager.updateSymbol(ticker);
    }

    // 새로운 상세 분석 사용 (기존 방식 대신)
    if (window.StockDetailAnalyzer) {
      StockDetailAnalyzer.analyzeStock(ticker);
    } else if (window.StockAnalyzer) {
      // 폴백: 기존 방식 사용
      StockAnalyzer.displayQuoteSummary(ticker);
      StockAnalyzer.displayTechnicalAnalysis(ticker);
      StockAnalyzer.displayCompanyInfo(ticker);
    }
  }
};

// window 객체에 등록
window.StockSelector = StockSelector;
