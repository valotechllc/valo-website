/* VALO service worlds. Dependency-free WebGL; all geometry is generated locally.
   Visuals illustrate engineering workflows, not live monitoring or product UI. */
(() => {
'use strict';
const PI=Math.PI,TAU=PI*2,clamp=x=>Math.max(0,Math.min(1,x)),ease=x=>{x=clamp(x);return x*x*(3-2*x)},mix=(a,b,t)=>a+(b-a)*t;
const palettes={ice:[.35,.72,.87],copper:[1,.43,.23],mint:[.39,.94,.73],steel:[.19,.25,.30],dark:[.045,.065,.083]};
const V=(a,b)=>a.map((x,i)=>x-b[i]),dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],norm=a=>{const d=Math.hypot(...a)||1;return a.map(x=>x/d)};
function mul(a,b){const o=new Float32Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++)for(let k=0;k<4;k++)o[c*4+r]+=a[k*4+r]*b[c*4+k];return o}
function camera(eye,target,aspect){const z=norm(V(eye,target)),x=norm(cross([0,1,0],z)),y=cross(z,x);const v=new Float32Array([x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-dot(x,eye),-dot(y,eye),-dot(z,eye),1]);const f=1/Math.tan(.53),near=.1,far=70;return mul(new Float32Array([f/aspect,0,0,0,0,f,0,0,0,0,(far+near)/(near-far),-1,0,0,2*far*near/(near-far),0]),v)}
function model(x,y,z,sx,sy,sz,ry=0){const c=Math.cos(ry),s=Math.sin(ry);return new Float32Array([c*sx,0,-s*sx,0,0,sy,0,0,s*sz,0,c*sz,0,x,y,z,1])}
function shader(gl,type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s}
function program(gl,vs,fs){const p=gl.createProgram();gl.attachShader(p,shader(gl,gl.VERTEX_SHADER,vs));gl.attachShader(p,shader(gl,gl.FRAGMENT_SHADER,fs));gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error('WebGL link failure');return p}
const meshVS=`attribute vec3 position;attribute vec3 normal;uniform mat4 vp;uniform mat4 model;varying vec3 N;varying vec3 P;void main(){vec4 p=model*vec4(position,1.);P=p.xyz;N=normalize(mat3(model)*normal);gl_Position=vp*p;}`;
const meshFS=`precision mediump float;varying vec3 N;varying vec3 P;uniform vec3 color;uniform vec3 eye;uniform float emission;uniform float alpha;void main(){vec3 n=normalize(N),v=normalize(eye-P);float diff=max(dot(n,normalize(vec3(-3.,7.,4.))),0.);float rim=pow(1.-abs(dot(n,v)),3.);float spec=pow(max(dot(reflect(-normalize(vec3(-3.,7.,4.)),n),v),0.),44.);vec3 c=color*(.26+diff*.8)+vec3(.34,.53,.65)*rim*.42+vec3(.73,.84,.91)*spec*.8+color*emission;float fog=1.-exp(-length(eye-P)*.018);c=mix(c,vec3(.018,.033,.047),fog);gl_FragColor=vec4(c,alpha);}`;
const pointVS=`attribute vec3 position;attribute vec3 color;attribute float size;uniform mat4 vp;uniform float pixel;varying vec3 C;void main(){vec4 p=vp*vec4(position,1.);gl_Position=p;gl_PointSize=clamp(size*pixel*38./p.w,1.,56.);C=color;}`;
const pointFS=`precision mediump float;varying vec3 C;void main(){float d=length(gl_PointCoord-.5)*2.;if(d>1.)discard;float a=exp(-d*d*5.);gl_FragColor=vec4(C,a);}`;
const lineVS=`attribute vec3 position;attribute vec3 color;uniform mat4 vp;varying vec3 C;void main(){gl_Position=vp*vec4(position,1.);C=color;}`;
const lineFS=`precision mediump float;varying vec3 C;void main(){gl_FragColor=vec4(C,1.);}`;
const vertices=[],normals=[];
for(const [n,a,b,d,e] of [
 [[0,0,1],[-.5,-.5,.5],[.5,-.5,.5],[.5,.5,.5],[-.5,.5,.5]],[[0,0,-1],[.5,-.5,-.5],[-.5,-.5,-.5],[-.5,.5,-.5],[.5,.5,-.5]],
 [[1,0,0],[.5,-.5,.5],[.5,-.5,-.5],[.5,.5,-.5],[.5,.5,.5]],[[-1,0,0],[-.5,-.5,-.5],[-.5,-.5,.5],[-.5,.5,.5],[-.5,.5,-.5]],
 [[0,1,0],[-.5,.5,.5],[.5,.5,.5],[.5,.5,-.5],[-.5,.5,-.5]],[[0,-1,0],[-.5,-.5,-.5],[.5,-.5,-.5],[.5,-.5,.5],[-.5,-.5,.5]]
])for(const p of [a,b,d,a,d,e]){vertices.push(...p);normals.push(...n)}
function makeWorld(figure){
 const canvas=document.createElement('canvas');canvas.className='service-world';canvas.setAttribute('aria-hidden','true');
 const gl=canvas.getContext('webgl',{alpha:true,antialias:true,powerPreference:'low-power'});
 const ctx=gl?null:canvas.getContext('2d');if(!gl&&!ctx)return null;
 let mesh,points,lines;try{if(gl){mesh=program(gl,meshVS,meshFS);points=program(gl,pointVS,pointFS);lines=program(gl,lineVS,lineFS)}}catch(e){console.warn('VALO scene fallback',e);return null}
 figure.prepend(canvas);
 const loc=(p,n)=>gl.getUniformLocation(p,n),buffer=data=>{const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data),gl.STATIC_DRAW);return b};
 const vertexBuffer=gl?buffer(vertices):null,normalBuffer=gl?buffer(normals):null,pointBuffer=gl?.createBuffer(),lineBuffer=gl?.createBuffer();
 function attr(p,n,b,size,stride=0,offset=0){const l=gl.getAttribLocation(p,n);gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.enableVertexAttribArray(l);gl.vertexAttribPointer(l,size,gl.FLOAT,false,stride,offset)}
 const m=gl?{vp:loc(mesh,'vp'),model:loc(mesh,'model'),eye:loc(mesh,'eye'),color:loc(mesh,'color'),emission:loc(mesh,'emission'),alpha:loc(mesh,'alpha')}:{};
 const pv=gl?loc(points,'vp'):null,pp=gl?loc(points,'pixel'):null,lv=gl?loc(lines,'vp'):null;
 let w=0,h=0,dpr=1,time=window.matchMedia('(prefers-reduced-motion: reduce)').matches?18:0,last=0,running=false,raf=0,lost=false,pointer=[0,0],particleData=[],lineData=[],faces=[],vp,eye,mode=figure.dataset.renderScene;
 function resize(){const r=canvas.getBoundingClientRect();dpr=Math.min(devicePixelRatio||1,1.6);w=r.width;h=r.height;if(!w||!h)return;canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);if(gl)gl.viewport(0,0,canvas.width,canvas.height);draw()}
 const ro=new ResizeObserver(resize);ro.observe(canvas);
 canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();lost=true;cancelAnimationFrame(raf);figure.classList.remove('world-ready');figure.dispatchEvent(new Event('worldfallback'))});
 figure.addEventListener('pointermove',event=>{if(event.pointerType==='touch')return;const r=figure.getBoundingClientRect();pointer=[(event.clientX-r.left)/r.width-.5,(event.clientY-r.top)/r.height-.5]});
 figure.addEventListener('pointerleave',()=>{pointer=[0,0]});
 function project(p){const q=[0,0,0,0];for(let r=0;r<4;r++)q[r]=vp[r]*p[0]+vp[4+r]*p[1]+vp[8+r]*p[2]+vp[12+r];return [(q[0]/q[3]*.5+.5)*canvas.width,(-q[1]/q[3]*.5+.5)*canvas.height,q[3]]}
 function box(x,y,z,sx,sy,sz,color=palettes.steel,emission=0,rotation=0,alpha=1){
 if(ctx){const c=Math.cos(rotation),s=Math.sin(rotation),transform=p=>[x+c*p[0]*sx+s*p[2]*sz,y+p[1]*sy,z-s*p[0]*sx+c*p[2]*sz];
 for(let i=0;i<vertices.length;i+=18){const pts=[];for(let k=0;k<18;k+=3)pts.push(project(transform(vertices.slice(i+k,i+k+3))));const n=norm([c*normals[i]+s*normals[i+2],normals[i+1],-s*normals[i]+c*normals[i+2]]);const light=.3+Math.max(0,dot(n,norm([-3,7,4])))*.8+emission;faces.push({pts,depth:pts.reduce((sum,p)=>sum+p[2],0)/6,color:color.map(v=>Math.min(255,Math.round(v*light*255))),alpha,emission});}return;}
 gl.useProgram(mesh);attr(mesh,'position',vertexBuffer,3);attr(mesh,'normal',normalBuffer,3);gl.uniformMatrix4fv(m.vp,false,vp);gl.uniformMatrix4fv(m.model,false,model(x,y,z,sx,sy,sz,rotation));gl.uniform3fv(m.eye,eye);gl.uniform3fv(m.color,color);gl.uniform1f(m.emission,emission);gl.uniform1f(m.alpha,alpha);gl.drawArrays(gl.TRIANGLES,0,36)}
 function segment(a,b,color,brightness=1){lineData.push(...a,...color.map(v=>v*brightness),...b,...color.map(v=>v*brightness))}
 function particle(p,color,size=2){particleData.push(...p,...color,size)}
 function track(a,b,color,seed=0,intensity=1,arc=.7,stop=1){const path=t=>[mix(a[0],b[0],t),mix(a[1],b[1],t)+Math.sin(t*PI)*arc,mix(a[2],b[2],t)];let prev=a;for(let j=1;j<=30;j++){const p=path(j/30*stop);segment(prev,p,color,.14*intensity);prev=p}for(let j=0;j<3;j++){const t=(time*.115+j/3+seed)%1;if(t>stop)continue;for(let k=0;k<3;k++){const q=Math.max(0,t-k*.014);particle(path(q),color.map(v=>v*intensity*(1-k/4)),k===0?2.2:1.3)}}}
 function ring(x,y,z,r,color,brightness=1,tilt=0){let prev;for(let j=0;j<=100;j++){const a=j/100*TAU,p=[x+Math.cos(a)*r,y+Math.sin(a)*r*Math.sin(tilt),z+Math.sin(a)*r*Math.cos(tilt)];if(prev)segment(prev,p,color,brightness);prev=p}}
 function pad(x,z,s,color,y=-1.55){box(x,y,z,s,.12,s,palettes.dark);for(const k of [-1,1]){box(x+k*s/2,y+.07,z,.018,.014,s,color,1);box(x,y+.07,z+k*s/2,s,.014,.018,color,1)}}
 function gateway(x,z,scale=1,active=1){const C=palettes.copper;box(x,-1.25,z,2.7*scale,.26,1.15*scale,palettes.steel);for(const k of [-1,1]){box(x+k*1.03*scale,.2,z,.14,2.7*scale,.42,palettes.steel);box(x+k*1.01*scale,.2,z+.23,.035,2.45*scale,.025,C,active*1.8)}box(x,1.55*scale,z,2.2*scale,.14,.42,palettes.steel);box(x,1.55*scale,z+.23,2.02*scale,.026,.025,C,active*1.8);for(let j=0;j<8;j++)box(x,-.9+j*.31*scale,z,1.9*scale,.012,.018,palettes.ice,.08);ring(x,-1.1,z,1.8*scale,C,.45);particle([x,1.56*scale,z+.2],C,11)}
 function node(x,y,z,s=.25,C=palettes.ice){box(x,y,z,s,s*1.5,s,palettes.steel,0,time*.04);box(x,y+s*.77,z,s*.8,.024,s*.8,C,1.4);particle([x,y+s*.85,z],C,3)}
 function draw(){if(lost||!w||!h)return;
  if(gl){gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.enable(gl.DEPTH_TEST);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);}else ctx.clearRect(0,0,canvas.width,canvas.height);particleData=[];lineData=[];faces=[];
  const mobile=w<700,hero=mode==='hero',orbit=Math.sin(time*.085)*.19+pointer[0]*.18;
  const distance=mobile?8.2:11.8;const target=[mobile?0:-.7,-.1,0];
  eye=[Math.sin(.48+orbit)*distance,(mobile?4.8:6.4)+Math.sin(time*.12)*.4-pointer[1],Math.cos(.48+orbit)*distance];vp=camera(eye,target,w/h);
  const C=palettes.copper,I=palettes.ice,M=palettes.mint,phase=(time%24)/24;
  // Quiet architecture and a vanishing floor give the luminous traffic depth.
  for(let j=-10;j<=10;j++){segment([-12,-1.7,j*1.1],[12,-1.7,j*1.1],I,.035);segment([j*1.1,-1.7,-12],[j*1.1,-1.7,12],I,.035)}
  if(mode==='migration'||hero){
   const progress=ease((time%24-5)/8)*(1-ease((time%24-22)/2)),old=1-progress;
   gateway(.8,0,1,1);pad(.8,0,4,C);
   if(!hero){box(-2.25,-.75,-.8,.9,.55,1.1,palettes.steel);box(-2.25,-.44,-.8,.75,.025,.9,I,old*.5)}
   for(let j=0;j<7;j++){
    const z=(j-3)*.83;node(-5.6,-.8,z,.21,I);node(5.1,-.8,z,.21,M);
    track([-5.6,-.5,z],[.8,-.15,z*.24],I,j*.13,hero?1:.2+.8*progress,.55);
    track([.8,-.15,z*.24],[5.1,-.5,z],progress>.25?M:I,j*.13+.5,.9,.55);
    if(!hero&&old>.05){track([-5.6,-.5,z],[-2.25,-.4,-.8],I,j*.09,old*.65,.3);track([-2.25,-.4,-.8],[5.1,-.5,z],I,j*.09+.2,old*.65,.3);}
   }
   for(let j=0;j<32;j++){const a=j/32*TAU+time*.08;particle([.8+Math.cos(a)*1.7,-1.05,Math.sin(a)*1.7],C,1.6)}
   if(progress>.7)ring(.8,.2,0,2.3+Math.sin(time)*.03,M,.24,PI/2);
  }else if(mode==='segmentation'){
   const spread=ease((time%24-2)/7)*(1-ease((time%24-22)/2));
   for(let group=0;group<3;group++){
    const x=(group-1)*3.7*spread,z=group===1?-1:1,COL=[I,M,C][group];pad(x,z,2.8,COL);
    for(let j=0;j<6;j++){const nx=x+(j%3-1)*.72,ny=-.8,nz=z+(Math.floor(j/3)-.5)*1.05;node(nx,ny,nz,.22,COL);if(j>0)track([x,-.8,z],[nx,ny,nz],COL,j*.12,.45,.4)}
    // Boundaries rise from the separated trust zones.
    for(let k=0;k<4;k++){const a=k*PI/2;segment([x+Math.cos(a)*1.4,-1.5,z+Math.sin(a)*1.4],[x+Math.cos(a)*1.4,-1.5+spread*2.1,z+Math.sin(a)*1.4],COL,.38)}
   }
   if(spread>.7){track([-3.7,-.4,1],[0,-.4,-1],M,0,1,.9);track([3.7,-.4,1],[0,-.4,-1],C,.2,1,.8,.48);particle([1.9,.4,0],C,12)}
   else for(let j=0;j<9;j++)track([-1.5,-.5,(j-4)*.3],[1.5,-.5,(4-j)*.3],I,j*.11,.7,.5);
  }else if(mode==='assessment'){
   const sort=ease((time%24-10)/6)*(1-ease((time%24-22)/2)),scan=(time%10)/10;
   ring(-.5,0,0,2.6,I,.3,PI/2);ring(-.5,0,0,2.6,I,.2,0);
   for(let j=0;j<46;j++){
    const a=j*2.3999,b=Math.acos(1-2*(j+.5)/46),r=2.25;
    const globe=[-.5+Math.sin(b)*Math.cos(a+time*.07)*r,Math.cos(b)*r,Math.sin(b)*Math.sin(a+time*.07)*r];
    const row=j%3,target=[(row-1)*3.25,-.6+Math.floor(j/3)*.075,(Math.floor(j/3)%5-2)*.55];const p=globe.map((v,k)=>mix(v,target[k],sort));
    const col=j%9===0?C:j%3===0?M:I;node(...p,.095,col);if(j%9===0)particle(p,C,7);
    if(j<45&&sort<.5)segment(p,[0,0,0],I,.045);
   }
   const sy=mix(-2.4,2.4,scan);ring(-.5,sy,0,Math.sqrt(Math.max(.01,6.76-sy*sy)),C,.85);particle([-.5,sy,0],C,10);
   for(let k=0;k<3;k++){pad((k-1)*3.25,0,2.5,[C,I,M][k]);if(sort>.4)track([(k-1)*3.25,-1,1.4],[(k-1)*3.25,-1,-1.4],[C,I,M][k],k*.2,sort,.2)}
  }else if(mode==='msp'){
   pad(0,0,3.3,C);box(0,-.65,0,1.3,1.7,1.3,palettes.steel,0,-.3);box(0,.24,0,1.42,.08,1.42,C,1.2,-.3);
   ring(0,.3,0,1.7,C,.7);ring(0,.38,0,1.85,I,.25);
   for(let j=0;j<5;j++){
    const a=j/5*TAU+.3,x=Math.cos(a)*4.5,z=Math.sin(a)*4.5;pad(x,z,1.6,I);for(let k=0;k<3;k++)node(x+(k-1)*.42,-.85,z,.19,I);
    const returning=time%24>12;track(returning?[0,.3,0]:[x,-.6,z],returning?[x,-.6,z]:[0,.3,0],returning?M:I,j*.2,1,1.3);
   }
   // The specialist layer stays inside the MSP delivery boundary.
   const a=time*.3;node(Math.cos(a)*.7,1.15,Math.sin(a)*.7,.25,C);track([0,1.2,0],[0,.2,0],C,0,1,0);
  }
  // Additive light passes. Bright cores sit inside soft particle halos.
  if(ctx){
   ctx.globalCompositeOperation='source-over';faces.sort((a,b)=>b.depth-a.depth);for(const face of faces){const p=face.pts;ctx.beginPath();ctx.moveTo(p[0][0],p[0][1]);for(const k of [1,2,5])ctx.lineTo(p[k][0],p[k][1]);ctx.closePath();const rgb=face.color.join(',');const gradient=ctx.createLinearGradient(p[0][0],p[0][1],p[2][0]+1,p[2][1]+1);gradient.addColorStop(0,`rgba(${rgb},${face.alpha})`);gradient.addColorStop(1,`rgba(${face.color.map(v=>Math.round(v*.66)).join(',')},${face.alpha})`);ctx.fillStyle=gradient;ctx.fill();ctx.strokeStyle=face.emission>.5?`rgba(${rgb},.5)`:'rgba(140,185,207,.09)';ctx.lineWidth=.6*dpr;ctx.stroke();}
   ctx.globalCompositeOperation='lighter';for(let i=0;i<lineData.length;i+=12){const a=project(lineData.slice(i,i+3)),b=project(lineData.slice(i+6,i+9));const col=lineData.slice(i+3,i+6),brightness=Math.max(...col);ctx.strokeStyle=`rgba(${col.map(v=>Math.round(v/(brightness||1)*255)).join(',')},${brightness*.65})`;ctx.lineWidth=.8*dpr;ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.stroke();}
   for(let i=0;i<particleData.length;i+=7){const p=project(particleData.slice(i,i+3)),rgb=particleData.slice(i+3,i+6).map(v=>Math.round(Math.min(1,v)*255)).join(','),size=Math.max(1,particleData[i+6]*dpr*26/p[2]);const halo=ctx.createRadialGradient(p[0],p[1],0,p[0],p[1],size*1.8);halo.addColorStop(0,`rgba(${rgb},.9)`);halo.addColorStop(.12,`rgba(${rgb},.5)`);halo.addColorStop(1,`rgba(${rgb},0)`);ctx.fillStyle=halo;ctx.fillRect(p[0]-size*1.8,p[1]-size*1.8,size*3.6,size*3.6);}
   ctx.globalCompositeOperation='source-over';
  }else {gl.depthMask(false);gl.blendFunc(gl.SRC_ALPHA,gl.ONE);
  gl.useProgram(lines);gl.uniformMatrix4fv(lv,false,vp);gl.bindBuffer(gl.ARRAY_BUFFER,lineBuffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(lineData),gl.DYNAMIC_DRAW);attr(lines,'position',lineBuffer,3,24,0);attr(lines,'color',lineBuffer,3,24,12);gl.drawArrays(gl.LINES,0,lineData.length/6);
  gl.useProgram(points);gl.uniformMatrix4fv(pv,false,vp);gl.uniform1f(pp,dpr);gl.bindBuffer(gl.ARRAY_BUFFER,pointBuffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(particleData),gl.DYNAMIC_DRAW);attr(points,'position',pointBuffer,3,28,0);attr(points,'color',pointBuffer,3,28,12);attr(points,'size',pointBuffer,1,28,24);gl.drawArrays(gl.POINTS,0,particleData.length/7);gl.depthMask(true);}
  figure.dataset.worldPhase=String(Math.floor(time%24/6));
 }
 function tick(now){if(!running||lost)return;if(last&&now-last<32){raf=requestAnimationFrame(tick);return;}const delta=last?Math.min((now-last)/1000,.06):0;last=now;time+=delta;draw();raf=requestAnimationFrame(tick)}
 const api={setRunning(value){if(lost)return;if(value===running)return;running=value;cancelAnimationFrame(raf);last=0;if(value)raf=requestAnimationFrame(tick);else draw()},draw,canvas,get time(){return time}};
 figure.dataset.worldRenderer=gl?'webgl':'canvas';figure.classList.add('world-ready');resize();return api;
}
window.ValoWorlds={create:makeWorld};
})();
