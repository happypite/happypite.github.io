export function articleURL(address,id){const url=new URL(address,'https://happypite.github.io');url.pathname='/read/';url.hash='';url.searchParams.set('note',id);return url.pathname+url.search;}
export function articleListURL(address){const url=new URL(address,'https://happypite.github.io');url.pathname='/projects/';url.hash='';url.searchParams.delete('note');return url.pathname+url.search;}
