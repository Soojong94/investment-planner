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

app.listen(port, async () => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (!isProduction) {
    console.log(`📈 투자 보조 프로그램 서버 시작: http://localhost:${port}`);
    
    // AI API 상태 확인 (개발 모드에서만 표시)
    const huggingFaceApiKey = process.env.HUGGINGFACE_API_KEY;
    
    if (huggingFaceApiKey && huggingFaceApiKey.startsWith('hf_')) {
      console.log('🤖 AI API 키 설정 확인됨 - 연결 테스트 중...');
      
      // AI 서비스 연결 테스트
      const HuggingFaceDeepSeekService = require('./services/ai/simpleAIService');
      const testAiService = new HuggingFaceDeepSeekService();
      
      try {
        const status = await testAiService.checkApiStatus();
        console.log(`✅ AI 서비스 연결 성공: ${status.model}`);
        console.log('🔥 실제 AI 분석 기능 활성화됨 (Mock 데이터 없음)');
      } catch (error) {
        console.log(`❌ AI 서비스 연결 실패: ${error.message}`);
        console.log('⚠️ 실제 주식 데이터만 제공됨 (AI 분석 불가)');
      }
    } else {
      console.log('⚠️ AI API 키 미설정 - AI 기능 비활성화');
      console.log('💡 .env 파일에 HUGGINGFACE_API_KEY를 설정하면 AI 분석 기능을 사용할 수 있습니다');
    }
  } else {
    console.log('🚀 투자 보조 프로그램 서버 시작됨');
  }
});
