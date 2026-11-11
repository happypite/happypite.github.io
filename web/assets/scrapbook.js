import {escapeHTML as h} from './markdown.js';
import {showPDF} from './export.js';
import {isScrapbook,normalizeScrapbook,buildMonthPost,monthLabel,issueCount,addDay,putEntry,removeEntry,validMonth} from './scrap-model.js';
const today=()=>{const d=new Date();return new Date(d-d.getTimezoneOffset()*60000).toISOString().slice(0,10);};
const button=(action,label,extra='')=>`<button type="button" data-scrap-action="${action}" ${extra}>${label}</button>`;
export function scrapbookMarkup(post,canManage){
 const b=normalizeScrapbook(post.scrapbook);
 return `<header class="scrap-heading"><div><p class="scrap-eyebrow">SECURITY ISSUE ARCHIVE</p><h2>${h(monthLabel(b.month))}</h2><p>${b.days.length}일 기록 · ${issueCount(b)}건의 스크랩</p></div><div class="scrap-actions">${button('markdown','Markdown ↓')}${button('pdf','PDF ↓')}${canManage?button('day','날짜 추가 ＋')+button('entry','스크랩 추가 ＋','class="scrap-primary"')+button('delete-month','월 삭제','class="scrap-danger"'):''}</div></header>
 ${b.days.length?'<div class="scrap-days">'+b.days.map(d=>`<section class="scrap-day" aria-labelledby="day-${d.date}"><header><div><h3 id="day-${d.date}"><time datetime="${d.date}">${Number(d.date.slice(5,7))}월 ${Number(d.date.slice(8))}일</time></h3><span>${d.entries.length}건</span></div>${canManage?'<div class="scrap-actions">'+button('entry','이슈 추가 ＋',`data-date="${d.date}"`)+button('delete-day','날짜 삭제',`data-date="${d.date}" class="scrap-danger"`)+'</div>':''}</header>${d.entries.length?'<ol class="scrap-entries">'+d.entries.map(e=>`<li><article class="scrap-entry"><h4>${h(e.title)}</h4><p class="scrap-summary">${h(e.summary)}</p><a class="scrap-source" href="${h(e.sourceUrl)}" target="_blank" rel="noopener noreferrer">${new URL(e.sourceUrl).hostname.replace(/^www\./,'').match(/^(x\.com|twitter\.com)$/)?'X 원문':'원문'} 보기 ↗</a>${e.memo?`<details class="scrap-memo"><summary>정리 메모</summary><p>${h(e.memo)}</p></details>`:''}${canManage?'<div class="scrap-entry-tools">'+button('edit','수정',`data-id="${h(e.id)}"`)+button('delete-entry','삭제',`data-id="${h(e.id)}" class="scrap-danger"`)+'</div>':''}</article></li>`).join('')+'</ol>':'<p class="scrap-day-empty">아직 추가한 이슈가 없습니다.'+(canManage?' 위의 이슈 추가로 기록을 시작하세요.':'')+'</p>'}</section>`).join('')+'</div>':`<div class="scrap-empty"><h3>날짜별로 차곡차곡 모아보세요.</h3><p>${canManage?'날짜를 먼저 추가하거나 스크랩 추가를 눌러 첫 이슈를 기록하세요.':'아직 이 달에 등록한 이슈가 없습니다.'}</p></div>`}`;
}
export class ScrapbookUI{
 constructor(notes){this.notes=notes;this.store=notes.store;this.host=notes.content;this.month='';this.editing=false;this.busy=false;
 this.host.addEventListener('click',e=>{const el=e.target.closest('[data-scrap-action]');if(!el)return;e.preventDefault();e.stopPropagation();this.action(el.dataset.scrapAction,el.dataset);});
 this.host.addEventListener('change',e=>{if(e.target.id==='scrap-month-select'){if(this.editing){e.target.value=this.month;return;}this.month=e.target.value;this.render();if(this.post)this.notes.onPostOpen?.(this.post);}});
 this.host.addEventListener('submit',e=>{if(e.target.id==='scrap-form'){e.preventDefault();this.submit(e.target);}});
 }
 get posts(){return this.store.posts.filter(p=>p.category==='documentation'&&isScrapbook(p)&&p.status==='published'&&!p.deletedAt).sort((a,b)=>b.scrapbook.month.localeCompare(a.scrapbook.month));}
 get post(){return this.posts.find(p=>p.scrapbook.month===this.month);}
 leave(){this.editing=false;this.formState=null;}
 lockOutsideForm(){this.host.querySelectorAll('[data-scrap-action],#scrap-month-select').forEach(el=>{if(!el.closest('#scrap-form-slot'))el.disabled=true;});}
 render(){
 if(this.editing)return;this.notes.mode='list';this.host.className='scrapbook';const posts=this.posts;if(!posts.some(p=>p.scrapbook.month===this.month))this.month=posts[0]?.scrapbook.month||'';
 this.host.innerHTML=`<div class="scrap-intro"><div><h2>보안 이슈 스크랩</h2><p>X에서 발견한 보안 소식을 날짜별로 모읍니다. 제목과 요약을 훑고 원문과 메모를 확인하세요.</p></div>${this.store.canManage?button('month','월 추가 ＋','class="scrap-primary"'):''}</div><div class="scrap-monthbar">${posts.length?'<label for="scrap-month-select">기록한 월</label><select id="scrap-month-select">'+posts.map(p=>'<option value="'+h(p.scrapbook.month)+'" '+(p.scrapbook.month===this.month?'selected':'')+'>'+h(monthLabel(p.scrapbook.month))+' · '+issueCount(p.scrapbook)+'건</option>').join('')+'</select><span>최신 날짜부터 표시</span>':''}</div><div id="scrap-feedback" aria-live="polite"></div><div id="scrap-form-slot"></div>${this.post?scrapbookMarkup(this.post,this.store.canManage):`<div class="scrap-empty"><h3>아직 보안 이슈 기록이 없습니다.</h3><p>${this.store.canManage?'월 추가를 눌러 기록할 월을 만들어 주세요.':'새 스크랩이 게시되면 월별·날짜별로 여기에서 볼 수 있습니다.'}</p></div>`}`;
 }
 feedback(message,error=false){const slot=this.host.querySelector('#scrap-feedback');if(slot){slot.className=error?'note-error':'note-success';slot.setAttribute('role',error?'alert':'status');slot.textContent=message;}}
 action(action,data={}){
 if(this.busy)return;
 if(action==='markdown'){if(this.post)this.notes.download(this.post);return;}
 if(action==='pdf'){if(this.post)showPDF(this.post,'보안 이슈 스크랩');return;}
 if(action==='cancel'){this.leave();this.render();return;}
 if(!this.store.canManage){this.feedback('작성자 로그인 후 변경할 수 있습니다.',true);return;}
 if(this.editing)return;
 if(['month','day','entry','edit'].includes(action)){this.form(action,data);return;}
 if(action.startsWith('delete-'))this.confirm(action,data);
 }
 form(kind,data){
 const post=this.post,b=post?.scrapbook;let entry,entryDay;if(kind!=='month'&&!post)return;
 if(kind==='edit'){for(const d of b.days){const found=d.entries.find(e=>e.id===data.id);if(found){entry=found;entryDay=d.date;break;}}if(!entry)return;}
 this.editing=true;this.notes.mode='scrap-editor';this.notes.sequence++;this.formState={kind,id:entry?.id,postId:post?.id};
 const date=entryDay||data.date||(today().startsWith(this.month)?today():this.month+'-01');
 const field=(name,label,type,value,extra='')=>`<label>${label}<input name="${name}" type="${type}" value="${h(value)}" required ${extra}></label>`;
 this.host.querySelector('#scrap-form-slot').innerHTML=`<form id="scrap-form" class="scrap-form"><h3>${{month:'새 월 만들기',day:'날짜 추가',entry:'새 이슈 기록',edit:'이슈 수정'}[kind]}</h3>${kind==='month'?field('month','기록할 월','month',today().slice(0,7),'min="1000-01" max="9999-12"'):field('date','기록 날짜','date',date,`min="${this.month}-01" max="${this.month}-${new Date(Number(this.month.slice(0,4)),Number(this.month.slice(5)),0).getDate()}"`)}${['entry','edit'].includes(kind)?field('title','이슈 제목','text',entry?.title||'','maxlength="160"')+field('sourceUrl','원문 링크','url',entry?.sourceUrl||'','placeholder="https://x.com/…" maxlength="2000"')+`<label>한 줄 요약<textarea name="summary" rows="2" maxlength="600" required placeholder="어떤 보안 이슈인지 간단히 적어주세요.">${h(entry?.summary||'')}</textarea></label><label>정리 메모 <small>선택</small><textarea name="memo" rows="5" maxlength="6000" placeholder="영향 범위, 확인한 내용, 배운 점 등을 기록하세요.">${h(entry?.memo||'')}</textarea></label>`:''}<p>저장한 내용은 공개 블로그에 반영됩니다. 다른 방문자에게 보이기까지 잠시 걸릴 수 있습니다.</p><p id="scrap-form-error" role="alert"></p><div class="scrap-actions">${button('cancel','취소')}<button type="submit" class="scrap-primary">${kind==='month'?'월 만들기':kind==='day'?'날짜 추가':'저장하기'}</button></div></form>`;
 this.lockOutsideForm();const form=this.host.querySelector('#scrap-form');form.querySelector('input')?.focus();form.scrollIntoView({block:'nearest'});
 }
 async submit(form){
 if(this.busy||!this.store.canManage)return;const state=this.formState;if(!state||this.notes.mode!=='scrap-editor')return;
 const value=name=>form.elements.namedItem(name)?.value||'';let book,base;
 try{if(state.kind==='month'){const month=value('month');if(!validMonth(month))throw Error('올바른 월을 선택해 주세요.');if(this.posts.some(p=>p.scrapbook.month===month))throw Error('이미 기록 중인 월입니다. 취소 후 목록에서 선택해 주세요.');book={month,days:[]};}
 else{base=this.store.posts.find(p=>p.id===state.postId);if(!base)throw Error('월 기록을 다시 열어 주세요.');book=base.scrapbook;if(state.kind==='day')book=addDay(book,value('date'));else book=putEntry(book,value('date'),{id:state.id||crypto.randomUUID(),title:value('title'),sourceUrl:value('sourceUrl'),summary:value('summary'),memo:value('memo')});}
 await this.saveBook(book,base,form);
 }catch(e){const error=form.querySelector('#scrap-form-error');if(error)error.textContent=e.message;}
 }
 async saveBook(book,base,form){
 if(!this.store.canManage)throw Error('작성자 로그인이 필요합니다.');this.busy=true;const controls=[...form.querySelectorAll('input,textarea,button,select')];controls.forEach(el=>el.disabled=true);
 try{await this.store.save(buildMonthPost(book,base));if(this.notes.mode!=='scrap-editor'){this.notes.notify('월별 기록을 저장했습니다.');return;}this.month=book.month;this.leave();this.render();if(this.post)this.notes.onPostOpen?.(this.post);this.host.querySelector('#scrap-month-select')?.focus({preventScroll:true});this.feedback('저장했습니다. 공개 사이트에는 배포 후 반영됩니다.');}
 finally{this.busy=false;controls.forEach(el=>{if(el.isConnected)el.disabled=false;});}
 }
 confirm(action,data){
 const post=this.post;if(!post)return;const b=normalizeScrapbook(post.scrapbook),day=b.days.find(d=>d.date===data.date),entry=b.days.flatMap(d=>d.entries).find(e=>e.id===data.id);
 if(action==='delete-day'&&!day||action==='delete-entry'&&!entry)return;
 const label=action==='delete-month'?`${monthLabel(b.month)} 전체 기록 (${issueCount(b)}건)`:action==='delete-day'?`${data.date} 기록 (${day.entries.length}건)`:entry.title;
 this.editing=true;this.notes.mode='scrap-editor';this.notes.sequence++;
 const slot=this.host.querySelector('#scrap-form-slot');slot.innerHTML=`<div class="scrap-form" role="alert"><h3>${h(label)}을 삭제할까요?</h3><p>공개 목록에서 제거됩니다. 저장소 기록에는 이전 내용이 남을 수 있습니다.</p><p id="scrap-delete-error"></p><div class="scrap-actions">${button('cancel','취소')}<button type="button" class="scrap-danger" id="scrap-delete-confirm">삭제하기</button></div></div>`;
 this.lockOutsideForm();const confirm=slot.querySelector('#scrap-delete-confirm');confirm.focus();confirm.onclick=async()=>{if(this.busy||!this.store.canManage)return;this.busy=true;confirm.disabled=true;try{if(action==='delete-month')await this.store.remove(post.id);else{const book=action==='delete-day'?{...b,days:b.days.filter(d=>d.date!==data.date)}:removeEntry(b,data.id);await this.store.save(buildMonthPost(book,post));}if(this.notes.mode!=='scrap-editor'){this.notes.notify('월별 기록을 삭제했습니다.');return;}this.leave();this.render();this.feedback('삭제했습니다. 공개 사이트에는 배포 후 반영됩니다.');}catch(e){slot.querySelector('#scrap-delete-error').textContent=e.message;}finally{this.busy=false;confirm.disabled=false;}};
 slot.scrollIntoView({block:'nearest'});
 }
}
