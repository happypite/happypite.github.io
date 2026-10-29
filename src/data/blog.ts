export const site = {
  name: 'happypite',
  author: '이성민',
  description: '이성민의 개발·보안 기록을 담는 개인 블로그.',
};

export const categories = [
  { id: 'development', label: '개발' },
  { id: 'ctf-wargame', label: 'CTF/Wargame' },
  { id: 'bug-bounty', label: 'Bug Bounty' },
  { id: 'documentation', label: '블로그/기술문서' },
  { id: 'research', label: '논문/컨퍼런스' },
  { id: 'activities', label: '공모전/자격증' },
] as const;

export type CategoryId = typeof categories[number]['id'];
export const groups = [
  { id: 'built', label: '만들어 본 것', categories: ['development'] },
  { id: 'solved', label: '풀어 본 문제', categories: ['ctf-wargame', 'bug-bounty'] },
  { id: 'learned', label: '읽고 배운 것', categories: ['documentation', 'research', 'activities'] },
] as const;
export type GroupId = typeof groups[number]['id'];

export type Post = {
  id: string;
  title: string;
  summary: string;
  category: CategoryId;
  date: string;
  sections: { title: string; paragraphs: string[] }[];
};

// 새 글은 이 배열에 추가합니다. 현재 공개된 글은 없습니다.
export const posts: Post[] = [];

export function categoryLabel(id: CategoryId) {
  return categories.find(c => c.id === id)!.label;
}
export function formatDate(date: string) { return date.replaceAll('-', '.'); }
export function searchableText(post: Post) {
  return [post.title, post.summary, categoryLabel(post.category), ...post.sections.flatMap(s => [s.title, ...s.paragraphs])].join(' ');
}
