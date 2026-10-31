/* VALO homepage hero: interactive policy simulation. Illustrative only. three.js is vendored under /vendor/three. */
import * as THREE from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';

const hero=document.getElementById('hh');if(!hero)throw 0;const stage=hero.querySelector('.hh-stage'),labelsEl=hero.querySelector('.hh-labels');
const reducedQuery=matchMedia('(prefers-reduced-motion: reduce)');
let reduced=reducedQuery.matches,userPaused=false;

let renderer;
try{renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});}
catch(e){hero.classList.add('hh-no-webgl');throw e;}
renderer.setClearColor(0x000000,0);
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
stage.appendChild(renderer.domElement);

const scene=new THREE.Scene();
scene.fog=new THREE.FogExp2(0x0b111b,.026);
const pmrem=new THREE.PMREMGenerator(renderer);scene.environment=pmrem.fromScene(new RoomEnvironment(renderer),.04).texture;
const camera=new THREE.PerspectiveCamera(36,1,.1,200);

const C={ice:new THREE.Color('#7FD3EA'),mint:new THREE.Color('#7FE3B8'),copper:new THREE.Color('#E07A5F'),threat:new THREE.Color('#FF4A2C'),steel:new THREE.Color('#1c2838'),deep:new THREE.Color('#0e1724')};

/* ---------- ground: dot grid with a policy pulse that sweeps out from the gateway ---------- */
const groundMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{uTime:{value:0},uPulse:{value:0},uBreach:{value:0}},
vertexShader:`varying vec2 vP;void main(){vP=position.xy;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
fragmentShader:`varying vec2 vP;uniform float uTime,uPulse,uBreach;
void main(){vec2 g=fract(vP*1.25)-.5;float dotm=smoothstep(.07,.0,length(g));float r=length(vP);
float fade=smoothstep(17.,3.,r);float ring=smoothstep(.55,0.,abs(r-uPulse))*smoothstep(16.,4.,uPulse);
vec3 base=mix(vec3(.30,.55,.68),vec3(1.,.33,.2),uBreach);
vec3 col=base*dotm*.32*fade+vec3(.88,.48,.37)*ring*(.25+dotm*1.4)*fade;
float a=clamp(dotm*.55*fade+ring*.35*fade,0.,1.);gl_FragColor=vec4(col,a);}`});
const ground=new THREE.Mesh(new THREE.PlaneGeometry(40,40),groundMat);ground.rotation.x=-Math.PI/2;ground.position.y=-.02;scene.add(ground);

/* ---------- the policy gateway at the center ---------- */
const core=new THREE.Group();scene.add(core);
const metal=new THREE.MeshStandardMaterial({color:0x2a3a4e,metalness:.9,roughness:.22});
const hexBody=new THREE.Mesh(new THREE.CylinderGeometry(.95,1.1,2.4,6,1),metal);hexBody.position.y=1.2;core.add(hexBody);
const edgeMat=new THREE.LineBasicMaterial({color:C.copper,transparent:true,opacity:.9,toneMapped:false});
const hexEdges=new THREE.LineSegments(new THREE.EdgesGeometry(hexBody.geometry),edgeMat);hexEdges.position.copy(hexBody.position);core.add(hexEdges);
const coreGlowMat=new THREE.MeshBasicMaterial({color:C.copper.clone().multiplyScalar(2.2),toneMapped:false});
const coreCap=new THREE.Mesh(new THREE.CylinderGeometry(.6,.6,.06,6),coreGlowMat);coreCap.position.y=2.44;core.add(coreCap);
const rings=[];
[[1.7,.025,0],[2.05,.018,.5],[2.45,.012,-.35]].forEach(([r,t,tilt],i)=>{
  const m=new THREE.MeshBasicMaterial({color:(i===0?C.copper:C.ice).clone().multiplyScalar(i===0?1.8:1.1),toneMapped:false,transparent:true,opacity:i===0?.95:.55});
  const ring=new THREE.Mesh(new THREE.TorusGeometry(r,t,8,160),m);ring.rotation.x=Math.PI/2+tilt*.25;ring.position.y=1.2+i*.12;ring.userData={speed:(i%2?-1:1)*(.25+i*.12),tilt};core.add(ring);rings.push(ring);
});
// a vertical beam of light that brightens when the gateway drops something
const beamMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{uI:{value:.35},uC:{value:C.copper.clone()}},
vertexShader:`varying vec2 vU;void main(){vU=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
fragmentShader:`varying vec2 vU;uniform float uI;uniform vec3 uC;void main(){float a=(1.-vU.y)*(1.-vU.y)*uI*(.6+.4*sin(vU.x*6.2831*3.));gl_FragColor=vec4(uC*a*1.6,a);}`});
const beam=new THREE.Mesh(new THREE.CylinderGeometry(.55,.75,9,6,1,true),beamMat);beam.position.y=6.9;core.add(beam);
const coreLight=new THREE.PointLight(0xE07A5F,18,14,1.6);coreLight.position.set(0,2.6,0);scene.add(coreLight);
scene.add(new THREE.HemisphereLight(0x8fb6cc,0x0b111b,.55));
const key=new THREE.DirectionalLight(0xbcd6e6,1.1);key.position.set(-6,10,6);scene.add(key);

