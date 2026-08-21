# 🚀 Notion Live Finance Dashboard & Automated Sync Engine

Notion 3-DB (경제흐름, 투자방향, Telegram) 실시간 자동 수집 대시보드 및 Google Gemini Pro 타임스탬프 심층 리포트 자동 생성 시스템입니다.

## 📌 주요 기능
1. **유튜브 ➔ 노션 실시간 Instant RSS 감지 (60초 주기)**: `경제사냥꾼` 및 `자산제곱` 채널의 새로운 영상/쇼츠 업로드 즉시 1분 이내 감지 후 노션 DB 자동 생성.
2. **Gemini Pro 타임스탬프 리포트 직렬 작성**: 영상 제목 링크, 타임스탬프(`[00:18]`, `[01:26]`), 증권사 목표가 세부 평가 내역 조 단위 수치, 3단계 가이드라인 자동 생성.
3. **TradingView & 네이버 증권 실시간 주가 연동**: 삼성전자, SK하이닉스, 현대차, 두산에너빌리티, HD현대중공업, KB금융 실시간 주가 및 정밀 진입 매수가 가이드 제공.
4. **0.005초(5ms) 인메모리 캐싱**: 대시보드 접속 지연 없이 초고속 로딩.

## ⚙️ 실행 방법
```bash
# 패키지 설치
npm install

# 서버 구동
npm start
```

## 🔐 환경 변수 (.env)
```env
PORT=3000
NOTION_TOKEN=your_notion_token
ECONOMIC_DB_ID=your_economic_db_id
YOUTUBE_DB_ID=your_youtube_db_id
TELEGRAM_DB_ID=your_telegram_db_id
GEMINI_API_KEY=your_gemini_api_key
YOUTUBE_API_KEY=your_youtube_api_key
```
