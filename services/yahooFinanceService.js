const yahooFinance = require('yahoo-finance2').default;
const translate = require('translate-google');

async function getHistoricalData(ticker) {
  try {
    const queryOptions = {
      period1: '2023-01-01', // Start date
      interval: '1d', // 1 day interval
    };
    const result = await yahooFinance.historical(ticker, queryOptions);
    return result;
  } catch (error) {
    console.error(`Error fetching historical data for ${ticker}:`, error);
    throw error; // Re-throw the error to be handled by the caller
  }
}

// Helper function to calculate Simple Moving Average
function calculateSMA(data, period) {
  if (data.length < period) {
    return null;
  }
  const closingPrices = data.slice(-period).map(d => d.close);
  const sum = closingPrices.reduce((acc, price) => acc + price, 0);
  return sum / period;
}

// Helper function to calculate RSI (Relative Strength Index)
function calculateRSI(data, period = 14) {
  if (data.length < period + 1) {
    return null;
  }
  
  const prices = data.slice(-(period + 1)).map(d => d.close);
  let gains = 0;
  let losses = 0;
  
  for (let i = 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    if (change > 0) {
      gains += change;
    } else {
      losses += Math.abs(change);
    }
  }
  
  const avgGain = gains / period;
  const avgLoss = losses / period;
  
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

// Helper function to calculate MACD
function calculateMACD(data) {
  if (data.length < 26) {
    return { macd: null, signal: null, histogram: null };
  }
  
  const ema12 = calculateEMA(data, 12);
  const ema26 = calculateEMA(data, 26);
  
  if (ema12 === null || ema26 === null) {
    return { macd: null, signal: null, histogram: null };
  }
  
  const macd = ema12 - ema26;
  return { macd, signal: null, histogram: null }; // Simplified for now
}

// Helper function to calculate EMA (Exponential Moving Average)
function calculateEMA(data, period) {
  if (data.length < period) {
    return null;
  }
  
  const prices = data.map(d => d.close);
  const multiplier = 2 / (period + 1);
  let ema = prices.slice(0, period).reduce((sum, price) => sum + price, 0) / period;
  
  for (let i = period; i < prices.length; i++) {
    ema = (prices[i] * multiplier) + (ema * (1 - multiplier));
  }
  
  return ema;
}

// Helper function to calculate Bollinger Bands
function calculateBollingerBands(data, period = 20, multiplier = 2) {
  if (data.length < period) {
    return { upper: null, middle: null, lower: null };
  }
  
  const prices = data.slice(-period).map(d => d.close);
  const sma = prices.reduce((sum, price) => sum + price, 0) / period;
  
  const variance = prices.reduce((sum, price) => sum + Math.pow(price - sma, 2), 0) / period;
  const stdDev = Math.sqrt(variance);
  
  return {
    upper: sma + (stdDev * multiplier),
    middle: sma,
    lower: sma - (stdDev * multiplier)
  };
}

// Helper function to determine trend strength
function getTrendStrength(sma50, sma200, currentPrice) {
  if (!sma50 || !sma200 || !currentPrice) return 'Unknown';
  
  const smaSpread = Math.abs(sma50 - sma200) / sma200 * 100;
  const priceToSma50 = Math.abs(currentPrice - sma50) / sma50 * 100;
  
  if (smaSpread > 5 && priceToSma50 < 3) {
    return 'Strong';
  } else if (smaSpread > 2 && priceToSma50 < 5) {
    return 'Moderate';
  } else {
    return 'Weak';
  }
}

async function getTechnicalAnalysis(ticker) {
  try {
    // Fetch 2 years of data for comprehensive analysis
    const twoYearsAgo = new Date(); 
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

    const queryOptions = {
      period1: twoYearsAgo.toISOString().split('T')[0],
      interval: '1d',
    };
    const historicalData = await yahooFinance.historical(ticker, queryOptions);

    if (historicalData.length < 200) {
      return { ticker, signal: 'Data Insufficient', analysis: 'Not enough historical data for analysis' };
    }

    // Calculate various technical indicators
    const currentPrice = historicalData[historicalData.length - 1].close;
    const sma50 = calculateSMA(historicalData, 50);
    const sma200 = calculateSMA(historicalData, 200);
    const rsi = calculateRSI(historicalData, 14);
    const macd = calculateMACD(historicalData);
    const bollingerBands = calculateBollingerBands(historicalData, 20);
    const trendStrength = getTrendStrength(sma50, sma200, currentPrice);

    // Analyze signals from different indicators
    const signals = [];
    let bullishCount = 0;
    let bearishCount = 0;

    // SMA Analysis
    if (sma50 && sma200) {
      if (sma50 > sma200) {
        signals.push('골든 크로스: 단기 상승 추세');
        bullishCount++;
      } else {
        signals.push('데스 크로스: 단기 하락 추세');
        bearishCount++;
      }
      
      if (currentPrice > sma50) {
        signals.push('주가가 50일 이평선 상단');
        bullishCount++;
      } else {
        signals.push('주가가 50일 이평선 하단');
        bearishCount++;
      }
    }

    // RSI Analysis
    if (rsi !== null) {
      if (rsi > 70) {
        signals.push('RSI 과매수 구간 (매도 고려)');
        bearishCount++;
      } else if (rsi < 30) {
        signals.push('RSI 과매도 구간 (매수 고려)');
        bullishCount++;
      } else {
        signals.push('RSI 중립 구간');
      }
    }

    // Bollinger Bands Analysis
    if (bollingerBands.upper && bollingerBands.lower) {
      if (currentPrice > bollingerBands.upper) {
        signals.push('볼린저 밴드 상단 돌파 (과매수)');
        bearishCount++;
      } else if (currentPrice < bollingerBands.lower) {
        signals.push('볼린저 밴드 하단 돌파 (과매도)');
        bullishCount++;
      } else {
        signals.push('볼린저 밴드 내부 유지');
      }
    }

    // MACD Analysis (simplified)
    if (macd.macd !== null) {
      if (macd.macd > 0) {
        signals.push('MACD 긍정적 신호');
        bullishCount++;
      } else {
        signals.push('MACD 부정적 신호');
        bearishCount++;
      }
    }

    // Determine overall signal
    let overallSignal = 'Hold';
    let confidence = 'Low';
    
    if (bullishCount > bearishCount + 1) {
      overallSignal = 'Buy';
      confidence = bullishCount - bearishCount > 2 ? 'High' : 'Moderate';
    } else if (bearishCount > bullishCount + 1) {
      overallSignal = 'Sell';
      confidence = bearishCount - bullishCount > 2 ? 'High' : 'Moderate';
    } else {
      confidence = 'Moderate';
    }

    return {
      ticker,
      signal: overallSignal,
      confidence,
      trendStrength,
      currentPrice: currentPrice.toFixed(2),
      sma50: sma50 ? sma50.toFixed(2) : null,
      sma200: sma200 ? sma200.toFixed(2) : null,
      rsi: rsi ? rsi.toFixed(1) : null,
      macd: macd.macd ? macd.macd.toFixed(3) : null,
      bollingerBands: {
        upper: bollingerBands.upper ? bollingerBands.upper.toFixed(2) : null,
        middle: bollingerBands.middle ? bollingerBands.middle.toFixed(2) : null,
        lower: bollingerBands.lower ? bollingerBands.lower.toFixed(2) : null
      },
      signals,
      analysis: `종합 분석: ${signals.length}개 지표 중 ${bullishCount}개 상승, ${bearishCount}개 하락 신호. 추세 강도: ${trendStrength}`
    };
  } catch (error) {
    console.error(`Error performing technical analysis for ${ticker}:`, error);
    return { ticker, signal: 'Error', error: error.message };
  }
}

async function getSeasonalAnalysis(ticker) {
  try {
    const fiveYearsAgo = new Date();
    fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);

    const queryOptions = {
      period1: fiveYearsAgo.toISOString().split('T')[0],
      interval: '1mo', // Fetch monthly data to simplify
    };
    const monthlyData = await yahooFinance.historical(ticker, queryOptions);

    if (monthlyData.length < 12) {
      return { ticker, bestMonth: 'N/A', worstMonth: 'N/A', analysis: 'Data Insufficient' };
    }

    const monthlyReturns = {};

    for (let i = 1; i < monthlyData.length; i++) {
      const month = monthlyData[i].date.getMonth(); // 0 = Jan, 1 = Feb, etc.
      const prevClose = monthlyData[i-1].close;
      const currentClose = monthlyData[i].close;
      const percentChange = ((currentClose - prevClose) / prevClose) * 100;

      if (!monthlyReturns[month]) {
        monthlyReturns[month] = [];
      }
      monthlyReturns[month].push(percentChange);
    }

    const avgMonthlyReturns = {};
    for (const month in monthlyReturns) {
      const returns = monthlyReturns[month];
      const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
      avgMonthlyReturns[month] = avgReturn;
    }

    let bestMonth = null;
    let worstMonth = null;
    let maxReturn = -Infinity;
    let minReturn = Infinity;

    for (const month in avgMonthlyReturns) {
      if (avgMonthlyReturns[month] > maxReturn) {
        maxReturn = avgMonthlyReturns[month];
        bestMonth = parseInt(month);
      }
      if (avgMonthlyReturns[month] < minReturn) {
        minReturn = avgMonthlyReturns[month];
        worstMonth = parseInt(month);
      }
    }

    const monthNames = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];

    return {
      ticker,
      bestMonth: `${monthNames[bestMonth]} (${maxReturn.toFixed(2)}%)`,
      worstMonth: `${monthNames[worstMonth]} (${minReturn.toFixed(2)}%)`,
    };

  } catch (error) {
    console.error(`Error performing seasonal analysis for ${ticker}:`, error);
    return { ticker, error: error.message };
  }
}

