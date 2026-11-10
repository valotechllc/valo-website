/* Film B, network segmentation, as a real-time scene (v2: untangling the hairball).
   Story (22 s loop): a flat network where every device can reach every system ->
   devices regroup into zones, walls of light rise and cross-zone links are cut ->
   only approved paths run through the policy gateway -> tests: allowed passes, blocked stops.
   No vendor hardware is modelled. All values are functions of scene time t. */
import { smooth, clamp01 } from './stage.js';
import { rand, pulseMaterial, pointsMaterial, shotCamera, shotFade } from './lib.js';

const L = 22;
const SHOTS = [0, 5.5, 11, 16.5, L];
const ORANGE = 0xff6a1f, ICE = 0xbfe6ff;

const ZONES = [
  { key: 'work', name: 'Workforce', c: [-1.3, 0.5], col: 0x9cc0ff, n: 15 },
  { key: 'apps', name: 'Applications', c: [1.3, 0.5], col: 0xffa36b, n: 13 },
  { key: 'guest', name: 'Guest & IoT', c: [0.0, -1.15], col: 0xc9d3e2, n: 12 }
];
const GATE = [0, 0.22, 0.05];
const ZW = 1.1, ZD = 0.95, ZH = 0.5;          // zone wall box
const GROUP0 = 5.8, GROUP1 = 8.4;              // devices regroup
const WALL0 = 7.4, WALL1 = 9.4;                // walls rise
const CUT0 = 8.2, CUT1 = 10.0;                 // cross-zone links cut

