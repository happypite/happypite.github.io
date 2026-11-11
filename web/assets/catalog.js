import {articleURL} from './article-links.js';
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
 return posts.map(post=>{
  const topic=topics.find(t=>t.id===post.category),modified=state.sort==='updated',date=String((modified?post.updatedAt:post.date)||post.date||'').slice(0,10),titleID='catalog-title-'+post.id;
  return '<a class="catalog-note" data-catalog-read="'+escapeHTML(post.id)+'" aria-labelledby="'+escapeHTML(titleID)+'" href="'+escapeHTML(articleURL(catalogURL(address,state),post.id))+'"><h2 id="'+escapeHTML(titleID)+'">'+escapeHTML(post.title)+'</h2><p>'+searchExcerpt(post,state.query,170)+'</p><div class="catalog-bottom"><div class="catalog-meta"><span>'+escapeHTML(topic?.name||'공부 기록')+'</span>'+(date?'<time datetime="'+escapeHTML(date)+'">'+(modified?'수정 ':'작성 ')+escapeHTML(date)+'</time>':'')+'<span class="catalog-tags">'+(post.tags||[]).slice(0,3).map(tag=>'<span>#'+escapeHTML(tag.replace(/^#+/,''))+'</span>').join('')+'</span></div><span class="catalog-read" aria-hidden="true">글 읽기 →</span></div></a>';
 }).join('');
}
export function catalogEmptyState(store,state){
 const available=catalogPosts(store.posts,{category:'all',query:'',sort:'updated'}).length;
 if(!available&&store.loading)return {kind:'loading',title:'글을 불러오고 있습니다.',detail:'잠시만 기다려 주세요.'};
 if(!available&&store.error)return {kind:'error',title:'글 목록을 불러오지 못했습니다.',detail:'연결 상태를 확인한 뒤 다시 시도해 주세요.'};
 if(state.query.trim())return {kind:'search',title:'검색 결과가 없습니다.',detail:'다른 검색어를 입력하거나 검색 조건을 초기화해 보세요.'};
 if(state.category!=='all')return {kind:'category',title:'아직 이 카테고리에 글이 없습니다.',detail:'전체 보기에서 다른 공부 기록을 찾아보세요.'};
 return {kind:'empty',title:'공부 기록을 준비하고 있습니다.',detail:'새로운 글이 게시되면 이곳에서 읽을 수 있습니다.'};
}
export class ReadingCatalog{
 constructor(store,topics,onOpen){
  this.store=store;this.topics=topics;this.onOpen=onOpen;this.state=catalogState(location.href);this.root=document.querySelector('#projects');this.search=document.querySelector('#catalog-search');this.sort=document.querySelector('#catalog-sort');this.results=document.querySelector('#records-grid');this.status=document.querySelector('#catalog-status');
  this.search.addEventListener('input',()=>{this.state.query=this.search.value;this.updateURL();this.renderResults();});
  this.sort.addEventListener('change',()=>{this.state.sort=this.sort.value;this.updateURL();this.renderResults();});
  this.store.statusListeners?.push(()=>this.renderResults());
  this.root.addEventListener('click',async e=>{
   const link=e.target.closest('[data-catalog-read]');
   if(link){if(e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;e.preventDefault();e.stopPropagation();this.onOpen(link.dataset.catalogRead,link);return;}
   if(e.target.closest('[data-catalog-clear]')){this.state.query='';this.state.category='all';this.updateURL();this.render();this.focusSearch();}
   if(e.target.closest('[data-catalog-retry]')){await this.store.refresh();const retry=this.root.querySelector('[data-catalog-retry]');if(retry)retry.focus({preventScroll:true});else this.search.focus({preventScroll:true});}
  });
 }
 address(){const url=new URL(location.href);if(this.store.config?.reviewDataset==='empty')url.searchParams.set('empty','1');return url.href;}
 updateURL(){if(document.body.dataset.page==='projects')history.replaceState(history.state,'',catalogURL(this.address(),this.state));}
 syncFromURL(){this.state=catalogState(location.href);this.render();}
 setCategory(category){this.state.category=categories.includes(category)?category:'all';this.updateURL();this.render();}
 restoreFocus(id){(this.results.querySelector('[data-catalog-read="'+CSS.escape(id)+'"]')||this.search).focus({preventScroll:true});}
 focusSearch(){this.search.focus();this.search.select();}
 renderFilters(){
  const filters=document.querySelector('#filters'),html=[{id:'all',name:'전체'},...this.topics].map(t=>'<button data-filter="'+t.id+'" aria-pressed="'+(this.state.category===t.id)+'">'+escapeHTML(t.name)+'</button>').join('');
  if(filters.innerHTML!==html)filters.innerHTML=html;
 }
 renderResults(){
  const posts=catalogPosts(this.store.posts,this.state),filtered=this.state.category!=='all'||this.state.query.trim(),empty=catalogEmptyState(this.store,this.state);
  this.root.classList.toggle('catalog-is-empty',posts.length===0);
  this.results.setAttribute('aria-busy',String(!posts.length&&empty.kind==='loading'));
  const category=this.topics.find(t=>t.id===this.state.category)?.name||'전체 기록';
  document.querySelector('#record-count').textContent=!posts.length&&['loading','error'].includes(empty.kind)?(empty.kind==='loading'?'글을 확인하고 있습니다.':'목록 연결 확인 필요'):category+' · '+posts.length+'편';
  const clear=this.root.querySelector('[data-catalog-clear]');clear.hidden=!filtered;clear.textContent=this.state.query.trim()?'조건 초기화':'전체 보기';
  const available=catalogPosts(this.store.posts,{category:'all',query:'',sort:'updated'}).length;
  this.status.hidden=!(available&&this.store.error);
  this.status.innerHTML=this.status.hidden?'':'<span>최신 목록을 확인하지 못해 저장된 글을 보여드립니다.</span><button data-catalog-retry'+(this.store.loading?' disabled':'')+'>'+(this.store.loading?'확인 중…':'다시 시도')+'</button>';
  const html=posts.length?catalogRows(posts,this.topics,this.state,this.address()):'<div class="catalog-empty" data-state="'+empty.kind+'"><h2>'+empty.title+'</h2><p>'+empty.detail+'</p>'+(empty.kind==='error'?'<button data-catalog-retry>다시 시도</button>':'')+'</div>';
  if(this.results.innerHTML!==html){const focused=document.activeElement?.closest?.('[data-catalog-read]')?.dataset.catalogRead;this.results.innerHTML=html;if(focused)this.results.querySelector('[data-catalog-read="'+CSS.escape(focused)+'"]')?.focus({preventScroll:true});}
 }
 render(){this.search.value=this.state.query;this.sort.value=this.state.sort;this.renderFilters();this.renderResults();}
}