async function getCompanyInfo(ticker) {
  try {
    const result = await yahooFinance.quoteSummary(ticker, { modules: ['summaryProfile'] });
    const englishDescription = result.summaryProfile ? result.summaryProfile.longBusinessSummary : null;
    
    if (!englishDescription || englishDescription.trim() === '') {
      return '회사 설명을 사용할 수 없습니다.';
    }
    
    try {
      console.log(`Translating description for ${ticker}...`);
      const translatedDescription = await translate(englishDescription, { to: 'ko' });
      
      if (translatedDescription && translatedDescription !== englishDescription) {
        console.log(`Translation successful for ${ticker}`);
        return translatedDescription;
      } else {
        console.warn(`Translation failed or returned same text for ${ticker}`);
        return `${englishDescription}\n\n번역: 자동 번역에 실패했습니다. 원문을 제공합니다.`;
      }
    } catch (translateError) {
      console.warn(`Translation error for ${ticker}:`, translateError.message);
      return `${englishDescription}\n\n번역: 번역 서비스에 연결할 수 없습니다. 원문을 제공합니다.`;
    }
  } catch (error) {
    console.error(`Error fetching company info for ${ticker}:`, error);
    return '회사 설명을 가져오는 중 오류가 발생했습니다.';
  }
}

async function getQuoteSummary(ticker) {
  try {
    const result = await yahooFinance.quoteSummary(ticker, { 
      modules: ['price', 'summaryDetail', 'defaultKeyStatistics'] 
    });
    
    const price = result.price || {};
    const summaryDetail = result.summaryDetail || {};
    const keyStats = result.defaultKeyStatistics || {};
    
    return {
      ticker,
      currentPrice: price.regularMarketPrice || 'N/A',
      previousClose: price.regularMarketPreviousClose || 'N/A',
      changePercent: price.regularMarketChangePercent ? (price.regularMarketChangePercent * 100).toFixed(2) : 'N/A',
      marketCap: summaryDetail.marketCap || 'N/A',
      peRatio: summaryDetail.trailingPE || 'N/A',
      dividendYield: summaryDetail.dividendYield ? (summaryDetail.dividendYield * 100).toFixed(2) : 'N/A',
      fiftyTwoWeekHigh: summaryDetail.fiftyTwoWeekHigh || 'N/A',
      fiftyTwoWeekLow: summaryDetail.fiftyTwoWeekLow || 'N/A',
      volume: price.regularMarketVolume || 'N/A',
      avgVolume: summaryDetail.averageVolume || 'N/A',
      beta: keyStats.beta || 'N/A'
    };
  } catch (error) {
    console.error(`Error fetching quote summary for ${ticker}:`, error);
    return {
      ticker,
      error: 'Error fetching stock data'
    };
  }
}

module.exports = {
  getHistoricalData,
  getTechnicalAnalysis,
  getSeasonalAnalysis,
  getCompanyInfo,
  getQuoteSummary,
};