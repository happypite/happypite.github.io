import {PostStore,NotesUI} from './notes.js';
import {topics} from './symbols.js';
import {ImageViewer} from './media.js';
import {mountOwnerLogin} from './owner-store.js';
import {articleURL,articleListURL} from './article-links.js';

const store=new PostStore(window.ARCHIVE_RECORDS||[]),host=document.querySelector('#detail');
const notes=new NotesUI(store,topics),id=new URL(location.href).searchParams.get('note');
new ImageViewer();mountOwnerLogin(store);
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
notes.onListOpen=()=>location.assign(listURL());
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
