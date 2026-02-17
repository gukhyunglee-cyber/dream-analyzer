# 꿈 분석기 (Dream Analyzer)

칼 융의 분석심리학을 기반으로 한 꿈 분석 및 심리 상태 추적 웹 애플리케이션

## 기능

- 🧠 **융 이론 기반 AI 분석**: 집단 무의식, 원형, 상징 해석
- 📝 **꿈 일지 관리**: 꿈 기록 및 관리
- 🔮 **심리 상태 추적**: 시간에 따른 꿈 패턴 분석
- 🤖 **다중 LLM 지원**: OpenAI GPT-4 (기본), 향후 Claude/Gemini 확장 가능

## 설치 및 실행

### 1. 의존성 설치
```bash
cd dream-analyzer
npm install
```

### 2. 환경 변수 설정
`.env.example` 파일을 `.env`로 복사하고 필요한 값을 입력하세요:

```bash
cp .env.example .env
```

`.env` 파일 편집:
```env
PORT=3000
JWT_SECRET=your-super-secret-jwt-key-change-this
AI_PROVIDER=openai
OPENAI_API_KEY=your-openai-api-key-here
OPENAI_MODEL=gpt-4
```

### 3. 서버 실행
```bash
npm start
```

서버가 http://localhost:3000 에서 실행됩니다.

### 4. 브라우저에서 접속
```
http://localhost:3000
```

## 프로젝트 구조

```
dream-analyzer/
├── database/
│   └── init.js              # SQLite 데이터베이스 초기화
├── middleware/
│   └── auth.js              # JWT 인증 미들웨어
├── routes/
│   ├── auth.js              # 인증 API 라우트
│   ├── dreams.js            # 꿈 CRUD API 라우트
│   └── analysis.js          # AI 분석 API 라우트
├── services/
│   └── aiService.js         # AI 서비스 (다중 LLM 지원)
├── public/
│   ├── styles/
│   │   └── main.css         # CSS 디자인 시스템
│   ├── js/
│   │   ├── app.js           # 유틸리티 함수
│   │   └── auth.js          # 인증 JavaScript
│   ├── index.html           # 랜딩 페이지
│   ├── auth.html            # 로그인/회원가입 페이지
│   ├── dashboard.html       # 대시보드
│   ├── dream-input.html     # 꿈 입력 폼
│   ├── analysis-result.html # 분석 결과 페이지
│   └── dream-journal.html   # 꿈 일지 페이지
├── server.js                # Express 서버
├── package.json
└── .env                     # 환경 변수 (생성 필요)
```

## API 엔드포인트

### 인증
- `POST /api/auth/register` - 회원가입
- `POST /api/auth/login` - 로그인
- `GET /api/auth/profile` - 프로필 조회 (인증 필요)

### 꿈 관리
- `POST /api/dreams` - 꿈 등록 (인증 필요)
- `GET /api/dreams` - 모든 꿈 조회 (인증 필요)
- `GET /api/dreams/:id` - 특정 꿈 조회 (인증 필요)
- `DELETE /api/dreams/:id` - 꿈 삭제 (인증 필요)

### AI 분석
- `POST /api/analysis/analyze` - 꿈 분석 요청 (인증 필요)
- `GET /api/analysis/:dreamId` - 분석 결과 조회 (인증 필요)

## 다중 LLM 지원

이 프로젝트는 확장 가능한 AI 서비스 아키텍처를 사용하여 여러 LLM 제공자를 지원합니다:

- ✅ **OpenAI GPT-4** (현재 구현됨)
- 🔜 **Claude** (향후 추가 예정)
- 🔜 **Google Gemini** (향후 추가 예정)

`.env` 파일에서 `AI_PROVIDER` 변수를 설정하여 사용할 LLM을 선택할 수 있습니다.

## 라이선스

MIT
