/* Film A, firewall migration, as a real-time scene.
   Story (22 s loop): scope the current firewall -> stage the replacement ->
   shift approved traffic cable by cable -> validate and hand over.
   All motion is derived from scene time t so frames are reproducible. */
import { smooth, clamp01 } from './stage.js';
import { canvasTex, rand, texBrushed, texGlowBlade, pulseMaterial, shaftMaterial, spillMaterial, pointsMaterial, slab, shotCamera, shotFade } from './lib.js';

const L = 22;
const SHOTS = [0, 5.5, 11, 16.5, L];

/* ---------- procedural textures ---------- */
function texHexVent(THREE) {
  return canvasTex(THREE, 1024, 256, (g, w, h) => {
    g.fillStyle = '#20252d'; g.fillRect(0, 0, w, h);
    const R = 9, dx = R * 1.8, dy = R * 1.56;
    g.fillStyle = '#040507';
    for (let row = -1; row * dy < h + R; row++) for (let col = -1; col * dx < w + R; col++) {
      const cx = col * dx + (row % 2 ? dx / 2 : 0), cy = row * dy;
      g.beginPath(); for (let k = 0; k < 6; k++) { const a = Math.PI / 6 + k * Math.PI / 3; g.lineTo(cx + Math.cos(a) * (R - 2), cy + Math.sin(a) * (R - 2)); } g.closePath(); g.fill();
    }
    const grd = g.createLinearGradient(0, 0, 0, h); grd.addColorStop(0, 'rgba(255,255,255,0.06)'); grd.addColorStop(1, 'rgba(0,0,0,0.25)'); g.fillStyle = grd; g.fillRect(0, 0, w, h);
  });
}
function texSlotVent(THREE) {
  return canvasTex(THREE, 1024, 256, (g, w, h) => {
    g.fillStyle = '#3c434c'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#0a0b0d';
    for (let y = 26; y < h - 20; y += 30) for (let x = 20; x < w - 40; x += 70) { g.beginPath(); g.roundRect(x, y, 56, 12, 6); g.fill(); }
  });
}
function texRackDoor(THREE) {
  return canvasTex(THREE, 256, 768, (g, w, h) => {
    g.fillStyle = '#12151b'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#030406';
    for (let y = 40; y < h - 40; y += 9) for (let x = 22 + ((y / 9) % 2) * 4.5; x < w - 22; x += 9) { g.beginPath(); g.arc(x, y, 3, 0, 7); g.fill(); }
    g.strokeStyle = '#272c35'; g.lineWidth = 10; g.strokeRect(8, 8, w - 16, h - 16);
    g.fillStyle = '#2e343e'; g.fillRect(w - 34, h * 0.42, 10, 90);
  });
}
function texRackGlow(THREE) {
  const r = rand(3);
  return canvasTex(THREE, 256, 768, (g, w, h) => {
    g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
    for (let y = 40; y < h - 40; y += 9) for (let x = 22 + ((y / 9) % 2) * 4.5; x < w - 22; x += 9) {
      const band = Math.floor((y - 40) / 52) % 3;
      const v = band === 1 ? 40 + r() * 50 : 12 + r() * 22;
      g.fillStyle = `rgb(${v * 0.7 | 0},${v * 0.85 | 0},${v})`; g.beginPath(); g.arc(x, y, 2.6, 0, 7); g.fill();
    }
  });
}
function texGrate(THREE) {
  return canvasTex(THREE, 1024, 64, (g, w, h) => {
    g.fillStyle = '#05070b'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#1b2029'; for (let x = 0; x < w; x += 12) g.fillRect(x, 0, 4, h);
    g.fillStyle = '#262c36'; g.fillRect(0, 0, w, 5); g.fillRect(0, h - 5, w, 5);
  }, { repeat: [12, 1] });
}
/* ---------- materials with shaders ---------- */
/* ---------- geometry builders ---------- */
function buildAppliance(THREE, o) {
  const grp = new THREE.Group();
  const { w, h, d } = o; const front = d / 2;
  const body = new THREE.Mesh(slab(THREE, w, h, d), new THREE.MeshPhysicalMaterial({
    color: o.bodyColor, metalness: 0.88, roughness: o.rough, roughnessMap: o.brushed, clearcoat: o.clearcoat || 0, clearcoatRoughness: 0.4, envMapIntensity: 0.55
  }));
  body.castShadow = true; body.receiveShadow = true; grp.add(body);

  // front fascia recess with vent texture
  const vent = new THREE.Mesh(new THREE.PlaneGeometry(o.vent[1] - o.vent[0], h * 0.66),
    new THREE.MeshStandardMaterial({ map: o.ventTex, metalness: 0.7, roughness: 0.5, envMapIntensity: 0.4 }));
  vent.position.set((o.vent[0] + o.vent[1]) / 2, h * 0.5, front + 0.0012); grp.add(vent);
  if (o.ventTex.repeat) { o.ventTex.wrapS = o.ventTex.wrapT = THREE.RepeatWrapping; }

  // ports: steel housings with dark sockets, two link LEDs each
  const ports = [];
  const pw = o.portW, ph = o.portH, cols = o.cols, rows = o.rows;
  const pitch = (o.ports[1] - o.ports[0]) / cols;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) ports.push(new THREE.Vector3(o.ports[0] + pitch * (c + 0.5), h * (rows === 1 ? 0.5 : (r === 0 ? 0.68 : 0.32)), front));
  const housing = new THREE.InstancedMesh(new THREE.BoxGeometry(pw, ph, 0.014), new THREE.MeshStandardMaterial({ color: 0x59616c, metalness: 0.92, roughness: 0.34, envMapIntensity: 0.6 }), ports.length);
  const hole = new THREE.InstancedMesh(new THREE.BoxGeometry(pw * 0.74, ph * 0.66, 0.004), new THREE.MeshStandardMaterial({ color: 0x020203, roughness: 0.9, metalness: 0 }), ports.length);
  const m = new THREE.Matrix4();
  ports.forEach((p, i) => { m.makeTranslation(p.x, p.y, front + 0.007); housing.setMatrixAt(i, m); m.makeTranslation(p.x, p.y - ph * 0.04, front + 0.0125); hole.setMatrixAt(i, m); });
  grp.add(housing, hole);

  // SFP cages
  if (o.sfp) {
    const sfp = new THREE.InstancedMesh(new THREE.BoxGeometry(o.sfp.w, o.sfp.h, 0.012), new THREE.MeshStandardMaterial({ color: 0x6d7682, metalness: 0.95, roughness: 0.28 }), o.sfp.n * 2);
    const sfpHole = new THREE.InstancedMesh(new THREE.BoxGeometry(o.sfp.w * 0.82, o.sfp.h * 0.6, 0.004), new THREE.MeshStandardMaterial({ color: 0x020203, roughness: 0.9 }), o.sfp.n * 2);
    let k = 0; for (let r = 0; r < 2; r++) for (let c = 0; c < o.sfp.n; c++) {
      const x = o.sfp.x + c * (o.sfp.w + 0.006), y = h * (r ? 0.32 : 0.68);
      m.makeTranslation(x, y, front + 0.006); sfp.setMatrixAt(k, m); m.makeTranslation(x, y, front + 0.0115); sfpHole.setMatrixAt(k, m); k++;
    }
    grp.add(sfp, sfpHole);
  }

  // LEDs (instanced, colour driven per frame)
  const ledPos = [];
  ports.forEach((p) => { ledPos.push([p.x - pw * 0.28, p.y + ph * 0.62]); ledPos.push([p.x + pw * 0.28, p.y + ph * 0.62]); });
  (o.status || []).forEach((s) => ledPos.push(s));
  const leds = new THREE.InstancedMesh(new THREE.BoxGeometry(0.0055, 0.0032, 0.003), new THREE.MeshBasicMaterial({ color: 0xffffff }), ledPos.length);
  ledPos.forEach(([x, y], i) => { m.makeTranslation(x, y, front + 0.0018); leds.setMatrixAt(i, m); leds.setColorAt(i, new THREE.Color(0, 0, 0)); });
  grp.add(leds);

  // rack ears with screws
  const earMat = new THREE.MeshStandardMaterial({ color: o.bodyColor, metalness: 0.9, roughness: 0.45 });
  const screwMat = new THREE.MeshStandardMaterial({ color: 0xb8c0ca, metalness: 1, roughness: 0.25 });
  [-1, 1].forEach((sgn) => {
    const ear = new THREE.Mesh(new THREE.BoxGeometry(0.03, h * 0.96, 0.006), earMat);
    ear.position.set(sgn * (w / 2 + 0.014), h / 2, front - 0.003); ear.castShadow = true; grp.add(ear);
    [0.28, 0.72].forEach((fy) => { const sc = new THREE.Mesh(new THREE.CylinderGeometry(0.0055, 0.0055, 0.004, 14), screwMat); sc.rotation.x = Math.PI / 2; sc.position.set(sgn * (w / 2 + 0.014), h * fy, front + 0.002); grp.add(sc); });
  });

  // top cover seam and rear vents for a believable silhouette
  const seam = new THREE.Mesh(new THREE.BoxGeometry(w * 0.98, 0.0015, 0.004), new THREE.MeshStandardMaterial({ color: 0x050608, roughness: 1 }));
  seam.position.set(0, h + 0.0004, -d * 0.18); grp.add(seam);

  let accent = null;
  if (o.accent) {
    accent = new THREE.Mesh(new THREE.BoxGeometry(w * 0.84, 0.0055, 0.004), new THREE.MeshBasicMaterial({ color: 0x000000 }));
    accent.position.set(0, h * 0.075, front + 0.002); grp.add(accent);
  }
  return { group: grp, ports, leds, ledCount: ledPos.length, portLedCount: ports.length * 2, accent, front, w, h, d };
}

