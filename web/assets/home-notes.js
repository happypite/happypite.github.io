import {escapeHTML} from './markdown.js';

export function publishedHomeNotes(posts){
 return posts.filter(post=>post.status==='published'&&!post.deletedAt)
  .sort((a,b)=>(b.date||'').localeCompare(a.date||'')||String(a.id).localeCompare(String(b.id)));
}

export function homeNotesMarkup(posts,topics){
 if(!posts.length)return '<li class="home-notes-empty">아직 게시된 글이 없습니다.<br>아래에서 관심 있는 주제를 둘러보세요.</li>';
 return posts.slice(0,3).map(post=>{
  const category=topics.find(topic=>topic.id===post.category)?.name||'노트';
  const date=/^\d{4}-\d{2}-\d{2}$/.test(post.date||'')?post.date:'';
  return `<li><a class="home-note" href="/?note=${encodeURIComponent(post.id)}" data-home-note="${escapeHTML(post.id)}"><span class="home-note-copy"><span class="home-note-meta"><span>${escapeHTML(category)}</span>${date?`<time datetime="${date}">${date.replaceAll('-','.')}</time>`:''}</span><span class="home-note-title">${escapeHTML(post.title)}</span></span><span class="home-note-arrow" aria-hidden="true">↗</span></a></li>`;
 }).join('');
}
