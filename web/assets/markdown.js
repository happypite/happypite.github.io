import {codeHTML} from './code-view.js';
import {mediaURL} from './media.js';
export const escapeHTML=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const plainInline=text=>escapeHTML(text).replace(/\*\*([^*\n]+)\*\*/g,'<strong>$1</strong>').replace(/\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)/g,'<a href="$2" target="_blank" rel="noreferrer">$1 ↗</a>');
const inline=text=>String(text).split(/(`[^`\n]+`)/g).map(part=>part.startsWith('`')&&part.endsWith('`')?'<code>'+escapeHTML(part.slice(1,-1))+'</code>':plainInline(part)).join('');

// Parse lines so ordinary Markdown does not depend on blank lines after a
// heading. Code is escaped directly instead of using forgeable placeholders.
export function markdown(source){
 const lines=String(source||'').replace(/\r\n?/g,'\n').split('\n'),out=[],paragraph=[];let heading=0;
 const flush=()=>{if(paragraph.length){out.push('<p>'+paragraph.map(inline).join('<br>')+'</p>');paragraph.length=0;}};
 for(let i=0;i<lines.length;i++){
  const line=lines[i],fence=line.match(/^ {0,3}(`{3,}|~{3,})([^\n]*)$/),title=line.match(/^ {0,3}(#{1,6})\s+(.+?)\s*$/);
  if(fence){flush();const body=[],mark=fence[1][0],length=fence[1].length;while(++i<lines.length){const close=lines[i].trim();if(close.length>=length&&[...close].every(c=>c===mark))break;body.push(lines[i]);}const language=fence[2].trim().slice(0,24);out.push('<pre tabindex="0" aria-label="코드 블록. 좌우로 스크롤할 수 있습니다."><span class="code-language">'+escapeHTML(language||'text')+'</span><button class="code-copy" data-note-action="copy" aria-label="코드 복사">복사</button><code class="code-lines" data-language="'+escapeHTML(language)+'">'+codeHTML(body.join('\n'),language)+'</code></pre>');continue;}
  const image=line.trim().match(/^!\[([^\]]*)\]\(([^\s)]+)\)$/);if(image&&mediaURL(image[2])){flush();const url=escapeHTML(mediaURL(image[2])),alt=escapeHTML(image[1]||'본문 이미지');out.push('<figure class="markdown-image"><button type="button" data-image-url="'+url+'" aria-label="'+alt+' 크게 보기"><img src="'+url+'" alt="'+alt+'" loading="lazy" decoding="async" referrerpolicy="no-referrer"><span class="image-expand" aria-hidden="true">확대 ↗</span><span class="image-error">이미지를 불러올 수 없습니다.</span></button>'+(image[1]?'<figcaption>'+alt+'</figcaption>':'')+'</figure>');continue;}
  const cells=row=>row.trim().replace(/^\|/,'').replace(/\|$/,'').split(/(?<!\\)\|/).map(c=>c.trim().replaceAll('\\|','|'));
  if(line.includes('|')&&i+1<lines.length){const head=cells(line),separator=cells(lines[i+1]);if(head.length>=2&&head.length<=24&&separator.length===head.length&&separator.every(c=>/^:?-{3,}:?$/.test(c))){flush();const align=separator.map(c=>c.startsWith(':')&&c.endsWith(':')?'center':c.endsWith(':')?'right':'left'),cell=(value,j,tag)=>'<'+tag+' style="text-align:'+align[j]+'">'+inline(value||'')+'</'+tag+'>';let table='<div class="markdown-table" tabindex="0" role="region" aria-label="표. 가로로 스크롤할 수 있습니다."><table><thead><tr>'+head.map((v,j)=>cell(v,j,'th')).join('')+'</tr></thead><tbody>';i+=2;while(i<lines.length&&lines[i].trim()&&lines[i].includes('|')){const row=cells(lines[i]);table+='<tr>'+head.map((_,j)=>cell(row[j],j,'td')).join('')+'</tr>';i++;}i--;out.push(table+'</tbody></table></div>');continue;}}
  if(!line.trim()){flush();continue;}
  if(title){flush();const level=Math.min(6,Math.max(2,title[1].length));out.push('<h'+level+' id="note-heading-'+(++heading)+'">'+inline(title[2].replace(/\s+#+$/,''))+'</h'+level+'>');continue;}
  if(/^ {0,3}([-*+]\s+|\d+[.)]\s+)/.test(line)){flush();const ordered=/^ {0,3}\d/.test(line),items=[],pattern=ordered?/^ {0,3}\d+[.)]\s+/:/^ {0,3}[-*+]\s+/;while(i<lines.length&&pattern.test(lines[i])){items.push('<li>'+inline(lines[i].replace(pattern,''))+'</li>');i++;}i--;out.push((ordered?'<ol>':'<ul>')+items.join('')+(ordered?'</ol>':'</ul>'));continue;}
  if(/^ {0,3}>\s?/.test(line)){flush();const quote=[];while(i<lines.length&&/^ {0,3}>\s?/.test(lines[i]))quote.push(inline(lines[i++].replace(/^ {0,3}>\s?/,'')));i--;out.push('<blockquote>'+quote.join('<br>')+'</blockquote>');continue;}
  if(/^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/.test(line)){flush();out.push('<hr>');continue;}
  paragraph.push(line);
 }
 flush();return out.join('');
}
