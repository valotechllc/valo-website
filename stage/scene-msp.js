/* Film D, white-label MSP engineering, as a real-time scene (v3: the backlog, beneath the surface).
   Story (22 s loop): client tickets flow to the MSP's team; routine work is handled but Cisco and
   Palo Alto tickets pile up as a backlog -> beneath the glass floor, a specialist layer works them ->
   finished tickets rise back through the floor, taking the MSP's colour as they cross the surface ->
   the MSP's team delivers them to its clients; nothing orange ever reaches a client.
   No vendor hardware is modelled. All values are functions of scene time t. */
import { smooth, clamp01 } from './stage.js';
import { canvasTex, rand, shotCamera, shotFade } from './lib.js';

const L = 22;
const SHOTS = [0, 5.5, 11, 16.5, L];
const ORANGE = 0xd24305, ICE = 0x2f5fb3, MSP = 0x24467f;   // beige scene: the MSP's colour is navy

const CLIENTS = [[-2.1, -1.0], [-1.35, -1.45], [-0.45, -1.7], [0.45, -1.7], [1.35, -1.45], [2.1, -1.0]];
const SLOTS = [-0.9, -0.3, 0.3, 0.9];          // the MSP's team, x positions at z = SLOT_Z
const SLOT_Z = 0.35;
const STACK = [1.6, 0.35];                      // backlog pile (x, z)
const BENCH_Y = -1.35;                          // the specialist layer beneath the floor
const N_SPEC = 6;
const BENCH = Array.from({ length: N_SPEC }, (_, k) => [1.05 + (k % 3) * 0.42, 0.05 + Math.floor(k / 3) * 0.42]);

