// Original image bytes, loaded only when its artwork is displayed.
export const BUG_REFERENCE='/assets/bug-reference.png';
let inlineImage;
export async function embedSymbolImages(svg,fetcher=globalThis.fetch){
 if(!svg.includes(BUG_REFERENCE))return svg;
 inlineImage??=fetcher(BUG_REFERENCE).then(async response=>{
  if(!response.ok)throw Error('Category image unavailable');
  const bytes=new Uint8Array(await response.arrayBuffer()),parts=[];
  for(let at=0;at<bytes.length;at+=16384)parts.push(String.fromCharCode(...bytes.subarray(at,at+16384)));
  return 'data:image/png;base64,'+btoa(parts.join(''));
 }).catch(error=>{inlineImage=null;throw error;});
 return svg.replaceAll(BUG_REFERENCE,await inlineImage);
}
