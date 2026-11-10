/* Film A, firewall migration, as a real-time scene (v2: the rulebase moves).
   Story (22 s loop): review the current rulebase and flag unused and shadowed rules ->
   validated rules carry across to the new platform while dead rules break apart ->
   live traffic shifts path by path inside the change window ->
   tests confirm what should pass and what should not; the old rulebase retires.
   No vendor hardware is modelled. All data is illustrative. Every value is a function of t. */
import { smooth, clamp01 } from './stage.js';
import { canvasTex, rand, texGlowBlade, pulseMaterial, pointsMaterial, shotCamera, shotFade } from './lib.js';

const L = 22;
const SHOTS = [0, 5.5, 11, 16.5, L];
const ORANGE = 0xff6a1f, ICE = 0xbfe6ff, BLUE = 0x6f95dd;

const PW = 1.5, PH = 1.32, TILT = 1.12;          // panel size; panels lean back like consoles
const PY = 0.07 + (PH / 2) * Math.cos(TILT);      // centre height so the front edge sits just above the floor
const OLD_X = -1.0, NEW_X = 1.0;
const ROW_H = 0.072, ROW_W = 1.32, TOP = PH / 2 - 0.2; // TOP is panel-local

// Illustrative rulebase. keep: carried over; unused: 0 hits; shadowed: never matched.
const RULES = [
  ['01', 'users-to-web', 'TRUST', 'UNTRUST', 'web, ssl', 'ALLOW', '412,880', 'keep'],
  ['02', 'dns-out', 'TRUST', 'UNTRUST', 'dns', 'ALLOW', '96,114', 'keep'],
  ['03', 'app-tier', 'WEB', 'APP', 'tcp/8443', 'ALLOW', '58,302', 'keep'],
  ['04', 'legacy-ftp', 'TRUST', 'DMZ', 'ftp', 'ALLOW', '0', 'unused'],
  ['05', 'db-access', 'APP', 'DATA', 'tcp/1433', 'ALLOW', '21,947', 'keep'],
  ['06', 'vpn-users', 'VPN', 'TRUST', 'any', 'ALLOW', '7,615', 'keep'],
  ['07', 'web-any', 'WEB', 'APP', 'any', 'ALLOW', '0', 'shadowed'],
  ['08', 'mgmt-ssh', 'MGMT', 'INFRA', 'ssh', 'ALLOW', '1,206', 'keep'],
  ['09', 'old-vendor', 'PARTNER', 'DATA', 'any', 'ALLOW', '0', 'unused'],
  ['10', 'syslog', 'INFRA', 'SIEM', 'syslog', 'ALLOW', '183,441', 'keep'],
  ['11', 'ntp', 'INFRA', 'UNTRUST', 'ntp', 'ALLOW', '9,882', 'keep'],
  ['12', 'test-temp', 'ANY', 'ANY', 'any', 'ALLOW', '0', 'unused'],
  ['13', 'guest-web', 'GUEST', 'UNTRUST', 'web', 'ALLOW', '33,075', 'keep'],
  ['14', 'deny-all', 'ANY', 'ANY', 'any', 'DENY', '2,914', 'keep']
];
const KEEP = RULES.map((r, i) => i).filter((i) => RULES[i][7] === 'keep');
const DROP = RULES.map((r, i) => i).filter((i) => RULES[i][7] !== 'keep');
const SCAN0 = 0.8, SCAN1 = 4.6;                 // review sweep, top to bottom
const rowY = (i) => TOP - i * ROW_H;
const flagAt = (i) => SCAN0 + (i + 0.5) / RULES.length * (SCAN1 - SCAN0);
const moveAt = (k) => 6.0 + k * 0.32;            // k = index among kept rules
const dropAt = (i) => 5.8 + DROP.indexOf(i) * 0.35;

