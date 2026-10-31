/* VALO homepage hero: a firewall stack as a dark monolith in warm light. Scrolling separates it into the
   layers of VALO's work. Illustrative only. three.js is vendored under /vendor/three. */
import * as THREE from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {ShaderPass} from 'three/addons/postprocessing/ShaderPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';

const root=document.getElementById('hm');
if(root){
const stage=root.querySelector('.hm-stage'),layersEl=[...root.querySelectorAll('.hm-layer')],intro=root.querySelector('.hm-intro'),cue=root.querySelector('.hm-cue');
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
let renderer;
try{renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});}catch(e){root.classList.add('hm-no-webgl');throw e;}
renderer.setClearColor(0x08090b,1);renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.95;
stage.appendChild(renderer.domElement);
const scene=new THREE.Scene();scene.fog=new THREE.FogExp2(0x0b0a0a,.055);
const pmrem=new THREE.PMREMGenerator(renderer);scene.environment=pmrem.fromScene(new RoomEnvironment(renderer),.04).texture;scene.environmentIntensity=.18;
const camera=new THREE.PerspectiveCamera(30,1,.1,120);

const COPPER=new THREE.Color('#E8875F'),WARM=new THREE.Color('#FFB27A');
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)),smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t)};

/* light: one warm key from behind and above, a low copper bounce, almost no ambient */
scene.add(new THREE.AmbientLight(0x2a2420,.25));
const key=new THREE.SpotLight(0xffb784,260,40,.42,.65,1.6);key.position.set(-4,13,-7);key.target.position.set(0,2.5,0);scene.add(key,key.target);
const rim=new THREE.SpotLight(0xff8a55,120,30,.5,.8,1.6);rim.position.set(7,5,-6);rim.target.position.set(0,2,0);scene.add(rim,rim.target);
const fill=new THREE.PointLight(0x5a6a7a,6,20,2);fill.position.set(6,2,8);scene.add(fill);

/* ground: dark, slightly glossy, catching the warm light */
const ground=new THREE.Mesh(new THREE.CircleGeometry(40,64),new THREE.MeshStandardMaterial({color:0x0d0d0e,metalness:.6,roughness:.42}));
ground.rotation.x=-Math.PI/2;scene.add(ground);

/* the monolith: four tiers of a firewall stack on a plinth, with copper seams */
const body=new THREE.MeshStandardMaterial({color:0x17181b,metalness:.92,roughness:.3});
const faceMat=new THREE.MeshStandardMaterial({color:0x101113,metalness:.85,roughness:.45});
const seamMat=new THREE.MeshBasicMaterial({color:COPPER.clone().multiplyScalar(2.4),toneMapped:false});
const ledMat=new THREE.MeshBasicMaterial({color:WARM.clone().multiplyScalar(2),toneMapped:false});
const plinth=new THREE.Mesh(new THREE.BoxGeometry(3.6,.5,2.6),body);plinth.position.y=.25;scene.add(plinth);
const TIERS=4,TH=1.15,tiers=[];
for(let i=0;i<TIERS;i++){
  const g=new THREE.Group();
  const slab=new THREE.Mesh(new THREE.BoxGeometry(3,TH-.06,2.1),body);g.add(slab);
  const front=new THREE.Mesh(new THREE.BoxGeometry(2.7,TH-.34,.02),faceMat);front.position.set(0,0,1.06);g.add(front);
  const seam=new THREE.Mesh(new THREE.BoxGeometry(3.02,.025,2.12),seamMat);seam.position.y=-(TH/2)+.01;g.add(seam);
  for(let k=0;k<8;k++){const led=new THREE.Mesh(new THREE.BoxGeometry(.12,.025,.01),ledMat);led.position.set(-1.1+k*.18,.18,1.08);led.userData.phase=Math.random()*10;g.add(led);}
  const y0=.5+TH/2+i*TH;g.userData={y0,spin:(i%2?1:-1)*.22};g.position.y=y0;scene.add(g);tiers.push(g);
}
const cap=new THREE.Mesh(new THREE.BoxGeometry(3.04,.04,2.14),seamMat);scene.add(cap);
/* a scan band that travels the stack: the hero is never a still frame */
const scanMat=new THREE.MeshBasicMaterial({color:WARM.clone().multiplyScalar(2.2),transparent:true,opacity:.0,toneMapped:false,blending:THREE.AdditiveBlending,depthWrite:false});
const scan=new THREE.Mesh(new THREE.BoxGeometry(3.12,.03,2.22),scanMat);scene.add(scan);

