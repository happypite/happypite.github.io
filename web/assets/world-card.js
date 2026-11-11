import {escapeHTML} from './markdown.js';
import {searchExcerpt} from './reading.js';
// Live browser text stays sharp at every card size and display density.
export function worldPostCard(post,topic){
 return '<span class="world-post-copy"><span class="world-post-category">'+escapeHTML(topic.name)+'</span><span class="world-post-title">'+escapeHTML(post.title)+'</span><span class="world-post-summary">'+searchExcerpt(post,'',150)+'</span></span><span class="world-label"><span>'+escapeHTML(post.date||'')+'</span><span>읽기 →</span></span>';
}
