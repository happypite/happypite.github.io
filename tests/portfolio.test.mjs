import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {parsePost} from '../scripts/build-pages.mjs';

const source=fs.readFileSync(new URL('../web/portfolio/app.js',import.meta.url),'utf8').replace(/\nrender\(\);\s*$/,'');
const markdown='---\ntitle: "연도 태그 확인"\ncategory: development\ndate: 2026-11-10\ntags: ["#2026", "2026", "새 태그"]\nstatus: published\n---\n공개 본문';
function portfolio(posts=[]){
 const context=vm.createContext({URLSearchParams,location:{hash:'#/archive'},document:{querySelector:()=>({}),addEventListener(){}},window:{ARCHIVE_RECORDS:posts,addEventListener(){}},setTimeout,clearTimeout});
 vm.runInContext(source,context);
 return expression=>vm.runInContext(expression,context);
}
test('published Markdown supplies Timeline dates, article links and automatic custom tags',()=>{
 const post=parsePost(markdown,'content/posts/year.md'),run=portfolio([post]);
 assert.equal(run("availableArticleTags().filter(t=>t.id==='2026').length"),1);
 assert.equal(run("availableArticleTags().some(t=>t.id==='새 태그')"),true);
 assert.ok(run("browseFilters('archive')").includes('>#2026</a>'));
 run("location.hash='#/archive?tag=2026'");
 assert.equal(run('filteredArticles().length'),1);
 assert.equal(run('filteredArticles()[0].url'),'/projects/?note='+post.id);
 assert.equal(run('filteredArticles()[0].publishedAt'),'2026-11-10');
 assert.ok(run('timelineEntries(filteredArticles())').includes('2026'));
 assert.ok(run('timelineEntries(filteredArticles())').includes('11.10'));
 assert.ok(run("browseUrl('timeline')").includes('tag=2026'));
 assert.ok(!run('articleTagLinks(filteredArticles()[0])').includes('##2026'));
 assert.ok(run("browseFilters('archive')").includes('글 1개'));
 assert.ok(!run("browseFilters('archive')").includes('작성 틀'));
});
test('drafts, deleted notes and unknown categories never supply public portfolio content or tags',()=>{
 const post=parsePost(markdown,'content/posts/year.md');
 const run=portfolio([{...post,status:'draft'},{...post,deletedAt:'removed'},{...post,category:'private'},{...post,draft:true}]);
 assert.equal(run('articleRecords.filter(r=>!r.placeholder).length'),0);
 assert.equal(run("availableArticleTags().some(t=>t.id==='2026')"),false);
});
test('editing or removing the last tagged article updates the index without a separate tag registry',()=>{
 const run=portfolio([parsePost(markdown,'content/posts/year.md')]);
 run("articleRecords.find(r=>!r.placeholder).tags=['#2027','2027',' 개발 ']");
 assert.equal(run("availableArticleTags().some(t=>t.id==='2026')"),false);
 assert.equal(run("availableArticleTags().filter(t=>t.id==='2027').length"),1);
 run("location.hash='#/timeline?tag=2027'");
 assert.equal(run('filteredArticles().length'),1);
 run("articleRecords.splice(articleRecords.findIndex(r=>!r.placeholder),1)");
 assert.equal(run("availableArticleTags().some(t=>t.id==='2027')"),false);
});
test('direct navigation links to the portfolio while required empty sections remain available',()=>{
 const home=fs.readFileSync(new URL('../web/index.html',import.meta.url),'utf8');
 assert.ok(home.includes('href="/about/" data-route="about">포트폴리오'));
 assert.ok(!home.includes('id="menu-toggle"'));assert.ok(!home.includes('id="menu-panel"'));
 const html=fs.readFileSync(new URL('../web/portfolio/index.html',import.meta.url),'utf8');
 assert.ok(html.indexOf('/assets/records.js')<html.indexOf('src="app.js"'));
 const run=portfolio();
 assert.equal(run('articleTemplates.length'),11);
 assert.ok(run('about()').includes('나이츠프론티어 지원동기'));
 assert.ok(run('about()').includes('앞으로의 7개월'));
 assert.ok(run('reflection()').includes('부족한 점과 원인'));
 assert.ok(run('home()').includes('timeline-preview'));
});