/* a shaft of light and dust drifting through it */
const beamMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{uI:{value:.5}},
  vertexShader:`varying vec2 vU;void main(){vU=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader:`varying vec2 vU;uniform float uI;void main(){float edge=sin(vU.x*3.14159);float a=pow(vU.y,1.6)*edge*edge*.11*uI;gl_FragColor=vec4(vec3(1.,.7,.48)*a,a);}`});
const beam=new THREE.Mesh(new THREE.ConeGeometry(4.2,16,48,1,true),beamMat);beam.position.set(-2,8,-3.5);beam.rotation.z=-.22;beam.rotation.x=.18;scene.add(beam);
const DN=700,dPos=new Float32Array(DN*3);for(let i=0;i<DN;i++){dPos[i*3]=(Math.random()-.5)*14;dPos[i*3+1]=Math.random()*11;dPos[i*3+2]=(Math.random()-.5)*12;}
const dGeo=new THREE.BufferGeometry();dGeo.setAttribute('position',new THREE.BufferAttribute(dPos,3));
const dust=new THREE.Points(dGeo,new THREE.PointsMaterial({color:0xffc79a,size:.03,transparent:true,opacity:.55,depthWrite:false,blending:THREE.AdditiveBlending}));scene.add(dust);

/* post: soft bloom, then grain and vignette */
const composer=new EffectComposer(renderer);composer.addPass(new RenderPass(scene,camera));
const bloom=new UnrealBloomPass(new THREE.Vector2(1,1),.55,.7,.55);composer.addPass(bloom);
const grain=new ShaderPass({uniforms:{tDiffuse:{value:null},uT:{value:0}},
  vertexShader:`varying vec2 vU;void main(){vU=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader:`uniform sampler2D tDiffuse;uniform float uT;varying vec2 vU;float h(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233))+uT)*43758.5453);}
  void main(){vec4 c=texture2D(tDiffuse,vU);float v=smoothstep(1.15,.35,length(vU-.5)*1.35);c.rgb*=v;c.rgb+=(h(vU*1000.)-.5)*.028;gl_FragColor=c;}`});
composer.addPass(grain);composer.addPass(new OutputPass());

let W=1,H=1,mobile=false;
function resize(){const r=stage.getBoundingClientRect();W=Math.max(1,r.width);H=Math.max(1,r.height);mobile=W<760;
  const dpr=Math.min(devicePixelRatio||1,mobile?1.5:1.75);renderer.setPixelRatio(dpr);renderer.setSize(W,H,false);composer.setPixelRatio(dpr);composer.setSize(W,H);bloom.resolution.set(W*.5,H*.5);
  camera.aspect=W/H;camera.fov=mobile?44:30;camera.updateProjectionMatrix();}
new ResizeObserver(resize).observe(stage);resize();

