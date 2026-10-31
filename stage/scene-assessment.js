/* Film C, cybersecurity risk assessment, as a real-time scene.
   Story (22 s loop): a deliberate scan across configuration evidence marks specific exposures ->
   findings lift out as evidence cards -> cards are ranked into fix now / next 90 days / planned ->
   they settle onto a remediation roadmap, the deliverable. Engineer-led review; all data is synthetic. */
import { smooth } from './stage.js';
import { canvasTex, rand, texBrushed, texGlowBlade, pointsMaterial, slab, shotCamera, shotFade } from './lib.js';

const L = 22;
const SHOTS = [0, 5.5, 11, 16.5, L];
const ORANGE = 0xff6a1f;
const TABLE_Y = 0.42;

const FINDINGS = [
  { title: 'Admin VPN without MFA', sev: 'h', col: 0, sheet: 0, row: 6 },
  { title: 'Firewall OS out of support', sev: 'h', col: 0, sheet: 1, row: 3 },
  { title: 'Vendor access never reviewed', sev: 'm', col: 1, sheet: 2, row: 9 },
  { title: 'Backups never restore-tested', sev: 'm', col: 1, sheet: 3, row: 5 },
  { title: 'Logging not centralized', sev: 'l', col: 2, sheet: 4, row: 11 }
];
const SEV = { h: '#ff6a1f', m: '#f6b486', l: '#9aa6b6' };
const ROWS = 15, SHEET_W = 0.95, SHEET_D = 0.62;
const rowZ = (row) => -SHEET_D / 2 + 0.07 + row * ((SHEET_D - 0.1) / ROWS); // local z on a flat sheet

function texConfig(THREE, k) {
  const r = rand(100 + k);
  const words = ['permit', 'deny', 'any', 'tcp', 'udp', 'host', 'eq', 'log', 'zone', 'nat', 'object', 'interface', 'vpn', 'admin', 'mgmt', 'syslog'];
  return canvasTex(THREE, 1024, 672, (g, w, h) => {
    g.fillStyle = '#0a1120'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#16233a'; g.fillRect(0, 0, w, 54);
    g.font = '500 22px "JetBrains Mono", monospace'; g.fillStyle = '#8fa6c9';
    g.fillText(`CONFIG EXTRACT ${String(k + 1).padStart(2, '0')}  ·  ILLUSTRATIVE`, 28, 35);
    g.font = '20px "JetBrains Mono", monospace';
    for (let i = 0; i < ROWS; i++) {
      const y = 92 + i * ((h - 110) / ROWS);
      g.fillStyle = '#41557a'; g.fillText(String(10 + i * 2).padStart(3, ' '), 28, y);
      let x = 96; const n = 4 + (r() * 6 | 0);
      for (let j = 0; j < n; j++) {
        const word = words[(r() * words.length) | 0];
        g.fillStyle = word === 'permit' || word === 'any' ? '#c8d6ee' : word === 'deny' ? '#7f93b5' : '#5d7398';
        g.fillText(word, x, y); x += g.measureText(word).width + 14;
      }
    }
    g.strokeStyle = 'rgba(143,166,201,0.35)'; g.lineWidth = 3; g.strokeRect(2, 2, w - 4, h - 4);
  });
}
function texCard(THREE, f, idx) {
  return canvasTex(THREE, 640, 240, (g, w, h) => {
    g.fillStyle = '#0f1828'; g.fillRect(0, 0, w, h);
    g.fillStyle = SEV[f.sev]; g.fillRect(0, 0, 14, h);
    g.font = '500 22px "JetBrains Mono", monospace'; g.fillStyle = '#8fa6c9';
    g.fillText(`FINDING ${String(idx + 1).padStart(2, '0')}  ·  ${f.sev === 'h' ? 'HIGH' : f.sev === 'm' ? 'MEDIUM' : 'LOW'}`, 40, 52);
    g.font = '500 38px Inter, sans-serif'; g.fillStyle = '#f2f5fa';
    g.fillText(f.title, 40, 118);
    g.font = '22px "JetBrains Mono", monospace'; g.fillStyle = '#5d7398';
    g.fillText('Evidence attached · synthetic data', 40, 176);
    g.strokeStyle = 'rgba(143,166,201,0.4)'; g.lineWidth = 3; g.strokeRect(1.5, 1.5, w - 3, h - 3);
  });
}
function texRoadmap(THREE) {
  return canvasTex(THREE, 2048, 1112, (g, w, h) => {
    g.fillStyle = '#e9edf3'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#0b1526'; g.font = '600 46px Inter, sans-serif'; g.fillText('Remediation roadmap', 80, 110);
    g.font = '500 26px "JetBrains Mono", monospace'; g.fillStyle = '#b8470f'; g.fillText('ILLUSTRATIVE  ·  SAMPLE DELIVERABLE', 80, 160);
    const cols = ['FIX NOW', 'NEXT 90 DAYS', 'PLANNED'];
    cols.forEach((c, i) => {
      const x = 80 + i * ((w - 160) / 3);
      g.fillStyle = '#56657b'; g.font = '500 30px "JetBrains Mono", monospace'; g.fillText(c, x, 250);
      g.fillStyle = i === 0 ? '#f26b1f' : i === 1 ? '#f6b486' : '#9aa6b6'; g.fillRect(x, 270, (w - 160) / 3 - 60, 6);
    });
    g.strokeStyle = '#c3cbd6'; g.lineWidth = 3; g.beginPath(); g.moveTo(80, h - 110); g.lineTo(w - 80, h - 110); g.stroke();
    g.fillStyle = '#0b1526'; g.beginPath(); g.moveTo(w - 80, h - 122); g.lineTo(w - 56, h - 110); g.lineTo(w - 80, h - 98); g.fill();
    g.fillStyle = '#56657b'; g.font = '26px "JetBrains Mono", monospace'; g.fillText('OWNER  ·  EFFORT  ·  DEPENDENCY  ·  TARGET DATE', 80, h - 60);
  });
}

