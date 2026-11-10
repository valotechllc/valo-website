/* MSP white-label, as a real-time scene. Same story as the homepage MSP section (msp-section.css):
   a change request branded with the partner's name turns over to show VALO's engineering behind it,
   then turns back completed, with the handover documents attached.
   Twelve seconds, one continuous camera move, four chapters. Illustrative content, no customer data. */
export const MSP_DURATION = 12;
const clamp = (x) => Math.max(0, Math.min(1, x));
const smooth = (a, b, t) => { const u = clamp((t - a) / (b - a)); return u * u * (3 - 2 * u); };
const ease = (a, b, t) => 1 - (1 - clamp((t - a) / (b - a))) ** 3;

const MSP_BLUE = '#3d63dd', ORANGE = '#f26b1f', MINT = '#58c79a';
const MONO = '"JetBrains Mono", ui-monospace, monospace', SANS = 'Inter, system-ui, sans-serif';
const TW = 1600, TH = 1000; // card texture size (16:10, like the section's card)
const LINES = [
  ['fw-branch-01>', 'configure'],
  ['fw-branch-01#', 'set zone guest network layer3 ethernet1/3'],
  ['fw-branch-01#', 'set rulebase security rules staff-web action allow'],
  ['fw-branch-01#', 'set rulebase security rules guest-deny action deny'],
  ['fw-branch-01#', 'commit'],
  ['', 'Configuration committed successfully']
];
const TESTS = [['trust → untrust · ssl', 'staff-web', 'ALLOW'], ['guest → trust · any', 'guest-deny', 'DENY'], ['Rollback configuration', 'saved', 'READY']];
const FILES = ['as-built.pdf', 'running-config.xml', 'change-record.pdf'];
const lineAt = (k) => 3.75 + k * 0.36;          // when each command starts typing
const testAt = (k) => 6.35 + k * 0.45;          // when each test result lands

function rrect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }

/* Front: the ticket your customer sees. state 0 = scoping, 1 = completed. */
function drawFront(g, done) {
  g.clearRect(0, 0, TW, TH);
  rrect(g, 0, 0, TW, TH, 36); g.fillStyle = '#f5f7fa'; g.fill();
  g.fillStyle = MSP_BLUE; rrect(g, 84, 78, 84, 84, 14); g.fill();
  g.fillStyle = '#fff'; g.font = `700 34px ${SANS}`; g.textAlign = 'center'; g.fillText('YM', 126, 132); g.textAlign = 'left';
  g.fillStyle = '#0f1a2a'; g.font = `600 46px ${SANS}`; g.fillText('Your MSP', 194, 136);
  g.fillStyle = '#6b7788'; g.font = `500 24px ${MONO}`; g.textAlign = 'right'; g.fillText('SERVICE DESK', TW - 84, 132); g.textAlign = 'left';
  g.fillStyle = '#dfe4ec'; g.fillRect(84, 200, TW - 168, 3);
  g.fillStyle = MSP_BLUE; g.font = `600 24px ${MONO}`; g.fillText('CHANGE REQUEST', 84, 270);
  g.fillStyle = '#0f1a2a'; g.font = `500 66px ${SANS}`; g.fillText('Branch firewall replacement', 84, 352);
  const cols = [['CUSTOMER', 'Your customer'], ['ASSIGNED', 'Your MSP engineering'], ['STATUS', '']];
  cols.forEach(([k, v], i) => {
    const x = 84 + i * 500;
    g.fillStyle = '#6b7788'; g.font = `500 22px ${MONO}`; g.fillText(k, x, 438);
    g.fillStyle = '#1d2a3c'; g.font = `400 36px ${SANS}`; if (v) g.fillText(v, x, 490);
  });
  const chip = done ? 'Completed' : 'Scoping';
  g.font = `600 30px ${SANS}`; const cw = g.measureText(chip).width + 52;
  g.fillStyle = done ? '#dff3ea' : '#e6ecfb'; rrect(g, 1084, 452, cw, 54, 27); g.fill();
  g.fillStyle = done ? '#167a52' : MSP_BLUE; g.fillText(chip, 1110, 491);
  ['SCOPE', 'ENGINEER', 'VALIDATE', 'HAND OVER'].forEach((s, i) => {
    const x = 84 + i * 362, w = 340, on = done || i === 0;
    g.fillStyle = on ? (done ? '#2f9e6f' : MSP_BLUE) : '#d9dee6'; g.fillRect(x, 572, w, done || i > 0 ? 6 : 8);
    g.fillStyle = on ? '#1d2a3c' : '#8792a2'; g.font = `600 22px ${MONO}`; g.fillText(s, x, 622);
  });
  if (done) {
    FILES.forEach((f, i) => {
      const x = 84 + i * 470; g.fillStyle = '#ffffff'; rrect(g, x, 690, 440, 92, 14); g.fill();
      g.strokeStyle = '#cfd6e0'; g.lineWidth = 2; g.stroke();
      g.fillStyle = '#2f9e6f'; g.fillRect(x + 26, 718, 26, 36);
      g.fillStyle = '#1d2a3c'; g.font = `500 28px ${MONO}`; g.fillText(f, x + 72, 748);
    });
  } else {
    g.fillStyle = '#8792a2'; g.font = `400 32px ${SANS}`; g.fillText('Handover documents pending', 84, 750);
  }
  g.fillStyle = '#dfe4ec'; g.fillRect(84, 842, TW - 168, 3);
  g.fillStyle = '#6b7788'; g.font = `500 22px ${MONO}`; g.fillText('CUSTOMER-FACING  ·  DELIVERED BY YOUR MSP', 84, 904);
}

