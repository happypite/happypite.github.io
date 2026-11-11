import test from 'node:test';
import assert from 'node:assert/strict';
import {renderPixelRatio} from '../web/assets/render-quality.js';
import {worldPostCard} from '../web/assets/world-card.js';
import {ArticleGlobe} from '../web/assets/globe.js';
import {worldViewport} from '../web/assets/world-layout.js';

test('spatial renderer preserves high density within the physical pixel budget',()=>{
 assert.equal(renderPixelRatio(1280,800,2),2);
 assert.equal(renderPixelRatio(390,844,3),2);
 assert.equal(renderPixelRatio(1280,800,1),1);
 for(const [w,h,dpr] of [[2560,1440,2],[3840,2160,3],[7680,4320,2]]){
  const ratio=renderPixelRatio(w,h,dpr);
  assert.ok(w*h*ratio*ratio<=6000001);
  assert.ok(ratio>0&&ratio<=2);
 }
});
test('spatial post copy is native text with escaped category, title, excerpt and date',()=>{
 const html=worldPostCard({title:'<img src=x onerror=bad()>',summary:'<script>bad()</script>',date:'<svg>',body:''},{name:'<iframe>'});
 assert.ok(html.includes('world-post-title'));
 assert.ok(html.includes('world-post-summary'));
 for(const tag of ['img','script','svg','iframe'])assert.ok(!html.includes('<'+tag));
 assert.ok(html.includes('&lt;img'));
 assert.ok(html.includes('&lt;script'));
 assert.ok(html.includes('읽기 →'));
});
test('a full spatial collection shares one background texture instead of duplicating it per post',()=>{
 let allocations=0;
 const context={clear(){},postTexture(){allocations++;return {shared:true};},buildGrid(){},buildCards(){}};
 ArticleGlobe.prototype.setTopic.call(context,{color:'#abcdef'},Array.from({length:70},(_,id)=>({id,title:'기록',status:'published'})));
 assert.equal(context.items.length,60);
 assert.equal(allocations,1);
 assert.equal(new Set(context.items.map(p=>p.texture)).size,1);
 ArticleGlobe.prototype.setTopic.call(context,{color:'#abcdef'},[]);
 assert.equal(allocations,1);
 assert.equal(context.items.length,0);
});
test('landscape globe placement clears the sidebar even at a nearly square aspect ratio',()=>{
 for(const [width,height] of [[600,599],[667,517],[844,390]]){
  const view=worldViewport(width,height),cardLeft=width/2+view.x-160,controlsRight=20+width*.3;
  assert.ok(cardLeft>=controlsRight+16);
 }
 assert.equal(worldViewport(390,844).x,0);
});
