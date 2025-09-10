# 투자 보조 프로그램

실시간 주식 데이터 기반 스마트 투자 분석 프로그램

## 🔍 현재 문제점 및 해결 방안

### 주요 문제점 분석:

1. **JavaScript 런타임 오류** ✅ 해결됨
   - `extractMonthNumber` 함수에서 undefined 값 처리 오류
   - **해결**: null/undefined 체크 및 안전한 문자열 처리 로직 추가

2. **API 엔드포인트 누락** ✅ 해결됨
   - `/api/score/:ticker` 엔드포인트 누락
   - **해결**: `calculateInvestmentScore` 함수 및 API 라우트 추가

3. **데이터 구조 불일치** ✅ 개선됨
   - 클라이언트와 서버 간 데이터 형태 불일치
   - **해결**: 안전한 데이터 처리 및 예외 처리 강화

## 📁 프로젝트 구조

```
investment-planner/
├── investment-program/          # 🆕 개선된 프로그램
│   ├── index.html              # 메인 인터페이스
│   ├── investment-analyzer.js   # 핵심 분석 엔진
│   ├── stock-recommendation-system.js  # 추천 시스템
│   └── improved-stock-analyzer.js      # 개선된 종목 분석기
├── public/                     # 기존 프로그램 (수정됨)
│   ├── index.html
│   └── js/
│       ├── stock-detail-analyzer.js  # ✅ 오류 수정됨
│       ├── stock-selector.js
│       └── ...
├── services/                   # 백엔드 서비스
│   ├── yahooFinanceService.js  # ✅ calculateInvestmentScore 추가
│   └── ...
├── routes/
│   └── api.js                  # ✅ /api/score/:ticker 추가
└── server.js                   # 서버 설정
```

## 🚀 실행 방법

### 1. 기존 프로그램 실행 (수정된 버전)
```bash
cd investment-planner
npm install
npm start
```
- 브라우저에서 `http://localhost:3000` 접속

### 2. 개선된 프로그램 실행
```bash
cd investment-planner
npm start
```
- 브라우저에서 `http://localhost:3000/investment-program/` 접속

## 🔧 해결된 문제들

### 1. extractMonthNumber 오류 수정
**기존 문제:**
```javascript
// 오류 발생 코드
if (monthString.includes(monthNames[i])) {  // monthString이 undefined일 때 오류
```

**해결된 코드:**
```javascript
// 안전한 처리
if (!monthString || typeof monthString !== 'string') {
  return 0;
}
if (monthString.includes(monthNames[i])) {
```

### 2. API 엔드포인트 추가
**추가된 기능:**
- `GET /api/score/:ticker` - 종목 투자 점수 계산
- `calculateInvestmentScore()` 함수 구현
- 기술적/펀더멘털/계절적 분석 통합

### 3. 안전한 데이터 처리
**개선사항:**
- 모든 API 호출에 예외 처리 추가
- null/undefined 체크 강화
- 점진적 데이터 로딩 (3개씩 배치 처리)

## 📊 주요 기능

### 1. 트레이딩뷰 차트 연동
- 실시간 주식 차트
- 기술적 지표 (RSI, MACD, 볼린저밴드)
- 종목 선택 시 자동 차트 업데이트

### 2. 티커 종목 선택
- **AI 관련 종목**: NVDA, MSFT, GOOG, META, AAPL, TSLA, AMD, PLTR, AVGO, AMZN
- **반도체 종목**: TSM, ASML, QCOM, AMAT, INTC, MU, ADI, MRVL, ARM, TXN
- 클릭 한 번으로 종목 선택 및 분석 시작

### 3. AI 종목 추천
- **월별 추천 시스템**: 현재 월에 최적화된 종목 추천
- **카테고리별 분석**: 전체, AI, 반도체, 인기종목 분류
- **실시간 점수 계산**: 기술적/펀더멘털/계절적 요인 종합 평가

