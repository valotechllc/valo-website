/* Film D, white-label MSP engineering (v5: the ticket rail).
   Desktop-first: the whole story plays in one wide strip above the hero headline.
   A ticket rail runs across an MSP's office like a kitchen pass. Client tickets come in at the window;
   routine tickets drop to the generalists at their cubicles; Cisco and Palo Alto tickets pile up at the
   end of the rail as a specialist backlog with an SLA warning -> a separate VALO Engineering pod pulls
   them in and works them -> they come back navy and checked, the backlog counter falls to zero ->
   the finished tickets slide back along the rail and out to the MSP's clients, in the MSP's name.
   Stylised, no vendor hardware. All values are functions of scene time t. */
import { smooth, clamp01 } from './stage.js';
import { canvasTex, rand, shotCamera, shotFade } from './lib.js';

const L = 22;
const SHOTS = [0, 5.5, 11, 16.5, L];
const NAVY = 0x24467f, ORANGE = 0xc2410c;
const WALL_Z = -0.95;
const RAIL = { y: 1.02, z: -0.22, x0: -2.55, x1: 2.75 };
const DESKS = [-1.55, -0.8, -0.05, 0.7];       // the MSP's generalist cubicles
const POD = { x: 2.15, w: 0.95 };               // VALO Engineering, standing apart
const PILE_X = 1.28;
const WIN = { x0: -2.95, x1: -2.15, y0: 0.62, y1: 1.5 };
const ROUTINE = ['Password reset', 'New laptop', 'Printer offline', 'M365 licence', 'Shared drive', 'New starter', 'Phone setup', 'Wi-Fi guest'];
const SPEC = ['PAN-OS upgrade', 'Switch migration', 'VPN redesign', 'ISE policy', 'Rule cleanup', 'BGP failover'];

const crisp = (THREE, map, o = {}) => new THREE.MeshBasicMaterial({ map, transparent: true, toneMapped: false, depthWrite: false, side: THREE.DoubleSide, ...o });

