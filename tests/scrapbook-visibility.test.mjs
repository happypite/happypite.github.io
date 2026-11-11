import test from 'node:test';
import assert from 'node:assert/strict';
import {PostStore} from '../web/assets/notes.js';
import {catalogPosts} from '../web/assets/catalog.js';
import {portfolioPosts} from '../web/assets/portfolio-native.js';
import {relatedPosts} from '../web/assets/reading.js';
import {buildMonthPost} from '../web/assets/scrap-model.js';
import {ScrapbookUI} from '../web/assets/scrapbook.js';
const month={...buildMonthPost({month:'2026-11',days:[{date:'2026-11-11',entries:[]}]}),id:'month'};
const note={id:'note',category:'documentation',title:'기술 정리',summary:'노트 요약',body:'본문',status:'published',date:'2026-11-11',tags:['보안이슈']};
test('monthly containers stay out of general catalogs, portfolio, and related articles',()=>{
 const posts=[month,note],state={category:'all',query:'',sort:'updated'};
 assert.deepEqual(catalogPosts(posts,state),[note]);
 assert.deepEqual(catalogPosts(posts,{...state,category:'documentation'}),[note]);
 assert.deepEqual(catalogPosts(posts,{...state,query:'스크랩'}),[]);
 assert.deepEqual(portfolioPosts(posts,[{id:'documentation'}]),[note]);
 assert.deepEqual(relatedPosts(posts,{...note,id:'current'}),[note]);
 assert.equal(posts.length,2);
});
test('normal note searches omit months but direct links and the scrapbook still retrieve them',async()=>{
 const store=new PostStore([month,note]);store.online=false;store.staticMode=true;
 for(const category of ['all','documentation'])assert.deepEqual((await store.query(category)).map(p=>p.id),['note']);
 assert.deepEqual(await store.query('all','스크랩'),[]);
 assert.deepEqual((await store.query('all','','all','updated','보안이슈')).map(p=>p.id),['note']);
 assert.equal((await store.get('month')).scrapbook.month,'2026-11');
 const ui=Object.create(ScrapbookUI.prototype);ui.store=store;ui.month='2026-11';
 assert.equal(ui.posts.length,1);assert.equal(ui.post.id,'month');assert.equal(store.posts.length,2);
});
test('server-backed normal list responses also omit collection containers',async()=>{
 const store=new PostStore([]);store.online=true;store.staticMode=false;store.request=async()=>({posts:[month,note]});
 assert.deepEqual(await store.query('all'),[note]);
});
