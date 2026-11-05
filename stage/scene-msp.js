/* Film D, white-label MSP engineering, as a real-time scene (v2: behind the curtain).
   Story (22 s loop): the MSP is the face its clients see; a scoped change request passes behind it ->
   specialist engineering happens on a bench behind the MSP's brand, inside its process ->
   the change goes out through the MSP to the client and is checked there ->
   the change record goes to the client under the MSP's name; the engineering layer stays out of sight.
   No vendor hardware is modelled. All values are functions of scene time t. */
import { smooth, clamp01 } from './stage.js';
import { canvasTex, rand, texGlowBlade, pulseMaterial, pointsMaterial, shotCamera, shotFade } from './lib.js';

const L = 22;
const SHOTS = [0, 5.5, 11, 16.5, L];
const ORANGE = 0xff6a1f, ICE = 0xbfe6ff, COOL = 0x8fb4ff;
const PANEL = { w: 1.3, h: 0.68, y: 0.5, z: 0 };
const BENCH = { x: 0, z: -0.9, w: 1.25, h: 0.7, tilt: 1.12 };
const CLIENTS = [[-1.95, 0.1], [-1.3, 0.5], [1.3, 0.5], [1.95, 0.1]];
const JOB = 2;
const CONFIG = [
  'change-request  CR-2214  client-c',
  'scope      firewall policy, vpn profile',
  'window     sat 02:00-04:00   rollback: ready',
  '+ rule  remote-users > apps   ssl   allow',
  '+ rule  guest > apps          any   deny',
  '- rule  temp-vendor-access   (0 hits)',
  'peer review           approved',
  'pre-checks            passed'
];

function texPanel(THREE) {
  return canvasTex(THREE, 1024, 532, (g, w, h) => {
    g.fillStyle = 'rgba(10,18,34,0.55)'; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(191,214,255,0.55)'; g.lineWidth = 4; g.strokeRect(2, 2, w - 4, h - 4);
    g.fillStyle = '#e8eef8'; g.fillRect(70, 170, 120, 120); g.fillStyle = '#0b1526'; g.fillRect(100, 200, 60, 60);
    g.font = '600 92px Inter, sans-serif'; g.fillStyle = '#f2f5fa'; g.fillText('YOUR MSP', 230, 268);
    g.font = '500 30px "JetBrains Mono", monospace'; g.fillStyle = '#8fa6c9'; g.fillText('CLIENT-FACING  ·  YOUR BRAND, YOUR PROCESS', 72, 390);
    g.fillStyle = 'rgba(143,166,201,0.35)'; g.fillRect(72, 420, w - 144, 2);
  });
}
function texCard(THREE, lines, accent, bg) {
  return canvasTex(THREE, 640, 250, (g, w, h) => {
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    g.fillStyle = accent; g.fillRect(0, 0, 12, h);
    g.font = '500 24px "JetBrains Mono", monospace'; g.fillStyle = accent; g.fillText(lines[0], 36, 50);
    g.font = '500 40px Inter, sans-serif'; g.fillStyle = '#f2f5fa'; g.fillText(lines[1], 36, 118);
    g.font = '24px "JetBrains Mono", monospace'; g.fillStyle = '#8fa6c9'; g.fillText(lines[2], 36, 180);
    g.strokeStyle = 'rgba(143,166,201,0.45)'; g.lineWidth = 3; g.strokeRect(1.5, 1.5, w - 3, h - 3);
  });
}
function texRow(THREE, s, i) {
  return canvasTex(THREE, 1024, 52, (g, w, h) => {
    g.fillStyle = 'rgba(30,14,6,0.88)'; g.fillRect(0, 0, w, h);
    g.font = '500 25px "JetBrains Mono", monospace'; g.textBaseline = 'middle';
    g.fillStyle = '#7a5a48'; g.fillText(String(i + 1).padStart(2, '0'), 16, h / 2);
    g.fillStyle = s.startsWith('+') ? '#ffb48a' : s.startsWith('-') ? '#c98a6a' : '#f0e2d8'; g.fillText(s, 66, h / 2);
    if (i >= 6) { g.fillStyle = '#ff8a4c'; g.textAlign = 'right'; g.fillText('OK', w - 18, h / 2); }
  });
}

