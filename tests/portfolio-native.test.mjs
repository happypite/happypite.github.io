import test from 'node:test';
import assert from 'node:assert/strict';
import {cleanPortfolioTag,portfolioPosts,portfolioTags,selectPortfolioPosts,portfolioMarkup,portfolioReadingSection} from '../web/assets/portfolio-native.js';

const topics=[{id:'development',name:'개발'},{id:'research',name:'논문/컨퍼런스'}];
const first={id:'first',status:'published',category:'development',date:'2026-11-10',title:'가나다',tags:[' #2026 ','2026','실습']};
const second={...first,id:'second',category:'research',date:'2026-11-11',title:'나다라',tags:['#2026','논문']};
test('native portfolio shows only real published records and collects arbitrary tags once',()=>{
 const rows=portfolioPosts([first,second,{...first,status:'draft'},{...first,deletedAt:'removed'},{...first,draft:true},{...first,category:'private'}],topics);
 assert.deepEqual(rows,[first,second]);
 assert.deepEqual(portfolioTags(rows),['2026','실습','논문']);
 assert.equal(cleanPortfolioTag(' ＃2027 '),'2027');
 assert.deepEqual(portfolioTags([{...first,tags:[]}]),[]);
 assert.deepEqual(portfolioTags([{...first,tags:['new tag']}]),['new tag']);
});
test('native tags, category and chronological order combine without changing source records',()=>{
 const rows=[first,second];
 assert.deepEqual(selectPortfolioPosts(rows,{tag:'2026',category:'research'}),[second]);
 assert.deepEqual(selectPortfolioPosts(rows,{tag:'2026',order:'newest'}),[second,first]);
 assert.deepEqual(selectPortfolioPosts(rows,{order:'oldest'}),[first,second]);
 assert.deepEqual(selectPortfolioPosts(rows,{order:'title'}),[first,second]);
 assert.deepEqual(selectPortfolioPosts(rows,{tag:'없는 태그'}),[]);
 assert.deepEqual(rows,[first,second]);
});
test('native profile and its separate reflection retain the required empty writing structure',()=>{
 const html=portfolioMarkup();
 assert.ok(html.includes('<h1>이성민</h1>'));
 assert.ok(html.includes('관심 분야 · 컨설팅'));
 assert.equal((html.match(/\[가치관 \/ 선택 기준\]/g)||[]).length,3);
 assert.equal((html.match(/class="pf-experience"/g)||[]).length,3);
 assert.ok(html.includes('7개월'));
 assert.ok(html.includes('지원하게 된 이유'));
 assert.ok(html.includes('해보고 싶은 경험 01'));
 assert.ok(html.includes('해보고 싶은 경험 02 · 선택'));
 assert.ok(html.includes('/about/?portfolio=reflection'));
 const reflection=portfolioMarkup(true);
 assert.ok(reflection.includes('부족한 점과 그 이유'));
 assert.ok(reflection.includes('근거가 된 활동과 상황'));
 assert.ok(reflection.includes('실행할 방법'));
 assert.ok(reflection.includes('시기 / 빈도'));
 assert.ok(reflection.includes('확인할 변화'));
 for(const word of ['미션','산출물','수행 과정'])assert.ok(!html.includes(word)&&!reflection.includes(word));
});
test('reading position follows section boundaries, upward scrolling, resized content and the end of a short last section',()=>{
 const sections=[{id:'values',top:80},{id:'experiences',top:400},{id:'archive',top:700},{id:'direction',top:1000}];
 assert.equal(portfolioReadingSection(sections,0),'values');
 assert.equal(portfolioReadingSection(sections,400),'experiences');
 assert.equal(portfolioReadingSection(sections,850),'archive');
 assert.equal(portfolioReadingSection(sections,450),'experiences');
 assert.equal(portfolioReadingSection(sections,850,true),'direction');
 const expanded=sections.map(section=>({...section,top:section.top+(section.id==='archive'||section.id==='direction'?500:0)}));
 assert.equal(portfolioReadingSection(expanded,850),'experiences');
 assert.equal(portfolioReadingSection([],100),null);
});
