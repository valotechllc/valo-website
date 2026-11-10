/* Film D, MSP white-label, as a real-time scene.
   Story (22 s loop): the customer's request reaches the MSP's brand wall ->
   the camera moves behind the wall to VALO's engineering bay: the change is typed and committed
   on the customer's firewall -> tests: staff traffic passes, guest traffic is blocked, rollback ready ->
   the as-built pack lifts over the wall and lands on the MSP's side, under the MSP's name.
   Equipment is generic (no vendor hardware is modelled). All data is illustrative. Every value is a function of t. */
import { smooth, clamp01 } from './stage.js';
import { canvasTex, rand, texBrushed, texGlowBlade, pulseMaterial, pointsMaterial, shaftMaterial, slab, shotCamera, shotFade } from './lib.js';

const L = 22;
const SHOTS = [0, 5.5, 11, 16.5, L];
const ORANGE = 0xff6a1f, ICE = 0xbfe6ff, MINT = 0x58e0a6;

// brand wall (faces +z, the customer's side); VALO's bay sits behind it (z < 0)
const WW = 2.4, WH = 1.05, WY = 0.06;
// rack holding the customer's firewall
const RX = 0.42, RZ = -1.25, RW = 0.8, RD = 0.56, RH = 1.12;
const FW_Y = 0.5, FW_H = 0.15;
const FW_FRONT = RZ + (RD - 0.05) / 2;
// engineering console
const CX = -0.5, CZ = -1.05, CTILT = 0.62, CW = 1.0, CH = 0.64, CY = 0.62;
const PAD = [-1.6, 1.15];                              // the customer's site

const LINES = [
  ['fw-branch-01> ', 'configure'],
  ['# ', 'set zone guest interface ethernet1/3'],
  ['# ', 'set rule staff-web  trust > untrust  allow'],
  ['# ', 'set rule guest-deny guest > trust    deny'],
  ['# ', 'commit'],
  ['', 'Configuration committed successfully']
];
const TOTAL = LINES.reduce((n, l) => n + l[1].length, 0);
const TYPE0 = 6.3, TYPE1 = 9.7;
const TESTS = [['staff-web', 'trust > untrust', 'ALLOWED'], ['guest-deny', 'guest > trust', 'BLOCKED'], ['rollback', 'saved config', 'READY']];
const TEST_AT = [12.9, 13.7, 15.4];
const DOCS = [['AS-BUILT', 'Branch firewall', 'as-built.pdf'], ['RUNNING CONFIG', 'fw-branch-01', 'running-config.xml'], ['CHANGE RECORD', 'REQ-1042 · guest zone', 'change-record.pdf']];
const DOC_AT = [16.9, 17.3, 17.7], DOC_DUR = 2.0;

const MONO = '"JetBrains Mono", monospace';