export function mspScene(ctx) {
  const { THREE, scene, renderer } = ctx;
  scene.fog.density = 0.055;
  scene.background.setHex(0x150f2e); scene.fog.color.setHex(0x2a2152); // per-scene tint
  const V = (x, y, z) => new THREE.Vector3(x, y, z);

  scene.add(new THREE.HemisphereLight(0x22355c, 0x020308, 0.55));
  const fill = new THREE.PointLight(0x5875ad, 2.2, 0, 2); fill.position.set(0, 2.2, 3.4); scene.add(fill);
  const behind = new THREE.PointLight(ORANGE, 0, 3.0, 2); behind.position.set(0, 0.8, -1.2); scene.add(behind);

  // the MSP's face: a glass brand panel the clients see
  const panelMat = new THREE.MeshBasicMaterial({ map: texPanel(THREE), transparent: true, depthWrite: false, side: THREE.DoubleSide });
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(PANEL.w, PANEL.w * 532 / 1024), panelMat); panel.position.set(0, PANEL.y, PANEL.z); scene.add(panel);
  const glowMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
  const glowBar = new THREE.Mesh(new THREE.BoxGeometry(PANEL.w, 0.008, 0.03), glowMat); glowBar.position.set(0, 0.004, PANEL.z + 0.02); scene.add(glowBar);
  const stem = new THREE.Mesh(new THREE.BoxGeometry(0.012, PANEL.y - PANEL.w * 532 / 2048, 0.012), new THREE.MeshBasicMaterial({ color: 0x2a3a5a }));
  stem.position.set(0, (PANEL.y - PANEL.w * 532 / 2048) / 2, 0); scene.add(stem);
  // a curtain of fine vertical light threads hides what is behind the panel from the front
  const thr = [], tr = rand(5);
  for (let i = 0; i < 70; i++) { const x = -1.9 + i * 0.055 + (tr() - 0.5) * 0.02; thr.push(x, 0, -0.32, x, 0.95 + tr() * 0.22, -0.32); }
  const thrGeo = new THREE.BufferGeometry(); thrGeo.setAttribute('position', new THREE.Float32BufferAttribute(thr, 3));
  const thrMat = new THREE.LineBasicMaterial({ color: 0x000000, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
  scene.add(new THREE.LineSegments(thrGeo, thrMat));

  // the clients, in front of the MSP
  const clients = CLIENTS.map(([x, z], i) => {
    const g = new THREE.Group(); g.position.set(x, 0.01, z); scene.add(g);
    const rMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.007, 8, 64), rMat); ring.rotation.x = Math.PI / 2; g.add(ring);
    const cMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.045, 0), cMat); core.position.y = 0.14; g.add(core);
    const pMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
    const ripple = new THREE.Mesh(new THREE.RingGeometry(0.16, 0.175, 64), pMat); ripple.rotation.x = -Math.PI / 2; ripple.position.y = 0.006; g.add(ripple);
    // relationship line to the MSP
    const m = pulseMaterial(THREE, COOL, i * 0.19, 2.0); m.uniforms.uSpeed.value = 0.5;
    const curve = new THREE.CatmullRomCurve3([V(x, 0.14, z), V(x * 0.75, 0.42, z + 0.15), V(Math.sign(x) * (PANEL.w / 2 + 0.12), PANEL.y, 0.1), V(Math.sign(x) * (PANEL.w / 2 - 0.02), PANEL.y, 0.02)]);
    const link = new THREE.Mesh(new THREE.TubeGeometry(curve, 70, 0.005, 6, false), m); scene.add(link);
    return { g, rMat, cMat, pMat, ripple, core, link: m, pos: V(x, 0, z) };
  });
  const jobPos = clients[JOB].pos;

  // behind the curtain: the engineering bench (tilted console, orange)
  const bench = new THREE.Group(); bench.position.set(BENCH.x, 0.07 + (BENCH.h / 2) * Math.cos(BENCH.tilt), BENCH.z); bench.rotation.order = "YXZ"; bench.rotation.x = -BENCH.tilt; bench.rotation.y = Math.PI; scene.add(bench); bench.updateMatrixWorld();
  const benchMat = new THREE.MeshStandardMaterial({ color: 0x1a0d06, metalness: 0.2, roughness: 0.2, transparent: true, opacity: 0.6, depthWrite: false, side: THREE.DoubleSide });
  bench.add(new THREE.Mesh(new THREE.PlaneGeometry(BENCH.w, BENCH.h), benchMat));
  const bEdgeMat = new THREE.LineBasicMaterial({ color: 0x000000 });
  bench.add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(BENCH.w, BENCH.h)), bEdgeMat));
  const rowGeo = new THREE.PlaneGeometry(BENCH.w - 0.1, (BENCH.w - 0.1) * 52 / 1024);
  const rows = CONFIG.map((s, i) => {
    const mat = new THREE.MeshBasicMaterial({ map: texRow(THREE, s, i), transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide });
    const m = new THREE.Mesh(rowGeo, mat); m.position.set(0, BENCH.h / 2 - 0.1 - i * 0.068, 0.01); bench.add(m); return mat;
  });
  const bladeMat = new THREE.MeshBasicMaterial({ map: texGlowBlade(THREE), color: 0x000000, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  const blade = new THREE.Mesh(new THREE.PlaneGeometry(0.12, BENCH.w + 0.1), bladeMat); blade.rotation.z = Math.PI / 2; blade.position.z = 0.02; bench.add(blade);
  // faint orange grid on the floor behind
  const grid = new THREE.GridHelper(3.2, 16, 0x000000, 0x000000); grid.position.set(0, 0.003, -1.3);
  grid.material.transparent = true; grid.material.blending = THREE.AdditiveBlending; grid.material.depthWrite = false; scene.add(grid);

  // cards that travel: change request in, change out, record out
  const card = (lines, accent, bg) => {
    const mat = new THREE.MeshBasicMaterial({ map: texCard(THREE, lines, accent, bg), transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.234), mat); scene.add(m); return { m, mat };
  };
  const req = card(['CHANGE REQUEST  ·  CR-2214', 'Firewall policy update', 'Client C  ·  window Sat 02:00'], '#8fa6c9', 'rgba(14,24,42,0.94)');
  const chg = card(['CHANGE  ·  READY', 'Peer-reviewed, rollback ready', 'Built in your process & tools'], '#ff8a4c', 'rgba(40,16,6,0.94)');
  const rec = card(['CHANGE RECORD  ·  CR-2214', 'Prepared by Your MSP', 'Tests passed  ·  docs attached'], '#bfe6ff', 'rgba(14,24,42,0.94)');
  const benchTop = bench.localToWorld(V(0, 0.05, 0.12));
  const pathIn = new THREE.CatmullRomCurve3([V(jobPos.x, 0.35, jobPos.z), V(jobPos.x * 0.55, 0.9, 0.55), V(0.1, 0.85, 0.2), V(0.0, 0.7, -0.45), benchTop]);
  const pathOut = new THREE.CatmullRomCurve3([benchTop, V(0.0, 0.95, -0.45), V(0.15, 0.95, 0.2), V(jobPos.x * 0.6, 0.85, 0.6), V(jobPos.x, 0.38, jobPos.z)]);
  const pathRec = new THREE.CatmullRomCurve3([V(0.2, PANEL.y, 0.12), V(0.5, 0.85, 0.45), V(jobPos.x * 0.8, 0.7, jobPos.z + 0.1), V(jobPos.x, 0.38, jobPos.z)]);

  // distant points
  const dp = [], dc = [], ds = [], dr = rand(77);
  for (let i = 0; i < 240; i++) { dp.push((dr() - 0.5) * 18, 0.2 + dr() * 4, -3.5 - dr() * 12); dc.push(0.45, 0.62, 1.3); ds.push(dr()); }
  const dGeo = new THREE.BufferGeometry(); dGeo.setAttribute('position', new THREE.Float32BufferAttribute(dp, 3)); dGeo.setAttribute('aColor', new THREE.Float32BufferAttribute(dc, 3)); dGeo.setAttribute('aSeed', new THREE.Float32BufferAttribute(ds, 1));
  const dMat = pointsMaterial(THREE); dMat.uniforms.uFog.value = 0.05; scene.add(new THREE.Points(dGeo, dMat));

  const size = new THREE.Vector2(), tmp = V(0, 0, 0), cOr = new THREE.Color(ORANGE), cIce = new THREE.Color(ICE), cCool = new THREE.Color(COOL);
  const qBench = new THREE.Quaternion().copy(bench.quaternion), qFront = new THREE.Quaternion(), qTmp = new THREE.Quaternion();
  const fly = (c, path, t0, t1, t, qEnd) => {
    const u = smooth(t0, t1, t);
    c.m.position.copy(path.getPoint(u));
    c.m.position.y += Math.sin(t * 2) * 0.006;
    if (qEnd) { qTmp.copy(qFront).slerp(qEnd, smooth(0.75, 1, u)); c.m.quaternion.copy(qTmp); } else c.m.quaternion.copy(qFront);
    return u;
  };

  return {
    duration: L,
    floor: { tile: 0.7, base: 0x100b22, reflect: 0.85 },
    chapters: [{ start: 0, label: 'Scope' }, { start: 5.5, label: 'Engineer' }, { start: 11, label: 'Validate' }, { start: 16.5, label: 'Hand over' }],
    labels: [
      { text: 'Your clients', at: (t, v) => v.set(-1.62, 0.42, 0.3), alpha: (t) => smooth(0.6, 1.3, t) * (1 - smooth(4.6, 5.2, t)) },
      { text: 'Scope agreed with your team', tone: 'ok', at: (t, v) => v.set(0.0, PANEL.y + 0.36, 0), alpha: (t) => smooth(2.2, 2.8, t) * (1 - smooth(5.0, 5.5, t)) },
      { text: 'Specialist engineering · behind your brand', tone: 'accent', at: (t, v) => v.copy(bench.position).add(tmp.set(0.8, 0.15, 0.1)), alpha: (t) => smooth(6.2, 6.9, t) * (1 - smooth(10.4, 10.9, t)) },
      { text: 'Client C', at: (t, v) => v.copy(jobPos).setY(0.42), alpha: (t) => smooth(11.3, 11.9, t) * (1 - smooth(21.2, 21.7, t)) },
      { text: 'Checked · pass and block as expected', tone: 'ok', at: (t, v) => v.copy(jobPos).add(tmp.set(0.0, 0.62, -0.1)), alpha: (t) => smooth(14.0, 14.6, t) * (1 - smooth(16.2, 16.7, t)) },
      { text: 'Handover, in your name', tone: 'ok', at: (t, v) => v.copy(rec.m.position).add(tmp.set(0, 0.16, 0)), alpha: (t) => smooth(18.4, 19.0, t) * (1 - smooth(21.2, 21.7, t)) }
    ],
    fade: (t) => shotFade(SHOTS, t),
    update(t) {
      // the MSP panel and client relationships are always on; the job's client lights up
      const handover = smooth(16.8, 18.0, t);
      glowMat.color.copy(cCool).multiplyScalar(0.6 + 0.8 * handover);
      clients.forEach((c, i) => {
        const job = i === JOB;
        const hot = job ? smooth(1.0, 1.6, t) : 0;
        c.rMat.color.copy(cCool).multiplyScalar(0.5 + (job ? 0.6 * hot : 0)).lerp(job ? cOr : cCool, job ? 0.6 * smooth(12.2, 13.0, t) * (1 - handover) : 0);
        c.cMat.color.copy(job && t > 12.2 && t < 17 ? cOr : cCool).multiplyScalar(1.2 + 0.4 * Math.sin(t * 2 + i));
        c.core.rotation.y = t * (0.5 + i * 0.1);
        c.link.uniforms.uTime.value = t; c.link.uniforms.uActive.value = 0.35 + (job ? 0.65 * hot : 0);
        // ripple: tests at the client, and a soft one on handover
        const tu = job ? ((t - 13.4) % 0.9) / 0.9 : -1, test = job ? smooth(13.4, 13.6, t) * (1 - smooth(16.0, 16.4, t)) : 0;
        const hu = job ? clamp01((t - 19.0) / 1.2) : 0, hv = job ? Math.sin(hu * Math.PI) : 0;
        const ru = test > 0 ? tu : hu;
        c.ripple.scale.setScalar(1 + ru * 2.4);
        c.pMat.color.copy(test > 0 ? cIce : cCool).multiplyScalar((test * (1 - tu) * 1.6) + hv * 1.2);
      });

      // curtain and bench: visible from behind, dims away on handover
      const work = smooth(5.6, 6.6, t) * (1 - smooth(17.0, 18.5, t));
      thrMat.color.copy(cCool).multiplyScalar(0.05 + 0.05 * (1 - work));
      bEdgeMat.color.copy(cOr).multiplyScalar(0.15 + 1.0 * work);
      benchMat.opacity = 0.25 + 0.4 * work;
      behind.intensity = 1.8 * work;
      grid.material.color.copy(cOr).multiplyScalar(0.06 + 0.22 * work);
      rows.forEach((m, i) => { m.opacity = smooth(6.8 + i * 0.42, 7.1 + i * 0.42, t) * (1 - smooth(17.0, 18.2, t)); });
      const bu = (t - 10.0) / 1.0;
      blade.position.y = BENCH.h / 2 - 0.05 - clamp01(bu) * (BENCH.h - 0.1);
      bladeMat.color.set(ORANGE).multiplyScalar(bu > 0 && bu < 1 ? 1.4 * Math.sin(bu * Math.PI) ** 0.4 : 0);

      // cards
      const reqIn = smooth(1.6, 2.0, t) * (1 - smooth(6.6, 7.0, t));
      fly(req, pathIn, 2.0, 5.9, t, qBench); req.mat.opacity = reqIn; req.m.visible = reqIn > 0.01;
      const chgOn = smooth(11.0, 11.3, t) * (1 - smooth(13.0, 13.4, t));
      fly(chg, pathOut, 11.1, 13.1, t); chg.mat.opacity = chgOn; chg.m.visible = chgOn > 0.01;
      const recOn = smooth(17.4, 17.8, t) * (1 - smooth(21.2, 21.7, t));
      fly(rec, pathRec, 17.6, 19.2, t); rec.mat.opacity = recOn; rec.m.visible = recOn > 0.01;

      renderer.getDrawingBufferSize(size); dMat.uniforms.uTime.value = t; dMat.uniforms.uScale.value = size.y * 0.012;
    },
    camera(t, out) {
      shotCamera(SHOTS, [
        // scope: the MSP with its clients either side, from the front
        [[0.5, 1.75, 4.9], [0.15, 1.7, 4.6], [0.0, 0.38, 0.0], [0.0, 0.38, 0.0], 32, 0.0],
        // engineer: behind the curtain, over the bench, the MSP's panel seen from the back
        [[0.85, 2.45, -4.05], [0.5, 2.4, -3.8], [0.0, 0.3, -0.85], [0.0, 0.3, -0.8], 32, 0.2],
        // validate: on the client as the change arrives and is checked
        [[-0.1, 1.9, 4.2], [0.2, 1.9, 4.0], [0.9, 0.38, 0.3], [0.95, 0.38, 0.35], 30, 0.1],
        // hand over: wide from the front; the engineering behind fades out of view
        [[0.0, 1.85, 5.0], [0.0, 2.05, 5.5], [0.0, 0.38, 0.0], [0.0, 0.38, 0.0], 32, 0.0]
      ], t, out);
    }
  };
}
