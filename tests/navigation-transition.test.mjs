import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync(new URL('../web/assets/experience.js',import.meta.url),'utf8');
const flush=async()=>{await Promise.resolve();await Promise.resolve();};

function navigationUI(){
 const classes=new Set(),timers=[],frames=[],history=[],properties=new Map();
 const context=vm.createContext({
  busy:false,navId:0,page:'home',engine:null,motion:true,menu:false,
  innerWidth:1280,innerHeight:800,notes:{sequence:0},
  locationRestorer:{cancel(){}},dialog:{open:false},
  pathFor:page=>page==='home'?'/':`/${page}/`,
  history:{pushState:(_state,_title,url)=>history.push(url)},
  wait:ms=>new Promise(resolve=>timers.push({ms,resolve})),
  requestAnimationFrame:callback=>frames.push(callback),
  scheduleGraphics(){},toggleMenu(){},
  document:{
   body:{classList:{contains:value=>classes.has(value),add:(...values)=>values.forEach(value=>classes.add(value)),remove:(...values)=>values.forEach(value=>classes.delete(value))}},
   documentElement:{style:{setProperty:(name,value)=>properties.set(name,value)}}
  }
 });
 context.showPage=page=>{context.page=page;};
 const cancel=source.match(/cancelNavigation:\(\)=>\{([\s\S]*?)\},closeReader:/)[1];
 vm.runInContext(source.match(/^function interruptTravel\(\).*$/m)[0]+'\n'+source.match(/^async function navigate\(.*$/m)[0]+'\nfunction restoreHistory(){'+cancel+'}',context);
 return {context,classes,timers,frames,history,properties};
}

test('browser Back during a route fade restores a visible, interactive page',async()=>{
 const {context,classes,timers,history,properties}=navigationUI();
 const pending=context.navigate('projects');
 assert.ok(classes.has('route-fade-out'));
 context.restoreHistory();context.showPage('home');
 timers.shift().resolve();await pending;
 assert.equal(context.page,'home');assert.equal(context.busy,false);
 assert.equal(classes.has('route-fade-out'),false);
 assert.equal(classes.has('route-transition'),false);
 assert.equal(properties.get('--travel'),0);assert.deepEqual(history,[]);
});

test('a cancelled animation frame cannot remove the next navigation fade',async()=>{
 const {context,classes,timers,frames,history}=navigationUI();
 const first=context.navigate('projects');
 timers.shift().resolve();await flush();
 assert.equal(context.page,'projects');assert.equal(frames.length,1);
 const second=context.navigate('about');
 frames.shift()();await flush();await first;
 assert.ok(classes.has('route-fade-out'),'the newer route must retain its own fade');
 assert.equal(context.busy,true);
 timers.shift().resolve();await flush();
 frames.shift()();await flush();
 timers.shift().resolve();await second;
 assert.equal(context.page,'about');assert.equal(context.busy,false);
 assert.equal(classes.size,0);assert.deepEqual(history,['/projects/','/about/']);
});

test('rapid navigation before the first swap only visits the final destination',async()=>{
 const {context,classes,timers,frames,history}=navigationUI();
 const first=context.navigate('projects');
 const second=context.navigate('about');
 timers.shift().resolve();await first;
 assert.equal(context.page,'home');assert.ok(classes.has('route-fade-out'));
 timers.shift().resolve();await flush();
 frames.shift()();await flush();
 timers.shift().resolve();await second;
 assert.equal(context.page,'about');assert.equal(context.busy,false);
 assert.equal(classes.size,0);assert.deepEqual(history,['/about/']);
});
