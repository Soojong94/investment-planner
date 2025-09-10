# 환경변수 설정 가이드

## DeepSeek API 키 설정

이 프로젝트는 AI 기반 종목 추천을 위해 DeepSeek API를 사용합니다.

### 1. DeepSeek API 키 받기
1. https://platform.deepseek.com/ 에서 회원가입/로그인
2. API Keys 메뉴로 이동
3. "Create new key" 클릭하여 API 키 생성
4. API 키를 복사하여 저장

### 2. 환경변수 설정하기

#### Windows (명령 프롬프트)
```cmd
set DEEPSEEK_API_KEY=sk-your_api_key_here
node server.js
```

#### Windows (PowerShell)
```powershell
$env:DEEPSEEK_API_KEY="sk-your_api_key_here"
node server.js
```

#### macOS/Linux
```bash
export DEEPSEEK_API_KEY="sk-your_api_key_here"
node server.js
```

#### .env 파일 사용 (권장)
프로젝트 루트에 `.env` 파일 생성:
```
DEEPSEEK_API_KEY=sk-your_api_key_here
```

그리고 package.json에 dotenv 패키지 추가:
```bash
npm install dotenv
```

server.js 상단에 추가:
```javascript
require('dotenv').config();
```

### 3. API 키 없이 사용하기
API 키가 설정되지 않은 경우, 시스템은 자동으로 Mock 데이터를 사용합니다.
- 기본 기능은 모두 동작합니다
- AI 추천은 샘플 데이터로 표시됩니다
- "Mock 데이터" 표시로 구분됩니다

### 4. API 상태 확인
브라우저에서 http://localhost:3000/api/ai/status 접속하여 API 연결 상태를 확인할 수 있습니다.

## DeepSeek API 특징
- **모델**: deepseek-chat (최신 추론 모델)
- **장점**: 금융 데이터 분석에 특화된 reasoning 능력
- **언어**: 한국어 자연스러운 분석 결과 제공
- **응답 형식**: JSON 구조화된 분석 결과

## 사용되는 분석 기능
- **시장 센티멘트 분석**: 현재 시장 상황을 positive/neutral/negative로 분류
- **종목 추천**: 개별 종목에 대한 Buy/Hold/Sell 신호 및 점수 제공
- **투자 전략**: 시장 상황에 맞는 구체적인 투자 조언

## 주의사항
- API 키는 절대 공개하지 마세요
- Git에 커밋하지 마세요 (.gitignore에 .env 추가)
- 과도한 사용 시 API 사용량 제한이 있을 수 있습니다
- 중국 기업이므로 민감한 개인정보 사용은 피해주세요

## API 비용
- DeepSeek은 상대적으로 저렴한 API 요금을 제공합니다
- 이 프로그램은 1일 수십 번 정도의 호출만 하므로 비용 부담이 적습니다

## 문제 해결
API 연결 문제 시:
1. API 키가 올바른지 확인
2. 네트워크 연결 상태 확인  
3. DeepSeek 서비스 상태 확인
4. Mock 모드로 기본 기능 테스트
