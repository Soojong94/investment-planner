// 환경변수 로드
require('dotenv').config();

const express = require('express');
const path = require('path');

const app = express();
const port = 3000;

// Import API routes
const apiRoutes = require('./routes/api');

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Use API routes
app.use('/api', apiRoutes);

// Catch-all route for the frontend
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  
  // AI API 상태 확인
  const deepSeekApiKey = process.env.DEEPSEEK_API_KEY;
  const huggingFaceApiKey = process.env.HUGGINGFACE_API_KEY;
  
  console.log('\n🤖 AI 서비스 상태:');
  
  // Hugging Face (DeepSeek 모델) - 현재 사용 중
  if (huggingFaceApiKey && huggingFaceApiKey.startsWith('hf_')) {
    console.log('✅ Hugging Face API 키가 설정되어 있습니다.');
    console.log('🤖 DeepSeek 모델이 Hugging Face에서 로드됩니다.');
    console.log('📈 고급 AI 추론 및 시장 분석 기능 활성화');
  } else {
    console.log('⚠️  Hugging Face API 키가 설정되지 않았습니다.');
    console.log('📝 .env 파일에 HUGGINGFACE_API_KEY를 설정하면 DeepSeek AI 모델을 사용할 수 있습니다.');
  }
  
  // DeepSeek Direct API (대안)
  if (deepSeekApiKey && deepSeekApiKey.startsWith('sk-')) {
    console.log('📝 DeepSeek Direct API 키도 설정되어 있습니다 (대안용).');
  }
  
  if (!huggingFaceApiKey && !deepSeekApiKey) {
    console.log('🔧 Mock 데이터로 기본 기능이 동작합니다.');
  }
  
  console.log('\n📊 사용 가능한 기능:');
  console.log('- 실시간 주식 데이터 조회');
  console.log('- 기술적 분석 (RSI, MACD, 볼린저밴드)');
  console.log('- 계절적 분석 (월별 성과)');
  console.log('- 종합 투자 점수 계산');
  console.log('- 월별 추천 종목 생성');
  if (huggingFaceApiKey && huggingFaceApiKey.startsWith('hf_')) {
    console.log('- DeepSeek AI 모델 기반 시장 센티멘트 분석');
    console.log('- 고급 AI 종목 추천 및 투자 전략');
    console.log('- 한국어 자연어 분석 결과');
  }
  
  console.log('\n🌐 웹 인터페이스: http://localhost:3000');
  console.log('🔍 API 상태 확인: http://localhost:3000/api/ai/status');
  console.log('📈 월별 추천: http://localhost:3000/api/recommendations/monthly');
  console.log('\n📚 설정 가이드:');
  console.log('- Hugging Face: https://huggingface.co/settings/tokens');
  console.log('- DeepSeek Direct: https://platform.deepseek.com/');
});
