import test from 'node:test';import assert from 'node:assert/strict';
import {catalogState,catalogPosts,catalogRows,catalogURL} from '../web/assets/catalog.js';
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
