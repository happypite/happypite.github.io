# 적용한 디자인과 수정 위치

에디토리얼 미리보기의 여백·색상·글 목록을 Astro 페이지로 적용했습니다.

## 실행

프로젝트 폴더에서 `npm.cmd run dev -- --background`로 서버를 시작합니다.
`npm.cmd run dev -- status`로 상태, `npm.cmd run dev -- logs`로 로그를 확인합니다.
`npm.cmd run build`는 배포용 파일을 `dist/`에 생성합니다.

## 파일 역할

- `src/data/blog.ts`: 블로그 이름, 6개 카테고리, 갈피, 예시 글 세 편과 본문.
- `src/layouts/BlogLayout.astro`: 공통 상단 메뉴, 제목, 오른쪽 갈피, 푸터.
- `src/pages/index.astro`: 목록과 카테고리별 검색.
- `src/pages/posts/[slug].astro`: 글마다 실제 주소를 생성하는 상세 페이지.
- `src/pages/about.astro`: 소개 페이지.
- `src/styles/blog.css`: 모든 페이지의 색상, 글자 크기, 여백과 모바일 배치.
- `src/lib/archive.ts`: 카테고리·갈피·검색 조건 처리.
- `src/scripts/archive.ts`: URL과 화면을 연결하고 뒤로 가기 상태를 복원.
- `src/scripts/theme.ts`: 시스템·라이트·다크 모드 전환과 설정 저장.
- `src/components/Icon.astro`: 외부 다운로드 없이 표시하는 아이콘.

## 색상 모드

상단 아이콘을 누르면 시스템 → 라이트 → 다크 순서로 바뀝니다.
아이콘에 마우스를 올리거나 접근성 이름을 확인하면 현재 모드와 다음 모드를 알 수 있습니다.
이전의 `happypite:theme` 저장값도 그대로 사용합니다.
브라우저 저장이 차단되어 있어도 현재 페이지의 테마 전환은 동작합니다.

## 검색 흐름

전체 기록에서는 검색창이 없습니다. 카테고리 또는 오른쪽 갈피를 선택하고 해당 범위에 글이 있을 때 검색창이 나타납니다. 글이 없는 범위에는 빈 목록 안내를 표시합니다.
제목·요약·본문을 검색하고, 여러 단어를 입력하면 모든 단어가 있는 글을 표시합니다.
검색 조건은 주소의 `category`, `group`, `q`에 저장됩니다. 새로고침과 뒤로 가기를 지원합니다.
카테고리를 바꾸면 기존 검색어는 지워집니다.

## 글 바꾸기

예시 글을 모두 제거해 현재 글 목록은 비어 있습니다. 소개 페이지는 이름(이성민)만 표시합니다.
`src/data/blog.ts`의 `posts` 배열에서 내용을 바꿀 수 있습니다.

```ts
{
  id: 'my-first-post', // 주소에 사용할 고유한 영문 ID
  title: '내 첫 기록',
  summary: '목록에 표시할 설명',
  category: 'development',
  date: '2026-10-28',
  sections: [
    { title: '문제와 목표', paragraphs: ['첫 번째 문단', '두 번째 문단'] }
  ]
}
```

`id`는 중복 없이 사용하세요. 글을 추가하면 카테고리와 갈피에 자동으로 나타납니다.
날짜는 `YYYY-MM-DD` 문자열로 작성합니다.
Markdown 글 관리와 검색 색인은 앞으로 콘텐츠가 늘어날 때 확장할 수 있습니다.

## 검증

`node --experimental-strip-types --test tests/archive.test.ts`로 검색 범위와 URL 처리 테스트를 실행합니다.
`npm.cmd run build`로 정적 페이지와 브라우저 스크립트 생성을 확인합니다.
이 작업은 로컬 프로젝트에 적용한 것이며 GitHub 업로드와 공개 배포는 별도입니다.

## 이전 파일

수정 전 파일은 `.blog-backups/` 아래에 보관합니다. 이전 소개 문구도 그 백업에서 확인할 수 있습니다.

검색 테스트 데이터는 실제 글과 분리되어 있습니다. 글 목록을 비워도 테스트가 동작합니다.
