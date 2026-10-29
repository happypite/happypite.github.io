import test from 'node:test';
import assert from 'node:assert/strict';
import type { Post } from '../src/data/blog.ts';
// 테스트 전용 데이터이며 실제 블로그에는 게시되지 않습니다.
const posts: Post[] = [
  { id: 'dev-fixture', title: '개발 테스트', summary: '코드 설계', category: 'development', date: '2026-10-28', sections: [{ title: '설계', paragraphs: ['도구 만들기'] }] },
  { id: 'ctf-fixture', title: '인증 테스트', summary: '문제 풀이', category: 'ctf-wargame', date: '2026-10-27', sections: [{ title: '요청', paragraphs: ['HTTP 요청 검증'] }] },
  { id: 'research-fixture', title: '연구 테스트', summary: '자료 읽기', category: 'research', date: '2026-10-26', sections: [{ title: '질문', paragraphs: ['결과 정리'] }] },
];
import { readState, writeState, matchedPosts, scopedPosts } from '../src/lib/archive.ts';

test('전체 목록에서는 검색창의 쿼리를 적용하지 않는다', () => {
  const state = readState('?q=인증');
  assert.equal(state.query, '');
  assert.equal(matchedPosts(posts, state).length, 3);
});
test('선택한 카테고리의 본문에서만 검색한다', () => {
  const state = readState('?category=ctf-wargame&q=HTTP');
  assert.equal(matchedPosts(posts, state)[0]?.id, 'ctf-fixture');
  assert.equal(matchedPosts(posts, readState('?category=development&q=HTTP')).length, 0);
});
test('갈피에 포함된 여러 카테고리를 함께 탐색한다', () => {
  assert.deepEqual(scopedPosts(posts, readState('?group=solved')).map(p => p.category), ['ctf-wargame']);
  assert.deepEqual(scopedPosts(posts, readState('?group=learned')).map(p => p.category), ['research']);
});
test('잘못된 카테고리는 전체로 복원하고 검색 조건을 버린다', () => {
  assert.deepEqual(readState('?category=unknown&q=<script>'), { category: 'all', group: null, query: '' });
});
test('카테고리와 갈피가 동시에 주어지면 카테고리를 우선한다', () => {
  const state = readState('?category=development&group=solved');
  assert.equal(state.group, null);
  assert.equal(scopedPosts(posts, state)[0]?.id, 'dev-fixture');
});
test('한글과 특수문자를 포함한 검색 조건을 URL로 보존한다', () => {
  const state = { category: 'research' as const, group: null, query: '질문 & 결과' };
  assert.deepEqual(readState(writeState(state)), state);
});
test('본문에 있는 여러 단어와 영문 대소문자를 함께 검색한다', () => {
  assert.equal(matchedPosts(posts, readState('?category=ctf-wargame&q=http+검증')).length, 1);
  assert.equal(matchedPosts(posts, readState('?category=ctf-wargame&q=논문')).length, 0);
});
test('글이 없는 카테고리도 오류 없이 빈 결과를 반환한다', () => {
  assert.deepEqual(matchedPosts(posts, readState('?category=bug-bounty')), []);
});

test('전체 글 목록이 비어 있어도 모든 검색 범위가 정상 동작한다', () => {
  for (const search of ['', '?category=development', '?category=ctf-wargame&q=HTTP', '?group=learned&q=자료']) {
    assert.deepEqual(matchedPosts([], readState(search)), []);
  }
});
