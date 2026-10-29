# GitHub Pages 운영 안내

## 공개 주소

https://happypite.github.io/

## 앞으로 작업할 폴더

`C:\Users\dltjd\Documents\happypite.github.io`

이전의 `my-tech-blog` 폴더에서 수정한 내용은 자동으로 동기화되지 않습니다.

## 수정 후 게시하는 방법

```powershell
cd "C:\Users\dltjd\Documents\happypite.github.io"
npm.cmd test
npm.cmd run build
git status
git add src public astro.config.mjs
git commit -m "Update blog"
git push
```

패키지나 배포 설정도 변경했다면 해당 파일도 `git add`에 포함하세요.

## 글과 소개 수정 위치

- 글·이름·카테고리: `src/data/blog.ts`
- 소개 페이지 배치: `src/pages/about.astro`
- 색상·여백·글자 크기: `src/styles/blog.css`

## 자동 배포 흐름

`main`에 코드 업로드 → Astro 빌드 → 검색 테스트 → GitHub Pages 게시.
GitHub의 Actions 탭에서 `Deploy to GitHub Pages` 실행 결과를 확인할 수 있습니다.

## 업로드하지 않는 파일

`node_modules/`, `dist/`, `.astro/`, `.blog-backups/`, 환경 변수 파일은 업로드 대상에서 제외했습니다.
