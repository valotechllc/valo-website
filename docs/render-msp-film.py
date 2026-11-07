"""Render the exported MSP portfolio using an offscreen EGL context.
Production dependencies: moderngl, numpy, Pillow, FFmpeg. No browser automation.
python docs/render-msp-film.py export.json output_dir [--film] [--mobile]
"""
import os,sys,json,base64,io,subprocess,time
from pathlib import Path
import numpy as np
import moderngl
from PIL import Image
src=Path(sys.argv[1]);out=Path(sys.argv[2]);out.mkdir(parents=True,exist_ok=True)
film='--film' in sys.argv;mobile='--mobile' in sys.argv
W,H=(720,900) if mobile else (1280,960)
data=json.loads(src.read_text());ctx=moderngl.create_standalone_context(backend='egl')
vs='''#version 330
in vec3 in_pos;in vec3 in_normal;in vec2 in_uv;uniform mat4 model,vp;uniform float mirror;out vec3 P,N;out vec2 uv;
void main(){vec4 p=model*vec4(in_pos,1.);p.y*=mirror;P=p.xyz;N=normalize(transpose(inverse(mat3(model)))*in_normal);N.y*=mirror;uv=in_uv;gl_Position=vp*p;}'''
fs='''#version 330
uniform vec3 color,eye;uniform float opacity,basic,roughness,metalness;uniform int mapped;uniform sampler2D image;in vec3 P,N;in vec2 uv;out vec4 frag;
void main(){vec4 tx=mapped==1?texture(image,uv):vec4(1.);vec3 base=color*pow(tx.rgb,vec3(2.2));vec3 n=normalize(N),v=normalize(eye-P),l=normalize(vec3(-3.,5.,5.)-P);float d=max(dot(n,l),0.);float spec=pow(max(dot(reflect(-l,n),v),0.),mix(90.,12.,roughness));float rim=pow(1.-abs(dot(n,v)),3.);vec3 c=basic>.5?base*1.3:base*(.35+d*1.4)+vec3(.65,.80,1.)*spec*.6+vec3(.20,.35,.55)*rim*.35;float amber=max(dot(n,normalize(vec3(2.5,2.,-1.5)-P)),0.);if(basic<.5)c+=base*vec3(.9,.3,.08)*amber*.55;float fog=1.-exp(-length(eye-P)*.02);c=mix(c,vec3(.004,.008,.017),fog);frag=vec4(c,opacity*tx.a);}'''
prog=ctx.program(vertex_shader=vs,fragment_shader=fs)
vaos=[]
for g in data['geometries']:
 p=np.array(g['p'],dtype='f4').reshape(-1,3);n=np.array(g['n'],dtype='f4').reshape(-1,3);uv=np.array(g['uv'],dtype='f4').reshape(-1,2) if g['uv'] else np.zeros((len(p),2),dtype='f4')
 b=ctx.buffer(np.concatenate([p,n,uv],axis=1).astype('f4').tobytes());idx=ctx.buffer(np.array(g['index'],dtype='i4').tobytes()) if g['index'] else None
 vaos.append(ctx.vertex_array(prog,[(b,'3f 3f 2f','in_pos','in_normal','in_uv')],idx))
textures=[]
for t in data['textures']:
 im=Image.open(io.BytesIO(base64.b64decode(t))).convert('RGBA').transpose(Image.Transpose.FLIP_TOP_BOTTOM)
 tx=ctx.texture(im.size,4,im.tobytes());tx.build_mipmaps();tx.filter=(moderngl.LINEAR_MIPMAP_LINEAR,moderngl.LINEAR);textures.append(tx)