/* ---------- textures ---------- */
function texWallFront(THREE) {
  // a dark graphite brand panel with light type, so it sits in the scene instead of glaring
  return canvasTex(THREE, 2048, 1068, (g, w, h) => {
    const grd = g.createLinearGradient(0, 0, 0, h); grd.addColorStop(0, '#2c333e'); grd.addColorStop(1, '#1d222a');
    g.fillStyle = grd; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(200,215,235,0.05)'; g.lineWidth = 2;
    for (let x = 64; x < w; x += 64) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
    for (let y = 64; y < h; y += 64) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
    g.fillStyle = '#3b4556'; g.fillRect(150, 330, 230, 230);
    g.strokeStyle = 'rgba(255,255,255,0.22)'; g.lineWidth = 3; g.strokeRect(151.5, 331.5, 227, 227);
    g.fillStyle = '#f26b1f'; g.fillRect(150, 560, 230, 14);
    g.fillStyle = '#ffffff'; g.font = '700 112px Inter, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('YM', 265, 450);
    g.textAlign = 'left'; g.textBaseline = 'alphabetic';
    g.fillStyle = '#eef2f7'; g.font = '700 220px Inter, sans-serif'; g.fillText('Your MSP', 440, 520);
    g.fillStyle = '#b3bdcb'; g.font = '500 58px Inter, sans-serif'; g.fillText('Managed service provider', 446, 610);
    g.fillStyle = '#93a0b3'; g.font = `500 34px ${MONO}`; g.fillText('SERVICE DESK  ·  CHANGE MANAGEMENT  ·  SUPPORT', 150, 860);
    g.fillStyle = 'rgba(255,255,255,0.14)'; g.fillRect(150, 890, w - 300, 3);
    g.fillStyle = '#76829a'; g.font = `500 28px ${MONO}`; g.fillText('ILLUSTRATIVE BRAND', 150, 960);
  });
}
function texWallBack(THREE) {
  return canvasTex(THREE, 1024, 534, (g, w, h) => {
    g.fillStyle = '#262d39'; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(170,186,212,0.12)'; g.lineWidth = 1;
    for (let x = 32; x < w; x += 32) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
    for (let y = 32; y < h; y += 32) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
    g.fillStyle = '#ff7a33'; g.fillRect(56, 420, 6, 60);
    g.fillStyle = '#d6dee9'; g.font = `600 30px ${MONO}`; g.fillText('VALO ENGINEERING', 80, 446);
    g.fillStyle = '#9aa6b8'; g.font = `500 22px ${MONO}`; g.fillText('BEHIND YOUR BRAND', 80, 478);
  });
}
function texStatus(THREE, state) {
  const c = { scope: ['#f26b1f', 'REQ-1042  ·  Scoping'], work: ['#f26b1f', 'REQ-1042  ·  In progress'], done: ['#1f9d68', 'REQ-1042  ·  Completed'] }[state];
  return canvasTex(THREE, 720, 120, (g, w, h) => {
    g.fillStyle = '#353d4a'; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(255,255,255,0.25)'; g.lineWidth = 3; g.strokeRect(1.5, 1.5, w - 3, h - 3);
    g.fillStyle = c[0]; g.beginPath(); g.arc(52, h / 2, 14, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#eef2f7'; g.font = '600 40px Inter, sans-serif'; g.textBaseline = 'middle'; g.fillText(c[1], 86, h / 2 + 2);
  });
}
function texTicket(THREE) {
  return canvasTex(THREE, 840, 520, (g, w, h) => {
    g.fillStyle = '#f7f9fb'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#13213b'; g.fillRect(0, 0, w, 86);
    g.fillStyle = '#ffffff'; g.font = '600 34px Inter, sans-serif'; g.fillText('Your MSP  ·  Change request', 32, 56);
    g.fillStyle = '#f26b1f'; g.fillRect(0, 86, w, 6);
    g.fillStyle = '#7a8597'; g.font = `500 24px ${MONO}`; g.fillText('REQ-1042', 32, 142);
    g.fillStyle = '#0d1729'; g.font = '600 42px Inter, sans-serif'; g.fillText('Separate guest Wi-Fi', 32, 206); g.fillText('from staff network', 32, 258);
    [['Window', 'Sat 22:00'], ['Rollback', 'Agreed'], ['Equipment', 'fw-branch-01']].forEach(([k, v], i) => {
      const y = 330 + i * 56; g.fillStyle = '#7a8597'; g.font = `500 26px ${MONO}`; g.fillText(k.toUpperCase(), 32, y);
      g.fillStyle = '#13213b'; g.font = '500 30px Inter, sans-serif'; g.fillText(v, 300, y);
    });
    g.strokeStyle = 'rgba(19,33,59,0.3)'; g.lineWidth = 4; g.strokeRect(2, 2, w - 4, h - 4);
  });
}
function drawConsole(g, w, h, chars, tests) {
  g.clearRect(0, 0, w, h);
  g.fillStyle = 'rgba(38,47,63,0.96)'; g.fillRect(0, 0, w, h);
  g.strokeStyle = 'rgba(214,224,240,0.6)'; g.lineWidth = 4; g.strokeRect(2, 2, w - 4, h - 4);
  g.fillStyle = '#ff7a33'; g.fillRect(48, 52, 10, 58);
  g.fillStyle = '#f5f7fb'; g.font = '600 46px Inter, sans-serif'; g.fillText('VALO engineering', 78, 98);
  g.fillStyle = '#b4bfd0'; g.font = `500 26px ${MONO}`; g.fillText('REQ-1042  ·  FOR YOUR MSP  ·  INSIDE YOUR CHANGE PROCESS', 78, 146);
  g.fillStyle = '#0e131b'; g.fillRect(48, 186, w - 96, 400);
  g.strokeStyle = 'rgba(170,186,210,0.4)'; g.lineWidth = 2; g.strokeRect(48, 186, w - 96, 400);
  g.font = `500 31px ${MONO}`;
  let left = chars, y = 248;
  for (const [pre, cmd] of LINES) {
    if (left <= 0) break;
    const n = Math.min(cmd.length, left); left -= cmd.length;
    g.fillStyle = '#ff9a5c'; g.fillText(pre, 78, y);
    const px = 78 + g.measureText(pre).width;
    g.fillStyle = pre === '' ? '#6ff0b8' : '#f1f5fb'; g.fillText(cmd.slice(0, n), px, y);
    if (n < cmd.length) { g.fillStyle = '#f1f5fb'; g.fillRect(px + g.measureText(cmd.slice(0, n)).width + 4, y - 26, 16, 32); }
    y += 56;
  }
  TESTS.forEach(([name, path, res], i) => {
    const ty = 626 + i * 104, on = tests > i;
    g.fillStyle = on ? 'rgba(58,72,94,0.96)' : 'rgba(48,58,76,0.7)'; g.fillRect(48, ty, w - 96, 84);
    g.fillStyle = on ? (res === 'BLOCKED' ? '#ff7a33' : '#58e0a6') : '#66728a'; g.fillRect(48, ty, 8, 84);
    g.fillStyle = on ? '#f5f7fb' : '#98a3b5'; g.font = `600 32px ${MONO}`; g.fillText(name, 82, ty + 54);
    g.fillStyle = on ? '#cdd6e3' : '#7d899b'; g.font = `500 28px ${MONO}`; g.fillText(path, 420, ty + 54);
    g.textAlign = 'right'; g.fillStyle = on ? (res === 'BLOCKED' ? '#ff9a5c' : '#6ff0b8') : '#7d899b'; g.font = `700 30px ${MONO}`;
    g.fillText(on ? res + ' AS EXPECTED' : 'PENDING', w - 80, ty + 54); g.textAlign = 'left';
  });
}
function texBezel(THREE, kind) {
  const H = kind === 'fw' ? 232 : 116;
  return canvasTex(THREE, 1024, H, (g, w, h) => {
    const grd = g.createLinearGradient(0, 0, 0, h); grd.addColorStop(0, '#454e5c'); grd.addColorStop(1, '#2a3039');
    g.fillStyle = grd; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(255,255,255,0.16)'; g.fillRect(0, 0, w, 3);
    g.fillStyle = '#56606f'; g.fillRect(0, 0, 34, h); g.fillRect(w - 34, 0, 34, h);
    g.fillStyle = '#15191f'; [0.3, 0.7].forEach((f) => { g.beginPath(); g.arc(17, h * f, 6, 0, 7); g.fill(); g.beginPath(); g.arc(w - 17, h * f, 6, 0, 7); g.fill(); });
    const port = (x, y, s) => { g.fillStyle = '#0b0e12'; g.fillRect(x, y, s, s * 0.82); g.strokeStyle = '#6a7484'; g.lineWidth = 2; g.strokeRect(x, y, s, s * 0.82); g.fillStyle = '#1d232c'; g.fillRect(x + s * 0.3, y + s * 0.55, s * 0.4, s * 0.2); };
    g.font = `600 22px ${MONO}`; g.fillStyle = '#e1e7ef';
    if (kind === 'fw') {
      g.fillText('fw-branch-01', 60, 52); g.fillStyle = '#a3adbd'; g.font = `500 17px ${MONO}`; g.fillText('CUSTOMER FIREWALL', 60, 80);
      for (let i = 0; i < 8; i++) port(330 + (i % 4) * 58, 60 + (i >> 2) * 70, 46);
      for (let i = 0; i < 2; i++) { g.fillStyle = '#0b0e12'; g.fillRect(590, 66 + i * 70, 84, 40); g.strokeStyle = '#8a94a5'; g.strokeRect(590, 66 + i * 70, 84, 40); }
      g.fillStyle = '#171b22'; for (let i = 0; i < 18; i++) g.fillRect(720 + i * 14, 40, 6, h - 80);
    } else if (kind === 'sw') {
      g.fillText('sw-core', 60, 50); g.fillStyle = '#a3adbd'; g.font = `500 16px ${MONO}`; g.fillText('24 PORT', 60, 78);
      for (let i = 0; i < 24; i++) port(250 + (i % 12) * 52 + (i % 12 > 5 ? 16 : 0), 14 + (i >= 12 ? 46 : 0), 38);
    } else {
      g.fillText('patch', 60, 66);
      for (let i = 0; i < 24; i++) port(180 + i * 33, 34, 26);
    }
  });
}
function texDoc(THREE, d) {
  return canvasTex(THREE, 600, 780, (g, w, h) => {
    g.fillStyle = '#f5f7fa'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#13213b'; g.fillRect(0, 0, w, 96);
    g.fillStyle = '#ffffff'; g.font = '700 40px Inter, sans-serif'; g.fillText('YM', 30, 62);
    g.font = '600 30px Inter, sans-serif'; g.fillText('Your MSP', 104, 60);
    g.fillStyle = '#f26b1f'; g.fillRect(0, 96, w, 6);
    g.fillStyle = '#c2470e'; g.font = `600 26px ${MONO}`; g.fillText(d[0], 30, 164);
    g.fillStyle = '#0d1729'; g.font = '600 38px Inter, sans-serif'; g.fillText(d[1], 30, 216);
    g.fillStyle = '#c9d0da'; for (let i = 0; i < 9; i++) g.fillRect(30, 270 + i * 44, (i % 3 === 2 ? 0.55 : 0.88) * (w - 60), 14);
    g.fillStyle = '#7a8597'; g.font = `500 22px ${MONO}`; g.fillText(d[2], 30, h - 40);
    g.strokeStyle = 'rgba(19,33,59,0.25)'; g.lineWidth = 4; g.strokeRect(2, 2, w - 4, h - 4);
  });
}
// a light trail that grows along a curve behind a moving object
function trailMaterial(THREE, color) {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uHead: { value: 0 }, uI: { value: 0 }, uColor: { value: new THREE.Color(color) } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform float uHead, uI; uniform vec3 uColor; varying vec2 vUv;
      void main(){ float d = uHead - vUv.x; if (d < 0.0) discard; float a = exp(-d * 5.0) * 1.6 + exp(-d * d * 4000.0) * 4.0; gl_FragColor = vec4(uColor * a * uI, 1.0); }`
  });
}

export function mspScene(ctx) {
  const { THREE, scene, renderer } = ctx;
  // graphite, not navy: the scene's own tint keeps the panels and equipment clear of the background
  scene.fog.density = 0.05;
  scene.background.setHex(0x0b0c10); scene.fog.color.setHex(0x17191f);
  const brushed = texBrushed(THREE);
  const V = (x, y, z) => new THREE.Vector3(x, y, z);

  /* ---------- lights ---------- */
  scene.add(new THREE.HemisphereLight(0x3a4458, 0x050506, 0.6));
  const wallKey = new THREE.SpotLight(0xfff2e6, 6, 0, 0.7, 0.9, 2); wallKey.position.set(-0.6, 2.6, 2.8); wallKey.target.position.set(0, 0.6, 0); scene.add(wallKey, wallKey.target);
  const bayKey = new THREE.SpotLight(0xffe7d2, 22, 0, 0.42, 0.75, 2); bayKey.position.set(0.9, 3.4, -0.5); bayKey.target.position.set(RX - 0.2, 0.3, RZ + 0.1);
  bayKey.castShadow = true; bayKey.shadow.mapSize.set(1024, 1024); bayKey.shadow.bias = -0.0005; scene.add(bayKey, bayKey.target);
  const rim = new THREE.SpotLight(0x7fa3e8, 14, 0, 0.55, 0.8, 2); rim.position.set(-2.4, 1.1, -3.2); rim.target.position.set(-0.2, 0.6, -1.0); scene.add(rim, rim.target);
  const fwGlow = new THREE.PointLight(ORANGE, 0, 1.6, 2); fwGlow.position.set(RX, FW_Y + 0.08, FW_FRONT + 0.25); scene.add(fwGlow);
  const padLight = new THREE.PointLight(ICE, 1.2, 1.4, 2); padLight.position.set(PAD[0], 0.5, PAD[1]); scene.add(padLight);
  const fill = new THREE.PointLight(0x8090b0, 1.4, 0, 2); fill.position.set(1.5, 1.8, 2.6); scene.add(fill);

  /* ---------- the MSP's brand wall ---------- */
  const wall = new THREE.Group(); wall.position.set(0, WY, 0); scene.add(wall);
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x9aa3b0, metalness: 0.9, roughness: 0.32, roughnessMap: brushed });
  const fTex = texWallFront(THREE);
  const frontMat = new THREE.MeshStandardMaterial({ map: fTex, emissiveMap: fTex, emissive: new THREE.Color(0xffffff), emissiveIntensity: 0.16, color: 0x9aa2ae, roughness: 0.75, metalness: 0.05, envMapIntensity: 0.35 });
  const front = new THREE.Mesh(new THREE.PlaneGeometry(WW, WH), frontMat); front.position.set(0, WH / 2, 0.021); wall.add(front);
  const bTex = texWallBack(THREE);
  const backMat = new THREE.MeshStandardMaterial({ map: bTex, emissiveMap: bTex, emissive: new THREE.Color(0xffffff), emissiveIntensity: 0.35, roughness: 0.3, metalness: 0.3 });
  const back = new THREE.Mesh(new THREE.PlaneGeometry(WW, WH), backMat); back.rotation.y = Math.PI; back.position.set(0, WH / 2, -0.021); wall.add(back);
  const core = new THREE.Mesh(new THREE.BoxGeometry(WW, WH, 0.04), new THREE.MeshStandardMaterial({ color: 0x1a1d24, roughness: 0.6 })); core.position.y = WH / 2; core.castShadow = true; wall.add(core);
  [WH + 0.012, -0.012].forEach((y) => { const b = new THREE.Mesh(new THREE.BoxGeometry(WW + 0.05, 0.024, 0.06), frameMat); b.position.set(0, y, 0); wall.add(b); });
  [-1, 1].forEach((s) => { const b = new THREE.Mesh(new THREE.BoxGeometry(0.024, WH + 0.05, 0.06), frameMat); b.position.set(s * (WW / 2 + 0.012), WH / 2, 0); wall.add(b); });
  const stripMatF = new THREE.MeshBasicMaterial({ color: 0x000000 }), stripMatB = new THREE.MeshBasicMaterial({ color: 0x000000 });
  const stripF = new THREE.Mesh(new THREE.BoxGeometry(WW, 0.008, 0.01), stripMatF); stripF.position.set(0, -0.03, 0.045); wall.add(stripF);
  const stripB = new THREE.Mesh(new THREE.BoxGeometry(WW, 0.008, 0.01), stripMatB); stripB.position.set(0, -0.03, -0.045); wall.add(stripB);
  const statusTex = { scope: texStatus(THREE, 'scope'), work: texStatus(THREE, 'work'), done: texStatus(THREE, 'done') };
  const chipMat = new THREE.MeshStandardMaterial({ map: statusTex.scope, emissiveMap: statusTex.scope, emissive: new THREE.Color(0xffffff), emissiveIntensity: 0.16, color: 0x9aa2ae, roughness: 0.75, envMapIntensity: 0.35 });
  const chip = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.1), chipMat); chip.position.set(0.66, WH - 0.17, 0.026); wall.add(chip);

  /* ---------- the customer's site ---------- */
  const padMat = new THREE.MeshStandardMaterial({ color: 0x2a2f38, metalness: 0.7, roughness: 0.35, roughnessMap: brushed });
  const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.38, 0.05, 64), padMat); pad.position.set(PAD[0], 0.025, PAD[1]); pad.castShadow = pad.receiveShadow = true; scene.add(pad);
  const padRingMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
  const padRing = new THREE.Mesh(new THREE.TorusGeometry(0.37, 0.004, 6, 96), padRingMat); padRing.rotation.x = Math.PI / 2; padRing.position.set(PAD[0], 0.052, PAD[1]); scene.add(padRing);
  const devMat = new THREE.MeshStandardMaterial({ color: 0xd5dbe4, metalness: 0.4, roughness: 0.3 });
  const devLed = new THREE.MeshBasicMaterial({ color: new THREE.Color(ICE).multiplyScalar(1.6) });
  [[-0.14, 0.09, 0.08, 0.16, 0.1], [0.12, -0.08, 0.1, 0.08, 0.14], [0.02, 0.15, 0.06, 0.12, 0.06], [-0.16, -0.12, 0.07, 0.07, 0.07], [0.18, 0.12, 0.05, 0.1, 0.05]].forEach(([dx, dz, w, h, d], i) => {
    const m = new THREE.Mesh(slab(THREE, w * 1.4, h, d * 1.4, 0.004), devMat); m.position.set(PAD[0] + dx, 0.05, PAD[1] + dz); m.rotation.y = i * 0.7; m.castShadow = true; scene.add(m);
    const led = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.006, 0.004), devLed); led.position.set(0, h * 0.75, d * 0.7 + 0.002); m.add(led);
  });

  /* ---------- VALO's bay: rack with the customer's equipment ---------- */
  const rack = new THREE.Group(); rack.position.set(RX, 0, RZ); scene.add(rack);
  const postMat = new THREE.MeshStandardMaterial({ color: 0x262b33, metalness: 0.7, roughness: 0.5 });
  const plinth = new THREE.Mesh(slab(THREE, RW + 0.14, 0.05, RD + 0.14, 0.006), postMat); plinth.receiveShadow = plinth.castShadow = true; rack.add(plinth);
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => { const p = new THREE.Mesh(new THREE.BoxGeometry(0.036, RH, 0.036), postMat); p.position.set(sx * RW / 2, 0.05 + RH / 2, sz * RD / 2); p.castShadow = true; rack.add(p); });
  [0.07, RH + 0.03].forEach((y) => [-1, 1].forEach((sz) => { const b = new THREE.Mesh(new THREE.BoxGeometry(RW, 0.03, 0.03), postMat); b.position.set(0, y, sz * RD / 2); b.castShadow = true; rack.add(b); }));
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x454d59, metalness: 0.7, roughness: 0.5 });
  const unit = (y, h, kind) => {
    const body = new THREE.Mesh(slab(THREE, RW - 0.07, h, RD - 0.05, 0.004), bodyMat); body.position.set(0, y, 0); body.castShadow = body.receiveShadow = true; rack.add(body);
    if (!kind) return;
    const tx = texBezel(THREE, kind);
    const bm = new THREE.MeshStandardMaterial({ map: tx, emissiveMap: tx, emissive: new THREE.Color(0xffffff), emissiveIntensity: 0.28, metalness: 0.5, roughness: 0.4 });
    const bz = new THREE.Mesh(new THREE.PlaneGeometry(RW - 0.02, h), bm); bz.position.set(0, y + h / 2, (RD - 0.05) / 2 + 0.002); rack.add(bz);
  };
  unit(0.09, 0.26, null);               // UPS
  unit(0.38, 0.075, 'patch');
  unit(FW_Y, FW_H, 'fw');               // the device being changed
  unit(0.69, 0.075, 'sw');
  unit(0.8, 0.075, 'patch');
  const leds = new THREE.InstancedMesh(new THREE.BoxGeometry(0.012, 0.007, 0.004), new THREE.MeshBasicMaterial({ color: 0xffffff }), 6);
  const LM = new THREE.Matrix4();
  for (let i = 0; i < 6; i++) { LM.makeTranslation(RX - (RW - 0.02) / 2 + 0.06 + (i % 3) * 0.026, FW_Y + 0.03 + (i >= 3 ? 0.022 : 0), FW_FRONT + 0.006); leds.setMatrixAt(i, LM); leds.setColorAt(i, new THREE.Color(0x000000)); }
  scene.add(leds);
  const fwBandMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
  const fwBand = new THREE.Mesh(new THREE.BoxGeometry(RW - 0.08, 0.004, 0.004), fwBandMat); fwBand.position.set(RX, FW_Y + FW_H + 0.003, FW_FRONT + 0.004); scene.add(fwBand);
  const cableMat = new THREE.MeshStandardMaterial({ color: 0x9aa3b0, roughness: 0.55, metalness: 0.1 });
  const cableHot = new THREE.MeshStandardMaterial({ color: 0xd8692c, roughness: 0.5, metalness: 0.1 });
  for (let i = 0; i < 7; i++) {
    const x0 = RX - 0.12 + i * 0.045, y0 = 0.72, z0 = FW_FRONT + 0.01, side = i < 4 ? -1 : 1;
    const pts = [V(x0, y0, z0), V(x0, y0 - 0.06, z0 + 0.06), V(RX + side * (RW / 2 + 0.03), 0.55 - i * 0.03, z0 + 0.03), V(RX + side * (RW / 2 + 0.08), 0.12, RZ + 0.1 - i * 0.03), V(RX + side * (RW / 2 + 0.12 + i * 0.03), 0.01, RZ - 0.3)];
    const c = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.0045, 6, false), i === 2 ? cableHot : cableMat); c.castShadow = true; scene.add(c);
  }
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.75, 3.2, 40, 1, true), shaftMaterial(THREE, 0xffd9b8));
  shaft.material.uniforms.uH.value = 3.2; shaft.material.uniforms.uI.value = 0.032; shaft.position.set(RX - 0.05, 1.55, RZ + 0.05); scene.add(shaft);

  /* ---------- engineering console ---------- */
  const con = new THREE.Group(); con.position.set(CX, CY, CZ); con.rotation.set(-CTILT, 0.42, 0, 'YXZ'); scene.add(con);
  const cCanvas = document.createElement('canvas'); cCanvas.width = 1600; cCanvas.height = 1024;
  const cg = cCanvas.getContext('2d');
  const cTex = new THREE.CanvasTexture(cCanvas); cTex.colorSpace = THREE.SRGBColorSpace; cTex.anisotropy = 8;
  drawConsole(cg, 1600, 1024, 0, 0); cTex.needsUpdate = true;
  const conMat = new THREE.MeshBasicMaterial({ map: cTex, transparent: true, toneMapped: false, color: 0xd6dbe3 });
  const conFace = new THREE.Mesh(new THREE.PlaneGeometry(CW, CH), conMat); conFace.position.z = 0.012; con.add(conFace);
  const conBody = new THREE.Mesh(slab(THREE, CW + 0.04, CH + 0.04, 0.02, 0.004), new THREE.MeshStandardMaterial({ color: 0x2a303b, metalness: 0.7, roughness: 0.35, roughnessMap: brushed }));
  conBody.position.y = -(CH + 0.04) / 2; conBody.castShadow = true; con.add(conBody);
  const conEdgeMat = new THREE.LineBasicMaterial({ color: 0x000000 });
  const conEdge = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(CW + 0.04, CH + 0.04)), conEdgeMat); conEdge.position.z = 0.014; con.add(conEdge);
  const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, CY, 16), postMat); stand.position.set(CX, CY / 2, CZ - 0.08); stand.castShadow = true; scene.add(stand);
  const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.02, 48), postMat); foot.position.set(CX, 0.01, CZ - 0.08); foot.receiveShadow = true; scene.add(foot);
  const blade = new THREE.Mesh(new THREE.PlaneGeometry(0.08, CW), new THREE.MeshBasicMaterial({ map: texGlowBlade(THREE), color: 0x000000, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  blade.rotation.z = Math.PI / 2; blade.position.z = 0.03; con.add(blade);
  con.updateMatrixWorld(true);
  const CL = (lx, ly, lz = 0.02) => con.localToWorld(V(lx, ly, lz));

  /* ---------- paths ---------- */
  const tube = (pts, mat, rad = 0.008) => { const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 120, rad, 6, false), mat); scene.add(m); return m; };
  const mk = (pts, color, seed, len, speed = 1.0, rad) => { const m = pulseMaterial(THREE, color, seed, len); m.uniforms.uSpeed.value = speed; const mesh = tube(pts, m, rad); return { m, mesh }; };
  const request = mk([V(PAD[0], 0.1, PAD[1]), V(-1.35, 0.55, 1.05), V(-0.85, 0.62, 0.55), V(-0.5, 0.42, 0.03)], ICE, 0.0, 2.2, 0.9);
  const reqBack = mk([V(-0.5, 0.42, -0.03), V(-0.55, 0.62, -0.4), CL(-0.2, CH / 2 - 0.05)], ICE, 0.3, 1.6, 0.9);
  const fwIn = V(RX - 0.1, FW_Y + FW_H * 0.6, FW_FRONT + 0.006);
  const config = mk([CL(CW / 2 - 0.05, -0.05), V(-0.05, 0.95, -0.95), V(RX - 0.18, FW_Y + 0.35, FW_FRONT + 0.25), fwIn], ORANGE, 0.0, 1.9, 1.1);
  const staffSrc = V(-1.55, 0.06, -2.25), guestSrc = V(-1.95, 0.06, -1.55), exitP = V(1.5, 1.35, -3.4);
  const allow = mk([staffSrc, V(-0.9, 0.42, -2.0), V(RX - 0.32, FW_Y + 0.1, FW_FRONT + 0.32), V(RX, FW_Y + 0.08, FW_FRONT + 0.006), V(RX + 0.3, FW_Y + 0.12, FW_FRONT + 0.2), V(1.05, 0.8, -1.9), exitP], ICE, 0.1, 5.2, 1.6, 0.009);
  const deny = mk([guestSrc, V(-1.2, 0.5, -1.3), V(RX - 0.42, FW_Y + 0.22, FW_FRONT + 0.36), V(RX - 0.2, FW_Y + 0.08, FW_FRONT + 0.006)], ORANGE, 0.2, 2.5, 1.2, 0.009);
  deny.m.uniforms.uStop.value = 0.95;
  const srcNodes = [staffSrc, guestSrc].map((p) => { const m = new THREE.Mesh(new THREE.OctahedronGeometry(0.04, 0), new THREE.MeshBasicMaterial({ color: 0x000000 })); m.position.copy(p).add(V(0, 0.05, 0)); scene.add(m); return m; });
  const ringMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uP: { value: 0 }, uI: { value: 0 } },
    vertexShader: 'varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform float uP; uniform float uI; varying vec2 vP;
      void main(){ float a = atan(vP.x, vP.y) / 6.28318 + 0.5; float on = step(a, uP);
        vec3 c = mix(vec3(0.16, 0.18, 0.22), vec3(0.35, 0.95, 0.65) * 1.8, on); gl_FragColor = vec4(c * uI, 1.0); }`
  });
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.66, 0.685, 128, 1), ringMat); ring.rotation.x = -Math.PI / 2; ring.position.set(RX, 0.006, RZ); scene.add(ring);

  /* ---------- the request ticket and the handover pack ---------- */
  const tkTex = texTicket(THREE);
  const tkMat = new THREE.MeshStandardMaterial({ map: tkTex, emissiveMap: tkTex, emissive: new THREE.Color(0xffffff), emissiveIntensity: 0.1, color: 0xa3aab5, roughness: 0.45, transparent: true, opacity: 0, side: THREE.DoubleSide });
  const ticket = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 0.285), tkMat); ticket.castShadow = true; scene.add(ticket);
  const docs = DOCS.map((d, i) => {
    const tx = texDoc(THREE, d);
    const mat = new THREE.MeshStandardMaterial({ map: tx, emissiveMap: tx, emissive: new THREE.Color(0xffffff), emissiveIntensity: 0.1, color: 0xa9b0bb, roughness: 0.45, transparent: true, opacity: 0, side: THREE.DoubleSide });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.312), mat); m.castShadow = true; scene.add(m);
    const p0 = CL(-0.25 + i * 0.25, -0.05, 0.05), p1 = V(-0.35 + i * 0.32, 1.75 + i * 0.05, -0.15), p2 = V(0.36 + i * 0.27, 0.43 + i * 0.006, 0.8 + (i % 2) * 0.04);
    const path = new THREE.CatmullRomCurve3([p0, V(p0.x, 1.25, p0.z + 0.1), p1, V(p2.x - 0.05, 1.05, 0.7), p2]);
    const trail = trailMaterial(THREE, ICE);
    const tm = new THREE.Mesh(new THREE.TubeGeometry(path, 160, 0.005, 6, false), trail); scene.add(tm);
    return { m, mat, path, trail, tm, at: DOC_AT[i], qEnd: new THREE.Quaternion().setFromEuler(new THREE.Euler(-1.2, 0, (i - 1) * 0.14)) };
  });
  const trayMat = new THREE.MeshStandardMaterial({ color: 0x2f3540, metalness: 0.75, roughness: 0.3, roughnessMap: brushed });
  const tray = new THREE.Mesh(slab(THREE, 1.1, 0.4, 0.42, 0.008), trayMat); tray.position.set(0.66, 0, 0.82); tray.castShadow = tray.receiveShadow = true; scene.add(tray);
  const trayEdgeMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
  const trayEdge = new THREE.Mesh(new THREE.BoxGeometry(1.08, 0.004, 0.004), trayEdgeMat); trayEdge.position.set(0.66, 0.398, 1.032); scene.add(trayEdge);

  /* ---------- atmosphere ---------- */
  const dp = [], dc = [], ds = [], dr = rand(91);
  for (let i = 0; i < 240; i++) { dp.push((dr() - 0.5) * 18, 0.2 + dr() * 4, -4 - dr() * 12); dc.push(0.7, 0.72, 0.85); ds.push(dr()); }
  for (let i = 0; i < 90; i++) { dp.push(RX + (dr() - 0.5) * 1.3, 0.2 + dr() * 2.2, RZ + (dr() - 0.5) * 1.2); dc.push(1.0, 0.8, 0.6); ds.push(dr() * 0.5); } // dust in the light shaft
  const dGeo = new THREE.BufferGeometry(); dGeo.setAttribute('position', new THREE.Float32BufferAttribute(dp, 3)); dGeo.setAttribute('aColor', new THREE.Float32BufferAttribute(dc, 3)); dGeo.setAttribute('aSeed', new THREE.Float32BufferAttribute(ds, 1));
  const dMat = pointsMaterial(THREE); dMat.uniforms.uFog.value = 0.05; scene.add(new THREE.Points(dGeo, dMat));

  const size = new THREE.Vector2(), tmp = new THREE.Vector3(), qWob = new THREE.Quaternion(), eTmp = new THREE.Euler();
  const cGreen = new THREE.Color(MINT).multiplyScalar(1.4), cOr = new THREE.Color(ORANGE).multiplyScalar(1.6), cOff = new THREE.Color(0x111111), cTmp = new THREE.Color();
  const qCon = con.quaternion.clone(), qTicketF = new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.08, 0.28, 0));
  const tkBehind = V(-0.55, 0.66, -0.3), tkAtCon = CL(-0.05, 0.02, 0.06);
  let lastKey = '';
  const typed = (t) => Math.round(TOTAL * clamp01((t - TYPE0) / (TYPE1 - TYPE0)));
  const testsDone = (t) => TEST_AT.filter((a) => t >= a).length;

  return {
    duration: L,
    floor: { tile: 0.7, base: 0x0c0d11, reflect: 0.85 },
    chapters: [{ start: 0, label: 'Request' }, { start: 5.5, label: 'Engineer' }, { start: 11, label: 'Test' }, { start: 16.5, label: 'Hand over' }],
    labels: [
      { text: 'Your customer', at: (t, v) => v.set(PAD[0], 0.42, PAD[1]), alpha: (t) => smooth(0.6, 1.2, t) * (1 - smooth(5.0, 5.4, t)) },
      { text: 'They only ever deal with your MSP', tone: 'accent', at: (t, v) => v.set(-0.45, WH + 0.2, 0), alpha: (t) => smooth(2.5, 3.0, t) * (1 - smooth(5.0, 5.4, t)) },
      { text: 'Behind your brand · VALO engineering', tone: 'accent', at: (t, v) => v.set(-0.7, 1.02, -1.0), alpha: (t) => smooth(6.0, 6.6, t) * (1 - smooth(10.6, 11.0, t)) },
      { text: 'Committed on the customer’s firewall', tone: 'ok', at: (t, v) => v.set(RX, RH + 0.18, RZ), alpha: (t) => smooth(9.9, 10.3, t) * (1 - smooth(10.7, 11.0, t)) },
      { text: 'Staff traffic · allowed as expected', tone: 'ok', at: (t, v) => v.set(1.1, 0.95, -1.95), alpha: (t) => smooth(12.9, 13.3, t) * (1 - smooth(16.0, 16.4, t)) },
      { text: 'Guest traffic · blocked as expected', tone: 'stop', at: (t, v) => v.set(-1.25, 0.72, -1.4), alpha: (t) => smooth(13.7, 14.1, t) * (1 - smooth(16.0, 16.4, t)) },
      { text: 'Rollback ready', tone: 'ok', at: (t, v) => v.set(RX + 0.55, 0.3, RZ + 0.3), alpha: (t) => smooth(15.4, 15.8, t) * (1 - smooth(16.0, 16.4, t)) },
      { text: 'Handed over under your name', tone: 'accent', at: (t, v) => v.set(0.66, 0.95, 0.85), alpha: (t) => smooth(19.3, 19.8, t) * (1 - smooth(21.3, 21.7, t)) }
    ],
    fade: (t) => shotFade(SHOTS, t),
    update(t) {
      // wall: status chip and light strips follow the job
      const state = t < 5.0 ? 'scope' : t < 19.4 ? 'work' : 'done';
      chipMat.map = chipMat.emissiveMap = statusTex[state];
      stripMatF.color.set(ICE).multiplyScalar(0.5 + 0.6 * smooth(2.2, 2.6, t) * (1 - smooth(4.2, 5.0, t)) + 0.6 * smooth(19.4, 19.9, t));
      stripMatB.color.set(ORANGE).multiplyScalar(0.25 + 0.9 * smooth(5.6, 6.4, t) * (1 - smooth(16.6, 18, t)));
      padRingMat.color.set(ICE).multiplyScalar(0.5 + 0.4 * Math.sin(t * 2.0) ** 2);

      // the request travels from the customer to the wall, becomes a ticket and passes through to VALO
      request.m.uniforms.uTime.value = t; request.m.uniforms.uActive.value = smooth(0.5, 0.9, t) * (1 - smooth(4.6, 5.3, t)) + 0.55 * smooth(19.4, 20.0, t);
      reqBack.m.uniforms.uTime.value = t; reqBack.m.uniforms.uActive.value = smooth(5.6, 6.0, t) * (1 - smooth(7.0, 7.6, t));
      if (t < 5.3) {
        const tIn = smooth(2.2, 2.8, t), tThrough = smooth(4.3, 5.2, t);
        ticket.position.set(-0.95 + 0.4 * smooth(3.6, 4.6, t), 0.62 - (1 - tIn) * 0.12, 0.65 - 0.61 * tThrough);
        ticket.quaternion.copy(qTicketF);
        tkMat.opacity = tIn * (1 - smooth(4.9, 5.2, t));
      } else {
        const tBack = smooth(5.6, 6.6, t);
        ticket.position.copy(tkBehind).lerp(tkAtCon, tBack);
        ticket.quaternion.copy(qTicketF).slerp(qCon, tBack);
        tkMat.opacity = smooth(5.5, 5.8, t) * (1 - smooth(6.3, 6.7, t));
      }
      ticket.visible = tkMat.opacity > 0.01;

      // console types the change, then checks the tests off
      const key = typed(t) + ':' + testsDone(t);
      if (key !== lastKey) { lastKey = key; drawConsole(cg, 1600, 1024, typed(t), testsDone(t)); cTex.needsUpdate = true; }
      const conOn = smooth(5.6, 6.4, t) * (1 - 0.5 * smooth(18.6, 20.2, t));
      conMat.color.setRGB(0.86, 0.88, 0.9).multiplyScalar(0.3 + 0.7 * conOn);
      conEdgeMat.color.set(0xc9d6ea).multiplyScalar(0.25 + 0.6 * conOn);
      const vb = (t - 12.4) / 3.2;
      blade.position.y = CH / 2 - clamp01(vb) * CH;
      blade.material.color.set(MINT).multiplyScalar(vb > 0 && vb < 1 ? 0.55 * Math.sin(vb * Math.PI) ** 0.4 : 0);

      // config path into the firewall; LEDs go amber while changing, green once committed
      config.m.uniforms.uTime.value = t; config.m.uniforms.uActive.value = smooth(6.6, 7.1, t) * (1 - smooth(9.9, 10.5, t));
      const changing = smooth(6.8, 7.2, t) * (1 - smooth(9.75, 9.9, t));
      const commit = t > 9.8 ? Math.exp(-(t - 9.8) * 2.5) : 0;
      for (let i = 0; i < 6; i++) {
        const blink = 0.5 + 0.5 * Math.sin(t * (6 + i * 1.7) + i);
        cTmp.copy(cGreen).multiplyScalar(0.6 + 0.4 * blink).lerp(cOr, changing);
        if (i === 5) cTmp.copy(cOff).lerp(cOr, changing);
        leds.setColorAt(i, cTmp);
      }
      leds.instanceColor.needsUpdate = true;
      fwBandMat.color.copy(cOr).multiplyScalar(0.15 + 0.6 * changing).lerp(cGreen, clamp01(commit * 0.9 + 0.4 * smooth(10, 11, t) * (1 - smooth(18, 20, t))));
      fwGlow.intensity = 1.4 * changing + 2.5 * commit;

      // tests
      const tOn = smooth(12.0, 12.4, t) * (1 - smooth(16.2, 16.8, t));
      allow.m.uniforms.uTime.value = t - 12.0; allow.m.uniforms.uActive.value = tOn; allow.mesh.visible = tOn > 0.01;
      const dOn = smooth(12.7, 13.1, t) * (1 - smooth(16.2, 16.8, t));
      deny.m.uniforms.uTime.value = t - 12.7; deny.m.uniforms.uActive.value = dOn; deny.mesh.visible = dOn > 0.01;
      const hit = smooth(13.55, 13.7, t) * dOn;
      deny.m.uniforms.uFlash.value = hit * (0.6 + 0.4 * Math.sin(t * 7));
      fwGlow.intensity += 2.2 * hit * Math.exp(-Math.max(0, t - 13.7) * 1.2);
      srcNodes[0].material.color.set(ICE).multiplyScalar(1.6 * tOn); srcNodes[1].material.color.set(ORANGE).multiplyScalar(1.6 * dOn);
      srcNodes.forEach((n, i) => { n.rotation.y = t * (0.8 + i * 0.3); n.visible = (i ? dOn : tOn) > 0.01; });
      ringMat.uniforms.uP.value = clamp01((t - 14.2) / 1.2);
      ringMat.uniforms.uI.value = smooth(14.0, 14.3, t) * (1 - smooth(16.2, 16.8, t));

      // handover: the pack lifts off the console, arcs over the wall and lands on the MSP's side
      docs.forEach((d) => {
        const u = smooth(d.at, d.at + DOC_DUR, t);
        d.mat.opacity = smooth(d.at - 0.25, d.at + 0.1, t) * (1 - smooth(21.4, 21.9, t));
        d.m.visible = d.mat.opacity > 0.01;
        d.path.getPointAt(Math.min(u, 0.9999), d.m.position);
        const mid = Math.sin(u * Math.PI);
        d.m.quaternion.copy(qCon).slerp(d.qEnd, smooth(0.15, 0.95, u));
        d.m.quaternion.multiply(qWob.setFromEuler(eTmp.set(0, mid * 0.5, mid * 0.25)));
        d.trail.uniforms.uHead.value = u;
        d.trail.uniforms.uI.value = smooth(d.at, d.at + 0.2, t) * (1 - smooth(d.at + DOC_DUR - 0.2, d.at + DOC_DUR + 0.6, t));
        d.tm.visible = d.trail.uniforms.uI.value > 0.01;
      });
      const tr = smooth(16.6, 17.8, t); tray.scale.y = Math.max(0.001, tr); tray.visible = trayEdge.visible = tr > 0.002; trayEdge.position.y = 0.398 * tr;
      trayEdgeMat.color.set(ICE).multiplyScalar(0.25 + 1.1 * smooth(18.6, 19.4, t));

      shaft.material.uniforms.uI.value = 0.032 * smooth(5.35, 5.65, t) * (1 - smooth(16.35, 16.65, t)) * (1 - 0.75 * smooth(10.9, 11.1, t));
      renderer.getDrawingBufferSize(size);
      dMat.uniforms.uTime.value = t; dMat.uniforms.uScale.value = size.y * 0.012;
    },
    camera(t, out) {
      shotCamera(SHOTS, [
        // request: low on the customer's side; the brand wall is all they see
        [[-2.3, 1.05, 4.5], [-1.65, 1.1, 4.2], [-0.5, 0.5, 0.25], [-0.35, 0.52, 0.25], 34, 0.0],
        // engineer: round the end of the wall into VALO's bay
        [[3.0, 1.55, 0.6], [2.45, 1.45, -0.1], [-0.05, 0.82, -0.95], [-0.15, 0.8, -1.05], 34, 0.0],
        // test: low behind the wall, across the console to the firewall
        [[2.45, 1.05, 0.15], [2.0, 0.98, -0.1], [-0.35, 0.78, -1.45], [-0.25, 0.76, -1.5], 36, 0.0],
        // hand over: the pack crosses the wall; pull back to the MSP's side
        [[2.4, 2.0, 3.9], [0.1, 1.25, 3.6], [0.1, 1.3, -0.3], [0.45, 0.62, 0.45], 34, 0.0]
      ], t, out);
    }
  };
}
