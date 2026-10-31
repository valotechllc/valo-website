/* VALO homepage: a cinematic 3D view for each service tab. The buttons and slider in each panel stay the
   source of truth (they work without WebGL); this file only reads their state and stages it.
   Illustrative only. three.js is vendored under /vendor/three. */
import * as THREE from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';

const lab=document.querySelector('.hs-lab');
const views=lab?[...lab.querySelectorAll('.hs-view')]:[];
if(views.length){
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
let renderer;
try{renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});}catch(e){lab.classList.add('hs-no-webgl');throw e;}
renderer.setClearColor(0x0b0c0f,1);renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1;
const envTex=new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(renderer),.04).texture;
const camera=new THREE.PerspectiveCamera(32,1,.1,100);
const composer=new EffectComposer(renderer);const renderPass=new RenderPass(new THREE.Scene(),camera);composer.addPass(renderPass);
const bloom=new UnrealBloomPass(new THREE.Vector2(1,1),.5,.5,.6);composer.addPass(bloom);composer.addPass(new OutputPass());

const COPPER=new THREE.Color('#E8875F'),WARM=new THREE.Color('#FFB27A'),STEEL=new THREE.Color('#8D98A3'),RED=new THREE.Color('#FF5A3C'),AMBER=new THREE.Color('#F2B06B');
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)),smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t)},damp=(a,b,k,dt)=>a+(b-a)*(reduced?1:Math.min(1,dt*k));
const metal=()=>new THREE.MeshStandardMaterial({color:0x17181b,metalness:.92,roughness:.3});
const glow=c=>new THREE.MeshBasicMaterial({color:c.clone().multiplyScalar(1.6),toneMapped:false,transparent:true});
function baseScene(){
  const s=new THREE.Scene();s.environment=envTex;s.environmentIntensity=.2;s.fog=new THREE.FogExp2(0x0b0c0f,.06);
  s.add(new THREE.AmbientLight(0x2a2420,.35));
  const key=new THREE.SpotLight(0xffb784,45,40,.45,.8,1.6);key.position.set(-5,10,-6);key.target.position.set(0,1,0);s.add(key,key.target);
  const rim=new THREE.SpotLight(0xff8a55,25,30,.6,.8,1.6);rim.position.set(6,4,-6);s.add(rim);
  const g=new THREE.Mesh(new THREE.CircleGeometry(30,48),new THREE.MeshStandardMaterial({color:0x0a0a0b,metalness:.4,roughness:.7}));g.rotation.x=-Math.PI/2;s.add(g);
  return s;
}
function unit(scene,x,seamColor){
  const g=new THREE.Group();g.position.x=x;scene.add(g);
  for(let i=0;i<3;i++){const b=new THREE.Mesh(new THREE.BoxGeometry(1.8,.62,1.3),metal());b.position.y=.35+i*.66;g.add(b);
    const seam=new THREE.Mesh(new THREE.BoxGeometry(1.82,.02,1.32),glow(seamColor));seam.position.y=.04+i*.66;g.add(seam);g.userData['seam'+i]=seam;}
  return g;
}

