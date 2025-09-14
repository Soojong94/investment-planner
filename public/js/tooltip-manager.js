// Tooltip Manager - handles all tooltip functionality
const TooltipManager = {
  tooltipDefinitions: {
    'SMA': 'Simple Moving Average (단순 이동평균선): 특정 기간 동안의 종가를 평균한 값으로, 추세 파악에 사용됩니다.',
    '50-day SMA': '50일 단순 이동평균선: 지난 50일간의 평균 종가입니다. 단기 추세를 나타냅니다.',
    '200-day SMA': '200일 단순 이동평균선: 지난 200일간의 평균 종가입니다. 장기 추세를 나타냅니다.',
    'Buy': '매수 신호: 단기 이동평균선이 장기 이동평균선을 상향 돌파하는 골든 크로스 발생 시 나타나는 신호입니다.',
    'Sell': '매도 신호: 단기 이동평균선이 장기 이동평균선을 하향 돌파하는 데스 크로스 발생 시 나타나는 신호입니다.',
    'Hold': '보유 신호: 명확한 매수 또는 매도 신호가 없을 때 나타나는 신호입니다.',
    'Best Month': '최고 수익률 월: 과거 데이터에서 해당 섹터/종목이 평균적으로 가장 높은 수익률을 보인 월입니다.',
    'Worst Month': '최저 수익률 월: 과거 데이터에서 해당 섹터/종목이 평균적으로 가장 낮은 수익률을 보인 월입니다.',
    'P/E 비율': 'Price-to-Earnings Ratio (주가수익비율): 주가를 주당순이익으로 나눌 값으로, 주식의 가치 평가에 사용됩니다.',
    '배당 수익률': 'Dividend Yield: 연간 배당금을 주가로 나눌 값으로, 배당 수익의 비율을 나타냅니다.',
    '시가총액': 'Market Capitalization: 회사의 총 시장 가치로, 주가에 발행주식 수를 곱한 값입니다.',
    '베타': 'Beta: 주식의 시장 대비 변동성을 나타내는 지표로, 1보다 크면 시장보다 변동성이 높습니다.',
    '현재가': 'Current Price: 현재 거래되고 있는 주식의 가격입니다.',
    '52주 최고가': '52-Week High: 지난 52주(1년) 동안 기록한 최고 주가입니다.',
    '52주 최저가': '52-Week Low: 지난 52주(1년) 동안 기록한 최저 주가입니다.',
    '거래량': 'Volume: 특정 기간 동안 거래된 주식의 총 수량입니다.',
    '평균 거래량': 'Average Volume: 일정 기간 동안의 평균 거래량으로, 주식의 유동성을 나타냅니다.',
    'RSI': 'Relative Strength Index (상대강도지수): 0-100 범위의 지표로, 70 이상은 과매수, 30 이하는 과매도 영역입니다.',
    'MACD': 'Moving Average Convergence Divergence: 단기와 장기 이동평균의 차이를 나타내는 모멘텀 지표입니다.',
    '볼린저 밴드': 'Bollinger Bands: 주가의 변동성을 기반으로 한 기술적 지표로, 상한선과 하한선을 제공합니다.',
    '신뢰도': 'Confidence Level: 분석 결과에 대한 신뢰 수준으로, High/Moderate/Low로 표시됩니다.',
    '추세 강도': 'Trend Strength: 현재 추세의 강도를 Strong/Moderate/Weak로 나타내는 지표입니다.',
  },

  currentTooltip: null,
  hideTooltipTimeout: null,

  init() {
    this.bindEvents();
  },

  bindEvents() {
    // Show tooltip on mouseover
    document.addEventListener('mouseover', (event) => {
      const target = event.target;
      if (target.classList.contains('tooltip-term')) {
        this.showTooltip(target);
      }
    });

    // Hide tooltip on mouseout
    document.addEventListener('mouseout', (event) => {
      if (this.currentTooltip && (!event.relatedTarget || !event.relatedTarget.classList.contains('tooltip-term'))) {
        this.hideTooltip();
      }
    });

    // Prevent tooltip from hiding if mouse moves to tooltip
    document.addEventListener('mouseover', (event) => {
      if (event.target.classList.contains('tooltip')) {
        this.cancelHideTooltip();
      }
    });
  },

  showTooltip(target) {
    const term = target.dataset.term;
    const explanation = this.tooltipDefinitions[term];

    if (explanation) {
      this.cancelHideTooltip();

      if (this.currentTooltip) {
        this.currentTooltip.remove();
      }

      this.currentTooltip = document.createElement('div');
      this.currentTooltip.className = 'tooltip';
      this.currentTooltip.textContent = explanation;
      document.body.appendChild(this.currentTooltip);

      // Position the tooltip
      const rect = target.getBoundingClientRect();
      this.currentTooltip.style.left = `${rect.left + window.scrollX}px`;
      this.currentTooltip.style.top = `${rect.bottom + window.scrollY + 5}px`;
      
      // Make it visible
      this.currentTooltip.style.opacity = '1';
      this.currentTooltip.style.display = 'block';
    }
  },

  hideTooltip() {
    this.hideTooltipTimeout = setTimeout(() => {
      if (this.currentTooltip) {
        this.currentTooltip.style.opacity = '0';
        this.currentTooltip.addEventListener('transitionend', () => {
          if (this.currentTooltip) {
            this.currentTooltip.remove();
            this.currentTooltip = null;
          }
        });
      }
    }, 100);
  },

  cancelHideTooltip() {
    if (this.hideTooltipTimeout) {
      clearTimeout(this.hideTooltipTimeout);
      this.hideTooltipTimeout = null;
    }
  }
};

// TooltipManager를 window 객체에 등록
window.TooltipManager = TooltipManager;
