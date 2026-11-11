import {escapeHTML} from './markdown.js';
import {searchExcerpt} from './reading.js';

const categories=['development','ctf-wargame','bug-bounty','documentation','research','activities'];
export function catalogState(address){
 const url=new URL(address,'https://happypite.github.io'),category=url.searchParams.get('category'),sort=url.searchParams.get('sort');
 return {category:categories.includes(category)?category:'all',query:(url.searchParams.get('q')||'').slice(0,200),sort:['newest','title'].includes(sort)?sort:'updated'};
}
export function catalogPosts(posts,state){
 const query=state.query.trim().toLocaleLowerCase();
 return posts.filter(p=>p.status==='published'&&!p.deletedAt&&!p.draft&&categories.includes(p.category)&&(state.category==='all'||p.category===state.category)&&(!query||[p.title,p.summary,p.body,...p.tags||[]].join(' ').toLocaleLowerCase().includes(query))).sort((a,b)=>state.sort==='title'?a.title.localeCompare(b.title,'ko'):String(state.sort==='newest'?b.date:b.updatedAt||b.date).localeCompare(String(state.sort==='newest'?a.date:a.updatedAt||a.date))||a.title.localeCompare(b.title,'ko'));
}
export function catalogURL(address,state,note){
 const url=new URL(address,'https://happypite.github.io');url.pathname='/projects/';url.hash='';url.searchParams.delete('note');
 for(const [key,value] of [['category',state.category==='all'?'':state.category],['q',state.query.trim()],['sort',state.sort==='updated'?'':state.sort]]){if(value)url.searchParams.set(key,value);else url.searchParams.delete(key);}
 if(note)url.searchParams.set('note',note);return url.pathname+url.search;
}
export function catalogRows(posts,topics,state,address){
 return posts.map(post=>{const topic=topics.find(t=>t.id===post.category),date=post.date||'';
  return '<a class="catalog-note" data-catalog-read="'+escapeHTML(post.id)+'" href="'+escapeHTML(catalogURL(address,state,post.id))+'"><div class="catalog-meta"><span>'+escapeHTML(topic?.name||'공부 기록')+'</span><time datetime="'+escapeHTML(date)+'">'+escapeHTML(date)+'</time></div><h2>'+escapeHTML(post.title)+'</h2><p>'+searchExcerpt(post,state.query,170)+'</p><div class="catalog-bottom"><span class="catalog-tags">'+(post.tags||[]).slice(0,3).map(tag=>'<span>#'+escapeHTML(tag.replace(/^#+/,''))+'</span>').join('')+'</span><span class="catalog-read">글 읽기 <span aria-hidden="true">→</span></span></div></a>';
 }).join('');
}
export class ReadingCatalog{
 constructor(store,topics,onOpen){this.store=store;this.topics=topics;this.onOpen=onOpen;this.state=catalogState(location.href);this.root=document.querySelector('#projects');this.search=document.querySelector('#catalog-search');this.sort=document.querySelector('#catalog-sort');this.results=document.querySelector('#records-grid');
  this.search.addEventListener('input',()=>{this.state.query=this.search.value;this.updateURL();this.renderResults();});
  this.sort.addEventListener('change',()=>{this.state.sort=this.sort.value;this.updateURL();this.renderResults();});
  this.root.addEventListener('click',e=>{const link=e.target.closest('[data-catalog-read]');if(link){if(e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;e.preventDefault();e.stopPropagation();this.onOpen(link.dataset.catalogRead,link);return;}if(e.target.closest('[data-catalog-clear]')){this.state.query='';this.state.category='all';this.updateURL();this.render();this.focusSearch();}});
 }
 address(){const url=new URL(location.href);if(this.store.config?.reviewDataset==='empty')url.searchParams.set('empty','1');return url.href;}
 updateURL(){if(document.body.dataset.page==='projects')history.replaceState(history.state,'',catalogURL(this.address(),this.state));}
 syncFromURL(){this.state=catalogState(location.href);this.render();}
 setCategory(category){this.state.category=categories.includes(category)?category:'all';this.updateURL();this.render();}
 focusSearch(){this.search.focus();this.search.select();}
 renderFilters(){document.querySelector('#filters').innerHTML=[{id:'all',name:'전체'},...this.topics].map(t=>'<button data-filter="'+t.id+'" aria-pressed="'+(this.state.category===t.id)+'">'+escapeHTML(t.name)+'</button>').join('');}
 renderResults(){const posts=catalogPosts(this.store.posts,this.state),filtered=this.state.category!=='all'||this.state.query.trim();this.root.classList.toggle('catalog-is-empty',posts.length===0);document.querySelector('#record-count').textContent=posts.length+'편';document.querySelector('[data-catalog-clear]').hidden=!filtered;this.results.innerHTML=posts.length?catalogRows(posts,this.topics,this.state,this.address()):'<div class="catalog-empty"><h2>'+(filtered?'조건에 맞는 글이 없습니다.':'공부 기록을 준비하고 있습니다.')+'</h2><p>'+(filtered?'검색어를 바꾸거나 전체 카테고리에서 찾아보세요.':'개념 정리와 실습 기록을 차근차근 모아두겠습니다.')+'</p></div>';}
 render(){this.search.value=this.state.query;this.sort.value=this.state.sort;this.renderFilters();this.renderResults();}
}