white=ctx.texture((1,1),4,b'\xff'*4)
color=ctx.texture((W,H),4,dtype='f2');depth=ctx.depth_renderbuffer((W,H));fbo=ctx.framebuffer(color,depth)
final=ctx.simple_framebuffer((W,H))
quad=ctx.buffer(np.array([-1,-1,1,-1,-1,1,1,1],dtype='f4').tobytes())
post=ctx.program(vertex_shader='''#version 330
in vec2 p;out vec2 uv;void main(){uv=p*.5+.5;gl_Position=vec4(p,0.,1.);}''',fragment_shader='''#version 330
uniform sampler2D frame;uniform vec2 res;uniform float time;in vec2 uv;out vec4 frag;
vec3 aces(vec3 x){return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14),0.,1.);}
void main(){vec3 c=texture(frame,uv).rgb;vec3 bloom=vec3(0.);for(int x=-2;x<=2;x++)for(int y=-2;y<=2;y++){vec3 a=texture(frame,uv+vec2(x,y)*3./res).rgb;bloom+=max(a-vec3(.72),0.)*.018;}c+=bloom;float vig=1.-.23*dot((uv-.5)*vec2(1.1,1.),(uv-.5)*vec2(1.1,1.));c=pow(aces(c*1.1),vec3(1./2.2))*vig;float grain=fract(sin(dot(uv*res+time,vec2(12.9,78.2)))*43758.5)-.5;c+=grain*.006;frag=vec4(c,1.);}''')
postvao=ctx.vertex_array(post,[(quad,'2f','p')])
floorprog=ctx.program(vertex_shader='''#version 330
in vec3 p;uniform mat4 vp;out vec3 P;void main(){P=p;gl_Position=vp*vec4(p,1.);}''',fragment_shader='''#version 330
in vec3 P;out vec4 frag;void main(){vec2 g=abs(fract(P.xz/.65)-.5);float seam=smoothstep(.492,.5,max(g.x,g.y));frag=vec4(vec3(.008,.016,.029)*(1.-seam*.35),.78);}''')
floorb=ctx.buffer(np.array([-25,0,-25,25,0,-25,-25,0,25,25,0,25],dtype='f4').tobytes());floorvao=ctx.vertex_array(floorprog,[(floorb,'3f','p')])
def normalize(v):return v/np.linalg.norm(v)
def vp_matrix(frame):
 eye=np.array(frame['eye'],dtype='f4');target=np.array(frame['target'],dtype='f4');z=normalize(eye-target);x=normalize(np.cross([0,1,0],z));y=np.cross(z,x)
 view=np.eye(4,dtype='f4');view[:3,:3]=np.array([x,y,z]);view[:3,3]=-np.array([x,y,z])@eye
 hfov=2*np.arctan(np.tan(np.radians(frame['fov'])/2)*16/9);vfov=2*np.arctan(np.tan(hfov/2)/(W/H));vfov=min(vfov,np.radians(67));f=1/np.tan(vfov/2)
 if mobile:
  available=2*np.arctan(np.tan(vfov/2)*(W/H));k=min(2,np.tan(hfov/2)/np.tan(available/2));eye=(eye-target)*k+target;view[:3,3]=-np.array([x,y,z])@eye
 n=.05;far=70;pers=np.zeros((4,4),dtype='f4');pers[0,0]=f/(W/H);pers[1,1]=f;pers[2,2]=(far+n)/(n-far);pers[2,3]=2*far*n/(n-far);pers[3,2]=-1
 return pers@view,eye

def render(frame):
 vp,eye=vp_matrix(frame);mat=vp.T.astype('f4').tobytes();fbo.use();ctx.viewport=(0,0,W,H);ctx.enable(moderngl.DEPTH_TEST|moderngl.BLEND);ctx.blend_func=(moderngl.SRC_ALPHA,moderngl.ONE_MINUS_SRC_ALPHA);fbo.clear(.004,.008,.016,1,depth=1)
 prog['vp'].write(mat);prog['eye'].value=tuple(eye);prog['image'].value=0
 for mirror in [-1,1]:
  prog['mirror'].value=mirror
  for m in frame['meshes']:
   if m['opacity']<.001:continue
   prog['model'].write(np.array(m['matrix'],dtype='f4').tobytes());prog['color'].value=tuple(m['color']);prog['opacity'].value=m['opacity']*(.43 if mirror<0 else 1);prog['basic'].value=float(m['basic']);prog['roughness'].value=m['roughness'];prog['mapped'].value=int(m['map']>=0)
   (textures[m['map']] if m['map']>=0 else white).use(0);vaos[m['g']].render()
  if mirror<0:
   floorprog['vp'].write(mat);floorvao.render(moderngl.TRIANGLE_STRIP)
 final.use();ctx.disable(moderngl.DEPTH_TEST|moderngl.BLEND);color.use(0);post['frame'].value=0;post['res'].value=(W,H);post['time'].value=frame['t'];postvao.render(moderngl.TRIANGLE_STRIP)
 return final.read(components=3,alignment=1)

ff=None
if film:
 name='msp-portfolio-mobile.mp4' if mobile else 'msp-portfolio.mp4'
 ff=subprocess.Popen(['ffmpeg','-y','-hide_banner','-loglevel','error','-f','rawvideo','-pixel_format','rgb24','-video_size',f'{W}x{H}','-framerate','24','-i','-','-vf','vflip','-an','-c:v','libx264','-preset','fast','-crf','21','-pix_fmt','yuv420p','-movflags','+faststart',str(out/name)],stdin=subprocess.PIPE)
start=time.time()
for i,frame in enumerate(data['frames']):
 pixels=render(frame)
 if film:
  ff.stdin.write(pixels)
  if i%96==0:print(f'{i}/{len(data["frames"])} frames ({time.time()-start:.1f}s)',flush=True)
 else:
  im=Image.frombytes('RGB',(W,H),pixels).transpose(Image.Transpose.FLIP_TOP_BOTTOM);im.save(out/f'msp-shot-{i+1}.png')
if ff:ff.stdin.close();assert ff.wait()==0
print('MSP render complete',flush=True)
