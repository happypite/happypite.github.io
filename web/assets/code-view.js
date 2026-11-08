const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const groups={js:'javascript',javascript:'javascript',ts:'javascript',typescript:'javascript',json:'json',py:'python',python:'python',sh:'shell',bash:'shell',shell:'shell',sql:'sql'};
const words={javascript:'const let var function return async await if else for while class new throw try catch finally import from export default typeof instanceof null true false this undefined switch case break continue',python:'def class return import from as if elif else for while in is not and or None True False with try except finally raise yield lambda pass async await',shell:'if then else elif fi for do done case esac function in export sudo',sql:'select from where join left right inner outer on as group by order having insert into values update set delete create table alter drop limit offset distinct null and or not is union with',json:'true false null'};
export function codeHTML(source,language=''){
 const text=String(source),group=groups[String(language).toLowerCase()],keywords=new Set((words[group]||'').split(' ')),lines=[''];
 const append=(value,type='')=>{value.split('\n').forEach((piece,i)=>{if(i)lines.push('');if(piece)lines[lines.length-1]+=type?'<span class="syntax-'+type+'">'+escape(piece)+'</span>':escape(piece);});};
 if(!group)append(text);else{
  const tokens=/("""[\s\S]*?"""|'''[\s\S]*?'''|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|\/\/[^\n]*|\/\*[\s\S]*?\*\/|\#[^\n]*|--[^\n]*|\b\d+(?:\.\d+)?\b|\b[A-Za-z_$][\w$]*\b)/g;let end=0;
  for(const match of text.matchAll(tokens)){append(text.slice(end,match.index));const token=match[0],comment=(group==='javascript'&&/^\/[/\*]/.test(token))||(['python','shell'].includes(group)&&token.startsWith('#'))||(group==='sql'&&token.startsWith('--'));const string=/^["'`]/.test(token),number=/^\d/.test(token),keyword=keywords.has(group==='sql'?token.toLowerCase():token);append(token,comment?'comment':string?'string':number?'number':keyword?'keyword':'');end=match.index+token.length;}append(text.slice(end));
 }
 return lines.map((line,i)=>'<span class="code-line"><span class="code-number" aria-hidden="true">'+(i+1)+'</span><span class="code-text">'+(line||'')+'</span></span>').join('\n');
}
