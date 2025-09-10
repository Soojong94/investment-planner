# 🚀 주식 투자 보조 프로그램

**Hugging Face DeepSeek 모델**을 활용한 AI 기반 투자 분석 및 종목 추천 시스템

## ✨ 주요 기능

### 📊 실시간 데이터 분석
- **Yahoo Finance API**: 실시간 주식 데이터 수집
- **기술적 분석**: RSI, MACD, 볼린저밴드, 이동평균선
- **계절적 분석**: 월별 주식 성과 패턴 분석
- **펀더멘털 분석**: P/E 비율, 배당수익률, 52주 고저가

### 🤖 AI 기반 분석
- **DeepSeek 모델**: Hugging Face에서 호스팅되는 고성능 추론 모델
- **시장 센티멘트**: 실시간 시장 분위기 분석 (positive/neutral/negative)
- **종목 추천**: AI 기반 Buy/Hold/Sell 신호 및 점수 시스템
- **강화된 시기적 분석**: DeepSeek AI를 활용한 월별 투자 최적화
- **한국어 지원**: 자연스러운 한국어 분석 결과

### 🎯 종합 추천 시스템
- **4가지 분석 통합**: 기술적/계절적/펀더멘털/AI 분석 가중평균
- **월별 최적화**: 현재 월에 특화된 종목 추천
- **리스크 관리**: 시장 상황에 따른 리스크 레벨 조정
- **포트폴리오 제안**: 섹터별, 위험도별 다양한 전략

## 🚀 빠른 시작

### 1. 프로젝트 설치
```bash
git clone <repository-url>
cd investment-planner
npm install
```

### 2. Hugging Face API 키 설정
1. **https://huggingface.co/settings/tokens** 접속
2. "New token" 생성 (Read 권한)
3. `.env` 파일에 설정:
```bash
HUGGINGFACE_API_KEY=hf_your_token_here
```

### 3. 서버 실행
```bash
npm start
```

### 4. 웹 인터페이스 접속
**http://localhost:3000** 접속

## 🎮 사용법

### 웹 인터페이스
1. **TradingView 차트**: 실시간 시장 차트 확인
2. **종목 선택**: AI/반도체 종목 클릭으로 상세 분석
3. **분석 결과**: 기술적 지표, 시기적 분석, AI 추천 확인

### API 엔드포인트
- **AI 상태 확인**: `GET /api/ai/status`
- **시장 센티멘트**: `GET /api/ai/sentiment`
- **AI 종목 추천**: `GET /api/ai/recommendations`
- **월별 종합 추천**: `GET /api/recommendations/monthly`
- **개별 종목 분석**: `GET /api/score/:ticker`
- **기술적 분석**: `GET /api/analysis/:ticker`
- **기본 계절적 분석**: `GET /api/seasonal/:ticker`
- **강화된 시기적 분석**: `GET /api/seasonal/enhanced/:ticker`
- **AI 시기적 인사이트**: `GET /api/seasonal/ai/:ticker`

## 🤖 AI 모델 정보

### 사용 모델
- **주요**: `deepseek-ai/deepseek-r1-distill-llama-70b` (추론 전문)
- **대화**: `deepseek-ai/DeepSeek-V2-Chat`
- **대안**: `ProsusAI/finbert` (금융 특화)

### 특징
- **고급 추론**: DeepSeek R1의 강력한 reasoning 능력
- **자동 Fallback**: 모델 로딩 실패 시 대안 모델 자동 사용
- **한국어 최적화**: 자연스러운 한국어 분석 및 추천
- **실시간 적응**: 시장 상황에 따른 동적 분석

## 📈 분석 시스템

### 종합 점수 계산
```
총점 = (기술적 분석 × 40%) + (계절적 분석 × 30%) + (AI 분석 × 20%) + (펀더멘털 × 10%)
```

### 투자 신호
- **85점 이상**: 강력 추천 (Strong Buy)
- **70-84점**: 추천 (Buy)
- **40-69점**: 보통 (Hold)
- **40점 미만**: 비추천 (Sell)

### 리스크 레벨
- **Low**: 안정적 시장, 높은 신뢰도
- **Medium**: 일반적 시장 상황
- **High**: 불확실성 높은 시장

