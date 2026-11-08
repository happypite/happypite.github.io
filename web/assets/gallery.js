import * as THREE from './vendor/three.module.js';
const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
const vertex=`varying vec2 vUv;varying float vDepth;varying vec2 vScreen;uniform float uTime,uScale,uDrop,uReveal;uniform vec2 uBand,uView;
void main(){vUv=uv;vec4 world=modelMatrix*vec4(position,1.);vec2 q=world.xy/uScale;
 float field=smoothstep(uBand.x,uBand.y,q.y);
 float phase=(q.x-q.y*.1)*.018+10.;
 float lift=1.45-sin((q.x+q.y*.1)*.006)*.12;
 float surface=sin((q.x-q.y)*.012)*1.2;
 world.z+=(surface-(1200.+sin(phase)*12.)*field)*uScale;
 world.y-=lift*smoothstep(uBand.x*1.1,uBand.y*.7,q.y)*uDrop;
 world.y-=(1.-uReveal)*uView.y*.32;world.z-=(1.-uReveal)*400.*uScale;
 vDepth=field;gl_Position=projectionMatrix*viewMatrix*world;vScreen=gl_Position.xy/gl_Position.w*.5+.5;}`;
const fragment=`varying vec2 vUv;varying float vDepth;varying vec2 vScreen;uniform sampler2D uImage,uFluid;uniform vec2 uMouse;uniform float uTime,uHover,uAlpha,uEnergy,uPick,uId,uFloor;
void main(){if(vScreen.y<uFloor)discard;if(uPick>.5){if(uAlpha<.1)discard;gl_FragColor=vec4(uId,0.,0.,1.);return;}vec2 d=vUv-uMouse;float g=exp(-dot(d,d)*8.);vec2 drift=vec2(sin(d.y*8.-uTime*.6),cos(d.x*7.+uTime*.5))*g*uEnergy*.003;
 vec2 velocity=texture2D(uFluid,vScreen).xy;vec2 refraction=-velocity/sqrt(1.+dot(velocity,velocity));vec2 uv=(vUv-.5)/(1.+uHover*.004)+.5+refraction*.006;
 vec4 c=texture2D(uImage,uv);float aberration=.0006+uEnergy*.0008;
 c.r=texture2D(uImage,uv+vec2(aberration,0.)).r;c.b=texture2D(uImage,uv-vec2(aberration,0.)).b;
 gl_FragColor=vec4(c.rgb,c.a*uAlpha);}`;