function texRule(THREE, r, state) {
  return canvasTex(THREE, 1024, 56, (g, w, h) => {
    const flagged = state === 'flag';
    g.fillStyle = flagged ? 'rgba(70,24,6,0.92)' : 'rgba(14,24,42,0.92)'; g.fillRect(0, 0, w, h);
    g.fillStyle = r[5] === 'DENY' ? '#7f93b5' : flagged ? '#ff6a1f' : '#3d5a8f'; g.fillRect(0, 0, 6, h);
    g.font = '500 25px "JetBrains Mono", monospace'; g.textBaseline = 'middle';
    const y = h / 2 + 1;
    g.fillStyle = '#5d7398'; g.fillText(r[0], 20, y);
    g.fillStyle = flagged ? '#ffd9c4' : '#e6edf8'; g.fillText(r[1], 70, y);
    g.fillStyle = '#8fa6c9'; g.fillText(`${r[2]} > ${r[3]}`, 300, y);
    g.fillStyle = '#6f84a8'; g.fillText(r[4], 590, y);
    g.fillStyle = r[5] === 'DENY' ? '#c8d6ee' : '#9fc1ff'; g.fillText(r[5], 760, y);
    g.textAlign = 'right';
    g.fillStyle = flagged ? '#ff8a4c' : '#5d7398';
    g.fillText(flagged ? (r[7] === 'shadowed' ? 'SHADOWED' : '0 HITS') : r[6], w - 18, y);
  });
}
function texHeader(THREE, title, sub, accent) {
  return canvasTex(THREE, 1024, 120, (g, w, h) => {
    g.font = '600 34px Inter, sans-serif'; g.fillStyle = '#f2f5fa'; g.fillText(title, 24, 52);
    g.font = '500 22px "JetBrains Mono", monospace'; g.fillStyle = accent; g.fillText(sub, 24, 92);
    g.fillStyle = 'rgba(143,166,201,0.35)'; g.fillRect(24, h - 6, w - 48, 2);
  });
}

