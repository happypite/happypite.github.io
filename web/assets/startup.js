// Allow the static page and its text to paint before allocating the 3D scenes.
export function afterInitialPaint(start, host=globalThis){
 host.requestAnimationFrame(()=>host.requestAnimationFrame(()=>{
  if(host.requestIdleCallback)host.requestIdleCallback(start,{timeout:800});
  else host.setTimeout(start,0);
 }));
}
