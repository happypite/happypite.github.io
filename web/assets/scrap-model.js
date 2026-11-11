export const SCRAP_SERIES='security-scrap';
export const isScrapbook=post=>post?.series===SCRAP_SERIES;
const fail=message=>{throw Error(message);};
const text=(value,max,label,required=false)=>{if(typeof value!=='string')return fail(label+'을 확인해 주세요.');const s=value.trim();if((required&&!s)||s.length>max)fail(label+'은 '+(required?'1~':'최대 ')+max+'자로 입력해 주세요.');return s;};
export function validMonth(month){return typeof month==='string'&&/^[1-9]\d{3}-(0[1-9]|1[0-2])$/.test(month);}
export function validDay(date,month){return typeof date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(date)&&date.slice(0,7)===month&&Number.isFinite(Date.parse(date))&&new Date(date).toISOString().slice(0,10)===date;}
export function sourceURL(value){const s=text(value,2000,'원문 링크',true);let u;try{u=new URL(s);}catch{fail('원문 링크에 올바른 https 또는 http 주소를 입력해 주세요.');}if(!['https:','http:'].includes(u.protocol)||u.username||u.password)fail('원문 링크는 로그인 정보 없는 https 또는 http 주소를 입력해 주세요.');return u.href;}
export function normalizeScrapbook(input){
 if(!input||!validMonth(input.month)||!Array.isArray(input.days)||input.days.length>31)fail('월과 날짜 목록을 확인해 주세요.');
 const dates=new Set(),ids=new Set();let count=0;
 const days=input.days.map(day=>{if(!day||!validDay(day.date,input.month)||dates.has(day.date)||!Array.isArray(day.entries))fail('날짜는 해당 월의 실제 날짜이며 중복되지 않아야 합니다.');dates.add(day.date);
 const entries=day.entries.map(e=>{if(!e||typeof e.id!=='string'||!/^[A-Za-z0-9_-]{1,80}$/.test(e.id)||ids.has(e.id))fail('이슈 식별자가 올바르지 않거나 중복되었습니다.');ids.add(e.id);if(++count>500)fail('한 달에 최대 500건까지 기록할 수 있습니다.');return {id:e.id,title:text(e.title,160,'제목',true),sourceUrl:sourceURL(e.sourceUrl),summary:text(e.summary,600,'한 줄 요약',true),memo:text(e.memo||'',6000,'메모')};});return {date:day.date,entries};}).sort((a,b)=>b.date.localeCompare(a.date));
 const book={month:input.month,days};if(new TextEncoder().encode(JSON.stringify(book)).length>120000)fail('한 달 기록이 너무 큽니다. 긴 메모를 별도 기술 노트에 정리해 주세요.');return book;
}
export function scrapMetadata(post){if(!isScrapbook(post))return {};if(post.category!=='documentation')fail('보안 이슈 스크랩은 블로그/기술문서에 저장해 주세요.');return {series:SCRAP_SERIES,scrapbook:normalizeScrapbook(post.scrapbook)};}
export const issueCount=book=>book.days.reduce((sum,d)=>sum+d.entries.length,0);
export const monthLabel=month=>`${month.slice(0,4)}년 ${Number(month.slice(5))}월`;
const literal=s=>s.replace(/[\\`*_{}\[\]<>#|~]/g,'\\$&').replace(/\r?\n/g,' ');
export function buildMonthPost(input,base={}){
 const book=normalizeScrapbook(input),count=issueCount(book);
 const body=['# '+monthLabel(book.month)+' 보안 이슈 스크랩','X에서 찾은 보안 소식과 원문을 날짜별로 기록합니다.',...book.days.flatMap(d=>['## '+d.date,...(d.entries.length?d.entries.flatMap(e=>['### '+literal(e.title),literal(e.summary),'[원문 보기](<'+e.sourceUrl.replace(/[<>\s]/g,c=>encodeURIComponent(c))+'>)',...(e.memo?['메모:\n\n'+e.memo]:[])]):['아직 등록한 이슈가 없습니다.'])])].join('\n\n');
 return {...base,category:'documentation',series:SCRAP_SERIES,scrapbook:book,title:monthLabel(book.month)+' 보안 이슈 스크랩',date:book.month+'-01',summary:`${monthLabel(book.month)} · ${book.days.length}일 기록 · 보안 이슈 ${count}건`,tags:['보안이슈','X스크랩'],body,status:'published',fontSize:18};
}
export function addDay(input,date){const b=normalizeScrapbook(input);if(b.days.some(d=>d.date===date))fail('이미 있는 날짜입니다. 해당 날짜에 스크랩을 추가해 주세요.');return normalizeScrapbook({...b,days:[...b.days,{date,entries:[]}]});}
export function putEntry(input,date,entry){let b=normalizeScrapbook(input);if(!validDay(date,b.month))fail('선택한 월 안의 날짜를 입력해 주세요.');b={...b,days:b.days.map(d=>({...d,entries:d.entries.filter(e=>e.id!==entry.id)}))};let day=b.days.find(d=>d.date===date);if(!day){day={date,entries:[]};b.days.push(day);}day.entries.push(entry);return normalizeScrapbook(b);}
export function removeEntry(input,id){const b=normalizeScrapbook(input);return {...b,days:b.days.map(d=>({...d,entries:d.entries.filter(e=>e.id!==id)}))};}
