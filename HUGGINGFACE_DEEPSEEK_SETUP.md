# Hugging Face에서 DeepSeek 모델 사용 가이드

## 개요
이 프로젝트는 **Hugging Face**에서 호스팅되는 **DeepSeek 모델**을 사용하여 AI 기반 종목 추천을 제공합니다.

## 장점
- **무료/저렴한 비용**: Hugging Face Inference API는 DeepSeek Direct API보다 비용 효율적
- **다양한 모델**: DeepSeek-R1, DeepSeek-V2-Chat, DeepSeek-Coder 등 선택 가능
- **높은 추론 능력**: DeepSeek 모델의 강력한 reasoning 능력 활용
- **한국어 지원**: 자연스러운 한국어 분석 결과 제공

## 1. Hugging Face API 키 받기

### 1.1 회원가입 및 로그인
1. **https://huggingface.co/** 접속
2. 회원가입 또는 로그인

### 1.2 토큰 생성
1. 우상단 프로필 → **Settings** 클릭
2. 왼쪽 메뉴에서 **Access Tokens** 클릭
3. **New token** 버튼 클릭
4. Token name 입력 (예: "investment-planner")
5. Role: **Read** 선택 (Inference API 사용용)
6. **Generate a token** 클릭
7. 생성된 토큰을 복사 (hf_로 시작)

## 2. API 키 설정

### 2.1 .env 파일 수정
프로젝트 루트의 `.env` 파일을 열고 다음과 같이 설정:

```bash
# Hugging Face API (권장)
HUGGINGFACE_API_KEY=hf_your_actual_token_here

# DeepSeek Direct API (대안)
# DEEPSEEK_API_KEY=sk-your_api_key_here
```

### 2.2 패키지 설치 및 실행
```bash
# 의존성 설치
npm install

# 서버 실행
npm start
```

## 3. 사용되는 DeepSeek 모델들

### 3.1 주요 모델
- **deepseek-ai/deepseek-r1-distill-llama-70b**: 추론 전문 모델 (메인)
- **deepseek-ai/DeepSeek-V2-Chat**: 대화형 분석 모델
- **deepseek-ai/deepseek-coder-6.7b-instruct**: 코딩 및 구조화된 분석

### 3.2 대안 모델 (fallback)
- **ProsusAI/finbert**: 금융 특화 센티멘트 분석
- **mrm8488/distilroberta-finetuned-financial-news-sentiment-analysis**: 금융 뉴스 분석

## 4. AI 기능

### 4.1 시장 센티멘트 분석
- 현재 시장 상황을 positive/neutral/negative로 분류
- 신뢰도 점수 (0.0-1.0) 제공
- 구체적인 투자 조언 및 분석 근거

### 4.2 종목 추천
- 개별 종목에 대한 Buy/Hold/Sell 신호
- 0-100 점수 시스템
- 추천 이유 및 시장 상황 고려

### 4.3 자동 Fallback
- DeepSeek 모델 로딩 실패 시 자동으로 FinBERT 사용
- 안정적인 서비스 제공
- 모델 상태 실시간 모니터링

## 5. API 엔드포인트

### 5.1 상태 확인
```
GET http://localhost:3000/api/ai/status
```

### 5.2 시장 센티멘트
```
GET http://localhost:3000/api/ai/sentiment
```

### 5.3 AI 종목 추천
```
GET http://localhost:3000/api/ai/recommendations
```

### 5.4 월별 종합 추천
```
GET http://localhost:3000/api/recommendations/monthly
```

## 6. 모델 로딩 시간

### 6.1 첫 요청 시
- DeepSeek 모델: 10-30초 (초기 로딩)
- 이후 요청: 2-5초

### 6.2 최적화 팁
- 서버 시작 후 `/api/ai/status` 호출로 모델 준비
- 503 에러 시 자동 재시도 로직 포함
- Fallback 모델로 서비스 연속성 보장

## 7. 비용 및 제한

### 7.1 Hugging Face Inference API
- **무료 티어**: 월 10,000 요청
- **Pro 티어**: $9/월, 100,000 요청
- 이 프로그램: 하루 20-50회 호출 (월 1,000회 미만)

### 7.2 사용량 모니터링
- Hugging Face 대시보드에서 사용량 확인
- 제한 초과 시 자동으로 Mock 데이터 사용

## 8. 장애 대응

### 8.1 모델 로딩 실패
```
Model is loading, retrying in 10 seconds...
```
→ 자동 재시도, 최대 3회

### 8.2 API 키 오류
```
{
  "status": "not_configured",
  "message": "Hugging Face API key not configured"
}
```
→ .env 파일의 HUGGINGFACE_API_KEY 확인

### 8.3 모델 접근 불가
```
{
  "status": "partial",
  "message": "DeepSeek models unavailable, using FinBERT fallback"
}
```
→ FinBERT 모델로 자동 전환

## 9. 개발자 정보

### 9.1 모델 응답 예시
```json
{
  "sentiment": "positive",
  "confidence": 0.85,
  "recommendation": "기술주 중심의 포트폴리오 구성을 고려해보세요.",
  "reasoning": "DeepSeek AI 분석: 현재 AI 붐과 반도체 수요 증가로 긍정적",
  "model": "deepseek-reasoning",
  "timestamp": "2025-01-08T10:30:00.000Z"
}
```

### 9.2 에러 핸들링
- 네트워크 오류: 자동 재시도
- 모델 오류: Fallback 모델 사용
- 파싱 오류: Mock 데이터 제공

## 10. 문제 해결

### 10.1 토큰 권한 부족
→ Hugging Face에서 토큰 권한을 "Read" 이상으로 설정

### 10.2 모델 접근 제한
→ 일부 DeepSeek 모델은 승인 필요, 대안 모델 자동 사용

### 10.3 응답 속도 개선
→ 서버 시작 시 모델 사전 로딩, 캐싱 활용

---

**참고**: API 키는 절대 공개하지 마세요. Git 커밋 시 .env 파일이 제외되는지 확인하세요.
