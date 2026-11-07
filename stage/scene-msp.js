/* MSP film II: the specialist layer. A dark, machined delivery folio opens in depth,
   reveals an engineered interconnect and validation layer, then closes under the MSP name.
   Original illustrative geometry, no client data or product claims. Only MSP owns this file. */
export const MSP_DURATION=24;
const CUTS=[0,6,12,18,24],clamp=x=>Math.min(1,Math.max(0,x));
const smooth=(a,b,x)=>{const u=clamp((x-a)/(b-a));return u*u*(3-2*u)},lerp=(a,b,u)=>a+(b-a)*u;
export function mspScene({THREE,scene}){
 const C={ink:0x070d16,navy:0x11253b,metal:0x718392,copper:0xe18c54,ice:0xa8cce6,mint:0x8dbca8};
 scene.background.setHex(0x030812);scene.fog.color.setHex(0x050c19);scene.fog.density=.055;
 const V=(...a)=>new THREE.Vector3(...a);
 scene.add(new THREE.HemisphereLight(0x799cbd,0x03050a,.6));
 const key=new THREE.DirectionalLight(0xc1d8eb,2.3);key.position.set(-3,5,4);scene.add(key);
 const amber=new THREE.PointLight(C.copper,3.2,8,2);amber.position.set(3,2,-1);scene.add(amber);
 const blue=new THREE.PointLight(0x639bcf,3.4,8,2);blue.position.set(-3,2,-2);scene.add(blue);
 const mat=(color,roughness=.3,metalness=.72)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
 const shell=mat(C.navy,.27,.82),dark=mat(C.ink,.36,.64),titanium=mat(0x6e7b84,.22,.92),copper=mat(0xa46642,.31,.9);
 const light=(color,intensity=1)=>new THREE.MeshBasicMaterial({color:new THREE.Color(color).multiplyScalar(intensity),toneMapped:false});
 const warm=light(C.copper,1.7),cool=light(C.ice,1.25),mint=light(C.mint,1.3);
 const box=(w,h,d,m,x,y,z,parent=scene)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);parent.add(o);return o};
 function slab(w,h,d,m,parent){const r=.055,s=new THREE.Shape();s.moveTo(-w/2+r,-h/2);s.lineTo(w/2-r,-h/2);s.quadraticCurveTo(w/2,-h/2,w/2,-h/2+r);s.lineTo(w/2,h/2-r);s.quadraticCurveTo(w/2,h/2,w/2-r,h/2);s.lineTo(-w/2+r,h/2);s.quadraticCurveTo(-w/2,h/2,-w/2,h/2-r);s.lineTo(-w/2,-h/2+r);s.quadraticCurveTo(-w/2,-h/2,-w/2+r,-h/2);const g=new THREE.ExtrudeGeometry(s,{depth:d,bevelEnabled:true,bevelThickness:.012,bevelSize:.014,bevelSegments:4,curveSegments:8});g.translate(0,0,-d/2);const o=new THREE.Mesh(g,m);parent.add(o);return o}
 function tex(w,h,fn){const c=document.createElement('canvas');c.width=w;c.height=h;fn(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;return t}
 function print(parent,w,h,map,z){const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map,transparent:true,depthWrite:false,toneMapped:false}));m.position.z=z;parent.add(m);return m}
 const brand=tex(1200,720,(g,w,h)=>{g.clearRect(0,0,w,h);g.fillStyle='#c2d0db';g.font='500 58px Inter, sans-serif';g.fillText('YOUR MSP',86,528);g.fillStyle='#647d94';g.font='400 18px "JetBrains Mono", monospace';g.fillText('WHITE-LABEL ENGINEERING',88,572);g.fillStyle='#b48a6b';for(let i=0;i<4;i++)g.fillRect(87+i*9,97-i*5,3,21+i*5);});
 const circuit=tex(1200,720,(g,w,h)=>{g.clearRect(0,0,w,h);g.strokeStyle='rgba(116,155,186,.35)';g.lineWidth=2;for(let i=0;i<22;i++){const x=65+i*49,y=90+(i%7)*72;g.beginPath();g.moveTo(x,40);g.lineTo(x,y);g.lineTo(600+(i-11)*13,y);g.lineTo(600+(i-11)*13,340);g.stroke();g.beginPath();g.arc(x,y,5,0,Math.PI*2);g.stroke()}g.strokeStyle='#976947';g.lineWidth=3;for(let i=0;i<12;i++){g.beginPath();g.moveTo(60,530+i*7);g.lineTo(340+i*7,530+i*7);g.lineTo(420+i*7,450);g.lineTo(720,450);g.stroke()}});
 const etch=tex(1200,720,(g,w,h)=>{g.clearRect(0,0,w,h);g.strokeStyle='rgba(144,174,197,.25)';g.lineWidth=1;for(let y=70;y<650;y+=25){g.beginPath();g.moveTo(70,y);g.lineTo(1130,y);g.stroke()}for(let x=70;x<1140;x+=25){g.beginPath();g.moveTo(x,70);g.lineTo(x,650);g.stroke()}g.strokeStyle='rgba(184,207,224,.6)';g.lineWidth=3;g.strokeRect(260,205,680,300);for(let i=0;i<3;i++){g.strokeRect(330+i*220,280,100,100);g.beginPath();g.moveTo(430+i*220,330);g.lineTo(550+i*220,330);g.stroke()}});
 const assembly=new THREE.Group();assembly.position.set(.35,1.25,0);assembly.rotation.set(-.22,-.2,-.04);scene.add(assembly);
 const back=new THREE.Group(),scope=new THREE.Group(),engineer=new THREE.Group(),validation=new THREE.Group(),cover=new THREE.Group();const layers=[back,scope,engineer,validation,cover];layers.forEach(g=>assembly.add(g));
 slab(2.76,1.66,.10,dark,back);slab(2.66,1.55,.055,titanium,scope);slab(2.62,1.53,.065,dark,engineer);slab(2.66,1.55,.045,dark,validation);slab(2.82,1.72,.105,shell,cover);
 print(cover,2.72,1.64,brand,.066);print(scope,2.50,1.43,etch,.04);print(engineer,2.49,1.43,circuit,.045);
 // The cover has a recessed binding, fine reveals, flush fasteners and restrained edge light.
 box(.028,1.40,.011,copper,-1.32,0,.066,cover);box(.004,1.35,.012,warm,-1.302,0,.069,cover);
 for(let i=0;i<9;i++)box(.020,.035,.015,titanium,1.31,-.43+i*.105,.066,cover);
 for(const x of [-1.31,1.31])for(const y of [-.73,.73]){const m=new THREE.Mesh(new THREE.CylinderGeometry(.009,.009,.006,20),titanium);m.rotation.x=Math.PI/2;m.position.set(x,y,.066);cover.add(m)}
 box(2.42,.004,.012,cool,0,.708,.044,scope);
 box(2.42,.004,.012,warm,0,-.70,.046,engineer);
 // A machined interconnect carries the specialist work; it is an illustrative assembly, not a product.
 const core=new THREE.Group();engineer.add(core);slab(.60,.43,.07,copper,core);core.position.z=.07;
 const coreTop=slab(.46,.30,.026,dark,core);coreTop.position.z=.052;
 for(let i=0;i<12;i++){const x=-.25+i*.045;box(.012,.08,.035,titanium,x,.265,.07,engineer);box(.012,.08,.035,titanium,x,-.265,.07,engineer)}
 const workTraces=[];
 for(let i=0;i<12;i++){const y=(i-5.5)*.070;const g=new THREE.Group();engineer.add(g);g.position.set(0,y,.09);box(.85,.004,.006,copper,-.78,0,0,g);box(.85,.004,.006,copper,.78,0,0,g);const p=box(.045,.009,.01,warm,-1.18,0,.006,g);workTraces.push({g,p,seed:i*.071})}
 // Four validation fiducials illuminate in a measured sequence; no document-sized text inside the shot.
 const checks=[];
 for(let i=0;i<4;i++){const g=new THREE.Group();g.position.set(-.84+i*.56,0,.045);validation.add(g);const ring=new THREE.Mesh(new THREE.TorusGeometry(.105,.003,10,64),light(0x5f778c,.6));g.add(ring);const okM=new THREE.MeshBasicMaterial({color:C.mint,toneMapped:false,transparent:true,opacity:0});const a=box(.065,.010,.009,okM,-.028,-.008,.009,g);a.rotation.z=-.65;const b=box(.11,.010,.009,okM,.032,.013,.009,g);b.rotation.z=.78;checks.push(okM);box(.18,.003,.006,copper,0,-.29,.005,g)}
 const scan=box(2.47,.007,.012,mint,0,.6,.062,validation);
 const rails=[];for(const x of [-1.15,1.15])for(const y of [-.59,.59]){const m=new THREE.Mesh(new THREE.CylinderGeometry(.010,.010,.58,12),copper);m.rotation.x=Math.PI/2;m.position.set(x,y,-.05);assembly.add(m);rails.push(m)}
 const clients=[];
 for(let i=0;i<3;i++){const g=new THREE.Group();g.position.set(3.2,.95,-1.1+i*.46);g.rotation.set(-.12,-.45,0);scene.add(g);slab(.71,.46,.055,shell,g);print(g,.66,.40,brand,.04);box(.58,.003,.007,cool,0,-.2,.038,g);clients.push(g)}
 const path=new THREE.CatmullRomCurve3([V(1.4,1.12,.1),V(2.1,1.15,0),V(2.8,1.0,-.3),V(3.2,.95,-.64)]);
 const pathMat=new THREE.MeshBasicMaterial({color:C.ice,transparent:true,opacity:0});scene.add(new THREE.Mesh(new THREE.TubeGeometry(path,64,.003,6,false),pathMat));
 const pulses=Array.from({length:4},()=>{const m=new THREE.Mesh(new THREE.SphereGeometry(.012,12,8),mint);scene.add(m);return m});
 return {duration:24,floor:{tile:1.6,base:0x02050b,reflect:.64},bloom:.38,exposure:.98,
 chapters:[{start:0,label:'Scope'},{start:6,label:'Engineer'},{start:12,label:'Validate'},{start:18,label:'Hand over'}],
 labels:[{text:'Specialist engineering / inside your delivery',tone:'accent',at:(t,v)=>v.set(.35,2.28,.05),alpha:t=>smooth(6.2,7,t)*(1-smooth(11.3,12,t))},{text:'Validated before handover',tone:'ok',at:(t,v)=>v.set(.6,2.28,.4),alpha:t=>smooth(14.1,14.7,t)*(1-smooth(17.3,18,t))}],
 fade(t){let f=1;for(const b of CUTS)f*=1-(b===0||b===24?1:.7)*(1-smooth(0,.20,Math.abs(t-b)));return f},
 update(t){
  const open=smooth(3.8,7.6,t)*(1-smooth(17.8,20.6,t));
  assembly.position.set(.35+smooth(20,23.3,t)*.3,1.25+Math.sin(t*.22)*.01,0);assembly.rotation.y=-.20+Math.sin(t*.12)*.07;
  const depths=[-.32,-.17,0,.17,.32];layers.forEach((g,i)=>{g.position.set((i-2)*.065*open,(i-2)*.025*open,depths[i]*(1+open*2.15));g.rotation.y=(i-2)*.028*open});
  const hinge=open*1.52;cover.position.x=-1.32+1.32*Math.cos(hinge);cover.position.z=.32+1.32*Math.sin(hinge);cover.position.y=.14*open;cover.rotation.y=-hinge;cover.rotation.x=-.12*open;
  // The first layer rises to reveal the recessed specialist core; validation advances toward camera.
  validation.position.x+=.08*open;validation.position.y+=1.34*open;validation.rotation.x=-.18*open;
  rails.forEach(m=>{m.scale.y=1+open;m.visible=t<12||t>18});
  workTraces.forEach(({p,seed})=>{const u=(t*.30+seed)%1;p.position.x=-1.17+u*2.34;p.visible=t>6&&t<12});
  checks.forEach((m,i)=>m.opacity=smooth(12.6+i*.7,13.2+i*.7,t));scan.position.y=.62-((t-12)*.28%1.25);scan.visible=t>=12&&t<16.7;
  pathMat.opacity=.14*smooth(19.8,21,t);pulses.forEach((m,i)=>{m.visible=t>20.2;m.position.copy(path.getPoint((t*.25+i*.25)%1))});
  clients.forEach((g,i)=>g.position.y=.95+Math.sin(t*.3+i)*.005);
 },camera(t,out){
  const shots=[
   [[-2.8,2.4,5.15],[-1.9,2.16,4.95],[-.35,1.25,0],[-.28,1.25,0],32],
   [[3.7,3.2,6.5],[3.3,2.95,6.1],[-.12,1.85,.1],[-.05,1.86,.1],36],
   [[1.55,3.0,5.0],[1.15,2.9,4.65],[.36,2.46,.40],[.32,2.48,.40],34],
   [[2.25,2.4,5.3],[2.6,2.65,5.9],[.8,1.10,-.08],[1.0,1.12,-.15],34]
  ];let i=0;while(i<3&&t>=CUTS[i+1])i++;const u=.5-.5*Math.cos(clamp((t-CUTS[i])/6)*Math.PI),s=shots[i];out.pos.set(...s[0].map((v,k)=>lerp(v,s[1][k],u)));out.target.set(...s[2].map((v,k)=>lerp(v,s[3][k],u)));out.fov=s[4];out.shift=0;
 }};
}
