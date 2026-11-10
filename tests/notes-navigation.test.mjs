import test from 'node:test';
import assert from 'node:assert/strict';
import {NotesUI} from '../web/assets/notes.js';

const deferred=()=>{let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return {promise,resolve,reject};};
const view=store=>Object.assign(Object.create(NotesUI.prototype),{store,sequence:0,mode:'list',content:{className:'',innerHTML:''},query:'',status:'all',sort:'updated',tag:'',category:'all',listCategory:'all'});

test('refresh completion preserves a reader or editor opened while the feed was loading',async()=>{
 for(const mode of ['reader','editor','closed']){
  const feed=deferred(),notes=view({refresh:()=>feed.promise});let renders=0,notices=0;
  notes.renderList=async()=>{renders++;notes.mode='list';};notes.notify=()=>notices++;
  const pending=notes.refreshPublic();notes.mode=mode;notes.sequence++;notes.content.innerHTML='current '+mode;
  feed.resolve();await pending;
  assert.equal(notes.mode,mode);assert.equal(notes.content.innerHTML,'current '+mode);assert.equal(renders,0);assert.equal(notices,0);
 }
});

test('refresh updates the list when it remains open and does not duplicate a listener update',async()=>{
 const feed=deferred(),notes=view({refresh:()=>feed.promise});let renders=0,notices=0;
 notes.renderList=async()=>{renders++;notes.sequence++;};notes.notify=()=>notices++;
 const pending=notes.refreshPublic();feed.resolve();await pending;assert.equal(renders,1);assert.equal(notices,1);
 const updated=deferred();notes.store.refresh=()=>updated.promise;const next=notes.refreshPublic();notes.sequence++;updated.resolve();await next;
 assert.equal(renders,1);assert.equal(notices,2);
});

test('an older failed search cannot replace the current reader or a newer result',async()=>{
 for(const mode of ['reader','list']){
  const search=deferred(),notes=view({query:()=>search.promise});
  const pending=notes.renderList();notes.sequence++;notes.mode=mode;notes.content.innerHTML='new current view';
  search.reject(Error('old search failed'));await pending;
  assert.equal(notes.content.innerHTML,'new current view');assert.equal(notes.mode,mode);
 }
});

test('a current list failure still shows an escaped useful error',async()=>{
 const notes=view({query:async()=>{throw Error('<offline>');}});await notes.renderList();
 assert.match(notes.content.innerHTML,/role="alert"/);assert.match(notes.content.innerHTML,/&lt;offline&gt;/);
});

test('empty pinned notes describe author curation to guests and star controls to the owner',async t=>{
 const before=globalThis.document,nodes={'#note-sort':{},'#note-result-count':{}};
 globalThis.document={querySelector:selector=>nodes[selector]||null};
 t.after(()=>{if(before===undefined)delete globalThis.document;else globalThis.document=before;});
 for(const canManage of [false,true]){
  const notes=view({query:async()=>[],posts:[],online:true,canManage});notes.status='pinned';
  await notes.renderList();
  assert.match(notes.content.innerHTML,/아직 중요 표시된 노트가 없습니다\./);
  if(canManage)assert.match(notes.content.innerHTML,/별표를 누르면/);
  else{assert.match(notes.content.innerHTML,/작성자가 중요 표시한 노트가 여기에 모입니다\./);assert.doesNotMatch(notes.content.innerHTML,/별표를 누르면/);}
 }
});