/* ---------- migration: traffic moves from the legacy unit to the new one ---------- */
const mig=(()=>{
  const s=baseScene();const oldU=unit(s,-2.2,STEEL),newU=unit(s,2.2,COPPER);
  const N=26,src=[],streams=new THREE.InstancedMesh(new THREE.BoxGeometry(.05,.05,.32),new THREE.MeshBasicMaterial({toneMapped:false}),N*3);
  streams.instanceMatrix.setUsage(THREE.DynamicDrawUsage);streams.setColorAt(0,new THREE.Color());s.add(streams);
  for(let i=0;i<N;i++){const a=(i/(N-1)-.5)*2.4;src.push(new THREE.Vector3(Math.sin(a)*4.2,.3+(i%3)*.12,2.6+Math.cos(a)*.4));}
  const nodes=new THREE.InstancedMesh(new THREE.BoxGeometry(.08,.08,.08),glow(WARM),N);const d=new THREE.Object3D();
  src.forEach((p,i)=>{d.position.copy(p);d.updateMatrix();nodes.setMatrixAt(i,d.matrix)});s.add(nodes);
  const ring=new THREE.Mesh(new THREE.RingGeometry(1.4,1.45,64),glow(COPPER));ring.rotation.x=-Math.PI/2;ring.position.set(2.2,.02,0);s.add(ring);
  const share=new Array(N).fill(0),tmp=new THREE.Vector3(),tmp2=new THREE.Vector3(),c=new THREE.Color();
  const range=document.getElementById('hs-cutover');let v=0,t=0;
  return {scene:s,cam:{pos:[0,3.3,8.2],look:[0,.9,0]},update(dt,time){
    v=damp(v,(+range.value||0)/100,6,dt);t=time;
    let n=0;
    for(let i=0;i<N;i++){share[i]=damp(share[i],i/N<v-.001?1:0,4,dt);
      const to=tmp2.set(-2.2+4.4*share[i],1.1,0);const from=src[i];
      for(let k=0;k<3;k++){const u=((time*.45+i*.137+k/3)%1);const ctrl=tmp.copy(from).add(to).multiplyScalar(.5);ctrl.y+=1.2;
        const q=1-u;d.position.set(q*q*from.x+2*q*u*ctrl.x+u*u*to.x,q*q*from.y+2*q*u*ctrl.y+u*u*to.y,q*q*from.z+2*q*u*ctrl.z+u*u*to.z);
        const u2=Math.min(1,u+.02),q2=1-u2;d.lookAt(q2*q2*from.x+2*q2*u2*ctrl.x+u2*u2*to.x,q2*q2*from.y+2*q2*u2*ctrl.y+u2*u2*to.y,q2*q2*from.z+2*q2*u2*ctrl.z+u2*u2*to.z);
        d.updateMatrix();streams.setMatrixAt(n,d.matrix);c.copy(STEEL).lerp(WARM,share[i]).multiplyScalar(1.5);streams.setColorAt(n,c);n++;}}
    streams.count=n;streams.instanceMatrix.needsUpdate=true;streams.instanceColor.needsUpdate=true;
    for(let i=0;i<3;i++){oldU.userData['seam'+i].material.opacity=.25+.75*(1-v);newU.userData['seam'+i].material.opacity=.2+.8*v;}
    ring.material.opacity=smooth(.95,1,v)*(.6+.4*Math.sin(time*3));ring.scale.setScalar(1+smooth(.95,1,v)*.08*Math.sin(time*2));
  }};
})();

/* ---------- optimization: risky and unused rules break away from the stack ---------- */
const opt=(()=>{
  const s=baseScene();
  const rows=[...document.querySelectorAll('#hs-rules tbody tr')],btn=document.getElementById('hs-clean');
  const bars=rows.map((r,i)=>{const flag=r.classList.contains('flag');const g=new THREE.Group();
    const b=new THREE.Mesh(new THREE.BoxGeometry(3.4,.26,1.1),metal());g.add(b);
    const strip=new THREE.Mesh(new THREE.BoxGeometry(2.9,.035,.01),glow(flag?RED:WARM));strip.position.z=.56;g.add(strip);
    const tag=new THREE.Mesh(new THREE.BoxGeometry(.14,.14,.01),glow(flag?RED:COPPER));tag.position.set(-1.55,0,.56);g.add(tag);
    s.add(g);return {g,flag,strip,k:0,y:0,dir:i%2?1:-1};});
  let clean=0;
  return {scene:s,cam:{pos:[2.2,2.6,6.4],look:[0,1.4,0]},update(dt,time){
    clean=damp(clean,btn&&/original/i.test(btn.textContent)?1:0,3,dt);
    let slot=0;const n=bars.length;
    bars.forEach((b,i)=>{
      const keepY=.3+(n-1-i)*.36,cleanY=.3+(bars.filter((x,j)=>!x.flag&&j>i).length)*.36;
      if(b.flag){const f=clean;b.g.position.set(b.dir*f*3.6,keepY-f*f*2.2,-f*1.5);b.g.rotation.set(f*.6,b.dir*f*.8,b.dir*f*.9);b.strip.material.opacity=1-f*.7;}
      else{b.g.position.set(0,keepY+(cleanY-keepY)*clean,0);b.g.rotation.set(0,Math.sin(time*.3+i)*.01,0);}
      b.strip.material.color.copy(b.flag?RED:WARM).multiplyScalar(2+Math.sin(time*2+i)*.3);slot++;});
  }};
})();

