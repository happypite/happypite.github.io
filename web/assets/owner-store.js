import {AUTH_SERVER_URL} from './auth-config.js';
import {postMarkdown} from './reading.js';
import {localDay} from './github-store.js';
const OWNER_ID=205749646, REPO='happypite/happypite.github.io';
const categories=['development','ctf-wargame','bug-bounty','documentation','research','activities'];
export function validateNote(p){
 if(!p.title?.trim()||p.title.length>160||!p.body?.trim()||p.body.length>200000)throw Error('제목(160자 이내)과 본문(20만 자 이내)을 입력하세요.');
 if(p.fontSize!==undefined&&![16,18,20,22].includes(Number(p.fontSize)))throw Error('본문 글자 크기를 확인하세요.');
 if(!categories.includes(p.category))throw Error('카테고리를 선택하세요.');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(p.date)||!Number.isFinite(Date.parse(p.date))||new Date(p.date).toISOString().slice(0,10)!==p.date)throw Error('날짜를 확인하세요.');
 if(p.url&&!/^https?:\/\//i.test(p.url))throw Error('관련 링크는 https 또는 http 주소를 입력하세요.');
}
const encode=s=>btoa(Array.from(new TextEncoder().encode(s),b=>String.fromCharCode(b)).join(''));
const decode=s=>new TextDecoder().decode(Uint8Array.from(atob(s.replace(/\s/g,'')),c=>c.charCodeAt(0)));
const digest=async s=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s))),b=>b.toString(16).padStart(2,'0')).join('');
export class OwnerStore{
 #token='';
 #serverAuthenticated=false;
 constructor(config){this.config=config;this.shas=new Map();this.paths=new Map();}
 get serverMode(){return this.config.authMode==='server';}
 get authenticated(){return this.serverMode?this.#serverAuthenticated:!!this.#token;}
 logout(){this.#serverAuthenticated=false;this.#token='';this.shas.clear();this.paths.clear();}
 async api(path,options={},token=this.#token){
  if(this.serverMode){if(!this.#serverAuthenticated)throw Error('GitHub 로그인이 필요합니다.');const response=await fetch('/api/github',{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json','X-Happypite-Request':'1'},body:JSON.stringify({path,method:options.method||'GET',...(options.body?{body:JSON.parse(options.body)}:{})})});const data=response.status===204?null:await response.json();if(!response.ok){if(response.status===401)this.logout();throw Error(data?.error||'관리자 요청에 실패했습니다.');}return data;}
  if(!token)throw Error('GitHub 본인 인증이 필요합니다.');
  const r=await fetch('https://api.github.com'+path,{...options,cache:'no-store',referrerPolicy:'no-referrer',headers:{Accept:'application/vnd.github+json',Authorization:'Bearer '+token,...(options.body?{'Content-Type':'application/json'}:{})}});
  if(!r.ok){if(r.status===401){this.logout();throw Error('인증이 만료됐습니다. 다시 연결하세요.');}if(r.status===409||r.status===422)throw Error('다른 곳에서 글이 변경되었습니다. 다시 연결한 뒤 최신 글을 열어주세요. 작성 내용은 브라우저에 남아 있습니다.');throw Error(r.status===403?'저장 권한이 없습니다. 이 저장소의 Contents: Read and write 권한을 확인하세요.':'GitHub 요청 실패 ('+r.status+'). 연결과 저장소 권한을 확인하세요.');}
  return r.status===204?null:r.json();
 }
 async restoreSession(){if(!this.serverMode)return false;const r=await fetch('/api/session',{credentials:'same-origin',cache:'no-store',headers:{Accept:'application/json'}});if(!r.ok)throw Error('로그인 상태를 확인하지 못했습니다.');const data=await r.json();this.#serverAuthenticated=data.authenticated===true&&data.login==='happypite';return this.#serverAuthenticated;}
 async disconnect(){if(this.serverMode){const r=await fetch('/auth/logout',{method:'POST',credentials:'same-origin',headers:{'X-Happypite-Request':'1'}});if(!r.ok)throw Error('로그아웃하지 못했습니다. 다시 시도해 주세요.');}this.logout();}
 async login(token){if(this.serverMode)throw Error('관리자 화면에서는 GitHub 계정으로 로그인해 주세요.');
  this.logout();token=token.trim();
  const user=await this.api('/user',{},token);
  if(user.id!==OWNER_ID)throw Error('이 사이트는 happypite 본인 계정만 관리할 수 있습니다.');
  const repo=await this.api('/repos/'+REPO,{},token);
  if(!repo.permissions?.push)throw Error('이 저장소의 쓰기 권한이 필요합니다.');
  this.#token=token;
 }
 endpoint(path){if(!/^content\/posts\/(?!.*(?:^|\/)\.\.?\/)[^\\]+\.md$/.test(path)||path.includes('..'))throw Error('올바르지 않은 글 경로입니다.');return '/repos/'+REPO+'/contents/'+path.split('/').map(encodeURIComponent).join('/');}
 async load(){
  const tree=await this.api('/repos/'+REPO+'/git/trees/'+encodeURIComponent(this.config.branch||'main')+'?recursive=1');
  if(tree.truncated)throw Error('글 목록이 너무 큽니다. GitHub에서 확인해 주세요.');
  const posts=[];
  for(const f of tree.tree.filter(f=>f.type==='blob'&&f.path.startsWith('content/posts/')&&f.path.endsWith('.md')&&!f.path.split('/').pop().startsWith('_'))){
   const file=await this.api(this.endpoint(f.path)+'?ref='+encodeURIComponent(this.config.branch||'main'));
   const text=decode(file.content),match=text.replace(/\r\n/g,'\n').match(/^---\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);if(!match)continue;
   const p={tags:[]};let arrayKey='';for(const line of match[1].split('\n')){if(arrayKey&&/^\s+- /.test(line)){p[arrayKey].push(line.trim().slice(2).replace(/^['"]|['"]$/g,''));continue;}const m=line.match(/^([\w-]+):\s*(.*)$/);if(!m)continue;arrayKey='';try{p[m[1]]=JSON.parse(m[2]);}catch{p[m[1]]=m[2].replace(/^['"]|['"]$/g,'');if(m[1]==='tags'){p.tags=m[2]?m[2].replace(/^\[|\]$/g,'').split(',').map(s=>s.trim().replace(/^['"]|['"]$/g,'')):[];if(!m[2])arrayKey='tags';}}}
   if(p.status!=='published')continue;
   const id='gh-'+(await digest(f.path)).slice(0,20);this.shas.set(id,file.sha);this.paths.set(id,f.path);
   posts.push({...p,id,body:match[2].trim(),sourcePath:f.path,contentVersion:await digest(text),createdAt:p.date+'T00:00:00.000Z',updatedAt:(p.updated||p.date)+'T00:00:00.000Z'});
  }return posts;
 }
 async save(p){
  if(!this.authenticated)throw Error('GitHub 본인 인증이 필요합니다.');validateNote(p);
  const path=p.id?this.paths.get(p.id):'content/posts/'+localDay()+'-'+crypto.randomUUID()+'.md';
  const sha=p.id?this.shas.get(p.id):undefined;if(p.id&&(!path||!sha))throw Error('최신 글을 다시 불러온 뒤 수정하세요.');
  const source=postMarkdown({...p,status:'published'}).replace('\n---\n\n','\nupdated: '+JSON.stringify(localDay())+'\n---\n\n');
  await this.api(this.endpoint(path),{method:'PUT',body:JSON.stringify({message:(p.id?'Update: ':'Publish: ')+p.title,content:encode(source),branch:this.config.branch||'main',...(sha?{sha}:{})})});
  const id='gh-'+(await digest(path)).slice(0,20);const posts=await this.load();return {post:posts.find(p=>p.id===id),posts};
 }
 async remove(id){const path=this.paths.get(id),sha=this.shas.get(id);if(!path||!sha)throw Error('최신 글을 다시 불러오세요.');await this.api(this.endpoint(path),{method:'DELETE',body:JSON.stringify({message:'Delete study note',sha,branch:this.config.branch||'main'})});return this.load();}
}
export function mountOwnerLogin(store){
 const connected=posts=>{store.posts=posts;store.fallback=posts.map(p=>({...p}));store.publicExpected=posts.map(p=>({id:p.id,contentVersion:p.contentVersion}));store.authorTools=true;store.canWrite=true;store.listeners.forEach(fn=>fn(posts));};
 if(store.owner.serverMode){
  const status=document.querySelector('.header-note');if(status)status.textContent='관리자 모드 · GitHub 로그인';
  store.owner.restoreSession().then(async active=>{if(active)connected(await store.owner.load());}).catch(()=>{store.owner.logout();});
  return async()=>{if(!store.owner.authenticated){location.assign('/auth/login');return;}try{await store.owner.disconnect();store.authorTools=false;store.canWrite=false;store.listeners.forEach(fn=>fn(store.posts));location.assign(store.config.siteUrl||'https://happypite.github.io');}catch(e){alert(e.message);}};
 }
 if(AUTH_SERVER_URL){return()=>{const url=new URL(AUTH_SERVER_URL);if(url.protocol!=='https:')throw Error('로그인 서버 주소를 확인하세요.');location.assign(url.origin+'/auth/login');};}

 const dialog=document.createElement('dialog');dialog.className='owner-login';dialog.innerHTML=`<form><h2>블로그 관리</h2><p>happypite 본인만 글을 작성·수정·삭제할 수 있습니다.</p><label>GitHub 인증 키<input type="password" name="token" required autocomplete="off" spellcheck="false" placeholder="본인 전용 토큰"></label><details><summary>처음 연결하는 방법</summary><ol><li><a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener noreferrer">GitHub 인증 키 만들기 ↗</a>에서 Fine-grained token을 만드세요.</li><li>Resource owner: happypite, Only select repositories: happypite.github.io를 선택하세요.</li><li>Repository permissions의 Contents를 Read and write로 설정하세요. 만료일도 지정하세요.</li><li>발급한 키를 위 입력란에 붙여 넣으세요. 키를 채팅으로 보내지 마세요.</li></ol></details><p class="owner-privacy">키는 GitHub로만 전송되며 이 페이지 메모리에서만 사용합니다. 새로고침하면 다시 연결해야 합니다. 게시한 글은 공개되고 임시 글은 이 브라우저에만 저장됩니다.</p><p role="status" class="owner-status"></p><div><button type="button" data-close>취소</button><button type="submit">본인 인증 후 연결</button></div></form>`;document.body.append(dialog);
 const input=dialog.querySelector('input'),status=dialog.querySelector('[role=status]');dialog.querySelector('[data-close]').onclick=()=>dialog.close();dialog.addEventListener('close',()=>{input.value='';status.textContent='';});
 dialog.querySelector('form').onsubmit=async e=>{e.preventDefault();const button=dialog.querySelector('[type=submit]');button.disabled=true;status.textContent='본인 계정과 글 목록을 확인하고 있습니다…';try{await store.owner.login(input.value);input.value='';const posts=await store.owner.load();store.posts=posts;store.fallback=posts.map(p=>({...p}));store.publicExpected=posts.map(p=>({id:p.id,contentVersion:p.contentVersion}));store.authorTools=true;store.canWrite=true;store.listeners.forEach(fn=>fn(posts));dialog.close();}catch(e){store.owner.logout();input.value='';status.textContent=e.message;}finally{button.disabled=false;}};
 return ()=>{if(store.owner.authenticated){store.owner.logout();store.authorTools=false;store.canWrite=false;store.posts=store.fallback.map(p=>({...p}));store.listeners.forEach(fn=>fn(store.posts));}else{dialog.showModal();input.focus();}};
}
