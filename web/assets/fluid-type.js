// Native filter primitives keep the text live and avoid per-frame bitmap encoding.
export class FluidTypography{
  constructor(){
    const ns='http://www.w3.org/2000/svg',make=(tag,attrs)=>{const e=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,v);return e;};
    const svg=make('svg',{width:0,height:0,'aria-hidden':'true'});svg.style.cssText='position:fixed;pointer-events:none';const defs=make('defs',{});svg.append(defs);document.body.append(svg);
    const mask='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><defs><radialGradient id="m"><stop stop-color="white"/><stop offset=".45" stop-color="white" stop-opacity=".65"/><stop offset="1" stop-color="white" stop-opacity="0"/></radialGradient></defs><rect width="256" height="256" fill="url(#m)"/></svg>');
    this.items=[...document.querySelectorAll('h1:not(#world-title),.archive-end h2,.menu-panel>a')].map((el,i)=>{
      const id=`type-flow-${i}`,filter=make('filter',{id,filterUnits:'userSpaceOnUse','color-interpolation-filters':'sRGB'}),noise=make('feTurbulence',{type:'fractalNoise',baseFrequency:'.009 .018',numOctaves:2,seed:8,result:'noise'}),offset=make('feOffset',{in:'noise',dx:0,dy:0,result:'moving'}),field=make('feImage',{href:mask,width:260,height:260,result:'mask',preserveAspectRatio:'none'}),cut=make('feComposite',{in:'moving',in2:'mask',operator:'in',result:'local'}),neutral=make('feFlood',{'flood-color':'rgb(128,128,128)',result:'neutral'}),mix=make('feComposite',{in:'local',in2:'neutral',operator:'over',result:'field'}),displace=make('feDisplacementMap',{in:'SourceGraphic',in2:'field',scale:0,xChannelSelector:'R',yChannelSelector:'G'});
      filter.append(noise,offset,field,cut,neutral,mix,displace);defs.append(filter);return{el,id,filter,offset,field,displace,strength:0,x:0,y:0,bounds:null};
    });this.measure=0;
  }
  update(now,dt,px,py,speed){
    const measure=now-this.measure>120;if(measure)this.measure=now;
    for(const item of this.items){
      if(measure)item.bounds=item.el.getClientRects().length?item.el.getBoundingClientRect():null;
      const r=item.bounds;if(!r||r.width<1)continue;
      const dx=Math.max(r.left-px,0,px-r.right),dy=Math.max(r.top-py,0,py-r.bottom),near=Math.hypot(dx,dy),target=near<80?Math.exp(-near/40)*(.12+Math.min(speed/34,.65)):0;
      item.strength+=(target-item.strength)*(1-Math.exp(-dt*7));
      if(item.strength<.008){item.el.style.filter='none';item.el.style.setProperty('--title-fluid','none');continue;}
      item.el.style.filter=`url(#${item.id})`;item.el.style.setProperty('--title-fluid',`url(#${item.id})`);const pad=30;
      if(item.width!==r.width||item.height!==r.height){item.width=r.width;item.height=r.height;item.filter.setAttribute('x',-pad);item.filter.setAttribute('y',-pad);item.filter.setAttribute('width',r.width+pad*2);item.filter.setAttribute('height',r.height+pad*2);}
      item.x+=(px-r.left-item.x)*(1-Math.exp(-dt*11));item.y+=(py-r.top-item.y)*(1-Math.exp(-dt*11));
      item.field.setAttribute('x',item.x-150);item.field.setAttribute('y',item.y-150);item.field.setAttribute('width',300);item.field.setAttribute('height',300);
      item.offset.setAttribute('dx',Math.sin(now*.00035)*22);item.offset.setAttribute('dy',Math.cos(now*.00028)*16);item.displace.setAttribute('scale',item.strength*(item.el.id==='home-title'?14:20));
    }
  }
}
