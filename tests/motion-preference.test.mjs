import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

test('OS motion preference applies at startup and changes without losing normal spatial motion',()=>{
 const source=fs.readFileSync(new URL('../web/assets/experience.js',import.meta.url),'utf8');
 const section=source.slice(source.indexOf('// Keep spatial motion'),source.indexOf('function renderFilters'));
 for(const initiallyReduced of [true,false]){
  const classes=new Set(),applied=[];let onChange;
  const preference={matches:initiallyReduced,addEventListener(type,listener){assert.equal(type,'change');onChange=listener;}};
  const context=vm.createContext({motion:true,engine:{setMotion:value=>applied.push(value)},matchMedia:()=>preference,document:{body:{classList:{toggle(name,enabled){if(enabled)classes.add(name);else classes.delete(name);}}}}});
  vm.runInContext(section+'updateMotion();',context);
  assert.equal(context.motion,!initiallyReduced);
  assert.equal(classes.has('motion-full'),!initiallyReduced);
  assert.equal(classes.has('motion-off'),initiallyReduced);
  preference.matches=!initiallyReduced;onChange();
  assert.equal(context.motion,initiallyReduced);
  assert.deepEqual(applied,[!initiallyReduced,initiallyReduced]);
 }
});
