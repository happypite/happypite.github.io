// Bounds in CSS pixels: physical screen inches do not define a browser viewport.
export function worldViewport(width,height,radius=9.2,fov=49){
 const narrow=width<900&&!(width>=600&&width>height),left=narrow?16:Math.min(460,width*.34),right=narrow?16:32;
 const top=narrow?Math.min(320,height*.43):92,bottom=narrow?84:88;
 const w=Math.max(100,width-left-right),h=Math.max(100,height-top-bottom);
 const tangent=Math.tan(fov*Math.PI/360)*Math.min(w/height,h/height)*.96;
 return {distance:radius/Math.sin(Math.atan(tangent)),x:(left-right)/2,y:(top-bottom)/2,width:w,height:h};
}
