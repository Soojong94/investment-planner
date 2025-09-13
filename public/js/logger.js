// Logger - 배포용 로그 관리
const Logger = {
  // 환경 설정 (배포 시 false로 변경)
  isProduction: window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1',
  
  log(...args) {
    if (!this.isProduction) {
      console.log(...args);
    }
  },
  
  warn(...args) {
    if (!this.isProduction) {
      console.warn(...args);
    }
  },
  
  error(...args) {
    // 에러는 항상 표시 (디버깅을 위해)
    console.error(...args);
  },
  
  info(...args) {
    if (!this.isProduction) {
      console.info(...args);
    }
  },
  
  debug(...args) {
    if (!this.isProduction) {
      console.debug(...args);
    }
  }
};

// 전역으로 사용할 수 있도록 등록
window.Logger = Logger;

// 배포 환경에서는 console 메서드를 무시하도록 설정
if (Logger.isProduction) {
  console.log = () => {};
  console.info = () => {};
  console.warn = () => {};
  console.debug = () => {};
  // console.error는 유지 (중요한 오류 디버깅용)
}
