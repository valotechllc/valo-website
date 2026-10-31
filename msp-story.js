/* VALO MSP story: scroll-driven 3D scene for the MSP white-label engagement.
   Illustrative only. three.js is vendored under /vendor/three. */
import * as THREE from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';

const story=document.getElementById('msp-story');if(!story)throw 0;const stage=story.querySelector('.ms-stage'),labelsEl=story.querySelector('.ms-labels');
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
let renderer;
try{renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});}catch(e){story.classList.add('ms-no-webgl');throw e;}
renderer.setClearColor(0,0);renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;
stage.appendChild(renderer.domElement);
const scene=new THREE.Scene();scene.fog=new THREE.FogExp2(0x0a0a0b,.026);
const pmrem=new THREE.PMREMGenerator(renderer);scene.environment=pmrem.fromScene(new RoomEnvironment(renderer),.04).texture;
const camera=new THREE.PerspectiveCamera(34,1,.1,220);

const COL={ice:new THREE.Color('#B9C2CC'),mint:new THREE.Color('#FFB27A'),copper:new THREE.Color('#E8876A'),red:new THREE.Color('#FF4A2C'),cream:new THREE.Color('#F4F1EA')};
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)),smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t)},mix=(a,b,t)=>a+(b-a)*t;
const bump=(a,b,c,d,x)=>smooth(a,b,x)*(1-smooth(c,d,x));

/* lighting: soft studio environment for reflections, a cool key, and the copper glow of VALO inside */
scene.add(new THREE.HemisphereLight(0x8a7a6c,0x080808,.3));
const key=new THREE.DirectionalLight(0xffd2b0,1.3);key.position.set(-8,14,10);scene.add(key);
const rim=new THREE.PointLight(0xff8a55,26,40,1.7);rim.position.set(8,6,-10);scene.add(rim);
const valoLight=new THREE.PointLight(0xE8876A,0,12,1.5);valoLight.position.set(0,2.6,0);scene.add(valoLight);

