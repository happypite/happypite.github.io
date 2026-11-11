import test from 'node:test';
import assert from 'node:assert/strict';
import {Observatory} from '../web/assets/observatory.js';

function browser(t){
 const frames=[],classes=new Set(),previous={document:globalThis.document,requestAnimationFrame:globalThis.requestAnimationFrame};
 globalThis.document={hidden:false,body:{classList:{contains:name=>classes.has(name),add:(...names)=>names.forEach(name=>classes.add(name)),remove:(...names)=>names.forEach(name=>classes.delete(name))}}};
 globalThis.requestAnimationFrame=callback=>frames.push(callback);
 t.after(()=>{for(const [name,value] of Object.entries(previous)){if(value===undefined)delete globalThis[name];else globalThis[name]=value;}});
 return {frames,classes};
}

function scenes(){
 const builds=[],compiles=[],camera=()=>({position:{set(){}},lookAt(){},updateMatrixWorld(){}});
 const engine=Object.assign(Object.create(Observatory.prototype),{
  readyPages:new Set(),preparingPages:new Map(),w:1280,home:null,world:null,
  camera:camera(),worldCamera:camera(),postScene:{name:'post'},postCamera:camera(),
  homeScene(){builds.push('home');this.pavilion={ripples:{scene:{name:'ripples'},camera:camera()}};return {name:'home'};},
  worldScene(){builds.push('world');return {name:'world'};},
  renderer:{compileAsync:async(scene)=>compiles.push(scene.name)}
 });
 return {engine,builds,compiles};
}

test('reading and portfolio routes neither prepare scenes nor render hidden frames',t=>{
 const {frames}=browser(t);
 let binds=0;
 const engine=Object.assign(Object.create(Observatory.prototype),{
  page:'home',readyPages:new Set(['home','world']),last:0,transition:null,
  bindTiles(){binds++;},preparePage(){assert.fail('a static route must not prepare a scene');},
  renderBase(){assert.fail('a static route must not render a hidden background');},
  renderer:{render(){assert.fail('a static route must not render a post-processing pass');}}
 });
 for(const page of ['projects','about']){
  engine.setPage(page);engine.frame(100);engine.frame(116);
  assert.equal(engine.page,page);
 }
 assert.equal(binds,2);assert.equal(frames.length,4);
});

test('concurrent WORLD preparation builds only WORLD once and waits for compilation',async t=>{
 const {frames}=browser(t),{engine,builds,compiles}=scenes();
 let finishCompile;
 engine.renderer.compileAsync=scene=>{compiles.push(scene.name);return scene.name==='world'?new Promise(resolve=>{finishCompile=resolve;}):Promise.resolve();};
 const first=engine.preparePage('world'),second=engine.preparePage('world');
 assert.equal(first,second);assert.deepEqual(builds,[]);
 assert.equal(engine.readyPages.has('world'),false);assert.equal(frames.length,1);
 frames.shift()();await Promise.resolve();
 assert.equal(engine.readyPages.has('world'),false);
 assert.deepEqual(compiles,['world']);assert.equal(engine.preparingPages.get('world'),first);
 finishCompile();await first;
 assert.deepEqual(builds,['world']);assert.deepEqual(compiles,['world','post']);
 assert.equal(engine.home,null);assert.equal(engine.readyPages.has('world'),true);
 assert.equal(engine.preparingPages.size,0);
 await engine.preparePage('world');assert.deepEqual(builds,['world']);assert.equal(frames.length,0);
});

test('home preparation warms its water shader without building the category scene',async t=>{
 const {frames}=browser(t),{engine,builds,compiles}=scenes();
 const pending=engine.preparePage('home');
 frames.shift()();await pending;
 assert.deepEqual(builds,['home']);assert.deepEqual(compiles,['home','ripples','post']);
 assert.equal(engine.world,null);assert.equal(engine.readyPages.has('home'),true);
 assert.equal(engine.readyPages.has('world'),false);
});

test('failed category artwork can be retried and concurrent callers share the retry',async t=>{
 const {classes}=browser(t);let attempts=0;
 const engine=Object.assign(Object.create(Observatory.prototype),{
  page:'world',
  async createTextures(){if(++attempts===1)throw Error('temporary image failure');return ['decoded texture'];}
 });
 const failed=engine.loadTextures();assert.equal(engine.loadTextures(),failed);
 await assert.rejects(failed,/temporary image failure/);
 assert.equal(engine.texturePromise,null);assert.ok(classes.has('gpu-fallback'));
 const retry=engine.loadTextures();assert.equal(engine.loadTextures(),retry);
 assert.deepEqual(await retry,['decoded texture']);assert.equal(attempts,2);
 assert.equal(engine.loadTextures(),retry);
});

test('failed scene compilation propagates to artwork loading instead of hiding fallback cards',async t=>{
 const {frames,classes}=browser(t),{engine}=scenes();
 engine.page='world';engine.renderer.compileAsync=async()=>{throw Error('compile unavailable');};
 const pending=engine.loadTextures();
 frames.shift()();await assert.rejects(pending,/compile unavailable/);
 assert.equal(engine.readyPages.has('world'),false);assert.equal(engine.texturePromise,null);
 assert.equal(engine.artworkFailed,true);assert.ok(classes.has('gpu-fallback'));
 assert.equal(classes.has('gpu-ready'),false);
});

test('a failed home scene retries compilation and replaces the fallback only after success',async t=>{
 const {frames,classes}=browser(t),{engine,builds}=scenes();
 t.mock.method(console,'error',()=>{});
 engine.renderer.compileAsync=async()=>{throw Error('temporary compile failure');};
 engine.setPage('home');
 const failed=engine.preparingPages.get('home');
 frames.shift()();await assert.rejects(failed,/temporary compile failure/);
 await Promise.resolve();
 assert.ok(classes.has('gpu-fallback'));assert.equal(engine.readyPages.has('home'),false);
 assert.equal(engine.preparingPages.size,0);
 engine.renderer.compileAsync=async()=>{};
 engine.setPage('home');
 const retry=engine.preparingPages.get('home');
 assert.ok(classes.has('gpu-fallback'));
 frames.shift()();await retry;await Promise.resolve();
 assert.equal(engine.readyPages.has('home'),true);assert.equal(classes.has('gpu-fallback'),false);
 assert.deepEqual(builds,['home']);
});

test('a ready WORLD scene does not clear the fallback for failed artwork',async t=>{
 const {classes}=browser(t),{engine}=scenes();
 engine.readyPages.add('world');engine.artworkFailed=true;classes.add('gpu-fallback');
 engine.setPage('world');await Promise.resolve();
 assert.ok(classes.has('gpu-fallback'));
});
