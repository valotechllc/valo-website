"""Render the MSP's original Three geometry/poses with Blender studio lighting.
blender -b -t 8 -P docs/render-msp-blender.py -- export.json output --stills [--mobile] [--draft]
Film mode renders to an FFmpeg pipe; no browser or UI automation is involved.
"""
import bpy, sys, json, math, base64, io, time, subprocess, os
from pathlib import Path
from mathutils import Matrix, Vector
args=sys.argv[sys.argv.index('--')+1:];src,out=Path(args[0]),Path(args[1]);out.mkdir(parents=True,exist_ok=True)
mobile='--mobile' in args;draft='--draft' in args;stills='--stills' in args
W,H=((640,880) if mobile else (960,540)) if draft else ((800,1100) if mobile else (1280,720))
d=json.loads(src.read_text());d['frames']=d['frames'][:1] if '--test' in args else d['frames'];bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
s=bpy.context.scene;s.render.engine='CYCLES';s.cycles.samples=12;s.cycles.use_denoising=False;s.cycles.use_adaptive_sampling=True;s.cycles.adaptive_threshold=.08;s.cycles.adaptive_min_samples=2;s.cycles.diffuse_bounces=1;s.cycles.glossy_bounces=2;s.render.use_persistent_data=True;s.cycles.max_bounces=5;s.cycles.transparent_max_bounces=6
s.render.threads_mode='FIXED';s.render.threads=8;s.render.resolution_x=W;s.render.resolution_y=H;s.render.resolution_percentage=100;s.render.film_transparent=False;s.render.use_border=not mobile;s.render.use_crop_to_border=False;s.render.border_min_x=.28;s.render.border_max_x=1;s.render.border_min_y=.06;s.render.border_max_y=1
s.render.image_settings.file_format='PNG';s.render.image_settings.color_mode='RGB';s.view_settings.view_transform='AgX';s.view_settings.look='AgX - Medium High Contrast';s.view_settings.exposure=.25
s.world.use_nodes=True;bg=s.world.node_tree.nodes.get('Background');bg.inputs['Color'].default_value=(.065,.085,.12,1);bg.inputs['Strength'].default_value=.24
C=Matrix(((1,0,0,0),(0,0,-1,0),(0,1,0,0),(0,0,0,1)))
def vec(v):return C.to_3x3()@Vector(v)
def point(o,p):o.rotation_euler=(Vector(p)-o.location).to_track_quat('-Z','Y').to_euler()
def area(name,pos,power,color,size,shape='DISK',size_y=None):
 light=bpy.data.lights.new(name,'AREA');light.energy=power;light.color=color;light.shape=shape;light.size=size
 if shape=='RECTANGLE':light.size_y=size_y or size
 o=bpy.data.objects.new(name,light);s.collection.objects.link(o);o.location=pos;point(o,(.4,0,1.3));return o
area('Key softbox',(0,-4,6),450,(.75,.86,1),5)
area('Long cool rim',(-3,1,3.5),450,(.45,.64,1),3,'RECTANGLE',.7)
area('Warm edge',(4,1,3),200,(1,.65,.40),2.5,'RECTANGLE',.45)
area('Front fill',(2,-5,2),160,(.7,.82,1),4)
# A broad softbox reflection reveals geometry without a hard diagonal shadow.
area('Top strip',(1,0,6),300,(.87,.93,1),4,'RECTANGLE',1)
def material(m,name):
 mat=bpy.data.materials.new(name);mat.use_nodes=True;n=mat.node_tree.nodes;l=mat.node_tree.links;p=n.get('Principled BSDF');p.inputs['Base Color'].default_value=(*m['color'],1);p.inputs['Metallic'].default_value=m['metalness'];p.inputs['Roughness'].default_value=max(.18,m['roughness']);p.inputs['Coat Weight'].default_value=.08;p.inputs['Coat Roughness'].default_value=.22
 if m['basic']:
  p.inputs['Base Color'].default_value=(0,0,0,1);p.inputs['Emission Color'].default_value=(*m['color'],1);p.inputs['Emission Strength'].default_value=.8
 else:
  p.inputs['Emission Color'].default_value=(*m['emission'],1);p.inputs['Emission Strength'].default_value=1
 if m['map']>=0:
  tex=n.new('ShaderNodeTexImage');tex.image=images[m['map']];tex.interpolation='Linear';l.new(tex.outputs['Color'],p.inputs['Emission Color']);p.inputs['Emission Strength'].default_value=.7;l.new(tex.outputs['Alpha'],p.inputs['Alpha'])
 else:p.inputs['Alpha'].default_value=m['opacity']
 return mat,p
