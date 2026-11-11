import test from 'node:test';import assert from 'node:assert/strict';
import {catalogState,catalogPosts,catalogRows,catalogURL,catalogEmptyState} from '../web/assets/catalog.js';
const state={category:'all',query:'',sort:'updated'};
const post={id:'one',category:'development',title:'보안 학습',summary:'인증과 세션',body:'검증 내용',tags:['Auth'],date:'2026-11-01',updatedAt:'2026-11-04',status:'published'};
test('catalog only exposes published posts and searches content and tags without changing source order',()=>{
 const newer={...post,id:'two',date:'2026-11-03',updatedAt:'2026-11-05'},posts=[post,newer,{...post,id:'draft',draft:true},{...post,id:'private',status:'draft'},{...post,id:'removed',deletedAt:'today'},{...post,id:'unknown',category:'private'}];
 assert.deepEqual(catalogPosts(posts,state).map(p=>p.id),['two','one']);assert.equal(posts[0],post);
 assert.deepEqual(catalogPosts(posts,{...state,query:'AUTH'}).map(p=>p.id),['two','one']);assert.equal(catalogPosts(posts,{...state,query:'검증'}).length,2);
 assert.equal(catalogPosts(posts,{...state,category:'research'}).length,0);
});
test('catalog links retain search and category when opening a note, including reserved characters',()=>{
 const s={category:'development',query:'인증 & <검증>',sort:'title'},href=catalogURL('https://happypite.github.io/projects/?sample=1',s,'note?&');
 assert.deepEqual(catalogState(href),s);const url=new URL(href,'https://happypite.github.io');assert.equal(url.searchParams.get('note'),'note?&');assert.equal(url.searchParams.get('sample'),'1');
 assert.deepEqual(catalogState('/projects/?category=private&sort=bad'),state);assert.equal(catalogState('/projects/?q='+'x'.repeat(300)).query.length,200);
});
test('catalog titles, tags and excerpts escape HTML while retaining useful body search matches',()=>{
 const p={...post,title:'<svg onload="bad()">',tags:['<img>'],body:'본문 <script> 검색',summary:''},html=catalogRows([p],[{id:'development',name:'개발'}],{...state,query:'검색'},'/projects/');
 assert.ok(!html.includes('<svg'));assert.ok(!html.includes('<script>'));assert.ok(!html.includes('<img>'));assert.ok(html.includes('&lt;svg'));assert.ok(html.includes('<mark>검색</mark>'));assert.ok(html.includes('글 읽기'));
});

test('loading and failed initial feeds are never presented as an empty category or an unsuccessful search',()=>{
 const filtered={...state,category:'research',query:'인증'};
 const loading=catalogEmptyState({posts:[],loading:true,error:'previous failure'},filtered);
 assert.equal(loading.kind,'loading');assert.match(loading.title,/불러오고/);
 const failed=catalogEmptyState({posts:[],loading:false,error:'offline'},filtered);
 assert.equal(failed.kind,'error');assert.match(failed.detail,/다시 시도/);
 assert.equal(catalogEmptyState({posts:[],loading:false,error:''},state).kind,'empty');
});

test('cached public records keep search and category empty states during a background refresh failure',()=>{
 const cached={posts:[post],loading:true,error:'offline'};
 assert.equal(catalogEmptyState(cached,{...state,category:'research'}).kind,'category');
 assert.equal(catalogEmptyState(cached,{...state,query:'없는 검색어'}).kind,'search');
 assert.equal(catalogEmptyState(cached,{...state,category:'research',query:'없는 검색어'}).kind,'search');
 assert.equal(catalogEmptyState(cached,{...state,category:'research',query:'   '}).kind,'category');
 assert.equal(catalogEmptyState({posts:[],loading:false,error:''},{...state,query:'   '}).kind,'empty');
});

test('private, removed and unsupported-category records cannot hide an initial public feed failure',()=>{
 const hidden=[{...post,id:'draft',status:'draft'},{...post,id:'flagged',draft:true},{...post,id:'removed',deletedAt:'today'},{...post,id:'unknown',category:'private'}];
 assert.equal(catalogEmptyState({posts:hidden,loading:false,error:'offline'},state).kind,'error');
 assert.equal(catalogEmptyState({posts:hidden,loading:true,error:''},state).kind,'loading');
 assert.equal(catalogEmptyState({posts:hidden,loading:false,error:''},state).kind,'empty');
});

test('visible row dates describe the active date ordering and omit an absent date',()=>{
 const timed={...post,updatedAt:'2026-11-04T19:30:00.000Z'},topics=[{id:'development',name:'개발'}];
 const modified=catalogRows([timed],topics,state,'/projects/');
 assert.match(modified,/<time datetime="2026-11-04">수정 2026-11-04<\/time>/);
 for(const sort of ['newest','title'])assert.match(catalogRows([timed],topics,{...state,sort},'/projects/'),/<time datetime="2026-11-01">작성 2026-11-01<\/time>/);
 const absent=catalogRows([{...post,date:'',updatedAt:''}],topics,state,'/projects/');
 assert.ok(!absent.includes('<time'));
});

test('row link naming and malicious IDs remain escaped while the deep link preserves the exact note ID',()=>{
 const id='one" onfocus="bad&<',p={...post,id,title:'제목 & <설명>'};
 const html=catalogRows([p],[{id:'development',name:'<개발>'}],state,'/projects/?manage=1');
 const titleID='catalog-title-one&quot; onfocus=&quot;bad&amp;&lt;';
 assert.ok(html.includes('aria-labelledby="'+titleID+'"'));
 assert.ok(html.includes('<h2 id="'+titleID+'">제목 &amp; &lt;설명&gt;</h2>'));
 assert.ok(!html.includes('onfocus="bad'));assert.ok(!html.includes('<개발>'));
 const href=catalogURL('/projects/?manage=1',state,id),url=new URL(href,'https://happypite.github.io');
 assert.equal(url.searchParams.get('note'),id);assert.equal(url.searchParams.get('manage'),'1');
});
