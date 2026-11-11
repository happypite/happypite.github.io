import {AUTH_SERVER_URL} from './auth-config.js';
import {PostStore,NotesUI} from './notes.js';
import {topics} from './symbols.js';
import {ImageViewer} from './media.js';
import {mountOwnerLogin} from './owner-store.js';
import {articleURL,articleListURL} from './article-links.js';

const store=new PostStore(window.ARCHIVE_RECORDS||[]),host=document.querySelector('#detail');
const notes=new NotesUI(store,topics),id=new URL(location.href).searchParams.get('note');
new ImageViewer();mountOwnerLogin(store);
const $=selector=>document.querySelector(selector);
const adminEntry=document.createElement('a');adminEntry.className='site-admin-entry';adminEntry.href=AUTH_SERVER_URL?AUTH_SERVER_URL+'/auth/login':'/projects/?manage=1';adminEntry.setAttribute('aria-label','관리자 로그인');adminEntry.title='관리자 로그인';adminEntry.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="12" cy="8" r="3.5"/><path d="M5 21v-2a7 7 0 0 1 14 0v2"/></svg><span>관리자 로그인</span>';$('.site-header').append(adminEntry);
function syncAdminEntry(){const active=store.canManage;adminEntry.href=active?'/projects/?manage=1':AUTH_SERVER_URL?AUTH_SERVER_URL+'/auth/login':'/projects/?manage=1';adminEntry.setAttribute('aria-label',active?'글 관리':'관리자 로그인');adminEntry.title=active?'글 관리':'관리자 로그인';adminEntry.querySelector('span').textContent=active?'글 관리':'관리자 로그인';}
store.listeners.push(syncAdminEntry);syncAdminEntry();
const collectionBack=document.createElement('a');collectionBack.className='article-collection-back';collectionBack.href='/projects/?category=documentation';collectionBack.textContent='← 공부 기록';document.querySelector('.collection-main').prepend(collectionBack);

const listURL=()=>articleListURL(location.href);
// Navigation uses real documents and remains usable with browser Back/Forward.
host.addEventListener('click',event=>{
 const action=event.target.closest('[data-note-action]');
 if(!action)return;
 if(['back','tag','read'].includes(action.dataset.noteAction)){
  event.preventDefault();event.stopImmediatePropagation();
  if(action.dataset.noteAction==='read'){location.assign(articleURL(location.href,action.dataset.id));return;}
  const target=new URL(listURL(),location.origin);
  if(action.dataset.noteAction==='tag'){target.searchParams.set('q',action.dataset.tag);target.searchParams.set('category',notes.post?.category||'all');}
  location.assign(target.pathname+target.search);
 }
},true);
document.querySelector('#detail-close').addEventListener('click',()=>location.assign(listURL()));
host.querySelector('[data-browse-all]').addEventListener('click',()=>location.assign(listURL()));
notes.onListOpen=()=>{if(notes.docView!=='scraps')location.assign(listURL());};
notes.onPostOpen=()=>{
 document.title='happypite';
 const title=document.querySelector('#reader-note-title');
 if(title?.tagName==='H2'){const heading=document.createElement('h1');heading.id=title.id;heading.textContent=title.textContent;title.replaceWith(heading);}
 host.querySelectorAll('[data-note-action=back]').forEach(button=>button.textContent='← 공부 기록');
};
store.listeners.push(()=>{if(notes.mode==='reader')notes.renderReader('',true);});
await store.refresh();
if(id)await notes.openPost(id);else location.replace(listURL());
window.addEventListener('pagehide',()=>notes.reading.leave());
window.addEventListener('beforeunload',event=>{if(notes.mode==='editor'&&document.querySelector('#edit-body')?.value.trim()){event.preventDefault();event.returnValue='';}});
