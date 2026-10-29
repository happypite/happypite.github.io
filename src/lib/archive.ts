import { categories, groups, searchableText } from '../data/blog.ts';
import type { CategoryId, GroupId, Post } from '../data/blog.ts';

export type ArchiveState = { category: CategoryId | 'all'; group: GroupId | null; query: string };
export const emptyState = (): ArchiveState => ({ category: 'all', group: null, query: '' });

export function readState(search: string): ArchiveState {
  const params = new URLSearchParams(search);
  const category = categories.find(c => c.id === params.get('category'))?.id ?? 'all';
  const group = category === 'all' ? groups.find(g => g.id === params.get('group'))?.id ?? null : null;
  // 검색은 사용자가 선택한 카테고리 또는 갈피 안에서만 수행합니다.
  return { category, group, query: category !== 'all' || group ? (params.get('q') ?? '').trim().slice(0, 300) : '' };
}

export function writeState(state: ArchiveState): string {
  const params = new URLSearchParams();
  if (state.category !== 'all') params.set('category', state.category);
  else if (state.group) params.set('group', state.group);
  if ((state.category !== 'all' || state.group) && state.query.trim()) params.set('q', state.query.trim().slice(0, 300));
  return params.size ? '?' + params.toString() : '';
}

export function scopeLabel(state: ArchiveState): string {
  if (state.category !== 'all') return categories.find(c => c.id === state.category)!.label;
  return groups.find(g => g.id === state.group)?.label ?? '전체 기록';
}

export function scopedPosts(posts: Post[], state: ArchiveState): Post[] {
  const group = groups.find(g => g.id === state.group);
  return posts.filter(p => (state.category === 'all' || p.category === state.category) &&
    (!group || (group.categories as readonly string[]).includes(p.category)));
}

export function matchedPosts(posts: Post[], state: ArchiveState): Post[] {
  const words = state.query.normalize('NFKC').toLocaleLowerCase().split(/\s+/).filter(Boolean);
  return scopedPosts(posts, state).filter(p => {
    const text = searchableText(p).normalize('NFKC').toLocaleLowerCase();
    return words.every(word => text.includes(word));
  });
}
