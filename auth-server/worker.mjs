// GitHub secrets belong only in Worker secrets, never in the Pages bundle.
export const OWNER_ID=205749646;
export const REPOSITORY='happypite/happypite.github.io';
export const PUBLIC_ORIGIN='https://happypite.github.io';
const ROOT='/repos/'+REPOSITORY, SESSION='__Host-happypite_session', FLOW='__Host-happypite_oauth';
const AGE=7*24*60*60*1000, enc=new TextEncoder(), dec=new TextDecoder();
const b64=bytes=>btoa(Array.from(bytes,b=>String.fromCharCode(b)).join('')).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');
const unb64=s=>Uint8Array.from(atob(s.replaceAll('-','+').replaceAll('_','/')),c=>c.charCodeAt(0));
const random=()=>b64(crypto.getRandomValues(new Uint8Array(32)));
export const digest=async s=>b64(new Uint8Array(await crypto.subtle.digest('SHA-256',enc.encode(s))));
async function aes(secret){return crypto.subtle.importKey('raw',await crypto.subtle.digest('SHA-256',enc.encode(secret)),{name:'AES-GCM'},false,['encrypt','decrypt']);}
export async function seal(value,secret,context){const iv=crypto.getRandomValues(new Uint8Array(12)),data=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:enc.encode(context)},await aes(secret),enc.encode(JSON.stringify(value)));return b64(iv)+'.'+b64(new Uint8Array(data));}
export async function unseal(value,secret,context){const [iv,data]=value.split('.');return JSON.parse(dec.decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:unb64(iv),additionalData:enc.encode(context)},await aes(secret),unb64(data))));}
const eq=(a,b)=>{if(typeof a!=='string'||typeof b!=='string'||a.length!==b.length)return false;let v=0;for(let i=0;i<a.length;i++)v|=a.charCodeAt(i)^b.charCodeAt(i);return v===0;};
const cookie=(name,value,seconds)=>name+'='+value+'; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age='+Math.max(0,Math.floor(seconds));
function cookies(req){return Object.fromEntries((req.headers.get('Cookie')||'').split(';').map(s=>s.trim().split(/=(.*)/s)).filter(p=>p[0]));}
const headers={'Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY','Cross-Origin-Resource-Policy':'same-origin'};
function json(data,status=200,extra={}){return new Response(JSON.stringify(data),{status,headers:{...headers,'Content-Type':'application/json; charset=utf-8',...extra}});}
function redirect(path,cookieValues=[]){const h=new Headers({...headers,Location:path});for(const c of cookieValues)h.append('Set-Cookie',c);return new Response(null,{status:303,headers:h});}
function page(title,text,status=200){const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));return new Response('<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+escape(title)+'</title><body style="font:16px/1.8 system-ui;background:#f3f6ee;color:#284b37;max-width:620px;margin:12vh auto;padding:24px"><h1>'+escape(title)+'</h1><p>'+escape(text)+'</p><a href="/auth/login">GitHub로 다시 로그인</a><p><a href="'+PUBLIC_ORIGIN+'">공개 블로그로 돌아가기</a></p></body></html>',{status,headers:{...headers,'Content-Type':'text/html; charset=utf-8','Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'; base-uri 'none'"}});}
class State{
 constructor(env,now){this.env=env;this.now=now;this.db=env.AUTH_DB.withSession?env.AUTH_DB.withSession('first-primary'):env.AUTH_DB;}
 async put(key,value,expires){await this.db.prepare('INSERT OR REPLACE INTO auth_state(key,sealed,expires) VALUES(?,?,?)').bind(key,await seal(value,this.env.SESSION_KEY,key),expires).run();}
 async read(key,consume=false){const sql=consume?'DELETE FROM auth_state WHERE key=? RETURNING sealed,expires':'SELECT sealed,expires FROM auth_state WHERE key=?';const row=await this.db.prepare(sql).bind(key).first();if(!row)return null;if(row.expires<=this.now()){await this.remove(key);return null;}try{return await unseal(row.sealed,this.env.SESSION_KEY,key);}catch{await this.remove(key);return null;}}
 async lock(key){await this.db.prepare('DELETE FROM auth_state WHERE key=? AND expires<=?').bind(key,this.now()).run();const r=await this.db.prepare("INSERT OR IGNORE INTO auth_state(key,sealed,expires) VALUES (?,'refresh-lock',?)").bind(key,this.now()+15000).run();return r.meta.changes===1;}
 async rate(key,limit){const bucket=Math.floor(this.now()/600000),id=await digest(this.env.SESSION_KEY+'\n'+key+'\n'+bucket);const row=await this.db.prepare('INSERT INTO auth_rate(key,hits,expires) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET hits=hits+1 RETURNING hits').bind(id,(bucket+1)*600000).first();return row.hits<=limit;}
 async cleanup(){await this.db.prepare('DELETE FROM auth_state WHERE expires<=?').bind(this.now()).run();await this.db.prepare('DELETE FROM auth_rate WHERE expires<=?').bind(this.now()).run();}
 async remove(key){await this.db.prepare('DELETE FROM auth_state WHERE key=?').bind(key).run();}
}
function ready(env){try{return !!env.AUTH_DB&&env.SESSION_KEY?.length>=43&&!!env.GITHUB_CLIENT_ID&&!!env.GITHUB_CLIENT_SECRET&&new URL(env.AUTH_ORIGIN).protocol==='https:'&&!env.AUTH_ORIGIN.includes('REPLACE');}catch{return false;}}
export function allowedGitHubRequest(path,method,body){
 if(typeof path!=='string'||path.length>1500||path.includes('#')||path.includes('\\'))return false;
 let url;try{url=new URL(path,'https://api.github.com');}catch{return false;}
 if(url.origin!=='https://api.github.com'||!path.startsWith(ROOT+'/'))return false;
 if(method==='GET'&&path===ROOT+'/git/trees/main?recursive=1')return true;
 let pathname;try{pathname=decodeURIComponent(url.pathname);}catch{return false;}
 const prefix=ROOT+'/contents/content/posts/';if(!pathname.startsWith(prefix))return false;
 const parts=pathname.slice(prefix.length).split('/');if(parts.some(p=>!p||p==='.'||p==='..'||p.includes('\\')||p.includes('%')||/[\u0000-\u001f]/.test(p))||!parts.at(-1).endsWith('.md'))return false;
 // Only the configured branch and post files are reachable, never workflow/source/secrets APIs.
 if(method==='GET')return url.search==='?ref=main';
 if(!['PUT','DELETE'].includes(method)||url.search||!body||body.branch!=='main'||typeof body.message!=='string'||body.message.length>220)return false;
 if(body.sha!==undefined&&!/^[0-9a-f]{40,64}$/.test(body.sha))return false;
 if(method==='DELETE')return !!body.sha;
 if(typeof body.content!=='string'||body.content.length>600000||!/^[A-Za-z0-9+/]*={0,2}$/.test(body.content))return false;
 return true;
}
export function createHandler({fetcher=(input,init)=>fetch(input,init),now=()=>Date.now()}={}){
 async function strictFetch(input,options={}){const r=await fetcher(input,{...options,redirect:'manual'});if(r.status>=300&&r.status<400)throw Error('외부 서비스의 예상하지 못한 주소 이동을 차단했습니다.');return r;}
 async function gh(path,token,options={}){const r=await strictFetch('https://api.github.com'+path,{...options,headers:{Accept:'application/vnd.github+json','User-Agent':'happypite-admin','X-GitHub-Api-Version':'2026-03-10',Authorization:'Bearer '+token,...(options.body?{'Content-Type':'application/json'}:{})}});return r;}
 async function tokenRequest(env,values){const r=await strictFetch('https://github.com/login/oauth/access_token',{method:'POST',headers:{Accept:'application/json','Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:env.GITHUB_CLIENT_ID,client_secret:env.GITHUB_CLIENT_SECRET,...values})});const data=await r.json();if(!r.ok||data.error||!data.access_token||!Number.isFinite(Number(data.expires_in)))throw Error('GitHub 인증이 만료되었거나 거절되었습니다.');return data;}
 async function validateOwner(token){const u=await gh('/user',token);if(!u.ok)throw Error('GitHub 계정을 확인하지 못했습니다.');const user=await u.json();if(user.id!==OWNER_ID)throw Error('happypite 본인 계정만 관리할 수 있습니다.');return user;}
 async function validateRepository(token){const r=await gh(ROOT,token);if(!r.ok)throw Error('앱에 happypite.github.io 저장소 접근을 허용해 주세요.');const repo=await r.json();if(repo.id!==1436415253||!repo.permissions?.push)throw Error('저장소 쓰기 권한이 필요합니다.');}
 function tokenFields(data){return {accessToken:data.access_token,refreshToken:data.refresh_token||'',accessUntil:now()+Number(data.expires_in)*1000};}
 async function session(req,env,state){const id=cookies(req)[SESSION];if(!/^[A-Za-z0-9_-]{43}$/.test(id||''))return null;const key='session:'+await digest(id);let s=await state.read(key);if(!s||s.ownerId!==OWNER_ID||s.until<=now())return null;
  if(s.accessUntil<=now()+60000){if(!s.refreshToken){await state.remove(key);return null;}const lock='refresh:'+key;if(!await state.lock(lock)){for(let i=0;i<30;i++){await new Promise(resolve=>setTimeout(resolve,100));const current=await state.read(key);if(!current)return null;if(current.accessUntil>now()+60000)return {key,value:current};}throw Error('로그인 갱신 중입니다. 다시 시도해 주세요.');}try{const data=await tokenRequest(env,{grant_type:'refresh_token',refresh_token:s.refreshToken});await validateOwner(data.access_token);s={...s,...tokenFields(data)};await state.put(key,s,s.until);}catch{await state.remove(key);return null;}finally{await state.remove(lock);}}return {key,value:s};
 }
 return async function handler(req,env){
  const url=new URL(req.url);if(url.pathname==='/health'&&req.method==='GET')return json({service:'happypite-admin',configured:ready(env)});
  if(!ready(env))return page('관리자 로그인 연결 준비 중','아직 서버 비밀 설정과 GitHub 앱 연결이 완료되지 않았습니다. 공개 블로그는 계속 이용할 수 있습니다.',503);
  if(url.origin!==env.AUTH_ORIGIN)return json({error:'허용되지 않은 서버 주소입니다.'},403);
  const state=new State(env,now);
  try{
   if(url.pathname==='/auth/login'&&req.method==='GET'){
    if(!await state.rate('login:'+(req.headers.get('CF-Connecting-IP')||'unknown'),12))return json({error:'로그인 요청이 많습니다. 잠시 후 다시 시도해 주세요.'},429);await state.cleanup();if(await session(req,env,state))return redirect('/projects/');
    const nonce=random(),verifier=random();await state.put('oauth:'+await digest(nonce),{verifier},now()+600000);
    const auth=new URL('https://github.com/login/oauth/authorize');auth.search=new URLSearchParams({client_id:env.GITHUB_CLIENT_ID,redirect_uri:env.AUTH_ORIGIN+'/auth/callback',state:nonce,code_challenge:await digest(verifier),code_challenge_method:'S256',login:'happypite',allow_signup:'false',scope:'offline_access'}).toString();
    return redirect(auth.href,[cookie(FLOW,nonce,600)]);
   }
   if(url.pathname==='/auth/callback'&&req.method==='GET'){
    if(!await state.rate('callback:'+(req.headers.get('CF-Connecting-IP')||'unknown'),24))return json({error:'로그인 요청이 많습니다.'},429);
    const nonce=url.searchParams.get('state'),code=url.searchParams.get('code');const clear=cookie(FLOW,'',0);
    if(!/^[A-Za-z0-9_-]{43}$/.test(nonce||'')||!eq(nonce,cookies(req)[FLOW])||!code||code.length>1000){const r=page('로그인을 다시 시작해 주세요','로그인 요청의 유효성을 확인하지 못했습니다.',400);r.headers.append('Set-Cookie',clear);return r;}
    const flow=await state.read('oauth:'+await digest(nonce),true);if(!flow)return page('만료된 로그인 요청','관리자 로그인을 다시 눌러 주세요.',400);
    try{const data=await tokenRequest(env,{code,code_verifier:flow.verifier,redirect_uri:env.AUTH_ORIGIN+'/auth/callback',repository_id:'1436415253'});await validateOwner(data.access_token);await validateRepository(data.access_token);
     const id=random(),until=now()+Math.min(AGE,data.refresh_token?AGE:Number(data.expires_in)*1000);await state.put('session:'+await digest(id),{ownerId:OWNER_ID,until,...tokenFields(data)},until);
     return redirect('/projects/',[clear,cookie(SESSION,id,(until-now())/1000)]);
    }catch(e){const r=page('관리자 로그인 실패',e.message,403);r.headers.append('Set-Cookie',clear);return r;}
   }
   if(url.pathname==='/api/session'&&req.method==='GET'){const s=await session(req,env,state);return json({authenticated:!!s,...(s?{login:'happypite',expiresAt:s.value.until}:{})});}
   if(url.pathname==='/auth/logout'&&req.method==='POST'){
    if(req.headers.get('Origin')!==env.AUTH_ORIGIN||req.headers.get('X-Happypite-Request')!=='1')return json({error:'허용되지 않은 요청입니다.'},403);
    const id=cookies(req)[SESSION];if(/^[A-Za-z0-9_-]{43}$/.test(id||''))await state.remove('session:'+await digest(id));return json({authenticated:false},200,{'Set-Cookie':cookie(SESSION,'',0)});
   }
   if(url.pathname==='/api/github'&&req.method==='POST'){
    if(req.headers.get('Origin')!==env.AUTH_ORIGIN||req.headers.get('X-Happypite-Request')!=='1'||!req.headers.get('Content-Type')?.startsWith('application/json'))return json({error:'허용되지 않은 변경 요청입니다.'},403);
    const s=await session(req,env,state);if(!s)return json({error:'GitHub 로그인이 필요합니다.'},401);
    if(!await state.rate('api:'+s.key,500))return json({error:'요청이 많습니다. 잠시 후 다시 시도해 주세요.'},429);
    const text=await req.text();if(text.length>700000)return json({error:'요청이 너무 큽니다.'},413);let input;try{input=JSON.parse(text);}catch{return json({error:'잘못된 요청입니다.'},400);}
    const {path,method='GET',body}=input;if(!allowedGitHubRequest(path,method,body))return json({error:'이 저장소의 학습 노트만 관리할 수 있습니다.'},403);
    // Revalidate the actual GitHub account for every write, not just the client UI.
    if(method!=='GET')await validateOwner(s.value.accessToken);
    const payload=body&&{message:body.message,branch:'main',...(body.sha?{sha:body.sha}:{}),...(method==='PUT'?{content:body.content}:{})};const r=await gh(path,s.value.accessToken,{method,...(method==='GET'?{}:{body:JSON.stringify(payload)})});
    if(r.status===401){await state.remove(s.key);return json({error:'GitHub 로그인이 만료되었습니다.'},401);}
    if(!r.ok)return json({error:r.status===409||r.status===422?'다른 곳에서 글이 변경되었습니다. 최신 글을 다시 열어 주세요.':'GitHub 저장소 요청을 처리하지 못했습니다.'},r.status);
    if(r.status===204)return new Response(null,{status:204,headers});return json(await r.json());
   }
   if(url.pathname.startsWith('/auth/')||url.pathname.startsWith('/api/'))return json({error:'지원하지 않는 요청입니다.'},404);
   if(!['GET','HEAD'].includes(req.method))return json({error:'지원하지 않는 요청입니다.'},405);
   const asset=url.pathname.startsWith('/assets/')||['/favicon.ico','/favicon.svg'].includes(url.pathname);
   if(!asset&&!await session(req,env,state))return redirect('/auth/login');
   if(!asset&&!['/','/projects/','/world/','/about/','/admin/'].includes(url.pathname))return json({error:'페이지를 찾을 수 없습니다.'},404);
   const publicURL=new URL(url.pathname==='/admin/'?'/projects/':url.pathname,PUBLIC_ORIGIN);publicURL.search=url.search;
   const upstream=await strictFetch(publicURL.href,{method:req.method,headers:{Accept:req.headers.get('Accept')||'*/*'}});
   if(req.method==='HEAD')return new Response(null,{status:upstream.status,headers:{...headers,'Content-Type':upstream.headers.get('Content-Type')||'application/octet-stream'}});
   const h=new Headers(headers);h.set('Content-Type',upstream.headers.get('Content-Type')||'application/octet-stream');h.set('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self'; connect-src 'self'; frame-src 'self' about:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'");
   if(url.pathname==='/assets/records.js'){const script=await upstream.text();return new Response(script+'\nObject.assign(window.ARCHIVE_CONFIG,{authMode:"server",authServerUrl:'+JSON.stringify(env.AUTH_ORIGIN)+'});\n',{status:upstream.status,headers:h});}
   return new Response(upstream.body,{status:upstream.status,headers:h});
  }catch{return json({error:'관리자 요청을 처리하지 못했습니다. 잠시 후 다시 로그인해 주세요.'},503);}
 };
}
export default {fetch:createHandler()};
