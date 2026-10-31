/* Shared building blocks for the VALO stage scenes: procedural textures, glow and
   traffic-pulse materials, chamfered slabs, and shot/fade timing helpers. */
import { smooth, clamp01 } from './stage.js';

export function canvasTex(THREE, w, h, draw, { srgb = true, repeat } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
  return t;
}

export function rand(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

export function texBrushed(THREE) {
  const r = rand(7);
  return canvasTex(THREE, 512, 512, (g, w, h) => {
    g.fillStyle = 'rgb(120,120,120)'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 2600; i++) { const v = 70 + r() * 120 | 0; g.strokeStyle = `rgba(${v},${v},${v},${0.15 + r() * 0.25})`; g.lineWidth = r() * 1.4; const y = r() * h; g.beginPath(); g.moveTo(r() * w * 0.3, y); g.lineTo(w * (0.6 + r() * 0.4), y + (r() - 0.5) * 2); g.stroke(); }
  }, { srgb: false, repeat: [2, 2] });
}

export function texGlowBlade(THREE) {
  return canvasTex(THREE, 256, 8, (g, w, h) => {
    const grd = g.createLinearGradient(0, 0, w, 0);
    grd.addColorStop(0, 'rgba(255,255,255,0)'); grd.addColorStop(0.45, 'rgba(255,255,255,0.25)'); grd.addColorStop(0.5, 'rgba(255,255,255,1)'); grd.addColorStop(0.55, 'rgba(255,255,255,0.25)'); grd.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grd; g.fillRect(0, 0, w, h);
  }, { srgb: false });
}

export function pulseMaterial(THREE, color, seed, len) {
  return new THREE.ShaderMaterial({
    fog: true,
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {
      uTime: { value: 0 }, uActive: { value: 0 }, uSeed: { value: seed }, uLen: { value: len }, uSpeed: { value: 1.35 }, uColor: { value: new THREE.Color(color) }, uStop: { value: 2.0 }, uFlash: { value: 0 }
    }]),
    vertexShader: `varying vec2 vUv; varying vec3 vN; varying vec3 vV;
      #include <fog_pars_vertex>
      void main(){ vUv = uv; vec4 mvPosition = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mvPosition.xyz);
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: `uniform float uTime, uActive, uSeed, uLen, uSpeed, uStop, uFlash; uniform vec3 uColor; varying vec2 vUv; varying vec3 vN; varying vec3 vV;
      #include <fog_pars_fragment>
      void main(){
        float facing = abs(dot(normalize(vN), normalize(vV)));
        vec3 base = vec3(0.010, 0.012, 0.016) + pow(1.0 - facing, 2.0) * vec3(0.05, 0.06, 0.08);
        float s = 0.0;
        for (int k = 0; k < 4; k++) {
          float p = fract(uTime * uSpeed / uLen + uSeed + float(k) * 0.25);
          if (p > uStop) continue;
          float d = (vUv.x - p) * uLen;
          s += exp(-d * d * 70.0) + 0.45 * exp(-max(-d, 0.0) * 5.0) * step(d, 0.0) * step(-0.9, d);
        }
        float pastStop = step(uStop, vUv.x);
        float flash = uFlash * exp(-pow((vUv.x - uStop) * uLen, 2.0) * 60.0);
        vec3 col = base + uColor * ((s * 9.0 + 0.08) * (1.0 - pastStop) + flash * 6.0) * uActive * (0.65 + 0.35 * facing);
        gl_FragColor = vec4(col, 1.0);
        #include <fog_fragment>
      }`
  });
}

export function shaftMaterial(THREE, color) {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { uColor: { value: new THREE.Color(color) }, uI: { value: 0.05 }, uH: { value: 3 } },
    vertexShader: `uniform float uH; varying vec3 vN; varying vec3 vV; varying float vH;
      void main(){ vH = position.y / uH + 0.5; vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform vec3 uColor; uniform float uI; varying vec3 vN; varying vec3 vV; varying float vH;
      void main(){ float f = pow(abs(dot(normalize(vN), normalize(vV))), 2.5); float a = f * smoothstep(0.0, 0.35, vH) * (0.4 + 0.6 * vH) * uI; gl_FragColor = vec4(uColor * a, 1.0); }`
  });
}

export function spillMaterial(THREE, color) {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uColor: { value: new THREE.Color(color) }, uI: { value: 1 }, uHalf: { value: new THREE.Vector2(0.6, 0.6) } },
    vertexShader: 'varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform vec3 uColor; uniform float uI; uniform vec2 uHalf; varying vec2 vP;
      void main(){ vec2 q = abs(vP) - uHalf; float d = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0); float a = exp(-max(d, 0.0) * 9.0) * step(0.0, d) ; gl_FragColor = vec4(uColor * a * uI, 1.0); }`
  });
}