let target=0,pos=0;
function readScroll(){const r=root.getBoundingClientRect(),span=r.height-innerHeight;target=clamp(-r.top/Math.max(1,span));}
addEventListener('scroll',readScroll,{passive:true});readScroll();
let px=0,py=0;addEventListener('pointermove',e=>{if(e.pointerType==='touch')return;px=e.clientX/innerWidth-.5;py=e.clientY/innerHeight-.5;});
let visible=true;new IntersectionObserver(es=>{visible=es[0].isIntersecting}).observe(root);
const tmp=new THREE.Vector3();
let time=0,last=performance.now();
function frame(now){
  requestAnimationFrame(frame);
  const dt=Math.max(0,Math.min(.05,(now-last)/1000));last=now;
  if(!visible||document.hidden)return;
  const still=reduced||document.documentElement.classList.contains('motion-stopped');
  if(!still)time+=dt;
  pos+=(target-pos)*(reduced?1:Math.min(1,dt*5));
  const open=smooth(.12,.6,pos),out=smooth(.82,1,pos);

  // tiers lift apart and turn slightly, like an exploded drawing
  tiers.forEach((g,i)=>{const lift=open*(i*.95+.35)+Math.sin(time*.7+i*.9)*.04*(.4+open);g.position.y=g.userData.y0+lift;g.rotation.y=open*g.userData.spin*(i+1)*.5;
    g.children.forEach(c=>{if(c.userData.phase!==undefined)c.material.color.copy(WARM).multiplyScalar(1.4+Math.sin(time*2+c.userData.phase)*.6)});});
  const top=tiers[TIERS-1];cap.position.set(0,top.position.y+TH/2-.02,0);cap.rotation.y=top.rotation.y;
  seamMat.color.copy(COPPER).multiplyScalar(2+open*1.4);
  key.position.x=-4+px*3;key.intensity=260*(1-out*.6);beamMat.uniforms.uI.value=.5+Math.sin(time*.4)*.08;

  // dust drifts up through the light
  if(!still){const a=dGeo.attributes.position.array;for(let i=0;i<DN;i++){a[i*3+1]+=dt*.12;a[i*3]+=Math.sin(time*.3+i)*dt*.02;if(a[i*3+1]>11)a[i*3+1]=0;}dGeo.attributes.position.needsUpdate=true;}

  // camera: low and close, pushing in; pulls back and rises as the stack opens
  const drift=still?0:Math.sin(time*.08)*.35;
  const dist=(mobile?15:13.5)+open*(mobile?6:5),h=1.4+open*3.6;
  const ang=(mobile?.12:.32)+drift*.9+Math.sin(time*.13)*.28+px*.12+open*.35;
  const sc=(time*.18)%1,top0=tiers[0].position.y-TH/2,top1=tiers[TIERS-1].position.y+TH/2;scan.position.y=top0+(top1-top0)*sc;scan.rotation.y=tiers[Math.min(TIERS-1,Math.floor(sc*TIERS))].rotation.y;scanMat.opacity=still?0:Math.sin(sc*Math.PI)*.85;
  camera.position.set(Math.sin(ang)*dist,h-py*.6,Math.cos(ang)*dist);
  camera.lookAt(0,(mobile?3.4:3.1)+open*2.2,0);
  grain.uniforms.uT.value=still?0:time;

  // copy and layer labels
  intro.style.opacity=String(1-smooth(.05,.28,pos));intro.style.transform=`translate(-50%,calc(-50% - ${smooth(.05,.28,pos)*40}px))`;
  if(cue)cue.style.opacity=String(1-smooth(.02,.12,pos));
  layersEl.forEach((el,i)=>{const g=tiers[+el.dataset.tier];tmp.set(1.6,g.position.y,1.05).applyAxisAngle(new THREE.Vector3(0,1,0),g.rotation.y).project(camera);
    const x=(tmp.x*.5+.5)*W,y=(-tmp.y*.5+.5)*H;const show=smooth(.35+i*.08,.55+i*.08,pos)*(1-out);
    const lx=Math.min(x,W-el.offsetWidth-12);el.style.transform=`translate(${Math.round(lx)}px,${Math.round(y)}px)`;el.style.opacity=String(show);el.style.visibility=show>.02?'visible':'hidden';});
  composer.render();
}
requestAnimationFrame(frame);
}
