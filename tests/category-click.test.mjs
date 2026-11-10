import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

test('a real category button opens even when the decorative GPU hit test misses',async()=>{
 const source=fs.readFileSync(new URL('../web/assets/experience.js',import.meta.url),'utf8');
 const handler=source.slice(source.indexOf("document.addEventListener('click',async e=>"),source.indexOf("const scroller=$('#records-scroll')"));
 const button={dataset:{open:'development'}},opened=[];let click,picks=0;
 const document={addEventListener(type,listener){assert.equal(type,'click');click=listener;}};
 vm.runInNewContext(handler,{document,page:'projects',engine:{gallery:{pick(){picks++;return -1;}}},openTopic:(id,opener)=>opened.push({id,opener})});
 await click({clientX:120,clientY:300,target:{closest(selector){if(selector==='button[data-open]')return button;if(selector==='#records-scroll')return {};return null;}}});
 assert.deepEqual(opened,[{id:'development',opener:button}]);assert.equal(picks,0);
});
