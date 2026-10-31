/* VALO hero stage: shared real-time 3D core (three.js r160).
   One WebGL context, a reflective floor, bloom and a film grade, a deterministic
   timeline (every animated value is a function of scene time t), pointer parallax,
   and a capture mode that renders exact frames for posters and recordings. */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

export const clamp01 = (x) => Math.min(1, Math.max(0, x));
export const smooth = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
export const easeInOut = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

/* Film grade applied after tone mapping: vignette, navy-lifted shadows, fine grain, fades. */
const GradeShader = {
  uniforms: { tDiffuse: { value: null }, uTime: { value: 0 }, uFade: { value: 1 }, uRes: { value: new THREE.Vector2(1, 1) } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float uTime; uniform float uFade; uniform vec2 uRes; varying vec2 vUv;
    float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
    void main(){
      vec4 c = texture2D(tDiffuse, vUv);
      vec2 q = vUv - 0.5; q.x *= uRes.x / uRes.y;
      float vig = smoothstep(1.15, 0.35, length(q));
      c.rgb *= mix(0.55, 1.0, vig);
      float l = dot(c.rgb, vec3(0.2126, 0.7152, 0.0722));
      c.rgb += vec3(0.0, 0.006, 0.022) * (1.0 - smoothstep(0.0, 0.35, l));
      float g = hash(vUv * uRes + fract(uTime * 7.13) * 91.7) - 0.5;
      c.rgb += g * 0.028;
      c.rgb *= uFade;
      gl_FragColor = c;
    }`
};

/* Glossy floor with a real mirror render, blurred by a few taps and broken up by tile seams. */
function createReflectiveFloor(renderer, size, quality) {
  const target = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType });
  const mirrorCam = new THREE.PerspectiveCamera();
  const texMatrix = new THREE.Matrix4();
  const uniforms = THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {
    tRefl: { value: null }, texMatrix: { value: texMatrix }, uBase: { value: new THREE.Color(0x05080f) },
    uTexel: { value: new THREE.Vector2(1, 1) }, uCam: { value: new THREE.Vector3() }
  }]);
  const mat = new THREE.ShaderMaterial({
    uniforms, fog: true,
    vertexShader: `
      uniform mat4 texMatrix; varying vec4 vRP; varying vec3 vW;
      #include <fog_pars_vertex>
      void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vRP = texMatrix * w;
        vec4 mvPosition = viewMatrix * w; gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: `
      uniform sampler2D tRefl; uniform vec3 uBase; uniform vec2 uTexel; uniform vec3 uCam; varying vec4 vRP; varying vec3 vW;
      #include <fog_pars_fragment>
      float hash(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5); }
      float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
        return mix(mix(hash(i), hash(i+vec2(1,0)), f.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y); }
      void main(){
        vec2 uv = vRP.xy / vRP.w;
        float rough = 0.55 + 0.45 * noise(vW.xz * 1.7);
        vec2 r = uTexel * (2.0 + 5.0 * rough);
        vec3 refl = texture2D(tRefl, uv).rgb * 0.28
          + (texture2D(tRefl, uv + vec2(r.x, 0.0)).rgb + texture2D(tRefl, uv - vec2(r.x, 0.0)).rgb
          +  texture2D(tRefl, uv + vec2(0.0, r.y)).rgb + texture2D(tRefl, uv - vec2(0.0, r.y)).rgb) * 0.12
          + (texture2D(tRefl, uv + r * 2.0).rgb + texture2D(tRefl, uv - r * 2.0).rgb
          +  texture2D(tRefl, uv + vec2(r.x, -r.y) * 2.0).rgb + texture2D(tRefl, uv + vec2(-r.x, r.y) * 2.0).rgb) * 0.06;
        vec3 v = normalize(uCam - vW);
        float fres = 0.18 + 0.62 * pow(1.0 - max(v.y, 0.0), 3.0);
        vec2 g = abs(fract(vW.xz / 0.6) - 0.5);
        float seam = smoothstep(0.492, 0.5, max(g.x, g.y));
        vec3 col = uBase * (0.85 + 0.3 * noise(vW.xz * 5.0)) + refl * fres * (1.0 - 0.75 * seam) * (0.75 + 0.25 * rough);
        col *= 1.0 - 0.45 * seam;
        gl_FragColor = vec4(col, 1.0);
        #include <fog_fragment>
      }`
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(size, size), mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.receiveShadow = false;

  const bias = new THREE.Matrix4().set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1);
  const tmpTarget = new THREE.Vector3(), lookDir = new THREE.Vector3();
  return {
    mesh,
    setSize(w, h) { const s = quality; target.setSize(Math.max(2, Math.round(w * s)), Math.max(2, Math.round(h * s))); uniforms.uTexel.value.set(1 / (w * s), 1 / (h * s)); },
    update(scene, camera) {
      camera.getWorldDirection(lookDir);
      tmpTarget.copy(camera.position).add(lookDir);
      mirrorCam.position.set(camera.position.x, -camera.position.y, camera.position.z);
      mirrorCam.up.set(0, -1, 0);
      mirrorCam.lookAt(tmpTarget.x, -tmpTarget.y, tmpTarget.z);
      mirrorCam.near = camera.near; mirrorCam.far = camera.far;
      mirrorCam.projectionMatrix.copy(camera.projectionMatrix);
      mirrorCam.updateMatrixWorld();
      texMatrix.copy(bias).multiply(mirrorCam.projectionMatrix).multiply(mirrorCam.matrixWorldInverse);
      uniforms.uCam.value.copy(camera.position);
      mesh.visible = false;
      const prev = renderer.getRenderTarget();
      renderer.setRenderTarget(target);
      renderer.clear();
      renderer.render(scene, mirrorCam);
      renderer.setRenderTarget(prev);
      mesh.visible = true;
      uniforms.tRefl.value = target.texture;
    }
  };
}