## 🔧 설정 및 사용자 정의

### 환경 변수
```bash
# Hugging Face API (권장)
HUGGINGFACE_API_KEY=hf_your_token_here

# DeepSeek Direct API (대안)
DEEPSEEK_API_KEY=sk_your_key_here
```

### 분석 가중치 조정
`services/investmentRecommendationService.js`에서 가중치 수정 가능:
```javascript
this.weights = {
  technical: 0.4,    // 기술적 분석
  seasonal: 0.3,     // 계절적 분석
  sentiment: 0.2,    // AI 센티멘트
  fundamental: 0.1   // 펀더멘털
};
```

## 📊 지원 종목

### AI 섹터
`NVDA`, `MSFT`, `GOOG`, `GOOGL`, `PLTR`, `AMD`, `AVGO`, `META`, `AAPL`, `TSLA`, `CRWD`, `PANW`, `SNOW`, `SMCI`, `MRVL`, `AMZN`, `ADBE`, `NOW`, `ISRG`, `SNPS`

### 반도체 섹터
`NVDA`, `TSM`, `AVGO`, `ASML`, `AMD`, `QCOM`, `AMAT`, `ARM`, `TXN`, `INTC`, `MU`, `ADI`, `NXPI`, `MRVL`, `MPWR`

## 🚨 에러 처리

### 자동 복구 기능
- **모델 로딩 실패**: 10초 후 자동 재시도 (최대 3회)
- **API 호출 실패**: Fallback 모델 자동 전환
- **네트워크 오류**: Mock 데이터로 기본 기능 유지

### 상태 모니터링
- 실시간 API 상태 확인
- 모델 응답 시간 측정
- 에러 로그 및 복구 상태 표시

## 💰 비용 정보

### Hugging Face Inference API
- **무료 티어**: 월 10,000 요청
- **이 프로그램**: 일 20-50회 호출 (월 1,000회 미만)
- **예상 비용**: 무료 티어로 충분

## 🔍 문제 해결

### 일반적인 문제
1. **API 키 오류**
   - `.env` 파일의 키 형식 확인 (`hf_`로 시작)
   - Hugging Face 토큰 권한 확인

2. **모델 로딩 느림**
   - 첫 요청 시 10-30초 소요 정상
   - 이후 요청은 2-5초 내 응답

3. **AI 분석 실패**
   - Fallback 모델 자동 사용
   - Mock 데이터로 기본 기능 유지

### 새로운 기능 테스트

**강화된 시기적 분석 테스트:**
```bash
# NVDA 종목의 현재 월 AI 강화 시기적 분석
curl http://localhost:3000/api/seasonal/enhanced/NVDA

# 특정 월 분석 (3월 예시)
curl "http://localhost:3000/api/seasonal/enhanced/NVDA?month=3"

# AI 인사이트만 간단히 확인
curl http://localhost:3000/api/seasonal/ai/NVDA
```

**종합 분석 테스트:**
```bash
# 월별 최적 종목 추천 (강화된 시기적 분석 포함)
curl http://localhost:3000/api/recommendations/monthly

# 개별 종목 종합 점수
curl http://localhost:3000/api/score/NVDA
```

### 로그 확인
서버 실행 시 다음 정보 확인:
```
✅ Hugging Face API 키가 설정되어 있습니다.
🤖 DeepSeek 모델이 Hugging Face에서 로드됩니다.
📈 고급 AI 추론 및 시장 분석 기능 활성화
```

## 📚 추가 자료

- **상세 설정**: [HUGGINGFACE_DEEPSEEK_SETUP.md](HUGGINGFACE_DEEPSEEK_SETUP.md)
- **API 문서**: 서버 실행 후 `/api/ai/status` 확인
- **Hugging Face**: https://huggingface.co/settings/tokens
- **DeepSeek**: https://platform.deepseek.com/

## 🤝 기여

이슈 및 개선 사항은 GitHub 이슈로 제보해주세요.

## 📄 라이선스

ISC License

---

**주의**: 이 프로그램은 투자 참고용이며, 실제 투자 결정은 신중히 하시기 바랍니다.