/* Back: VALO engineering behind the brand. chars[k] = characters typed on line k, tests = results shown. */
function drawBack(g, chars, tests) {
  g.clearRect(0, 0, TW, TH);
  rrect(g, 0, 0, TW, TH, 36); g.fillStyle = '#0b1526'; g.fill();
  g.strokeStyle = 'rgba(160,184,214,0.22)'; g.lineWidth = 3; rrect(g, 2, 2, TW - 4, TH - 4, 34); g.stroke();
  g.fillStyle = ORANGE; for (let i = 0; i < 4; i++) g.fillRect(84 + i * 15, 132 - i * 11, 8, 26 + i * 11);
  g.fillStyle = '#ffffff'; g.font = `700 44px ${SANS}`; g.fillText('VALO', 166, 132);
  g.fillStyle = '#b9c6d8'; g.font = `400 44px ${SANS}`; g.fillText('engineering', 296, 132);
  g.fillStyle = '#8fa2ba'; g.font = `500 24px ${MONO}`; g.textAlign = 'right'; g.fillText('BEHIND YOUR BRAND', TW - 84, 128); g.textAlign = 'left';
  g.fillStyle = 'rgba(160,184,214,0.18)'; g.fillRect(84, 186, TW - 168, 3);
  g.fillStyle = '#071022'; rrect(g, 84, 216, TW - 168, 356, 18); g.fill();
  g.font = `400 32px ${MONO}`;
  LINES.forEach(([p, cmd], k) => {
    const n = chars[k]; if (n <= 0) return;
    const y = 272 + k * 54; let x = 120;
    if (p) { g.fillStyle = ORANGE; g.fillText(p, x, y); x += g.measureText(p + ' ').width; }
    const shown = cmd.slice(0, n);
    g.fillStyle = k === LINES.length - 1 ? MINT : '#e4ebf5'; g.fillText(shown, x, y);
    if (n < cmd.length) { g.fillStyle = ORANGE; g.fillRect(x + g.measureText(shown).width + 4, y - 26, 16, 32); }
  });
  TESTS.forEach(([path, rule, res], k) => {
    const y = 604 + k * 92, on = tests[k];
    g.fillStyle = on ? 'rgba(88,199,154,0.10)' : 'rgba(160,184,214,0.05)'; rrect(g, 84, y, TW - 168, 76, 12); g.fill();
    g.strokeStyle = on ? 'rgba(88,199,154,0.55)' : 'rgba(160,184,214,0.16)'; g.lineWidth = 2; g.stroke();
    g.fillStyle = on ? '#dfe8f3' : '#5d6e84'; g.font = `400 30px ${MONO}`; g.fillText(path, 120, y + 49); g.fillText(rule, 760, y + 49);
    g.font = `700 30px ${MONO}`; g.textAlign = 'right'; g.fillStyle = on ? MINT : '#4b5a6e'; g.fillText(on ? res : '—', TW - 120, y + 51); g.textAlign = 'left';
  });
}

