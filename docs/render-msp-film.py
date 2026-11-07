"""MSP-only studio renderer: Cook-Torrance materials, soft shadow map, anti-aliasing,
blurred floor reflection, bloom and film grade. Uses original scene poses and geometry.
Dependencies: moderngl, numpy, Pillow, FFmpeg, EGL. No browser automation.
python docs/render-msp-film.py export.json output_dir [--film] [--mobile]
"""
import sys,json,base64,io,subprocess,time,math
from pathlib import Path
import numpy as np
import moderngl
from PIL import Image
src,out=Path(sys.argv[1]),Path(sys.argv[2]);out.mkdir(parents=True,exist_ok=True)
film='--film' in sys.argv;mobile='--mobile' in sys.argv
W,H=(800,1100) if mobile else (1920,1080)
data=json.loads(src.read_text());ctx=moderngl.create_standalone_context(backend='egl')
VS='''#version 330
in vec3 in_pos;in vec3 in_normal;in vec2 in_uv;uniform mat4 model,vp,lightvp;uniform float mirror;out vec3 P,N;out vec2 uv;out vec4 shadowP;
void main(){vec4 world=model*vec4(in_pos,1.);world.y*=mirror;P=world.xyz;N=normalize(transpose(inverse(mat3(model)))*in_normal);N.y*=mirror;uv=in_uv;shadowP=lightvp*world;gl_Position=vp*world;}'''
FS='''#version 330
uniform vec3 color,emission,eye;uniform float opacity,basic,roughness,metalness,mirror;uniform int mapped;uniform sampler2D image;uniform sampler2DShadow shadowMap;in vec3 P,N;in vec2 uv;in vec4 shadowP;out vec4 frag;
const float PI=3.14159265;
vec3 fres(float c,vec3 f0){return f0+(1.-f0)*pow(1.-c,5.);}
vec3 lighting(vec3 n,vec3 v,vec3 l,vec3 base,vec3 f0,float r,vec3 energy){vec3 h=normalize(v+l);float nv=max(dot(n,v),.001),nl=max(dot(n,l),0.),nh=max(dot(n,h),0.),hv=max(dot(h,v),0.);float a=r*r,a2=a*a;float den=nh*nh*(a2-1.)+1.;float D=a2/(PI*den*den);float k=pow(r+1.,2.)/8.;float G=nv/(nv*(1.-k)+k)*nl/(nl*(1.-k)+k);vec3 F=fres(hv,f0);vec3 spec=D*G*F/(4.*nv*max(nl,.001));vec3 kd=(1.-F)*(1.-metalness);return (kd*base/PI+spec)*energy*nl;}
vec3 studio(vec3 d){vec3 c=vec3(.016,.029,.052);float top=exp(-pow((d.x+.35)*5.,2.))*pow(max(d.y,0.),4.);float side=exp(-pow((d.x-.75)*7.,2.))*exp(-pow((d.y-.3)*4.,2.));float rim=exp(-pow((d.x+.85)*7.,2.))*exp(-pow((d.y-.15)*5.,2.));c+=vec3(.7,.87,1.)*top*1.7+vec3(1.,.52,.25)*side*.9+vec3(.22,.43,.75)*rim*1.4;return c;}
float shadow(){vec3 q=shadowP.xyz/shadowP.w*.5+.5;if(q.x<0.||q.x>1.||q.y<0.||q.y>1.||q.z>1.)return 1.;float sum=0.;for(int i=-1;i<=1;i++)for(int j=-1;j<=1;j++)sum+=texture(shadowMap,vec3(q.xy+vec2(i,j)/1024.,q.z-.004));return sum/9.;}
void main(){vec4 tx=mapped==1?texture(image,uv):vec4(1.);float a=opacity*tx.a;if(a<.015)discard;vec3 base=color*pow(tx.rgb,vec3(2.2));vec3 n=normalize(N);if(!gl_FrontFacing)n=-n;vec3 v=normalize(eye-P);float r=clamp(roughness,.12,.9);vec3 f0=mix(vec3(.045),base,metalness);vec3 c;
if(basic>.5)c=base*.92;else{float s=mirror>0.?shadow():1.;c=lighting(n,v,normalize(vec3(-3.,5.,4.)-P),base,f0,r,vec3(4.5,5.9,8.))*s;c+=lighting(n,v,normalize(vec3(3.,2.,-1.)-P),base,f0,r,vec3(3.2,1.15,.38));c+=lighting(n,v,normalize(vec3(-3.,2.,-2.)-P),base,f0,r,vec3(.6,1.5,3.0));vec3 F=fres(max(dot(n,v),0.),f0);c+=(base*.11*(1.-metalness)+studio(reflect(-v,n))*F*(1.-r*.4));}c+=emission;float fog=1.-exp(-length(eye-P)*.009);c=mix(c,vec3(.002,.004,.010),fog);frag=vec4(c,a);}'''
prog=ctx.program(vertex_shader=VS,fragment_shader=FS)
shadowprog=ctx.program(vertex_shader='''#version 330
in vec3 in_pos;uniform mat4 model,lightvp;void main(){gl_Position=lightvp*model*vec4(in_pos,1.);}''',fragment_shader='''#version 330
void main(){}''')
vaos=[];shadowvaos=[]
for g in data['geometries']:
 p=np.array(g['p'],dtype='f4').reshape(-1,3);n=np.array(g['n'],dtype='f4').reshape(-1,3);uv=np.array(g['uv'],dtype='f4').reshape(-1,2) if g['uv'] else np.zeros((len(p),2),dtype='f4');b=ctx.buffer(np.concatenate([p,n,uv],axis=1).astype('f4').tobytes());idx=ctx.buffer(np.array(g['index'],dtype='i4').tobytes()) if g['index'] else None
 vaos.append(ctx.vertex_array(prog,[(b,'3f 3f 2f','in_pos','in_normal','in_uv')],idx));shadowvaos.append(ctx.vertex_array(shadowprog,[(b,'3f 20x','in_pos')],idx))
