# 🚀 Render 배포 가이드 (최신 업데이트)

꿈 분석기 웹사이트를 **Render(render.com)**를 통해 무료로 배포하고, **PostgreSQL 데이터베이스**를 연결하여 데이터가 사라지지 않게 하는 방법입니다.

## 0단계: 배포 준비 완료 (이미 완료됨)
- 프로젝트 코드가 준비되었습니다.
- `database/db.js` 등 하이브리드 DB 지원 코드가 추가되었습니다.
- `package.json`에 `pg` 모듈이 추가되었습니다.

## 1단계: GitHub에 코드 업데이트 (필수)

1. 터미널(명령 프롬프트)에서 다음 명령어들을 순서대로 실행하여 변경사항을 GitHub에 올립니다:
   ```bash
   cd "c:\Users\82106\OneDrive\바탕 화면\python_workplace\dream-analyzer"
   git add .
   git commit -m "Add PostgreSQL support for Render"
   git push origin main
   ```

## 2단계: Render 호스팅 (Web Service) 설정

(이미 Web Service를 생성했다면 이 단계는 넘어가세요)

1. **[render.com](https://render.com)** 접속 및 로그인
2. **"New +"** -> **"Web Service"** -> `dream-analyzer` 리포지토리 선택
3. 설정값:
   - **Name**: dream-analyzer
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

## 3단계: PostgreSQL 데이터베이스 생성 (중요!)

기록이 사라지지 않게 하려면 데이터베이스 서버가 필요합니다.

1. Render 대시보드 우측 상단의 **"New +"** -> **"PostgreSQL"** 선택
2. 설정값 입력:
   - **Name**: dream-db (원하는 이름)
   - **Database**: dream_db
   - **User**: (자동 생성됨)
   - **Region**: Singapore (Web Service와 동일한 곳으로 설정)
   - **Plan**: Free
3. **"Create Database"** 클릭
4. 생성이 완료되면(Status: Available), **"Internal Database URL"** 값을 복사합니다. (예: `postgres://dream_db_user:password@hostname/dream_db`)

## 4단계: 환경 변수 설정 (가장 중요!)

Web Service가 데이터베이스와 AI를 사용할 수 있도록 연결해줍니다.

1. Render 대시보드에서 아까 만든 **Web Service (dream-analyzer)** 클릭
2. 왼쪽 메뉴의 **"Environment"** 클릭
3. **"Add Environment Variable"** 버튼을 눌러 다음 값들을 추가합니다:

| Key | Value (값) |
|-----|------------|
| `DATABASE_URL` | (위 3단계에서 복사한 **Internal Database URL**) |
| `OPENAI_API_KEY` | (사용자님의 OpenAI API 키: `sk-...`) |
| `AI_PROVIDER` | `openai` |
| `JWT_SECRET` | (임의의 비밀번호, 예: `my-secret-key-1234`) |
| `NODE_VERSION` | `18.17.0` (권장) |

4. **"Save Changes"** 클릭

## 5단계: 배포 확인

- 환경 변수를 저장하면 Render가 자동으로 다시 배포를 시작합니다.
- 배포가 완료(Live)되면 사이트에 접속해보세요.
- **회원가입을 새로 해야 합니다.** (데이터베이스가 새로 만들어졌기 때문입니다)
- 이제 서버가 재시작되어도 꿈 기록이 사라지지 않습니다! 🎉