/* createStage(container, sceneFactory, opts) -> controller
   sceneFactory(ctx) returns { duration, chapters:[{start,label}], update(t, ctx), camera(t, out) } */
export function createStage(container, sceneFactory, opts = {}) {
  const capture = !!opts.capture;
  const small = window.matchMedia('(max-width: 760px)').matches;
  const canvas = document.createElement('canvas');
  canvas.className = 'h-stage';
  canvas.setAttribute('aria-hidden', 'true');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', preserveDrawingBuffer: capture });
  renderer.setPixelRatio(capture ? 1 : Math.min(window.devicePixelRatio || 1, small ? 1.25 : 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x03060d);
  scene.fog = new THREE.FogExp2(0x050a15, 0.068);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(32, 16 / 9, 0.05, 60);
  const floor = createReflectiveFloor(renderer, 60, small ? 0.35 : 0.5);
  scene.add(floor.mesh);

  const ctx = { THREE, scene, camera, renderer, small, capture };
  const film = sceneFactory(ctx);

  const rt = new THREE.WebGLRenderTarget(2, 2, { type: THREE.HalfFloatType, samples: capture ? 8 : (small ? 2 : 4) });
  const composer = new EffectComposer(renderer, rt);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.42, 0.5, 0.9);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());
  const grade = new ShaderPass(GradeShader);
  composer.addPass(grade);

  const camPos = new THREE.Vector3(), camTarget = new THREE.Vector3();
  const shot = { pos: camPos, target: camTarget, fov: 32, shift: 0 };
  const parallax = { x: 0, y: 0, tx: 0, ty: 0 };
  let width = 2, height = 2;

  function resize() {
    const r = container.getBoundingClientRect();
    width = Math.max(2, Math.round(r.width)); height = Math.max(2, Math.round(r.height));
    renderer.setSize(width, height, false);
    const pr = renderer.getPixelRatio();
    composer.setPixelRatio(pr);
    composer.setSize(width, height);
    bloom.setSize(width * pr * 0.5, height * pr * 0.5);
    floor.setSize(width * pr, height * pr);
    grade.uniforms.uRes.value.set(width * pr, height * pr);
  }

  function renderAt(t) {
    t = ((t % film.duration) + film.duration) % film.duration;
    film.update(t, ctx);
    film.camera(t, shot, { aspect: width / height });
    const aspect = width / height;
    camera.aspect = aspect;
    // Portrait screens: keep horizontal framing by widening the vertical field of view, within reason.
    const hfov = 2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(shot.fov) / 2) * (16 / 9));
    let vfov = THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(hfov / 2) / aspect));
    vfov = Math.max(shot.fov, Math.min(vfov, 64));
    camera.fov = vfov;
    camera.position.copy(shot.pos);
    // If the capped field of view is still narrower than the shot was composed for, dolly back.
    const hAvail = 2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(vfov) / 2) * aspect);
    if (hAvail < hfov) {
      const k = Math.min(2.4, Math.tan(hfov / 2) / Math.tan(hAvail / 2));
      camera.position.sub(shot.target).multiplyScalar(k).add(shot.target);
    }
    camera.position.x += parallax.x * 0.12;
    camera.position.y += parallax.y * 0.06;
    camera.lookAt(shot.target);
    camera.updateProjectionMatrix();
    // Lens shift: move the subject up so the lower part of the frame stays clear for the headline.
    const shift = (aspect < 1 ? (opts.shiftPortrait ?? 0.36) : (opts.shift ?? 0.3)) + (shot.shift || 0);
    camera.projectionMatrix.elements[9] = -shift;
    camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
    floor.update(scene, camera);
    grade.uniforms.uTime.value = t;
    grade.uniforms.uFade.value = film.fade ? film.fade(t) : 1;
    composer.render();
    return t;
  }

  const listeners = new Set();
  let raf = 0, running = false, clockStart = 0, offset = 0, lastT = 0, lastChapter = -1, lastFrame = 0;
  let frameMs = 16, frames = 0; // adaptive quality: drop pixel ratio if the device can't hold ~30 fps
  function chapterAt(t) { let c = 0; film.chapters.forEach((ch, i) => { if (t >= ch.start) c = i; }); return c; }
  function emit(t) {
    const c = chapterAt(t);
    const ch = film.chapters[c], next = film.chapters[c + 1] ? film.chapters[c + 1].start : film.duration;
    const progress = (t - ch.start) / (next - ch.start);
    listeners.forEach((fn) => fn({ t, chapter: c, progress, changed: c !== lastChapter }));
    lastChapter = c;
  }
  function frame(now) {
    if (!running) return;
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.1, (now - (lastFrame || now)) / 1000); lastFrame = now;
    frameMs = frameMs * 0.95 + dt * 1000 * 0.05; frames++;
    if (frames > 90 && frameMs > 30 && renderer.getPixelRatio() > 1) { renderer.setPixelRatio(1); resize(); frames = 0; }
    parallax.x += (parallax.tx - parallax.x) * Math.min(1, dt * 2.5);
    parallax.y += (parallax.ty - parallax.y) * Math.min(1, dt * 2.5);
    lastT = renderAt((now - clockStart) / 1000 + offset);
    emit(lastT);
  }

  container.appendChild(canvas);
  resize();
  const ro = new ResizeObserver(() => { resize(); if (!running) renderAt(lastT); });
  ro.observe(container);
  if (!capture) {
    window.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'touch') return;
      parallax.tx = (e.clientX / window.innerWidth) * 2 - 1;
      parallax.ty = -((e.clientY / window.innerHeight) * 2 - 1);
    }, { passive: true });
  }

  return {
    canvas, duration: film.duration, chapters: film.chapters,
    renderAt(t) { lastT = renderAt(t); emit(lastT); return lastT; },
    play() { if (running) return; running = true; clockStart = performance.now(); offset = lastT; lastFrame = 0; raf = requestAnimationFrame(frame); },
    pause() { running = false; cancelAnimationFrame(raf); },
    seek(t) { lastT = t; offset = t; clockStart = performance.now(); if (!running) renderAt(t); emit(t); },
    get running() { return running; },
    get time() { return lastT; },
    on(fn) { listeners.add(fn); return () => listeners.delete(fn); }
  };
}

export function webglAvailable() {
  try { const c = document.createElement('canvas'); return !!(window.WebGL2RenderingContext && c.getContext('webgl2')); } catch (e) { return false; }
}