function texTicket(THREE, title, kind) {
  const cfg = {
    routine: { bg: '#f4f7fc', bar: '#24467f', fg: '#13203a', tag: 'ROUTINE' },
    spec: { bg: '#fff3ea', bar: '#c2410c', fg: '#3a1606', tag: 'CISCO / PALO ALTO' },
    done: { bg: '#24467f', bar: '#7fd39a', fg: '#ffffff', tag: 'DONE · YOUR MSP' }
  }[kind];
  return canvasTex(THREE, 256, 330, (g, w, h) => {
    g.fillStyle = cfg.bg; g.fillRect(0, 0, w, h);
    g.fillStyle = cfg.bar; g.fillRect(0, 0, w, 22);
    g.fillStyle = 'rgba(0,0,0,0.25)'; g.beginPath(); g.arc(w / 2, 11, 6, 0, Math.PI * 2); g.fill();
    g.fillStyle = cfg.fg; g.font = '700 30px Inter, sans-serif';
    const words = title.split(' '); let line = '', y = 82;
    words.forEach((wd) => { const tst = line ? line + ' ' + wd : wd; if (g.measureText(tst).width > w - 34) { g.fillText(line, 18, y); y += 36; line = wd; } else line = tst; });
    g.fillText(line, 18, y);
    g.font = '600 17px "JetBrains Mono", monospace'; g.fillStyle = kind === 'done' ? '#cfe0ff' : cfg.bar; g.fillText(cfg.tag, 18, h - 70);
    if (kind === 'spec') { g.fillStyle = '#e5d3c4'; g.fillRect(18, h - 44, w - 36, 12); g.fillStyle = '#c81e1e'; g.fillRect(18, h - 44, (w - 36) * 0.22, 12); g.font = '600 15px "JetBrains Mono", monospace'; g.fillStyle = '#c81e1e'; g.fillText('SLA', w - 54, h - 52); }
    if (kind === 'done') { g.strokeStyle = '#7fd39a'; g.lineWidth = 9; g.beginPath(); g.moveTo(26, h - 36); g.lineTo(42, h - 20); g.lineTo(76, h - 54); g.stroke(); }
  });
}
function texCounter(THREE, n) {
  return canvasTex(THREE, 512, 150, (g, w, h) => {
    const hot = n >= 3, clear = n === 0;
    g.fillStyle = clear ? '#173a2a' : hot ? '#3a0f08' : '#14213a'; g.fillRect(0, 0, w, h);
    g.strokeStyle = clear ? '#7fd39a' : hot ? '#ff5a3c' : '#3b5688'; g.lineWidth = 6; g.strokeRect(3, 3, w - 6, h - 6);
    g.font = '700 30px "JetBrains Mono", monospace'; g.fillStyle = clear ? '#7fd39a' : '#ff9a6a'; g.fillText('SPECIALIST BACKLOG', 24, 50);
    g.font = '700 64px Inter, sans-serif'; g.fillStyle = '#ffffff'; g.fillText(String(n), 24, 122);
    g.font = '600 26px "JetBrains Mono", monospace'; g.fillStyle = clear ? '#7fd39a' : hot ? '#ff5a3c' : '#cfd8e8';
    g.fillText(clear ? 'ALL CLEAR' : hot ? 'SLA AT RISK' : 'WAITING', 110, 112);
  });
}
function texSign(THREE, text, bg, fg) {
  return canvasTex(THREE, 640, 110, (g, w, h) => { g.fillStyle = bg; g.fillRect(0, 0, w, h); g.font = '700 46px "JetBrains Mono", monospace'; g.fillStyle = fg; g.textBaseline = 'middle'; const tw = g.measureText(text).width; g.fillText(text, (w - tw) / 2, h / 2 + 2); });
}
function texBadge(THREE, fill, ring) {
  return canvasTex(THREE, 256, 256, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.fillStyle = 'rgba(0,0,0,0.18)'; g.beginPath(); g.arc(w / 2, h / 2 + 6, 104, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#ffffff'; g.beginPath(); g.arc(w / 2, h / 2, 104, 0, Math.PI * 2); g.fill();
    g.fillStyle = fill; g.beginPath(); g.arc(w / 2, h / 2, 92, 0, Math.PI * 2); g.fill();
    g.save(); g.beginPath(); g.arc(w / 2, h / 2, 92, 0, Math.PI * 2); g.clip();
    g.fillStyle = 'rgba(255,255,255,0.92)';
    g.beginPath(); g.arc(w / 2, h / 2 - 22, 32, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.ellipse(w / 2, h / 2 + 70, 62, 52, 0, Math.PI, 0); g.fill();
    g.restore();
    g.fillStyle = '#ffffff'; g.beginPath(); g.arc(w / 2 + 70, h / 2 + 66, 28, 0, Math.PI * 2); g.fill();
    g.fillStyle = ring; g.beginPath(); g.arc(w / 2 + 70, h / 2 + 66, 20, 0, Math.PI * 2); g.fill();
  });
}
function texScreen(THREE, line, bg) {
  const r = rand(3);
  return canvasTex(THREE, 256, 256, (g, w, h) => { g.fillStyle = bg; g.fillRect(0, 0, w, h); for (let y = 14; y < h; y += 20) { g.fillStyle = line; g.globalAlpha = 0.45 + r() * 0.55; g.fillRect(14, y, 40 + r() * 170, 8); } g.globalAlpha = 1; }, { repeat: [1, 1] });
}

export function mspScene(ctx) {
  const { THREE, scene } = ctx;
  scene.fog.density = 0.012;
  scene.background.setHex(0xe9dfcf); scene.fog.color.setHex(0xe9dfcf); // per-scene tint: warm office
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.7, metalness: 0.05, ...o });
  const box = (w, h, d, m, x, y, z, parent = scene) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); parent.add(b); return b; };

  scene.add(new THREE.HemisphereLight(0xfff7ea, 0x8d7a60, 0.75));
  const sun = new THREE.DirectionalLight(0xfff0d8, 1.1); sun.position.set(-3, 4, 4); scene.add(sun);
  const podLamp = new THREE.PointLight(0xff7a33, 0, 1.6, 2); podLamp.position.set(POD.x, 0.8, -0.25); scene.add(podLamp);

  // ---------- room ----------
  box(11, 0.01, 3.2, mat(0x9b6b47, { roughness: 0.55 }), 0, 0.005, 0.45);              // oak floor
  const wallM = mat(0xf3ece0);
  const WALL_H = 1.85;
  box(WIN.x0 + 5.5, WALL_H + 1, 0.05, wallM, (-5.5 + WIN.x0) / 2, (WALL_H + 1) / 2, WALL_Z);
  box(5.5 - WIN.x1, WALL_H + 1, 0.05, wallM, (WIN.x1 + 5.5) / 2, (WALL_H + 1) / 2, WALL_Z);
  box(WIN.x1 - WIN.x0, WIN.y0, 0.05, wallM, (WIN.x0 + WIN.x1) / 2, WIN.y0 / 2, WALL_Z);
  box(WIN.x1 - WIN.x0, WALL_H + 1 - WIN.y1, 0.05, wallM, (WIN.x0 + WIN.x1) / 2, (WIN.y1 + WALL_H + 1) / 2, WALL_Z);
  const frameM = mat(NAVY, { roughness: 0.5 });
  [[WIN.x0, WIN.y1 - WIN.y0, 0.03], [WIN.x1, WIN.y1 - WIN.y0, 0.03], [(WIN.x0 + WIN.x1) / 2, WIN.y1 - WIN.y0, 0.018]].forEach(([x, h, w]) => box(w, h, 0.06, frameM, x, (WIN.y0 + WIN.y1) / 2, WALL_Z));
  [WIN.y0, WIN.y1, (WIN.y0 + WIN.y1) / 2].forEach((y) => box(WIN.x1 - WIN.x0, 0.018, 0.06, frameM, (WIN.x0 + WIN.x1) / 2, y, WALL_Z));
  // the MSP's clients outside the window (sky and buildings)
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(3, 2.2), new THREE.MeshBasicMaterial({ color: 0xbcd3ea, toneMapped: false })); sky.position.set(-2.55, 1.0, -2.6); scene.add(sky);
  const buildings = [[-2.85, 0.95, -2.2], [-2.62, 1.25, -2.4], [-2.4, 1.05, -2.15], [-2.22, 1.32, -2.45]].map(([x, h, z], i) => {
    box(0.17, h, 0.17, mat(i % 2 ? 0x7f95b5 : 0x93a7c4), x, h / 2, z);
    const bm = new THREE.MeshBasicMaterial({ color: 0x7fd39a, transparent: true, opacity: 0, toneMapped: false, depthWrite: false });
    const beacon = new THREE.Mesh(new THREE.CircleGeometry(0.05, 24), bm); beacon.position.set(x, h + 0.08, z + 0.09); scene.add(beacon);
    return { beacon, bm, top: V(x, h, z) };
  });
  // wall signs
  const mspSign = new THREE.Mesh(new THREE.PlaneGeometry(1.45, 0.25), crisp(THREE, texSign(THREE, 'MSP SERVICE DESK', '#24467f', '#ffffff'), { transparent: false }));
  mspSign.position.set(-0.42, 1.36, WALL_Z + 0.03); scene.add(mspSign);

  // ---------- the rail ----------
  const railM = mat(0x2b2f36, { metalness: 0.6, roughness: 0.35 });
  const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, RAIL.x1 - RAIL.x0, 12), railM); rail.rotation.z = Math.PI / 2; rail.position.set((RAIL.x0 + RAIL.x1) / 2, RAIL.y, RAIL.z); scene.add(rail);
  for (let x = RAIL.x0 + 0.3; x < RAIL.x1; x += 1.2) box(0.012, 1.85 - RAIL.y, 0.012, railM, x, (RAIL.y + 1.85) / 2, RAIL.z);
  const counters = Array.from({ length: SPEC.length + 1 }, (_, n) => texCounter(THREE, n));
  const counterMat = crisp(THREE, counters[0], { transparent: false });
  const counter = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.18), counterMat); counter.position.set(PILE_X, RAIL.y + 0.2, RAIL.z - 0.01); scene.add(counter);

  // ---------- MSP cubicles ----------
  const partM = mat(0x2c3e63, { roughness: 0.9 }), deskM = mat(0xdcc29d, { roughness: 0.5 }), monM = mat(0x1a2236, { roughness: 0.4 });
  const legM = mat(0x2b2f36, { metalness: 0.6, roughness: 0.35 });
  const badgeN = texBadge(THREE, '#24467f', '#2bb673'), badgeV = texBadge(THREE, '#c2410c', '#2bb673');
  const scrN = texScreen(THREE, '#9cc0ff', '#13203a'), scrS = texScreen(THREE, '#ffb48a', '#2a1408');
  const mkDesk = (x, pM, scrTex, parentSide, badgeTex, chairM) => {
    const g = new THREE.Group(); g.position.set(x, 0, -0.35); scene.add(g);
    box(0.025, 0.5, 0.5, pM, -0.36, 0.25, 0.02, g); if (parentSide) box(0.025, 0.5, 0.5, pM, 0.36, 0.25, 0.02, g);
    box(0.74, 0.5, 0.025, pM, 0, 0.25, -0.23, g);
    box(0.6, 0.025, 0.3, deskM, 0, 0.36, -0.07, g);
    box(0.28, 0.17, 0.02, monM, 0, 0.5, -0.18, g);
    const scrM = new THREE.MeshBasicMaterial({ map: scrTex, toneMapped: false });
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.25, 0.14), scrM); scr.position.set(0, 0.5, -0.169); g.add(scr);
    const chair = new THREE.Group(); chair.position.set(0, 0, 0.12); g.add(chair);
    box(0.2, 0.025, 0.19, chairM, 0, 0.24, 0, chair);
    box(0.2, 0.22, 0.025, chairM, 0, 0.38, 0.09, chair);
    box(0.02, 0.22, 0.02, legM, 0, 0.12, 0, chair);
    box(0.2, 0.012, 0.02, legM, 0, 0.012, 0, chair); box(0.02, 0.012, 0.2, legM, 0, 0.012, 0, chair);
    const badge = new THREE.Sprite(new THREE.SpriteMaterial({ map: badgeTex, toneMapped: false, transparent: true, depthWrite: false }));
    badge.scale.setScalar(0.17); badge.position.set(0, 0.74, 0.0); g.add(badge);
    return { g, scrM, chair, badge, top: V(x, 0.42, -0.42) };
  };
  const desks = DESKS.map((x, i) => mkDesk(x, partM, scrN, i === DESKS.length - 1, badgeN, mat(0x1d2b45, { roughness: 0.6 })));

  // ---------- VALO Engineering pod, standing apart ----------
  const podG = new THREE.Group(); podG.position.set(POD.x, 0, -0.35); scene.add(podG);
  box(POD.w + 0.2, 0.008, 0.85, mat(0x5a2208, { roughness: 0.9 }), 0, 0.012, 0.12, podG);
  const glassM = new THREE.MeshStandardMaterial({ color: 0xffd9c2, transparent: true, opacity: 0.28, roughness: 0.1, metalness: 0.1, depthWrite: false });
  const podFrameM = mat(ORANGE, { roughness: 0.45 });
  [-1, 1].forEach((sx) => { box(0.012, 0.62, 0.6, glassM, sx * POD.w / 2, 0.31, 0.02, podG); box(0.02, 0.62, 0.02, podFrameM, sx * POD.w / 2, 0.31, 0.31, podG); });
  box(POD.w, 0.62, 0.02, mat(0xb4400f, { roughness: 0.8 }), 0, 0.31, -0.25, podG);
  box(POD.w, 0.02, 0.6, podFrameM, 0, 0.62, 0.02, podG);
  const podSign = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.155), crisp(THREE, texSign(THREE, 'VALO ENGINEERING', '#c2410c', '#ffffff'), { transparent: false }));
  podSign.position.set(0, 0.69, -0.2); podG.add(podSign);
  const pod = mkDesk(0, podFrameM, scrS, false, badgeV, mat(0x3a1a0a, { roughness: 0.6 })); podG.add(pod.g); pod.g.position.set(0, 0, 0); pod.g.children.slice(0, 2).forEach((m) => { m.visible = false; });
  pod.top = V(POD.x, 0.42, -0.42);

  // ---------- tickets ----------
  const tGeo = new THREE.PlaneGeometry(0.19, 0.245);
  const mkT = (tex) => { const m = new THREE.Mesh(tGeo, crisp(THREE, tex, { opacity: 0 })); scene.add(m); return m; };
  const hang = (x) => V(x, RAIL.y - 0.13, RAIL.z + 0.02);
  const inX = WIN.x1 + 0.12;
  const routine = ROUTINE.map((title, i) => ({ m: mkT(texTicket(THREE, title, 'routine')), d: i % DESKS.length, phase: i * 0.7, period: 5.6 }));
  const spec = SPEC.map((title, k) => ({
    k, m: mkT(texTicket(THREE, title, 'spec')), tDone: texTicket(THREE, title, 'done'),
    arrive: 0.4 + k * 0.72, pile: V(PILE_X - 0.24 + k * 0.095, RAIL.y - 0.13, RAIL.z + 0.02 + k * 0.004),
    pull: 6.0 + k * 0.42, worked: 11.2 + k * 0.5, line: V(PILE_X - 0.62 + k * 0.205, RAIL.y - 0.13, RAIL.z + 0.03 + k * 0.003),
    out: 16.9 + k * 0.38, bld: k % 4
  }));
  spec.forEach((s) => { s.tOpen = s.m.material.map; });
  const lerp3 = (a, b, u) => V(a.x + (b.x - a.x) * u, a.y + (b.y - a.y) * u, a.z + (b.z - a.z) * u);
  const slide = (a, b, u) => { const p = lerp3(a, b, u); p.y += Math.sin(u * Math.PI) * 0.015; return p; };

  return {
    duration: L,
    floor: { tile: 0.6, base: 0x7a5236, reflect: 0.2 },
    vignette: 0, bloom: 0.03, exposure: 0.8,
    chapters: [{ start: 0, label: 'Backlog' }, { start: 5.5, label: 'Specialist' }, { start: 11, label: 'Validate' }, { start: 16.5, label: 'Hand over' }],
    labels: [
      { text: 'Client tickets', at: (t, v) => v.set(WIN.x1 + 0.15, WIN.y1 + 0.08, WALL_Z + 0.1), alpha: (t) => smooth(0.4, 1.0, t) * (1 - smooth(5.0, 5.5, t)) },
      { text: 'Specialist · in your process', tone: 'accent', at: (t, v) => v.set(POD.x, 1.16, -0.3), alpha: (t) => smooth(6.2, 6.8, t) * (1 - smooth(10.6, 11.0, t)) },
      { text: 'Checked · in your colours', tone: 'ok', at: (t, v) => v.set(PILE_X + 0.05, RAIL.y + 0.36, RAIL.z), alpha: (t) => smooth(13.4, 13.9, t) * (1 - smooth(16.2, 16.6, t)) },
      { text: 'Delivered in your name', tone: 'ok', at: (t, v) => v.set((WIN.x0 + WIN.x1) / 2, WIN.y1 + 0.1, WALL_Z), alpha: (t) => smooth(18.2, 18.8, t) * (1 - smooth(21.2, 21.7, t)) }
    ],
    fade: (t) => shotFade(SHOTS, t),
    update(t) {
      scrN.offset.y = (t * 0.35) % 1; scrS.offset.y = (t * 0.5) % 1;
      desks.forEach((d, i) => { d.badge.position.y = 0.74 + Math.sin(t * 1.6 + i * 1.3) * 0.008; d.chair.rotation.y = Math.sin(t * 0.6 + i * 2) * 0.12; });
      const podOn = smooth(5.7, 6.5, t);
      pod.badge.visible = podOn > 0.01; pod.badge.scale.setScalar(0.17 * (0.5 + 0.5 * podOn) * (1 + 0.25 * Math.sin(clamp01((t - 5.7) / 0.8) * Math.PI)));
      pod.badge.position.y = 0.95 + Math.sin(t * 1.6) * 0.008;
      pod.scrM.color.setScalar(0.15 + 0.85 * podOn);
      podLamp.intensity = 1.2 * podOn;
      glassM.opacity = 0.2 + 0.15 * podOn;

      // routine tickets: window -> along the rail -> drop into a generalist's cubicle
      routine.forEach((r) => {
        const u = (((t + r.phase) % r.period) + r.period) % r.period;
        const m = r.m, dx = DESKS[r.d];
        let op = 0;
        if (u < 1.4) { m.position.copy(slide(hang(inX), hang(dx), smooth(0, 1.4, u))); op = smooth(0, 0.2, u); }
        else if (u < 2.0) { const v = smooth(1.4, 2.0, u); m.position.copy(lerp3(hang(dx), desks[r.d].top, v)); op = 1 - smooth(0.6, 1, v); }
        m.rotation.z = Math.sin(t * 2 + r.phase) * 0.04;
        m.material.opacity = op; m.visible = op > 0.01;
      });

      // specialist tickets
      let inPile = 0;
      spec.forEach((s) => {
        const m = s.m; let op = 1, map = s.tOpen;
        if (t < s.arrive) op = 0;
        else if (t < s.arrive + 1.8) { m.position.copy(slide(hang(inX), s.pile, smooth(s.arrive, s.arrive + 1.8, t))); op = smooth(s.arrive, s.arrive + 0.25, t); }
        else if (t < s.pull) { m.position.copy(s.pile); m.position.x += Math.sin(t * 9 + s.k) * 0.004 * smooth(2.5, 5, t); }
        else if (t < s.pull + 1.0) { const u = smooth(s.pull, s.pull + 1.0, t); const a = s.pile, mid = hang(POD.x); m.position.copy(u < 0.55 ? slide(a, mid, u / 0.55) : lerp3(mid, pod.top, (u - 0.55) / 0.45)); }
        else if (t < s.worked) { m.position.copy(pod.top); m.position.y += 0.004 * s.k; op = 0.0; }
        else if (t < s.worked + 0.9) { map = s.tDone; const u = smooth(s.worked, s.worked + 0.9, t); m.position.copy(lerp3(pod.top, s.line, u)); op = smooth(0, 0.25, u); }
        else if (t < s.out) { map = s.tDone; m.position.copy(s.line); }
        else if (t < s.out + 2.2) {
          map = s.tDone; const u = smooth(s.out, s.out + 2.2, t), b = buildings[s.bld];
          const atWin = hang((WIN.x0 + WIN.x1) / 2);
          m.position.copy(u < 0.75 ? slide(s.line, atWin, u / 0.75) : lerp3(atWin, b.top, (u - 0.75) / 0.25));
          op = 1 - smooth(0.85, 1, u);
        } else op = 0;
        if (t >= s.arrive + 1.8 && t < s.pull + 0.5) inPile++;
        if (m.material.map !== map) { m.material.map = map; m.material.needsUpdate = true; }
        m.rotation.z = (t < s.pull ? (s.k - 2.5) * 0.06 : 0) + Math.sin(t * 2 + s.k) * 0.03;
        m.material.opacity = op; m.visible = op > 0.01;
      });
      if (counterMat.map !== counters[inPile]) { counterMat.map = counters[inPile]; counterMat.needsUpdate = true; }
      counter.position.y = RAIL.y + 0.2 + (inPile >= 3 ? Math.sin(t * 10) * 0.004 : 0);

      buildings.forEach((b, i) => {
        let v = 0; spec.forEach((s) => { if (s.bld === i) { const a = t - (s.out + 2.1); if (a > 0 && a < 1.2) v = Math.max(v, 1 - a / 1.2); } });
        b.bm.opacity = v; b.beacon.scale.setScalar(1 + (1 - v) * 1.5);
      });
    },
    camera(t, out) {
      shotCamera(SHOTS, [
        // backlog: the whole office, window to VALO pod, as one wide strip
        [[0.0, 1.75, 6.2], [-0.2, 1.72, 6.0], [-0.1, 0.82, -0.3], [-0.1, 0.82, -0.3], 30, 0.0],
        // specialist: drift right toward the pile and the VALO pod
        [[0.9, 1.6, 4.9], [1.15, 1.6, 4.7], [0.95, 0.76, -0.3], [1.15, 0.76, -0.3], 30, 0.0],
        // validate: closer on the pod as checked tickets come back up
        [[1.8, 1.45, 3.4], [1.7, 1.48, 3.25], [1.6, 0.78, -0.3], [1.5, 0.8, -0.3], 30, 0.0],
        // hand over: pull back across the office to the window
        [[-0.2, 1.7, 5.4], [-0.6, 1.75, 5.8], [-1.0, 0.85, -0.3], [-0.9, 0.85, -0.3], 30, 0.0]
      ], t, out);
    }
  };
}
