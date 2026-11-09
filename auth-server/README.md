# GitHub 로그인 연결 준비본

현재 상태: 실제 배포 완료. 공개 사이트의 GitHub 로그인 연결, 관리자 글 목록과 작성·수정·삭제·중요 표시 권한, 새로고침 시 세션 복원, 로그아웃 후 세션 해제 및 비로그인 API 차단을 확인했다.

## 사용자 동작

1. 공개 블로그의 관리자 로그인에서 인증 서버로 이동한다.
2. GitHub로 로그인한다. 서버는 변경 가능한 이름이 아닌 고유 사용자 ID `205749646`을 확인한다.
3. 인증 서버의 관리자 화면에서 기존과 같은 글 작성/수정/삭제/중요 표시를 사용한다.
4. 관리 화면을 새로고침하면 서버 세션으로 복원된다. 세션은 최대 7일이며 GitHub 접근 토큰은 서버에서 갱신한다.
5. 로그아웃하면 DB의 해당 세션을 삭제한다. 공개 글과 공유 링크는 계속 `https://happypite.github.io`를 사용한다.

서로 다른 도메인 간 제3자 쿠키에 의존하지 않도록 관리자 화면은 인증 서버와 같은 주소에서 실행한다. 공개 블로그는 주소/게시 글을 유지한다.

## 배포에 필요한 계정 설정

- 사용자 소유 Cloudflare 계정의 Worker 한 개와 D1 데이터베이스 한 개
- 사용자 소유 비공개 GitHub App 한 개
- GitHub App: Contents read/write, Metadata read만 요청. 개인 계정에만 설치 가능하도록 설정하고 `happypite.github.io` 하나만 선택한다.
- GitHub App의 callback URL: 실제 배포 origin + `/auth/callback`
- GitHub App의 expiring user access token 기능을 켠다. 로그인을 시작할 때 offline_access와 PKCE S256을 요청한다.
- GitHub 앱 등록/설치가 새 저장소 접근을 부여하는 단계에서는 별도의 확인을 받는다.

`wrangler.jsonc`의 AUTH_ORIGIN과 database_id는 배포 시 실제 반환값으로 설정한다. 비밀값은 이 파일에 넣지 않는다.

## 서버 비밀 설정

Cloudflare의 Secret으로만 설정할 이름:

- `GITHUB_CLIENT_ID`: GitHub App의 Client ID. 앱 ID와 다르다.
- `GITHUB_CLIENT_SECRET`: GitHub App client secret
- `SESSION_KEY`: 암호학적 난수 32바이트 이상을 base64url로 인코딩한 키. 사이트 코드나 대화에 쓰지 않는다.

실행 코드는 Web API만 사용하며 별도 패키지가 필요 없다. `schema.sql`을 D1에 적용하고 `AUTH_DB` binding을 설정한다. 환경 설정이 없으면 변경 API는 닫힌 상태로 503을 반환한다.

## 접근 제한

- 브라우저에는 임의의 세션 ID만 `__Host-`/Secure/HttpOnly/SameSite=Lax 쿠키로 전달한다.
- GitHub access/refresh token과 OAuth verifier는 DB에서 AES-GCM으로 암호화한다. 행 ID를 additional authenticated data에 넣어 행 간 암호문 교환을 막는다.
- OAuth state는 쿠키와 비교하고 DB에서 일회성 소비한다. PKCE 및 저장소 ID 제한을 적용한다.
- 로그인/콜백/변경 API에 요청량 제한을 둔다. 세션 갱신은 잠금으로 중복 refresh를 피한다.
- 모든 쓰기마다 실제 GitHub 사용자 ID를 재확인한다. 서버의 GitHub API 통로는 main 브랜치의 content/posts/*.md 및 목록 읽기로 제한한다. 다른 저장소, 코드, 워크플로 및 임의 API 경로는 거절한다.
- API는 동일 origin의 JSON POST와 사용자 지정 헤더만 허용한다. CORS를 열지 않는다.
- 로그아웃은 서버 세션을 실제 삭제하며 예전 쿠키를 다시 보내도 로그인되지 않는다.
- 기존 키 로그인은 연결 검증 전까지 유지하며, 새 서버 주소를 활성화한 뒤에는 공개 화면에서 키 입력 대신 GitHub 로그인으로 이동한다.

## 검증 및 남은 단계

`node --test tests/auth-server.test.mjs`로 13개 인증 검사를 수행한다. 테스트는 메모리 SQLite와 모의 GitHub 응답을 사용하며 실제 계정/키를 쓰지 않는다.

Cloudflare Free 사용과 계정 로그인은 완료했다. 생성된 Worker 주소는 `https://happypite-admin.dltjdals500.workers.dev`이며 인증 Worker 코드가 배포되어 있다. `/health`의 configured=true와 실제 `/api/session`의 authenticated=true를 확인했고 새로고침 후에도 같은 세션을 유지했다.

완료: D1 `happypite-auth` (AUTH_DB) 생성·스키마 적용, GitHub App `happypite-blog-admin` (App ID 5678199, installation 180108103) 생성 및 블로그 저장소 하나에만 설치. 앱의 Contents read/write + Metadata read-only를 사용자 확인 후 적용했다. AUTH_ORIGIN/GITHUB_CLIENT_ID와 암호화된 GITHUB_CLIENT_SECRET/SESSION_KEY를 서버에 저장했다. 비밀값은 로컬 파일에 보관하지 않는다.

최종 확인 완료: 전체 검사 52개 및 빌드 통과, GitHub Pages 배포 성공. 실제 서버에서 비로그인 API 401과 관리자 페이지의 로그인 이동을 확인했다. 관리자 로그인 후 기존 글과 관리 버튼을 확인했고, 로그아웃 후 `/api/session`은 authenticated=false가 됐다. 실제 공개 글을 새로 게시하거나 수정·삭제하는 검증은 하지 않았으며 해당 동작은 모의 GitHub 기반 인증 검사로 검증했다.

2026-11-09 브라우저 연결이 복구되어 대시보드 작업을 재개했다. 결제 또는 유료 요금제 전환은 하지 않는다.

실제 배포 확인 전에는 GitHub OAuth 완료 또는 로그인 전환 완료라고 보고하지 않는다.

Cloudflare Workers는 redirect:error를 지원하지 않으므로 모든 외부 요청은 redirect:manual로 보내고 3xx 응답을 직접 차단한다. 인증 값을 다른 주소로 전달하지 않는다. 이 동작은 별도 회귀 검사로 검증한다.

관리자 정적 파일은 캐시를 우회하고 관리자 배포 식별자를 붙여 가져온다. 오래된 키 로그인 파일이 섞이지 않게 하며, 관리자 진입 시 소개 화면을 건너뛴다. 로그아웃 처리 중에는 버튼을 잠그고 처리 상태와 재시도 안내를 표시한다.
