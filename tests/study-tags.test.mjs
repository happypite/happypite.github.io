import test from 'node:test';import assert from 'node:assert/strict';
import {catalogPosts,catalogState,catalogURL,catalogTags,catalogRows} from '../web/assets/catalog.js';
import {articleListURL} from '../web/assets/article-links.js';
import {NativePortfolio} from '../web/assets/portfolio-native.js';
const one={id:'one',title:'첫 기록',category:'development',status:'published',date:'2026-11-12',body:'인증 실습',tags:[' #보안 ','＃보안','실습']};
const two={...one,id:'two',title:'두 번째',category:'research',tags:['논문','보안']};
test('study tags normalize and combine with category and text search without exposing hidden records',()=>{
 const posts=[one,two,{...one,id:'draft',status:'draft',tags:['비공개']},{...one,id:'month',series:'security-scrap',tags:['월별']},{...one,id:'removed',deletedAt:'today',tags:['삭제']}],state={category:'all',query:'',sort:'updated'};
 assert.deepEqual(catalogTags(posts,state),['논문','보안','실습']);
 assert.deepEqual(catalogTags(posts,{...state,category:'development'}),['보안','실습']);
 assert.deepEqual(catalogPosts(posts,{...state,tag:'보안',category:'research',query:'인증'}).map(p=>p.id),['two']);
 assert.deepEqual(catalogPosts(posts,{...state,tag:'없는 태그'}),[]);assert.equal(posts[0],one);
});
test('tag selection round trips Unicode and reserved characters through article return URLs',()=>{
 const state={category:'development',query:'인증',sort:'title',tag:'보안 & <태그>'};
 const list=catalogURL('/projects/?manage=1',state);assert.deepEqual(catalogState(list),state);
 const row=catalogRows([one],[{id:'development',name:'개발'}],state,list),href=row.match(/href="([^"]+)"/)[1].replaceAll('&amp;','&');
 assert.deepEqual(catalogState(articleListURL(href)),state);
 assert.equal(new URL(catalogURL(list,{...state,tag:''}),'https://example.com').searchParams.has('tag'),false);
});
test('portfolio article rows have no tag filter controls after moving tag browsing',()=>{
 const instance=Object.create(NativePortfolio.prototype);instance.topics=[{id:'development',name:'개발'}];const html=instance.rowMarkup(one);
 assert.ok(html.includes('첫 기록'));assert.ok(!html.includes('data-pf-tag'));assert.ok(!html.includes('pf-record-tags'));
});
