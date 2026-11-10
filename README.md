# happypite.github.io 배포와 글 관리

## 포트폴리오 (2026-11-10)

홈페이지 상단과 전체 메뉴의 **포트폴리오**에서 `/portfolio/`로 이동합니다. 짧은 소개, 선택 기준 3개, 대표 경험, 여섯 활동 분야, 나이츠프론티어 지원동기와 7개월 계획, 희망 경험 1–2개, 별도 회고의 작성 구조를 담았습니다. 개인 서술은 작성 전입니다.

Timeline과 글 모아보기는 기존 `content/posts/`의 공개 글을 함께 읽습니다. 실제 글은 원래의 읽기 화면으로 연결되며, 날짜가 없는 작성 틀은 별도로 표시합니다. 소개·활동·회고 틀에 작성일과 태그 항목이 있습니다.

글의 `tags`에 `"#2026"` 또는 `"2026"`을 추가하고 게시하면 배포 후 상단 태그 필터에 자동으로 나타납니다. 별도 태그 목록을 수정할 필요가 없습니다. 같은 태그는 한 번만 표시하고 마지막 글에서 제거하면 필터에서도 사라집니다. 태그·분야·글 유형 필터와 정렬 조건은 주소에 남으며 목록과 Timeline 사이에 유지됩니다.

포트폴리오의 화면·작성 틀: `web/portfolio/index.html`, `styles.css`, `app.js`. 기존 글 작성·수정과 로그인은 홈페이지의 글 관리 기능을 사용합니다.

화면·수면 효과·프로젝트 스크롤·두 단계 지구본·검색을 GitHub Pages에서 실행하도록 준비한 소스입니다. 글은 GitHub 저장소의 Markdown 파일로 관리합니다. Node 24 이상이며 별도 패키지 설치는 필요하지 않습니다.

이번 개선본은 SUIT 본문·JetBrains Mono 코드 폰트, 전체 글 바로가기, 개별 글 링크·복사, 글자 크기 기억, 일치 본문 미리보기, 목차·읽기 위치, 연관 글과 Markdown 표를 포함합니다. 기준1과 개선 검토는 함께 제공한 `BASELINES.md`, `USABILITY_REVIEW.md`에 기록했습니다.

## 현재 저장소에 적용

1. `happypite-github-source.zip`을 풀고 **압축 안의 내용**을 `happypite/happypite.github.io` 저장소의 최상위에 넣습니다. `web`, `content`, `scripts`, `tests`, `.github`, 설정 파일을 모두 포함합니다. 특히 숨김 폴더 `.github`도 넣어야 합니다.
2. 기존 `package.json`, `package-lock.json`, `.gitignore`, `.github/workflows/deploy.yml`은 제공 파일로 교체합니다. 기존 Astro의 `src`, `public`, `astro.config.mjs`는 새 배포에서 사용하지 않으므로 남아 있어도 됩니다. 생성물 `out`, `node_modules`, `.local`은 올리지 않습니다.
3. 저장소 **Settings → Pages → Build and deployment → Source**를 **GitHub Actions**로 선택합니다.
4. `main`에 커밋하면 **Actions → Deploy happypite GitHub Pages**가 검사·빌드 후 게시합니다. 성공 후 `https://happypite.github.io/`에서 확인합니다.

현재 GitHub 저장소는 읽기만 확인했습니다. 제공 파일을 GitHub에 올리거나 기존 공개 사이트를 교체하지 않았습니다. 기존 Sites 주소의 비공개 DB 글도 이 묶음에 자동으로 옮기지 않았습니다. 공개할 글만 아래 방식으로 추가하세요.

## 글 쓰기·수정·삭제

- 기본 화면은 방문자 읽기용입니다. 메뉴의 **글 관리**를 켜면 작성·수정·삭제 도구가 표시됩니다. 이 설정은 버튼 표시만 바꾸며 저장소 권한을 부여하지 않습니다.
- 사이트의 **GitHub 글쓰기**를 누르면 카테고리를 고르고, 제목·날짜·본문 틀이 채워진 GitHub 새 파일 화면을 열 수 있습니다.
- 읽기 화면의 **수정**은 해당 Markdown 파일의 GitHub 편집 화면을 엽니다. **삭제**는 GitHub의 파일 삭제 화면을 안내합니다. GitHub에서 변경 내용을 확인하고 커밋해야 실제 반영됩니다.
- 글 파일은 `content/posts/` 아래 `.md`로 저장합니다. 커밋 후 배포 작업이 성공하면 검색·카테고리·안쪽 지구본에 함께 반영됩니다.
- 검색은 제목·소개·본문·태그를 대상으로 브라우저에서 실행합니다. **중요 표시**는 사용하는 브라우저에 개인 설정으로 보관합니다.
- **링크 복사**로 현재 글을 공유하거나 즐겨찾기할 수 있습니다. 개별 글 링크는 입장 화면을 건너뛰고 바로 열립니다. 본문 크기 설정은 사용하는 브라우저에 기억합니다.
- **최근 본 글**은 이 브라우저에서 연 글 최대 20편을 최근 열람순으로 보여줍니다. 긴 글은 **이어서 읽기**로 돌아갈 수 있고 기록은 목록에서 지울 수 있습니다.
- GitHub 로그인과 해당 저장소 쓰기 권한이 있어야 글을 바꿀 수 있습니다. 방문자에게 편집 권한이 생기지는 않습니다.