textures=[]
for t in data['textures']:
 im=Image.open(io.BytesIO(base64.b64decode(t))).convert('RGBA').transpose(Image.Transpose.FLIP_TOP_BOTTOM);tx=ctx.texture(im.size,4,im.tobytes());tx.build_mipmaps();tx.filter=(moderngl.LINEAR_MIPMAP_LINEAR,moderngl.LINEAR);textures.append(tx)
white=ctx.texture((1,1),4,b'\xff'*4)
color=ctx.texture((W,H),4,dtype='f2');resolved=ctx.framebuffer(color)
msColor=ctx.renderbuffer((W,H),4,samples=4,dtype='f2');msDepth=ctx.depth_renderbuffer((W,H),samples=4);fbo=ctx.framebuffer(msColor,msDepth)
refl=ctx.texture((W//2,H//2),4,dtype='f2');reflFbo=ctx.framebuffer(refl,ctx.depth_renderbuffer((W//2,H//2)));refl.filter=(moderngl.LINEAR,moderngl.LINEAR)
shadowTex=ctx.depth_texture((1024,1024));shadowTex.compare_func='<=';shadowTex.repeat_x=False;shadowTex.repeat_y=False;shadowFbo=ctx.framebuffer(depth_attachment=shadowTex)
final=ctx.simple_framebuffer((W,H));quad=ctx.buffer(np.array([-1,-1,1,-1,-1,1,1,1],dtype='f4').tobytes())
post=ctx.program(vertex_shader='''#version 330
in vec2 p;out vec2 uv;void main(){uv=p*.5+.5;gl_Position=vec4(p,0.,1.);}''',fragment_shader='''#version 330
uniform sampler2D frame;uniform vec2 res;uniform float time,fade;in vec2 uv;out vec4 frag;
vec3 aces(vec3 x){return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14),0.,1.);}
void main(){vec3 c=texture(frame,uv).rgb;vec3 bloom=vec3(0.);for(int x=-2;x<=2;x++)for(int y=-2;y<=2;y++){vec3 a=texture(frame,uv+vec2(x,y)*3./res).rgb;bloom+=max(a-vec3(1.05),0.)*.020;}c+=bloom;float vig=1.-.5*dot((uv-.5)*vec2(1.,1.),(uv-.5)*vec2(1.,1.));c=pow(aces(c*.98),vec3(1./2.2))*vig;float grain=fract(sin(dot(uv*res+time,vec2(12.9,78.2)))*43758.5)-.5;c+=grain*.002;c*=fade;frag=vec4(c,1.);}''');postvao=ctx.vertex_array(post,[(quad,'2f','p')])
floorprog=ctx.program(vertex_shader='''#version 330
in vec3 p;uniform mat4 vp,lightvp;out vec3 P;out vec4 shadowP;void main(){P=p;shadowP=lightvp*vec4(p,1.);gl_Position=vp*vec4(p,1.);}''',fragment_shader='''#version 330
uniform sampler2D reflection;uniform vec2 res;uniform vec3 eye;in vec3 P;in vec4 shadowP;out vec4 frag;
void main(){vec2 uv=gl_FragCoord.xy/res;vec3 reflected=vec3(0.);float k=2.5+length(eye-P)*.22;for(int x=-1;x<=1;x++)for(int y=-1;y<=1;y++)reflected+=texture(reflection,uv+vec2(x,y)*k/res).rgb/9.;float f=.08+.38*pow(1.-normalize(eye-P).y,3.);float contact=exp(-dot((P.xz-vec2(.35,0.))*vec2(.6,1.),(P.xz-vec2(.35,0.))*vec2(.6,1.)))*.6;vec3 base=vec3(.002,.004,.009)*(1.-contact);frag=vec4(base+reflected*f,1.);}''')
floorb=ctx.buffer(np.array([-100,0,-100,100,0,-100,-100,0,100,100,0,100],dtype='f4').tobytes());floorvao=ctx.vertex_array(floorprog,[(floorb,'3f','p')])
def norm(v):return v/np.linalg.norm(v)
def look(eye,target):
 z=norm(eye-target);x=norm(np.cross([0,1,0],z));y=np.cross(z,x);v=np.eye(4,dtype='f4');v[:3,:3]=np.array([x,y,z]);v[:3,3]=-v[:3,:3]@eye;return v
lightView=look(np.array([-3,5,4],dtype='f4'),np.array([.2,1.1,0],dtype='f4'));ortho=np.eye(4,dtype='f4');ortho[0,0]=ortho[1,1]=1/5;ortho[2,2]=-2/18;ortho[2,3]=-1;lightvp=ortho@lightView
# Symmetric orthographic depth around the full model and floor.
ortho[2,3]=-(20+.1)/(20-.1);ortho[2,2]=-2/(20-.1);lightvp=ortho@lightView
lightBytes=lightvp.T.astype('f4').tobytes()
def camera(frame):
 eye=np.array(frame['eye'],dtype='f4');target=np.array(frame['target'],dtype='f4');aspect=W/H
 if mobile:
  target[0]=.35;eye=target+(eye-np.array(frame['target'],dtype='f4'))*.93
  fov=48 if frame['t']<18 else 52
 else:fov=frame['fov']
 view=look(eye,target);f=1/np.tan(np.radians(fov)/2);n=.05;far=80;pers=np.zeros((4,4),dtype='f4');pers[0,0]=f/aspect;pers[1,1]=f;pers[2,2]=(far+n)/(n-far);pers[2,3]=2*far*n/(n-far);pers[3,2]=-1
 pers[0,2]=0 if mobile else -.30
 pers[1,2]=-.18 if mobile else -.05
 return pers@view,eye

def draw_objects(frame,vp,eye,mirror):
 prog['vp'].write(vp.T.astype('f4').tobytes());prog['lightvp'].write(lightBytes);prog['eye'].value=tuple(eye);prog['mirror'].value=mirror;prog['image'].value=0;prog['shadowMap'].value=1;shadowTex.use(1)
 for m in frame['meshes']:
  if m['opacity']<.001:continue
  prog['model'].write(np.array(m['matrix'],dtype='f4').tobytes());prog['color'].value=tuple(m['color']);prog['emission'].value=tuple(m['emission']);prog['opacity'].value=m['opacity'];prog['basic'].value=float(m['basic']);prog['roughness'].value=m['roughness'];prog['metalness'].value=m['metalness'];prog['mapped'].value=int(m['map']>=0);(textures[m['map']] if m['map']>=0 else white).use(0);vaos[m['g']].render()
def fade_at(t):
 def smooth(a,b,x):u=min(1,max(0,(x-a)/(b-a)));return u*u*(3-2*u)
 v=1
 for b in [0,6,12,18,24]:v*=1-(1 if b in [0,24] else .4)*(1-smooth(0,.18,abs(t-b)))
 return v

def render(frame):
 vp,eye=camera(frame);mat=vp.T.astype('f4').tobytes();ctx.enable(moderngl.DEPTH_TEST);ctx.disable(moderngl.BLEND)
 shadowFbo.use();ctx.viewport=(0,0,1024,1024);shadowFbo.clear(depth=1);shadowprog['lightvp'].write(lightBytes)
 for m in frame['meshes']:
  if m['opacity']<.95 or m['basic']:continue
  shadowprog['model'].write(np.array(m['matrix'],dtype='f4').tobytes());shadowvaos[m['g']].render()
 ctx.enable(moderngl.BLEND);ctx.blend_func=(moderngl.SRC_ALPHA,moderngl.ONE_MINUS_SRC_ALPHA)
 reflFbo.use();ctx.viewport=(0,0,W//2,H//2);reflFbo.clear(.001,.002,.005,1,depth=1);draw_objects(frame,vp,eye,-1.)
 fbo.use();ctx.viewport=(0,0,W,H);fbo.clear(.001,.002,.006,1,depth=1);floorprog['vp'].write(mat);floorprog['res'].value=(W,H);floorprog['eye'].value=tuple(eye);floorprog['reflection'].value=0;refl.use(0);floorvao.render(moderngl.TRIANGLE_STRIP);draw_objects(frame,vp,eye,1.)
 ctx.copy_framebuffer(resolved,fbo);final.use();ctx.disable(moderngl.DEPTH_TEST|moderngl.BLEND);color.use(0);post['frame'].value=0;post['res'].value=(W,H);post['time'].value=frame['t'];post['fade'].value=fade_at(frame['t']) if film else 1.;postvao.render(moderngl.TRIANGLE_STRIP);return final.read(components=3,alignment=1)
ff=None
if film:
 name='msp-portfolio-mobile.mp4' if mobile else 'msp-portfolio.mp4'
 ff=subprocess.Popen(['ffmpeg','-y','-hide_banner','-loglevel','error','-f','rawvideo','-pixel_format','rgb24','-video_size',f'{W}x{H}','-framerate','24','-i','-','-vf','vflip','-an','-c:v','libx264','-preset','fast','-crf','20','-pix_fmt','yuv420p','-movflags','+faststart',str(out/name)],stdin=subprocess.PIPE)
start=time.time()
for i,frame in enumerate(data['frames']):
 pixels=render(frame)
 if film:
  ff.stdin.write(pixels)
  if i%96==0:print(f'{i}/{len(data["frames"])} frames ({time.time()-start:.1f}s)',flush=True)
 else:Image.frombytes('RGB',(W,H),pixels).transpose(Image.Transpose.FLIP_TOP_BOTTOM).save(out/f'msp-shot-{i+1}.png')
if ff:ff.stdin.close();assert ff.wait()==0
print('MSP studio render complete',flush=True)