/* ---------- five trust zones ---------- */
const ZONES=[
  {name:'Users & devices',short:'Users'},
  {name:'Cloud services',short:'Cloud'},
  {name:'Applications',short:'Apps'},
  {name:'Data center',short:'Data'},
  {name:'Branch offices',short:'Branch'}
];
const R=6.2;
const zoneMeshes=[];
ZONES.forEach((z,i)=>{
  const a=-Math.PI/2+i*(Math.PI*2/ZONES.length)+.32;
  z.pos=new THREE.Vector3(Math.cos(a)*R,0,Math.sin(a)*R);
  z.infect=0;z.lift=0;z.hover=0;z.spawnTimer=0;
  const g=new THREE.Group();g.position.copy(z.pos);scene.add(g);z.group=g;
  const plat=new THREE.Mesh(new THREE.CylinderGeometry(1.9,2,.22,6),new THREE.MeshStandardMaterial({color:0x1a2533,metalness:.85,roughness:.32}));plat.position.y=.11;plat.userData.zone=i;g.add(plat);zoneMeshes.push(plat);
  z.edge=new THREE.LineSegments(new THREE.EdgesGeometry(plat.geometry),new THREE.LineBasicMaterial({color:C.ice.clone(),transparent:true,opacity:.7,toneMapped:false}));z.edge.position.copy(plat.position);g.add(z.edge);
  // devices: instanced towers with lit tops
  const n=7,towers=new THREE.InstancedMesh(new THREE.BoxGeometry(.32,1,.32),new THREE.MeshStandardMaterial({color:0x24364a,metalness:.7,roughness:.28}),n);
  const tops=new THREE.InstancedMesh(new THREE.BoxGeometry(.26,.04,.26),new THREE.MeshBasicMaterial({color:C.ice.clone().multiplyScalar(1.6),toneMapped:false}),n);
  const d=new THREE.Object3D();
  for(let k=0;k<n;k++){const ang=k/n*Math.PI*2+i,rad=k===0?0:.95,h=.35+((k*37+i*13)%10)/10*1.1;
    d.position.set(Math.cos(ang)*rad,.22+h/2,Math.sin(ang)*rad);d.scale.set(1,h,1);d.updateMatrix();towers.setMatrixAt(k,d.matrix);
    d.position.y=.22+h+.03;d.scale.set(1,1,1);d.updateMatrix();tops.setMatrixAt(k,d.matrix);}
  g.add(towers,tops);z.tops=tops;
  // segmentation wall: a glowing hex fence that rises and falls
  z.wallMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,uniforms:{uC:{value:C.ice.clone()},uH:{value:1},uT:{value:0}},
    vertexShader:`varying vec2 vU;void main(){vU=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`varying vec2 vU;uniform vec3 uC;uniform float uH,uT;void main(){if(vU.y>uH)discard;float a=pow(1.-vU.y/max(uH,.001),2.)*.26;float scan=smoothstep(.04,0.,abs(fract(vU.y*3.-uT*.6)-.5)-.45)*.4;float top=smoothstep(.03,0.,abs(vU.y-uH+.01))*1.2;gl_FragColor=vec4(uC*(a+scan*a*2.+top*uH),a+top*uH*.6);}`});
  const wall=new THREE.Mesh(new THREE.CylinderGeometry(2.25,2.25,1.8,6,1,true),z.wallMat);wall.position.y=.9;g.add(wall);
  z.label=document.createElement('button');z.label.type='button';z.label.className='hh-zone';
  z.label.innerHTML=`<i></i><span class="hh-full">${z.name}</span><span class="hh-short">${z.short}</span><span class="hh-verb">· attack</span>`;
  z.label.setAttribute('aria-label',`Send a test attack from ${z.name}`);
  z.label.addEventListener('click',()=>launchAttack(i));
  // hold the camera still while a label is targeted, so the button does not drift away from the pointer
  z.label.addEventListener('pointerenter',()=>{labelHover=i});z.label.addEventListener('pointerleave',()=>{labelHover=-1});
  z.label.addEventListener('focus',()=>{labelHover=i});z.label.addEventListener('blur',()=>{labelHover=-1});
  labelsEl.appendChild(z.label);
});

/* ---------- packets ---------- */
const MAX=420;
const pGeo=new THREE.BoxGeometry(.06,.06,.42);
const pMat=new THREE.MeshBasicMaterial({toneMapped:false});
const packets=new THREE.InstancedMesh(pGeo,pMat,MAX);packets.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
packets.setColorAt(0,new THREE.Color());scene.add(packets);
const pool=[];for(let i=0;i<MAX;i++)pool.push({on:false});
const CORE=new THREE.Vector3(0,1.25,0);
const tmpA=new THREE.Vector3(),tmpB=new THREE.Vector3(),tmpC=new THREE.Vector3(),dummy=new THREE.Object3D(),col=new THREE.Color();
function bez(a,c,b,t,out){const u=1-t;return out.set(u*u*a.x+2*u*t*c.x+t*t*b.x,u*u*a.y+2*u*t*c.y+t*t*b.y,u*u*a.z+2*u*t*c.z+t*t*b.z)}
function lift(v,h){return tmpC.copy(v).setY(h)}
function zoneOut(i){return tmpA.copy(ZONES[i].pos).setY(.9)}
function pointOn(p,t,out){
  const A=ZONES[p.from].pos,B=ZONES[p.to].pos;
  if(p.via){
    if(t<.5){const u=t*2;const a=new THREE.Vector3(A.x,.9,A.z),c=new THREE.Vector3(A.x*.45,2.2+p.h,A.z*.45);return bez(a,c,CORE,u,out);}
    const u=(t-.5)*2;const b=new THREE.Vector3(B.x,.9,B.z),c=new THREE.Vector3(B.x*.45,2.2+p.h,B.z*.45);return bez(CORE,c,b,u,out);
  }
  const a=new THREE.Vector3(A.x,.9,A.z),b=new THREE.Vector3(B.x,.9,B.z),c=a.clone().add(b).multiplyScalar(.5);c.y=3.4+p.h;
  // push the arc outward so lateral movement visibly bypasses the gateway
  const out2=c.clone().setY(0).normalize().multiplyScalar(2.2);c.add(out2);
  return bez(a,c,b,t,out);
}
function spawn(from,to,threat){
  const p=pool.find(q=>!q.on);if(!p)return;
  Object.assign(p,{on:true,from,to,threat,t:0,via:segmented,speed:(threat?.22:.3)*(.8+Math.random()*.4),h:Math.random()*.8,passed:false});
}

/* ---------- bursts and shockwaves ---------- */
const BMAX=900,bPos=new Float32Array(BMAX*3),bCol=new Float32Array(BMAX*3),bVel=new Float32Array(BMAX*3),bLife=new Float32Array(BMAX);
const bGeo=new THREE.BufferGeometry();bGeo.setAttribute('position',new THREE.BufferAttribute(bPos,3).setUsage(THREE.DynamicDrawUsage));bGeo.setAttribute('color',new THREE.BufferAttribute(bCol,3).setUsage(THREE.DynamicDrawUsage));
const spr=document.createElement('canvas');spr.width=spr.height=64;{const x=spr.getContext('2d'),gr=x.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,'#fff');gr.addColorStop(.25,'rgba(255,255,255,.6)');gr.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=gr;x.fillRect(0,0,64,64);}
const bMat=new THREE.PointsMaterial({size:.22,map:new THREE.CanvasTexture(spr),vertexColors:true,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false});
scene.add(new THREE.Points(bGeo,bMat));
let bHead=0;
function burst(pos,color,n=40,power=3){for(let k=0;k<n;k++){const i=bHead=(bHead+1)%BMAX;bPos.set([pos.x,pos.y,pos.z],i*3);
  const th=Math.random()*Math.PI*2,ph=Math.acos(2*Math.random()-1),s=power*(.4+Math.random()*.6);
  bVel.set([Math.sin(ph)*Math.cos(th)*s,Math.abs(Math.cos(ph))*s*.8,Math.sin(ph)*Math.sin(th)*s],i*3);bLife[i]=1;bCol.set([color.r*2,color.g*2,color.b*2],i*3);}}
const waves=[];for(let i=0;i<8;i++){const m=new THREE.Mesh(new THREE.RingGeometry(.9,1,96),new THREE.MeshBasicMaterial({color:C.copper.clone().multiplyScalar(2),transparent:true,opacity:0,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false}));m.rotation.x=-Math.PI/2;m.visible=false;scene.add(m);waves.push({m,life:0});}
function shock(pos,color,size=5.5){const w=waves.find(q=>q.life<=0)||waves[0];w.life=1;w.size=size;w.m.position.copy(pos).setY(.05);w.m.material.color.copy(color).multiplyScalar(2);w.m.visible=true;}

/* ---------- state + UI ---------- */
let wasExposed=0,labelHover=-1,orbitT=0,segmented=true,blocked=0,flash=0,pulse=0;
const $=id=>document.getElementById('hh-'+id);
const segBtn=$('seg'),statusEl=$('status'),consoleEl=hero.querySelector('.hh-console');
function setStatus(t){statusEl.textContent=t;}
function exposedCount(){return ZONES.filter(z=>z.infect>.5).length}
function updateHUD(){
  $('blocked').textContent=blocked;const ex=exposedCount();$('exposed').textContent=`${ex} / ${ZONES.length}`;
  $('exposed-box').classList.toggle('bad',ex>0);consoleEl.dataset.state=segmented?'secure':'exposed';
  ZONES.forEach(z=>z.label.dataset.infected=String(z.infect>.5));
}
segBtn.addEventListener('click',()=>{
  segmented=!segmented;segBtn.setAttribute('aria-pressed',String(segmented));$('seg-word').textContent=segmented?'on':'off';$('mode-label').textContent=segmented?'Segmented':'Flat network';
  pool.forEach(p=>{if(p.on&&p.t<.5)p.via=segmented});
  setStatus(segmented?'Segmentation restored. Lateral paths are closed and exposed zones are being contained.':'Segmentation off. Zones can reach each other directly, so one foothold spreads sideways.');
  settle();
});
$('attack').addEventListener('click',()=>launchAttack(Math.floor(Math.random()*ZONES.length)));
const pauseBtn=$('pause');
pauseBtn.addEventListener('click',()=>{userPaused=!userPaused;pauseBtn.setAttribute('aria-pressed',String(userPaused));pauseBtn.textContent=userPaused?'Play motion':'Pause motion';});
function launchAttack(i){
  const z=ZONES[i];
  for(let k=0;k<6;k++){let to=(i+1+Math.floor(Math.random()*(ZONES.length-1)))%ZONES.length;setTimeout(()=>spawn(i,to,true),k*(reduced?0:110));}
  setStatus(segmented?`Test attack from ${z.name}. Watch the gateway inspect and drop it.`:`Test attack from ${z.name}. With no segmentation it goes straight for its neighbors.`);
  settle();
}

/* ---------- pointer: hover, drag to look around ---------- */
const ray=new THREE.Raycaster(),ndc=new THREE.Vector2();
let lastPx=0,hovered=-1,yaw=0,yawTarget=0,pitch=0,dragging=false,dragX=0,moved=0,px=0,py=0;
const cv=renderer.domElement;
function pick(e){const r=cv.getBoundingClientRect();ndc.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(ndc,camera);const h=ray.intersectObjects(zoneMeshes)[0];return h?h.object.userData.zone:-1}
hero.addEventListener('pointermove',e=>{const r=hero.getBoundingClientRect();px=(e.clientX-r.left)/r.width-.5;py=(e.clientY-r.top)/r.height-.5;
  if(dragging){yawTarget+=(e.clientX-dragX)*.005;yawTarget=Math.max(-1.1,Math.min(1.1,yawTarget));moved+=Math.abs(e.clientX-dragX);dragX=e.clientX;}
  if(e.target===cv){hovered=pick(e);cv.style.cursor=hovered>=0?'crosshair':(dragging?'grabbing':'grab');}else hovered=-1;});
cv.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'){dragging=true;dragX=e.clientX;moved=0;}});
addEventListener('pointerup',()=>{dragging=false});
cv.addEventListener('click',e=>{if(moved>6)return;const z=pick(e);if(z>=0)launchAttack(z);});
hero.addEventListener('pointerleave',()=>{px=py=0;hovered=-1});

/* ---------- sizing, camera framing ---------- */
const composer=new EffectComposer(renderer);composer.addPass(new RenderPass(scene,camera));
const bloom=new UnrealBloomPass(new THREE.Vector2(1,1),.85,.55,.18);composer.addPass(bloom);composer.addPass(new OutputPass());
let W=1,H=1,mobile=false;
function resize(){
  const r=stage.getBoundingClientRect();W=Math.max(1,r.width);H=Math.max(1,r.height);mobile=W<860;
  const dpr=Math.min(devicePixelRatio||1,mobile?1.5:1.75);renderer.setPixelRatio(dpr);renderer.setSize(W,H,false);composer.setPixelRatio(dpr);composer.setSize(W,H);
  bloom.resolution.set(W*(mobile?.5:.75),H*(mobile?.5:.75));
  camera.aspect=W/H;camera.fov=mobile?40:32;
  // on desktop, shift the projection centre right so the network sits beside the copy, not under it
  if(mobile)camera.clearViewOffset();else camera.setViewOffset(W,H,-W*.25,-H*.04,W,H);
  camera.updateProjectionMatrix();if(reduced||userPaused)stepStill();
}
new ResizeObserver(()=>{ZONES.forEach(z=>z.lw=0);resize();}).observe(stage);

/* ---------- main loop ---------- */
let visible=true,last=performance.now(),time=0,ambient=0,traffic=0,scrollP=0;
new IntersectionObserver(es=>{visible=es[0].isIntersecting},{threshold:0}).observe(hero);
reducedQuery.addEventListener?.('change',e=>{reduced=e.matches});
addEventListener('scroll',()=>{const r=hero.getBoundingClientRect();scrollP=Math.max(0,Math.min(1,-r.top/Math.max(1,r.height)));if(reduced||userPaused)stepStill();},{passive:true});

function simulate(dt){
  time+=dt;
  // steady, legitimate traffic between zones
  traffic+=dt*(mobile?5:8);
  while(traffic>1){traffic--;const a=Math.floor(Math.random()*ZONES.length);let b=(a+1+Math.floor(Math.random()*(ZONES.length-1)))%ZONES.length;spawn(a,b,false);}
  // the occasional unprompted probe keeps the story moving without input
  ambient+=dt;if(ambient>3.2){ambient=0;spawn(Math.floor(Math.random()*ZONES.length),Math.floor(Math.random()*ZONES.length),true);}
  // exposed zones spread laterally while the network is flat
  ZONES.forEach((z,i)=>{
    if(z.infect>.5){z.spawnTimer+=dt;if(z.spawnTimer>(segmented?2.2:1.1)){z.spawnTimer=0;let to=(i+1+Math.floor(Math.random()*(ZONES.length-1)))%ZONES.length;spawn(i,to,true);}}
    if(segmented)z.infect=Math.max(0,z.infect-dt*.28);
  });
  const ex=exposedCount();if(segmented&&wasExposed>0&&ex===0)setStatus('Contained. Every zone is behind policy again, and nothing moves sideways without crossing the gateway.');wasExposed=ex;
  for(const p of pool){if(!p.on)continue;
    if(p.from===p.to){p.on=false;continue;}
    p.t+=dt*p.speed*(p.via?1:.85);
    if(p.via&&p.threat&&p.t>=.5){p.on=false;blocked++;flash=1;burst(CORE,C.threat,46,3.2);shock(CORE,C.copper);continue;}
    if(p.t>=1){p.on=false;if(p.threat){const z=ZONES[p.to];if(!p.via){const was=z.infect>.5;z.infect=Math.min(1,z.infect+.7);burst(new THREE.Vector3(z.pos.x,1,z.pos.z),C.threat,30,2.2);if(!was&&z.infect>.5){shock(z.pos,C.threat,2.2);setStatus(`${z.name} reached through a lateral path. ${exposedCount()} of ${ZONES.length} zones exposed.`);}}}}
  }
  pulse+=dt*5.5;if(pulse>18)pulse=0;
  flash=Math.max(0,flash-dt*2.2);
  for(let i=0;i<BMAX;i++){if(bLife[i]<=0)continue;bLife[i]-=dt*1.3;const k=i*3;bVel[k+1]-=dt*3.5;bPos[k]+=bVel[k]*dt;bPos[k+1]=Math.max(.02,bPos[k+1]+bVel[k+1]*dt);bPos[k+2]+=bVel[k+2]*dt;const f=Math.max(0,bLife[i]);bCol[k]*=.985;bCol[k+1]*=.975;bCol[k+2]*=.975;if(f<=0){bCol[k]=bCol[k+1]=bCol[k+2]=0}}
  waves.forEach(w=>{if(w.life<=0)return;w.life-=dt*1.1;const s=1+(1-w.life)*(w.size||5.5);w.m.scale.set(s,s,s);w.m.material.opacity=Math.max(0,w.life)*.9;if(w.life<=0)w.m.visible=false;});
}

function compose(){
  // packets
  let n=0;
  for(const p of pool){if(!p.on)continue;
    pointOn(p,Math.min(1,p.t),tmpB);pointOn(p,Math.min(1,p.t+.02),dummy.position);
    dummy.position.copy(tmpB);const ahead=new THREE.Vector3();pointOn(p,Math.min(1,p.t+.02),ahead);dummy.lookAt(ahead);dummy.scale.set(1,1,p.threat?1.25:1);dummy.updateMatrix();packets.setMatrixAt(n,dummy.matrix);
    if(p.threat)col.copy(C.threat).multiplyScalar(3);else if(p.via&&p.t>.5)col.copy(C.mint).multiplyScalar(2);else col.copy(C.ice).multiplyScalar(2);
    packets.setColorAt(n,col);n++;}
  packets.count=n;packets.instanceMatrix.needsUpdate=true;if(packets.instanceColor)packets.instanceColor.needsUpdate=true;
  bGeo.attributes.position.needsUpdate=true;bGeo.attributes.color.needsUpdate=true;

  // zones: walls, infection tint, hover lift
  let breach=0;
  ZONES.forEach((z,i)=>{
    z.hover+=((hovered===i||labelHover===i?1:0)-z.hover)*.15;z.group.position.y=z.hover*.25;
    const wallTarget=segmented?1:0;z.wallH=(z.wallH??1)+(wallTarget-(z.wallH??1))*(reduced?1:.06);z.wallMat.uniforms.uH.value=Math.max(.001,z.wallH);z.wallMat.uniforms.uT.value=time;
    const c=C.ice.clone().lerp(C.threat,z.infect);z.wallMat.uniforms.uC.value.copy(c);z.edge.material.color.copy(c).multiplyScalar(1.3+z.hover);
    z.tops.material.color.copy(c).multiplyScalar(1.6+Math.sin(time*6+i)*.2*z.infect);breach=Math.max(breach,z.infect);
  });
  groundMat.uniforms.uTime.value=time;groundMat.uniforms.uPulse.value=segmented?pulse:0;groundMat.uniforms.uBreach.value=breach*.6;
  rings.forEach((r,i)=>{r.rotation.z=time*r.userData.speed;r.material.opacity=(i===0?.95:.55)*(segmented?1:.35)});
  edgeMat.opacity=segmented?.95:.4;
  beamMat.uniforms.uI.value=(segmented?.35:.08)+flash*.9;coreGlowMat.color.copy(C.copper).multiplyScalar((segmented?2.2:.7)+flash*3);
  coreLight.intensity=(segmented?14:4)+flash*40;

  // camera: slow orbit, pointer parallax, drag yaw, and a scroll-driven crane up into a plan view
  yaw+=(yawTarget-yaw)*.08;
  if(labelHover<0&&hovered<0)orbitT+=1/60;
  const orbit=(reduced?0:Math.sin(orbitT*.07)*.18)+yaw+(labelHover<0?px*.25:lastPx*.25);if(labelHover<0)lastPx=px;
  const s=scrollP*scrollP*(3-2*scrollP);
  const dist=(mobile?20.5:31)*(1-s*.25),height=(mobile?10.5:11.5)+s*12-py*1.2;
  camera.position.set(Math.sin(orbit+.55)*dist,height,Math.cos(orbit+.55)*dist);
  camera.lookAt(0,(mobile?1.3:1.1)-s*.8,0);

  // project zone labels onto the HTML layer
  const sr=stage.getBoundingClientRect(),hr=hero.getBoundingClientRect();
  ZONES.forEach(z=>{const v=tmpA.copy(z.pos).setY(2.6+z.hover*.25).project(camera);
    const half=(z.lw||(z.lw=z.label.offsetWidth))/2+8;
    const x=Math.max(half,Math.min(hr.width-half,(v.x*.5+.5)*W+(sr.left-hr.left))),y=(-v.y*.5+.5)*H+(sr.top-hr.top);
    z.label.style.transform=`translate(${x}px,${y}px) translate(-50%,-50%)`;z.label.style.opacity=String(Math.max(0,1-s*2));});
  updateHUD();
  composer.render();
}
function stepStill(){compose();}
// With motion reduced or paused, play the consequence of an action instantly and show the settled result.
function settle(){if(!(reduced||userPaused))return;setTimeout(()=>{for(let i=0;i<90&&pool.some(p=>p.on&&p.threat);i++)simulate(1/15);compose();},reduced?0:700);}
// Reduced motion: compose a settled frame (some traffic in flight) and only redraw on input.
function warm(sec){const steps=Math.round(sec*30);for(let i=0;i<steps;i++)simulate(1/30);}
warm(reduced?6:2.5);
function loop(now){
  const dt=Math.min(.05,(now-last)/1000);last=now;
  if(visible&&!document.hidden&&!reduced&&!userPaused&&!document.documentElement.classList.contains('motion-stopped')){simulate(dt);compose();}
  requestAnimationFrame(loop);
}
resize();compose();requestAnimationFrame(loop);