images=[]
for i,t in enumerate(d['textures']):
 fp=out/f'.msp-texture-{i}.png';fp.write_bytes(base64.b64decode(t));im=bpy.data.images.load(str(fp));im.colorspace_settings.name='sRGB';images.append(im)
geos=[]
for i,g in enumerate(d['geometries']):
 p=list(zip(*[iter(g['p'])]*3));idx=g['index'] or list(range(len(p)));faces=list(zip(*[iter(idx)]*3));mesh=bpy.data.meshes.new(f'MSP geometry {i}');mesh.from_pydata(p,[],faces);mesh.update()
 if g['uv']:
  uv=mesh.uv_layers.new(name='UVMap');arr=list(zip(*[iter(g['uv'])]*2))
  for poly in mesh.polygons:
   for li in poly.loop_indices:uv.data[li].uv=arr[mesh.loops[li].vertex_index]
 if g['n']:
  norms=list(zip(*[iter(g['n'])]*3));mesh.normals_split_custom_set_from_vertices(norms)
 geos.append(mesh)
objects=[]
for i,m in enumerate(d['frames'][0]['meshes']):
 o=bpy.data.objects.new(f'MSP object {i}',geos[m['g']]);s.collection.objects.link(o);mat,p=material(m,f'MSP material {i}');o.data=geos[m['g']].copy();o.data.materials.clear();o.data.materials.append(mat);objects.append((o,p))
# Satin charcoal ground; real contact shadows and physically blurred reflections.
bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.025));floor=bpy.context.object;floor.name='Satin studio floor';fm=bpy.data.materials.new('Satin midnight');fm.use_nodes=True;p=fm.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(.006,.009,.016,1);p.inputs['Metallic'].default_value=.4;p.inputs['Roughness'].default_value=.40;floor.data.materials.append(fm)
camd=bpy.data.cameras.new('MSP film camera');cam=bpy.data.objects.new('MSP film camera',camd);s.collection.objects.link(cam);s.camera=cam;camd.sensor_fit='HORIZONTAL';camd.sensor_width=36;camd.clip_start=.03;camd.clip_end=150
camd.dof.use_dof=True;camd.dof.aperture_fstop=8
env=os.environ.copy()
if 'MSP_OIDN_DIR' in env:env['PYTHONPATH']=env['MSP_OIDN_DIR']
den=subprocess.Popen([env.get('MSP_DENOISE_PYTHON','python3'),str(Path(__file__).with_name('denoise-msp-frame.py'))],stdin=subprocess.PIPE,stdout=subprocess.PIPE,text=True,bufsize=1,env=env)
def denoise(path):
 den.stdin.write(str(path)+'\n');den.stdin.flush();assert den.stdout.readline().strip()=='OK','MSP denoiser failed'
start=time.time();ff=None
if not stills:
 name='msp-portfolio-mobile.mp4' if mobile else 'msp-portfolio.mp4'
 ff=subprocess.Popen(['ffmpeg','-y','-hide_banner','-loglevel','error','-f','image2pipe','-vcodec','png','-framerate','24','-i','-','-vf','fade=t=in:st=0:d=0.08,fade=t=out:st=11.88:d=0.12','-an','-c:v','libx264','-preset','fast','-crf','18','-pix_fmt','yuv420p','-movflags','+faststart',str(out/name)],stdin=subprocess.PIPE)
for fi,f in enumerate(d['frames']):
 for (o,p),m in zip(objects,f['meshes']):
  o.hide_render=m['opacity']<.005;o.matrix_world=C@Matrix([m['matrix'][j:j+4] for j in range(0,16,4)]).transposed()
  if m['map']<0:p.inputs['Alpha'].default_value=m['opacity']
  if m['basic']:p.inputs['Emission Color'].default_value=(*m['color'],1)
 eye,target=Vector(f['eye']),Vector(f['target']);fov=f['fov'];shift=-.16
 if mobile:
  eye=target+(eye-target)*1.13;fov=46;shift=0
 cam.location=vec(eye);point(cam,vec(target));aspect=W/H;camd.lens=18/(math.tan(math.radians(fov)/2)*aspect);camd.shift_x=shift;camd.shift_y=0;camd.dof.focus_distance=(eye-target).length
 path=out/(f'msp-shot-{fi+1}.png' if stills else f'msp-frame-{fi:04}.png');s.render.filepath=str(path)
 if not ('--resume' in args and path.exists()):bpy.ops.render.render(write_still=True);denoise(path)
 if ff:ff.stdin.write(path.read_bytes())
 print(f'MSP {fi+1}/{len(d["frames"])} {time.time()-start:.1f}s',flush=True)
if ff:ff.stdin.close();assert ff.wait()==0
den.stdin.close();assert den.wait()==0
print('MSP Blender studio render complete',flush=True)
