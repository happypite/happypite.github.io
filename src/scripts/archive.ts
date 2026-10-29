import { posts } from '../data/blog';
import { emptyState, readState, writeState, scopedPosts, matchedPosts, scopeLabel } from '../lib/archive';
import type { ArchiveState } from '../lib/archive';

const archive = document.querySelector<HTMLElement>('#archive');
if (archive) {
  const base = archive.dataset.base || '/';
  let state = readState(location.search);
  const form = document.querySelector<HTMLFormElement>('#archive-search')!;
  const input = document.querySelector<HTMLInputElement>('#query')!;
  const categoryInput = document.querySelector<HTMLInputElement>('#scope-category')!;
  const groupInput = document.querySelector<HTMLInputElement>('#scope-group')!;
  const count = document.querySelector('#result-count')!;
  const empty = document.querySelector<HTMLElement>('#empty-state')!;
  const clear = document.querySelector<HTMLButtonElement>('#clear-query')!;
  const reset = document.querySelector<HTMLAnchorElement>('#reset-scope')!;

  function draw() {
    const scoped = state.category !== 'all' || state.group !== null;
    const label = scopeLabel(state);
    const inScope = scopedPosts(posts, state);
    const hasQuery = state.query.trim().length > 0;
    const found = matchedPosts(posts, state);
    const ids = new Set(found.map(post => post.id));
    // 글이 없는 범위에는 검색창을 표시하지 않습니다.
    form.hidden = !scoped || inScope.length === 0;
    input.placeholder = `${label} 안에서 검색`;
    if (input.value !== state.query) input.value = state.query;
    categoryInput.disabled = state.category === 'all';
    categoryInput.value = state.category;
    groupInput.disabled = state.group === null;
    groupInput.value = state.group || '';
    document.querySelector('#page-heading')!.textContent = scoped ? label : '기록';
    document.querySelector('#list-heading')!.textContent = hasQuery ? '검색 결과' : scoped ? `${label}의 기록` : '전체 기록';
    count.textContent = hasQuery && inScope.length > 0 ? `${found.length} / ${inScope.length}편` : `${found.length}편`;
    document.querySelectorAll<HTMLElement>('[data-post-id]').forEach(article => { article.hidden = !ids.has(article.dataset.postId!); });
    document.querySelectorAll<HTMLAnchorElement>('[data-category]').forEach(link => {
      if (!state.group && link.dataset.category === state.category) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
    document.querySelectorAll<HTMLAnchorElement>('[data-group]').forEach(link => {
      if (link.dataset.group === state.group) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
    empty.hidden = found.length > 0;
    document.querySelector('#empty-message')!.textContent = hasQuery && inScope.length > 0
      ? '검색어와 일치하는 글이 없습니다.'
      : scoped ? '아직 이곳에 작성된 글이 없습니다.' : '아직 작성된 글이 없습니다.';
    clear.hidden = !hasQuery;
    reset.hidden = hasQuery || !scoped;
  }

  function navigate(next: ArchiveState, mode: 'push' | 'replace' = 'push') {
    state = next;
    const destination = base + writeState(state);
    if (destination !== location.pathname + location.search) {
      if (mode === 'push') history.pushState(null, '', destination);
      else history.replaceState(null, '', destination);
    }
    draw();
  }

  function interceptLink(event: MouseEvent, link: HTMLAnchorElement) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    navigate(readState(new URL(link.href).search));
  }
  document.querySelectorAll<HTMLAnchorElement>('[data-category], [data-group], #reset-scope').forEach(link => {
    link.addEventListener('click', event => interceptLink(event, link));
  });
  // 입력 도중 공백을 지우면 두 단어 이상 입력할 수 없으므로 원문을 유지합니다.
  input.addEventListener('input', () => navigate({ ...state, query: input.value.slice(0, 300) }, 'replace'));
  form.addEventListener('submit', event => {
    event.preventDefault();
    navigate({ ...state, query: input.value.trim().slice(0, 300) }, 'replace');
  });
  clear.addEventListener('click', () => { navigate({ ...state, query: '' }, 'replace'); input.focus(); });
  window.addEventListener('popstate', () => { state = readState(location.search); draw(); });
  // 전체 선택을 포함해 URL로 돌아오면 동일한 검색 조건을 복원합니다.
  if (location.search && !writeState(state)) state = emptyState();
  draw();
}