/* ---------- risk: findings float, then sort into three priorities ---------- */
const risk=(()=>{
  const s=baseScene();
  const chips=[...document.querySelectorAll('#hs-pool .hs-chip')],btn=document.getElementById('hs-sort');
  const core=new THREE.Mesh(new THREE.BoxGeometry(1.6,1.6,1.6),metal());core.position.y=1.2;s.add(core);
  const coreEdge=new THREE.LineSegments(new THREE.EdgesGeometry(core.geometry),new THREE.LineBasicMaterial({color:COPPER.clone().multiplyScalar(1.6),toneMapped:false}));coreEdge.position.copy(core.position);s.add(coreEdge);
  const tiers={h:{x:-2.8,c:RED},m:{x:0,c:AMBER},l:{x:2.8,c:STEEL}};
  Object.values(tiers).forEach(t=>{const p=new THREE.Mesh(new THREE.BoxGeometry(1.7,.12,1.2),metal());p.position.set(t.x,.06,2.2);s.add(p);
    const e=new THREE.Mesh(new THREE.BoxGeometry(1.72,.02,1.22),glow(t.c));e.position.set(t.x,.13,2.2);e.material.opacity=0;t.edge=e;s.add(e);});
  const count={h:0,m:0,l:0};
  const orbs=chips.map((c,i)=>{const sev=c.dataset.sev;const m=new THREE.Mesh(new THREE.SphereGeometry(.13,20,14),glow(tiers[sev].c));s.add(m);
    const a=i/chips.length*Math.PI*2;return {m,sev,slot:count[sev]++,a,r:2.2+(i%3)*.35,h:.8+(i%4)*.45};});
  let sorted=0;
  return {scene:s,cam:{pos:[0,3.3,7.6],look:[0,1,1]},update(dt,time){
    sorted=damp(sorted,btn&&/reset/i.test(btn.textContent)?1:0,2.6,dt);
    core.rotation.y=time*.15;coreEdge.rotation.y=core.rotation.y;
    orbs.forEach((o,i)=>{const f=smooth(i*.04,i*.04+.7,sorted);const a=o.a+time*.25;
      const fx=Math.cos(a)*o.r,fy=1.2+Math.sin(time*.8+i)*.15+(o.h-1.3)*.6,fz=Math.sin(a)*o.r*.7;
      const t=tiers[o.sev];const tx=t.x+(o.slot-1)*.42,ty=.45+Math.abs(o.slot-1)*.0,tz=2.2;
      o.m.position.set(fx+(tx-fx)*f,fy+(ty-fy)*f+Math.sin(f*Math.PI)*1.2,fz+(tz-fz)*f);o.m.scale.setScalar(1+f*.3);});
    Object.values(tiers).forEach(t=>{t.edge.material.opacity=sorted*(.7+.3*Math.sin(time*2));});
  }};
})();

const scenes={'hs-p1':mig,'hs-p2':opt,'hs-p3':risk};
let active=null,W=1,H=1;
function mount(){const panel=lab.querySelector('[role="tabpanel"]:not([hidden])');if(!panel)return;const view=panel.querySelector('.hs-view');if(!view)return;
  if(renderer.domElement.parentNode!==view)view.appendChild(renderer.domElement);active=scenes[panel.id];renderPass.scene=active.scene;size();}
function size(){const v=renderer.domElement.parentNode;if(!v)return;const r=v.getBoundingClientRect();W=Math.max(1,r.width);H=Math.max(1,r.height);
  const dpr=Math.min(devicePixelRatio||1,W<600?1.5:1.75);renderer.setPixelRatio(dpr);renderer.setSize(W,H,false);composer.setPixelRatio(dpr);composer.setSize(W,H);bloom.resolution.set(W*.5,H*.5);
  camera.aspect=W/H;camera.fov=W<500?44:32;camera.updateProjectionMatrix();}
new MutationObserver(mount).observe(lab,{attributes:true,subtree:true,attributeFilter:['hidden']});
new ResizeObserver(size).observe(lab);
lab.classList.add('hs-3d');mount();

let px=0,py=0;lab.addEventListener('pointermove',e=>{const r=lab.getBoundingClientRect();px=(e.clientX-r.left)/r.width-.5;py=(e.clientY-r.top)/r.height-.5;});
let visible=false;new IntersectionObserver(es=>{visible=es[0].isIntersecting}).observe(lab);
let time=0,last=performance.now();
const look=new THREE.Vector3();
function frame(now){requestAnimationFrame(frame);const dt=Math.min(.05,(now-last)/1000);last=now;
  if(!visible||document.hidden||!active)return;
  const still=reduced||document.documentElement.classList.contains('motion-stopped');if(!still)time+=dt;
  active.update(dt,time);
  const [x,y,z]=active.cam.pos,drift=still?0:Math.sin(time*.1)*.6;
  camera.position.set(x+drift+px*1.2,y-py*.6,z);look.set(...active.cam.look);camera.lookAt(look);
  composer.render();}
requestAnimationFrame(frame);
}
