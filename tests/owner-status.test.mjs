import test from 'node:test';
import assert from 'node:assert/strict';
import {mountOwnerStatus} from '../web/assets/owner-store.js';
test('session symbol follows real authentication rather than author display mode',t=>{
 const before=globalThis.document; t.after(()=>{globalThis.document=before;});
 const nodes=[];globalThis.document={createElement(){return {setAttribute(name,value){this[name]=value;}};},body:{append(node){nodes.push(node);}}};
 const store={owner:{authenticated:false},authorTools:true,canWrite:true,listeners:[]};
 const badge=mountOwnerStatus(store);assert.equal(badge.hidden,true);assert.equal(nodes.length,1);assert.equal(badge.role,'status');assert.equal(badge['aria-label'],'관리자로 로그인됨');
 store.owner.authenticated=true;store.listeners.forEach(fn=>fn());assert.equal(badge.hidden,false);
 store.owner.authenticated=false;store.listeners.forEach(fn=>fn());assert.equal(badge.hidden,true);
});