/* floor: blueprint dot grid with a soft vignette */
const floorMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{uFocus:{value:new THREE.Vector2(0,0)},uHL:{value:0}},
vertexShader:`varying vec2 vP;void main(){vP=position.xy;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
fragmentShader:`varying vec2 vP;uniform vec2 uFocus;uniform float uHL;void main(){vec2 g=fract(vP*1.1)-.5;float d=smoothstep(.06,0.,length(g));float r=length(vP);float fade=smoothstep(26.,4.,r);
vec2 l=abs(fract(vP*.22)-.5);float line=smoothstep(.012,0.,min(l.x,l.y))*.35;float near=smoothstep(4.,0.,length(vP-uFocus))*uHL;
vec3 c=vec3(.45,.36,.29)*(d*.35+line*.25)*fade+vec3(1.,.7,.48)*near*(d+.2)*.6;gl_FragColor=vec4(c,clamp((d*.5+line*.3)*fade+near*.25,0.,1.));}`});
const floor=new THREE.Mesh(new THREE.PlaneGeometry(70,70),floorMat);floor.rotation.x=-Math.PI/2;scene.add(floor);

/* clients: six real-world client types the MSP looks after */
const CLIENTS=['Dental clinic','Law firm','County office','Credit union','Manufacturer','School district'];
const darkMetal=new THREE.MeshStandardMaterial({color:0x18191c,metalness:.85,roughness:.32});
const rackMat=new THREE.MeshStandardMaterial({color:0x222428,metalness:.7,roughness:.28});
const clients=CLIENTS.map((name,i)=>{
  const a=i/CLIENTS.length*Math.PI*2+.55,R=11;
  const g=new THREE.Group();g.position.set(Math.cos(a)*R,0,Math.sin(a)*R);scene.add(g);
  const pad=new THREE.Mesh(new THREE.CylinderGeometry(1.7,1.8,.24,6),darkMetal);pad.position.y=.12;g.add(pad);
  const edge=new THREE.LineSegments(new THREE.EdgesGeometry(pad.geometry),new THREE.LineBasicMaterial({color:COL.ice.clone(),transparent:true,opacity:.55,toneMapped:false}));edge.position.y=.12;g.add(edge);
  const n=5,racks=new THREE.InstancedMesh(new THREE.BoxGeometry(.36,1,.5),rackMat,n),leds=new THREE.InstancedMesh(new THREE.BoxGeometry(.3,.03,.02),new THREE.MeshBasicMaterial({color:COL.ice.clone().multiplyScalar(2.2),toneMapped:false}),n*3);
  const d=new THREE.Object3D();
  for(let k=0;k<n;k++){const h=.5+((k*7+i*3)%5)*.22,x=(k-2)*.5,z=(k%2)*.35-.15;d.position.set(x,.24+h/2,z);d.scale.set(1,h,1);d.rotation.y=0;d.updateMatrix();racks.setMatrixAt(k,d.matrix);
    for(let j=0;j<3;j++){d.position.set(x,.36+j*h/3.2,z+.26);d.scale.set(1,1,1);d.updateMatrix();leds.setMatrixAt(k*3+j,d.matrix);}}
  g.add(racks,leds);g.lookAt(0,0,0);
  const ring=new THREE.Mesh(new THREE.RingGeometry(2.25,2.32,6,1),new THREE.MeshBasicMaterial({color:COL.copper.clone().multiplyScalar(2),transparent:true,opacity:0,toneMapped:false,side:THREE.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.rotation.z=Math.PI/6;ring.position.y=.03;g.add(ring);
  return {name,g,edge,leds,ring,pos:g.position};
});
const HL=0; // the client this engagement is for

/* the MSP: a glass building. Frosted from outside, clear when we step behind it */
const glassMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,uniforms:{uClear:{value:0},uTime:{value:0}},
vertexShader:`varying vec3 vN;varying vec3 vV;varying vec2 vU;void main(){vec4 w=modelMatrix*vec4(position,1.);vN=normalize(mat3(modelMatrix)*normal);vV=normalize(cameraPosition-w.xyz);vU=uv;gl_Position=projectionMatrix*viewMatrix*w;}`,
fragmentShader:`varying vec3 vN;varying vec3 vV;varying vec2 vU;uniform float uClear,uTime;void main(){float f=pow(1.-abs(dot(normalize(vN),vV)),2.4);
float frost=mix(.62,.04,uClear);float streak=smoothstep(.0,.02,abs(fract(vU.x*6.+vU.y*.6-uTime*.03)-.5))*.0+smoothstep(.49,.5,fract(vU.x*6.))*.08;
vec3 c=mix(vec3(.07,.065,.06),vec3(.4,.33,.27),f)*(1.+streak);float a=frost+f*mix(.5,.3,uClear)+streak*.5;gl_FragColor=vec4(c,clamp(a,0.,.92));}`});
const msp=new THREE.Group();scene.add(msp);
const SHELL_R=4.1,SHELL_H=3.4;
const shell=new THREE.Mesh(new THREE.CylinderGeometry(SHELL_R,SHELL_R,SHELL_H,6,1,true),glassMat);shell.position.y=SHELL_H/2+.3;shell.renderOrder=5;msp.add(shell);
const roof=new THREE.Mesh(new THREE.CircleGeometry(SHELL_R,6),glassMat);roof.rotation.x=-Math.PI/2;roof.rotation.z=Math.PI/2;roof.position.y=SHELL_H+.3;roof.renderOrder=5;msp.add(roof);
const frameMat=new THREE.LineBasicMaterial({color:COL.cream.clone().multiplyScalar(.9),transparent:true,opacity:.55,toneMapped:false});
const shellFrame=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.CylinderGeometry(SHELL_R,SHELL_R,SHELL_H,6,1)),frameMat);shellFrame.position.copy(shell.position);msp.add(shellFrame);
const base=new THREE.Mesh(new THREE.CylinderGeometry(SHELL_R+.3,SHELL_R+.45,.3,6),darkMetal);base.position.y=.15;msp.add(base);
const baseGlow=new THREE.LineSegments(new THREE.EdgesGeometry(base.geometry),new THREE.LineBasicMaterial({color:COL.ice.clone().multiplyScalar(1.4),toneMapped:false,transparent:true,opacity:.6}));baseGlow.position.y=.15;msp.add(baseGlow);
// the MSP's own desks along the walls, so the inside reads as a working space
for(let k=0;k<6;k++){const a=k/6*Math.PI*2+Math.PI/6,desk=new THREE.Mesh(new THREE.BoxGeometry(1.4,.5,.5),rackMat);desk.position.set(Math.cos(a)*3.1,.55,Math.sin(a)*3.1);desk.lookAt(0,.55,0);msp.add(desk);
  const scr=new THREE.Mesh(new THREE.PlaneGeometry(1,.45),new THREE.MeshBasicMaterial({color:COL.ice.clone().multiplyScalar(.9),toneMapped:false,transparent:true,opacity:.5}));scr.position.set(Math.cos(a)*3.25,1.1,Math.sin(a)*3.25);scr.lookAt(0,1.1,0);msp.add(scr);}

/* VALO inside: a firewall assembled tier by tier under a copper engineering core */
const fw=new THREE.Group();scene.add(fw);
const slabMat=new THREE.MeshStandardMaterial({color:0x26272b,metalness:.9,roughness:.22});
const slabs=[];
for(let k=0;k<7;k++){const s=new THREE.Mesh(new THREE.BoxGeometry(2,.16,1.2),slabMat);const e=new THREE.LineSegments(new THREE.EdgesGeometry(s.geometry),new THREE.LineBasicMaterial({color:COL.copper.clone().multiplyScalar(1.8),toneMapped:false,transparent:true,opacity:0}));s.add(e);
  const strip=new THREE.Mesh(new THREE.BoxGeometry(1.5,.025,.01),new THREE.MeshBasicMaterial({color:COL.ice.clone().multiplyScalar(2),toneMapped:false,transparent:true,opacity:0}));strip.position.set(0,0,.61);s.add(strip);
  s.userData={y:.55+k*.24,e,strip,spin:(k%2?1:-1)*.6};fw.add(s);slabs.push(s);}
const coreGeo=new THREE.OctahedronGeometry(.32,0);
const core=new THREE.Mesh(coreGeo,new THREE.MeshStandardMaterial({color:0xE8876A,emissive:0xE8876A,emissiveIntensity:2.2,metalness:.3,roughness:.3}));core.position.y=2.8;fw.add(core);
const coreRing=new THREE.Mesh(new THREE.TorusGeometry(.62,.012,6,96),new THREE.MeshBasicMaterial({color:COL.copper.clone().multiplyScalar(2.2),toneMapped:false,transparent:true}));coreRing.position.y=2.8;coreRing.rotation.x=Math.PI/2;fw.add(coreRing);
const scan=new THREE.Mesh(new THREE.BoxGeometry(2.6,.02,1.8),new THREE.MeshBasicMaterial({color:COL.mint.clone().multiplyScalar(2.4),toneMapped:false,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending}));fw.add(scan);

/* light traffic: instanced streaks */
const MAX=360;
const streaks=new THREE.InstancedMesh(new THREE.BoxGeometry(.055,.055,.46),new THREE.MeshBasicMaterial({toneMapped:false}),MAX);streaks.instanceMatrix.setUsage(THREE.DynamicDrawUsage);streaks.setColorAt(0,new THREE.Color());scene.add(streaks);
const pool=Array.from({length:MAX},()=>({on:false,a:new THREE.Vector3(),b:new THREE.Vector3(),c:new THREE.Vector3()}));
function send(a,b,arc,color,speed,bounce=false){const p=pool.find(q=>!q.on);if(!p)return;p.on=true;p.a.copy(a);p.b.copy(b);p.c.copy(a).add(b).multiplyScalar(.5);p.c.y+=arc;p.t=0;p.col=color;p.speed=speed;p.bounce=bounce;}
const bz=(p,t,o)=>{const u=1-t;return o.set(u*u*p.a.x+2*u*t*p.c.x+t*t*p.b.x,u*u*p.a.y+2*u*t*p.c.y+t*t*p.b.y,u*u*p.a.z+2*u*t*p.c.z+t*t*p.b.z)};
const edgeOf=v=>v.clone().setY(0).normalize().multiplyScalar(SHELL_R).setY(1.4);

/* labels */
function tag(cls,html){const el=document.createElement('div');el.className='ms-tag '+cls.split(' ').map(c=>'ms-'+c).join(' ');el.innerHTML=html;labelsEl.appendChild(el);return el;}
clients.forEach((c,i)=>{c.tag=tag(i===HL?'client hl':'client',`<i></i>${c.name}`);});
const mspTag=tag('msp','Your MSP'),valoTag=tag('valo','<i></i>VALO engineering');

/* camera choreography: one key per chapter */
const KEYS=[
  {p:[2,15,27],t:[0,1.2,0]},
  {p:[17,12,15],t:[4,1.6,3]},
  {p:[4.2,3.9,6.2],t:[0,1.6,0]},
  {p:[-4.6,2.7,5.2],t:[0,1.5,0]},
  {p:[-6,19,22],t:[2.5,0,3]}
];
const camPos=new THREE.Vector3(...KEYS[0].p),camTgt=new THREE.Vector3(...KEYS[0].t),wantPos=new THREE.Vector3(),wantTgt=new THREE.Vector3();
function keyAt(s){const i=Math.min(3,Math.floor(s)),f=smooth(0,1,s-i);const A=KEYS[i],B=KEYS[i+1];wantPos.set(mix(A.p[0],B.p[0],f),mix(A.p[1],B.p[1],f),mix(A.p[2],B.p[2],f));wantTgt.set(mix(A.t[0],B.t[0],f),mix(A.t[1],B.t[1],f),mix(A.t[2],B.t[2],f));}

/* post */
const composer=new EffectComposer(renderer);composer.addPass(new RenderPass(scene,camera));
const bloom=new UnrealBloomPass(new THREE.Vector2(1,1),.7,.55,.3);composer.addPass(bloom);composer.addPass(new OutputPass());
let W=1,H=1,mobile=false;
function resize(){const r=stage.getBoundingClientRect();W=Math.max(1,r.width);H=Math.max(1,r.height);mobile=W<860;
  const dpr=Math.min(devicePixelRatio||1,mobile?1.5:1.75);renderer.setPixelRatio(dpr);renderer.setSize(W,H,false);composer.setPixelRatio(dpr);composer.setSize(W,H);bloom.resolution.set(W*(mobile?.5:.7),H*(mobile?.5:.7));
  camera.aspect=W/H;camera.fov=mobile?50:34;
  if(mobile)camera.setViewOffset(W,H,0,H*.17,W,H);else camera.setViewOffset(W,H,-W*.17,0,W,H);
  camera.updateProjectionMatrix();}
new ResizeObserver(resize).observe(stage);resize();

/* scroll → story position (0..4) */
const chapters=[...story.querySelectorAll('.ms-chapter')],railBtns=[...story.querySelectorAll('.ms-rail button')],cue=story.querySelector('.ms-scrollcue');
let target=0,pos=0,active=-1;
function readScroll(){const r=story.getBoundingClientRect(),span=r.height-innerHeight;target=clamp(-r.top/Math.max(1,span))*4.0;}
addEventListener('scroll',readScroll,{passive:true});readScroll();
railBtns.forEach(b=>b.addEventListener('click',()=>{const k=+b.dataset.go,span=story.offsetHeight-innerHeight;scrollTo({top:story.offsetTop+span*k/4+1,behavior:reduced?'auto':'smooth'});}));
function setChapter(k){if(k===active)return;active=k;chapters.forEach((c,i)=>c.classList.toggle('ms-on',i===k));railBtns.forEach((b,i)=>{if(i===k)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current');});}

let px=0,py=0;addEventListener('pointermove',e=>{if(e.pointerType==='touch')return;px=e.clientX/innerWidth-.5;py=e.clientY/innerHeight-.5;});
let visible=true;new IntersectionObserver(es=>{visible=es[0].isIntersecting}).observe(story);

const tmp=new THREE.Vector3(),tmp2=new THREE.Vector3(),dummy=new THREE.Object3D(),col=new THREE.Color();
let time=0,last=performance.now(),acc={tickets:0,eng:0,test:0,hand:0};
function frame(now){
  const dt=Math.min(.05,(now-last)/1000);last=now;requestAnimationFrame(frame);
  if(!visible||document.hidden)return;
  // the site-wide 'Pause animations' control stops ambient motion here too; scrolling still drives the story
  const still=reduced||document.documentElement.classList.contains('motion-stopped');
  time+=still?0:dt;
  pos+= (target-pos)*(reduced?1:Math.min(1,dt*4.5));
  const s=pos;setChapter(Math.round(clamp(s,0,4)));cue.style.opacity=String(1-smooth(.05,.3,s));

  // story parameters derived from scroll
  const scope=bump(.55,1,1.6,2.1,s),clear=bump(1.35,2,3.4,3.85,s),build=smooth(1.5,2.35,s),validate=bump(2.5,2.9,3.5,3.8,s),hand=smooth(3.35,3.95,s);
  glassMat.uniforms.uClear.value=clear;glassMat.uniforms.uTime.value=time;frameMat.opacity=.55-clear*.25;
  valoLight.intensity=mix(2,26,clear)+Math.sin(time*3)*clear*2;
  core.rotation.y=time*.9;core.rotation.x=time*.4;core.scale.setScalar(.6+clear*.6);coreRing.rotation.z=time*1.4;coreRing.material.opacity=clear;
  slabs.forEach((sl,k)=>{const f=smooth(k/7*.7,k/7*.7+.3,build);sl.position.y=sl.userData.y+(1-f)*(3.5+k*.4);sl.rotation.y=(1-f)*sl.userData.spin*2;sl.visible=f>.001||clear>.05;
    sl.userData.e.material.opacity=f*clear*.95;sl.userData.strip.material.opacity=f*(.35+validate*.65);sl.userData.strip.material.color.copy(validate>.2?COL.mint:COL.ice).multiplyScalar(2);});
  const sweep=(time*.55)%1;scan.position.y=.4+sweep*1.9;scan.material.opacity=validate*(1-Math.abs(sweep-.5)*1.2)*.32;
  clients.forEach((c,i)=>{const hl=i===HL;c.ring.material.opacity=hl?scope*.9:0;
    const tint=hl?hand:0;c.edge.material.color.copy(COL.ice).lerp(COL.mint,tint).multiplyScalar(1.2+tint);c.leds.material.color.copy(COL.ice).lerp(COL.mint,tint).multiplyScalar(2.2);});
  floorMat.uniforms.uFocus.value.set(clients[HL].pos.x,-clients[HL].pos.z);floorMat.uniforms.uHL.value=Math.max(scope,hand);

  // traffic for each chapter
  if(!still){
    acc.tickets+=dt*(3.2*(1-clear*.6));while(acc.tickets>1){acc.tickets--;const c=clients[Math.floor(Math.random()*clients.length)];send(tmp.copy(c.pos).setY(.8),edgeOf(c.pos),1.5,COL.ice,.45+Math.random()*.2);}
    acc.eng+=dt*clear*(build<1?14:4);while(acc.eng>1){acc.eng--;const a=Math.random()*Math.PI*2;send(tmp.set(Math.cos(a)*3,1.1,Math.sin(a)*3),tmp2.set(0,.6+Math.random()*1.6,0),.8,COL.copper,.9);}
    acc.test+=dt*validate*12;while(acc.test>1){acc.test--;const a=Math.random()*Math.PI*2,bad=Math.random()<.3;send(tmp.set(Math.cos(a)*3.6,.9+Math.random(),Math.sin(a)*3.6),tmp2.set(0,1.2,0),.4,bad?COL.red:COL.mint,1.1,bad);}
    acc.hand+=dt*hand*(1-smooth(3.97,4,s)*.5)*9;while(acc.hand>1){acc.hand--;const c=clients[HL];send(edgeOf(c.pos),tmp.copy(c.pos).setY(.8),2.4,COL.mint,.55);}
  }
  let n=0;
  for(const p of pool){if(!p.on)continue;p.t+=dt*p.speed;
    // a failed test packet stops short of the firewall: denied
    if(p.bounce&&p.t>.72){p.on=false;continue;}
    if(p.t>=1){p.on=false;continue;}
    bz(p,p.t,dummy.position);bz(p,Math.min(1,p.t+.02),tmp);dummy.lookAt(tmp);dummy.scale.set(1,1,1);dummy.updateMatrix();streaks.setMatrixAt(n,dummy.matrix);col.copy(p.col).multiplyScalar(2.4);streaks.setColorAt(n,col);n++;}
  streaks.count=n;streaks.instanceMatrix.needsUpdate=true;if(streaks.instanceColor)streaks.instanceColor.needsUpdate=true;

  // camera
  keyAt(clamp(s,0,4));
  const k=reduced?1:Math.min(1,dt*3);camPos.lerp(wantPos,k);camTgt.lerp(wantTgt,k);
  const drift=reduced?0:Math.sin(time*.12)*.6;
  camera.position.set(camPos.x+px*1.4+drift,camPos.y-py*.9,camPos.z);camera.lookAt(camTgt);

  // labels
  const place=(el,v,op)=>{v.project(camera);const x=(v.x*.5+.5)*W,y=(-v.y*.5+.5)*H;const inView=v.z<1&&x>-40&&x<W+40&&y>-20&&y<H+20;el.style.transform=`translate(${x}px,${y}px) translate(-50%,-50%)`;el.style.opacity=String(inView?op:0);};
  clients.forEach((c,i)=>place(c.tag,tmp.copy(c.pos).setY(2.2),(1-clear*.85)*(i===HL?1:.75)));
  place(mspTag,tmp.set(0,SHELL_H+1.1,0),1-clear);
  place(valoTag,tmp.set(0,3.55,0),clear);
  composer.render();
}
requestAnimationFrame(frame);
