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
    
    // If no description available
    if (!englishDescription || englishDescription.trim() === '') {
      return '회사 설명을 사용할 수 없습니다.';
    }
    
    // Try to translate to Korean
    try {
      console.log(`Translating description for ${ticker}...`);
      const translatedDescription = await translate(englishDescription, { to: 'ko' });
      
      // Check if translation was successful (sometimes returns original text)
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

async function calculateInvestmentScore(ticker) {
  try {
    // Get necessary data + AI analysis
    const [technicalAnalysis, seasonalAnalysis, quoteSummary, aiAnalysis] = await Promise.all([
      getTechnicalAnalysis(ticker),
      getSeasonalAnalysis(ticker),
      getQuoteSummary(ticker),
      getAIAnalysis(ticker) // AI 분석 추가
    ]);
    
    // Calculate individual scores
    const technicalScore = calculateTechnicalScore(technicalAnalysis);
    const seasonalScore = calculateSeasonalScore(seasonalAnalysis);
    const fundamentalScore = calculateFundamentalScore(quoteSummary);
    const aiScore = calculateAIScore(aiAnalysis); // AI 점수 추가
    
    // Weighted total score with AI included
    const totalScore = (technicalScore * 0.3) + (seasonalScore * 0.25) + (fundamentalScore * 0.25) + (aiScore * 0.2);
    
    // Generate recommendation
    let recommendation = 'Hold';
    if (totalScore >= 0.75) {
      recommendation = 'Strong Buy';
    } else if (totalScore >= 0.65) {
      recommendation = 'Buy';
    } else if (totalScore <= 0.3) {
      recommendation = 'Sell';
    } else if (totalScore <= 0.4) {
      recommendation = 'Weak Hold';
    }
    
    // Generate reasons with AI insights
    const reasons = [];
    if (technicalScore >= 0.7) reasons.push('강력한 기술적 신호');
    if (seasonalScore >= 0.7) reasons.push('유리한 시기적 요인');
    if (fundamentalScore >= 0.7) reasons.push('탄탄한 기본기');
    if (aiScore >= 0.7) reasons.push('AI 긍정적 분석'); // AI 추가
    if (technicalScore <= 0.3) reasons.push('약한 기술적 신호');
    if (seasonalScore <= 0.3) reasons.push('불리한 시기적 요인');
    if (fundamentalScore <= 0.3) reasons.push('우려되는 밸류에이션');
    if (aiScore <= 0.3) reasons.push('AI 부정적 전망'); // AI 추가
    
    return {
      ticker,
      totalScore,
      technicalScore,
      seasonalScore,
      fundamentalScore,
      aiScore, // AI 점수 포함
      recommendation,
      reasons,
      details: {
        technical: technicalAnalysis,
        seasonal: seasonalAnalysis,
        quote: quoteSummary,
        ai: aiAnalysis // AI 분석 결과 포함
      },
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error(`Error calculating investment score for ${ticker}:`, error);
    return {
      ticker,
      error: 'Error calculating investment score',
      totalScore: 0.5,
      technicalScore: 0.5,
      seasonalScore: 0.5,
      fundamentalScore: 0.5,
      aiScore: 0.5, // AI 점수 기본값
      recommendation: 'Hold',
      reasons: ['데이터 분석 중 오류 발생'],
      timestamp: new Date().toISOString()
    };
  }
}

// AI 분석 함수 추가
async function getAIAnalysis(ticker) {
  try {
    // AI 서비스에 직접 접근 (임시)
    const HuggingFaceService = require('./ai/simpleAIService');
    const aiService = new HuggingFaceService();
    
    const sentiment = await aiService.analyzeSentiment(ticker);
    return sentiment;
  } catch (error) {
    console.error(`AI analysis failed for ${ticker}:`, error.message);
    return {
      sentiment: 'neutral',
      confidence: 0.5,
      analysis: 'AI 분석을 사용할 수 없습니다.',
      aiProvider: 'error'
    };
  }
}

// AI 점수 계산 함수 추가
function calculateAIScore(aiAnalysis) {
  if (!aiAnalysis || aiAnalysis.aiProvider === 'error') {
    return 0.5; // 중립
  }
  
  let score = 0.5; // 기본 점수
  
  // 센티멘트 기반 점수
  if (aiAnalysis.sentiment === 'positive') {
    score = 0.7 + (aiAnalysis.confidence * 0.3); // 0.7-1.0
  } else if (aiAnalysis.sentiment === 'negative') {
    score = 0.3 - (aiAnalysis.confidence * 0.3); // 0.0-0.3
  } else {
    score = 0.4 + (aiAnalysis.confidence * 0.2); // 0.4-0.6
  }
  
  return Math.max(0, Math.min(1, score));
}

function calculateTechnicalScore(analysis) {
  if (!analysis || analysis.error) return 0.5;
  
  let score = 0.5; // Base score
  
  // RSI scoring
  if (analysis.rsi) {
    const rsi = parseFloat(analysis.rsi);
    if (rsi >= 30 && rsi <= 70) {
      score += 0.1; // Neutral RSI is good
    } else if (rsi < 30) {
      score += 0.2; // Oversold - potential buy
    } else {
      score -= 0.1; // Overbought - caution
    }
  }
  
  // Signal scoring
  if (analysis.signal === 'Buy') {
    score += 0.3;
  } else if (analysis.signal === 'Sell') {
    score -= 0.3;
  }
  
  // Trend strength scoring
  if (analysis.trendStrength === 'Strong') {
    score += 0.2;
  } else if (analysis.trendStrength === 'Weak') {
    score -= 0.1;
  }
  
  return Math.max(0, Math.min(1, score));
}

function calculateSeasonalScore(analysis) {
  if (!analysis || analysis.error) return 0.5;
  
  // Simple seasonal scoring based on current month
  const currentMonth = new Date().getMonth() + 1;
  
  // Extract month number from bestMonth if available
  if (analysis.bestMonth) {
    const bestMonthMatch = analysis.bestMonth.match(/(\d+)/);
    if (bestMonthMatch) {
      const bestMonth = parseInt(bestMonthMatch[1]);
      if (currentMonth === bestMonth) {
        return 0.8; // High score for best month
      } else if (Math.abs(currentMonth - bestMonth) <= 1) {
        return 0.7; // Good score for adjacent months
      }
    }
  }
  
  return 0.5; // Neutral score
}

function calculateFundamentalScore(quote) {
  if (!quote || quote.error) return 0.5;
  
  let score = 0.5; // Base score
  
  // P/E ratio scoring
  if (quote.peRatio && quote.peRatio !== 'N/A') {
    const pe = parseFloat(quote.peRatio);
    if (pe > 0 && pe < 15) {
      score += 0.2; // Low P/E is good
    } else if (pe >= 15 && pe <= 25) {
      score += 0.1; // Reasonable P/E
    } else if (pe > 35) {
      score -= 0.1; // High P/E is concerning
    }
  }
  
  // Dividend yield scoring
  if (quote.dividendYield && quote.dividendYield !== 'N/A') {
    const dividend = parseFloat(quote.dividendYield);
    if (dividend >= 2) {
      score += 0.1; // Good dividend
    }
  }
  
  // 52-week position scoring
  if (quote.currentPrice && quote.currentPrice !== 'N/A' && 
      quote.fiftyTwoWeekHigh && quote.fiftyTwoWeekHigh !== 'N/A' && 
      quote.fiftyTwoWeekLow && quote.fiftyTwoWeekLow !== 'N/A') {
    const current = parseFloat(quote.currentPrice);
    const high = parseFloat(quote.fiftyTwoWeekHigh);
    const low = parseFloat(quote.fiftyTwoWeekLow);
    const position = ((current - low) / (high - low)) * 100;
    
    if (position <= 30) {
      score += 0.15; // Near 52-week low - potential value
    } else if (position >= 70) {
      score -= 0.05; // Near 52-week high - potential overvaluation
    }
  }
  
  return Math.max(0, Math.min(1, score));
}

module.exports = {
  getHistoricalData,
  getTechnicalAnalysis,
  getSeasonalAnalysis,
  getCompanyInfo,
  getQuoteSummary,
  calculateInvestmentScore,
};
