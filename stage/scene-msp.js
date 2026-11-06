/* Film D, white-label MSP engineering, as a real-time scene (v4: the office).
   Story (22 s loop): an MSP's generalist IT team works routine tickets from their cubicles while
   Cisco and Palo Alto work piles up in a specialist backlog on the board -> the empty cubicle lights
   up and a specialist joins, wearing the MSP's colours -> each backlog card is worked and checked,
   turns the MSP's navy and moves to Done -> the finished work goes out to the MSP's clients in its name.
   Stylised, people are abstract figures, no vendor hardware. All values are functions of scene time t. */
import { smooth, clamp01 } from './stage.js';
import { canvasTex, rand, shotCamera, shotFade } from './lib.js';

const L = 22;
const SHOTS = [0, 5.5, 11, 16.5, L];
const NAVY = 0x24467f, ORANGE = 0xd24305, BEIGE = 0xf3ead9;
const DESKS = [-1.9, -0.95, 0.0, 0.95, 1.9];   // the last cubicle starts empty
const SPEC = 4;
const ROW_Z = -0.25;
const WALL_Z = -1.6;
const BOARD = { x: 0.55, y: 1.35, w: 3.0, h: 1.0 };
const ROUTINE_TITLES = ['Password reset', 'New laptop', 'Printer offline', 'M365 licence', 'Shared drive', 'New starter', 'Phone setup', 'VPN client'];
const SPEC_TITLES = ['PAN-OS upgrade', 'Switch migration', 'VPN redesign', 'ISE policy', 'Rule cleanup', 'BGP failover'];

function texCard(THREE, title, tag, bg, fg, accent) {
  return canvasTex(THREE, 320, 200, (g, w, h) => {
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    g.fillStyle = accent; g.fillRect(0, 0, w, 14);
    g.font = '600 36px Inter, sans-serif'; g.fillStyle = fg; g.fillText(title, 18, 92);
    g.font = '500 24px "JetBrains Mono", monospace'; g.fillStyle = accent; g.fillText(tag, 18, 160);
  });
}
function texBoard(THREE) {
  return canvasTex(THREE, 1024, 460, (g, w, h) => {
    g.fillStyle = '#fbf8f2'; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(36,70,127,0.35)'; g.lineWidth = 3; g.strokeRect(2, 2, w - 4, h - 4);
    const cols = [['ROUTINE', '#24467f'], ['SPECIALIST BACKLOG', '#d24305'], ['DONE', '#24467f']];
    cols.forEach(([t, c], i) => {
      const x = i * w / 3;
      if (i) { g.fillStyle = 'rgba(36,70,127,0.18)'; g.fillRect(x - 1, 20, 2, h - 40); }
      g.font = '600 26px "JetBrains Mono", monospace'; g.fillStyle = c; g.fillText(t, x + 22, 52);
      g.fillStyle = c; g.globalAlpha = 0.5; g.fillRect(x + 22, 66, w / 3 - 44, 3); g.globalAlpha = 1;
    });
  });
}
function texScreen(THREE, line, bg) {
  return canvasTex(THREE, 256, 256, (g, w, h) => {
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    const r = rand(3);
    for (let y = 16; y < h; y += 22) { g.fillStyle = line; g.globalAlpha = 0.5 + r() * 0.5; g.fillRect(16, y, 40 + r() * 170, 9); }
    g.globalAlpha = 1;
  }, { repeat: [1, 1] });
}