### 4. 상세 종목 분석
- **종합 투자 점수**: 100점 만점 점수 시스템
- **기술적 분석**: RSI, MACD, 이동평균선, 매매신호
- **펀더멘털 분석**: P/E 비율, 시가총액, 배당수익률, 52주 고/저가
- **계절적 분석**: 월별 성과 패턴 및 최적 매수 시기

## 🎯 개선된 추천 시스템

### 점수 계산 방식
```javascript
총점 = (기술적분석 × 40%) + (펀더멘털 × 30%) + (계절성 × 30%)
```

### 추천 등급
- **Strong Buy** (75점 이상): 강력한 매수 추천
- **Buy** (65-74점): 매수 추천
- **Hold** (40-64점): 보유 권장
- **Sell** (25-39점): 매도 고려
- **Strong Sell** (25점 미만): 강력한 매도 추천

## 🛠️ 기술 스택

### Frontend
- **HTML5/CSS3**: 반응형 웹 인터페이스
- **Vanilla JavaScript**: 순수 자바스크립트 (프레임워크 의존성 최소화)
- **TradingView Widget**: 실시간 차트 연동

### Backend
- **Node.js**: 서버 런타임
- **Express.js**: 웹 프레임워크
- **Yahoo Finance API**: 실시간 주식 데이터
- **Google Translate**: 회사 설명 번역

### AI/ML (선택사항)
- **Hugging Face**: DeepSeek 모델 연동
- **Market Sentiment Analysis**: 시장 센티멘트 분석

## 🔄 사용 워크플로우

1. **프로그램 시작** → 서버 실행 (`npm start`)
2. **종목 선택** → AI/반도체 종목 중 클릭
3. **자동 분석** → 트레이딩뷰 차트 업데이트 + AI 분석 시작
4. **결과 확인** → 종합 점수, 추천 등급, 상세 분석 리포트
5. **월별 추천** → AI가 선별한 이번 달 최적 종목 확인

## ⚡ 성능 최적화

### API 호출 최적화
- **병렬 처리**: Promise.all()로 동시 API 호출
- **배치 처리**: 3개씩 그룹으로 나누어 API 부하 감소
- **에러 처리**: 실패한 API 호출이 전체 시스템에 영향 없도록 격리

### 사용자 경험 개선
- **로딩 상태 표시**: 분석 중 시각적 피드백
- **점진적 로딩**: 데이터 준비되는 대로 순차적 표시
- **에러 복구**: 재시도 버튼 및 대체 데이터 제공

## 🐛 알려진 제한사항

1. **API 제한**: Yahoo Finance API의 요청 제한 (분당 약 100회)
2. **실시간성**: 데이터는 실시간이지만 약간의 지연 가능
3. **AI 모델**: DeepSeek AI는 선택사항 (API 키 필요)

## 🔧 트러블슈팅

### 자주 발생하는 문제들

1. **"Cannot read properties of undefined"** 
   - ✅ 해결됨: 모든 데이터 접근에 안전 체크 추가

2. **"API call failed: 500"**
   - 원인: Yahoo Finance API 일시적 장애
   - 해결: 페이지 새로고침 또는 잠시 후 재시도

3. **추천 종목이 표시되지 않음**
   - 원인: 네트워크 연결 문제
   - 해결: 인터넷 연결 확인 후 "추천 종목 새로 생성" 버튼 클릭

## 📈 향후 개선 계획

1. **데이터베이스 연동**: 히스토리 데이터 저장 및 백테스팅
2. **포트폴리오 관리**: 개인 포트폴리오 추적 기능
3. **알림 시스템**: 목표가 도달 시 알림
4. **모바일 앱**: React Native 기반 모바일 버전
5. **고급 AI**: GPT-4 기반 시장 분석 및 뉴스 요약

## 🤝 기여 방법

1. 이슈 리포트: GitHub Issues에 버그 신고
2. 기능 제안: 새로운 기능 아이디어 제안
3. 코드 기여: Pull Request 환영
4. 문서 개선: README 및 주석 개선

---

**⚠️ 투자 주의사항**: 이 프로그램은 투자 참고용이며, 실제 투자 결정은 본인의 책임입니다. 과거 데이터는 미래 수익을 보장하지 않습니다.