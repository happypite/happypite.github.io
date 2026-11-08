export const localDay=(date=new Date())=>new Date(date.getTime()-date.getTimezoneOffset()*60000).toISOString().slice(0,10);
const allowedPath=value=>typeof value==='string'&&value.length<500&&!value.startsWith('/')&&!value.includes('\\')&&!value.split('/').some(s=>!s||s==='.'||s==='..');
export function githubFileURL(config,action,post,category='development'){
 const repository=config.repository,branch=config.branch||'main',folder=config.contentPath||'content/posts';
 if(!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository)||!allowedPath(branch)||!allowedPath(folder))throw Error('GitHub 저장소 설정을 확인해 주세요.');
 const encodePath=p=>p.split('/').map(encodeURIComponent).join('/'),root='https://github.com/'+repository;
 if(action==='edit'||action==='delete'){if(!allowedPath(post?.sourcePath)||!post.sourcePath.startsWith(folder+'/')||!post.sourcePath.endsWith('.md'))throw Error('이 글의 Markdown 파일을 찾을 수 없습니다.');return root+'/'+action+'/'+encodeURIComponent(branch)+'/'+encodePath(post.sourcePath);}
 const stamp=new Date().toTimeString().slice(0,8).replaceAll(':',''),filename=localDay()+'-'+stamp+'-note.md';
 const content='---\ntitle: "새 학습 노트"\ncategory: '+category+'\ndate: '+localDay()+'\nsummary: "배운 내용과 실습 과정을 정리합니다."\ntags: ["Study"]\nstatus: published\n---\n\n## 학습 목표\n\n\n## 핵심 개념\n\n\n## 실습과 확인\n\n```\n실습 코드나 명령어\n```\n\n## 배운 점\n\n- \n\n## 참고 자료\n\n';
 return root+'/new/'+encodeURIComponent(branch)+'/'+encodePath(folder)+'?'+new URLSearchParams({filename,value:content});
}
