import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
const source=fs.readFileSync(new URL('../web/assets/experience.js',import.meta.url),'utf8');
function topicUI(traveling){
 const classes=new Set(traveling?['traveling','depth-travel']:[]),opened=[],pages=[];
 const context=vm.createContext({busy:true,suppressClick:false,navId:1,page:'projects',motion:false,menu:false,dialogReturnFocus:null,locationRestorer:{cancel(){}},engine:{transition:{},setPage:p=>pages.push(p),resume(){}},fillTopic:id=>opened.push(id),dialog:{open:false,showModal(){this.open=true;}},document:{activeElement:null,body:{classList:{contains:v=>classes.has(v),remove:(...v)=>v.forEach(x=>classes.delete(x)),add:v=>classes.add(v)}},documentElement:{style:{setProperty(){}}}}});
 vm.runInContext(source.match(/^function interruptTravel\(\).*$/m)[0]+'\n'+source.match(/^async function openTopic\(.*$/m)[0],context);
 return {context,classes,opened,pages};
}
test('the first read click after a page becomes visible completes travel and opens the reader',async()=>{
 const {context,classes,pages,opened}=topicUI(true);assert.equal(await context.openTopic('all'),true);assert.equal(context.dialog.open,true);assert.equal(context.busy,false);assert.equal(context.engine.transition,null);assert.deepEqual(pages,['projects']);assert.deepEqual(opened,['all']);assert.ok(!classes.has('traveling'));
});
test('interrupting visual travel does not bypass a different busy operation',async()=>{
 const {context,opened}=topicUI(false);assert.equal(await context.openTopic('all'),false);assert.equal(context.dialog.open,false);assert.equal(context.busy,true);assert.deepEqual(opened,[]);
});
function keyboard(overflow='auto'){
 let keydown;const context=vm.createContext({scroller:{scrollHeight:2000,clientHeight:400,addEventListener:(name,fn)=>{assert.equal(name,'keydown');keydown=fn;}},getComputedStyle:()=>({overflowY:overflow}),innerHeight:800,targetScroll:0,smooth:false,resetScroll(){throw Error('input must retain Home');},clamp:(v,min,max)=>Math.min(max,Math.max(min,v))});
 vm.runInContext(source.slice(source.indexOf("scroller.addEventListener('keydown'"),source.indexOf('const worldEl=')),context);return {keydown,context};
}
test('search inputs retain Space, Home and cursor keys instead of triggering list scrolling',()=>{
 const {keydown}=keyboard();for(const key of [' ','Home','ArrowDown']){let prevented=false;keydown({key,target:{closest:s=>s.includes('input')?{}:null},preventDefault:()=>prevented=true});assert.equal(prevented,false,key);}
});
test('list paging stays available in tall windows and native in short document layouts',()=>{
 for(const overflow of ['auto','visible']){const {keydown,context}=keyboard(overflow);let prevented=false;keydown({key:'PageDown',target:{closest:()=>null},preventDefault:()=>prevented=true});assert.equal(prevented,overflow==='auto');assert.equal(context.targetScroll>0,overflow==='auto');}
});
