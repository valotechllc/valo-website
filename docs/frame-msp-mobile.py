"""Create a portrait edit from the 12-second MSP film, with a crop chosen per camera shot.
python docs/frame-msp-mobile.py desktop.mp4 mobile.mp4
"""
import subprocess,sys
parts=['[0:v]split=4[a][b][c][d]'];outs=[]
for i,(label,portion) in enumerate(zip('abcd',[.60,.70,.65,.70])):
 out=f'p{i}';outs.append(f'[{out}]')
 alpha='255*min(1,min(min(X/(W*.035),(W-1-X)/(W*.035)),min(Y/(H*.05),(H-1-Y)/(H*.14))))'
 parts.append(f'[{label}]trim=start={i*3}:end={(i+1)*3},setpts=PTS-STARTPTS,crop=trunc(iw*{portion}/2)*2:ih:iw-ow:0,scale=640:-2,format=rgba,geq=r=\'r(X,Y)\':g=\'g(X,Y)\':b=\'b(X,Y)\':a=\'{alpha}\'[cut{i}]')
 parts.append(f'color=c=0x03070e:s=640x880:r=24:d=3[bg{i}]')
 parts.append(f'[bg{i}][cut{i}]overlay=(W-w)/2:(H-h)/2:shortest=1:format=auto,setsar=1[{out}]')
parts.append(''.join(outs)+'concat=n=4:v=1:a=0[v]')
subprocess.run(['ffmpeg','-y','-hide_banner','-loglevel','error','-i',sys.argv[1],'-filter_complex',';'.join(parts),'-map','[v]','-an','-c:v','libx264','-preset','fast','-crf','18','-pix_fmt','yuv420p','-movflags','+faststart',sys.argv[2]],check=True)