export function mspScene(ctx) {
  const { THREE, scene } = ctx;
  scene.fog.density = 0.02;
  scene.background.setHex(0xd9c6ae); scene.fog.color.setHex(0xd4bfa5); // per-scene tint: warm clay office
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const r = rand(14);

  scene.add(new THREE.HemisphereLight(0xfff6e8, 0x9a8a70, 0.55));
  const key = new THREE.DirectionalLight(0xfff1dc, 0.9); key.position.set(-2, 4, 3); scene.add(key);
  const specLamp = new THREE.PointLight(0xff8a4c, 0, 1.6, 2); specLamp.position.set(DESKS[SPEC], 0.75, ROW_Z - 0.1); scene.add(specLamp);

  const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.75, metalness: 0.05, ...o });
  const box = (w, h, d, m, x, y, z, parent = scene) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); parent.add(b); return b; };

  // ---------- room: carpet, back wall with a window, client buildings outside ----------
  box(5.6, 0.004, 2.6, mat(0x8a5a3b, { roughness: 0.55 }), 0, 0.002, -0.35);
  const wallM = mat(0xf4ede2);
  const WALL_H = 2.0;
  const WIN = { x0: -2.75, x1: -1.15, y0: 0.75, y1: 1.85 };
  box(0.25, WALL_H, 0.06, wallM, -2.875, WALL_H / 2, WALL_Z);
  box(WIN.x1 - WIN.x0, WIN.y0, 0.06, wallM, (WIN.x0 + WIN.x1) / 2, WIN.y0 / 2, WALL_Z);
  box(WIN.x1 - WIN.x0, WALL_H - WIN.y1, 0.06, wallM, (WIN.x0 + WIN.x1) / 2, (WIN.y1 + WALL_H) / 2, WALL_Z);
  box(3.0 - WIN.x1, WALL_H, 0.06, wallM, (WIN.x1 + 3.0) / 2, WALL_H / 2, WALL_Z);
  const frameM = mat(NAVY, { roughness: 0.5 });
  [[WIN.x0, (WIN.y0 + WIN.y1) / 2, 0.025, WIN.y1 - WIN.y0], [WIN.x1, (WIN.y0 + WIN.y1) / 2, 0.025, WIN.y1 - WIN.y0], [(WIN.x0 + WIN.x1) / 2, (WIN.y0 + WIN.y1) / 2, 0.02, WIN.y1 - WIN.y0]].forEach(([x, y, w, h]) => box(w, h, 0.07, frameM, x, y, WALL_Z));
  [[WIN.y0], [WIN.y1]].forEach(([y]) => box(WIN.x1 - WIN.x0, 0.025, 0.07, frameM, (WIN.x0 + WIN.x1) / 2, y, WALL_Z));
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(WIN.x1 - WIN.x0, WIN.y1 - WIN.y0), new THREE.MeshBasicMaterial({ color: 0xcfe0f2, transparent: true, opacity: 0.22, depthWrite: false }));
  glass.position.set((WIN.x0 + WIN.x1) / 2, (WIN.y0 + WIN.y1) / 2, WALL_Z); scene.add(glass);
  // the MSP's clients, seen through the window
  const buildings = [[-2.55, 0.95, -3.0], [-2.2, 1.3, -3.6], [-1.85, 1.1, -3.1], [-1.5, 1.45, -3.8], [-1.25, 1.0, -3.2]].map(([x, h, z]) => {
    const b = box(0.32, h, 0.32, mat(0x9fb3cf), x, h / 2, z);
    const beaconM = new THREE.MeshBasicMaterial({ color: NAVY, transparent: true, opacity: 0 });
    const beacon = new THREE.Mesh(new THREE.RingGeometry(0.06, 0.09, 32), beaconM); beacon.rotation.x = -Math.PI / 2; beacon.position.set(x, h + 0.01, z); scene.add(beacon);
    return { b, top: V(x, h + 0.03, z), beacon, beaconM };
  });

  // ---------- the board ----------
  const board = new THREE.Mesh(new THREE.PlaneGeometry(BOARD.w, BOARD.h), new THREE.MeshBasicMaterial({ map: texBoard(THREE) }));
  board.position.set(BOARD.x, BOARD.y, WALL_Z + 0.035); scene.add(board);
  const colX = (c) => BOARD.x - BOARD.w / 2 + (c + 0.5) * BOARD.w / 3;
  const slotOnBoard = (c, k) => V(colX(c) + ((k % 2) - 0.5) * 0.46, BOARD.y + 0.2 - Math.floor(k / 2) * 0.27, WALL_Z + 0.05);

  // ---------- cubicles, people, screens ----------
  const partM = mat(0x2c3e63, { roughness: 0.9 }), deskM = mat(0xd9b98c, { roughness: 0.5 }), monM = mat(0x1a2236, { roughness: 0.4 }), chairM = mat(0x2f3b52);
  const shirtM = mat(0x1d3a6e, { roughness: 0.6 }), headM = mat(0xf2ece4, { roughness: 0.6 });
  const scrTexN = texScreen(THREE, '#9cc0ff', '#13203a'), scrTexS = texScreen(THREE, '#ffb48a', '#2a1408');
  const desks = DESKS.map((x, i) => {
    const g = new THREE.Group(); g.position.set(x, 0, ROW_Z); scene.add(g);
    box(0.03, 0.5, 0.62, partM, -0.44, 0.25, -0.05, g); if (i === DESKS.length - 1) box(0.03, 0.5, 0.62, partM, 0.44, 0.25, -0.05, g);
    box(0.88, 0.5, 0.03, partM, 0, 0.25, -0.36, g);
    box(0.74, 0.03, 0.34, deskM, 0, 0.36, -0.17, g);
    box(0.3, 0.19, 0.02, monM, 0, 0.5, -0.27, g);
    const scrM = new THREE.MeshBasicMaterial({ map: i === SPEC ? scrTexS : scrTexN, color: 0x000000 });
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.27, 0.16), scrM); scr.position.set(0, 0.5, -0.258); g.add(scr);
    box(0.2, 0.03, 0.2, chairM, 0, 0.22, 0.12, g); box(0.2, 0.22, 0.03, chairM, 0, 0.34, 0.22, g);
    // the person: abstract figure, back to camera, wearing the MSP's navy
    const person = new THREE.Group(); person.position.set(0, 0.24, 0.1); g.add(person);
    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.065, 0.14, 6, 12), shirtM); torso.position.y = 0.16; person.add(torso);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.055, 16, 12), headM); head.position.y = 0.33; person.add(head);
    const glowM = new THREE.MeshBasicMaterial({ color: ORANGE, transparent: true, opacity: 0, depthWrite: false });
    const glow = new THREE.Mesh(new THREE.RingGeometry(0.22, 0.25, 48), glowM); glow.rotation.x = -Math.PI / 2; glow.position.set(0, 0.006, 0.05); g.add(glow);
    return { g, scrM, person, glow, glowM, deskTop: V(x, 0.39, ROW_Z - 0.12) };
  });

  // ---------- cards ----------
  const cardGeo = new THREE.PlaneGeometry(0.4, 0.25);
  const card = (tex) => { const m = new THREE.Mesh(cardGeo, new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false })); scene.add(m); return m; };
  // routine: board -> a generalist's desk, all loop long
  const routine = ROUTINE_TITLES.map((t, i) => ({ m: card(texCard(THREE, t, 'ROUTINE', '#eef3fb', '#13203a', '#24467f')), desk: i % SPEC, phase: i * 0.62, period: 4.96 }));
  // specialist: queue on the board -> specialist desk -> worked -> navy -> Done -> out to a client
  const spec = SPEC_TITLES.map((t, k) => ({
    k, m: card(texCard(THREE, t, 'CISCO / PALO ALTO', '#fff1e6', '#3a1606', '#d24305')),
    texDone: texCard(THREE, t, 'DONE  ·  YOUR MSP', '#eef3fb', '#13203a', '#24467f'),
    appear: 0.5 + k * 0.7, fly: 6.2 + k * 0.45, worked: 11.2 + k * 0.6, done: 13.0 + k * 0.45, out: 17.0 + k * 0.5, bld: k % buildings.length
  }));
  spec.forEach((s) => { s.texOpen = s.m.material.map; });
  const deskStack = (k) => desks[SPEC].deskTop.clone().add(V(-0.2 + (k % 3) * 0.2, 0.004 + Math.floor(k / 3) * 0.004, 0.02));
  const arc = (a, b, u, h) => V(a.x + (b.x - a.x) * u, a.y + (b.y - a.y) * u + Math.sin(u * Math.PI) * h, a.z + (b.z - a.z) * u);
  const qBoard = new THREE.Quaternion(), qDesk = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0)), qTmp = new THREE.Quaternion();
  const winPt = V(-1.95, 1.3, WALL_Z - 0.05);
  const tmp = V(0, 0, 0);

  return {
    duration: L,
    floor: { tile: 0.7, base: 0x6e4a33, reflect: 0.25 },
    vignette: 0,
    bloom: 0.06,
    exposure: 0.85,
    chapters: [{ start: 0, label: 'Backlog' }, { start: 5.5, label: 'Specialist' }, { start: 11, label: 'Validate' }, { start: 16.5, label: 'Hand over' }],
    labels: [
      { text: 'Your generalist team', at: (t, v) => v.set(-0.95, 0.95, ROW_Z), alpha: (t) => smooth(0.6, 1.2, t) * (1 - smooth(4.8, 5.3, t)) },
      { text: 'Cisco & Palo Alto backlog', tone: 'accent', at: (t, v) => v.set(colX(1), BOARD.y + BOARD.h / 2 + 0.1, WALL_Z + 0.05), alpha: (t) => smooth(2.4, 3.0, t) * (1 - smooth(5.0, 5.5, t)) },
      { text: 'Specialist · in your colours', tone: 'accent', at: (t, v) => v.set(DESKS[SPEC], 0.95, ROW_Z), alpha: (t) => smooth(6.2, 6.8, t) * (1 - smooth(10.5, 11.0, t)) },
      { text: 'Backlog cleared', tone: 'ok', at: (t, v) => v.set(colX(1), BOARD.y + BOARD.h / 2 + 0.1, WALL_Z + 0.05), alpha: (t) => smooth(15.4, 15.9, t) * (1 - smooth(16.3, 16.6, t)) },
      { text: 'Delivered in your name', tone: 'ok', at: (t, v) => v.set(-1.95, WIN.y1 + 0.1, WALL_Z), alpha: (t) => smooth(18.0, 18.6, t) * (1 - smooth(21.2, 21.7, t)) }
    ],
    fade: (t) => shotFade(SHOTS, t),
    update(t) {
      // people work; screens scroll
      scrTexN.offset.y = (t * 0.35) % 1; scrTexS.offset.y = (t * 0.5) % 1;
      const join = smooth(5.7, 6.6, t);
      desks.forEach((d, i) => {
        const spec_ = i === SPEC;
        const on = spec_ ? join : 1;
        d.person.visible = on > 0.01;
        d.person.scale.setScalar(spec_ ? 0.6 + 0.4 * on : 1);
        d.person.position.y = 0.24 + Math.sin(t * 3 + i * 1.7) * 0.004;
        d.person.children[1].rotation.y = Math.sin(t * 0.7 + i) * 0.3;
        d.scrM.color.setScalar(spec_ ? 0.15 + 0.85 * on : 1);
        d.glowM.opacity = spec_ ? 0.85 * join * (1 - smooth(16.6, 17.6, t) * 0.7) : 0;
      });
      specLamp.intensity = 1.4 * join * (1 - smooth(16.6, 17.6, t) * 0.6);

      // routine cards: board -> generalist desk
      routine.forEach((rc) => {
        const u = (((t + rc.phase) % rc.period) + rc.period) % rc.period / 1.6;
        const m = rc.m;
        if (u < 1) {
          const from = slotOnBoard(0, 2), to = desks[rc.desk].deskTop;
          m.position.copy(arc(from, to, smooth(0, 1, u), 0.35));
          m.quaternion.copy(qBoard).slerp(qDesk, smooth(0.6, 1, u));
          m.material.opacity = Math.min(smooth(0, 0.12, u), 1 - smooth(0.85, 1, u));
        } else m.material.opacity = 0;
        m.visible = m.material.opacity > 0.01;
      });

      // specialist cards
      spec.forEach((s) => {
        const m = s.m, k = s.k;
        let op = 1;
        const onBoard = slotOnBoard(1, k), onDesk = deskStack(k), inDone = slotOnBoard(2, k);
        m.material.map = s.texOpen;
        if (t < s.appear) op = 0;
        else if (t < s.fly) {
          m.position.copy(onBoard); m.quaternion.copy(qBoard);
          op = smooth(s.appear, s.appear + 0.3, t);
          m.position.x += Math.sin(t * 7 + k) * 0.003 * smooth(2.5, 5.0, t);   // the backlog ages and jitters
        } else if (t < s.fly + 1.1) {
          const u = smooth(s.fly, s.fly + 1.1, t);
          m.position.copy(arc(onBoard, onDesk, u, 0.4)); m.quaternion.copy(qBoard).slerp(qDesk, smooth(0.55, 1, u));
        } else if (t < s.done) {
          m.position.copy(onDesk); m.quaternion.copy(qDesk);
          if (t > s.worked) m.material.map = s.texDone; else m.material.map = s.texOpen;
          m.position.y += t > s.worked && t < s.worked + 0.35 ? Math.sin((t - s.worked) / 0.35 * Math.PI) * 0.06 : 0;
        } else if (t < s.done + 1.0) {
          const u = smooth(s.done, s.done + 1.0, t);
          m.material.map = s.texDone;
          m.position.copy(arc(onDesk, inDone, u, 0.4)); m.quaternion.copy(qDesk).slerp(qBoard, smooth(0, 0.5, u));
        } else if (t < s.out) { m.position.copy(inDone); m.quaternion.copy(qBoard); m.material.map = s.texDone; }
        else if (t < s.out + 1.6) {
          const u = smooth(s.out, s.out + 1.6, t), b = buildings[s.bld];
          m.material.map = s.texDone;
          const p = u < 0.5 ? arc(inDone, winPt, u / 0.5, 0.25) : arc(winPt, b.top, (u - 0.5) / 0.5, 0.3);
          m.position.copy(p); m.quaternion.copy(qBoard);
          op = 1 - smooth(0.9, 1, u);
        } else op = 0;
        m.material.opacity = op; m.visible = op > 0.01;
      });
      // client buildings light up as work arrives
      buildings.forEach((b, i) => {
        let v = 0;
        spec.forEach((s) => { if (s.bld === i) { const a = t - (s.out + 1.45); if (a > 0 && a < 1.2) v = Math.max(v, 1 - a / 1.2); } });
        b.beacon.scale.setScalar(1 + (1 - v) * 2.2); b.beaconM.opacity = v * 0.9;
      });
    },
    camera(t, out) {
      shotCamera(SHOTS, [
        // backlog: the whole office, board above the cubicles
        [[0.4, 2.0, 4.9], [0.15, 1.95, 4.6], [0.3, 1.2, -1.2], [0.3, 1.2, -1.2], 34, -0.06],
        // specialist: the end cubicle and the backlog column
        [[2.6, 1.75, 3.1], [2.25, 1.7, 2.85], [1.0, 1.15, -1.2], [0.95, 1.15, -1.25], 34, -0.04],
        // validate: the board up close as cards move to Done
        [[1.6, 1.6, 2.4], [1.2, 1.65, 2.2], [0.9, 1.15, -1.6], [0.8, 1.2, -1.6], 32, 0.06],
        // hand over: toward the window as work goes out to clients
        [[-0.4, 1.8, 3.6], [-0.3, 1.95, 4.1], [-1.4, 1.05, -1.8], [-1.3, 1.05, -1.8], 34, 0.05]
      ], t, out);
    }
  };
}
