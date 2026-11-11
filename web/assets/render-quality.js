// Keep high-density rendering within a bounded physical pixel budget.
export function renderPixelRatio(width,height,dpr=1,maxPixels=6000000){
 const pixels=Math.max(1,Number(width)||1)*Math.max(1,Number(height)||1),desired=Math.max(1,Math.min(2,Number(dpr)||1));
 return Math.min(desired,Math.sqrt(maxPixels/pixels));
}