export function assessmentScene(ctx) {
  const { THREE, scene, renderer } = ctx;
  scene.fog.density = 0.07;
  const brushed = texBrushed(THREE);

  // lights
  scene.add(new THREE.HemisphereLight(0x22355c, 0x020308, 0.5));
  const key = new THREE.SpotLight(0xffeedd, 26, 0, 0.55, 0.85, 2); key.position.set(-1.2, 3.6, 2.4); key.target.position.set(0, TABLE_Y, 0);
  key.castShadow = true; key.shadow.mapSize.set(1024, 1024); key.shadow.bias = -0.0004; scene.add(key, key.target);
  const rim = new THREE.SpotLight(0x5f86d6, 16, 0, 0.5, 0.8, 2); rim.position.set(2.6, TABLE_Y - 0.02, -2.6); rim.target.position.set(0, TABLE_Y, 0); scene.add(rim, rim.target);
  const scanLight = new THREE.PointLight(0xff7a33, 0, 1.4, 2); scene.add(scanLight);
  const fill = new THREE.PointLight(0x5875ad, 2.4, 0, 2); fill.position.set(0, 1.6, 3.5); scene.add(fill);

  // table
  const table = new THREE.Mesh(slab(THREE, 3.1, TABLE_Y, 1.75, 0.01), new THREE.MeshStandardMaterial({ color: 0x0b0f17, metalness: 0.5, roughness: 0.42, roughnessMap: brushed, envMapIntensity: 0.45 }));
  table.receiveShadow = true; table.castShadow = true; scene.add(table);
  const edge = new THREE.Mesh(new THREE.BoxGeometry(3.06, 0.004, 0.004), new THREE.MeshBasicMaterial({ color: new THREE.Color(0x8fb4ff).multiplyScalar(0.5) }));
  edge.position.set(0, TABLE_Y - 0.004, 0.876); scene.add(edge);

  // configuration sheets fanned across the table
  const sheets = [];
  for (let k = 0; k < 5; k++) {
    const tex = texConfig(THREE, k);
    const mat = new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: new THREE.Color(0xffffff), emissiveIntensity: 0.55, roughness: 0.25, metalness: 0.2, transparent: true, opacity: 0.94, envMapIntensity: 0.5 });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(SHEET_W, SHEET_D), mat);
    m.rotation.x = -Math.PI / 2; m.rotation.z = (k - 2) * 0.05;
    const base = new THREE.Vector3(-1.08 + k * 0.54, TABLE_Y + 0.03 + k * 0.012, -0.12 + (k % 2) * 0.1);
    m.position.copy(base); m.castShadow = true; scene.add(m);
    sheets.push({ m, mat, base });
  }

  // exposure markers on the sheets, revealed as the scan passes
  const markers = FINDINGS.map((f) => {
    const s = sheets[f.sheet];
    const mat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(SHEET_W * 0.86, 0.026), mat);
    m.rotation.copy(s.m.rotation);
    const local = new THREE.Vector3(0.02, rowZ(f.row) * -1, 0.002); // plane-local (x, y, z) before the -90deg tilt
    local.applyEuler(s.m.rotation);
    m.position.copy(s.base).add(local);
    scene.add(m);
    return { m, mat, pos: m.position.clone() };
  });

  // scan band sweeping across the sheets
  const band = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.9), new THREE.MeshBasicMaterial({ map: texGlowBlade(THREE), color: 0x000000, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  band.rotation.x = -Math.PI / 2; scene.add(band);
  const SCAN0 = 0.6, SCAN1 = 5.0, X0 = -1.7, X1 = 1.7;
  const scanX = (t) => X0 + (X1 - X0) * ((t - SCAN0) / (SCAN1 - SCAN0));
  const revealAt = (x) => SCAN0 + ((x - X0) / (X1 - X0)) * (SCAN1 - SCAN0);

  // evidence cards
  const COLX = [-0.78, 0.0, 0.78];
  const cards = FINDINGS.map((f, i) => {
    const tex = texCard(THREE, f, i);
    const mat = new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: new THREE.Color(0xffffff), emissiveIntensity: 0.75, roughness: 0.3, metalness: 0.1, transparent: true, opacity: 0 });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.15), mat); m.castShadow = true; scene.add(m);
    const inCol = FINDINGS.slice(0, i).filter((x) => x.col === f.col).length;
    return {
      m, mat, f,
      reveal: revealAt(markers[i].pos.x),
      p0: markers[i].pos.clone().add(new THREE.Vector3(0, 0.02, 0)),
      p1: new THREE.Vector3(-0.96 + i * 0.48, 0.98 + (i % 2) * 0.05, 0.12),
      p2: new THREE.Vector3(COLX[f.col], TABLE_Y + 0.035 + inCol * 0.004, -0.12 + inCol * 0.2),
      p3: new THREE.Vector3(COLX[f.col], TABLE_Y + 0.016 + inCol * 0.002, -0.08 + inCol * 0.19)
    };
  });

  // the roadmap document the cards settle onto
  const paperMat = new THREE.MeshStandardMaterial({ map: texRoadmap(THREE), color: new THREE.Color(0x8d96a3), roughness: 0.9, metalness: 0, transparent: true, opacity: 0, envMapIntensity: 0.1 });
  const paper = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.3), paperMat); paper.rotation.x = -Math.PI / 2; paper.position.set(0, TABLE_Y + 0.006, 0.05); paper.receiveShadow = true; scene.add(paper);

  // distant points for depth
  const dp = [], dc = [], ds = [], dr = rand(77);
  for (let i = 0; i < 220; i++) { dp.push((dr() - 0.5) * 18, 0.2 + dr() * 4, -4 - dr() * 12); dc.push(0.45, 0.62, 1.3); ds.push(dr()); }
  const dGeo = new THREE.BufferGeometry(); dGeo.setAttribute('position', new THREE.Float32BufferAttribute(dp, 3)); dGeo.setAttribute('aColor', new THREE.Float32BufferAttribute(dc, 3)); dGeo.setAttribute('aSeed', new THREE.Float32BufferAttribute(ds, 1));
  const dMat = pointsMaterial(THREE); dMat.uniforms.uFog.value = 0.05; scene.add(new THREE.Points(dGeo, dMat));

  const qFlat = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0));
  const qFace = new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.42, 0, 0));
  const tmpQ = new THREE.Quaternion(), size = new THREE.Vector2();
  const colLabel = (i) => (t, v) => v.set(COLX[i], TABLE_Y + 0.02, -0.36);

  return {
    duration: L,
    floor: { tile: 0.8, base: 0x04070d, reflect: 0.8 },
    chapters: [{ start: 0, label: 'Inspect' }, { start: 5.5, label: 'Evidence' }, { start: 11, label: 'Prioritize' }, { start: 16.5, label: 'Roadmap' }],
    labels: [
      { text: 'Fix now', tone: 'accent', at: colLabel(0), alpha: (t) => smooth(11.8, 12.6, t) * (1 - smooth(16.6, 17.2, t)) },
      { text: 'Next 90 days', at: colLabel(1), alpha: (t) => smooth(12.0, 12.8, t) * (1 - smooth(16.6, 17.2, t)) },
      { text: 'Planned', at: colLabel(2), alpha: (t) => smooth(12.2, 13.0, t) * (1 - smooth(16.6, 17.2, t)) }
    ],
    fade: (t) => shotFade(SHOTS, t),
    update(t) {
      // scan
      const su = (t - SCAN0) / (SCAN1 - SCAN0);
      const scanning = su > 0 && su < 1;
      const bx = scanX(t);
      band.position.set(bx, TABLE_Y + 0.1, 0.02);
      band.material.color.set(ORANGE).multiplyScalar(scanning ? 1.4 * Math.sin(su * Math.PI) ** 0.4 : 0);
      scanLight.position.set(bx, TABLE_Y + 0.35, 0.2); scanLight.intensity = scanning ? 1.2 : 0;

      // sheets dim and sink away once the evidence has been pulled
      const away = smooth(6.5, 9.5, t);
      sheets.forEach((s, k) => {
        s.mat.opacity = 0.94 * (1 - away);
        s.mat.emissiveIntensity = 0.55 * (1 - 0.6 * away);
        s.m.visible = s.mat.opacity > 0.01;
        s.m.position.set(s.base.x, s.base.y - 0.02 * away, s.base.z - 0.15 * away);
      });
      markers.forEach((mk, i) => {
        const on = smooth(cards[i].reveal, cards[i].reveal + 0.25, t) * (1 - away);
        mk.mat.color.set(SEV[FINDINGS[i].sev]).multiplyScalar(1.6 * on);
        mk.m.visible = on > 0.01;
      });

      // cards: reveal -> lift to evidence row -> rank into columns -> settle on the roadmap
      cards.forEach((c, i) => {
        const st = i * 0.18;
        const a = smooth(c.reveal + 0.15, c.reveal + 0.6, t);
        const lift = smooth(5.7 + st, 7.6 + st, t);
        const rank = smooth(11.3 + st, 13.4 + st, t);
        const settle = smooth(16.9 + st * 0.5, 18.2 + st * 0.5, t);
        const p = c.m.position;
        p.copy(c.p0).lerp(c.p1, lift);
        if (rank > 0) p.lerp(c.p2, rank);
        if (settle > 0) p.lerp(c.p3, settle);
        p.y += Math.sin(lift * Math.PI) * 0.12 + Math.sin(rank * Math.PI) * 0.18;
        tmpQ.copy(qFlat).slerp(qFace, lift * (1 - rank));
        c.m.quaternion.copy(tmpQ);
        c.mat.opacity = a;
        c.mat.emissiveIntensity = 0.75 + 0.6 * Math.sin(lift * Math.PI) - 0.25 * settle;
        c.m.visible = a > 0.01;
      });

      paperMat.opacity = smooth(16.6, 17.8, t);
      paper.visible = paperMat.opacity > 0.01;
      key.intensity = 22 + 3 * smooth(16.6, 18, t);
      renderer.getDrawingBufferSize(size); dMat.uniforms.uTime.value = t; dMat.uniforms.uScale.value = size.y * 0.012;
    },
    camera(t, out) {
      shotCamera(SHOTS, [
        [[-1.4, 1.0, 1.3], [-0.3, 0.95, 1.22], [-0.6, TABLE_Y, -0.08], [0.45, TABLE_Y, -0.08], 28, -0.04],
        [[0.7, 1.15, 2.0], [0.25, 1.25, 1.85], [0.0, 0.82, 0.0], [0.0, 0.86, 0.0], 32, -0.1],
        [[0.15, 2.35, 1.55], [0.3, 2.45, 1.15], [0.0, TABLE_Y, 0.0], [0.0, TABLE_Y, 0.0], 32, -0.06],
        [[-1.35, 2.25, 2.75], [-0.95, 2.1, 2.4], [0.1, TABLE_Y, -0.05], [0.1, TABLE_Y, -0.05], 32, 0.06]
      ], t, out);
    }
  };
}
