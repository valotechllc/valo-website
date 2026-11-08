"""Persistent OIDN color denoiser for the MSP Blender film. One PNG path per stdin line."""
import sys,numpy as np,oidn
from PIL import Image
dev=oidn.NewDevice();oidn.CommitDevice(dev)
for line in sys.stdin:
 path=line.rstrip('\n')
 if not path:continue
 im=Image.open(path).convert('RGB');w,h=im.size;color=np.ascontiguousarray(np.asarray(im,dtype='float32')/255);result=np.zeros_like(color)
 f=oidn.NewFilter(dev,'RT');oidn.SetSharedFilterImage(f,'color',color,oidn.FORMAT_FLOAT3,w,h);oidn.SetSharedFilterImage(f,'output',result,oidn.FORMAT_FLOAT3,w,h);oidn.CommitFilter(f);oidn.ExecuteFilter(f);assert oidn.GetDeviceError(dev)==0;oidn.ReleaseFilter(f)
 Image.fromarray(np.uint8(np.clip(result*255,0,255))).save(path)
 print('OK',flush=True)
oidn.ReleaseDevice(dev)
