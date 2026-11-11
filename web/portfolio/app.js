'use strict';
// Empty portfolio structure: no personal claims or activity records are populated.
const categories=[
 {id:'development',name:'개발',focus:'설계 · 구현 · 개선',context:'프로젝트의 문제 정의와 구현 목적',process:'설계, 기술 선택, 구현과 개선 과정',evidence:'실행 화면 · 소스 코드 · 동작 확인',result:'완성한 기능과 개선된 부분'},
 {id:'ctf-wargame',name:'CTF/Wargame',focus:'분석 · 풀이 · 검증',context:'대회·플랫폼·문제와 풀이 환경',process:'관찰, 가설, 시도한 풀이와 검증',evidence:'문제 링크 · 풀이 문서 · 검증 결과',result:'해결 여부와 핵심 풀이 원리'},
 {id:'bug-bounty',name:'Bug Bounty',focus:'발견 · 검증 · 보고',context:'공개 가능한 분석 대상과 활동 범위',process:'취약점 분석, 검증 및 보고 과정',evidence:'공개 가능한 분석 자료 · 보고 상태',result:'확인된 영향과 보고 결과'},
 {id:'writing',name:'블로그/기술문서',focus:'이해 · 정리 · 공유',context:'다룰 주제, 독자와 작성 목적',process:'조사, 실습, 검증과 문서 구성',evidence:'발행 글 · 기술문서 · 참고 자료',result:'정리한 핵심 내용과 발행 결과'},
 {id:'research',name:'논문/컨퍼런스',focus:'핵심 정리 · 해석 · 적용',context:'논문·발표·행사와 관심을 가진 이유',process:'핵심 내용 분석, 해석과 남은 질문',evidence:'원문 · 발표 자료 · 리뷰 노트',result:'얻은 관점과 적용 가능성'},
 {id:'awards-certificates',name:'공모전/자격증',focus:'준비 · 참여 · 성취',context:'대회·자격증과 준비 배경',process:'준비 과정, 수행한 일과 어려움',evidence:'결과물 · 결과 안내 · 증빙 자료',result:'참여·취득·수상 등 확인된 결과'}
];
const main=document.querySelector('#main');
const sidebar=document.querySelector('#sidebar');
const esc=text=>String(text).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const arrow='<span aria-hidden="true">↗</span>';
const link=(url,text,cls='text-link')=>`<a class="${cls}" href="${url}">${text}${arrow}</a>`;
const badge=(text='작성 전')=>`<span class="badge">${text}</span>`;
const hint=(text)=>`<div class="empty-field"><span class="empty-rule" aria-hidden="true"></span><span class="sr-only">내용 작성 전</span><p class="writing-help">${text}</p></div>`;
const field=(name,prompt)=>{const value=({'이름 / 닉네임':'이성민','현재 관심 분야':'컨설팅'})[name];return `<div class="field-row"><dt>${name}</dt><dd>${value?esc(value):hint(prompt)}</dd></div>`;};
const section=(id,n,title,description,body)=>`<section class="section" id="${id}" aria-labelledby="${id}-title"><div class="section-heading"><span class="section-number">${n}</span><div><h2 id="${id}-title">${title}</h2>${description?`<p class="writing-help">${description}</p>`:''}</div></div>${body}</section>`;
const deep=(page,id)=>`#/${page}?section=${id}`;
const articleNav=items=>{const r=currentRoute();const page=r.page==='posts'?`posts/${r.id}`:r.page||'about';return `<nav class="article-nav" aria-label="이 글의 목차"><span>목차</span>${items.map(([id,name])=>`<a href="${deep(page,id)}" data-section="${id}">${name}</a>`).join('')}</nav>`;};
function currentRoute(){const [path,query='']=(location.hash.slice(1)||'/').split('?');const [page='',id='']=path.replace(/^\//,'').replace(/\/$/,'').split('/');const params=new URLSearchParams(query);return {page,id,params,section:params.get('section')};}
function pageHeader(title,description,crumb=[],download=''){
  const r=currentRoute();
  const descriptions={about:'가치관과 선택의 배경, 그리고 앞으로의 방향.',archive:'소개부터 활동과 회고까지, 태그와 분야로 살펴봅니다.',reflection:'경험에서 발견한 배움과 다음 방향.'};
  const name=title==='나에 대하여'?'소개':title;
  return `<header class="page-header"><nav class="breadcrumb" aria-label="현재 위치"><a href="#/">Portfolio</a>${crumb.map(([name,url])=>`<span>/</span>${url?`<a href="${url}">${name}</a>`:`<span aria-current="page">${name}</span>`}`).join('')}</nav><div class="page-title"><div><h1>${name}</h1><p>${descriptions[r.page]||description}</p></div>${download?`<button class="button author-tools" data-download="${download}">글 틀 내려받기 <span aria-hidden="true">↓</span></button>`:''}</div></header>`;
}
function sideNav(){
  const r=currentRoute();const family=r.page==='posts'?'archive':r.page==='direction'?'about':r.page;
  return [['','한눈에 보기'],['about','나에 대하여'],['timeline','Timeline'],['archive','글 모아보기'],['reflection','회고']].map(([id,name])=>`<a class="side-link ${family===id?'selected':''}" href="${id==='archive'||id==='timeline'?browseUrl(id):'#/'+id}" ${family===id?'aria-current="page"':''}>${name}</a>`).join('');
}


function outlineRow(n,title,description,url,items){return `<article class="outline-row"><span class="outline-no">${n}</span><div class="outline-main"><a href="${url}" class="outline-title">${title}${arrow}</a><p>${description}</p><div class="item-tags">${items.map(t=>`<span>${t}</span>`).join('')}</div></div><span class="outline-type">${n==='02'?'활동별 독립 글':'하나의 독립 글'}</span></article>`}
function home(){return `
<section class="journal-profile" aria-labelledby="profile-name"><span class="eyebrow">HAPPYPITE / PORTFOLIO</span><h1 id="profile-name">이성민</h1><p class="journal-role">관심 분야 · 컨설팅</p><p class="journal-intro">[어떤 문제에 관심이 있고, 무엇을 중요하게 생각하며,<br class="desktop-break"> 어떤 경험을 쌓아가고 있는지 소개하는 문장]</p><nav class="profile-links" aria-label="나를 알아가는 글">${link('#/about','나에 대하여')}${link('#/archive','활동 기록')}${link('#/reflection','회고')}</nav><dl class="profile-now"><div><dt>지금 탐구하는 것</dt><dd>[공부하거나 고민하고 있는 주제]</dd></div><div><dt>일을 대하는 방식</dt><dd>[문제를 바라보고 해결하는 나의 태도]</dd></div></dl></section>
<nav class="journal-index home-jump" aria-label="포트폴리오 빠른 탐색">${[['principles','선택 기준'],['selected-work','대표 경험'],['timeline-preview','Timeline'],['all-records','전체 기록'],['perspective','다음 방향']].map(([id,name],i)=>`<a href="${deep('',id)}" data-section="${id}"><span>0${i+1}</span>${name}</a>`).join('')}</nav>
<p class="writing-help guide-callout">모든 개인 내용은 작성 전입니다. 선택의 기준, 그 기준을 보여주는 경험, 앞으로의 방향을 실제 내용으로 연결합니다.</p>
<section class="journal-section portfolio-section" id="principles" aria-labelledby="principles-title"><header class="journal-section-head"><div><span class="section-kicker">01 / PERSPECTIVE</span><h2 id="principles-title">선택의 기준</h2></div>${link(deep('about','values'),'의미와 배경')}</header><div class="principle-notes">${[1,2,3].map(i=>`<article class="principle-note"><span class="note-number">0${i}</span><div><h3>[가치관 / 선택 기준]</h3><p>[이 기준이 나에게 갖는 의미]</p><p class="note-reason">[이 기준을 중요하게 여기는 이유와 연결되는 경험]</p></div><a href="${deep('about','value-'+i)}" aria-label="선택 기준 ${i} 자세히 보기">↗</a></article>`).join('')}</div></section>
<section class="journal-section portfolio-section" id="selected-work" aria-labelledby="selected-title"><header class="journal-section-head"><div><span class="section-kicker">02 / SELECTED EXPERIENCES</span><h2 id="selected-title">경험으로 보여주는 나</h2></div>${link('#/archive','모든 활동')}</header><div class="experience-listing">${[1,2,3].map(experienceEntry).join('')}</div></section>
${homeTimeline()}
<section class="journal-section portfolio-section" id="all-records" aria-labelledby="archive-title"><header class="journal-section-head"><div><span class="section-kicker">04 / ARCHIVE</span><h2 id="archive-title">분야별 기록</h2></div>${link('#/archive','전체 목록')}</header><nav class="category-directory" aria-label="활동 분야">${categories.map(c=>`<a href="#/archive/${c.id}"><strong>${c.name}</strong><span>${c.focus}</span><b aria-hidden="true">↗</b></a>`).join('')}</nav></section>
<section class="journal-section portfolio-section" id="perspective" aria-labelledby="perspective-title"><header class="journal-section-head"><div><span class="section-kicker">05 / NEXT CHAPTER</span><h2 id="perspective-title">다음으로 이어갈 것</h2></div></header><div class="next-editorial"><article class="future-note"><div class="note-heading"><span class="section-kicker">KNIGHTS FRONTIER</span><h3>나이츠프론티어에서의 7개월</h3></div><div class="future-links"><a href="${deep('about','motivation')}"><span>지원동기</span><strong>[나의 기준이 지원으로 이어진 이유]</strong>${arrow}</a><a href="${deep('about','direction')}"><span>이루고 싶은 것</span><strong>[7개월 뒤 갖추고 싶은 역량과 결과]</strong>${arrow}</a><a href="${deep('about','experiences')}"><span>해보고 싶은 경험</span><strong>[경험 01] <small>[경험 02 · 선택]</small></strong>${arrow}</a></div>${link(deep('about','motivation'),'지원동기와 계획 읽기')}</article><article class="growth-note"><div class="note-heading"><span class="section-kicker">REFLECTION</span><h3>경험을 다음 행동으로</h3></div><ol><li><h4>쌓인 경험과 배움</h4><p>[활동을 통해 달라진 생각과 방식]</p></li><li><h4>부족한 점과 그 이유</h4><p>[어떤 활동에서 무엇이 부족했는지]</p></li><li><h4>보완 방법과 다음 행동</h4><p>[어떻게 채우고, 언제 확인할지]</p></li></ol>${link('#/reflection','회고와 보완 계획 읽기')}</article></div></section>
<div class="page-bottom author-tools"><span>소개 · 활동별 독립 글 · 회고</span><button class="text-button" data-download="structure">전체 구성안 내려받기 ↓</button></div>`}

function about(){return `${pageHeader('나에 대하여','소개부터 가치관, 나이츠프론티어와 함께할 7개월까지 한 편의 글로 정리합니다.',[['나에 대하여']], 'about')}${articleMetadata('about')}${articleNav([['profile','소개'],['values','가치관'],['motivation','지원동기'],['direction','7개월 계획'],['experiences','해보고 싶은 경험']])}<article class="article">${section('profile','01','짧은 소개','나를 처음 보는 사람이 알아야 할 정보.',`<dl class="field-list">${field('이름 / 닉네임','이름 또는 닉네임')}${field('한 줄 소개','관심 분야와 방향을 담은 짧은 소개')}${field('현재 관심 분야','공부하거나 탐색하고 있는 분야')}${field('지금 탐구하는 것','요즘 붙잡고 있는 주제나 질문')}${field('일을 대하는 방식','문제를 바라보고 풀어가는 나만의 접근')}${field('지향하는 역할','앞으로 어떤 역할을 맡고 싶은지')}</dl>`)}${section('values','02','가치관과 선택 기준','삶과 진로에서 중요하게 생각하는 기준을 3개 이상 정리합니다.',`<div class="value-list">${[1,2,3].map(i=>`<section class="value-item" aria-labelledby="value-${i}"><div class="item-heading"><h3 id="value-${i}">선택 기준 ${String(i).padStart(2,'0')}</h3>${badge()}</div><dl class="field-list">${field('기준의 이름','중요하게 생각하는 가치 또는 선택 기준')}${field('나에게 갖는 의미','어떤 일이나 상황을 뜻하는지')}${field('중요하게 생각하는 이유','이 기준을 중요하게 여기는 이유')}${field('연결되는 경험','이 기준에 따라 선택하거나 행동했던 경험 · 선택 작성')}</dl></section>`).join('')}</div><p class="small-note">기준이 더 있다면 같은 형식의 항목을 이어서 추가합니다.</p>`)}${section('motivation','03','나이츠프론티어 지원동기','나의 기준이 이번 선택에 어떻게 이어졌는지 정리합니다.',`<dl class="field-list">${field('지원하게 된 계기','관심을 갖게 된 배경과 지원을 결정한 이유')}${field('가치관과의 연결','앞서 정리한 기준과 나이츠프론티어가 만나는 지점')}</dl>`)}${section('direction','04','앞으로의 7개월','기간이 끝났을 때 이루고 싶은 것을 구체적으로 정리합니다.',`<dl class="field-list">${field('이루고 싶은 것','갖추고 싶은 역량, 만들고 싶은 결과 또는 경험')}${field('나에게 중요한 이유','이 변화가 삶이나 진로에서 갖는 의미')}${field('확인할 수 있는 결과','이루었는지 확인할 수 있는 구체적인 상태')}</dl>`)}${section('experiences','05','해보고 싶은 경험','나의 가치관과 이루고 싶은 것에 연결되는 경험 1–2개.',`<div class="experience-list">${[1,2].map(i=>`<section class="experience-item" aria-labelledby="experience-${i}"><div class="item-heading"><h3 id="experience-${i}">경험 ${String(i).padStart(2,'0')}</h3>${badge(i===2?'추가 경험 · 선택':'작성 전')}</div><dl class="field-list">${field('구체적인 경험','무엇을, 어떤 방식으로 해보고 싶은지')}${field('선택한 이유','어떤 기준과 연결되며 왜 해보고 싶은지')}${field('시기와 방법','7개월 중 언제, 어떻게 진행할지')}${field('기대하는 배움과 결과','이 경험에서 배우고 남기고 싶은 것')}</dl></section>`).join('')}</div>`)}<div class="article-bottom"><span>다음으로, 기준이 드러나는 실제 활동을 정리합니다.</span>${link('#/archive','활동 기록')}</div></article>`}
function filters(selected){return `<nav class="filters" aria-label="카테고리 필터"><a href="#/archive" class="${selected?'':'active'}" ${selected?'':'aria-current="page"'}>전체</a>${categories.map(c=>`<a href="#/archive/${c.id}" class="${selected===c.id?'active':''}" ${selected===c.id?'aria-current="page"':''}>${c.name}</a>`).join('')}</nav>`}
function activitySummaryTable(list){return `<div class="table-container"><table class="record-table"><caption>분야별 활동 목록 · 내용 작성 전</caption><thead><tr><th scope="col">활동</th><th scope="col">분야</th><th scope="col">기간</th><th scope="col">나의 역할</th><th scope="col">주요 결과</th><th scope="col"><span class="sr-only">상세 글</span></th></tr></thead><tbody>${list.map(c=>`<tr><td><a class="record-title" href="#/posts/${c.id}">[활동 제목]</a><small>[핵심 내용을 담은 한 줄 요약]</small></td><td>${c.name}</td><td class="empty-text">[기간]</td><td class="empty-text">[역할]</td><td class="empty-text">[결과 요약]</td><td><a class="row-action" href="#/posts/${c.id}" aria-label="${c.name} 상세 보기">보기 ${arrow}</a></td></tr>`).join('')}</tbody></table></div>`}
function activityTable(list){return '<div class="article-index">'+list.map(archiveEntry).join('')+'</div>'+activitySummaryTable(list)}
function archive(id){const c=categories.find(c=>c.id===id);if(id&&!c)return notFound();return `${pageHeader(c?c.name:'활동 기록','',c?[['활동 기록','#/archive'],[c.name]]:[['활동 기록']])}${filters(c?.id)}<div class="list-toolbar"><div><strong>${c?c.name:'모든 활동'}</strong><span class="draft-tag">내용 작성 전</span></div><label class="view-control">보기<select id="view-mode" aria-label="활동 보기 방식"><option value="list">글 목록</option><option value="table">요약표</option></select></label></div><div class="writing-help guide-callout">현재 행은 각 분야의 빈 글 틀입니다. 실제 활동을 입력한 뒤에는 활동마다 독립된 글로 연결됩니다. 활동명·기간·기여·결과가 목록에서도 읽히도록 정리합니다.</div><div id="activity-view" class="activity-view ${viewMode==='list'?'list-view':''}">${activityTable(c?[c]:categories)}</div>${c?`<section class="category-guide writing-help"><h2>${c.name} 작성 안내</h2><dl class="field-list">${field('배경',c.context)}${field('과정',c.process)}${field('결과',c.result)}${field('근거 자료',c.evidence)}</dl></section>`:''}<aside class="archive-reflection"><div><span class="section-kicker">BEYOND THE RESULT</span><h2>활동을 돌아보며</h2><p>경험에서 발견한 부족함과 다음 행동.</p></div>${link('#/reflection','회고 읽기')}</aside>`}
function recordSections(c){return [
 ['background','배경과 목적',[["활동 개요",c.context],["시작한 이유","해결하려던 문제 또는 이 활동을 선택한 이유"],["나의 기준과 연결","어떤 가치관이나 관심이 이 선택으로 이어졌는지"]]],
 ['contribution','나의 역할과 기여',[["담당 역할","개인 또는 팀 활동에서 맡은 범위"],["직접 한 일","내가 수행한 작업과 판단 · 팀 전체 결과와 구분"]]],
 ['process','진행 과정과 판단',[["접근과 실행",c.process],["중요한 선택","가능한 대안과 비교해 무엇을 선택했고, 왜 그렇게 판단했는지"],["어려움과 해결","막힌 부분, 시도한 방법과 판단의 근거"]]],
 ['results','결과와 근거',[["확인된 결과",c.result],["결과를 보여주는 자료",c.evidence]]],
 ['learning','배운 점과 개선',[["배운 점","이전과 달라진 이해나 역량"],["아쉬운 점과 다음 단계","다시 한다면 바꿀 점과 후속 행동"]]]
 ];}
function post(id){const c=recordById(id);if(!c)return notFound();const sections=recordSections(c);const backUrl=c.selected?'#/':'#/archive/'+id;return `${pageHeader('[활동 제목]','[활동의 핵심, 나의 역할과 결과를 담은 한 문장]',[['활동 기록','#/archive'],[c.name,c.selected?'#/':'#/archive/'+c.id]], 'post-'+id)}${articleMetadata(id)}<div class="record-context"><span>${c.name}</span><span class="draft-tag">내용 작성 전</span><button class="text-button" data-copy>링크 복사 ↗</button></div><dl class="record-meta"><div><dt>기간</dt><dd>[시작 — 종료]</dd></div><div><dt>참여 형태</dt><dd>[개인 / 팀]</dd></div><div><dt>담당 역할</dt><dd>[역할]</dd></div><div><dt>기술 / 주제</dt><dd>[주요 키워드]</dd></div></dl>${caseSummary()}${competencyContext(c)}${articleNav(sections.map(s=>[s[0],s[1]]).concat([['references','관련 자료']]))}<article class="article">${sections.map(([key,title,fields],i)=>section(key,String(i+1).padStart(2,'0'),title,'',`<dl class="field-list">${fields.map(([name,prompt])=>field(name,prompt)).join('')}</dl>${key==='results'?'<div class="evidence-slot"><span class="evidence-icon" aria-hidden="true">▧</span><span>결과물 / 확인 자료</span><small>[이미지 · 도표 · 실행 화면과 설명]</small></div>':''}`)).join('')}${section('references','06','관련 자료','결과를 뒷받침하는 자료와 이 글에서 연결되는 내용을 함께 둡니다.',`<div class="table-container"><table class="reference-table"><thead><tr><th scope="col">종류</th><th scope="col">자료 / 링크</th><th scope="col">확인할 내용</th></tr></thead><tbody><tr><td>결과물</td><td class="empty-text">[자료명 · 링크]</td><td class="empty-text">[결과를 보여주는 근거]</td></tr><tr><td>과정 / 참고</td><td class="empty-text">[코드 · 문서 · 원문]</td><td class="empty-text">[본문과 연결되는 내용]</td></tr></tbody></table></div>`)}<aside class="related-box"><div><span class="section-kicker">RELATED REFLECTION</span><h2>이 경험에서 더 나아가기</h2><p>부족했던 점과 앞으로의 보완 계획.</p></div>${link(deep('reflection','gaps'),'회고 읽기')}</aside><div class="article-bottom">${link(backUrl,c.selected?'한눈에 보기':'분야별 목록으로')}${link('#/archive','모든 활동')}</div></article>`}
function reflection(){return `${pageHeader('회고와 보완 계획','지금까지의 활동을 근거로 부족한 점을 살펴보고, 다음 행동을 정리합니다.',[['회고와 보완 계획']], 'reflection')}${articleMetadata('reflection')}${articleNav([['review','활동 돌아보기'],['gaps','부족한 점과 원인'],['plan','보완 계획'],['next','다음 행동']])}<article class="article">${section('review','01','활동을 돌아보며','활동 전반을 돌아보는 별도의 글입니다.',`<dl class="field-list">${field('돌아볼 기간 / 범위','어느 시점까지의 어떤 활동을 돌아보는지')}${field('쌓은 경험','활동 전반에서 쌓은 경험과 변화')}${field('관련 활동','근거가 되는 활동 글의 제목과 링크')}</dl><div class="inline-links">${categories.map(c=>`<a href="#/archive/${c.id}">${c.name} ↗</a>`).join('')}</div>`)}${section('gaps','02','부족한 점과 원인','어떤 활동에서 발견한 부족함인지 함께 기록합니다.',`<div class="gap-list">${[1,2,3].map(i=>`<section class="gap-item" aria-labelledby="gap-${i}"><div class="item-heading"><h3 id="gap-${i}">보완할 부분 ${String(i).padStart(2,'0')}</h3>${badge(i>1?'필요에 따라 작성':'작성 전')}</div><dl class="field-list">${field('부족하다고 느낀 점','더 필요한 역량이나 경험')}${field('근거가 된 활동과 상황','활동명 / 글 링크와 부족함을 느낀 구체적인 장면')}${field('그 원인','왜 어려웠고 무엇이 부족했는지')}</dl></section>`).join('')}</div>`)}${section('plan','03','보완 계획','위에서 발견한 부족함과 실행 방법을 일대일로 연결합니다.',`<div class="table-container"><table class="plan-table"><thead><tr><th scope="col">보완할 부분</th><th scope="col">실행할 방법</th><th scope="col">시기 / 빈도</th><th scope="col">확인할 변화</th></tr></thead><tbody>${[1,2,3].map(i=>`<tr><th scope="row">보완할 부분 0${i}</th><td class="empty-text">[구체적인 학습·실습·참여 방법]</td><td class="empty-text">[언제 · 얼마나 자주]</td><td class="empty-text">[보완 여부를 판단할 결과]</td></tr>`).join('')}</tbody></table></div>`)}${section('next','04','다음으로 이어갈 행동','실행할 때 가장 먼저 확인할 내용.',`<dl class="field-list">${field('계속 유지할 점','활동을 통해 확인한 좋은 습관이나 방식')}${field('가장 먼저 시작할 일','보완 계획 중 첫 번째 행동')}${field('다시 돌아볼 시점','실행 결과를 점검할 때')}</dl>`)}<div class="article-bottom">${link('#/archive','활동 기록으로 돌아가기')}${link(deep('about','direction'),'앞으로의 7개월과 연결')}</div></article>`}
function notFound(){return `${pageHeader('페이지를 찾을 수 없습니다.','목록에서 확인할 항목을 다시 선택해 주세요.')}${link('#/','전체 구성으로')}`}


function featuredCard(i){return `<a class="featured-card" href="#/posts/selected-${i}" aria-label="대표 활동 ${i} 상세 보기"><div class="featured-label"><span>SELECTED 0${i}</span><span class="draft-tag">내용 작성 전</span></div><h3>[활동 제목]</h3><p class="featured-subtitle">[활동을 설명하는 한 문장]</p><dl class="featured-meta"><div><dt>나의 기여</dt><dd>[직접 맡고 해결한 일]</dd></div><div><dt>핵심 결과</dt><dd>[확인할 수 있는 결과]</dd></div></dl><div class="featured-footer"><span>[분류] <b>·</b> [기간]</span><span aria-hidden="true">↗</span></div></a>`}

function recordById(id){const match=categories.find(c=>c.id===id);if(match)return match;const selected=/^selected-([123])$/.exec(id);if(!selected)return null;return {id,name:`대표 활동 0${selected[1]}`,context:'어떤 활동이며 어떤 문제를 다뤘는지',process:'문제를 분석하고 실행·검증한 과정',evidence:'결과물 · 코드 · 문서 · 확인 자료',result:'실제로 확인한 결과와 변화',selected:true};}

function caseSummary(){return `<div class="case-summary" aria-label="활동 핵심 요약"><div><span>CONTEXT</span><h2>어떤 문제였나</h2><p>[다룬 문제와 목적]</p></div><div><span>CONTRIBUTION</span><h2>내가 한 일</h2><p>[직접 기여한 핵심 내용]</p></div><div><span>OUTCOME</span><h2>무엇이 달라졌나</h2><p>[확인된 결과와 변화]</p></div></div>`}


function proofRow(i){return `<div class="proof-row"><span class="proof-number">0${i}</span><div class="proof-name"><h3>[역량 / 강점]</h3><p>[이 역량을 발휘한 방식]</p></div><div class="proof-links"><a href="${deep('posts/selected-'+i,'contribution')}">대표 활동 0${i} <span aria-hidden="true">↗</span></a><a href="${deep('posts/selected-'+i,'results')}" class="proof-evidence" aria-label="역량 ${i}의 결과와 근거 보기">결과와 근거 <span aria-hidden="true">↗</span></a></div></div>`}

function leadCase(){return `<article class="lead-case"><div class="case-heading"><span class="section-kicker">SELECTED 01</span><span class="case-meta">[분야] <i>·</i> [기간] <i>·</i> [역할]</span></div><div class="lead-body"><div class="lead-story"><a class="lead-title" href="#/posts/selected-1"><h3>[나를 가장 잘 보여주는 활동]</h3>${arrow}</a><p class="lead-summary">[이 활동을 시작한 이유와 나에게 갖는 의미]</p><dl class="case-perspective"><div><dt>드러나는 기준</dt><dd>[이 선택에 연결된 가치관]</dd></div><div><dt>드러나는 역량</dt><dd>[직접 한 일로 보여주는 강점]</dd></div></dl></div><dl class="lead-outcomes"><div><dt>다룬 문제</dt><dd>[어떤 상황에서 무엇을 해결하려 했는지]</dd></div><div><dt>선택과 기여</dt><dd>[어떤 판단을 했고, 직접 무엇을 했는지]</dd></div><div><dt>결과와 배움</dt><dd>[확인된 변화와 이 경험에서 얻은 것]</dd></div></dl></div><div class="lead-footer"><span>하나의 경험을 깊이 들여다보기</span><div>${link(deep('posts/selected-1','results'),'결과와 근거')}${link('#/posts/selected-1','경험 읽기')}</div></div></article>`}


function supportCase(i){return `<article class="support-case"><div class="case-heading"><span class="section-kicker">SELECTED 0${i}</span><span class="case-meta">[분야 · 기간]</span></div><a class="support-title" href="#/posts/selected-${i}" aria-label="대표 경험 ${i} 상세 보기"><h3>[활동 제목]</h3>${arrow}</a><p>[이 경험을 선택한 이유와 나에게 남은 것]</p><div class="support-result"><span>나의 기여와 결과</span><strong>[직접 한 일과 확인된 변화]</strong></div><div class="support-bottom"><span>[드러나는 기준 / 역량]</span>${link('#/posts/selected-'+i,'경험 읽기')}</div></article>`}


function competencyContext(c){return `<aside class="competency-context" aria-label="이 경험과 나의 연결"><div><span>이 경험에 담긴 기준</span><strong>[나의 선택 기준과 연결되는 지점]</strong></div><div><span>이 경험에서 드러난 역량</span><strong>[나의 기여로 보여주는 강점]</strong></div>${link(deep('about','values'),'나의 기준 읽기')}</aside>`}

function experienceEntry(i){return `<article class="experience-entry ${i===1?'primary-entry':''}"><div class="entry-meta"><span>SELECTED 0${i}</span><span>[활동 기간]</span><span>[활동 분야]</span></div><div class="entry-content"><h3><a href="#/posts/selected-${i}">${i===1?'[나를 가장 잘 보여주는 활동]':'[활동 제목]'} ${arrow}</a></h3><p class="entry-description">[이 활동을 시작한 이유와 나에게 남은 경험을 소개하는 문장]</p><dl class="entry-outcome"><div><dt>나의 기여</dt><dd>[직접 맡은 일과 중요한 판단]</dd></div><div><dt>결과와 배움</dt><dd>[확인된 결과와 이 경험에서 얻은 것]</dd></div></dl><div class="entry-bottom"><span>[연결된 기준 / 드러나는 역량]</span>${link(deep('posts/selected-'+i,'results'),'결과와 근거')}</div></div></article>`}

function archiveEntry(c){return `<article class="archive-entry"><div class="entry-meta"><span>[활동 기간]</span><span>[담당 역할]</span></div><div class="entry-content"><span class="entry-category">${c.name}</span><h2><a href="#/posts/${c.id}" aria-label="${c.name} 상세 보기">[활동 제목] ${arrow}</a></h2><p class="entry-description">[활동의 배경, 나의 기여와 결과를 담은 한 줄 요약]</p><div class="entry-bottom"><span>[주요 기술 / 주제]</span>${link('#/posts/'+c.id,'글 읽기')}</div></div></article>`}

// Shared article metadata drives the index, Timeline and detail-page tags.
// Dates and personal narratives remain empty until supplied by the author.
// These aliases only keep existing category names readable; new tags need no registry entry.
const knownTagLabels=[
 {id:'intro',label:'소개'},{id:'values',label:'가치관'},{id:'plans',label:'계획'},
 {id:'selected',label:'대표경험'},{id:'reflection',label:'회고'},{id:'growth',label:'성장'},
 ...categories.map(c=>({id:c.id,label:c.name}))
];
const articleTemplates=[
 {id:'about',kind:'intro',categoryId:null,title:'나에 대하여',summary:'[나의 관심, 선택 기준과 앞으로의 방향을 담은 소개]',url:'#/about',publishedAt:null,tags:['intro','values','plans']},
 ...[1,2,3].map(i=>({id:'selected-'+i,kind:'activity',categoryId:null,title:`[대표 경험 ${String(i).padStart(2,'0')} 제목]`,summary:'[이 경험을 선택한 이유, 직접 한 일과 남은 배움]',url:'#/posts/selected-'+i,publishedAt:null,tags:['selected']})),
 ...categories.map(c=>({id:c.id,kind:'activity',categoryId:c.id,title:'[활동 제목]',summary:'[활동의 배경, 나의 기여와 결과를 담은 한 줄 요약]',url:'#/posts/'+c.id,publishedAt:null,tags:[c.id]})),
 {id:'reflection',kind:'reflection',categoryId:null,title:'회고와 보완 계획',summary:'[지금까지의 활동에서 발견한 부족함과 다음 행동]',url:'#/reflection',publishedAt:null,tags:['reflection','growth']}
];
function publishedPortfolioArticles(posts){
 const categoryMap={documentation:'writing',activities:'awards-certificates'};
 return (Array.isArray(posts)?posts:[]).filter(post=>post&&post.status==='published'&&!post.deletedAt&&!post.draft&&typeof post.id==='string'&&typeof post.title==='string'&&categories.some(c=>c.id===(categoryMap[post.category]||post.category))).map(post=>({id:post.id,kind:'activity',categoryId:categoryMap[post.category]||post.category,title:post.title,summary:typeof post.summary==='string'?post.summary:'',url:'/projects/?note='+encodeURIComponent(post.id),publishedAt:post.date,tags:Array.isArray(post.tags)?post.tags:[],placeholder:false}));
}
const articleRecords=[...articleTemplates.map(record=>({...record,placeholder:true})),...publishedPortfolioArticles(window.ARCHIVE_RECORDS)];
const kinds=[['','전체 글'],['intro','소개'],['activity','활동'],['reflection','회고']];
let browseScroll=null;
function normalizeTag(value){
 if(typeof value!=='string'&&typeof value!=='number')return '';
 const clean=String(value).normalize('NFC').trim().replace(/^[#＃]+\s*/u,'').trim();
 const known=knownTagLabels.find(t=>t.id.toLowerCase()===clean.toLowerCase()||t.label.toLowerCase()===clean.toLowerCase());
 return known?.id||clean;
}
function recordTags(record){
 const raw=Array.isArray(record.tags)?record.tags:typeof record.tags==='string'?record.tags.split(/[,，]/u):[];
 return [...new Set(raw.map(normalizeTag).filter(Boolean))];
}
function availableArticleTags(){
 const used=new Set(articleRecords.flatMap(recordTags));
 return [...used].map(id=>({id,label:tagLabel(id)}));
}
function browseState(){
 const r=currentRoute(),p=r.params;
 const category=r.page==='archive'&&r.id?r.id:p.get('category')||'';
 const tag=normalizeTag(p.get('tag'));
 return {tag:availableArticleTags().some(t=>t.id===tag)?tag:'',kind:kinds.some(([k])=>k===p.get('kind'))?p.get('kind'):'',category:categories.some(c=>c.id===category)?category:'',sort:['newest','oldest','title'].includes(p.get('sort'))?p.get('sort'):'newest',view:p.get('view')==='table'?'table':'list'};
}
function browseUrl(page='archive',patch={}){
 const r=currentRoute();const state={...(r.page==='archive'||r.page==='timeline'?browseState():{tag:'',kind:'',category:'',sort:'newest',view:'list'}),...patch};
 const p=new URLSearchParams();
 for(const key of ['kind','category','tag','sort','view'])if(state[key]&&state[key]!==({sort:'newest',view:'list'}[key]))p.set(key,state[key]);
 return '#/'+page+(p.size?'?'+p.toString():'');
}
function tagLabel(id){return knownTagLabels.find(t=>t.id===id)?.label||id}
function categoryLabel(record){return categories.find(c=>c.id===record.categoryId)?.name||({intro:'소개',activity:'대표 경험',reflection:'회고'}[record.kind])}
function validDate(record){const value=record.publishedAt;if(!/^\d{4}-\d{2}-\d{2}$/.test(value||'')||Number.isNaN(Date.parse(value)))return null;return new Date(value).toISOString().slice(0,10)===value?value:null}
function filteredArticles(){
 const s=browseState();
 return articleRecords.filter(r=>(!s.kind||r.kind===s.kind)&&(!s.category||r.categoryId===s.category)&&(!s.tag||recordTags(r).includes(s.tag))).sort((a,b)=>{
  if(s.sort==='title')return a.title.localeCompare(b.title,'ko');
  const ad=validDate(a),bd=validDate(b);
  if(!ad&&!bd)return 0;if(!ad)return 1;if(!bd)return -1;
  return s.sort==='oldest'?ad.localeCompare(bd):bd.localeCompare(ad);
 });
}
function articleTagLinks(record){return `<div class="article-tags" aria-label="글 태그">${recordTags(record).map(id=>`<a href="${browseUrl('archive',{tag:id,kind:'',category:''})}"><span aria-hidden="true">#</span>${esc(tagLabel(id))}</a>`).join('')}</div>`}
function articleMetadata(id){
 const record=articleRecords.find(r=>r.id===id);if(!record)return '';
 const tags=recordTags(record);
 return `<div class="article-taxonomy"><span class="article-date">${validDate(record)||'[작성일]'}</span>${articleTagLinks(record)}${tags.length?`<a class="taxonomy-browse" href="${browseUrl('archive',{tag:tags[0],kind:'',category:''})}">같은 태그의 글 ↗</a>`:''}</div>`;
}
function browseFilters(page){
 const s=browseState(),matching=filteredArticles();
 return `<div class="browse-controls" id="browse-controls"><div class="browse-topline"><nav class="kind-tabs" aria-label="글 유형">${kinds.map(([id,name])=>`<a data-browse href="${browseUrl(page,{kind:id,category:''})}" class="${s.kind===id?'active':''}" ${s.kind===id?'aria-current="true"':''}>${name}</a>`).join('')}</nav><div class="browse-views" aria-label="기록 탐색 방식"><a data-browse href="${browseUrl('archive')}" class="${page==='archive'?'active':''}" ${page==='archive'?'aria-current="page"':''}>목록</a><a data-browse href="${browseUrl('timeline')}" class="${page==='timeline'?'active':''}" ${page==='timeline'?'aria-current="page"':''}>Timeline</a></div></div>
 <div class="tag-filter"><div class="filter-label"><span>태그 필터</span>${s.tag?`<a data-browse href="${browseUrl(page,{tag:''})}" class="clear-tag">태그 해제 ×</a>`:''}</div><nav class="tag-cloud" aria-label="태그 필터">${availableArticleTags().map(tag=>`<a data-browse href="${browseUrl(page,{tag:s.tag===tag.id?'':tag.id})}" class="tag-chip ${s.tag===tag.id?'active':''}" ${s.tag===tag.id?'aria-current="true"':''}>#${esc(tag.label)}</a>`).join('')}</nav></div>
 <div class="browse-toolbar"><p id="browse-status" role="status">${s.tag?`<strong>#${esc(tagLabel(s.tag))}</strong> · `:''}<span>글 ${matching.filter(r=>!r.placeholder).length}개</span>${matching.some(r=>r.placeholder)?`<small>작성 틀 ${matching.filter(r=>r.placeholder).length}개 · 작성 전</small>`:''}</p><div class="browse-selects"><label>분야<select data-browse-select="category" aria-label="분야별 필터"><option value="">전체 분야</option>${categories.map(c=>`<option value="${c.id}" ${s.category===c.id?'selected':''}>${c.name}</option>`).join('')}</select></label><label>정렬<select data-browse-select="sort" aria-label="글 정렬"><option value="newest" ${s.sort==='newest'?'selected':''}>최신순</option><option value="oldest" ${s.sort==='oldest'?'selected':''}>오래된순</option><option value="title" ${s.sort==='title'?'selected':''}>제목순</option></select></label>${page==='archive'?`<label>보기<select data-browse-select="view" aria-label="활동 보기 방식"><option value="list" ${s.view==='list'?'selected':''}>글 목록</option><option value="table" ${s.view==='table'?'selected':''}>요약표</option></select></label>`:''}</div></div></div>`;
}
function articleIndexEntry(record){return `<article class="indexed-article"><div class="indexed-meta"><span>${validDate(record)||'[작성일]'}</span><span>${categoryLabel(record)}</span></div><div class="indexed-content"><h2><a href="${record.url}" aria-label="${record.kind==='activity'?categoryLabel(record)+' ':''}${esc(record.title)} 읽기">${esc(record.title)} ${arrow}</a></h2><p>${esc(record.summary)}</p>${articleTagLinks(record)}</div></article>`}
function articleSummaryTable(records){return `<div class="table-container article-summary"><table><caption>필터링한 글 목록 · 내용 작성 전</caption><thead><tr><th scope="col">글</th><th scope="col">분야 / 유형</th><th scope="col">작성일</th><th scope="col">태그</th></tr></thead><tbody>${records.map(r=>`<tr><td><a href="${r.url}">${esc(r.title)} ↗</a></td><td>${categoryLabel(r)}</td><td>${validDate(r)||'[작성일]'}</td><td>${articleTagLinks(r)}</td></tr>`).join('')}</tbody></table></div>`}
function noArticles(page){return `<div class="no-articles"><h2>조건에 맞는 글이 없습니다.</h2><p>태그나 분야를 바꿔 다른 기록을 살펴보세요.</p><a data-browse class="text-link" href="${browseUrl(page,{kind:'',category:'',tag:''})}">모든 필터 해제 ↗</a></div>`}
function timelineEntries(records,compact=false){
 const groups=new Map();for(const record of records){const year=validDate(record)?.slice(0,4)||'[연도]';if(!groups.has(year))groups.set(year,[]);groups.get(year).push(record)}
 return `<div class="timeline-groups ${compact?'compact-timeline':''}">${[...groups].map(([year,list])=>`<section class="timeline-year" aria-label="${year==='[연도]'?'연도 작성 전':year+'년'}"><h2 class="timeline-year-label">${year}</h2><ol class="timeline-track">${list.map(r=>`<li class="timeline-item"><div class="timeline-meta"><span>${validDate(r)?.slice(5).replace('-','.')||'[월.일]'}</span><span>${categoryLabel(r)}</span></div><h${compact?'3':'2'}><a href="${r.url}">${esc(r.title)} ${arrow}</a></h${compact?'3':'2'}><p>${esc(r.summary)}</p>${articleTagLinks(r)}</li>`).join('')}</ol></section>`).join('')}</div>`;
}
function timeline(){return `${pageHeader('Timeline','시간을 따라 이어지는 소개, 경험과 회고.',[['Timeline']])}${browseFilters('timeline')}<p class="writing-help guide-callout">작성일을 입력하면 연도별로 자동 정리됩니다. 날짜가 없는 글은 작성 전 그룹에 모입니다.</p>${filteredArticles().length?timelineEntries(filteredArticles()):noArticles('timeline')}`}
function homeTimeline(){const published=articleRecords.filter(r=>!r.placeholder).sort((a,b)=>(validDate(b)||'').localeCompare(validDate(a)||''));const preview=published.length?published.slice(0,3):[articleRecords[1],articleRecords[4],articleRecords.find(r=>r.id==='reflection')];return `<section class="journal-section portfolio-section" id="timeline-preview" aria-labelledby="timeline-preview-title"><header class="journal-section-head"><div><span class="section-kicker">03 / TIMELINE</span><h2 id="timeline-preview-title">시간을 따라 쌓은 기록</h2></div>${link('#/timeline','전체 Timeline')}</header>${timelineEntries(preview,true)}</section>`}
function unifiedArchive(id){
 const category=categories.find(c=>c.id===id);if(id&&!category)return notFound();const list=filteredArticles(),s=browseState();
 return `${pageHeader(category?category.name:'글 모아보기','소개부터 활동과 회고까지, 태그와 분야로 살펴봅니다.',category?[['글 모아보기','#/archive'],[category.name]]:[['글 모아보기']])}${browseFilters('archive')}<p class="writing-help guide-callout">홈페이지에 게시한 글과 포트폴리오 작성 틀을 함께 보여줍니다. 작성일이 비어 있는 항목은 개인 내용을 채우기 전의 틀이며, 공개 글은 기존 본문으로 연결됩니다.</p><div id="article-results">${list.length?(s.view==='table'?articleSummaryTable(list):`<div class="unified-article-index">${list.map(articleIndexEntry).join('')}</div>`):noArticles('archive')}</div>`;
}
document.addEventListener('click',event=>{const anchor=event.target.closest('a[data-browse]');if(anchor&&anchor.hash!==location.hash)browseScroll=window.scrollY});
document.addEventListener('change',event=>{const key=event.target.dataset.browseSelect;if(!key)return;const r=currentRoute(),patch={[key]:event.target.value};if(key==='category'&&event.target.value)patch.kind='activity';browseScroll=window.scrollY;location.hash=browseUrl(r.page,patch).slice(1)});


// Portable text templates mirror the screen hierarchy and remain empty.
const aboutTemplate=`# 나에 대하여\n\n- 작성일 (YYYY-MM-DD):\n- 태그 (쉼표로 구분): 소개, 가치관, 계획\n\n## 짧은 소개\n- 이름 / 닉네임: 이성민\n- 한 줄 소개:\n- 현재 관심 분야: 컨설팅\n- 지금 탐구하는 것:\n- 일을 대하는 방식:\n- 지향하는 역할:\n\n## 가치관과 선택 기준 (3개 이상)\n${[1,2,3].map(i=>`\n### 선택 기준 ${i}\n- 기준의 이름:\n- 나에게 갖는 의미:\n- 중요하게 생각하는 이유:\n- 연결되는 경험 (선택):\n`).join('')}\n## 나이츠프론티어 지원동기\n- 지원하게 된 계기:\n- 나의 가치관과 연결되는 이유:\n\n## 앞으로의 7개월\n- 이루고 싶은 것:\n- 나에게 중요한 이유:\n- 확인할 수 있는 결과:\n\n## 해보고 싶은 경험 (1–2개)\n${[1,2].map(i=>`\n### 경험 ${i}${i===2?' (선택)':''}\n- 구체적인 경험:\n- 선택한 이유와 연결되는 기준:\n- 7개월 중 실행할 시기와 방법:\n- 기대하는 배움과 결과:\n`).join('')}`;
const reflectionTemplate=`# 회고와 보완 계획\n\n- 작성일 (YYYY-MM-DD):\n- 태그 (쉼표로 구분): 회고, 성장\n\n## 활동을 돌아보며\n- 돌아볼 기간 / 범위:\n- 쌓은 경험:\n- 관련 활동 글과 링크:\n\n## 부족한 점과 원인\n${[1,2,3].map(i=>`\n### 보완할 부분 ${i}\n- 부족하다고 느낀 점:\n- 근거가 된 활동과 상황:\n- 그 원인:\n`).join('')}\n## 보완 계획\n\n| 보완할 부분 | 실행할 방법 | 시기 / 빈도 | 확인할 변화 |\n|---|---|---|---|\n| 01 | | | |\n| 02 | | | |\n| 03 | | | |\n\n## 다음으로 이어갈 행동\n- 계속 유지할 점:\n- 가장 먼저 시작할 일:\n- 다시 돌아볼 시점:\n`;
function postTemplate(c){return `# [활동 제목]\n\n[활동의 핵심과 나의 역할, 결과를 담는 한 줄 요약]\n\n- 카테고리: ${c.name}\n- 작성일 (YYYY-MM-DD):\n- 태그 (쉼표로 구분):\n- 활동 기간:\n- 참여 형태 (개인 / 팀):\n- 담당 역할:\n- 사용 기술 / 주제:\n- 이 경험에 담긴 선택 기준:\n- 이 경험에서 드러난 역량:\n\n${recordSections(c).map(([,title,fields])=>`## ${title}\n${fields.map(([name])=>`- ${name}:`).join('\n')}\n`).join('\n')}\n## 관련 자료\n- 자료명 / 링크:\n- 이 자료가 보여주는 내용:\n\n## 관련 회고\n- 보완할 부분과 연결되는 회고 글:\n`}
function structureTemplate(){return `# 포트폴리오 구조 — V6.1\n\n개인 내용은 작성 전입니다.\n\n## 한눈에 보기\n짧은 자기소개와 지금의 관심 → 선택 기준 3개 → 대표 경험을 담은 글 목록 → 여섯 분야의 활동 → 7개월 계획과 회고\n\n## 나에 대하여\n현재의 나 → 가치관 3개 이상(각각 의미·이유·연결 경험) → 나이츠프론티어 지원동기 → 이루고 싶은 것 → 7개월 동안 해보고 싶은 경험 1–2개와 구체적인 방법\n\n## 활동 기록\n${categories.map(c=>'- '+c.name).join('\n')}\n\n목록에서는 기간·분야·제목·기여와 결과를 짧게 보여줍니다. 각 활동은 독립된 상세 글로 연결됩니다.\n상세 글: 시작한 이유와 나의 기준 → 역할과 기여 → 진행 과정과 판단 → 결과와 근거 → 배운 점과 개선 → 관련 자료\n\n## 회고와 보완 계획\n지금까지의 활동 → 부족한 점과 원인 → 보완 방법·시기·확인 기준 → 다음 행동\n\n## Timeline과 글 탐색\n소개, 대표 경험, 여섯 분야의 활동, 회고를 하나의 글 목록에 모읍니다. 글마다 작성일과 태그를 두고, 날짜가 있는 글은 연도별 Timeline으로 연결합니다. 태그·글 유형·분야로 필터링하고 최신순·오래된순·제목순으로 정렬합니다. 날짜가 없는 글은 마지막 작성 전 그룹에 둡니다. 필터는 주소에 반영됩니다.\n\n## 화면 구성\n넓은 장식 영역 대신 짧은 소개, 일정한 본문 폭, 제목과 요약 중심 목록을 사용합니다. 작성 안내를 켜면 빈칸의 의도를 확인하고 글 틀을 내려받을 수 있습니다.\n`}

function download(type){let content,name;if(type==='about'){content=aboutTemplate;name='나에-대하여.md'}else if(type==='reflection'){content=reflectionTemplate;name='회고와-보완-계획.md'}else if(type==='structure'){content=structureTemplate();name='포트폴리오-구조.md'}else{const c=recordById(type.replace('post-',''));if(!c)return;content=postTemplate(c);name=c.id+'-활동글-틀.md'}const url=URL.createObjectURL(new Blob([content],{type:'text/markdown;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('빈 글 틀을 내려받았습니다.')}
function toast(message){const el=document.querySelector('#toast');el.textContent=message;el.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('show'),3000)}
let viewMode='list';
let guidesVisible=false;
function updateReadingNav(){
  const nav=document.querySelector('.home-jump')||document.querySelector('.article-nav');
  if(!nav)return;
  const links=[...nav.querySelectorAll('a[data-section]')];
  const sections=links.map(a=>document.getElementById(a.dataset.section)).filter(Boolean);
  if(!sections.length)return;
  const sticky=getComputedStyle(nav).position==='sticky';
  const line=(sticky?nav.getBoundingClientRect().bottom:document.querySelector('.header').getBoundingClientRect().bottom)+28;
  const current=sections.filter(s=>s.getBoundingClientRect().top<=line).at(-1)||sections[0];
  links.forEach(a=>{const active=a.dataset.section===current.id;a.classList.toggle('active',active);if(active)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current')});
}
function refreshReadingState(){updateReadingNav()}
let readingFrame=false;
window.addEventListener('scroll',()=>{if(readingFrame)return;readingFrame=true;requestAnimationFrame(()=>{readingFrame=false;updateReadingNav()})},{passive:true});
window.addEventListener('resize',updateReadingNav);

function scrollToSection(id){const target=document.getElementById(id);if(!target)return;target.scrollIntoView({block:'start',behavior:'instant'});target.setAttribute('tabindex','-1');target.focus({preventScroll:true});updateReadingNav();}
function render(){let r=currentRoute();if(r.page==='direction'){history.replaceState(null,'',deep('about','direction'));r=currentRoute()}sidebar.innerHTML=sideNav();const renderers={'':home,about,archive:()=>unifiedArchive(r.id),timeline,posts:()=>post(r.id),reflection};main.innerHTML=(renderers[r.page]||notFound)();document.title=({'':'한눈에 보기',about:'나에 대하여',archive:'글 모아보기',timeline:'Timeline',posts:'활동 기록',reflection:'회고와 보완 계획'}[r.page]||'Portfolio')+' · happypite';document.querySelector('#view-mode')?.querySelector(`option[value="${viewMode}"]`)?.setAttribute('selected','');const retainedScroll=browseScroll;browseScroll=null;window.scrollTo({top:retainedScroll??0,behavior:'instant'});if(r.section)scrollToSection(!r.page&&r.section==='proof-map'?'selected-work':r.section);else if(retainedScroll===null)main.focus({preventScroll:true});refreshReadingState();}
document.addEventListener('click',async event=>{if(event.target.closest('#guide-toggle')){guidesVisible=!guidesVisible;document.body.classList.toggle('show-guides',guidesVisible);document.querySelector('#guide-toggle').setAttribute('aria-pressed',String(guidesVisible));document.querySelector('#guide-toggle .toggle-state').textContent=guidesVisible?'ON':'OFF';return}const samePage=event.target.closest('a[href^="#/"]');if(samePage && samePage.hash===location.hash){event.preventDefault();const route=currentRoute();if(route.section)scrollToSection(route.section);else{window.scrollTo({top:0,behavior:'instant'});main.focus({preventScroll:true});}return}const skip=event.target.closest('[data-scroll]');if(skip){event.preventDefault();scrollToSection(skip.dataset.scroll);return}const sectionLink=event.target.closest('[data-section]');if(sectionLink){event.preventDefault();const r=currentRoute();const base=r.page==='posts'?`posts/${r.id}`:r.page;history.replaceState(null,'',deep(base,sectionLink.dataset.section));scrollToSection(sectionLink.dataset.section);return}const dl=event.target.closest('[data-download]');if(dl){download(dl.dataset.download);return}if(event.target.closest('[data-copy]')){try{await navigator.clipboard.writeText(location.href);toast('페이지 링크를 복사했습니다.')}catch{toast('주소창에서 페이지 주소를 복사해 주세요.')}}});
document.addEventListener('change',event=>{if(event.target.id==='view-mode'){viewMode=event.target.value;document.querySelector('#activity-view').classList.toggle('list-view',viewMode==='list')}});
window.addEventListener('hashchange',render);
render();

