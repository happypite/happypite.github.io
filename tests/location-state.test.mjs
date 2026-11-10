import test from 'node:test';
import assert from 'node:assert/strict';
import {createLocationRestorer,locationState} from '../web/assets/location-state.js';

const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve};};
function setup(){
 let href='https://happypite.github.io/projects/?note=gh-note';const calls=[];
 const adapter={readURL:()=>href,cancelNavigation:()=>calls.push('cancel'),closeReader:async()=>calls.push('close'),showPage:page=>calls.push(page),enter:()=>calls.push('enter'),ready:Promise.resolve(),openNote:async id=>calls.push(id)};
 return {calls,adapter,setURL:value=>href=value};
}

test('Back/Forward restores the note addressed by the destination URL',async()=>{
 const {calls,adapter,setURL}=setup(),restorer=createLocationRestorer(adapter);
 assert.equal(await restorer.restore(),true);assert.deepEqual(calls,['cancel','close','projects','enter','gh-note']);
 calls.length=0;setURL('https://happypite.github.io/');await restorer.restore();assert.deepEqual(calls,['cancel','close','home']);
 calls.length=0;setURL('https://happypite.github.io/projects/?note=gh-note');await restorer.restore();assert.equal(calls.at(-1),'gh-note');assert.equal(restorer.active,false);
});

test('a rapid second history action cancels an earlier pending note load',async()=>{
 const {calls,adapter,setURL}=setup(),loading=deferred();adapter.ready=loading.promise;
 const restorer=createLocationRestorer(adapter),first=restorer.restore();await Promise.resolve();assert.equal(restorer.active,true);
 setURL('https://happypite.github.io/world/?category=research');assert.equal(await restorer.restore(),true);assert.equal(restorer.active,false);
 loading.resolve();assert.equal(await first,false);assert.ok(!calls.includes('gh-note'));assert.equal(calls.at(-1),'world');assert.equal(restorer.active,false);
});

test('restoration waits for the old modal close event before opening another note',async()=>{
 const {calls,adapter}=setup(),closing=deferred();adapter.closeReader=()=>closing.promise;
 const restorer=createLocationRestorer(adapter),result=restorer.restore();assert.deepEqual(calls,['cancel']);assert.equal(restorer.active,true);
 closing.resolve();await result;assert.deepEqual(calls,['cancel','projects','enter','gh-note']);
});

test('empty, oversized and control-character note parameters do not block page navigation',async()=>{
 for(const value of ['', 'x'.repeat(150), 'id\u0000bad'])assert.equal(locationState('https://happypite.github.io/projects/?note='+encodeURIComponent(value)).note,null);
 assert.deepEqual(locationState('https://happypite.github.io/world/index.html?category=research'),{page:'world',note:null});
 const {calls,adapter,setURL}=setup();setURL('https://happypite.github.io/about/?note=');await createLocationRestorer(adapter).restore();assert.deepEqual(calls,['cancel','close','about']);
});

test('ordinary navigation or explicit cancellation cannot reopen a stale requested note',async()=>{
 for(const mode of ['navigate','cancel']){
  const {calls,adapter,setURL}=setup(),loading=deferred();adapter.ready=loading.promise;
  const restorer=createLocationRestorer(adapter),result=restorer.restore();await Promise.resolve();
  if(mode==='navigate')setURL('https://happypite.github.io/about/');else restorer.cancel();
  assert.equal(restorer.active,false);loading.resolve();assert.equal(await result,false);assert.ok(!calls.includes('gh-note'));
 }
});
