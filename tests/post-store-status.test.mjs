import test from 'node:test';
import assert from 'node:assert/strict';
import {PostStore} from '../web/assets/notes.js';

const post={id:'one',category:'development',title:'공부 기록',body:'본문',tags:[],date:'2026-11-01',status:'published',contentVersion:'v1'};
const deferred=()=>{let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return {promise,resolve,reject};};
const response=posts=>({ok:true,json:async()=>({posts})});
function setup(t,fetch,config={mode:'github-pages'}){
 const beforeFetch=globalThis.fetch,beforeConfig=globalThis.ARCHIVE_CONFIG;
 globalThis.fetch=fetch;globalThis.ARCHIVE_CONFIG=config;
 t.after(()=>{globalThis.fetch=beforeFetch;if(beforeConfig===undefined)delete globalThis.ARCHIVE_CONFIG;else globalThis.ARCHIVE_CONFIG=beforeConfig;});
}

test('initial empty feed stays loading until it settles and simultaneous refreshes share one request',async t=>{
 const feed=deferred();let calls=0,contentUpdates=0;
 setup(t,()=>{calls++;return feed.promise;});
 const store=new PostStore(),states=[];store.statusListeners.push(state=>states.push(state));store.listeners.push(()=>contentUpdates++);
 assert.equal(store.loading,false);assert.equal(store.hasRefreshed,false);assert.equal(store.error,'');
 const first=store.refresh(),second=store.refresh();
 assert.equal(first,second);assert.equal(store.loading,true);assert.equal(store.hasRefreshed,false);assert.equal(contentUpdates,0);
 await Promise.resolve();assert.equal(calls,1);
 feed.resolve(response([]));assert.deepEqual(await first,[]);
 assert.equal(store.loading,false);assert.equal(store.hasRefreshed,true);assert.equal(contentUpdates,1);
 assert.deepEqual(states,[{loading:true,hasRefreshed:false,error:''},{loading:false,hasRefreshed:true,error:''}]);
});

test('unchanged cached posts survive failure and retry while only status listeners hear connectivity changes',async t=>{
 let offline=false;setup(t,async()=>{if(offline)throw Error('offline');return response([post]);});
 const store=new PostStore([post]),states=[];let contentUpdates=0;
 store.listeners.push(()=>contentUpdates++);store.statusListeners.push(state=>states.push(state));
 await store.refresh();assert.equal(contentUpdates,1);
 offline=true;await store.refresh();
 assert.equal(store.error,'offline');assert.deepEqual(store.posts,[post]);assert.equal(contentUpdates,1);
 offline=false;await store.refresh();
 assert.equal(store.error,'');assert.deepEqual(store.posts,[post]);assert.equal(contentUpdates,1);
 assert.deepEqual(states.slice(2),[
  {loading:true,hasRefreshed:true,error:''},{loading:false,hasRefreshed:true,error:'offline'},
  {loading:true,hasRefreshed:true,error:'offline'},{loading:false,hasRefreshed:true,error:''}
 ]);
});

test('invalid feed failure releases the request gate so a later successful retry can populate the list',async t=>{
 let valid=false;setup(t,async()=>valid?response([post]):{ok:true,json:async()=>({posts:null})});
 const store=new PostStore();await store.refresh();
 assert.match(store.error,/형식/);assert.equal(store.loading,false);assert.equal(store.hasRefreshed,true);assert.deepEqual(store.posts,[]);
 valid=true;await store.refresh();
 assert.equal(store.error,'');assert.equal(store.loading,false);assert.deepEqual(store.posts,[post]);
});

test('a guest refresh completing after owner login cannot overwrite the owner snapshot',async t=>{
 const feed=deferred();setup(t,()=>feed.promise);
 const store=new PostStore([post]);let authenticated=false;
 Object.defineProperty(store,'canManage',{get:()=>authenticated});
 const pending=store.refresh();await Promise.resolve();
 authenticated=true;const newer={...post,title:'저장된 최신 글',contentVersion:'v2'};store.posts=[newer];store.fallback=[newer];
 feed.resolve(response([post]));await pending;
 assert.deepEqual(store.posts,[newer]);assert.equal(store.canManage,true);assert.equal(store.loading,false);
});

test('local preview settles without network requests or write access',async t=>{
 setup(t,()=>{throw Error('preview must stay local');},{mode:'github-pages',localPreview:true});
 const store=new PostStore([post]);await store.refresh();
 assert.equal(store.loading,false);assert.equal(store.hasRefreshed,true);assert.equal(store.error,'');assert.equal(store.canManage,false);assert.deepEqual(store.posts,[post]);
});

test('server refresh clears a previous error on recovery without granting write permission',async t=>{
 let offline=true;setup(t,async()=>{if(offline)throw Error('offline');return {ok:true,json:async()=>({posts:[post],canWrite:false})};},{});
 const store=new PostStore();await store.refresh();assert.equal(store.error,'offline');assert.equal(store.online,false);
 offline=false;await store.refresh();
 assert.equal(store.error,'');assert.equal(store.online,true);assert.equal(store.canManage,false);assert.deepEqual(store.posts,[post]);
});

test('saving during a server refresh fetches a new snapshot after that earlier request completes',async t=>{
 const earlier=deferred(),updated={...post,title:'수정된 공부 기록',contentVersion:'v2'};let reads=0;
 setup(t,async(_url,options)=>{
  if(options.method==='PUT')return {ok:true,json:async()=>({post:updated})};
  reads++;
  return reads===1?earlier.promise:{ok:true,json:async()=>({posts:[updated],canWrite:true})};
 },{});
 const store=new PostStore([post]),refresh=store.refresh();await Promise.resolve();
 const save=store.save(updated);await new Promise(resolve=>setImmediate(resolve));
 assert.equal(reads,1);
 earlier.resolve({ok:true,json:async()=>({posts:[post],canWrite:true})});
 await refresh;assert.deepEqual(await save,updated);
 assert.equal(reads,2);assert.deepEqual(store.posts,[updated]);assert.equal(store.loading,false);
});
