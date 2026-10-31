/* VALO hero stage: shared real-time 3D core (three.js r160).
   One WebGL context and one post-processing chain host several service scenes.
   Each scene owns its THREE.Scene, lights and reflective floor and is built the first time it is shown.
   Every animated value is a function of scene time t, so frames are reproducible (?capture). */
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
function createReflectiveFloor(renderer, target, opts = {}) {
  const mirrorCam = new THREE.PerspectiveCamera();
  const texMatrix = new THREE.Matrix4();
  const uniforms = THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {
    tRefl: { value: null }, texMatrix: { value: texMatrix }, uBase: { value: new THREE.Color(opts.base ?? 0x05080f) },
    uTexel: { value: new THREE.Vector2(1, 1) }, uCam: { value: new THREE.Vector3() }, uTile: { value: opts.tile ?? 0.6 }, uRefl: { value: opts.reflect ?? 1 }
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
      uniform sampler2D tRefl; uniform vec3 uBase; uniform vec2 uTexel; uniform vec3 uCam; uniform float uTile; uniform float uRefl; varying vec4 vRP; varying vec3 vW;
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
        vec2 g = abs(fract(vW.xz / uTile) - 0.5);
        float seam = smoothstep(0.492, 0.5, max(g.x, g.y));
        vec3 col = uBase * (0.85 + 0.3 * noise(vW.xz * 5.0)) + refl * uRefl * fres * (1.0 - 0.75 * seam) * (0.75 + 0.25 * rough);
        col *= 1.0 - 0.45 * seam;
        gl_FragColor = vec4(col, 1.0);
        #include <fog_fragment>
      }`
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), mat);
  mesh.rotation.x = -Math.PI / 2;

  const bias = new THREE.Matrix4().set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1);
  const tmpTarget = new THREE.Vector3(), lookDir = new THREE.Vector3();
  return {
    mesh,
    setTexel(w, h) { uniforms.uTexel.value.set(1 / w, 1 / h); },
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

/* createStage(container, factories, opts) -> controller
   factory(ctx) returns { duration, chapters:[{start,label}], floor?, update(t), camera(t, out), fade?(t),
   labels?:[{text, tone?, at(t, vec3), alpha(t)}] } */
export function createStage(container, factories, opts = {}) {
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

  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTex = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;
  const reflQuality = small ? 0.35 : 0.5;
  const reflTarget = new THREE.WebGLRenderTarget(2, 2, { type: THREE.HalfFloatType });
  const camera = new THREE.PerspectiveCamera(32, 16 / 9, 0.05, 80);

  const rt = new THREE.WebGLRenderTarget(2, 2, { type: THREE.HalfFloatType, samples: capture ? 8 : (small ? 2 : 4) });
  const composer = new EffectComposer(renderer, rt);
  const renderPass = new RenderPass(new THREE.Scene(), camera);
  composer.addPass(renderPass);
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.42, 0.5, 0.9);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());
  const grade = new ShaderPass(GradeShader);
  composer.addPass(grade);

  let width = 2, height = 2;
  const texelW = () => width * renderer.getPixelRatio() * reflQuality;
  const texelH = () => height * renderer.getPixelRatio() * reflQuality;

  const built = [];
  function build(i) {
    if (built[i]) return built[i];
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x03060d);
    scene.fog = new THREE.FogExp2(0x050a15, 0.068);
    scene.environment = envTex;
    const ctx = { THREE, scene, camera, renderer, small, capture };
    const film = factories[i](ctx);
    const floor = createReflectiveFloor(renderer, reflTarget, film.floor || {});
    floor.setTexel(texelW(), texelH());
    scene.add(floor.mesh);
    built[i] = { scene, film, floor };
    return built[i];
  }

  const labelLayer = opts.labelLayer || null;
  let labelEls = [];
  function mountLabels(film) {
    if (!labelLayer) return;
    labelLayer.textContent = '';
    labelEls = (film.labels || []).map((l) => {
      const el = document.createElement('span');
      el.className = 'h-label3d' + (l.tone ? ' is-' + l.tone : '');
      el.textContent = l.text;
      labelLayer.appendChild(el);
      return el;
    });
  }

  let current = opts.initial || 0;
  let active = build(current);
  renderPass.scene = active.scene;
  mountLabels(active.film);

  const shot = { pos: new THREE.Vector3(), target: new THREE.Vector3(), fov: 32, shift: 0 };
  const parallax = { x: 0, y: 0, tx: 0, ty: 0 };
  const v3 = new THREE.Vector3();

  function resize() {
    const r = container.getBoundingClientRect();
    width = Math.max(2, Math.round(r.width)); height = Math.max(2, Math.round(r.height));
    renderer.setSize(width, height, false);
    const pr = renderer.getPixelRatio();
    composer.setPixelRatio(pr);
    composer.setSize(width, height);
    bloom.setSize(width * pr * 0.5, height * pr * 0.5);
    reflTarget.setSize(Math.max(2, Math.round(texelW())), Math.max(2, Math.round(texelH())));
    built.forEach((b) => b && b.floor.setTexel(texelW(), texelH()));
    grade.uniforms.uRes.value.set(width * pr, height * pr);
  }

  function renderAt(t) {
    const { film, scene, floor } = active;
    t = ((t % film.duration) + film.duration) % film.duration;
    film.update(t);
    film.camera(t, shot);
    const aspect = width / height;
    camera.aspect = aspect;
    // Portrait screens: widen the vertical field of view within reason, then dolly back to keep the composition.
    const hfov = 2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(shot.fov) / 2) * (16 / 9));
    let vfov = THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(hfov / 2) / aspect));
    vfov = Math.max(shot.fov, Math.min(vfov, 64));
    camera.fov = vfov;
    camera.position.copy(shot.pos);
    const hAvail = 2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(vfov) / 2) * aspect);
    if (hAvail < hfov) {
      const k = Math.min(2.4, Math.tan(hfov / 2) / Math.tan(hAvail / 2));
      camera.position.sub(shot.target).multiplyScalar(k).add(shot.target);
    }
    camera.position.x += parallax.x * 0.12;
    camera.position.y += parallax.y * 0.06;
    camera.lookAt(shot.target);
    camera.updateProjectionMatrix();
    // Lens shift: keep the subject above the headline.
    const shift = (aspect < 1 ? (opts.shiftPortrait ?? 0.36) : (opts.shift ?? 0.3)) + (shot.shift || 0);
    camera.projectionMatrix.elements[9] = -shift;
    camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
    camera.updateMatrixWorld();
    floor.update(scene, camera);
    grade.uniforms.uTime.value = t;
    const fade = film.fade ? film.fade(t) : 1;
    grade.uniforms.uFade.value = fade;
    composer.render();
    if (labelEls.length) {
      const placed = [];
      film.labels.forEach((l, i) => {
        const el = labelEls[i];
        l.at(t, v3); v3.project(camera);
        const x = (v3.x + 1) / 2 * width, y = (1 - v3.y) / 2 * height;
        // keep labels clear of the navigation bar and the headline block
        const safe = smooth(88, 120, y) * (1 - smooth(height * 0.46, height * 0.52, y)) * smooth(-20, 40, x) * (1 - smooth(width - 40, width + 20, x));
        let a = (v3.z < 1 ? clamp01(l.alpha(t)) : 0) * fade * safe;
        // skip a label that would overlap one already shown (narrow screens)
        if (a > 0.05) {
          const w2 = (el.offsetWidth || 120) / 2 + 4, h = (el.offsetHeight || 20) + 4;
          const box = [x - w2, y - h, x + w2, y];
          if (placed.some((b) => box[0] < b[2] && box[2] > b[0] && box[1] < b[3] && box[3] > b[1])) a = 0; else placed.push(box);
        }
        el.style.opacity = a.toFixed(3);
        el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
      });
    }
    return t;
  }

  const listeners = new Set();
  let raf = 0, running = false, clockStart = 0, offset = 0, lastT = 0, lastChapter = -1, lastFrame = 0;
  let frameMs = 16, frames = 0; // adaptive quality: drop pixel ratio if the device can't hold ~30 fps
  let looping = true;
  function chapterAt(t) { let c = 0; active.film.chapters.forEach((ch, i) => { if (t >= ch.start) c = i; }); return c; }
  function emit(t, extra = {}) {
    const chs = active.film.chapters, c = chapterAt(t);
    const next = chs[c + 1] ? chs[c + 1].start : active.film.duration;
    listeners.forEach((fn) => fn({ scene: current, t, progress: t / active.film.duration, chapter: c, chapterProgress: (t - chs[c].start) / (next - chs[c].start), changed: c !== lastChapter, ...extra }));
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
    const raw = (now - clockStart) / 1000 + offset;
    if (!looping && raw >= active.film.duration) { emit(active.film.duration - 0.001, { ended: true }); return; }
    lastT = renderAt(raw);
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

  const api = {
    canvas,
    get scene() { return current; },
    get duration() { return active.film.duration; },
    get chapters() { return active.film.chapters; },
    get running() { return running; },
    get time() { return lastT; },
    set loop(v) { looping = !!v; },
    renderAt(t) { lastT = renderAt(t); emit(lastT); return lastT; },
    play() { if (running) return; running = true; clockStart = performance.now(); offset = lastT; lastFrame = 0; raf = requestAnimationFrame(frame); },
    pause() { running = false; cancelAnimationFrame(raf); },
    seek(t) { lastT = t; offset = t; clockStart = performance.now(); if (!running) renderAt(t); emit(t); },
    setScene(i, t = 0) {
      current = i; active = build(i);
      renderPass.scene = active.scene;
      mountLabels(active.film);
      lastChapter = -1;
      api.seek(t);
    },
    on(fn) { listeners.add(fn); return () => listeners.delete(fn); }
  };
  return api;
}

export function webglAvailable() {
  try { const c = document.createElement('canvas'); return !!(window.WebGL2RenderingContext && c.getContext('webgl2')); } catch (e) { return false; }
}
