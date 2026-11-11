import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';

export const categoryIds=['development','ctf-wargame','bug-bounty','documentation','research','activities'];
const categoryLabels=['개발','CTF/Wargame','Bug Bounty','블로그/기술문서','논문/컨퍼런스','공모전/자격증'];
const scalar=value=>{const v=value.trim();if(v.startsWith('"')){try{return JSON.parse(v);}catch{throw Error('따옴표 문자열을 확인해 주세요: '+v);}}if(v.startsWith("'")&&v.endsWith("'"))return v.slice(1,-1).replaceAll("''", "'");if(v==='true')return true;if(v==='false')return false;return v;};
export function parsePost(source,sourcePath){
 const normalized=String(source).replace(/^\uFEFF/,'').replace(/\r\n?/g,'\n'),match=normalized.match(/^---\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
 if(!match)throw Error(sourcePath+': 글 맨 위에 ---로 감싼 제목·카테고리·날짜가 필요합니다.');
 const data={};let arrayKey=null;
 for(const line of match[1].split('\n')){if(!line.trim()||line.trim().startsWith('#'))continue;if(arrayKey&&/^\s+-\s+/.test(line)){data[arrayKey].push(scalar(line.replace(/^\s+-\s+/,'')));continue;}const m=line.match(/^([a-zA-Z][\w-]*):\s*(.*)$/);if(!m)throw Error(sourcePath+': 지원하지 않는 머리말 형식입니다: '+line);const [,key,value]=m;arrayKey=null;if(!value.trim()&&key==='tags'){data.tags=[];arrayKey='tags';}else if(key==='tags'&&value.trim().startsWith('[')){try{data.tags=JSON.parse(value);}catch{const inner=value.trim().slice(1,-1);data.tags=inner?inner.split(',').map(scalar):[];}}else data[key]=scalar(value);}
 if(data.draft===true||data.status==='draft')return null;
 if(data.status!=='published')throw Error(sourcePath+': 게시할 글에는 status: published를 명시해 주세요.');
 const category=categoryIds.includes(data.category)?data.category:categoryIds[categoryLabels.indexOf(data.category)],title=String(data.title||'').trim(),body=match[2].trim(),date=String(data.date||'').trim();
 if(!category)throw Error(sourcePath+': 여섯 카테고리 중 하나를 입력해 주세요.');
 if(!title||title.length>160||!body||body.length>200000)throw Error(sourcePath+': 제목(160자 이내)과 본문(20만 자 이내)을 확인해 주세요.');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date))||new Date(date).toISOString().slice(0,10)!==date)throw Error(sourcePath+': 날짜는 실제 날짜인 YYYY-MM-DD 형식이어야 합니다.');
 if(data.tags!==undefined&&(!Array.isArray(data.tags)||data.tags.some(t=>typeof t!=='string')))throw Error(sourcePath+': tags에는 문자열 목록을 입력해 주세요.');
 let url=String(data.url||'').trim();if(url){const parsed=new URL(url);if(!['https:','http:'].includes(parsed.protocol))throw Error(sourcePath+': 참고 링크는 http 또는 https 주소여야 합니다.');url=parsed.href;}
 const id='gh-'+createHash('sha256').update(sourcePath).digest('hex').slice(0,20),updated=String(data.updated||date);
 if(!/^\d{4}-\d{2}-\d{2}$/.test(updated)||!Number.isFinite(Date.parse(updated))||new Date(updated).toISOString().slice(0,10)!==updated)throw Error(sourcePath+': updated 날짜를 확인해 주세요.');
 if(data.fontSize!==undefined&&![16,18,20,22].includes(Number(data.fontSize)))throw Error(sourcePath+': 본문 글자 크기는 16, 18, 20, 22 중 하나여야 합니다.');
 return {id,fontSize:Number(data.fontSize||18),contentVersion:createHash('sha256').update(normalized).digest('hex'),category,title,summary:String(data.summary||'').trim().slice(0,400),body,tags:[...new Set(data.tags||[])].slice(0,12),date,status:'published',pinned:data.pinned===true,url,sourcePath,createdAt:date+'T00:00:00.000Z',updatedAt:updated+'T00:00:00.000Z'};
}
function walk(dir,fn){if(!fs.existsSync(dir))return;for(const entry of fs.readdirSync(dir,{withFileTypes:true})){if(entry.isSymbolicLink())throw Error('심볼릭 링크는 배포하지 않습니다: '+entry.name);const full=path.join(dir,entry.name);if(entry.isDirectory())walk(full,fn);else fn(full);}}
export function exportMedia(root,output,posts){const base=path.resolve(root,'content/media'),copied=new Set();for(const post of posts)for(const match of post.body.matchAll(/!\[[^\]]*\]\((\/media\/[^\s)]+)\)/g)){let relative;try{relative=decodeURIComponent(match[1].split(/[?#]/)[0].slice(7));}catch{throw Error(post.sourcePath+': 이미지 주소 인코딩을 확인해 주세요.');}const parts=relative.split('/');if(parts.some(p=>!p||p==='.'||p==='..')||relative.includes('\\')||!['.png','.jpg','.jpeg','.webp','.gif','.avif'].includes(path.extname(relative).toLowerCase()))throw Error(post.sourcePath+': media에는 PNG·JPEG·WebP·GIF·AVIF 이미지를 사용해 주세요.');const source=path.resolve(base,relative);if(!source.startsWith(base+path.sep))throw Error('잘못된 이미지 경로입니다.');let at=path.resolve(root);for(const part of ['content','media',...parts]){at=path.join(at,part);if(!fs.existsSync(at))throw Error(post.sourcePath+': 이미지 파일을 찾을 수 없습니다: '+match[1]);if(fs.lstatSync(at).isSymbolicLink())throw Error('이미지 경로에 심볼릭 링크를 사용할 수 없습니다.');}const stat=fs.statSync(source);if(!stat.isFile()||stat.size>10*1024*1024)throw Error(post.sourcePath+': 이미지 파일은 10MB 이하여야 합니다.');if(!copied.has(relative)){const target=path.join(output,'media',relative);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(source,target);copied.add(relative);}}return copied.size;}
export function checkPages(output){
 const missing=[];let checked=0;
 walk(output,file=>{const rel=path.relative(output,file).replaceAll('\\','/'),ext=path.extname(file);if(!['.html','.css','.js'].includes(ext)||rel.endsWith('bug-reference.js')||rel.includes('/vendor/'))return;const text=fs.readFileSync(file,'utf8');let refs=[];
  if(ext==='.html')refs=[...text.matchAll(/(?:src|href)="([^"#]+)"/g)].map(m=>m[1]);
  if(ext==='.css')refs=[...text.matchAll(/url\(\s*['"]?([^'"\s)]+)['"]?\s*\)/g)].map(m=>m[1]);
  if(ext==='.js')refs=[...text.matchAll(/(?:from\s*|import\s*\()\s*['"](\.[^'"]+)['"]/g)].map(m=>m[1]);
  for(const ref of refs){if(/^(?:https?:|data:|mailto:|tel:|blob:|#)/.test(ref))continue;const clean=decodeURIComponent(ref.split(/[?#]/)[0]);if(!clean||clean.startsWith('#'))continue;const target=path.resolve(output,'.'+path.posix.resolve('/'+path.posix.dirname(rel),clean));if(!target.startsWith(path.resolve(output)+path.sep)&&target!==path.resolve(output)){missing.push(rel+' → '+ref);continue;}const final=fs.existsSync(target)&&fs.statSync(target).isDirectory()?path.join(target,'index.html'):target;checked++;if(!fs.existsSync(final))missing.push(rel+' → '+ref);}
 });
 for(const forbidden of ['server','.openai','.local','worker','posts.sqlite'])if(fs.existsSync(path.join(output,forbidden)))missing.push('배포하면 안 되는 파일: '+forbidden);
 if(missing.length)throw Error('Pages 경로 검사 실패:\n'+missing.join('\n'));return checked;
}
export function versionAssets(output){
 const files=[];walk(output,file=>files.push(file));files.sort((a,b)=>path.relative(output,a).replaceAll('\\','/').localeCompare(path.relative(output,b).replaceAll('\\','/'),'en'));
 const hash=createHash('sha256');for(const file of files)hash.update(path.relative(output,file).replaceAll('\\','/')+'\0').update(fs.readFileSync(file)).update('\0');
 const version=hash.digest('hex').slice(0,16);
 const versionURL=ref=>{
  if(/^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(ref))return ref;
  const hashAt=ref.indexOf('#'),fragment=hashAt<0?'':ref.slice(hashAt),address=hashAt<0?ref:ref.slice(0,hashAt),queryAt=address.indexOf('?'),pathname=queryAt<0?address:address.slice(0,queryAt);
  if(!/\.(?:m?js|css)$/i.test(pathname))return ref;
  const query=new URLSearchParams(queryAt<0?'':address.slice(queryAt+1));query.set('v',version);return pathname+'?'+query+fragment;
 };
 for(const file of files){
  const ext=path.extname(file);if(!['.html','.js','.mjs'].includes(ext)||path.relative(output,file).replaceAll('\\','/')==='assets/records.js')continue;
  const source=fs.readFileSync(file,'utf8'),updated=ext==='.html'
   ?source.replace(/(<(?:script|link)\b[^>]*?\b(?:src|href)\s*=\s*)(["'])([^"']+)\2/gi,(match,prefix,quote,ref)=>prefix+quote+versionURL(ref)+quote)
   :source.replace(/(\bfrom\s*|\bimport\s*(?:\(\s*)?)(["'])(\.{1,2}\/[^"'\r\n]+)\2/g,(match,prefix,quote,ref)=>prefix+quote+versionURL(ref)+quote);
  if(updated!==source)fs.writeFileSync(file,updated);
 }
 return version;
}
export function buildPages(projectRoot=process.cwd()){
 const root=fs.realpathSync(projectRoot),output=path.resolve(root,'out/pages'),parent=path.dirname(output),config=JSON.parse(fs.readFileSync(path.join(root,'github-pages.config.json'),'utf8'));
 if(config.siteUrl!=='https://happypite.github.io'||config.repository!=='happypite/happypite.github.io')throw Error('배포 대상은 happypite.github.io로 설정해야 합니다.');
 if(config.contentPath!=='content/posts'||!/^[A-Za-z0-9._/-]+$/.test(config.branch)||config.branch.includes('..'))throw Error('저장소 경로 설정을 확인해 주세요.');
 // The only directory removed is the verified, fixed build output under root.
 if(fs.existsSync(parent)&&(fs.lstatSync(parent).isSymbolicLink()||fs.realpathSync(parent)!==parent))throw Error('빌드 폴더가 다른 경로를 가리킵니다.');
 if(fs.existsSync(output)){if(fs.lstatSync(output).isSymbolicLink()||fs.realpathSync(output)!==output||!output.startsWith(root+path.sep+'out'+path.sep))throw Error('안전하지 않은 빌드 경로입니다.');fs.rmSync(output,{recursive:true});}
 fs.mkdirSync(output,{recursive:true});
 const frontend=fs.existsSync(path.join(root,'web/index.html'))?path.join(root,'web'):path.join(root,'dist');
 for(const name of ['index.html','assets','projects','world','about','portfolio','read','.nojekyll']){const source=path.join(frontend,name);if(!fs.existsSync(source))throw Error('프런트엔드 파일을 찾을 수 없습니다: '+name);fs.cpSync(source,path.join(output,name),{recursive:true,dereference:false});}
 const posts=[];walk(path.join(root,config.contentPath),file=>{if(!file.endsWith('.md')||path.basename(file).startsWith('_'))return;const sourcePath=path.relative(root,file).replaceAll('\\','/'),post=parsePost(fs.readFileSync(file,'utf8'),sourcePath);if(post)posts.push(post);});
 posts.sort((a,b)=>b.date.localeCompare(a.date)||a.title.localeCompare(b.title,'ko'));
 const runtime={mode:'github-pages',repository:config.repository,branch:config.branch,contentPath:config.contentPath,siteUrl:config.siteUrl};
 fs.writeFileSync(path.join(output,'assets/records.js'),'window.ARCHIVE_CONFIG = '+JSON.stringify(runtime)+';\nwindow.ARCHIVE_RECORDS = '+JSON.stringify(posts).replaceAll('<','\\u003c')+';\n');
 fs.writeFileSync(path.join(output,'assets/posts.json'),JSON.stringify({posts}));
 fs.writeFileSync(path.join(output,'404.html'),'<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>happypite</title><link rel="preload" href="/assets/fonts/GowunBatang-Regular.woff2" as="font" type="font/woff2" crossorigin><link rel="preload" href="/assets/fonts/GowunBatang-Bold.woff2" as="font" type="font/woff2" crossorigin><link rel="stylesheet" href="/assets/typography.css"><body style="background:#f1f4ed;color:#36594c;display:grid;place-content:center;min-height:95vh;text-align:center"><h1>페이지를 찾을 수 없습니다.</h1><p>주소를 확인하거나 기록 목록에서 글을 찾아보세요.</p><a href="/projects/">노트 목록으로 ↗</a></body></html>');
 fs.writeFileSync(path.join(output,'robots.txt'),'User-agent: *\nAllow: /\nSitemap: '+config.siteUrl+'/sitemap.xml\n');
 fs.writeFileSync(path.join(output,'sitemap.xml'),'<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+['/','/projects/','/world/','/about/','/portfolio/'].map(p=>'<url><loc>'+config.siteUrl+p+'</loc></url>').join('')+'</urlset>');
 const media=exportMedia(root,output,posts),version=versionAssets(output),references=checkPages(output);return {output,posts:posts.length,references,media,version};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){const result=buildPages();console.log('GitHub Pages: '+result.output+' · '+result.posts+' posts · '+result.references+' local paths checked');}
