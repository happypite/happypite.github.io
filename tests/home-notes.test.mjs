import test from 'node:test';
import assert from 'node:assert/strict';
import {publishedHomeNotes,homeNotesMarkup} from '../web/assets/home-notes.js';

test('home shows only published, undeleted notes in date order without mutating the store',()=>{
 const posts=[{id:'old',status:'published',date:'2026-10-01'},{id:'draft',status:'draft',date:'2026-11-10'},{id:'trash',status:'published',deletedAt:'2026-11-09'},{id:'new',status:'published',date:'2026-11-09'}];
 assert.deepEqual(publishedHomeNotes(posts).map(p=>p.id),['new','old']);
 assert.equal(posts[0].id,'old');
});
test('home links escape user titles and support shareable note URLs',()=>{
 const html=homeNotesMarkup([{id:'a&b',title:'<img onerror="bad">',category:'development',date:'2026-11-09'}],[{id:'development',name:'개발'}]);
 assert.ok(html.includes('/?note=a%26b'));
 assert.ok(html.includes('&lt;img onerror=&quot;bad&quot;&gt;'));
 assert.ok(html.includes('2026.11.09'));
 assert.ok(!html.includes('<img'));
});
test('home has an honest empty state and a maximum of three rows',()=>{
 assert.ok(homeNotesMarkup([],[]).includes('아직 게시된 글이 없습니다.'));
 assert.equal((homeNotesMarkup(Array.from({length:6},(_,i)=>({id:String(i),title:'글'})),[]).match(/data-home-note=/g)||[]).length,3);
});
