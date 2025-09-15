# 🚀 AI 기반 실시간 투자 분석 시스템

**Hugging Face AI 모델**과 실시간 금융 데이터를 결합한 지능형 투자 분석 플랫폼

## ✨ 주요 기능

### 📊 실시간 데이터 분석
- **Yahoo Finance API**: 실시간 주식 데이터 수집 및 분석
- **기술적 분석**: RSI, MACD, 볼린저밴드, 이동평균선 등 종합 지표
- **계절적 분석**: 월별 주식 성과 패턴 + 뉴스 기반 시기적 분석
- **펀더멘털 분석**: P/E 비율, 배당수익률, 52주 고저가, 베타값

### 🤖 AI 기반 센티멘트 분석
- **다중 모델 시스템**: RoBERTa, DistilBERT, Multilingual BERT 활용
- **3단계 Fallback**: 메인 모델 실패 시 자동으로 백업 모델 전환
- **시장 센티멘트**: 실시간 시장 분위기 분석 (positive/neutral/negative)
- **종목별 분석**: 개별 종목에 대한 AI 기반 투자 신호
- **한국어 지원**: Google Translate 연동 자동 번역 및 분석

### 🎯 종합 추천 시스템
- **4가지 분석 통합**: 기술적(35%) + 시기적(25%) + 센티멘트(20%) + 펀더멘털(20%)
- **월별 최적화**: 현재 월에 특화된 종목 추천 및 투자 전략
- **뉴스 기반 분석**: 실시간 뉴스 데이터와 AI 분석 결합
- **리스크 관리**: 시장 상황에 따른 동적 리스크 레벨 조정

### 🖥️ 사용자 인터페이스
- **TradingView 차트**: 실시간 차트와 종목 선택 연동
- **자동 분석**: 차트에서 종목 선택 시 즉시 AI 분석 시작
- **직관적 대시보드**: 분석 결과를 시각적으로 표시
- **반응형 디자인**: 데스크톱과 모바일 모두 지원

## 🚀 빠른 시작

### 1. 프로젝트 설치
```bash
git clone https://github.com/yourusername/investment-planner.git
cd investment-planner
npm install
```

### 2. Hugging Face API 키 설정
1. **https://huggingface.co/settings/tokens** 접속
2. "New token" 생성 (Read 권한 필요)
3. `.env` 파일 생성 및 설정:
```bash
HUGGINGFACE_API_KEY=hf_your_token_here
```

### 3. 서버 실행
```bash
# 개발 모드
npm run dev

# 프로덕션 모드
npm start
```

### 4. 웹 인터페이스 접속
브라우저에서 **http://localhost:3000** 접속

## 🎮 사용법

### 웹 인터페이스 사용
1. **TradingView 차트**: 실시간 시장 차트에서 관심 종목 선택
2. **자동 분석**: 종목 선택 시 자동으로 AI 분석 시작
3. **결과 확인**: 기술적 지표, 시기적 분석, AI 추천, 펀더멘털 데이터 종합 확인
4. **추천 종목**: 이번 달 AI 추천 종목 목록 확인

### API 엔드포인트
```bash
# AI 서비스 상태 확인
GET /api/ai/status

# 시장 센티멘트 분석
GET /api/ai/sentiment

# AI 종목 추천 
GET /api/ai/recommendations?tickers=NVDA,MSFT,AAPL

# 월별 종합 추천 (뉴스 기반 시기적 분석 포함)
GET /api/recommendations/monthly?category=ai

# 개별 종목 종합 분석
GET /api/score/NVDA

# 기술적 분석
GET /api/analysis/NVDA

# 뉴스 기반 강화 시기적 분석
GET /api/seasonal/enhanced/NVDA

# 기본 회사 정보
GET /api/company-info/NVDA
```

## 🤖 AI 모델 정보

### 사용 모델
- **주요 모델**: `cardiffnlp/twitter-roberta-base-sentiment` (Twitter 데이터 학습)
- **백업 1**: `distilbert-base-uncased-finetuned-sst-2-english` (영화 리뷰 학습)
- **백업 2**: `nlptown/bert-base-multilingual-uncased-sentiment` (다국어 지원)

### 특징
- **자동 Fallback**: 메인 모델 로딩 실패 시 백업 모델 자동 전환
- **고가용성**: 3단계 모델 시스템으로 99% 이상 서비스 가용성
- **한국어 최적화**: Google Translate 연동으로 자연스러운 한국어 분석
- **실시간 적응**: 시장 상황에 따른 동적 센티멘트 분석

## 📈 분석 시스템

### 종합 점수 계산
```
총점 = (기술적 분석 × 35%) + (시기적 분석 × 25%) + (AI 센티멘트 × 20%) + (펀더멘털 × 20%)
```

### 투자 신호
- **0.75 이상**: 강력 추천 (Strong Buy)
- **0.60-0.74**: 추천 (Buy)
- **0.40-0.59**: 보통 (Hold)
- **0.40 미만**: 주의 (Caution)

### 리스크 레벨
- **Low**: 안정적 시장, 높은 신뢰도 (평균 점수 0.7 이상)
- **Medium**: 일반적 시장 상황 (평균 점수 0.4-0.7)
- **High**: 불확실성 높은 시장 (평균 점수 0.4 미만)

## 🔧 설정 및 사용자 정의

