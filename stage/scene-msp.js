/* MSP / THE ENGINEERING BEHIND YOUR NAME.
   A precision-made delivery portfolio opens to reveal scoped specialist work,
   validation, and handover; its client-facing cover always carries the MSP identity.
   Four authored camera shots, deterministic at every t. All documents are illustrative.
   Kept self-contained so the other service films and shared renderer stay untouched. */
export const MSP_DURATION = 24;
const CUTS = [0, 6, 12, 18, MSP_DURATION];
const limit = x => Math.max(0, Math.min(1, x));
const smooth = (a,b,x) => {const u=limit((x-a)/(b-a));return u*u*(3-2*u)};
const blend=(a,b,u)=>a+(b-a)*u;

export function mspScene({THREE,scene}) {
  const C={navy:0x183557,ink:0x080f1c,copper:0xe98d54,ice:0xa4c4dd,mint:0x98cdb3,paper:0xd5e2ea};
  scene.background.setHex(0x050b16);scene.fog.color.setHex(0x081120);scene.fog.density=.045;
  scene.add(new THREE.HemisphereLight(0x8caecf,0x070a12,.8));
  const key=new THREE.DirectionalLight(0xc8ddf5,2.6);key.position.set(-3,5,5);scene.add(key);
  const rim=new THREE.PointLight(C.copper,4.2,9,2);rim.position.set(2.5,2,-1.5);scene.add(rim);
  const fill=new THREE.PointLight(0x537dab,2.5,9,2);fill.position.set(-3,1,1);scene.add(fill);
  const V=(x,y,z)=>new THREE.Vector3(x,y,z);
  const metal=(color,roughness=.34,metalness=.55)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
  const navy=metal(C.navy,.29,.48),edge=metal(0x425168,.25,.8),black=metal(C.ink,.48,.35),copper=metal(0x955c3d,.32,.65);
  const glow=color=>new THREE.MeshBasicMaterial({color,toneMapped:false});
  const blueGlow=glow(0x94c6ea),warmGlow=glow(C.copper),greenGlow=glow(C.mint);
  function box(w,h,d,mat,x,y,z,parent=scene){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);parent.add(m);return m}
  function round(w,h,d,mat,parent){const r=.045,s=new THREE.Shape();s.moveTo(-w/2+r,-h/2);s.lineTo(w/2-r,-h/2);s.quadraticCurveTo(w/2,-h/2,w/2,-h/2+r);s.lineTo(w/2,h/2-r);s.quadraticCurveTo(w/2,h/2,w/2-r,h/2);s.lineTo(-w/2+r,h/2);s.quadraticCurveTo(-w/2,h/2,-w/2,h/2-r);s.lineTo(-w/2,-h/2+r);s.quadraticCurveTo(-w/2,-h/2,-w/2+r,-h/2);const geo=new THREE.ExtrudeGeometry(s,{depth:d,bevelEnabled:true,bevelThickness:.006,bevelSize:.006,bevelSegments:2,curveSegments:5});geo.translate(0,0,-d/2);const m=new THREE.Mesh(geo,mat);parent.add(m);return m}
  function texture(w,h,draw){const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;draw(canvas.getContext('2d'),w,h);const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=8;return tex}
  function face(parent,w,h,tex,z){const mat=new THREE.MeshBasicMaterial({map:tex,toneMapped:false});const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),mat);m.position.z=z;parent.add(m);return m}
  const mono='"JetBrains Mono", monospace',sans='Inter, sans-serif';
  function header(g,w,number,title,accent='#d99a6e') {g.fillStyle='#a7bdce';g.font=`500 18px ${mono}`;g.fillText(number+' / ENGINEERING RECORD',38,42);g.fillStyle=accent;g.fillRect(38,66,54,3);g.fillStyle='#e4edf3';g.font=`500 40px ${sans}`;g.fillText(title,38,126)}
  function rule(g,x,y,w,alpha=.25){g.fillStyle=`rgba(160,189,210,${alpha})`;g.fillRect(x,y,w,1)}
  const brandTex=texture(1024,640,(g,w,h)=>{
    const bg=g.createLinearGradient(0,0,w,h);bg.addColorStop(0,'#1c3c5d');bg.addColorStop(1,'#0a1b30');g.fillStyle=bg;g.fillRect(0,0,w,h);
    g.strokeStyle='rgba(148,181,211,.08)';g.lineWidth=1;for(let x=-h;x<w;x+=26){g.beginPath();g.moveTo(x,0);g.lineTo(x+h,h);g.stroke()}
    g.fillStyle='#e9a16e';for(let i=0;i<4;i++)g.fillRect(58+i*10,53+(3-i)*8,5,35-(3-i)*8);
    g.fillStyle='#c2d2de';g.font=`500 19px ${mono}`;g.fillText('CLIENT DELIVERY',130,82);
    g.fillStyle='#f4f7f8';g.font=`500 108px ${sans}`;g.fillText('YOUR MSP',54,310);
    g.fillStyle='#adc2d2';g.font=`400 26px ${sans}`;g.fillText('Your name. Your client relationship.',58,368);
    rule(g,58,491,908,.28);g.fillStyle='#d2e0e9';g.font=`500 18px ${mono}`;g.fillText('SCOPED  /  ENGINEERED  /  VALIDATED',58,536);
    g.fillStyle='#69849d';g.font=`400 15px ${mono}`;g.fillText('ILLUSTRATIVE WHITE-LABEL DELIVERY',58,589);
  });
  const scopeTex=texture(900,640,(g,w,h)=>{
    g.fillStyle='#122439';g.fillRect(0,0,w,h);header(g,w,'01','Agreed before the change');
    const items=[['SCOPE','Firewall policy & dependencies'],['RESPONSIBILITY','Specialist work, inside your process'],['CHANGE WINDOW','Agreed with your team'],['ROLLBACK','Planned before implementation']];
    items.forEach(([a,b],i)=>{const y=200+i*88;g.fillStyle='#7c98ae';g.font=`500 15px ${mono}`;g.fillText(a,38,y);g.fillStyle='#d8e4ec';g.font=`400 25px ${sans}`;g.fillText(b,38,y+35);rule(g,38,y+56,824,.15)});
    g.fillStyle='#7192a9';g.font=`400 14px ${mono}`;g.fillText('SYNTHETIC EXAMPLE / NOT CLIENT DATA',38,604)
  });
  const engineerTex=texture(900,640,(g,w,h)=>{
    g.fillStyle='#101d2c';g.fillRect(0,0,w,h);header(g,w,'02','Specialist engineering','#efac7e');
    g.fillStyle='#d4976f';g.font=`500 19px ${mono}`;g.fillText('CISCO + PALO ALTO',38,180);
    const lines=['policy-map: reviewed','configuration: staged','change-window: agreed','rollback: prepared'];
    lines.forEach((s,i)=>{g.fillStyle=i===1?'#e7b58d':'#95adc0';g.font=`400 27px ${mono}`;g.fillText(s,56,265+i*55);g.fillStyle='#d88c56';g.fillRect(38,245+i*55,3,26)});
    rule(g,38,520,824,.2);g.fillStyle='#d4e0e9';g.font=`500 22px ${sans}`;g.fillText('VALO ENGINEERING',38,570);g.fillStyle='#7c96aa';g.font=`400 15px ${mono}`;g.fillText('WORKING INSIDE YOUR PROCESS',38,605)
  });
  function validationTex(complete){return texture(900,640,(g,w,h)=>{
    g.fillStyle='#122738';g.fillRect(0,0,w,h);header(g,w,'03','Evidence before handover','#97c6ad');
    ['Permitted paths tested','Blocked paths checked','Configuration documented','Handover prepared'].forEach((s,i)=>{const y=230+i*75;g.strokeStyle=complete?'#94cbb0':'#5c7a8b';g.lineWidth=3;g.strokeRect(40,y-23,24,24);if(complete){g.beginPath();g.moveTo(45,y-11);g.lineTo(51,y-5);g.lineTo(61,y-18);g.stroke()}g.fillStyle=complete?'#d8ede5':'#9eb3c3';g.font=`400 29px ${sans}`;g.fillText(s,90,y);rule(g,38,y+28,824,.14)});
    g.fillStyle=complete?'#94cbb0':'#7290a5';g.font=`500 18px ${mono}`;g.fillText(complete?'VALIDATED / READY FOR YOUR HANDOVER':'VALIDATION / IN PROGRESS',38,595)
  })}
  const validateOpen=validationTex(false),validateDone=validationTex(true);
  const clientTex=texture(512,340,(g,w,h)=>{g.fillStyle='#12283d';g.fillRect(0,0,w,h);g.fillStyle='#86a4bb';g.font=`400 18px ${mono}`;g.fillText('CLIENT ENVIRONMENT',28,42);g.fillStyle='#dfebf2';g.font=`500 53px ${sans}`;g.fillText('YOUR MSP',28,153);g.fillStyle='#91bfa9';g.font=`500 18px ${mono}`;g.fillText('DELIVERED IN YOUR NAME',28,270);rule(g,28,209,456,.3)});

  const assembly=new THREE.Group();assembly.position.y=.94;assembly.rotation.x=-.12;scene.add(assembly);
  const parts=[];
  function layer(name,w,h,mat,tex){const g=new THREE.Group();g.name=name;assembly.add(g);round(w,h,.065,mat,g);if(tex)face(g,w-.07,h-.07,tex,.04);for(const sx of [-1,1])box(.012,h-.10,.014,sx<0?warmGlow:blueGlow,sx*(w/2-.025),0,.039,g);parts.push(g);return g}
  const back=layer('VALO specialist layer',2.34,1.49,copper,null);
  box(2.18,.008,.014,warmGlow,0,.65,.045,back);
  const scope=layer('Scope and responsibility',2.18,1.40,black,scopeTex);
  const engineer=layer('Configuration and rollback',2.18,1.40,black,engineerTex);
  const validation=layer('Validation and handover',2.18,1.40,black,validateOpen);
  const cover=layer('Client-facing MSP identity',2.38,1.50,navy,brandTex);
  // Fine fasteners and exposed page edges make this a physical portfolio.
  for(const x of [-1.10,1.10])for(const y of [-.63,.63]){const screw=new THREE.Mesh(new THREE.CylinderGeometry(.013,.013,.008,16),edge);screw.rotation.x=Math.PI/2;screw.position.set(x,y,.045);cover.add(screw)}
  for(let i=0;i<8;i++)box(2.17,.006,.006,edge,0,-.69,.08+i*.019,scope);
  const seal=new THREE.Group();validation.add(seal);seal.position.set(.76,-.48,.065);
  const sealMat=glow(C.mint);const torus=new THREE.Mesh(new THREE.TorusGeometry(.13,.006,8,64),sealMat);seal.add(torus);
  function stroke(a,b,r,mat,parent){const dir=V(...b).sub(V(...a));const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,dir.length(),8),mat);m.position.copy(V(...a).add(V(...b)).multiplyScalar(.5));m.quaternion.setFromUnitVectors(V(0,1,0),dir.normalize());parent.add(m);return m}
  stroke([-.07,0,0],[-.015,-.045,0],.009,sealMat,seal);stroke([-.015,-.045,0],[.08,.055,0],.009,sealMat,seal);
  const scan=new THREE.Group();engineer.add(scan);box(2.1,.008,.012,warmGlow,0,0,.055,scan);
  const scanGlass=new THREE.Mesh(new THREE.PlaneGeometry(2.1,.10),new THREE.MeshBasicMaterial({color:C.copper,transparent:true,opacity:.08,depthWrite:false,blending:THREE.AdditiveBlending}));scanGlass.position.z=.052;scan.add(scanGlass);

  const stand=new THREE.Group();scene.add(stand);
  box(3.0,.10,1.72,black,0,.055,0,stand);box(2.74,.025,1.52,edge,0,.12,0,stand);
  for(const x of [-1.42,1.42])box(.014,.008,1.55,warmGlow,x,.112,0,stand);
  const columns=[];
  for(let i=0;i<3;i++){const g=new THREE.Group();g.position.set(2.85,.65,-1.0+i*.72);g.rotation.y=-.28;scene.add(g);round(.84,.58,.055,black,g);face(g,.78,.52,clientTex,.034);box(.73,.008,.01,greenGlow,0,-.25,.04,g);columns.push(g)}
  const track=new THREE.CatmullRomCurve3([V(1.2,.75,.3),V(2,.8,.1),V(2.6,.7,-.25),V(2.85,.65,-.28)]);
  const trackMat=new THREE.MeshBasicMaterial({color:C.ice,transparent:true,opacity:.22});scene.add(new THREE.Mesh(new THREE.TubeGeometry(track,48,.005,6,false),trackMat));
  const pulses=Array.from({length:5},()=>{const m=new THREE.Mesh(new THREE.SphereGeometry(.018,10,8),greenGlow);scene.add(m);return m});
  const sparks=Array.from({length:28},(_,i)=>{const m=new THREE.Mesh(new THREE.SphereGeometry(.004,5,4),new THREE.MeshBasicMaterial({color:i%4?0x61829d:C.copper,transparent:true,opacity:.25}));m.position.set(Math.sin(i*2.4)*4,.25+(i%9)*.31,-2.5+Math.cos(i*3.7)*1.3);scene.add(m);return m});

  return {
    duration:MSP_DURATION,floor:{tile:.65,base:0x050a12,reflect:1.05},bloom:.3,exposure:1.08,
    chapters:[{start:0,label:'Scope'},{start:6,label:'Engineer'},{start:12,label:'Validate'},{start:18,label:'Hand over'}],
    labels:[
      {text:'Your identity. Your relationship.',at:(t,v)=>v.set(0,1.96,.45),alpha:t=>smooth(.5,1,t)*(1-smooth(5.3,6,t))},
      {text:'VALO / behind your delivery',tone:'accent',at:(t,v)=>v.set(.65,1.9,.15),alpha:t=>smooth(6.4,7,t)*(1-smooth(11.3,12,t))},
      {text:'Validated before handover',tone:'ok',at:(t,v)=>v.set(.6,1.9,.28),alpha:t=>smooth(13.8,14.3,t)*(1-smooth(17.3,18,t))},
      {text:'Delivered under your brand',tone:'ok',at:(t,v)=>v.set(1.7,1.75,-.1),alpha:t=>smooth(19,19.5,t)*(1-smooth(23.2,23.8,t))}
    ],
    fade(t){let f=1;for(const b of CUTS){const depth=b===0||b===24?1:.6;f*=1-depth*(1-smooth(0,.24,Math.abs(t-b)))}return f},
    update(t){
      const open=smooth(4.6,7.3,t)*(1-smooth(17.8,20.5,t)),delivery=smooth(20.2,23.1,t);
      assembly.position.set(delivery*.86,.94+Math.sin(t*.38)*.012,0);assembly.rotation.y=-.13+Math.sin(t*.13)*.045;
      const states=[[-.10,-.04,-.35],[-2.18,.06,.02],[.08,.15,.18],[2.32,.02,.14],[-1.18,.10,.78]];
      parts.forEach((g,i)=>{g.position.set(states[i][0]*open,states[i][1]*open,blend(-.33+i*.115,states[i][2],open));g.rotation.y=i===4?-.36*open:(i-2)*-.09*open;g.rotation.z=i===4?-.015*open:0});
      cover.position.x=blend(0,-3.45,open);cover.position.z=blend(.23,-.55,open);cover.rotation.y=-.48*open;
      cover.scale.setScalar(1);const checked=t>=14.1;const fm=validation.children.find(x=>x.material?.map);if(fm&&fm.material.map!==(checked?validateDone:validateOpen)){fm.material.map=checked?validateDone:validateOpen;fm.material.needsUpdate=true}
      seal.visible=checked;seal.scale.setScalar(.7+.3*smooth(14.1,14.7,t));
      scan.visible=t>6.1&&t<12;scan.position.y=blend(.58,-.58,((t-6.1)%2.8)/2.8);
      columns.forEach((g,i)=>{const reveal=smooth(18.4+i*.3,20+i*.3,t);g.scale.setScalar(.8+.2*reveal);g.position.y=.65+Math.sin(t*.45+i)*.015});
      trackMat.opacity=.04+.34*smooth(19,20.4,t);pulses.forEach((m,i)=>{m.visible=t>19.4;m.position.copy(track.getPoint((t*.31+i/5)%1))});
      sparks.forEach((m,i)=>{m.position.y=.25+(i%9)*.31+Math.sin(t*.25+i)*.025});
    },
    camera(t,out){
      const shots=[
        [[-1.1,2.05,4.15],[-.55,1.93,4.0],[-.10,.91,0],[.0,.94,0],33],
        [[2.4,3.0,8.0],[1.6,2.8,7.7],[-.35,1.0,.05],[-.15,1.0,.05],33],
        [[3.8,1.95,4.2],[3.4,1.85,3.9],[2.15,1.0,.18],[2.2,.98,.18],34],
        [[2.3,2.15,5.5],[2.65,2.3,5.9],[.95,.85,-.2],[1.15,.82,-.25],34]
      ];let i=0;while(i<3&&t>=CUTS[i+1])i++;const u=.5-.5*Math.cos(limit((t-CUTS[i])/6)*Math.PI),s=shots[i];out.pos.set(...s[0].map((n,k)=>blend(n,s[1][k],u)));out.target.set(...s[2].map((n,k)=>blend(n,s[3][k],u)));out.fov=s[4];out.shift=0;
    }
  };
}
