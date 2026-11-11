import {rememberReading,savedPosition} from './reading-history.js';
import {escapeHTML} from './markdown.js';

export const readingSize=value=>[16,18,20,22].includes(Number(value))?Number(value):18;
export function searchExcerpt(post,query,limit=150){
 const q=String(query||'').trim(),body=String(post.body||'').replace(/```[\s\S]*?```/g,' ').replace(/[#>*_`\[\]|]/g,' ').replace(/\s+/g,' ').trim();
 let text=String(post.summary||body||'내용 보기'),at=q?text.toLocaleLowerCase().indexOf(q.toLocaleLowerCase()):-1;
 if(q&&at<0){const found=body.toLocaleLowerCase().indexOf(q.toLocaleLowerCase());if(found>=0){text=body;at=found;}}
 const start=at>45?at-45:0,part=text.slice(start,start+limit),needle=q?part.toLocaleLowerCase().indexOf(q.toLocaleLowerCase()):-1;
 return (start?'…':'')+(needle<0?escapeHTML(part):escapeHTML(part.slice(0,needle))+'<mark>'+escapeHTML(part.slice(needle,needle+q.length))+'</mark>'+escapeHTML(part.slice(needle+q.length)))+(start+limit<text.length?'…':'');
}
export function relatedPosts(posts,current,limit=3){
 const tags=new Set(current.tags||[]),score=p=>(p.category===current.category?4:0)+(p.tags||[]).filter(t=>tags.has(t)).length;
 return posts.filter(p=>p.id!==current.id&&p.status==='published'&&!p.deletedAt&&score(p)>0).sort((a,b)=>score(b)-score(a)||String(b.date||'').localeCompare(String(a.date||''))).slice(0,limit);
}
export function noteURL(origin,id){const url=new URL('/read/',origin);url.searchParams.set('note',String(id));return url.href;}
export function postMarkdown(post){
 const data={title:post.title,category:post.category,date:post.date,summary:post.summary||'',tags:post.tags||[],status:post.status==='draft'?'draft':'published',fontSize:readingSize(post.fontSize),pinned:post.pinned===true,...(post.url?{url:post.url}:{})};
 return '---\n'+Object.entries(data).map(([key,value])=>key+': '+JSON.stringify(value)).join('\n')+'\n---\n\n'+post.body+'\n';
}

export function tocMarkup(html){const headings=[...html.matchAll(/<h([2-6]) id="([^"]+)">(.*?)<\/h[2-6]>/g)];return headings.length?'<details class="reader-toc" '+(headings.length<=3?'open':'')+'><summary>이 노트의 목차 <span>'+headings.length+'개</span></summary><nav>'+headings.map(h=>'<a href="#'+h[2]+'" style="--level:'+h[1]+'">'+h[3].replace(/<[^>]*>/g,'')+'</a>').join('')+'</nav></details>':'';}

export function readingOptions(_canManage,_size=18,showProgress=false){
 return showProgress?'<div class="reading-options"><span class="reading-position" id="reading-position">읽기 위치 0%</span></div><div class="reading-progress" aria-hidden="true"><span id="reading-progress-bar"></span></div>':'';
}

export class ReaderTools{
 constructor(notes){this.notes=notes;this.main=document.querySelector('.collection-main');this.size=18;
  this.main.addEventListener('scroll',()=>{if(notes.mode!=='reader'||this.frame)return;this.frame=requestAnimationFrame(()=>{this.frame=0;this.update(true);});},{passive:true});
  document.querySelector('#detail').addEventListener('click',e=>{const b=e.target.closest('[data-reader-action]');if(!b)return;const action=b.dataset.readerAction;
   if(action==='share')this.share();if(action==='top')this.main.scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
   if(action==='resume'&&this.saved){const saved=this.saved;this.resumeStatus='저장된 '+Math.round(saved.progress*100)+'% 위치로 이동했습니다.';this.updateResumeStatus();const target=document.getElementById(saved.anchor),body=this.main.querySelector('.markdown-body'),rect=this.main.getBoundingClientRect();let top;if(target&&this.main.contains(target))top=this.main.scrollTop+target.getBoundingClientRect().top-rect.top+saved.offset;else{const start=this.main.scrollTop+body.getBoundingClientRect().top-rect.top;top=start+saved.progress*Math.max(1,body.offsetHeight-this.main.clientHeight*.65);}this.main.scrollTo({top,behavior:'instant'});this.update(true);}
   if(action==='restart'){clearTimeout(this.saveTimer);this.pending=null;this.resumeStatus='처음부터 읽고 있습니다.';this.updateResumeStatus();rememberReading(this.notes.post,0);this.main.scrollTo({top:0,behavior:'instant'});}
  });
 }
 controls(){const post=this.notes.post;return readingOptions(this.notes.store.canManage,this.size,post.body.length>1200||(post.body.match(/^#{1,5} /gm)||[]).length>3);}
 mount(){const post=this.notes.post;this.main.style.setProperty('--reading-size',readingSize(post.fontSize)+'px');
  if(post.id!==this.currentId){this.currentId=post.id;this.saved=savedPosition(post);this.resumeStatus='';if(!this.saved)rememberReading(post,0);}
  if(this.saved&&!this.main.querySelector('.resume-reading')){const host=document.querySelector('#reader-feedback');host.insertAdjacentHTML('beforeend','<div class="resume-reading"><span data-resume-message role="status" aria-live="polite">지난번에 '+Math.round(this.saved.progress*100)+'%까지 읽었습니다.</span><button data-reader-action="resume">이어서 읽기 →</button><button data-reader-action="restart">처음부터</button></div>');}
  this.updateResumeStatus();this.update();
 }
 updateResumeStatus(){const label=this.main.querySelector('[data-resume-message]');if(label&&this.resumeStatus)label.textContent=this.resumeStatus;}
 leave(){clearTimeout(this.saveTimer);if(this.pending){rememberReading(this.pending.post,this.pending.progress,this.pending.position);this.pending=null;}this.currentId=null;this.saved=null;}
 update(track=false){if(this.notes.mode!=='reader')return;const body=this.main.querySelector('.markdown-body');if(!body)return;const rect=this.main.getBoundingClientRect(),start=this.main.scrollTop+body.getBoundingClientRect().top-rect.top,end=start+body.offsetHeight-this.main.clientHeight*.65,progress=Math.min(1,Math.max(0,(this.main.scrollTop-start)/Math.max(1,end-start))),percent=Math.round(progress*100),bar=document.querySelector('#reading-progress-bar'),label=document.querySelector('#reading-position');if(bar)bar.style.width=percent+'%';if(label)label.textContent='읽기 위치 '+percent+'%';let active=body.querySelector('h2,h3,h4,h5,h6');for(const h of body.querySelectorAll('h2,h3,h4,h5,h6'))if(h.getBoundingClientRect().top<rect.top+145)active=h;for(const a of this.main.querySelectorAll('.reader-toc a')){if(a.getAttribute('href')==='#'+active?.id)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');}
  if(track&&progress>.02){this.pending={post:this.notes.post,progress,position:{anchor:active?.id||'',offset:active?rect.top-active.getBoundingClientRect().top:0}};clearTimeout(this.saveTimer);this.saveTimer=setTimeout(()=>{if(this.pending){rememberReading(this.pending.post,this.pending.progress,this.pending.position);this.pending=null;}},250);}
 }
 async share(){const url=noteURL(globalThis.ARCHIVE_CONFIG?.siteUrl||location.origin,this.notes.post.id);try{await navigator.clipboard.writeText(url);this.notes.notify('이 글의 링크를 복사했습니다.');}catch{const feedback=document.querySelector('#reader-feedback');if(feedback){feedback.innerHTML='<label class="share-fallback">이 주소를 복사해 주세요.<input readonly aria-label="공유할 글 주소" value="'+escapeHTML(url)+'"></label>';feedback.querySelector('input').select();}}}
}
