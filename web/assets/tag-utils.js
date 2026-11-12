export const cleanTag=value=>typeof value==='string'?value.normalize('NFC').trim().replace(/^[#＃]+\s*/u,'').trim():'';
export const postTags=post=>[...new Set((Array.isArray(post.tags)?post.tags:[]).map(cleanTag).filter(Boolean))];
export const collectTags=posts=>[...new Set(posts.flatMap(postTags))];