export function segmentationScene(ctx) {
  const { THREE, scene, renderer } = ctx;
  scene.fog.density = 0.055;
  scene.background.setHex(0x03141c); scene.fog.color.setHex(0x0b2c38); // per-scene tint
  const r = rand(21);

  scene.add(new THREE.HemisphereLight(0x22355c, 0x020308, 0.55));
  const fill = new THREE.PointLight(0x5875ad, 2.4, 0, 2); fill.position.set(0, 2.6, 3.2); scene.add(fill);
  const gateLight = new THREE.PointLight(ORANGE, 0, 2.6, 2); gateLight.position.set(GATE[0], 0.5, GATE[2] + 0.3); scene.add(gateLight);

  // ---------- devices ----------
  const nodes = [];
  ZONES.forEach((z, zi) => {
    for (let i = 0; i < z.n; i++) {
      const a = r() * Math.PI * 2, d = Math.sqrt(r());
      nodes.push({
        zone: zi,
        p0: new THREE.Vector3((r() - 0.5) * 3.0, 0.12 + r() * 0.55, -1.25 + r() * 2.1),
        p1: new THREE.Vector3(z.c[0] + Math.cos(a) * d * ZW * 0.38, 0.1 + r() * 0.16, z.c[1] + Math.sin(a) * d * ZD * 0.36),
        seed: r(), delay: r() * 0.9, p: new THREE.Vector3()
      });
    }
  });
  const nodeGeo = new THREE.OctahedronGeometry(0.03, 0);
  const nodeMesh = new THREE.InstancedMesh(nodeGeo, new THREE.MeshBasicMaterial({ color: 0xffffff }), nodes.length);
  const halo = new THREE.InstancedMesh(new THREE.SphereGeometry(0.06, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.08, blending: THREE.AdditiveBlending, depthWrite: false }), nodes.length);
  scene.add(nodeMesh, halo);
  const zoneColor = ZONES.map((z) => new THREE.Color(z.col));
  nodes.forEach((n, i) => { nodeMesh.setColorAt(i, zoneColor[n.zone].clone().multiplyScalar(1.6)); halo.setColorAt(i, zoneColor[n.zone]); });

  // ---------- links: a dense hairball, most of it crossing zones ----------
  const links = [];
  const seen = new Set();
  nodes.forEach((n, i) => {
    for (let k = 0; k < 4; k++) {
      const j = (r() * nodes.length) | 0; if (j === i) continue;
      const key = i < j ? i + ':' + j : j + ':' + i; if (seen.has(key)) continue; seen.add(key);
      links.push({ a: i, b: j, cross: nodes[j].zone !== n.zone, cut: CUT0 + r() * (CUT1 - CUT0), seed: r() });
    }
  });
  // make sure every zone keeps some internal links
  ZONES.forEach((z, zi) => {
    const ids = nodes.map((n, i) => i).filter((i) => nodes[i].zone === zi);
    for (let k = 0; k < ids.length; k++) { const a = ids[k], b = ids[(k + 3) % ids.length]; const key = a < b ? a + ':' + b : b + ':' + a; if (!seen.has(key)) { seen.add(key); links.push({ a, b, cross: false, cut: 99, seed: r() }); } }
  });
  const CROSS = links.filter((l) => l.cross).length;
  const lPos = new Float32Array(links.length * 6), lCol = new Float32Array(links.length * 6);
  const lGeo = new THREE.BufferGeometry();
  lGeo.setAttribute('position', new THREE.BufferAttribute(lPos, 3));
  lGeo.setAttribute('color', new THREE.BufferAttribute(lCol, 3));
  const lMat = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
  scene.add(new THREE.LineSegments(lGeo, lMat));

  // traffic sparks running along the hairball (lateral movement while the network is flat)
  const SPARKS = 90, sPos = new Float32Array(SPARKS * 3), sCol = new Float32Array(SPARKS * 3), sSeed = new Float32Array(SPARKS);
  const sparks = [];
  for (let k = 0; k < SPARKS; k++) { sparks.push({ link: (r() * links.length) | 0, speed: 0.35 + r() * 0.6, off: r() }); sSeed[k] = 0.6 + r() * 0.4; }
  const sGeo = new THREE.BufferGeometry();
  sGeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3));
  sGeo.setAttribute('aColor', new THREE.BufferAttribute(sCol, 3));
  sGeo.setAttribute('aSeed', new THREE.BufferAttribute(sSeed, 1));
  const sMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { uScale: { value: 10 } },
    vertexShader: 'attribute vec3 aColor; attribute float aSeed; uniform float uScale; varying vec3 vC; void main(){ vC = aColor; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = uScale * aSeed / max(-mv.z, 0.2); gl_Position = projectionMatrix * mv; }',
    fragmentShader: 'varying vec3 vC; void main(){ float r = length(gl_PointCoord - 0.5); float a = smoothstep(0.5, 0.0, r); gl_FragColor = vec4(vC * a * a, 1.0); }'
  });
  scene.add(new THREE.Points(sGeo, sMat));

  // cut bursts: a spark pops at the midpoint of each cross-zone link as it is cut
  const cutLinks = links.filter((l) => l.cross);
  const bPos = new Float32Array(cutLinks.length * 3), bCol = new Float32Array(cutLinks.length * 3), bSeed = new Float32Array(cutLinks.length).fill(1.6);
  const bGeo = new THREE.BufferGeometry();
  bGeo.setAttribute('position', new THREE.BufferAttribute(bPos, 3));
  bGeo.setAttribute('aColor', new THREE.BufferAttribute(bCol, 3));
  bGeo.setAttribute('aSeed', new THREE.BufferAttribute(bSeed, 1));
  scene.add(new THREE.Points(bGeo, sMat));

  // ---------- zone walls of light ----------
  const walls = ZONES.map((z) => {
    const g = new THREE.Group(); g.position.set(z.c[0], 0, z.c[1]); scene.add(g);
    const boxGeo = new THREE.BoxGeometry(ZW, ZH, ZD); boxGeo.translate(0, ZH / 2, 0);
    const mat = new THREE.MeshBasicMaterial({ color: z.col, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    const box = new THREE.Mesh(boxGeo, mat); g.add(box);
    const eMat = new THREE.LineBasicMaterial({ color: 0x000000, transparent: true });
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(boxGeo), eMat); g.add(edges);
    const floorGeo = new THREE.EdgesGeometry(new THREE.PlaneGeometry(ZW, ZD)); const fMat = new THREE.LineBasicMaterial({ color: 0x000000 });
    const floorRim = new THREE.LineSegments(floorGeo, fMat); floorRim.rotation.x = -Math.PI / 2; floorRim.position.y = 0.004; g.add(floorRim);
    return { g, box, mat, eMat, fMat, col: new THREE.Color(z.col) };
  });

  // ---------- policy gateway ----------
  const gate = new THREE.Group(); gate.position.set(GATE[0], GATE[1], GATE[2]); scene.add(gate);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.009, 10, 64), ringMat); gate.add(ring);
  const ring2 = new THREE.Mesh(new THREE.TorusGeometry(0.23, 0.004, 8, 64), ringMat); gate.add(ring2);
  const coreMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false });
  const core = new THREE.Mesh(new THREE.CircleGeometry(0.16, 48), coreMat); gate.add(core);

  // approved paths and test probes (tubes with travelling pulses)
  const tube = (pts, mat, rad = 0.008) => { const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 110, rad, 6, false), mat); scene.add(m); return m; };
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const G = V(...GATE);
  const workC = V(ZONES[0].c[0], 0.18, ZONES[0].c[1]), appsC = V(ZONES[1].c[0], 0.18, ZONES[1].c[1]), guestC = V(ZONES[2].c[0], 0.18, ZONES[2].c[1]);
  const mkPath = (pts, color, seed, len) => { const m = pulseMaterial(THREE, color, seed, len); m.uniforms.uSpeed.value = 1.0; const mesh = tube(pts, m); return { m, mesh }; };
  const approved = [
    mkPath([workC, V(-0.7, 0.42, 0.4), V(-0.17, 0.24, 0.1), G, V(0.17, 0.24, 0.1), V(0.7, 0.42, 0.4), appsC], ORANGE, 0.0, 3.0),
    mkPath([V(-1.2, 0.18, 0.75), V(-0.6, 0.5, 0.55), V(-0.15, 0.26, 0.15), G, V(0.15, 0.26, 0.15), V(0.6, 0.5, 0.55), V(1.2, 0.18, 0.75)], ORANGE, 0.45, 3.0),
    mkPath([guestC, V(0.0, 0.32, -0.6), G, V(0.0, 0.6, 0.0), V(0.0, 1.3, -1.6), V(0.0, 1.6, -3.4)], ICE, 0.2, 4.4)
  ];
  const probeOk = mkPath([V(-1.45, 0.2, 0.35), V(-0.7, 0.5, 0.25), G, V(0.7, 0.5, 0.25), V(1.45, 0.2, 0.35)], ICE, 0.1, 3.2);
  const probeNo = mkPath([V(0.25, 0.18, -1.2), V(0.4, 0.42, -0.6), V(0.08, 0.26, -0.05), G], ORANGE, 0.3, 1.8);
  probeNo.m.uniforms.uStop.value = 0.94;

  // distant points for depth
  const dp = [], dc = [], ds = [], dr = rand(77);
  for (let i = 0; i < 240; i++) { dp.push((dr() - 0.5) * 18, 0.2 + dr() * 4, -3.5 - dr() * 12); dc.push(0.45, 0.62, 1.3); ds.push(dr()); }
  const dGeo = new THREE.BufferGeometry(); dGeo.setAttribute('position', new THREE.Float32BufferAttribute(dp, 3)); dGeo.setAttribute('aColor', new THREE.Float32BufferAttribute(dc, 3)); dGeo.setAttribute('aSeed', new THREE.Float32BufferAttribute(ds, 1));
  const dMat = pointsMaterial(THREE); dMat.uniforms.uFog.value = 0.05; scene.add(new THREE.Points(dGeo, dMat));

  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), S = new THREE.Vector3(), size = new THREE.Vector2(), tmp = new THREE.Vector3();
  const cWhite = new THREE.Color(0x8fb4ff), cHot = new THREE.Color(ORANGE), cTmp = new THREE.Color();
  const zoneLabel = (zi) => (t, v) => v.set(ZONES[zi].c[0], ZH + 0.12, ZONES[zi].c[1]);
  const linkAlpha = (l, t) => (l.cross ? 1 - smooth(l.cut, l.cut + 0.35, t) : 1);

  return {
    duration: L,
    floor: { tile: 0.6, base: 0x04121a, reflect: 0.85 },
    chapters: [{ start: 0, label: 'Flat network' }, { start: 5.5, label: 'Zones' }, { start: 11, label: 'Approved paths' }, { start: 16.5, label: 'Test' }],
    labels: [
      { text: 'Flat network · everything reaches everything', tone: 'stop', at: (t, v) => v.set(0.9, 0.3, -0.2), alpha: (t) => smooth(1.2, 1.8, t) * (1 - smooth(5.0, 5.6, t)) },
      { text: `${CROSS} cross-zone links cut`, tone: 'stop', at: (t, v) => v.set(0, 0.75, 0.05), alpha: (t) => smooth(CUT1 - 0.2, CUT1 + 0.3, t) * (1 - smooth(10.75, 11.0, t)) },
      { text: 'Workforce', at: zoneLabel(0), alpha: (t) => smooth(8.6, 9.4, t) * (1 - smooth(21.2, 21.7, t)) },
      { text: 'Applications', at: zoneLabel(1), alpha: (t) => smooth(8.8, 9.6, t) * (1 - smooth(21.2, 21.7, t)) },
      { text: 'Guest & IoT', at: (t, v) => v.set(ZONES[2].c[0], 0.02, ZONES[2].c[1] + ZD / 2 + 0.05), alpha: (t) => smooth(9.0, 9.8, t) * (1 - smooth(21.2, 21.7, t)) },
      { text: 'Policy gateway', tone: 'accent', at: (t, v) => v.set(GATE[0], GATE[1] + 0.34, GATE[2]), alpha: (t) => smooth(11.2, 11.9, t) * (1 - smooth(16.3, 16.8, t)) },
      { text: 'Allowed · as expected', tone: 'ok', at: (t, v) => v.set(0.75, 0.68, 0.25), alpha: (t) => smooth(17.6, 18.1, t) * (1 - smooth(21.0, 21.5, t)) },
      { text: 'Blocked · as expected', tone: 'stop', at: (t, v) => v.set(0.15, 0.62, -0.4), alpha: (t) => smooth(18.4, 18.9, t) * (1 - smooth(21.0, 21.5, t)) }
    ],
    fade: (t) => shotFade(SHOTS, t),
    update(t) {
      // devices drift in the hairball, then regroup into their zones
      nodes.forEach((n, i) => {
        const u = smooth(GROUP0 + n.delay, GROUP1 + n.delay * 0.6, t);
        n.p.copy(n.p0).lerp(n.p1, u);
        const bob = (1 - u) * 0.04 + 0.012;
        n.p.y += Math.sin(t * (0.8 + n.seed) + n.seed * 9) * bob;
        n.p.x += Math.cos(t * (0.6 + n.seed) + n.seed * 5) * (1 - u) * 0.03;
        Q.setFromAxisAngle(tmp.set(0, 1, 0), t * (0.6 + n.seed));
        M.compose(n.p, Q, S.setScalar(1)); nodeMesh.setMatrixAt(i, M);
        M.compose(n.p, Q, S.setScalar(0.8 + 0.3 * Math.sin(t * 2 + n.seed * 6))); halo.setMatrixAt(i, M);
      });
      nodeMesh.instanceMatrix.needsUpdate = true; halo.instanceMatrix.needsUpdate = true;

      // links: dense and buzzing while flat; cross-zone links flash orange and cut as the walls rise
      const flatBuzz = 1 - smooth(GROUP0, GROUP1, t);
      links.forEach((l, k) => {
        const A = nodes[l.a].p, B = nodes[l.b].p, o = k * 6;
        lPos[o] = A.x; lPos[o + 1] = A.y; lPos[o + 2] = A.z; lPos[o + 3] = B.x; lPos[o + 4] = B.y; lPos[o + 5] = B.z;
        let c;
        if (l.cross) {
          const flash = smooth(l.cut - 0.3, l.cut, t) * (1 - smooth(l.cut, l.cut + 0.35, t));
          const a = linkAlpha(l, t);
          c = cTmp.copy(cWhite).multiplyScalar((0.16 + 0.1 * flatBuzz * Math.sin(t * 6 + l.seed * 30)) * a).lerp(cHot, flash).multiplyScalar(flash > 0 ? 1.6 : 1);
          if (a < 0.001) c.setRGB(0, 0, 0);
        } else {
          const zc = zoneColor[nodes[l.a].zone];
          c = cTmp.copy(cWhite).multiplyScalar(0.16).lerp(zc, smooth(GROUP0, GROUP1, t)).multiplyScalar(0.16 + 0.22 * smooth(GROUP0, GROUP1, t));
        }
        lCol[o] = lCol[o + 3] = c.r; lCol[o + 1] = lCol[o + 4] = c.g; lCol[o + 2] = lCol[o + 5] = c.b;
      });
      lGeo.attributes.position.needsUpdate = true; lGeo.attributes.color.needsUpdate = true;

      // sparks ride the links; once a link is cut, its sparks die
      sparks.forEach((s, k) => {
        const l = links[s.link], A = nodes[l.a].p, B = nodes[l.b].p;
        const u = (t * s.speed + s.off) % 1;
        const o = k * 3; sPos[o] = A.x + (B.x - A.x) * u; sPos[o + 1] = A.y + (B.y - A.y) * u; sPos[o + 2] = A.z + (B.z - A.z) * u;
        const a = linkAlpha(l, t) * (l.cross ? 1 : 0.45 + 0.55 * flatBuzz);
        const hot = l.cross ? 1 : 0;
        sCol[o] = (0.7 + 0.5 * hot) * a; sCol[o + 1] = (0.8 - 0.35 * hot) * a; sCol[o + 2] = (1.2 - 0.9 * hot) * a;
      });
      sGeo.attributes.position.needsUpdate = true; sGeo.attributes.aColor.needsUpdate = true;
      cutLinks.forEach((l, k) => {
        const A = nodes[l.a].p, B = nodes[l.b].p, o = k * 3, d = t - l.cut;
        const a = d < 0 ? 0 : Math.exp(-d * 6) * 2.2;
        bPos[o] = (A.x + B.x) / 2; bPos[o + 1] = (A.y + B.y) / 2 + d * 0.05; bPos[o + 2] = (A.z + B.z) / 2;
        bCol[o] = 1.0 * a; bCol[o + 1] = 0.42 * a; bCol[o + 2] = 0.12 * a;
      });
      bGeo.attributes.position.needsUpdate = true; bGeo.attributes.aColor.needsUpdate = true;

      // walls of light rise around each zone
      walls.forEach((w, i) => {
        const u = smooth(WALL0 + i * 0.25, WALL1 + i * 0.25, t);
        w.box.scale.y = Math.max(0.001, u); w.box.parent.children[1].scale.y = Math.max(0.001, u);
        w.mat.opacity = 0.05 * u;
        w.eMat.color.copy(w.col).multiplyScalar(0.9 * u);
        w.fMat.color.copy(w.col).multiplyScalar(0.25 + 0.9 * u);
        w.g.visible = u > 0.001;
      });

      // policy gateway wakes; approved paths run through it
      const gw = smooth(10.6, 11.6, t);
      gate.scale.setScalar(0.4 + 0.6 * gw); gate.rotation.y = Math.sin(t * 0.4) * 0.25;
      ringMat.color.set(ORANGE).multiplyScalar(0.1 + 1.8 * gw);
      coreMat.color.set(ORANGE).multiplyScalar(0.12 * gw);
      gateLight.intensity = 1.6 * gw;
      approved.forEach((p, k) => { const a = smooth(11.4 + k * 0.6, 12.2 + k * 0.6, t) * (1 - smooth(21.0, 21.6, t)); p.m.uniforms.uTime.value = t; p.m.uniforms.uActive.value = a * (k === 2 ? 0.7 : 1); p.mesh.visible = a > 0.01; });

      // tests: one probe passes end to end, one stops at the gateway and flashes
      const ok = smooth(17.2, 17.6, t) * (1 - smooth(21.0, 21.6, t));
      probeOk.m.uniforms.uTime.value = t - 17.2; probeOk.m.uniforms.uActive.value = ok; probeOk.mesh.visible = ok > 0.01;
      const no = smooth(17.9, 18.3, t) * (1 - smooth(21.0, 21.6, t));
      probeNo.m.uniforms.uTime.value = t - 17.9; probeNo.m.uniforms.uActive.value = no; probeNo.mesh.visible = no > 0.01;
      probeNo.m.uniforms.uFlash.value = smooth(18.5, 18.7, t) * (0.6 + 0.4 * Math.sin(t * 7)) * no;
      const hit = smooth(18.45, 18.6, t) * Math.exp(-Math.max(0, t - 18.6) * 1.6) * no;
      ringMat.color.set(ORANGE).multiplyScalar(0.1 + 1.8 * gw + 3.0 * hit);
      gate.scale.multiplyScalar(1 + 0.18 * hit); gateLight.intensity = 1.6 * gw + 3.0 * hit;

      renderer.getDrawingBufferSize(size);
      sMat.uniforms.uScale.value = size.y * 0.02;
      dMat.uniforms.uTime.value = t; dMat.uniforms.uScale.value = size.y * 0.012;
    },
    camera(t, out) {
      shotCamera(SHOTS, [
        // flat network: drifting through the hairball
        [[-1.6, 1.55, 2.5], [-0.6, 1.65, 2.35], [0.0, 0.3, -0.3], [0.2, 0.3, -0.3], 32, 0.0],
        // zones: high and wide as devices regroup and walls rise
        [[0.0, 3.5, 5.2], [0.0, 3.3, 4.8], [0.0, 0.15, -0.45], [0.0, 0.15, -0.45], 32, 0.06],
        // approved paths: low from the side, through the gateway
        [[2.4, 2.1, 3.5], [1.6, 2.15, 3.8], [0.0, 0.05, -0.3], [0.0, 0.05, -0.3], 34, 0.0],
        // test: pull back to the whole design
        [[-2.1, 1.7, 2.6], [-0.7, 2.3, 3.7], [0.0, 0.2, -0.3], [0.0, 0.2, -0.3], 32, 0.0]
      ], t, out);
    }
  };
}
