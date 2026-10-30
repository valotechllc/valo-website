/* Rebuild the local service films with Node, @napi-rs/canvas, and FFmpeg.
   NODE_PATH may point to an existing installation of @napi-rs/canvas. */
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { once } from 'node:events';
import { existsSync } from 'node:fs';
const require=createRequire(import.meta.url);
let canvasModule;
try { canvasModule=require('@napi-rs/canvas'); }
catch { canvasModule=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/@napi-rs/canvas'); }
const {createCanvas,GlobalFonts}=canvasModule;
for(const [name,paths] of [['MotionSans',[process.env.SERVICE_SANS_FONT,'/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf','C:/Windows/Fonts/arial.ttf','/System/Library/Fonts/Supplemental/Arial.ttf']],['MotionMono',[process.env.SERVICE_MONO_FONT,'/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf','C:/Windows/Fonts/cour.ttf','/System/Library/Fonts/Supplemental/Courier New.ttf']]]){const path=paths.find(p=>p&&existsSync(p));if(path)GlobalFonts.registerFromPath(path,name);}
const out=process.argv[2]||'.';await mkdir(out,{recursive:true});
const copper='#edab83',cyan='#8fcedb',mint='#9ed6bd',white='#edf2f4',muted='#8a9eaf';
const ease=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t)};
function scene(c,W,H,mode,time){
 c.resetTransform();c.clearRect(0,0,W,H);
 const bg=c.createLinearGradient(0,0,W,H);bg.addColorStop(0,'#070e17');bg.addColorStop(.55,'#152738');bg.addColorStop(1,'#070f19');c.fillStyle=bg;c.fillRect(0,0,W,H);
 const mobile=W<H, S=mobile?W/790:W/1400, X=mobile?W*.5:W*.69,Y=mobile?H*.235:H*.36;
 c.save();c.translate(X,Y);c.scale(S,S);
 const glow=c.createRadialGradient(0,30,10,0,30,450);glow.addColorStop(0,'rgba(97,143,169,.13)');glow.addColorStop(1,'rgba(8,16,26,0)');c.fillStyle=glow;c.fillRect(-500,-350,1000,700);
 c.strokeStyle='#88a7bd10';c.lineWidth=1;
 for(let i=-500;i<=500;i+=40){c.beginPath();c.moveTo(i,-300);c.lineTo(i,310);c.stroke();c.beginPath();c.moveTo(-500,i);c.lineTo(500,i);c.stroke();}
 function text(s,x,y,size=16,color=white,align='center'){c.font=`${size}px ${size<16?'MotionMono':'MotionSans'}`;c.fillStyle=color;c.textAlign=align;c.fillText(s,x,y)}
 function rect(x,y,w,h,r=8,fill='#142635',stroke='#526d80'){c.beginPath();c.roundRect(x,y,w,h,r);c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=1;c.stroke();}}
 function path(points,color,width=1){c.beginPath();points.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.strokeStyle=color;c.lineWidth=width;c.stroke();}
 function route(x1,y1,x2,y2,color,alpha=1,blocked=false){c.save();c.globalAlpha=alpha;const bend=(x1+x2)/2;c.beginPath();c.moveTo(x1,y1);c.bezierCurveTo(bend,y1,bend,y2,x2,y2);c.strokeStyle=color+'40';c.lineWidth=2;c.stroke();
  for(let n=0;n<4;n++){let t=(time*.28+n*.25)%1;if(blocked&&t>.63)continue;const u=1-t;const x=u*u*u*x1+3*u*u*t*bend+3*u*t*t*bend+t*t*t*x2,y=u*u*u*y1+3*u*u*t*y1+3*u*t*t*y2+t*t*t*y2;c.shadowColor=color;c.shadowBlur=15;c.fillStyle=color;c.beginPath();c.arc(x,y,3.5,0,Math.PI*2);c.fill();}
  if(blocked){const x=x1+(x2-x1)*.63,y=y1+(y2-y1)*.63;c.shadowBlur=0;path([[x-7,y-7],[x+7,y+7]],copper,2);path([[x+7,y-7],[x-7,y+7]],copper,2);}c.restore();}
 function device(x,y,label,accent=copper,opacity=1,scale=1){c.save();c.globalAlpha=opacity;c.translate(x,y);c.scale(scale,scale);
  c.shadowColor='#0009';c.shadowBlur=28;c.shadowOffsetY=20;path([[-115,30],[91,30],[128,-3],[-78,-3],[-115,30]],'#000',22);c.shadowBlur=0;c.shadowOffsetY=0;
  const top=c.createLinearGradient(-120,-100,100,0);top.addColorStop(0,'#617486');top.addColorStop(1,'#233747');c.fillStyle=top;c.beginPath();c.moveTo(-120,-75);c.lineTo(-76,-116);c.lineTo(120,-116);c.lineTo(76,-75);c.closePath();c.fill();
  c.fillStyle='#15212e';c.beginPath();c.moveTo(76,-75);c.lineTo(120,-116);c.lineTo(120,-38);c.lineTo(76,3);c.closePath();c.fill();
  const face=c.createLinearGradient(0,-75,0,3);face.addColorStop(0,'#344c5e');face.addColorStop(.25,'#142432');face.addColorStop(1,'#0b1722');rect(-120,-75,196,78,3,face,'#71869a');
  for(let i=0;i<12;i++){const px=-105+i*13;rect(px,-58,9,15,1,'#050c12','#425b6e');rect(px,-32,9,15,1,'#050c12','#425b6e');}
  c.shadowColor=accent;c.shadowBlur=13;path([[-120,4],[76,4],[120,-38]],accent,2);c.shadowBlur=0;
  for(let i=0;i<6;i++){c.fillStyle=i%2?accent:mint;c.fillRect(-105+i*27,-8,4,2)}
  for(let i=0;i<8;i++)path([[-75+i*18,-105],[-100+i*18,-82]],'#8da2af65',1);
  text(label,-1,40,17,accent);c.restore();}
 function endpoint(x,y,label,color=cyan){rect(x-45,y-26,90,52,6,'#142636',color+'80');text(label,x,y+6,16,color)}
 function check(x,y,label,on=true){c.strokeStyle=on?mint:'#546a7c';c.lineWidth=2;c.beginPath();c.arc(x,y,9,0,Math.PI*2);c.stroke();if(on)path([[x-4,y],[x-1,y+3],[x+5,y-4]],mint,2);text(label,x+19,y+5,15,on?white:muted,'left')}
 function document(x,y,title,lines,color=copper,opacity=1){c.save();c.globalAlpha=opacity;const gr=c.createLinearGradient(x,y,x,y+145);gr.addColorStop(0,'#304759');gr.addColorStop(1,'#142432');rect(x-68,y-75,136,150,7,gr,color+'90');path([[x-49,y-50],[x-20,y-50]],color,3);text(title,x,y-23,15,white);lines.forEach((l,i)=>{text(l,x,y+4+i*22,12,muted)});c.restore()}
 function title(kicker,title){text(kicker,0,-235,13,copper);text(title,0,-204,22,white)}
 const phase=Math.floor(time/3)%4,p=(time%3)/3;
 if(mode==='migration'||mode==='hero'){
  title('FIREWALL MIGRATION','Review. Stage. Cut over. Validate.');
  const transfer=ease((time-3)/5),depart=ease((time-8)/2.5),nextX=145-(1-ease((time-2)/2))*110;
  const oldOpacity=1-depart*.65;
  route(-350,-10,-145,-65,cyan,1-transfer*.65);route(-95,-65,345,-10,cyan,1-transfer);
  route(-350,-10,nextX,-25,copper,transfer);route(nextX,-25,345,-10,mint,transfer);
  endpoint(-365,-10,'USERS');endpoint(365,-10,'APPS',mint);
  device(-135-depart*60,-28,'EXISTING',cyan,oldOpacity,.82);
  device(nextX,70-(1-ease((time-2)/2))*50,'REPLACEMENT',copper,ease(time/1.6),1.06);
  if(time<4){document(-95,155,'POLICY REVIEW',['Rules inventoried','Access reviewed'],cyan,ease(time/1));}
  else {check(-210,182,'Policy mapped',true);check(-5,182,'Changes staged',time>5.5);check(195,182,'Paths validated',time>9);}
  if(time>=9){c.globalAlpha=ease((time-9)/1);text('VALIDATED TRAFFIC PATH',155,143,13,mint);c.globalAlpha=1;}
 } else if(mode==='segmentation'){
  title('NETWORK SEGMENTATION','From a flat network to defined trust zones.');
  const spread=ease((time-1.5)/3.5);const targets=[[-255,-50],[-255,25],[0,-50],[0,25],[255,-50],[255,25]];
  const initial=[[-80,-20],[20,30],[80,-60],[-35,70],[110,60],[-110,-70]];
  const labels=['USER','DEVICE','APP','SERVER','GUEST','BYOD'];
  for(let i=0;i<3;i++){const x=(i-1)*255;c.save();c.globalAlpha=spread;rect(x-102,-110,204,235,12,'#112333',i===2?copper+'90':cyan+'90');text(['WORKFORCE','APPLICATIONS','GUEST ACCESS'][i],x,-82,15,i===2?copper:cyan);c.restore();}
  const nodes=targets.map((target,i)=>[initial[i][0]+(target[0]-initial[i][0])*spread,initial[i][1]+(target[1]-initial[i][1])*spread]);
  if(time<4){for(let i=0;i<5;i++)route(...nodes[i],...nodes[i+1],cyan,1-spread*.8);}
  if(time>4){route(-210,15,-45,15,mint,ease((time-4)/1));route(210,30,45,30,copper,ease((time-6)/1),true);}
  nodes.forEach((n,i)=>endpoint(...n,labels[i],i>3?copper:cyan));
  if(time>5){check(-255,170,'Zones defined');check(-25,170,'Access controlled',time>7);check(210,170,'Paths tested',time>9)}
 } else if(mode==='assessment'){
  title('CYBERSECURITY RISK ASSESSMENT','Evidence becomes a prioritized plan.');
  const gather=ease((time-2)/2),prioritize=ease((time-5)/2),roadmap=ease((time-8)/2);
  const names=['FIREWALL','IDENTITY','NETWORK'];
  for(let i=0;i<3;i++){
    const x=-265+i*80*(1-gather),y=-60+i*80;
    c.save();c.globalAlpha=1-gather*.8;document(x,y,names[i],['Evidence collected','Configuration review'],cyan);c.restore();
  }
  const scan=-360+(time%4)/4*330;const beam=c.createLinearGradient(scan-45,0,scan+4,0);beam.addColorStop(0,'#8fcedb00');beam.addColorStop(1,'#8fcedb55');c.fillStyle=beam;c.fillRect(scan-45,-160,49,350);path([[scan,-160],[scan,190]],cyan,2);
  for(let i=0;i<3;i++){
    const x=-20+prioritize*120,y=-105+i*94;
    c.save();c.globalAlpha=gather;rect(x,y,225,74,6,'#203647',[copper,cyan,mint][i]+'99');text(['HIGH PRIORITY','NEXT ACTION','PLANNED WORK'][i],x+16,y+26,13,[copper,cyan,mint][i],'left');text(['Tighten access policy','Harden configuration','Validate remediation'][i],x+16,y+50,14,white,'left');c.restore();
  }
  if(roadmap>0){c.save();c.globalAlpha=roadmap;path([[-30,-110],[-30,155]],mint,2);for(let i=0;i<3;i++){c.fillStyle=mint;c.beginPath();c.arc(-30,-69+i*94,5,0,Math.PI*2);c.fill();text('0'+(i+1),-55,-64+i*94,13,mint,'right')}text('REMEDIATION ROADMAP',150,218,14,mint);c.restore();}
 } else if(mode==='msp'){
  title('WHITE-LABEL MSP ENGINEERING','Specialist delivery. Under your brand.');
  endpoint(-325,-70,'CLIENT A');endpoint(-325,35,'CLIENT B');endpoint(-325,140,'CLIENT C');
  rect(-110,-137,210,300,12,'#182c3d',copper+'99');text('YOUR MSP',-5,-95,22,white);text('YOUR CLIENT BRAND',-5,-66,12,copper);
  document(280,-30,'VALO',['Cisco / Palo Alto','Specialist engineer'],cyan);
  if(time<5){route(-280,-70,-110,-40,cyan);route(100,-40,215,-30,copper,ease(time/1.5));}
  else {route(215,-30,100,40,mint);route(-110,40,-280,35,mint);}
  const t=(time%6)/6,x=time<6?-265+t*480:215-t*480;
  c.save();c.globalAlpha=.85;rect(x-39,60,78,52,4,'#304a5d',mint);text(time<6?'SCOPE':'HANDOVER',x,91,11,mint);c.restore();
  if(time>6){check(-90,205,'Documented changes');check(160,205,'Client handover',time>9)}
 }
 const phases={hero:['Review the existing policy','Stage the replacement','Shift approved traffic','Validate and hand over'],migration:['Review the existing policy','Stage the replacement','Shift approved traffic','Validate and hand over'],segmentation:['Map the flat network','Separate trust zones','Enforce access policy','Validate permitted paths'],assessment:['Collect evidence','Identify findings','Prioritize risk','Build the roadmap'],msp:['Scope the client project','Bring in the specialist','Deliver under your brand','Document and hand over']};
 const phaseNames=phases[mode];
 text(`0${phase+1} / ${phaseNames[phase].toUpperCase()}`,0,282,14,copper);
 // A four-part chapter marker makes the sequence visible even without sound.
 for(let i=0;i<4;i++){rect(-145+i*75,307,64,2,0,i===phase?copper:'#627a8b55',null)}
 c.restore();
 // Readability over the left-hand page copy; the service action stays unobscured.
 const vignette=c.createLinearGradient(0,0,W,0);vignette.addColorStop(0,'rgba(3,9,16,.82)');vignette.addColorStop(mobile?.2:.36,'rgba(3,9,16,.12)');vignette.addColorStop(1,'rgba(3,9,16,0)');c.fillStyle=vignette;c.fillRect(0,0,W,H);
}
async function render(mode,mobile=false){
 const W=mobile?720:1280,H=mobile?1280:720,fps=24,duration=12;
 const canvas=createCanvas(W,H),c=canvas.getContext('2d');
 const filename=`${out}/service-${mode}${mobile?'-mobile':''}.mp4`;
 const ff=spawn('ffmpeg',['-hide_banner','-loglevel','error','-y','-f','rawvideo','-pixel_format','rgba','-video_size',`${W}x${H}`,'-framerate',String(fps),'-i','pipe:0','-an','-c:v','libx264','-preset','fast','-crf','22','-pix_fmt','yuv420p','-movflags','+faststart',filename],{stdio:['pipe','inherit','inherit']});
 for(let frame=0;frame<fps*duration;frame++){
  scene(c,W,H,mode,frame/fps);
  if(frame===fps*9&&!mobile)await writeFile(`${out}/service-${mode}-poster.webp`,await canvas.encode('webp',86));
  const pixels=c.getImageData(0,0,W,H).data;
  if(!ff.stdin.write(pixels))await once(ff.stdin,'drain');
 }
 ff.stdin.end();const [code]=await once(ff,'exit');if(code!==0)throw new Error('FFmpeg failed');console.log('Rendered '+filename);
}
for(const mode of ['migration','segmentation','assessment','msp']){await render(mode);await render(mode,true);}
