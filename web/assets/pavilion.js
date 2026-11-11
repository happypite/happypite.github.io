import {WaterRipples} from './water-ripples.js';
import * as THREE from './vendor/three.module.js';

// A quiet tidal pavilion. Only the water and light move on their own.
export class Pavilion {
  constructor(renderer){
    this.renderer=renderer;
    renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    const scene=this.scene=new THREE.Scene();
    scene.background=new THREE.Color('#c1d4d5');
    scene.fog=new THREE.Fog('#cedbd8',24,85);
    scene.environment=this.environment();
    scene.add(new THREE.HemisphereLight('#f6f1e3','#709eac',1.45));
    const sun=new THREE.DirectionalLight('#fff0d8',2.5);
    sun.position.set(-8,11,8);sun.castShadow=true;
    sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-16,right:16,top:14,bottom:-14,near:.5,far:50});sun.shadow.camera.updateProjectionMatrix();sun.shadow.normalBias=.025;sun.shadow.bias=-.0002;sun.shadow.radius=4;sun.shadow.autoUpdate=false;sun.shadow.needsUpdate=true;scene.add(sun);
    const fill=new THREE.DirectionalLight('#9ed5e0',1.0);
    fill.position.set(8,5,-5);scene.add(fill);

    const sky=new THREE.Mesh(new THREE.SphereGeometry(60,48,32),new THREE.ShaderMaterial({
      side:THREE.BackSide,depthWrite:false,uniforms:{},
      vertexShader:'varying vec3 direction;void main(){direction=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader:`varying vec3 direction;void main(){vec3 d=normalize(direction);float h=smoothstep(-.12,.65,d.y);vec3 c=mix(vec3(.74,.75,.69),vec3(.35,.55,.64),h);float light=pow(max(0.,dot(d,normalize(vec3(-.6,.26,-.7)))),18.);c+=vec3(.14,.055,.01)*light;gl_FragColor=vec4(c,1.);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
      }`
    }));scene.add(sky);
    const stone=new THREE.MeshStandardMaterial({color:'#ede8db',roughness:.78,metalness:.02});
    const rose=new THREE.MeshStandardMaterial({color:'#bda39a',roughness:.76,metalness:.04});
    const pale=new THREE.MeshStandardMaterial({color:'#c8dbd4',roughness:.58,metalness:.12});
    this.architecture=new THREE.Group();scene.add(this.architecture);
    // A circular opening and low offset platforms replace the reference's stairs and arches.
    const outline=new THREE.Shape();outline.absarc(0,0,3.45,0,Math.PI*2,false);
    const hole=new THREE.Path();hole.absarc(0,0,2.78,0,Math.PI*2,true);outline.holes.push(hole);
    const ring=new THREE.Mesh(new THREE.ExtrudeGeometry(outline,{depth:.62,steps:1,curveSegments:96,bevelEnabled:true,bevelSize:.09,bevelThickness:.09,bevelSegments:4}),stone);
    ring.position.set(4.7,1.0,-7.5);ring.rotation.y=-.23;this.architecture.add(ring);
    for(let i=0;i<3;i++){
      const disk=new THREE.Mesh(new THREE.CylinderGeometry(4.2-i*.36,4.2-i*.36,.22,100),i===2?stone:pale);
      disk.position.set(4.45+i*.08,-2.48+i*.21,-6.0-i*.18);this.architecture.add(disk);
    }
    const fin=new THREE.Mesh(new THREE.BoxGeometry(2.9,13,1.35),rose);
    fin.position.set(-9.5,3.9,-10);fin.rotation.y=.18;this.architecture.add(fin);
    const backFin=new THREE.Mesh(new THREE.BoxGeometry(1.3,11,.8),stone);
    backFin.position.set(11,3,-15);backFin.rotation.y=-.12;this.architecture.add(backFin);
    const beam=new THREE.Mesh(new THREE.BoxGeometry(8.5,.48,1.15),stone);
    beam.position.set(-7.3,5.7,-12);beam.rotation.z=-.07;this.architecture.add(beam);

    this.pearl=new THREE.Mesh(new THREE.SphereGeometry(.86,64,48),new THREE.MeshStandardMaterial({color:'#d8e1d9',metalness:.46,roughness:.16,envMapIntensity:1.35}));
    this.pearl.position.set(4.25,-.95,-4.6);scene.add(this.pearl);
    const pebble=this.pebble=new THREE.Mesh(new THREE.SphereGeometry(1,48,32),pale);
    pebble.scale.set(1.4,.6,.85);pebble.position.set(-5.5,-2.04,1.1);pebble.rotation.z=.18;scene.add(pebble);

    this.waterY=-2.48;this.ripples=new WaterRipples(renderer);
    this.reflection=new THREE.WebGLRenderTarget(1,1,{samples:2,depthBuffer:true});
    this.mirrorCamera=new THREE.PerspectiveCamera();
    this.textureMatrix=new THREE.Matrix4();this.reflectedTarget=new THREE.Vector3();
    this.waterMaterial=new THREE.ShaderMaterial({
      uniforms:{uHeight:{value:this.ripples.texture},uReflection:{value:this.reflection.texture},uMatrix:{value:this.textureMatrix},uTime:{value:0},uEye:{value:new THREE.Vector3()}},
      vertexShader:`varying vec3 world;varying vec4 mirror;uniform mat4 uMatrix;void main(){vec4 p=modelMatrix*vec4(position,1.);world=p.xyz;mirror=uMatrix*p;gl_Position=projectionMatrix*viewMatrix*p;}`,
      fragmentShader:`varying vec3 world;varying vec4 mirror;uniform sampler2D uReflection,uHeight;uniform float uTime;uniform vec3 uEye;
      void main(){vec2 p=world.xz;float t=uTime;vec2 field=p/vec2(48.,64.)+.5;float px=1./256.;float inside=step(0.,field.x)*step(field.x,1.)*step(0.,field.y)*step(field.y,1.);vec2 gradient=vec2(texture2D(uHeight,field+vec2(px,0.)).r-texture2D(uHeight,field-vec2(px,0.)).r,texture2D(uHeight,field+vec2(0.,px)).r-texture2D(uHeight,field-vec2(0.,px)).r);vec2 slope=gradient*inside*3.8+vec2(sin(p.x*.6+p.y*.37-t*.15),cos(p.y*.7-p.x*.23+t*.12))*.012;vec3 n=normalize(vec3(slope.x,1.,slope.y));vec3 view=normalize(uEye-world);float fresnel=.34+pow(1.-max(0.,dot(view,n)),3.)*.5;vec2 uv=mirror.xy/mirror.w+slope*vec2(.065,.028);vec3 reflected=texture2D(uReflection,clamp(uv,.001,.999)).rgb;float depth=smoothstep(-15.,13.,p.y);vec3 base=mix(vec3(.22,.43,.48),vec3(.10,.30,.37),depth);vec3 c=mix(base,reflected,fresnel);float gleam=pow(max(0.,sin(p.y*1.7+p.x*.24+slope.x*.8-t*.25)),32.);c+=vec3(.13,.19,.16)*gleam*.16;float haze=1.-exp(-length(uEye-world)*.012);c=mix(c,vec3(.66,.77,.76),haze*.3);gl_FragColor=vec4(c,1.);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
      }`
    });
    this.water=new THREE.Mesh(new THREE.PlaneGeometry(180,180),this.waterMaterial);
    this.water.rotation.x=-Math.PI/2;this.water.position.y=this.waterY;scene.add(this.water);
    this.architecture.traverse(mesh=>{if(mesh.isMesh){mesh.castShadow=true;mesh.receiveShadow=true;}});this.pearl.castShadow=true;pebble.castShadow=true;
    const contact=document.createElement('canvas');contact.width=contact.height=128;const cx=contact.getContext('2d'),gradient=cx.createRadialGradient(64,64,5,64,64,60);gradient.addColorStop(0,'rgba(35,66,73,.30)');gradient.addColorStop(.4,'rgba(35,66,73,.16)');gradient.addColorStop(1,'rgba(35,66,73,0)');cx.fillStyle=gradient;cx.fillRect(0,0,128,128);const shadow=new THREE.CanvasTexture(contact);
    for(const [x,z,w,h] of [[-5.5,1.1,4,2.6],[4.5,-6,10,8]]){const patch=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:shadow,transparent:true,depthWrite:false}));patch.rotation.x=-Math.PI/2;patch.position.set(x,this.waterY+.015,z);scene.add(patch);}
    this.resize();
  }
  environment(){
    const c=document.createElement('canvas');c.width=512;c.height=256;
    const x=c.getContext('2d'),g=x.createLinearGradient(0,0,0,256);
    g.addColorStop(0,'#a4cad8');g.addColorStop(.5,'#e6eadf');g.addColorStop(1,'#638f99');x.fillStyle=g;x.fillRect(0,0,512,256);
    x.fillStyle='#fff8e8';x.fillRect(50,25,65,110);x.fillStyle='#d8f0e8';x.fillRect(325,50,130,80);
    const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;texture.mapping=THREE.EquirectangularReflectionMapping;
    const pm=new THREE.PMREMGenerator(this.renderer),env=pm.fromEquirectangular(texture).texture;texture.dispose();pm.dispose();return env;
  }
  resize(){const r=Math.min(1,1000/innerWidth);this.reflection.setSize(Math.round(innerWidth*r),Math.round(innerHeight*r));}
  update(camera,time,pointer){
    this.ripples.update(camera,this.water,[this.architecture,this.pearl,this.pebble],time,pointer);this.waterMaterial.uniforms.uHeight.value=this.ripples.texture;
    this.waterMaterial.uniforms.uTime.value=time;this.waterMaterial.uniforms.uEye.value.copy(camera.position);
    const mirror=this.mirrorCamera;mirror.copy(camera);mirror.position.y=this.waterY*2-camera.position.y;mirror.up.set(0,-1,0);
    camera.getWorldDirection(this.reflectedTarget);this.reflectedTarget.add(camera.position);this.reflectedTarget.y=this.waterY*2-this.reflectedTarget.y;mirror.lookAt(this.reflectedTarget);mirror.updateMatrixWorld();
    this.textureMatrix.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1).multiply(mirror.projectionMatrix).multiply(mirror.matrixWorldInverse);
    const previous=this.renderer.getRenderTarget();this.water.visible=false;this.renderer.setRenderTarget(this.reflection);this.renderer.render(this.scene,mirror);this.water.visible=true;this.renderer.setRenderTarget(previous);
  }
}