```markdown
---
title: "인증과 세션 학습 정리"
category: bug-bounty
date: 2026-11-08
summary: "직접 확인한 동작과 주의할 점을 정리합니다."
tags: ["Web", "Authentication"]
status: published
---

## 학습 목표
오늘 확인할 내용을 적습니다.

## 핵심 개념
직접 이해한 내용을 정리합니다.

## 실습과 확인
코드, 결과, 참고 링크를 남깁니다.

## 정리
다시 볼 내용과 남은 질문을 적습니다.
```

| 화면 카테고리 | `category` 값 |
| --- | --- |
| 개발 | `development` |
| CTF/Wargame | `ctf-wargame` |
| Bug Bounty | `bug-bounty` |
| 블로그/기술문서 | `documentation` |
| 논문/컨퍼런스 | `research` |
| 공모전/자격증 | `activities` |

`status: draft` 또는 `draft: true`는 사이트 목록에서 제외됩니다. **공개 저장소 안의 파일 자체는 초안이어도 공개되므로 비공개 자료는 저장소에 넣지 마세요.** `status: published`인 글만 빌드에 포함합니다. 파일명을 바꾸면 글의 주소 식별자도 바뀝니다.

## 본문 이미지와 코드

공개할 이미지는 `content/media/`에 추가하고, 독립된 문단에 `![이미지 설명](/media/파일명.webp)`를 적습니다. 게시된 글이 참조한 PNG·JPEG·WebP·GIF·AVIF만 정적 결과물에 복사합니다(파일당 최대 10MB). 경로 이탈·누락 파일·SVG는 빌드에서 거부합니다. 비공개 이미지는 공개 저장소에 넣지 마세요. 사이트의 URL 삽입 기능은 자동 파일 업로드가 아닙니다.

이미지는 클릭해 크게 보고 Esc로 닫습니다. 코드 블록은 언어 이름을 쓰면 지원하는 언어의 기본 구문 색상과 줄 번호를 표시합니다. 코드를 복사할 때 줄 번호는 포함하지 않습니다. 지원 언어는 js/javascript·ts/typescript·json·py/python·sh/bash/shell·sql이며 다른 언어는 원문을 표시합니다.

## 로컬 확인

```sh
npm test
npm run build:pages
npm run dev
```

미리보기 기본 주소는 `http://127.0.0.1:4188/`입니다. 빌드 결과는 `out/pages/`에 생성됩니다. `/projects/`, `/world/`, `/about/` 직접 방문과 각 경로의 `index.html`도 지원합니다. 생성된 `out/pages/`는 수정하지 말고 원본 `web/`과 `content/posts/`를 수정하세요.

`happypite-github-source.zip`은 **자동 배포와 글 관리용 원본**입니다. `happypite-github-pages.zip`은 **완성된 정적 결과물**이며 별도 정적 호스팅에 쓸 수 있습니다. 이 결과물만 올리면 Markdown 자동 빌드용 소스가 포함되지 않습니다.

## 디자인과 확인 범위

Bug Bounty는 사용자가 제공한 회로형 벌레 이미지를 그대로 표시합니다. CTF/Wargame은 처음의 깃발로 복원하고, 개발은 입체 노트북과 떠 있는 코드 패널로 바꿨습니다. 개발 아이콘의 둥근 모서리와 입체 재질은 [Microsoft Fluent Emoji](https://github.com/microsoft/fluentui-emoji/tree/main/assets/Laptop/3D)를 참고했으며 해당 이미지 파일을 복사하지 않았습니다. 로컬 SUIT·JetBrains Mono·Pretendard·Three.js의 라이선스는 `web/assets/` 안에 포함됩니다.

자동 검사는 Markdown 입력, 공개 글만 내보내기, 로컬 파일 경로, 서버 없이 검색·읽기, GitHub 편집·삭제 링크, 직접 경로 진입을 확인합니다. 실제 GitHub Actions 배포 성공 여부는 저장소에 적용한 후 확인해야 합니다.

공식 안내: [GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages), [Actions로 Pages 배포](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages), [GitHub에서 파일 만들기](https://docs.github.com/en/repositories/working-with-files/managing-files/creating-new-files).


### 홈페이지 안에서 글 관리 (2026-11-09)
메뉴 → 관리자 연결에서 happypite 계정의 Fine-grained PAT를 연결합니다. 발급 시 이 저장소 하나만 선택하고 Contents: Read and write를 설정합니다. 키는 대화나 소스에 넣지 마세요. 현재 탭 메모리에서만 유지됩니다.
인증 후 메뉴의 새 노트 작성 또는 글 목록/본문의 작성·수정·삭제를 사용합니다. 임시 저장은 이 브라우저에만 남고 게시하기는 공개 저장소에 커밋합니다. 다른 방문자에게는 Pages 배포 완료 후 반영됩니다. 키 만료/권한 부족은 화면에 안내됩니다. 충돌 시 다시 연결해 최신 글을 연 후 보관된 초안을 비교하세요.
이 방식은 GitHub Pages만으로 동작하며 별도 로그인 서버가 필요하지 않습니다. GitHub 계정이나 인증 키를 다른 사람에게 공유하지 마세요.