export function migrationScene(ctx) {
  const { THREE, scene, renderer } = ctx;
  scene.fog.density = 0.06;
  scene.background.setHex(0x040a18); scene.fog.color.setHex(0x07122a); // per-scene tint

  // lights: cool ambient, one warm accent that follows the new platform
  scene.add(new THREE.HemisphereLight(0x22355c, 0x020308, 0.55));
  const fill = new THREE.PointLight(0x5875ad, 2.2, 0, 2); fill.position.set(0, 2.2, 3.2); scene.add(fill);
  const warm = new THREE.PointLight(ORANGE, 0, 3.2, 2); warm.position.set(NEW_X, 0.8, 0.9); scene.add(warm);
  const cool = new THREE.PointLight(BLUE, 1.2, 3.2, 2); cool.position.set(OLD_X, 0.8, 0.9); scene.add(cool);

  // two glass policy panels standing on the floor
  function panel(x, title, sub, accent) {
    const g = new THREE.Group(); g.position.set(x, PY, 0); g.rotation.x = -TILT; scene.add(g); g.updateMatrixWorld();
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x0a1426, metalness: 0.2, roughness: 0.15, transparent: true, opacity: 0.55, envMapIntensity: 0.6, depthWrite: false });
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(PW, PH), glassMat); glass.position.z = -0.01; g.add(glass);
    const edgeMat = new THREE.LineBasicMaterial({ color: 0x000000, transparent: true });
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(PW, PH)), edgeMat); g.add(edges);
    const headMat = new THREE.MeshBasicMaterial({ map: texHeader(THREE, title, sub, accent), transparent: true, depthWrite: false });
    const head = new THREE.Mesh(new THREE.PlaneGeometry(PW - 0.08, (PW - 0.08) * 120 / 1024), headMat); head.position.set(0, PH / 2 - 0.1, 0.004); g.add(head);
    // base light bar on the floor
    const barMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const bar = new THREE.Mesh(new THREE.BoxGeometry(PW, 0.008, 0.03), barMat);
    const front = g.localToWorld(new THREE.Vector3(0, -PH / 2, 0)); bar.position.set(x, 0.004, front.z + 0.02); scene.add(bar);
    return { g, glassMat, edgeMat, headMat, barMat };
  }
  const W = (pg, lx, ly, lz = 0.012) => pg.g.localToWorld(new THREE.Vector3(lx, ly, lz));
  const oldP = panel(OLD_X, 'Current rulebase', 'IN PRODUCTION  ·  ILLUSTRATIVE', '#8fa6c9');
  const newP = panel(NEW_X, 'New platform', 'STAGED  ·  POLICY MAPPED', '#ff8a4c');

  // rule rows (one plane each; the flagged texture swaps in when the review marks it)
  const rowGeo = new THREE.PlaneGeometry(ROW_W, ROW_W * 56 / 1024);
  const rows = RULES.map((r, i) => {
    const texN = texRule(THREE, r, 'normal');
    const texF = r[7] === 'keep' ? texN : texRule(THREE, r, 'flag');
    const mat = new THREE.MeshBasicMaterial({ map: texN, transparent: true, depthWrite: false });
    const m = new THREE.Mesh(rowGeo, mat); m.quaternion.copy(oldP.g.quaternion); scene.add(m);
    const k = KEEP.indexOf(i);
    return {
      m, mat, texN, texF, i, k,
      p0: W(oldP, 0, rowY(i)),
      p1: W(newP, 0, k >= 0 ? rowY(k) : 0)
    };
  });
  // faint ghost of the old rulebase stays behind as the rollback copy
  const ghostTex = canvasTex(THREE, 512, 512, (g, w, h) => {
    g.fillStyle = 'rgba(0,0,0,0)'; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(143,166,201,0.5)'; g.lineWidth = 2;
    for (let i = 0; i < RULES.length; i++) { const y = 10 + i * (h - 20) / RULES.length; g.strokeRect(6, y, w - 12, (h - 20) / RULES.length - 6); }
  });
  const ghostMat = new THREE.MeshBasicMaterial({ map: ghostTex, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
  const ghost = new THREE.Mesh(new THREE.PlaneGeometry(ROW_W, ROW_H * RULES.length), ghostMat);
  ghost.position.set(0, TOP - ROW_H * (RULES.length - 1) / 2, 0.006); oldP.g.add(ghost);

  // review blade sweeping down the old rulebase, then across the new one at validation
  const mkBlade = (pg) => { const b = new THREE.Mesh(new THREE.PlaneGeometry(0.09, PW + 0.02), new THREE.MeshBasicMaterial({ map: texGlowBlade(THREE), color: 0x000000, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); b.rotation.z = Math.PI / 2; b.position.z = 0.03; pg.g.add(b); return b; };
  const blade = mkBlade(oldP), vblade = mkBlade(newP);

  // removed rules break into fragments that fall to the floor (shader-driven, deterministic)
  const fragN = 170, fp = [], fv = [], fs = [], fc = [], fr = rand(31);
  DROP.forEach((i) => {
    for (let n = 0; n < fragN; n++) {
      const q = W(oldP, (fr() - 0.5) * ROW_W, rowY(i) + (fr() - 0.5) * ROW_H * 0.6, 0.02); fp.push(q.x, q.y, q.z);
      fv.push((fr() - 0.5) * 0.5, 0.15 + fr() * 0.35, 0.25 + fr() * 0.5);
      fs.push(dropAt(i) + fr() * 0.25); fc.push(fr());
    }
  });
  const fragGeo = new THREE.BufferGeometry();
  fragGeo.setAttribute('position', new THREE.Float32BufferAttribute(fp, 3));
  fragGeo.setAttribute('aVel', new THREE.Float32BufferAttribute(fv, 3));
  fragGeo.setAttribute('aStart', new THREE.Float32BufferAttribute(fs, 1));
  fragGeo.setAttribute('aSeed', new THREE.Float32BufferAttribute(fc, 1));
  const fragMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uT: { value: 0 }, uScale: { value: 10 } },
    vertexShader: `attribute vec3 aVel; attribute float aStart; attribute float aSeed; uniform float uT; uniform float uScale; varying float vA;
      void main(){ float a = uT - aStart; vec3 p = position;
        if (a > 0.0) { p += aVel * a; p.y += aVel.y * a - 0.9 * a * a; p.y = max(p.y, 0.005); }
        vA = a < 0.0 ? 0.0 : exp(-a * 0.9) * (0.5 + 0.5 * aSeed);
        vec4 mv = modelViewMatrix * vec4(p, 1.0); gl_PointSize = uScale * (0.6 + aSeed) / max(-mv.z, 0.2); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `varying float vA; void main(){ float r = length(gl_PointCoord - 0.5); float a = smoothstep(0.5, 0.0, r); gl_FragColor = vec4(vec3(1.0, 0.45, 0.14) * a * vA * 2.2, 1.0); }`
  });
  scene.add(new THREE.Points(fragGeo, fragMat));

  // traffic: streams from users and sites into the panel faces; each has an old and a new route
  const STREAMS = 5;
  const tube = (pts, mat) => { const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 90, 0.009, 6, false), mat); scene.add(m); return m; };
  const srcs = [], oldS = [], newS = [];
  for (let k = 0; k < STREAMS; k++) {
    const sx = -0.55 + k * 0.28, src = new THREE.Vector3(sx, 0.05, 2.3);
    srcs.push(src);
    const toOld = W(oldP, 0.3 - k * 0.15, -PH / 2 + 0.12, 0.02);
    const toNew = W(newP, -0.3 + k * 0.15, -PH / 2 + 0.12, 0.02);
    const mo = pulseMaterial(THREE, BLUE, k * 0.21, 3.2); mo.uniforms.uSpeed.value = 1.1;
    const mn = pulseMaterial(THREE, ORANGE, k * 0.17 + 0.1, 3.2); mn.uniforms.uSpeed.value = 1.1;
    oldS.push(tube([src, new THREE.Vector3((sx + toOld.x) / 2, 0.75, (src.z + toOld.z) / 2 + 0.2), new THREE.Vector3(toOld.x, toOld.y * 0.6 + 0.3, toOld.z + 0.25), toOld], mo).material);
    newS.push(tube([src, new THREE.Vector3((sx + toNew.x) / 2, 0.75, (src.z + toNew.z) / 2 + 0.2), new THREE.Vector3(toNew.x, toNew.y * 0.6 + 0.3, toNew.z + 0.25), toNew], mn).material);
  }
  // validation probes: two allowed (ice), one that must be denied (stops at the panel and flashes)
  const probe = (x0, lx, ly, color, seed) => {
    const m = pulseMaterial(THREE, color, seed, 2.6); m.uniforms.uSpeed.value = 0.9;
    const end = W(newP, lx, ly, 0.03);
    tube([new THREE.Vector3(x0, 0.05, 2.2), new THREE.Vector3((x0 + end.x) / 2, 0.12, 1.4), new THREE.Vector3(end.x, end.y + 0.25, end.z + 0.4), end], m);
    return { m, end };
  };
  const P1 = probe(1.7, 0.35, -0.05, ICE, 0.0), P2 = probe(2.0, 0.5, 0.15, ICE, 0.4), PD = probe(0.35, -0.45, 0.05, ORANGE, 0.2);
  const pass1 = P1.m, pass2 = P2.m, deny = PD.m; deny.uniforms.uStop.value = 0.93;

  // change-window ring on the floor between the panels
  const ringMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uP: { value: 0 }, uI: { value: 0 } },
    vertexShader: 'varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform float uP; uniform float uI; varying vec2 vP;
      void main(){ float a = atan(vP.x, vP.y) / 6.28318 + 0.5; float on = step(a, uP);
        vec3 c = mix(vec3(0.12, 0.17, 0.26), vec3(1.0, 0.42, 0.12) * 2.0, on); gl_FragColor = vec4(c * uI, 1.0); }`
  });
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.26, 0.285, 96, 1), ringMat); ring.rotation.x = -Math.PI / 2; ring.position.set(0, 0.006, 0.95); scene.add(ring);

  // distant points for depth
  const dp = [], dc = [], ds = [], dr = rand(77);
  for (let i = 0; i < 240; i++) { dp.push((dr() - 0.5) * 18, 0.2 + dr() * 4, -3.5 - dr() * 12); dc.push(0.45, 0.62, 1.3); ds.push(dr()); }
  const dGeo = new THREE.BufferGeometry(); dGeo.setAttribute('position', new THREE.Float32BufferAttribute(dp, 3)); dGeo.setAttribute('aColor', new THREE.Float32BufferAttribute(dc, 3)); dGeo.setAttribute('aSeed', new THREE.Float32BufferAttribute(ds, 1));
  const dMat = pointsMaterial(THREE); dMat.uniforms.uFog.value = 0.05; scene.add(new THREE.Points(dGeo, dMat));

  const qUp = new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.25, 0, 0));
  const size = new THREE.Vector2(), tmp = new THREE.Vector3(), cOld = new THREE.Color(0x8fb4ff), cNew = new THREE.Color(ORANGE);
  const cutAt = (k) => 11.6 + k * 0.75;
  const firstDrop = DROP[0], shadowed = RULES.findIndex((r) => r[7] === 'shadowed');
  const rowLabel = (i, dx) => (t, v) => v.copy(W(oldP, dx, rowY(i) + 0.03, 0.05));
  const topOld = W(oldP, 0, PH / 2 + 0.06), topNew = W(newP, 0, PH / 2 + 0.06);

  return {
    duration: L,
    floor: { tile: 0.8, base: 0x050b18, reflect: 0.85 },
    chapters: [{ start: 0, label: 'Scope' }, { start: 5.5, label: 'Stage' }, { start: 11, label: 'Cut over' }, { start: 16.5, label: 'Validate' }],
    labels: [
      { text: '0 hits · remove', tone: 'accent', at: rowLabel(firstDrop, 0.86), alpha: (t) => smooth(flagAt(firstDrop) + 0.2, flagAt(firstDrop) + 0.6, t) * (1 - smooth(5.4, 5.9, t)) },
      { text: 'Shadowed · remove', tone: 'accent', at: rowLabel(shadowed, 0.86), alpha: (t) => smooth(flagAt(shadowed) + 0.2, flagAt(shadowed) + 0.6, t) * (1 - smooth(5.4, 5.9, t)) },
      { text: '10 of 14 rules carried · 4 removed', tone: 'accent', at: (t, v) => v.set(0, 0.95, -0.1), alpha: (t) => smooth(9.9, 10.4, t) * (1 - smooth(10.75, 11.0, t)) },
      { text: 'Rollback ready', tone: 'ok', at: (t, v) => v.copy(topOld), alpha: (t) => smooth(8.6, 9.2, t) * (1 - smooth(16.2, 16.8, t)) },
      { text: 'Change window open', tone: 'accent', at: (t, v) => v.set(0, 0.42, -0.45), alpha: (t) => smooth(11.2, 11.5, t) * (1 - smooth(11.85, 11.95, t)) },
      ...[1, 2, 3, 4, 5].map((n) => ({ text: n < 5 ? `${n} of 5 paths on new platform` : 'All 5 paths live · old path idle', tone: n < 5 ? 'accent' : 'ok', at: (t, v) => v.set(0, 0.42, -0.45),
        alpha: (t) => smooth(11.6 + (n - 1) * 0.75 + 0.35, 11.6 + (n - 1) * 0.75 + 0.55, t) * (n < 5 ? 1 - smooth(11.6 + n * 0.75 + 0.3, 11.6 + n * 0.75 + 0.35, t) : 1 - smooth(16.0, 16.4, t)) })),
      { text: 'Allowed · as expected', tone: 'ok', at: (t, v) => v.copy(P2.end).add(tmp.set(0, 0.12, 0)), alpha: (t) => smooth(18.0, 18.4, t) * (1 - smooth(20.6, 21.0, t)) },
      { text: 'Denied · as expected', tone: 'stop', at: (t, v) => v.copy(PD.end).add(tmp.set(0, 0.12, 0)), alpha: (t) => smooth(18.5, 18.9, t) * (1 - smooth(20.6, 21.0, t)) },
      { text: 'Retired after validation', at: (t, v) => v.copy(topOld), alpha: (t) => smooth(19.4, 19.9, t) * (1 - smooth(21.2, 21.6, t)) }
    ],
    fade: (t) => shotFade(SHOTS, t),
    update(t) {
      // review sweep down the current rulebase
      const su = (t - SCAN0) / (SCAN1 - SCAN0), vu = (t - 16.9) / 1.6;
      blade.position.y = TOP + 0.04 - clamp01(su) * (ROW_H * RULES.length + 0.08);
      blade.material.color.set(ORANGE).multiplyScalar(su > 0 && su < 1 ? 0.75 * Math.sin(su * Math.PI) ** 0.4 : 0);
      vblade.position.y = TOP + 0.04 - clamp01(vu) * (ROW_H * KEEP.length + 0.08);
      vblade.material.color.set(ICE).multiplyScalar(vu > 0 && vu < 1 ? 0.6 * Math.sin(vu * Math.PI) ** 0.4 : 0);

      // rows: flag -> carry across (kept) or break apart (removed)
      rows.forEach((r) => {
        const keep = r.k >= 0;
        const flagged = !keep && t >= flagAt(r.i);
        r.mat.map = flagged ? r.texF : r.texN;
        const p = r.m.position;
        if (keep) {
          const s = moveAt(r.k), u = smooth(s, s + 1.25, t);
          p.copy(r.p0).lerp(r.p1, u);
          const arc = Math.sin(u * Math.PI);
          p.y += arc * 0.55; p.z += arc * 0.35;
          r.m.quaternion.copy(oldP.g.quaternion).slerp(qUp, arc * 0.75);
          const lit = Math.sin(u * Math.PI);
          r.mat.color.setRGB(1 + lit * 0.6, 1 + lit * 0.35, 1 + lit * 0.15);
          r.mat.opacity = 1;
        } else {
          const d = dropAt(r.i);
          p.copy(r.p0);
          const pulse = flagged ? 1 + 0.25 * Math.sin(t * 9) * (1 - smooth(d - 0.4, d, t)) : 1;
          r.mat.color.setScalar(pulse);
          r.mat.opacity = 1 - smooth(d, d + 0.35, t);
        }
        r.m.visible = r.mat.opacity > 0.01;
      });
      ghostMat.opacity = 0.35 * smooth(6.4, 8.5, t) * (1 - smooth(19.3, 20.3, t));
      fragMat.uniforms.uT.value = t;

      // panels: the old one cools and retires, the new one wakes and takes the warm light
      const wake = smooth(5.6, 7.5, t), retire = smooth(19.3, 20.6, t);
      const newLive = KEEP.length ? clamp01((t - 11.4) / 4.2) : 0;
      oldP.edgeMat.color.copy(cOld).multiplyScalar(0.5 * (1 - retire));
      oldP.glassMat.opacity = 0.55 * (1 - 0.8 * retire); oldP.headMat.opacity = 1 - retire;
      oldP.barMat.color.copy(cOld).multiplyScalar(0.8 * (1 - smooth(11.5, 15.5, t)));
      newP.edgeMat.color.copy(cNew).multiplyScalar(0.15 + 0.85 * wake);
      newP.headMat.opacity = 0.35 + 0.65 * wake;
      newP.barMat.color.copy(cNew).multiplyScalar(0.2 + 1.6 * newLive);
      warm.intensity = 0.4 * wake + 1.6 * newLive;
      cool.intensity = 1.2 * (1 - smooth(12, 16, t));

      // traffic shifts path by path inside the change window
      for (let k = 0; k < STREAMS; k++) {
        const c = cutAt(k);
        oldS[k].uniforms.uTime.value = t; newS[k].uniforms.uTime.value = t;
        oldS[k].uniforms.uActive.value = 1 - smooth(c, c + 0.6, t);
        newS[k].uniforms.uActive.value = smooth(c - 0.1, c + 0.5, t);
      }
      ringMat.uniforms.uP.value = clamp01((t - 11.3) / 4.6);
      ringMat.uniforms.uI.value = smooth(11.0, 11.5, t) * (1 - smooth(16.0, 16.6, t));

      // validation probes
      [pass1, pass2, deny].forEach((m) => { m.uniforms.uTime.value = t - 17.4; });
      pass1.uniforms.uActive.value = pass2.uniforms.uActive.value = smooth(17.4, 17.8, t) * (1 - smooth(20.8, 21.4, t));
      deny.uniforms.uActive.value = smooth(17.8, 18.2, t) * (1 - smooth(20.8, 21.4, t));
      deny.uniforms.uFlash.value = smooth(18.4, 18.6, t) * (0.6 + 0.4 * Math.sin(t * 7)) * (1 - smooth(20.8, 21.4, t));

      renderer.getDrawingBufferSize(size);
      fragMat.uniforms.uScale.value = size.y * 0.026;
      dMat.uniforms.uTime.value = t; dMat.uniforms.uScale.value = size.y * 0.012;
    },
    camera(t, out) {
      shotCamera(SHOTS, [
        // scope: over the shoulder of the current rulebase as the review runs down it
        [[-2.3, 2.05, 2.45], [-1.7, 1.95, 2.35], [-1.0, 0.36, -0.25], [-0.9, 0.34, -0.3], 30, 0.04],
        // stage: wide, rules arc across to the new platform
        [[0.0, 1.6, 3.6], [0.0, 1.5, 3.3], [0.0, 0.62, -0.1], [0.0, 0.6, -0.1], 34, 0.0],
        // cut over: low, behind the users, watching paths switch
        [[0.6, 2.2, 4.0], [-0.2, 2.05, 3.7], [0.0, 0.5, 0.25], [0.0, 0.5, 0.2], 36, 0.0],
        // validate: on the new platform, then pull back as the old one retires
        [[2.0, 1.45, 2.0], [0.6, 1.7, 3.9], [1.0, 0.32, -0.15], [0.1, 0.38, -0.1], 30, 0.0]
      ], t, out);
    }
  };
}
