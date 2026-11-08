/* Export only the MSP scene for offline film production. Requires @napi-rs/canvas.
   node docs/export-msp-scene.mjs /absolute/output.json [stills|film] */
import fs from 'node:fs';
import {createRequire} from 'node:module';
import * as THREE from '../vendor/three/three.module.min.js';
import {mspScene} from '../stage/scene-msp.js';
const require=createRequire(import.meta.url);
let canvasModule;try{canvasModule=require('@napi-rs/canvas')}catch{canvasModule=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/@napi-rs/canvas')}
const {createCanvas,GlobalFonts}=canvasModule;
for(const [font,path] of [['Inter','/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'],['JetBrains Mono','/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf']])if(fs.existsSync(path))GlobalFonts.registerFromPath(path,font);
globalThis.document={createElement:()=>createCanvas(2,2)};
const scene=new THREE.Scene();scene.background=new THREE.Color();scene.fog=new THREE.FogExp2();
const film=mspScene({THREE,scene});const geometries=[],textures=[],geoIDs=new Map(),texIDs=new Map();
function geometry(g){if(!geoIDs.has(g.uuid)){if(!g.attributes.normal)g.computeVertexNormals();const id=geometries.length;geoIDs.set(g.uuid,id);geometries.push({p:Array.from(g.attributes.position.array),n:Array.from(g.attributes.normal.array),uv:g.attributes.uv?Array.from(g.attributes.uv.array):null,index:g.index?Array.from(g.index.array):null})}return geoIDs.get(g.uuid)}
function tex(t){if(!t)return -1;if(!texIDs.has(t.uuid)){texIDs.set(t.uuid,textures.length);textures.push(t.image.toBuffer('image/png').toString('base64'))}return texIDs.get(t.uuid)}
const meshes=[];scene.traverse(o=>{if(o.isMesh)meshes.push(o)});
const times=process.argv[3]==='film'?Array.from({length:film.duration*24},(_,i)=>i/24):[1.7,4.7,7.7,10.7];
const frames=times.map(t=>{film.update(t);scene.updateMatrixWorld(true);const shot={pos:new THREE.Vector3(),target:new THREE.Vector3()};film.camera(t,shot);return {t,eye:shot.pos.toArray(),target:shot.target.toArray(),fov:shot.fov,meshes:meshes.map(m=>{let visible=true;for(let p=m;p;p=p.parent)if(!p.visible)visible=false;const mat=m.material;return {g:geometry(m.geometry),matrix:m.matrixWorld.toArray(),color:mat.color?mat.color.toArray():[1,1,1],emission:mat.emissive?mat.emissive.toArray().map(v=>v*(mat.emissiveIntensity??1)):[0,0,0],basic:!!mat.isMeshBasicMaterial,opacity:visible?(mat.opacity??1):0,map:tex(mat.map),roughness:mat.roughness??.5,metalness:mat.metalness??0}})}});
fs.writeFileSync(process.argv[2],JSON.stringify({geometries,textures,frames}));console.log(`Exported ${frames.length} MSP frames / ${meshes.length} meshes`);