export function mspScene(ctx) {
  const { THREE, scene, renderer } = ctx;
  scene.fog.density = 0.03;
  scene.background.setHex(0xf3ead9); scene.fog.color.setHex(0xefe5d2); // per-scene tint: beige
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const r = rand(9);

  scene.add(new THREE.HemisphereLight(0xfff6e8, 0xb9a98e, 1.4));
  const fill = new THREE.PointLight(0xffffff, 3.0, 0, 2); fill.position.set(0, 2.4, 3.2); scene.add(fill);
  const under = new THREE.PointLight(ORANGE, 0, 3.5, 2); under.position.set(1.4, -0.35, 0.3); scene.add(under);

  // ---------- above: clients and the MSP's team ----------
  const clients = CLIENTS.map(([x, z], i) => {
    const g = new THREE.Group(); g.position.set(x, 0.01, z); scene.add(g);
    const rMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.006, 8, 56), rMat); ring.rotation.x = Math.PI / 2; g.add(ring);
    const cMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.04, 0), cMat); core.position.y = 0.14; g.add(core);
    const pMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, depthWrite: false });
    const ripple = new THREE.Mesh(new THREE.RingGeometry(0.15, 0.165, 56), pMat); ripple.rotation.x = -Math.PI / 2; ripple.position.y = 0.006; g.add(ripple);
    return { g, rMat, cMat, pMat, ripple, core, pos: V(x, 0.16, z), last: -9 };
  });
  const slots = SLOTS.map((x) => {
    const g = new THREE.Group(); g.position.set(x, 0, SLOT_Z); scene.add(g);
    const tMat = new THREE.MeshStandardMaterial({ color: 0xdfe6f2, metalness: 0.1, roughness: 0.5, emissive: new THREE.Color(MSP), emissiveIntensity: 0.05 });
    const under = new THREE.MeshStandardMaterial({ color: 0x24467f, metalness: 0.2, roughness: 0.4, emissive: new THREE.Color(0x24467f), emissiveIntensity: 0.35 });
    const tile = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.035, 0.26), [tMat, tMat, tMat, under, tMat, tMat]); tile.position.y = 0.018; g.add(tile);
    const eMat = new THREE.LineBasicMaterial({ color: 0x000000 });
    const edge = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(0.4, 0.035, 0.26)), eMat); edge.position.y = 0.018; g.add(edge);
    const hMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const head = new THREE.Mesh(new THREE.OctahedronGeometry(0.05, 0), hMat); head.position.y = 0.2; g.add(head);
    return { g, eMat, hMat, head, pos: V(x, 0.12, SLOT_Z), busy: 0 };
  });

  // ---------- the glass surface, seen from below ----------
  const gridTex = canvasTex(THREE, 512, 512, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.strokeStyle = 'rgba(160,190,255,0.55)'; g.lineWidth = 2;
    for (let i = 0; i <= 8; i++) { const p = i * w / 8; g.beginPath(); g.moveTo(p, 0); g.lineTo(p, h); g.stroke(); g.beginPath(); g.moveTo(0, p); g.lineTo(w, p); g.stroke(); }
  }, { srgb: false, repeat: [6, 6] });
  const glassMat = new THREE.MeshBasicMaterial({ map: gridTex, color: 0x000000, transparent: true, depthWrite: false, side: THREE.BackSide });
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(9, 9), glassMat); glass.rotation.x = -Math.PI / 2; glass.position.y = -0.004; scene.add(glass);

  const crossRings = SLOTS.map((x) => {
    const mat = new THREE.MeshBasicMaterial({ color: 0x24467f, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide });
    const m = new THREE.Mesh(new THREE.RingGeometry(0.1, 0.13, 48), mat); m.rotation.x = -Math.PI / 2; m.position.set(x, -0.006, SLOT_Z); scene.add(m);
    return { m, mat };
  });

  // ---------- below: the specialist layer ----------
  const below = new THREE.Group(); scene.add(below);
  const deckMat = new THREE.MeshStandardMaterial({ color: 0xfbf4ec, metalness: 0.4, roughness: 0.3, emissive: new THREE.Color(ORANGE), emissiveIntensity: 0.0 });
  const deck = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.04, 1.0), deckMat); deck.position.set(1.47, BENCH_Y - 0.02, 0.26); below.add(deck);
  const dEdgeMat = new THREE.LineBasicMaterial({ color: 0x000000 });
  const dEdge = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1.45, 0.04, 1.0)), dEdgeMat); dEdge.position.copy(deck.position); below.add(dEdge);
  const lowGrid = new THREE.GridHelper(6, 24, 0x000000, 0x000000); lowGrid.position.y = -1.9;
  lowGrid.material.transparent = true; lowGrid.material.depthWrite = false; below.add(lowGrid);
  // threads of light linking the layer up to the underside of the floor
  const th = [], tr = rand(4);
  for (let i = 0; i < 46; i++) { const x = 0.6 + tr() * 1.9, z = -0.35 + tr() * 1.2; th.push(x, BENCH_Y, z, x, -0.01, z); }
  const thGeo = new THREE.BufferGeometry(); thGeo.setAttribute('position', new THREE.Float32BufferAttribute(th, 3));
  const thMat = new THREE.LineBasicMaterial({ color: 0x000000, transparent: true, depthWrite: false });
  below.add(new THREE.LineSegments(thGeo, thMat));

  // ---------- tickets ----------
  const ticketGeo = new THREE.BoxGeometry(0.15, 0.012, 0.09);
  const mkTicket = () => { const mat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0 }); const m = new THREE.Mesh(ticketGeo, mat); scene.add(m); return { m, mat }; };
  // routine tickets: always flowing from clients to the team
  const ROUTINE = 14, routine = [];
  for (let i = 0; i < ROUTINE; i++) routine.push({ ...mkTicket(), c: (r() * CLIENTS.length) | 0, s: (r() * SLOTS.length) | 0, phase: r() * 3.2, period: 3.2 });
  // specialist tickets: queue into the backlog, drop through the floor, get worked, rise, get delivered
  const spec = Array.from({ length: N_SPEC }, (_, k) => ({ ...mkTicket(), k, c: [1, 4, 2, 5, 0, 3][k], s: k % SLOTS.length, arrive: 0.7 + k * 0.62 }));
  const cOr = new THREE.Color(ORANGE), cIce = new THREE.Color(ICE), cMsp = new THREE.Color(MSP), cTmp = new THREE.Color();
  const stackPos = (k) => V(STACK[0], 0.03 + k * 0.022, STACK[1]);
  const benchPos = (k) => V(BENCH[k][0], BENCH_Y + 0.02, BENCH[k][1]);
  const arc = (a, b, u, h) => V(a.x + (b.x - a.x) * u, a.y + (b.y - a.y) * u + Math.sin(u * Math.PI) * h, a.z + (b.z - a.z) * u);


  const size = new THREE.Vector2(), tmp = V(0, 0, 0);
  const work = (k) => 7.0 + k * 0.5;             // each specialist ticket is worked on the bench
  const rise = (k) => 11.3 + k * 0.55;
  const deliver = (k) => 17.0 + k * 0.45;
  const drop = (k) => 5.8 + k * 0.32;

  return {
    duration: L,
    floor: { tile: 0.7, base: 0xe6dcc9, reflect: 0.3 },
    vignette: 0,
    chapters: [{ start: 0, label: 'Scope' }, { start: 5.5, label: 'Engineer' }, { start: 11, label: 'Validate' }, { start: 16.5, label: 'Hand over' }],
    labels: [
      { text: 'Your team', at: (t, v) => v.set(-0.3, 0.42, SLOT_Z), alpha: (t) => smooth(0.6, 1.2, t) * (1 - smooth(4.6, 5.2, t)) },
      { text: 'Cisco & Palo Alto backlog', tone: 'accent', at: (t, v) => v.set(STACK[0], 0.32, STACK[1]), alpha: (t) => smooth(2.6, 3.2, t) * (1 - smooth(5.0, 5.5, t)) },
      { text: 'Specialist engineering · beneath the surface', tone: 'accent', at: (t, v) => v.set(1.45, BENCH_Y + 0.28, 0.25), alpha: (t) => smooth(6.6, 7.2, t) * (1 - smooth(10.4, 10.9, t)) },
      { text: 'Checked · now in your colours', tone: 'ok', at: (t, v) => v.set(-0.55, -0.5, SLOT_Z + 0.15), alpha: (t) => smooth(12.8, 13.4, t) * (1 - smooth(16.0, 16.5, t)) },
      { text: 'Delivered in your name', tone: 'ok', at: (t, v) => v.set(0.0, 0.45, -1.4), alpha: (t) => smooth(18.2, 18.8, t) * (1 - smooth(21.2, 21.7, t)) }
    ],
    fade: (t) => shotFade(SHOTS, t),
    update(t) {
      const belowOn = t > 5.45 && t < 16.55;   // camera is beneath the floor for shots 2 and 3
      scene.background.setHex(belowOn ? 0xe7cdb3 : 0xf3ead9); scene.fog.color.setHex(belowOn ? 0xe3c6aa : 0xefe5d2); scene.fog.density = belowOn ? 0.03 : 0.03;
      below.visible = belowOn; glass.visible = belowOn;
      glassMat.color.set(0x24467f); glassMat.opacity = 0.5;
      const layer = smooth(5.6, 6.6, t) * (1 - smooth(15.8, 16.5, t));
      dEdgeMat.color.copy(cOr).multiplyScalar(0.6 + 0.4 * layer);
      deckMat.emissiveIntensity = 0.05 + 0.1 * layer;
      lowGrid.material.color.copy(cOr); lowGrid.material.opacity = 0.35 * layer;
      thMat.color.copy(cOr); thMat.opacity = 0.3 + 0.4 * layer;
      under.intensity = 1.2 * layer;

      // clients and team
      clients.forEach((c, i) => {
        c.rMat.color.copy(cMsp); c.cMat.color.copy(cIce);
        c.core.rotation.y = t * (0.5 + i * 0.1);
      });
      slots.forEach((s, j) => { s.eMat.color.copy(cMsp); s.hMat.color.copy(cIce); s.head.rotation.y = t * 0.8 + j; });

      // routine flow: client -> team, all loop long (the MSP's day job)
      routine.forEach((rt) => {
        const u = (((t + rt.phase) % rt.period) + rt.period) % rt.period / 1.6;
        const on = u < 1;
        const p = arc(clients[rt.c].pos, slots[rt.s].pos, clamp01(u), 0.35);
        rt.m.position.copy(p); rt.m.rotation.y = 0.3;
        rt.mat.color.copy(cIce);
        rt.mat.opacity = on ? Math.min(smooth(0, 0.1, u), 1 - smooth(0.85, 1, u)) * 0.9 : 0;
        rt.m.visible = rt.mat.opacity > 0.01;
      });

      // specialist tickets: queue -> backlog -> drop -> worked -> rise (recolour at surface) -> deliver
      let ripple = new Array(CLIENTS.length).fill(0);
      const cross = new Array(SLOTS.length).fill(0);
      spec.forEach((s) => {
        const k = s.k, p = s.m.position;
        const a0 = s.arrive, d0 = drop(k), w0 = work(k), r0 = rise(k), h0 = deliver(k);
        let col = cOr, op = 1, bright = 0.75;
        if (t < a0) { op = 0; }
        else if (t < a0 + 1.4) { p.copy(arc(clients[s.c].pos, stackPos(k), smooth(a0, a0 + 1.4, t), 0.45)); }
        else if (t < d0) { p.copy(stackPos(k)); bright = 0.7 + 0.08 * Math.sin(t * 6 + k); }
        else if (t < d0 + 1.2) { const u = smooth(d0, d0 + 1.2, t); p.copy(stackPos(k)).lerp(benchPos(k), u); p.x += Math.sin(u * Math.PI) * 0.1; }
        else if (t < r0) { p.copy(benchPos(k)); const done = smooth(w0, w0 + 0.3, t); bright = 0.75 + 0.5 * done * (1 - smooth(w0 + 0.3, w0 + 1.2, t)); }
        else if (t < r0 + 1.3) {
          const u = smooth(r0, r0 + 1.3, t); p.copy(arc(benchPos(k), slots[s.s].pos, u, 0.15));
          const crossed = smooth(-0.05, 0.05, p.y); col = cTmp.copy(cOr).lerp(cMsp, crossed); bright = 1.0 + 0.8 * Math.exp(-Math.pow(p.y * 14, 2));
          cross[s.s] = Math.max(cross[s.s], Math.exp(-Math.pow(p.y / 0.12, 2)));   // ring flashes as the ticket passes the surface
        }
        else if (t < h0) { p.copy(slots[s.s].pos).add(tmp.set(0, 0.02 + k * 0.008, 0)); col = cMsp; }
        else if (t < h0 + 1.3) { const u = smooth(h0, h0 + 1.3, t); p.copy(arc(slots[s.s].pos, clients[s.c].pos, u, 0.4)); col = cMsp; op = 1 - smooth(0.9, 1, u); if (u > 0.85) ripple[s.c] = Math.max(ripple[s.c], (u - 0.85) / 0.15); }
        else op = 0;
        if (t > h0 + 1.3 && t < h0 + 2.5) ripple[s.c] = Math.max(ripple[s.c], 1 - (t - h0 - 1.3) / 1.2);
        s.m.rotation.y = 0.3;
        s.mat.color.copy(col).multiplyScalar(bright);
        s.mat.opacity = op; s.m.visible = op > 0.01;
      });
      crossRings.forEach((cr, j) => { const v = clamp01(cross[j]); cr.m.scale.setScalar(1 + (1 - v) * 1.6); cr.mat.opacity = 0.85 * v; cr.m.visible = belowOn && v > 0.01; });
      clients.forEach((c, i) => { const u = ripple[i]; c.ripple.scale.setScalar(1 + (1 - u) * 1.8); c.pMat.color.copy(cIce); c.pMat.opacity = u * 0.9; });

      
    },
    camera(t, out) {
      shotCamera(SHOTS, [
        // scope: above, the team and the growing backlog
        [[0.6, 2.0, 3.7], [0.25, 1.9, 3.4], [0.3, 0.15, -0.35], [0.35, 0.15, -0.3], 32, 0.0],
        // engineer: beneath the glass, over the specialist layer
        [[2.8, -0.95, 2.3], [2.35, -0.98, 1.95], [1.4, -1.38, 0.22], [1.4, -1.38, 0.24], 32, 0.06],
        // validate: still below, looking up as finished tickets rise through the surface
        [[1.6, -2.1, 2.9], [1.0, -1.85, 2.6], [0.6, -0.3, 0.25], [0.45, -0.15, 0.3], 32, 0.06],
        // hand over: back above, wide, as the team delivers to clients
        [[0.0, 2.3, 4.2], [0.0, 2.55, 4.7], [0.0, 0.15, -0.5], [0.0, 0.15, -0.5], 32, 0.0]
      ], t, out);
    }
  };
}
