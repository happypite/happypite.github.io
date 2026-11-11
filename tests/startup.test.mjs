import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
import {afterInitialPaint} from '../web/assets/startup.js';
import {BUG_REFERENCE,embedSymbolImages} from '../web/assets/bug-reference.js';
import vm from 'node:vm';
const assets=new URL('../web/assets/',import.meta.url);
test('initial fonts and static module imports stay within their first-screen budgets',()=>{
 const faces=JSON.parse(fs.readFileSync(new URL('font-subsets.json',assets),'utf8'));
 const fontBytes=faces.reduce((sum,face)=>sum+fs.statSync(new URL('fonts/'+face.file,assets)).size,0);
 assert.ok(fontBytes<160000);assert.equal(faces.length,3);
 const visited=new Set();let moduleBytes=0;
 function visit(file){if(visited.has(file))return;visited.add(file);const source=fs.readFileSync(file,'utf8');moduleBytes+=Buffer.byteLength(source);for(const match of source.matchAll(/^import\s+.*?from\s+['"]([^'"]+)['"]/gm))if(match[1].startsWith('.'))visit(path.resolve(path.dirname(file),match[1]));}
 visit(fileURLToPath(new URL('experience.js',assets)));
 assert.ok(moduleBytes<200000,'home static modules must not carry binary art or the 3D engine');
 assert.ok(![...visited].some(file=>file.includes('three.module')));
 const home=fs.readFileSync(new URL('../web/index.html',import.meta.url),'utf8');
 for(const face of faces)assert.ok(home.includes('/assets/fonts/'+face.file));
 assert.ok(!/rel="preload"[^>]+(?:GowunBatang-Regular|GowunBatang-Bold|PretendardVariable)\.woff2/.test(home));
});
test('3D startup waits for two paint opportunities and then idle time',()=>{
 const frames=[],idle=[];let starts=0;
 afterInitialPaint(()=>starts++,{requestAnimationFrame:fn=>frames.push(fn),requestIdleCallback:(fn,options)=>{assert.equal(options.timeout,800);idle.push(fn);}});
 assert.equal(starts,0);frames.shift()();assert.equal(starts,0);frames.shift()();assert.equal(starts,0);idle.shift()();assert.equal(starts,1);
 const fallback=[];afterInitialPaint(()=>starts++,{requestAnimationFrame:fn=>fn(),setTimeout:fn=>fallback.push(fn)});assert.equal(starts,1);fallback.shift()();assert.equal(starts,2);
});
test('a 3D engine that starts during navigation follows the visible destination',()=>{
 const source=fs.readFileSync(new URL('../web/assets/experience.js',import.meta.url),'utf8');
 const pages=[],context=vm.createContext({page:'home',document:{body:{dataset:{},classList:{remove(){}}},querySelectorAll:()=>[],title:''},engine:{setPage:p=>pages.push(p),bindTiles(){}},catalog:{syncFromURL(){}},resetScroll(){}});
 vm.runInContext(source.match(/^function showPage\(.*$/m)[0],context);
 context.showPage('projects',false);
 assert.equal(context.document.body.dataset.page,'projects');assert.deepEqual(pages,['projects']);
});
test('deferred artwork retries failures and embeds exactly the original PNG bytes once',async()=>{
 const svg='<image href="'+BUG_REFERENCE+'"/>';
 await assert.rejects(embedSymbolImages(svg,async()=>new Response('',{status:404})),/unavailable/);
 const original=Uint8Array.from([137,80,78,71,13,10,26,10,1,2,3]);let calls=0;
 const fetcher=async()=>{calls++;return new Response(original);};
 const [first,second]=await Promise.all([embedSymbolImages(svg,fetcher),embedSymbolImages(svg,fetcher)]);
 assert.equal(calls,1);assert.equal(first,second);
 assert.deepEqual(Buffer.from(first.match(/base64,([^"']+)/)[1],'base64'),Buffer.from(original));
 assert.equal(await embedSymbolImages('<svg/>',()=>{throw Error('unrelated symbols need no image request');}),'<svg/>');
});