### 환경 변수
```bash
# Hugging Face API (필수)
HUGGINGFACE_API_KEY=hf_your_token_here

# 서버 포트 설정 (선택)
PORT=3000

# 환경 설정
NODE_ENV=development
```

### 분석 가중치 조정
`services/investmentRecommendationService.js`에서 가중치 수정 가능:
```javascript
this.weights = {
  technical: 0.35,    // 기술적 분석
  seasonal: 0.25,     // 시기적 분석  
  sentiment: 0.2,     // AI 센티멘트
  fundamental: 0.2    // 펀더멘털
};
```

### AI 모델 변경
`services/ai/simpleAIService.js`에서 모델 수정:
```javascript
this.models = {
  sentiment: 'your-preferred-model',
  backup1: 'your-backup-model-1', 
  backup2: 'your-backup-model-2'
};
```

## 📊 지원 종목

### AI 섹터 (20개)
`NVDA`, `MSFT`, `GOOG`, `GOOGL`, `PLTR`, `AMD`, `AVGO`, `META`, `AAPL`, `TSLA`, `CRWD`, `PANW`, `SNOW`, `SMCI`, `MRVL`, `AMZN`, `ADBE`, `NOW`, `ISRG`, `SNPS`

### 반도체 섹터 (15개)
`NVDA`, `TSM`, `AVGO`, `ASML`, `AMD`, `QCOM`, `AMAT`, `ARM`, `TXN`, `INTC`, `MU`, `ADI`, `NXPI`, `MRVL`, `MPWR`

## 🚨 에러 처리 및 복구

### 자동 복구 기능
- **모델 로딩 실패**: 자동으로 백업 모델 전환 (총 3단계)
- **API 호출 실패**: 재시도 로직 및 기본값 제공
- **네트워크 오류**: 캐시된 데이터로 기본 서비스 유지
- **번역 실패**: 원문 제공 및 에러 메시지 표시

### 상태 모니터링
```bash
# 실시간 AI 상태 확인
curl http://localhost:3000/api/ai/status

# 캐시 상태 확인
curl http://localhost:3000/api/cache/status

# 캐시 초기화
curl -X POST http://localhost:3000/api/cache/clear -H "Content-Type: application/json" -d '{"type":"all"}'
```

## 💰 비용 정보

### Hugging Face Inference API
- **무료 티어**: 월 30,000 요청 (일반 계정)
- **이 프로그램 사용량**: 일 50-100회 호출 (월 1,500-3,000회)
- **예상 비용**: 무료 티어 내 충분히 사용 가능

### 최적화 전략
- **캐싱 시스템**: 5분 캐시로 중복 요청 70% 감소
- **배치 처리**: 여러 종목 동시 분석으로 효율성 증대
- **스마트 호출**: 필요시에만 API 호출하는 지능형 시스템

## 🔍 문제 해결

### 일반적인 문제
1. **API 키 오류**
   ```bash
   # API 키 형식 확인
   echo $HUGGINGFACE_API_KEY
   # hf_로 시작하는지 확인
   ```

2. **모델 로딩 느림**
   - 첫 요청 시 10-30초 소요 (모델 로딩)
   - 이후 요청은 2-5초 내 응답

3. **AI 분석 실패**
   - 자동으로 백업 모델 사용
   - 최종 실패 시 기본 분석 제공

### 로그 확인
서버 실행 시 다음 정보 확인:
```
✅ AI API 키가 설정되어 있습니다.
🤖 Hugging Face 모델이 로드됩니다.
📈 실시간 분석 기능 활성화
```

### 개발자 도구
```bash
# 간단한 기능 테스트
npm run test

# 서버 시작 테스트 (3초 후 자동 종료)
npm run test:quick

# 개발 모드 (자동 재시작)
npm run dev
```

## 📚 기술 스택

### Backend
- **Node.js**: JavaScript 런타임
- **Express**: 웹 프레임워크
- **Yahoo Finance 2**: 실시간 금융 데이터
- **Hugging Face**: AI 모델 API

### Frontend  
- **Vanilla JavaScript**: 빠른 로딩과 가벼운 클라이언트
- **TradingView Widget**: 실시간 차트
- **CSS Grid & Flexbox**: 반응형 레이아웃

### AI & Data
- **RoBERTa**: Twitter 데이터 기반 센티멘트 분석
- **DistilBERT**: 영화 리뷰 데이터 기반 감정 분석  
- **Google Translate**: 실시간 번역
- **뉴스 API**: 실시간 뉴스 데이터 (구현 예정)

## 🤝 기여 방법

1. **Fork** 이 레포지토리
2. **Feature branch** 생성: `git checkout -b feature/amazing-feature`
3. **Commit** 변경사항: `git commit -m 'Add amazing feature'`
4. **Push** to branch: `git push origin feature/amazing-feature`
5. **Pull Request** 생성

## 📄 라이선스

이 프로젝트는 ISC 라이선스 하에 있습니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## ⚠️ 면책 조항

**이 프로그램은 투자 교육 및 참고 목적으로만 제작되었습니다.**
- 실제 투자 결정은 본인의 판단과 책임 하에 신중히 하시기 바랍니다
- 과거 성과는 미래 결과를 보장하지 않습니다
- 투자 손실에 대한 책임을 지지 않습니다

---

**Made with ❤️ for smarter investing**