function drawFile(g, w, h, name) {
  g.clearRect(0, 0, w, h);
  rrect(g, 0, 0, w, h, 22); g.fillStyle = '#f5f7fa'; g.fill();
  g.fillStyle = '#2f9e6f'; g.fillRect(36, 40, 40, 54);
  g.fillStyle = '#1d2a3c'; g.font = `600 34px ${MONO}`; g.fillText(name, 100, 80);
  g.fillStyle = '#c9d1dc'; for (let i = 0; i < 3; i++) g.fillRect(36, 138 + i * 34, [w - 72, w - 180, w - 260][i], 10);
}

export function mspScene({ THREE, scene, renderer }) {
  scene.background.setHex(0x040a18); scene.fog.color.setHex(0x07122a); scene.fog.density = 0.05;
  scene.add(new THREE.HemisphereLight(0x22355c, 0x020308, 0.6));
  const key = new THREE.PointLight(0x9fb8e0, 2.4, 0, 2); key.position.set(-1.6, 2.6, 2.6); scene.add(key);
  const warm = new THREE.PointLight(0xf26b1f, 0, 3.0, 2); warm.position.set(0.9, 0.9, 1.0); scene.add(warm);
  const cool = new THREE.PointLight(0x58c79a, 0, 3.0, 2); cool.position.set(-0.6, 0.5, 1.0); scene.add(cool);
  const aniso = renderer.capabilities.getMaxAnisotropy();

  const canvasTex = (w, h) => {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = aniso;
    return { c, g: c.getContext('2d'), tx };
  };
  // card faces sit below the bloom threshold so the white ticket reads as paper, not a light
  const face = (tx, tint) => new THREE.MeshBasicMaterial({ map: tx, color: new THREE.Color(tint), transparent: true, toneMapped: false });

  const frontScope = canvasTex(TW, TH), frontDone = canvasTex(TW, TH), back = canvasTex(TW, TH);
  const paintFronts = () => { drawFront(frontScope.g, false); drawFront(frontDone.g, true); frontScope.tx.needsUpdate = frontDone.tx.needsUpdate = true; };
  paintFronts();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { paintFronts(); backKey = ''; });

  // the card: a thin physical slab with printed faces and a lit edge
  const CW = 2.0, CH = 1.25, CD = 0.028;
  const pivot = new THREE.Group(); pivot.position.set(0, 1.0, 0); pivot.scale.setScalar(0.74); scene.add(pivot);
  const card = new THREE.Group(); pivot.add(card);
  const shape = new THREE.Shape(); const r = 0.045, hw = CW / 2, hh = CH / 2;
  shape.moveTo(-hw + r, -hh); shape.lineTo(hw - r, -hh); shape.quadraticCurveTo(hw, -hh, hw, -hh + r); shape.lineTo(hw, hh - r); shape.quadraticCurveTo(hw, hh, hw - r, hh);
  shape.lineTo(-hw + r, hh); shape.quadraticCurveTo(-hw, hh, -hw, hh - r); shape.lineTo(-hw, -hh + r); shape.quadraticCurveTo(-hw, -hh, -hw + r, -hh);
  const bodyGeo = new THREE.ExtrudeGeometry(shape, { depth: CD, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 2, curveSegments: 10 }); bodyGeo.translate(0, 0, -CD / 2);
  card.add(new THREE.Mesh(bodyGeo, new THREE.MeshStandardMaterial({ color: 0x1a2a40, metalness: 0.6, roughness: 0.32 })));
  const edgeMat = new THREE.MeshBasicMaterial({ color: 0xf26b1f, transparent: true, opacity: 0.0, toneMapped: false, depthWrite: false });
  const edge = new THREE.Mesh(new THREE.ShapeGeometry(shape, 10), edgeMat); edge.scale.set(1.012, 1.02, 1); card.add(edge); // a rim seen only edge-on
  const faceGeo = new THREE.PlaneGeometry(CW, CH);
  const frontMat = face(frontScope.tx, 0xd8dde4);
  const frontMesh = new THREE.Mesh(faceGeo, frontMat); frontMesh.position.z = CD / 2 + 0.006; card.add(frontMesh);
  const backMesh = new THREE.Mesh(faceGeo, face(back.tx, 0xffffff)); backMesh.rotation.y = Math.PI; backMesh.position.z = -CD / 2 - 0.006; card.add(backMesh);

  // validation blade: crosses the test rows on the back
  const bladeMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0x9fe6c6).multiplyScalar(1.6), transparent: true, opacity: 0, toneMapped: false, depthWrite: false });
  const blade = new THREE.Mesh(new THREE.PlaneGeometry(0.012, CH * 0.36), bladeMat); blade.rotation.y = Math.PI; blade.position.set(0, -CH * 0.24, -CD / 2 - 0.014); card.add(blade);

  // queue of other change requests, dim, behind: the desk is busy, this one is ours
  const ghostMat = face(frontScope.tx, 0x2a3446); ghostMat.opacity = 0.18;
  [[-1.25, 0.72, -1.25, 0.18], [1.35, 0.66, -1.6, -0.22]].forEach(([x, y, z, ry]) => { const m = new THREE.Mesh(faceGeo, ghostMat); m.position.set(x, y, z); m.rotation.set(-0.12, ry, 0); m.scale.setScalar(0.9); scene.add(m); });

  // handover documents leave the card and settle in front of it
  const files = FILES.map((name, i) => {
    const t = canvasTex(640, 300); drawFile(t.g, 640, 300, name); t.tx.needsUpdate = true;
    const g = new THREE.Group(); scene.add(g);
    const slab = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.27, 0.012), new THREE.MeshStandardMaterial({ color: 0x1a2a40, metalness: 0.5, roughness: 0.35 })); g.add(slab);
    const top = new THREE.Mesh(new THREE.PlaneGeometry(0.58, 0.27), face(t.tx, 0xd8dde4)); top.position.z = 0.0075; g.add(top);
    const glowMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0x58c79a).multiplyScalar(1.4), transparent: true, opacity: 0, toneMapped: false });
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(0.58, 0.008), glowMat); glow.position.set(0, -0.142, 0.008); g.add(glow);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { drawFile(t.g, 640, 300, name); t.tx.needsUpdate = true; });
    return { g, glowMat, x: (i - 1) * 0.66 };
  });

  let backKey = null;
  const paintBack = (t) => {
    const chars = LINES.map(([, cmd], k) => Math.floor(clamp((t - lineAt(k)) / (k === 1 || k === 2 || k === 3 ? 0.32 : 0.18)) * cmd.length));
    if (t < 3.0 || t > 9.8) chars.fill(t > 9.8 ? 999 : 0);
    const tests = TESTS.map((_, k) => t >= testAt(k) && t <= 9.8 || t > 9.8);
    const k = chars.join(',') + tests.join('');
    if (k === backKey) return; backKey = k;
    drawBack(back.g, chars, tests); back.tx.needsUpdate = true;
  };

  const path = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-1.85, 1.66, 3.75), new THREE.Vector3(-0.9, 1.62, 3.6), new THREE.Vector3(0.65, 1.55, 3.4),
    new THREE.Vector3(0.85, 1.42, 3.2), new THREE.Vector3(0.45, 1.62, 3.6), new THREE.Vector3(-0.25, 1.74, 3.95)
  ]);
  const look = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.0, 1.1, 0), new THREE.Vector3(0.0, 1.1, 0), new THREE.Vector3(0.05, 1.08, 0),
    new THREE.Vector3(0.08, 0.96, 0), new THREE.Vector3(0.15, 1.02, 0.05), new THREE.Vector3(0.2, 1.06, 0.05)
  ]);
  const topOfCard = new THREE.Vector3();
  const labelAt = (dy) => (t, v) => { card.updateMatrixWorld(); v.copy(topOfCard.set(0, CH / 2 + dy, 0)).applyMatrix4(card.matrixWorld); };

  return {
    duration: MSP_DURATION,
    floor: { tile: 0.8, base: 0x050b18, reflect: 0.8 },
    bloom: 0.36,
    chapters: [{ start: 0, label: 'Scope' }, { start: 3, label: 'Engineer' }, { start: 6, label: 'Validate' }, { start: 9, label: 'Hand over' }],
    labels: [
      { text: 'Your customer sees your MSP', tone: 'ok', at: labelAt(0.12), alpha: (t) => smooth(0.9, 1.3, t) * (1 - smooth(2.4, 2.7, t)) },
      { text: 'Behind your brand · VALO engineering', tone: 'accent', at: labelAt(0.12), alpha: (t) => smooth(3.9, 4.3, t) * (1 - smooth(5.6, 5.9, t)) },
      { text: 'Allowed and denied as expected · rollback ready', tone: 'ok', at: labelAt(0.12), alpha: (t) => smooth(7.6, 8.0, t) * (1 - smooth(8.5, 8.75, t)) },
      { text: 'Handed over under your name', tone: 'ok', at: labelAt(0.12), alpha: (t) => smooth(10.4, 10.8, t) * (1 - smooth(11.5, 11.8, t)) }
    ],
    fade(t) { return smooth(0, 0.35, t) * (1 - smooth(11.65, 12, t)); },
    update(t) {
      const flipOut = smooth(2.65, 3.7, t), flipBack = smooth(8.75, 9.8, t);
      const turning = Math.sin(Math.PI * flipOut) + Math.sin(Math.PI * flipBack);
      pivot.position.y = 1.0 + 0.04 * turning + 0.01 * Math.sin(t * 1.1);
      pivot.position.x = -0.42 * ease(9.3, 10.3, t) * (1 - smooth(11.7, 12, t));
      pivot.rotation.x = -0.16 - 0.04 * turning;
      card.rotation.y = Math.PI * (flipOut + flipBack) + 0.05 * Math.sin(t * 0.5);
      edgeMat.opacity = 0.15 + 0.85 * turning;
      warm.intensity = 2.2 * turning + 0.6 * smooth(3.7, 4.2, t) * (1 - smooth(8.6, 9.0, t));
      frontMat.map = t < 6 ? frontScope.tx : frontDone.tx;
      paintBack(t);
      // validation blade over the test rows
      const bu = clamp((t - 6.2) / 1.5); blade.position.x = -(-CW * 0.42 + CW * 0.84 * bu); bladeMat.opacity = (t > 6.2 && t < 7.75) ? 0.9 * Math.sin(Math.PI * bu) + 0.1 : 0;
      cool.intensity = 2.0 * smooth(6.3, 7.0, t) * (1 - smooth(8.4, 8.9, t)) + 1.6 * smooth(10.0, 10.6, t);
      // the handover documents slide out of the card and line up beside it, as attachments to the ticket
      files.forEach((f, i) => {
        const u = ease(9.55 + i * 0.18, 10.4 + i * 0.18, t);
        const sx = pivot.position.x, sy = pivot.position.y, sz = -0.04;
        const ex = 0.98, ey = 1.3 - i * 0.3, ez = 0.1;
        f.g.position.set(sx + (ex - sx) * u, sy + (ey - sy) * u, sz + (ez - sz) * u + 0.12 * Math.sin(Math.PI * u));
        f.g.rotation.set(pivot.rotation.x, -0.12 * u, 0);
        f.g.scale.setScalar(0.62 + 0.28 * u);
        f.g.visible = t > 9.5;
        f.glowMat.opacity = smooth(10.3 + i * 0.18, 10.7 + i * 0.18, t);
      });
    },
    camera(t, out) {
      const u = clamp(t / MSP_DURATION);
      path.getPoint(u, out.pos); look.getPoint(u, out.target);
      // portrait screens: the stage dollies back to fit a 16:9 frame; the card alone can sit closer
      if (window.innerWidth < window.innerHeight) out.pos.sub(out.target).multiplyScalar(0.62).add(out.target);
      out.pos.x += Math.sin(t * 0.7) * 0.006; out.pos.y += Math.sin(t * 0.9 + 1) * 0.004;
      out.fov = 34; out.shift = 0;
    }
  };
}
