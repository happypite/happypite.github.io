# Markdown 글 관리

`content/posts/`에 `.md` 파일을 추가합니다. 제목, 카테고리, 날짜와 본문을 입력하면 게시 후 검색·글 목록·탐색 공간에 표시됩니다. 현재 비공개 관리 사이트의 글은 자동으로 내보내지 않습니다.

```markdown
---
title: "학습 노트 제목"
category: development
date: 2026-11-08
summary: "배운 내용을 한두 문장으로 소개합니다."
tags: ["Security", "Study"]
status: published
---

## 핵심 개념

직접 공부한 내용을 작성합니다.

## 실습과 확인

실습 과정과 코드를 작성합니다.

## 정리

- 배운 점
- 다음에 확인할 내용
```

카테고리는 다음 중 하나입니다.

| 값 | 표시 이름 |
| --- | --- |
| development | 개발 |
| ctf-wargame | CTF/Wargame |
| bug-bounty | Bug Bounty |
| documentation | 블로그/기술문서 |
| research | 논문/컨퍼런스 |
| activities | 공모전/자격증 |

`status: draft` 또는 `draft: true`인 글은 사이트 출력에서 제외합니다. 공개 저장소의 원본 파일은 공개되므로 개인 정보나 비밀 자료를 넣지 않습니다.

수정은 해당 Markdown 파일 편집, 삭제는 파일 삭제 후 변경 내용 저장으로 관리합니다. 파일 이름을 바꾸면 별개의 글로 인식합니다. 사이트의 중요 노트 표시는 방문자 각 브라우저에 보관합니다.