export function pointsMaterial(THREE) {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uScale: { value: 10 }, uFog: { value: 0.085 } },
    vertexShader: `attribute float aSeed; attribute vec3 aColor; uniform float uTime; uniform float uScale; uniform float uFog; varying vec3 vC; varying float vA;
      void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); float d = -mv.z;
        float blink = step(0.3, fract(aSeed * 17.0 + uTime * (0.15 + aSeed * 1.2)));
        float on = mix(blink, 1.0, step(0.55, aSeed));
        vA = (0.2 + 0.8 * on) * exp(-uFog * uFog * d * d * 0.55);
        vC = aColor; gl_PointSize = uScale * (0.7 + aSeed * 0.6) / max(d, 0.2); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `varying vec3 vC; varying float vA; void main(){ float r = length(gl_PointCoord - 0.5); float a = smoothstep(0.5, 0.0, r); gl_FragColor = vec4(vC * a * a * vA, 1.0); }`
  });
}

export function slab(THREE, w, h, d, bev = 0.006) {
  const s = new THREE.Shape(), x0 = -w / 2 + bev, x1 = w / 2 - bev, y0 = bev, y1 = h - bev, r = 0.004;
  s.moveTo(x0 + r, y0); s.lineTo(x1 - r, y0); s.quadraticCurveTo(x1, y0, x1, y0 + r); s.lineTo(x1, y1 - r); s.quadraticCurveTo(x1, y1, x1 - r, y1);
  s.lineTo(x0 + r, y1); s.quadraticCurveTo(x0, y1, x0, y1 - r); s.lineTo(x0, y0 + r); s.quadraticCurveTo(x0, y0, x0 + r, y0);
  const g = new THREE.ExtrudeGeometry(s, { depth: d - 2 * bev, bevelEnabled: true, bevelThickness: bev, bevelSize: bev, bevelSegments: 3, curveSegments: 3 });
  g.translate(0, 0, -(d - 2 * bev) / 2);
  return g;
}

export const SHOTS4 = (L) => [0, L / 4, L / 2, L * 3 / 4, L];

/* Camera from a shot list: each shot is [fromPos, toPos, fromTarget, toTarget, fov, shift]. */
export function shotCamera(bounds, shots, t, out) {
  let i = 0; while (i < shots.length - 1 && t >= bounds[i + 1]) i++;
  const u = clamp01((t - bounds[i]) / (bounds[i + 1] - bounds[i]));
  const e = 0.5 - 0.5 * Math.cos(Math.PI * u);
  const s = shots[i];
  const l = (a, b) => a + (b - a) * e;
  out.pos.set(l(s[0][0], s[1][0]) + Math.sin(t * 0.7) * 0.006, l(s[0][1], s[1][1]) + Math.sin(t * 0.9 + 1) * 0.004, l(s[0][2], s[1][2]));
  out.target.set(l(s[2][0], s[3][0]), l(s[2][1], s[3][1]), l(s[2][2], s[3][2]));
  out.fov = s[4];
  out.shift = s[5] || 0;
}

/* Brief dips at each cut; full dip at the loop point. */
export function shotFade(bounds, t) {
  let f = 1;
  bounds.forEach((b, i) => { const depth = (i === 0 || i === bounds.length - 1) ? 1 : 0.8; f *= 1 - depth * (1 - smooth(0, 0.32, Math.abs(t - b))); });
  return f;
}

/* Sprite text texture for in-scene labels (paper, screens, plates). */
export function textTex(THREE, w, h, draw) { return canvasTex(THREE, w, h, draw); }