// Covers and captions are separate surfaces in one continuous world-space field.
export class Gallery{
 constructor(renderer,textures,flow){this.renderer=renderer;this.flow=flow;this.textures=textures;this.scene=new THREE.Scene();this.camera=new THREE.PerspectiveCamera(45,1,1,5000);this.camera.position.z=1000;this.target=new THREE.WebGLRenderTarget(1,1,{samples:4});this.pickTarget=new THREE.WebGLRenderTarget(1,1);this.pickPixel=new Uint8Array(4);this.items=[];this.captionTextures=[];this.smooth=new THREE.Vector2();this.clock=0;
  this.outputScene=new THREE.Scene();this.outputCamera=new THREE.OrthographicCamera(-1,1,1,-1,0,2);this.outputCamera.position.z=1;this.outputScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2),new THREE.ShaderMaterial({transparent:true,depthTest:false,depthWrite:false,uniforms:{map:{value:this.target.texture}},vertexShader:'varying vec2 uv0;void main(){uv0=uv;gl_Position=vec4(position,1.);}',fragmentShader:'varying vec2 uv0;uniform sampler2D map;void main(){vec2 c=uv0-.5;vec2 uv=uv0-c*dot(c,c)*.06;gl_FragColor=texture2D(map,uv);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}'})));
  this.resize();this.bind();
 }
 resize(){this.w=innerWidth;this.h=innerHeight;this.unit=2*Math.tan(Math.PI/8)*1000/this.h;this.camera.aspect=this.w/this.h;this.camera.updateProjectionMatrix();const ratio=this.renderer.getPixelRatio();this.target.setSize(this.w*ratio,this.h*ratio);clearTimeout(this.timer);this.timer=setTimeout(()=>this.bind(),120);}
 captionTexture(el){const r=el.getBoundingClientRect(),c=document.createElement('canvas');c.width=Math.max(2,r.width*2);c.height=Math.max(2,r.height*2);const x=c.getContext('2d');x.scale(2,2);x.textBaseline='top';
  for(const selector of ['h2','p','>span:last-child']){const n=selector.startsWith('>')?el.lastElementChild:el.querySelector(selector);if(!n)continue;const b=n.getBoundingClientRect(),style=getComputedStyle(n);x.font=style.font||`${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;x.fillStyle='#202222';x.fillText(n.textContent,b.left-r.left,b.top-r.top+1,b.width+2);}
  x.strokeStyle='#303333';x.lineWidth=.8;x.beginPath();x.moveTo(0,r.height-1);x.lineTo(r.width,r.height-1);x.stroke();const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;tex.minFilter=THREE.LinearFilter;tex.generateMipmaps=false;this.captionTextures.push(tex);return tex;
 }
 bind(){this.items.forEach(i=>{this.scene.remove(i.mesh);i.mesh.geometry.dispose();i.mesh.material.dispose();});this.captionTextures.forEach(t=>t.dispose());this.captionTextures=[];this.items=[];this.scroll=document.querySelector('#records-scroll');if(!this.scroll)return;this.clip=this.scroll.getBoundingClientRect();const scroll=this.scroll.scrollTop;
  document.querySelectorAll('.record-card').forEach((card,order)=>{const cover=card.querySelector('.record-media'),caption=card.querySelector('.record-caption'),index=Number(cover.dataset.index),coverBox=cover.getBoundingClientRect();if(!coverBox.width)return;
   for(const [el,texture,kind] of [[cover,this.textures[index],'cover'],[caption,this.captionTexture(caption),'caption']]){const r=el.getBoundingClientRect(),mesh=new THREE.Mesh(new THREE.PlaneGeometry(1,1,64,kind==='cover'?64:16),new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,uniforms:{uPick:{value:0},uId:{value:(index+1)/255},uImage:{value:texture},uFluid:{value:this.flow.texture},uTime:{value:0},uScale:{value:this.unit},uDrop:{value:coverBox.height*this.unit},uReveal:{value:1},uBand:{value:new THREE.Vector2()},uView:{value:new THREE.Vector2(this.w,this.h)},uMouse:{value:new THREE.Vector2(.5,.5)},uHover:{value:0},uAlpha:{value:1},uFloor:{value:-10},uEnergy:{value:0}},vertexShader:vertex,fragmentShader:fragment}));mesh.frustumCulled=false;mesh.renderOrder=order*2+(kind==='caption'?1:0);this.scene.add(mesh);this.items.push({mesh,index,kind,hover:0,born:performance.now()+order*60,rect:{left:r.left,top:r.top,width:r.width,height:r.height},cardBottom:card.getBoundingClientRect().bottom,baseScroll:scroll});}
  });
 }
 pick(x,y){if(!this.clip||y<this.clip.top)return -1;this.camera.setViewOffset(this.w,this.h,Math.floor(x),Math.floor(y),1,1);this.items.forEach(item=>item.mesh.material.uniforms.uPick.value=1);this.renderer.setRenderTarget(this.pickTarget);this.renderer.setClearColor(0,0);this.renderer.clear();this.renderer.render(this.scene,this.camera);this.renderer.readRenderTargetPixels(this.pickTarget,0,0,1,1,this.pickPixel);this.items.forEach(item=>item.mesh.material.uniforms.uPick.value=0);this.camera.clearViewOffset();this.renderer.setRenderTarget(null);return this.pickPixel[0]-1;}
 render(time,dt,pointer,hover,energy,transition){if(!this.clip?.height)return;this.clock=time;this.smooth.lerp(pointer,1-Math.exp(-dt*5));const scroll=this.scroll.scrollTop,u=this.unit,offsetX=this.smooth.x*7,offsetY=this.smooth.y*3;
  for(const item of this.items){const r=item.rect,top=r.top-scroll+item.baseScroll,bottom=item.cardBottom-scroll+item.baseScroll;
   // Retire each complete sheet before perspective can fold it back into view.
   const exit=clamp((bottom-this.clip.top-75)/70),life=exit*exit*(3-2*exit);
   item.mesh.visible=life>.001&&top<this.h+200;if(!item.mesh.visible)continue;
   item.mesh.position.set((r.left+r.width/2-this.w/2+offsetX)*u,(this.h/2-top-r.height/2-offsetY)*u,0);item.mesh.scale.set(r.width*u,r.height*u,1);item.hover+=((item.index===hover?1:0)-item.hover)*(1-Math.exp(-dt*7));
   const reveal=clamp((performance.now()-item.born)/1000),travel=transition?(transition.to==='projects'?clamp((transition.raw-.36)/.64):1-clamp(transition.raw/.5)):1,uniforms=item.mesh.material.uniforms;
   uniforms.uFloor.value=top<this.clip.top?1-(bottom+8)/this.h:-10;uniforms.uTime.value=time;uniforms.uFluid.value=this.flow.texture;uniforms.uScale.value=u;uniforms.uBand.value.set(this.h/1100*100,this.h/1100*700);uniforms.uReveal.value=Math.min(reveal,travel);uniforms.uAlpha.value=Math.min(reveal*2,travel*1.5,1)*life;uniforms.uHover.value=item.kind==='cover'?item.hover:0;uniforms.uEnergy.value=energy*(item.index===hover?1:.12);uniforms.uMouse.value.set(clamp(((pointer.x+.5)*this.w-r.left)/r.width),1-clamp(((pointer.y+.5)*this.h-top)/r.height));
  }
  const renderer=this.renderer;renderer.setRenderTarget(this.target);renderer.setClearColor(0,0);renderer.clear();renderer.setScissorTest(true);renderer.setScissor(0,0,this.w,this.h-this.clip.top);renderer.render(this.scene,this.camera);renderer.setScissorTest(false);renderer.setRenderTarget(null);renderer.autoClear=false;renderer.render(this.outputScene,this.outputCamera);renderer.autoClear=true;
 }
}
