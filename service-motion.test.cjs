// Run with node service-motion.test.cjs. No browser or dependencies required.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
function element(id=''){const e={id,hidden:false,attrs:{},handlers:{},dataset:{},classes:new Set(),children:[],setAttribute(k,v){this.attrs[k]=v},getAttribute(k){return this.attrs[k]},addEventListener(k,v){this.handlers[k]=v},focus(){focused=this},append(...c){this.children.push(...c)},prepend(...c){this.children.unshift(...c)},querySelector(){return null}};e.classList={toggle(k,v){v?e.classes.add(k):e.classes.delete(k)},contains:k=>e.classes.has(k),add:k=>e.classes.add(k),remove:k=>e.classes.delete(k)};return e}
let focused,observe,interval;const tabs=['migration','segmentation','assessment','msp'].map(x=>element('tab-'+x)),panels=tabs.map(t=>element(t.id.replace('tab-','scene-'))),hero=element('hero'),scenes=[hero,...panels],toggle=element('pause'),figures=scenes.map((_,i)=>{const e=element();e.dataset.renderScene=i?tabs[i-1].id.slice(4):'hero';e.caption=element();e.querySelector=s=>s==='figcaption'?e.caption:s==='.scene-phase'?e.phase:null;e.phase=element();return e});
tabs.forEach((tab,i)=>tab.attrs['aria-controls']=panels[i].id);
const films=scenes.map((scene,i)=>{const f=element();f.closest=()=>scene;f.parentElement=figures[i];f.dataset.serviceFilm=i?tabs[i-1].id.slice(4):'migration';f.play=()=>{f.playing=true;return Promise.resolve()};f.pause=()=>f.playing=false;return f});
const media={matches:false,addEventListener(k,f){this.change=f}},worlds=figures.map(()=>({running:false,time:0,setRunning(value){this.running=value}}));
class Observer{constructor(cb){observe=cb}observe(){}}
const doc={hidden:false,createElement:()=>element(),querySelector:()=>({querySelectorAll:s=>s==='[role="tab"]'?tabs:panels}),querySelectorAll:s=>s==='.motion-toggle'?[toggle]:s==='.service-film'?films:s==='[data-render-scene]'?figures:scenes,documentElement:element(),addEventListener(k,f){this[k]=f}};
vm.runInNewContext(fs.readFileSync('service-motion.js','utf8'),{document:doc,window:{matchMedia:()=>media,IntersectionObserver:Observer,ValoWorlds:{create:f=>worlds[figures.indexOf(f)]}},IntersectionObserver:Observer,setInterval:f=>interval=f});
observe(scenes.map(target=>({target,isIntersecting:true})));
assert(worlds[0].running&&worlds[1].running);assert(!worlds[2].running);assert(films.every(f=>!f.playing),'Movies stop when a live scene is available');
tabs[0].handlers.keydown({key:'ArrowRight',preventDefault(){}});assert.equal(focused,tabs[1]);assert(worlds[2].running&&!worlds[1].running);
toggle.handlers.click();assert(worlds.every(w=>!w.running));assert.equal(toggle.attrs['aria-pressed'],'true');toggle.handlers.click();assert(worlds[2].running);
media.matches=true;media.change();assert(worlds.every(w=>!w.running));media.matches=false;media.change();
doc.hidden=true;doc.visibilitychange();assert(worlds.every(w=>!w.running));doc.hidden=false;doc.visibilitychange();observe([{target:hero,isIntersecting:false}]);assert(!worlds[0].running);
worlds[2].time=13;interval();assert(figures[2].phase.textContent.includes('Enforce access policy'));
figures[2].handlers.worldfallback();assert(films[2].playing,'Video fallback resumes if the live context is lost');
console.log('PASS: live-scene visibility, keyboard tabs, global pause, reduced motion, background suspension, phase captions, context-loss fallback');
