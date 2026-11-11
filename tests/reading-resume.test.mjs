import test from 'node:test';
import assert from 'node:assert/strict';
import {ReaderTools} from '../web/assets/reading.js';
test('resume and restart retain the saved destination and reusable controls',()=>{
 const oldDocument=globalThis.document,oldStorage=globalThis.localStorage;
 const values=new Map();globalThis.localStorage={getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v)};
 const label={textContent:''},notice={removed:false,remove(){this.removed=true}},events={};
 const main={scrollTop:0,clientHeight:500,addEventListener(){},getBoundingClientRect:()=>({top:80}),contains:()=>true,querySelector:s=>s==='.resume-reading'?notice:s==='[data-resume-message]'?label:{offsetHeight:2000,getBoundingClientRect:()=>({top:300-main.scrollTop})},scrollTo({top}){this.scrollTop=top}};
 const target={getBoundingClientRect:()=>({top:500-main.scrollTop})};
 globalThis.document={querySelector:s=>s==='.collection-main'?main:{addEventListener:(name,fn)=>events[name]=fn},getElementById:()=>target};
 try{
  const notes={post:{id:'resume-test',date:'2026-11-11',body:'text'},mode:'reader'},tools=new ReaderTools(notes),saved={anchor:'note-heading-1',offset:40,progress:.42};
  tools.saved=saved;tools.update=()=>{};
  const click=action=>events.click({target:{closest:()=>({dataset:{readerAction:action}})}});
  click('resume');assert.equal(main.scrollTop,460);assert.equal(tools.saved,saved);assert.equal(notice.removed,false);assert.match(label.textContent,/42%/);
  click('restart');assert.equal(main.scrollTop,0);assert.equal(tools.saved,saved);assert.equal(notice.removed,false);assert.match(label.textContent,/처음부터/);assert.equal(JSON.parse(values.get('happypite.reading-history'))[0].progress,0);
  click('resume');assert.equal(main.scrollTop,460);assert.equal(tools.saved,saved);assert.equal(notice.removed,false);
 }finally{globalThis.document=oldDocument;globalThis.localStorage=oldStorage;}
});
