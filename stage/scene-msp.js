/* MSP III — an engineered delivery, assembled behind the partner's identity.
   Twelve seconds. Four decisive shots. Original illustrative geometry, no customer data. */
export const MSP_DURATION=12;
const clamp=x=>Math.max(0,Math.min(1,x)),smooth=(a,b,t)=>{const u=clamp((t-a)/(b-a));return u*u*(3-2*u)},ease=(a,b,t)=>1-(1-clamp((t-a)/(b-a)))**3;
export function mspScene({THREE,scene}){
 const C={ink:0x101c2a,navy:0x253c51,metal:0x8896a1,copper:0xf26b1f,ice:0xbed6e7,mint:0xa7d4bc};
 scene.background.setHex(0x03070e);scene.fog.color.setHex(0x03070e);scene.fog.density=.04;
 scene.add(new THREE.HemisphereLight(0xa1b3c8,0x03060d,.9));
 for(const [col,power,pos] of [[0xd7e5ee,2.3,[-3,5,4]],[0xb7d8f3,2.2,[-2,2,-2]],[0xe2a67f,2.5,[3,2,-1]]]){const l=new THREE.PointLight(col,power,0,2);l.position.set(...pos);scene.add(l)}
 const metal=(color,roughness=.3,metalness=.65)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
 const ink=metal(C.ink,.45,.15),navy=metal(C.navy,.34,.55),silver=metal(C.metal,.28,.75),copper=metal(C.copper,.3,.8);
 const light=(col,p=1)=>new THREE.MeshBasicMaterial({color:new THREE.Color(col).multiplyScalar(p),toneMapped:false});
 const warm=light(0xff7a33,1.5),ice=light(C.ice,.7),muted=light(0x678097,.55),mint=light(C.mint,1.3);
 const box=(w,h,d,m,x=0,y=0,z=0,parent=scene)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);parent.add(o);return o};
 function slab(w,h,d,m,parent,r=.035){const s=new THREE.Shape();s.moveTo(-w/2+r,-h/2);s.lineTo(w/2-r,-h/2);s.quadraticCurveTo(w/2,-h/2,w/2,-h/2+r);s.lineTo(w/2,h/2-r);s.quadraticCurveTo(w/2,h/2,w/2-r,h/2);s.lineTo(-w/2+r,h/2);s.quadraticCurveTo(-w/2,h/2,-w/2,h/2-r);s.lineTo(-w/2,-h/2+r);s.quadraticCurveTo(-w/2,-h/2,-w/2+r,-h/2);const g=new THREE.ExtrudeGeometry(s,{depth:d,bevelEnabled:true,bevelThickness:.009,bevelSize:.009,bevelSegments:3,curveSegments:8});g.translate(0,0,-d/2);const o=new THREE.Mesh(g,m);parent.add(o);return o}
 function tex(w,h,fn){const c=document.createElement('canvas');c.width=w;c.height=h;fn(c.getContext('2d'),w,h);const tx=new THREE.CanvasTexture(c);tx.colorSpace=THREE.SRGBColorSpace;return tx}
 function print(parent,w,h,tx,x,y,z){const o=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:tx,transparent:true,depthWrite:false,toneMapped:false}));o.position.set(x,y,z);parent.add(o);return o}
 const brand=tex(1200,280,(g,w,h)=>{g.clearRect(0,0,w,h);g.fillStyle='#ffffff';g.font='bold 104px Inter, sans-serif';g.fillText('YOUR MSP',45,128);g.fillStyle='#f26b1f';g.fillRect(48,152,240,8);g.fillStyle='#d3dee7';g.font='bold 26px "JetBrains Mono", monospace';g.fillText('SPECIALIST DELIVERY · YOUR IDENTITY',48,214);g.fillStyle='#ff7a33';for(let i=0;i<4;i++)g.fillRect(1010+i*22,118-i*18,8,44+i*18)});
 const plan=tex(1200,760,(g,w,h)=>{g.clearRect(0,0,w,h);g.strokeStyle='rgba(150,180,201,.18)';g.lineWidth=1;for(let x=30;x<1200;x+=40){g.beginPath();g.moveTo(x,25);g.lineTo(x,735);g.stroke()}for(let y=25;y<760;y+=40){g.beginPath();g.moveTo(30,y);g.lineTo(1170,y);g.stroke()}g.strokeStyle='rgba(176,199,217,.5)';g.lineWidth=2;g.strokeRect(110,80,980,570);for(let i=0;i<3;i++){g.strokeRect(160+i*310,140,250,420)}g.setLineDash([7,10]);g.beginPath();g.moveTo(90,700);g.lineTo(1100,700);g.stroke()});
 const assembly=new THREE.Group();assembly.position.set(.45,.62,0);assembly.rotation.set(-.72,-.17,-.03);scene.add(assembly);
 const base=new THREE.Group(),work=new THREE.Group(),identity=new THREE.Group();assembly.add(base,work,identity);
 slab(2.50,1.70,.055,navy,base);const baseLip=slab(2.44,1.64,.02,silver,base);baseLip.position.z=.04;const bed=slab(2.35,1.55,.025,ink,base);bed.position.z=.067;print(base,2.30,1.49,plan,0,0,.084);
 for(const x of [-1.14,1.14])for(const y of [-.72,.72]){const m=new THREE.Mesh(new THREE.CylinderGeometry(.012,.012,.009,20),silver);m.rotation.x=Math.PI/2;m.position.set(x,y,.092);base.add(m)}
 // The identity is an open architectural frame, not an oversized blank tablet.
 const fw=2.50,fh=1.70;
 for(const y of [-fh/2,fh/2])slab(fw,.035,.028,navy,identity,.012).position.y=y;
 for(const x of [-fw/2,fw/2])slab(.035,fh,.028,navy,identity,.012).position.x=x;
 const strip=slab(2.43,.40,.035,navy,identity);strip.position.set(0,-.62,.012);print(identity,2.33,.37,brand,0,-.62,.052);
 box(2.35,.007,.012,warm,0,.80,.025,identity);
 // Three service cartridges are delivered inside the MSP's process.
 const modules=[],packets=[],indicators=[];
 for(let i=0;i<3;i++){
  const g=new THREE.Group();work.add(g);slab(.68,1.12,.045,navy,g);const face=slab(.62,1.06,.018,ink,g);face.position.z=.035;
  box(.56,.005,.01,silver,0,.45,.051,g);box(.56,.005,.01,muted,0,-.38,.051,g);
  const tx=tex(600,160,(ctx,w,h)=>{ctx.clearRect(0,0,w,h);ctx.fillStyle='#eef3f7';ctx.font='bold 34px "JetBrains Mono", monospace';ctx.fillText(['MIGRATION','POLICY','REMEDIATION'][i],24,66);ctx.fillStyle='#ff8a4c';ctx.font='bold 22px "JetBrains Mono", monospace';ctx.fillText(['PALO ALTO · CISCO','PALO ALTO · ISE','CISCO · PALO ALTO'][i],24,112)});print(g,.58,.155,tx,0,-.46,.054);
  const statusMat=light(0x4e6677,.45);const status=box(.06,.012,.014,statusMat,.23,.49,.055,g);indicators.push(statusMat);
  for(const x of [-.24,.24])for(const y of [-.30,.33]){const ring=new THREE.Mesh(new THREE.TorusGeometry(.021,.003,6,20),silver);ring.position.set(x,y,.054);g.add(ring)}
  const paths=[];
  if(i===0){
   // Policy rows cross from a current column to a staged replacement.
   for(let r=0;r<5;r++){const y=.28-r*.115;box(.14,.032,.018,silver,-.16,y,.064,g);box(.14,.032,.018,copper,.16,y,.064,g);box(.16,.004,.008,muted,0,y,.061,g);paths.push([[-.18,y,.084],[.18,y,.084]])}
  }else if(i===1){
   // Only the agreed paths connect the three security zones.
   for(let r=0;r<3;r++){const y=.28-r*.20;box(.32,.11,.018,silver,0,y,.065,g);box(.29,.08,.020,ink,0,y,.079,g)}
   box(.006,.4,.012,copper,0,.07,.10,g);paths.push([[0,.28,.115],[0,-.12,.115]]);
  }else{
   // A measured fault is resolved and all three checks reach the evidence rail.
   for(let r=0;r<3;r++){const y=.26-r*.19;box(.36,.004,.009,muted,0,y,.063,g);box(.006,.08+r*.035,.018,copper,-.14+r*.14,y+.04,.072,g);paths.push([[-.17,y,.09],[.17,y,.09]])}
  }
  paths.forEach((pair,r)=>{const p=box(.035,.012,.012,warm,0,0,0,g);packets.push({p,a:new THREE.Vector3(...pair[0]),b:new THREE.Vector3(...pair[1]),seed:i*.18+r*.17})});
  modules.push(g);
 }
 // A moving validation blade crosses real routes, followed by measured status lights.
 const scanMat=new THREE.MeshBasicMaterial({color:0xbde3d4,transparent:true,opacity:.6,toneMapped:false});const scan=box(.014,1.02,.018,scanMat,0,.03,.13,work);
 const lightBar=box(2.23,.012,.018,mint,0,.66,.13,work);
 const clients=[],clientLED=[];
 for(let i=0;i<3;i++){
  const g=new THREE.Group();g.position.set(2.55,.20,-.9+i*.70);g.rotation.set(-Math.PI/2,0,-.15);scene.add(g);slab(.62,.44,.04,navy,g);slab(.54,.36,.02,ink,g).position.z=.032;
  for(let j=0;j<3;j++)box(.21+j*.06,.005,.008,muted,-.07,.07-j*.07,.05,g);
  const m=light(C.ice,.2);box(.035,.012,.01,m,.20,.13,.053,g);clientLED.push(m);clients.push(g);
 }
 const routes=[],handover=[];
 for(let i=0;i<3;i++){
  const points=[new THREE.Vector3(1.25,.18,.15),new THREE.Vector3(1.8,.07,.15),new THREE.Vector3(2.1,.07,-.9+i*.7),new THREE.Vector3(2.55,.18,-.9+i*.7)];const curve=new THREE.CatmullRomCurve3(points);const m=new THREE.MeshBasicMaterial({color:0x50697f,transparent:true,opacity:.3});scene.add(new THREE.Mesh(new THREE.TubeGeometry(curve,48,.004,6,false),m));routes.push({curve,m});for(let j=0;j<3;j++){const p=new THREE.Mesh(new THREE.SphereGeometry(.018,12,8),mint);scene.add(p);handover.push({p,curve,seed:i*.23+j*.3})}
 }
 return{duration:12,floor:{tile:3,base:0x03070e,reflect:.55},bloom:.32,exposure:1.05,
 chapters:[{start:0,label:'Scope'},{start:3,label:'Engineer'},{start:6,label:'Validate'},{start:9,label:'Hand over'}],
 labels:[{text:'Specialist work / inside your delivery',tone:'accent',at:(t,v)=>v.set(.4,1.7,-.1),alpha:t=>smooth(3.1,3.35,t)*(1-smooth(5.6,5.85,t))},{text:'Validated · ready for handover',tone:'ok',at:(t,v)=>v.set(.4,1.5,-.1),alpha:t=>smooth(7.8,8.0,t)*(1-smooth(8.7,8.95,t))}],
 fade(t){let f=1;for(const b of [0,3,6,9,12])f*=1-(b===0||b===12?1:.4)*(1-smooth(0,.11,Math.abs(t-b)));return f},
 update(t){
  const open=ease(.12,.8,t)*(1-smooth(9.05,9.65,t));
  assembly.rotation.y=-.17+smooth(0,2.8,t)*.12;
  identity.position.set(.04*open,.12*open,.19+.48*open);identity.rotation.y=-.035*open;
  work.position.z=.115+.18*open;
  modules.forEach((g,i)=>{const arrive=ease(.1+i*.15,.65+i*.15,t),spread=smooth(3.1,3.55,t)*(1-smooth(5.5,5.95,t));g.position.set((i-1)*(.76+spread*.11)-(1-arrive)*1.25,.08+(1-arrive)*.14,.05+Math.sin(i)*spread*.12);g.rotation.y=(i-1)*spread*.08});
  packets.forEach(({p,a,b,seed})=>{const u=(t*1.25+seed)%1;p.position.copy(a).lerp(b,u);p.visible=t>1&&t<9.6});
  indicators.forEach((m,i)=>{const active=smooth(6.15+i*.35,6.5+i*.35,t);m.color.set(0x50677b).lerp(new THREE.Color(C.mint).multiplyScalar(1.3),active)});
  scan.position.x=-1.10+2.20*clamp((t-6.15)/1.45);scan.visible=t>6.15&&t<7.8;lightBar.visible=t>7.65&&t<9.45;
  clients.forEach((g,i)=>{const u=ease(8.9+i*.12,9.45+i*.12,t);g.position.x=2.55+(1-u)*.18;clientLED[i].color.set(C.ice).multiplyScalar(.15+u*.8)});
  routes.forEach(({m})=>m.opacity=.12+.38*smooth(9.05,9.4,t));handover.forEach(({p,curve,seed})=>{p.visible=t>9.15;p.position.copy(curve.getPoint((t*.95+seed)%1))});
 },camera(t,out){
  const shots=[
   [[-2.7,2.7,4.25],[-1.65,2.30,3.95],[.2,.72,.0],[.35,.70,.0],36],
   [[2.65,2.15,3.45],[1.90,1.72,3.10],[.45,.82,.10],[.40,.78,.1],38],
   [[1.1,3.45,2.60],[.35,2.95,2.30],[.4,.75,.10],[.4,.72,.1],36],
   [[3.0,2.6,5.0],[2.3,2.35,4.65],[1.05,.60,-.02],[1.1,.60,-.02],38]
  ];const i=Math.min(3,Math.floor(t/3)),s=shots[i],u=smooth(i*3,(i+1)*3,t);out.pos.set(...s[0].map((x,k)=>x+(s[1][k]-x)*u));out.target.set(...s[2].map((x,k)=>x+(s[3][k]-x)*u));out.fov=s[4];out.shift=0;
 }};
}
