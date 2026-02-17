# 🚀 Render 배포 가이드

꿈 분석기 웹사이트를 **Render(render.com)**를 통해 무료로 배포하는 방법입니다.

## 0단계: 배포 준비 완료 (이미 완료됨)
- 프로젝트 코드가 준비되었습니다.
- `package.json`에 Node 버전 설정 완료
- `.gitignore`에 민감한 파일 제외 설정 완료
- 로컬 Git 저장소 초기화 완료 (승인 시)

## 1단계: GitHub에 코드 업로드

1. **GitHub.com**에 접속하여 새 리포지토리(New Repository) 생성
   - Repository name: `dream-analyzer`
   - Public 또는 Private 선택
   - "Initialize this repository with..." 옵션은 **모두 체크 해제** (빈 저장소)

2. 생성된 리포지토리 주소 복사 (예: `https://github.com/username/dream-analyzer.git`)

3. 터미널(명령 프롬프트)에서 다음 명령어 실행:
   ```bash
   cd "c:\Users\82106\OneDrive\바탕 화면\python_workplace\dream-analyzer"
   git remote add origin https://github.com/gukhyunglee-cyber/dream-analyzer.git
   git branch -M main
   git push -u origin main
   ```

## 2단계: Render 가입 및 서비스 생성

1. **[render.com](https://render.com)** 접속 및 회원가입 (GitHub 계정으로 가입 추천)
2. 대시보드에서 **"New +"** 버튼 클릭 -> **"Web Service"** 선택
3. "Connect a repository" 목록에서 방금 올린 `dream-analyzer` 리포지토리 선택 (보이지 않으면 "Configure account" 클릭해서 권한 부여)

## 3단계: 배포 설정

다음 설정값들을 입력합니다:

| 항목 | 값 |
|------|----|
| **Name** | dream-analyzer (원하는 이름) |
| **Region** | Singapore (한국과 가까움) |
| **Branch** | main |
| **Root Directory** | (비워둠) |
| **Runtime** | Node |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Plan** | Free (무료) |

## 4단계: 환경 변수 설정 (중요!)

페이지 하단의 **"Advanced"** 또는 초기 설정 화면의 **"Environment Variables"** 섹션에서 다음 변수들을 추가합니다:

1. **Key**: `OPENAI_API_KEY`
   **Value**: (여러분의 SK-로 시작하는 API 키)

2. **Key**: `JWT_SECRET`
   **Value**: (임의의 긴 문자열, 예: `my-super-secret-key-1234`)

3. **Key**: `AI_PROVIDER`
   **Value**: `openai`

4. **Key**: `OPENAI_MODEL`
   **Value**: `gpt-3.5-turbo`

## 5단계: 배포 시작

- **"Create Web Service"** 클릭
- 배포가 시작되며 로그가 표시됩니다. 약 2-3분 소요됩니다.
- "Your service is live" 메시지가 뜨면 성공!
- 상단에 표시된 `https://dream-analyzer-xxxx.onrender.com` 주소로 접속하면 됩니다.

---

### ⚠️ 주의사항 (무료 플랜)
Render 무료 플랜은 15분 동안 접속이 없으면 서버가 **절전 모드(Sleep)**로 들어갑니다.
절전 모드에서 다시 깨어날 때 **첫 접속 시 약 30초~1분 정도 로딩**이 걸릴 수 있습니다. 이는 정상입니다.
