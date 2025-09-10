@echo off
echo ==========================================
echo   투자 보조 프로그램 실행 스크립트
echo ==========================================
echo.

echo [1] 의존성 설치 중...
cd /d "%~dp0"
call npm install

echo.
echo [2] 서버 시작 중...
echo.
echo ✅ 서버가 시작되었습니다!
echo 📊 기존 프로그램: http://localhost:3000
echo 🚀 개선된 프로그램: http://localhost:3000/investment-program/
echo.
echo ⚠️ 서버를 중지하려면 Ctrl+C를 누르세요
echo.

call npm start

pause