# Bridge Bot

BSC에서 Solana로 토큰을 브릿지하는 봇입니다.

## 🚀 설치 및 실행

### 1. 종속성 설치
```bash
npm install
```

### 2. 환경변수 설정
1. `env.example` 파일을 `.env`로 복사합니다:
```bash
copy env.example .env
```

2. `.env` 파일을 열어서 실제 값들을 입력합니다:
```
BSC_RPC_URL=https://bsc-dataseed1.binance.org/
PRIVATE_KEY=your_actual_private_key_here
```

### 3. 실행
```bash
# 일반 실행
npm start

# 개발 모드 (파일 변경시 자동 재시작)
npm run dev
```

## ⚠️ 주의사항
- **개인 키를 절대 공유하지 마세요**
- 테스트넷에서 먼저 테스트하는 것을 권장합니다
- 충분한 BNB 잔액이 있는지 확인하세요 (가스비 + 브릿지 수수료)

## 📋 요구사항
- Node.js 16.0.0 이상
- BSC 네트워크 접근
- 충분한 BNB 잔액이 있는 지갑 