function cableCurve(THREE, port, devicePos, plinthFrontZ, trenchZ, k, n) {
  const p = port.clone().add(devicePos);
  const lane = (k - (n - 1) / 2) * 0.012;
  const pts = [
    new THREE.Vector3(-7.5, 0.006, trenchZ + lane),
    new THREE.Vector3(p.x - 1.2, 0.006, trenchZ + lane),
    new THREE.Vector3(p.x - 0.25, 0.008, trenchZ + lane * 0.6),
    new THREE.Vector3(p.x + 0.02, 0.03, plinthFrontZ + 0.09),
    new THREE.Vector3(p.x + 0.01, 0.2, plinthFrontZ + 0.035),
    new THREE.Vector3(p.x, devicePos.y + 0.012, plinthFrontZ - 0.02),
    new THREE.Vector3(p.x, p.y - 0.02, p.z + 0.085),
    new THREE.Vector3(p.x, p.y, p.z + 0.022)
  ];
  return new THREE.CatmullRomCurve3(pts, false, 'centripetal');
}

/* ---------- the scene ---------- */
export function migrationScene(ctx) {
  const { THREE, scene, renderer } = ctx;
  const brushed = texBrushed(THREE);

  // lights
  scene.add(new THREE.HemisphereLight(0x22355c, 0x020308, 0.55));
  const mkSpot = (color, intensity, pos, target, angle, shadow) => {
    const s = new THREE.SpotLight(color, intensity, 0, angle, 0.75, 2);
    s.position.copy(pos); s.target.position.copy(target);
    if (shadow) { s.castShadow = true; s.shadow.mapSize.set(1024, 1024); s.shadow.bias = -0.0004; s.shadow.normalBias = 0.01; s.shadow.camera.near = 0.5; s.shadow.camera.far = 8; }
    scene.add(s, s.target); return s;
  };
  const keyNew = mkSpot(0xffe6cc, 48, new THREE.Vector3(1.9, 2.8, 2.6), new THREE.Vector3(0.8, 0.35, 0.1), 0.42, true);
  const keyOld = mkSpot(0xc6d8ff, 30, new THREE.Vector3(-1.8, 2.8, 2.4), new THREE.Vector3(-0.95, 0.3, -0.1), 0.42, true);
  const rimNew = mkSpot(0xff7a33, 26, new THREE.Vector3(2.7, 0.37, -2.2), new THREE.Vector3(0.8, 0.4, 0.1), 0.35, false);
  mkSpot(0x5f86d6, 16, new THREE.Vector3(-2.9, 0.34, -1.9), new THREE.Vector3(-0.95, 0.36, 0), 0.35, false);
  const fill = new THREE.PointLight(0x5875ad, 3.2, 0, 2); fill.position.set(0.2, 1.1, 3.4); scene.add(fill);
  const accentLight = new THREE.PointLight(0xff6a1f, 0, 1.6, 2); accentLight.position.set(0.8, 0.33, 0.62); scene.add(accentLight);

  // plinths
  const plinthMat = new THREE.MeshStandardMaterial({ color: 0x0c1018, roughness: 0.7, metalness: 0.35, roughnessMap: brushed, envMapIntensity: 0.35 });
  const mkPlinth = (x, z, w, d) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.3, d), plinthMat); m.position.set(x, 0.15, z); m.castShadow = true; m.receiveShadow = true; scene.add(m); return m; };
  mkPlinth(-0.95, -0.05, 1.25, 1.15);
  mkPlinth(0.8, 0.1, 1.4, 1.25);
  const OLD_PF = -0.05 + 0.575, NEW_PF = 0.1 + 0.625, TRENCH = 1.08;

  // light strips under plinths and their spill on the floor
  const strip = (x, z, w, d, color) => {
    const mat = new THREE.MeshBasicMaterial({ color });
    const m = new THREE.Mesh(new THREE.BoxGeometry(w - 0.02, 0.006, d - 0.02), mat); m.position.set(x, 0.006, z); scene.add(m);
    const spill = new THREE.Mesh(new THREE.PlaneGeometry(w + 1.2, d + 1.2), spillMaterial(THREE, color));
    spill.material.uniforms.uHalf.value.set(w / 2, d / 2); spill.rotation.x = -Math.PI / 2; spill.position.set(x, 0.0015, z); scene.add(spill);
    return { mat, spill: spill.material, color: new THREE.Color(color) };
  };
  const oldStrip = strip(-0.95, -0.05, 1.25, 1.15, 0x8fb4ff);
  const newStrip = strip(0.8, 0.1, 1.4, 1.25, 0xff6a1f);

  // the two appliances
  const oldDev = buildAppliance(THREE, {
    w: 0.95, h: 0.12, d: 0.85, bodyColor: 0x363d46, rough: 0.64, brushed, ventTex: texSlotVent(THREE), vent: [-0.44, -0.12],
    ports: [-0.08, 0.3], cols: 8, rows: 2, portW: 0.034, portH: 0.026, status: [[0.37, 0.085], [0.395, 0.085], [0.42, 0.085]]
  });
  oldDev.group.position.set(-0.95, 0.3, -0.12); scene.add(oldDev.group);
  const newDev = buildAppliance(THREE, {
    w: 1.05, h: 0.21, d: 0.95, bodyColor: 0x15181e, rough: 0.46, clearcoat: 0, brushed, ventTex: texHexVent(THREE), vent: [-0.49, -0.1],
    ports: [-0.06, 0.34], cols: 12, rows: 2, portW: 0.028, portH: 0.024, sfp: { n: 4, w: 0.03, h: 0.016, x: 0.375 },
    status: [[-0.5 + 0.03, 0.17], [-0.5 + 0.05, 0.17], [-0.5 + 0.07, 0.17]], accent: true
  });
  newDev.group.position.set(0.8, 0.3, 0.02); scene.add(newDev.group);

  // fibre patch cables carrying traffic pulses
  const ORANGE = 0xff6a1f;
  const mkCables = (dev, pf, idxs, seed) => idxs.map((pi, k) => {
    const curve = cableCurve(THREE, dev.ports[pi], dev.group.position, pf, TRENCH, k, idxs.length);
    const len = curve.getLength();
    const mat = pulseMaterial(THREE, ORANGE, seed + k * 0.37, len);
    const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 220, 0.0038, 7, false), mat);
    scene.add(mesh); return { mat, port: pi };
  });
  const oldCables = mkCables(oldDev, OLD_PF, [0, 2, 4, 9, 11, 13], 0.11);
  const newCables = mkCables(newDev, NEW_PF, [0, 2, 4, 13, 15, 17], 0.53);

  // floor trench with grate and faint underglow
  const grate = new THREE.Mesh(new THREE.BoxGeometry(16, 0.004, 0.17), new THREE.MeshStandardMaterial({ map: texGrate(THREE), metalness: 0.8, roughness: 0.5, transparent: false }));
  grate.position.set(0, 0.002, TRENCH); scene.add(grate);
  const trenchGlow = new THREE.Mesh(new THREE.BoxGeometry(16, 0.002, 0.012), new THREE.MeshBasicMaterial({ color: new THREE.Color(0x5a7fc0).multiplyScalar(0.35) }));
  trenchGlow.position.set(0, 0.0045, TRENCH + 0.07); scene.add(trenchGlow);

  // rack aisle: cabinets, doors, LEDs
  const doorTex = texRackDoor(THREE);
  const doorMat = new THREE.MeshStandardMaterial({ map: doorTex, emissiveMap: texRackGlow(THREE), emissive: new THREE.Color(0x6f8fd0), emissiveIntensity: 0.55, metalness: 0.75, roughness: 0.45, envMapIntensity: 0.6 });
  const caseMat = new THREE.MeshStandardMaterial({ color: 0x0b0e13, metalness: 0.7, roughness: 0.5, envMapIntensity: 0.25 });
  const rackGeo = new THREE.BoxGeometry(0.62, 2.1, 1.1);
  const perRow = 26, spacing = 0.64;
  const racks = new THREE.InstancedMesh(rackGeo, [caseMat, caseMat, caseMat, caseMat, doorMat, caseMat], perRow * 2);
  const ledPts = [], ledCol = [], ledSeed = [];
  const rr = rand(42), mm = new THREE.Matrix4(), q = new THREE.Quaternion(), one = new THREE.Vector3(1, 1, 1);
  let ri = 0;
  [-1, 1].forEach((side) => {
    for (let i = 0; i < perRow; i++) {
      const z = -1.6 - i * spacing, x = side * 2.35;
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), side < 0 ? Math.PI / 2 : -Math.PI / 2);
      mm.compose(new THREE.Vector3(x, 1.05, z), q, one); racks.setMatrixAt(ri++, mm);
      const faceX = x - side * 0.556;
      for (let u = 0; u < 15; u++) {
        if (rr() < 0.3) continue; // empty slot
        const y = 0.22 + u * 0.118;
        const leds = 2 + (rr() * 2 | 0);
        for (let k = 0; k < leds; k++) {
          ledPts.push(faceX, y, z + side * (0.17 - k * 0.026));
          const pick = rr();
          const c = pick < 0.6 ? [0.5, 0.75, 1.6] : pick < 0.92 ? [0.3, 1.3, 0.6] : [1.8, 0.7, 0.22];
          ledCol.push(...c); ledSeed.push(rr());
        }
      }
    }
  });
  racks.castShadow = false; racks.receiveShadow = false; scene.add(racks);
  const ptsGeo = new THREE.BufferGeometry();
  ptsGeo.setAttribute('position', new THREE.Float32BufferAttribute(ledPts, 3));
  ptsGeo.setAttribute('aColor', new THREE.Float32BufferAttribute(ledCol, 3));
  ptsGeo.setAttribute('aSeed', new THREE.Float32BufferAttribute(ledSeed, 1));
  const ptsMat = pointsMaterial(THREE);
  scene.add(new THREE.Points(ptsGeo, ptsMat));

  // ceiling: light fixtures receding down the aisle, cable trays over the racks
  const fixtureMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xdfe9ff).multiplyScalar(2.2) });
  const fixtureGeo = new THREE.BoxGeometry(0.05, 0.02, 1.7);
  [-1.15, 0, 1.15].forEach((x) => { for (let z = 1.5; z > -18; z -= 2.4) { const f = new THREE.Mesh(fixtureGeo, fixtureMat); f.position.set(x, 2.95, z); scene.add(f); } });
  const trayMat = new THREE.MeshStandardMaterial({ color: 0x0d1117, metalness: 0.8, roughness: 0.5 });
  [-2.35, 2.35].forEach((x) => { const t = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.08, 22), trayMat); t.position.set(x, 2.55, -8); scene.add(t); });
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(10, 26), new THREE.MeshStandardMaterial({ color: 0x05070b, roughness: 1 }));
  ceil.rotation.x = Math.PI / 2; ceil.position.set(0, 3.02, -8); scene.add(ceil);

  // volumetric light shafts and dust
  const mkShaft = (x, z, color, r) => {
    const h = 2.85, mat = shaftMaterial(THREE, color); mat.uniforms.uH.value = h;
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.05, r, h, 40, 1, true), mat); m.position.set(x, h / 2 + 0.05, z); scene.add(m); return mat;
  };
  const shaftNew = mkShaft(0.85, 0.15, 0xffd2a8, 0.85);
  const shaftOld = mkShaft(-0.95, -0.05, 0xa9c3ff, 0.75);
  const dustN = 520, dustPos = new Float32Array(dustN * 3), dustBase = [], dr = rand(9);
  for (let i = 0; i < dustN; i++) { const side = i % 2 ? 0.85 : -0.95; const a = dr() * 6.28, rad = Math.sqrt(dr()) * 0.6; dustBase.push([side + Math.cos(a) * rad, 0.35 + dr() * 2.6, 0.1 + Math.sin(a) * rad, dr()]); }
  const dustGeo = new THREE.BufferGeometry(); dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
  const dustCol = new Float32Array(dustN * 3).fill(0.55), dustSeed = new Float32Array(dustN).map(() => 0.9 + dr() * 0.1);
  dustGeo.setAttribute('aColor', new THREE.BufferAttribute(dustCol, 3)); dustGeo.setAttribute('aSeed', new THREE.BufferAttribute(dustSeed, 1));
  const dustMat = pointsMaterial(THREE); scene.add(new THREE.Points(dustGeo, dustMat));

  // staging scan and validation sweep across the replacement's face
  const bladeTex = texGlowBlade(THREE);
  const blade = new THREE.Mesh(new THREE.PlaneGeometry(0.16, newDev.h + 0.06), new THREE.MeshBasicMaterial({ map: bladeTex, color: 0x000000, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  blade.position.set(0, newDev.h / 2, newDev.front + 0.03); newDev.group.add(blade);

  const tmpC = new THREE.Color(), size = new THREE.Vector2();
  const OLD_LED = new THREE.Color(0.3, 1.6, 0.55), OLD_AMBER = new THREE.Color(1.8, 0.7, 0.1), NEW_LED = new THREE.Color(0.35, 1.7, 0.6), NEW_ORANGE = new THREE.Color(2.2, 0.75, 0.2);

  function ledState(dev, cables, act, t, seedBase, idleColor, activeColor) {
    const active = new Map(); cables.forEach((c, k) => active.set(c.port, act[k]));
    for (let i = 0; i < dev.portLedCount; i++) {
      const port = i >> 1, a = active.has(port) ? active.get(port) : 0;
      const ph = Math.sin(i * 12.9898 + seedBase) * 43758.5453; const f = ph - Math.floor(ph);
      const blink = (Math.sin(t * (9 + f * 14) + f * 30) > 0.1 ? 1 : 0.15);
      const link = (i % 2 === 0) ? 1 : blink;
      const lvl = a * link + (1 - a) * (f > 0.7 ? 0.08 : 0.0);
      tmpC.copy(i % 2 === 0 ? idleColor : activeColor).multiplyScalar(lvl);
      dev.leds.setColorAt(i, tmpC);
    }
  }

  const oldAct = new Array(6).fill(0), newAct = new Array(6).fill(0);
  return {
    duration: L,
    chapters: [{ start: 0, label: 'Scope' }, { start: 5.5, label: 'Stage' }, { start: 11, label: 'Cut over' }, { start: 16.5, label: 'Validate' }],
    fade(t) { return shotFade(SHOTS, t); },
    update(t) {
      // traffic: old path carries everything until the change window, then shifts cable by cable
      for (let k = 0; k < 6; k++) {
        const s = 11.5 + k * 0.62;
        oldAct[k] = 1 - smooth(s, s + 0.7, t);
        newAct[k] = smooth(s - 0.15, s + 0.55, t);
      }
      // staged test traffic on one new cable while policy is mapped
      newAct[0] = Math.max(newAct[0], 0.55 * smooth(7.6, 8.0, t) * (1 - smooth(9.8, 10.3, t)));
      oldCables.forEach((c, k) => { c.mat.uniforms.uTime.value = t; c.mat.uniforms.uActive.value = oldAct[k]; });
      newCables.forEach((c, k) => { c.mat.uniforms.uTime.value = t; c.mat.uniforms.uActive.value = newAct[k]; });

      ledState(oldDev, oldCables, oldAct, t, 1.7, OLD_LED, OLD_LED);
      ledState(newDev, newCables, newAct, t, 4.2, NEW_LED, NEW_ORANGE);
      const oldLive = oldAct.reduce((a, b) => a + b, 0) / 6;
      for (let i = oldDev.portLedCount; i < oldDev.ledCount; i++) oldDev.leds.setColorAt(i, tmpC.copy(i === oldDev.portLedCount ? OLD_LED : OLD_AMBER).multiplyScalar(i === oldDev.portLedCount ? 0.3 + 0.7 * oldLive : 0.4 * (1 - oldLive)));
      const wake = smooth(5.6, 7.0, t);
      for (let i = newDev.portLedCount; i < newDev.ledCount; i++) newDev.leds.setColorAt(i, tmpC.copy(NEW_LED).multiplyScalar(0.1 + 0.9 * wake));
      oldDev.leds.instanceColor.needsUpdate = true; newDev.leds.instanceColor.needsUpdate = true;

      // the replacement wakes during staging and owns the floor light after cut-over
      const newLive = newAct.reduce((a, b) => a + b, 0) / 6;
      const validate = smooth(17.2, 17.7, t) * (1 - smooth(19.0, 20.0, t));
      const accent = 0.06 + 0.5 * wake + 0.6 * newLive + 0.8 * validate;
      const ac = Math.min(accent, 1.4);
      newDev.accent.material.color.setRGB(1.9 * ac, 0.62 * ac, 0.16 * ac);
      accentLight.intensity = 0.45 * ac;
      newStrip.mat.color.copy(newStrip.color).multiplyScalar(0.25 + 1.1 * ac);
      newStrip.spill.uniforms.uI.value = 0.05 + 0.16 * ac;
      oldStrip.mat.color.copy(oldStrip.color).multiplyScalar(0.25 + 1.1 * oldLive);
      oldStrip.spill.uniforms.uI.value = 0.03 + 0.12 * oldLive;
      shaftNew.uniforms.uI.value = 0.03 + 0.025 * ac;
      shaftOld.uniforms.uI.value = 0.02 + 0.03 * oldLive;
      keyOld.intensity = 6 + 5 * oldLive;
      keyNew.intensity = 16 + 6 * ac;
      rimNew.intensity = 11 + 9 * ac;

      // scan blade: policy mapping sweep while staged (7-10 s), validation sweep (17.2-19 s)
      const scanU = (t - 7.0) / 3.0, valU = (t - 17.2) / 1.8;
      let bladeX = 0, bladeI = 0, bladeCol = 0xff6a1f;
      if (scanU > 0 && scanU < 1) { bladeX = -0.55 + scanU * 1.1; bladeI = Math.sin(scanU * Math.PI); }
      else if (valU > 0 && valU < 1) { bladeX = 0.55 - valU * 1.1; bladeI = Math.sin(valU * Math.PI) * 1.2; bladeCol = 0xbfe6ff; }
      blade.position.x = bladeX;
      blade.material.color.set(bladeCol).multiplyScalar(1.5 * bladeI);

      // atmosphere
      renderer.getDrawingBufferSize(size);
      ptsMat.uniforms.uTime.value = t; ptsMat.uniforms.uScale.value = size.y * 0.011;
      dustMat.uniforms.uTime.value = 0; dustMat.uniforms.uScale.value = size.y * 0.0045;
      for (let i = 0; i < dustN; i++) { const b = dustBase[i]; const y = ((b[1] + t * (0.02 + b[3] * 0.03)) % 2.6) + 0.35; dustPos[i * 3] = b[0] + Math.sin(t * 0.3 + i) * 0.04; dustPos[i * 3 + 1] = y; dustPos[i * 3 + 2] = b[2] + Math.cos(t * 0.25 + i * 1.3) * 0.04; }
      dustGeo.attributes.position.needsUpdate = true;
    },
    camera(t, out) {
      shotCamera(SHOTS, [
        [[-0.30, 0.52, 1.45], [-0.78, 0.47, 1.38], [-0.78, 0.37, 0.24], [-1.06, 0.36, 0.22], 26, -0.06],
        [[1.95, 0.75, 2.3], [1.35, 1.12, 2.95], [0.25, 0.42, 0.05], [0.0, 0.40, 0.0], 32, 0.0],
        [[0.02, 0.62, 1.75], [0.55, 0.56, 1.62], [0.66, 0.40, 0.40], [0.86, 0.40, 0.44], 28, -0.06],
        [[0.35, 0.92, 3.5], [0.18, 0.82, 3.05], [-0.02, 0.36, 0.0], [-0.02, 0.36, 0.0], 33, 0.0]
      ], t, out);
    }
  };
}
