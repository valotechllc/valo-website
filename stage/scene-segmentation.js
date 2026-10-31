/* Film B, network segmentation, as a real-time scene.
   Story (22 s loop): one flat network where everything can reach everything ->
   systems grouped into zones with boundaries -> only approved paths through the policy gateway ->
   allowed and blocked paths tested. Architecture and spatial separation, not another rack film. */
import { smooth } from './stage.js';
import { rand, texBrushed, pulseMaterial, spillMaterial, pointsMaterial, slab, shotCamera, shotFade } from './lib.js';

const L = 22;
const SHOTS = [0, 5.5, 11, 16.5, L];
const ORANGE = 0xff6a1f, COOL = 0x9cc0ff;

export function segmentationScene(ctx) {
  const { THREE, scene, renderer } = ctx;
  scene.fog.density = 0.06;
  const brushed = texBrushed(THREE);
  const r = rand(21);

  // lights
  scene.add(new THREE.HemisphereLight(0x22355c, 0x020308, 0.6));
  const spot = (color, i, p, tgt, angle, shadow) => {
    const s = new THREE.SpotLight(color, i, 0, angle, 0.8, 2); s.position.set(...p); s.target.position.set(...tgt);
    if (shadow) { s.castShadow = true; s.shadow.mapSize.set(1024, 1024); s.shadow.bias = -0.0004; s.shadow.normalBias = 0.01; }
    scene.add(s, s.target); return s;
  };
  spot(0xdfe8ff, 34, [1.6, 4.2, 3.4], [0, 0, -0.1], 0.6, true);
  spot(0xff7a33, 14, [3.2, 0.5, -3.0], [0, 0.2, -0.2], 0.5, false);
  spot(0x5f86d6, 12, [-3.4, 0.45, -2.4], [0, 0.2, 0], 0.5, false);
  const fill = new THREE.PointLight(0x5875ad, 3, 0, 2); fill.position.set(0, 1.4, 4); scene.add(fill);

  // zones: workforce (left), applications (right), guest & IoT (back); each a group that moves apart
  const plateMat = new THREE.MeshStandardMaterial({ color: 0x0d121b, metalness: 0.6, roughness: 0.45, roughnessMap: brushed, envMapIntensity: 0.5 });
  const zones = [
    { key: 'work', base: new THREE.Vector3(-1.45, 0, 0.45), size: [1.45, 1.05], edge: COOL },
    { key: 'apps', base: new THREE.Vector3(1.45, 0, 0.45), size: [1.25, 1.0], edge: ORANGE },
    { key: 'guest', base: new THREE.Vector3(0, 0, -1.55), size: [1.5, 0.9], edge: 0xc9d3e2 }
  ];
  const FLAT = 0.5; // how close the zones sit while the network is still flat
  zones.forEach((z) => {
    z.group = new THREE.Group(); scene.add(z.group);
    const plate = new THREE.Mesh(slab(THREE, z.size[0], 0.05, z.size[1], 0.008), plateMat); plate.receiveShadow = true; plate.castShadow = true; z.group.add(plate);
    // edge light along the plate rim
    z.rim = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const w = z.size[0], d = z.size[1];
    [[w, 0.004, 0.004, 0, 0.052, d / 2], [w, 0.004, 0.004, 0, 0.052, -d / 2], [0.004, 0.004, d, w / 2, 0.052, 0], [0.004, 0.004, d, -w / 2, 0.052, 0]].forEach(([a, b, c, x, y, zz]) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(a, b, c), z.rim); m.position.set(x, y, zz); z.group.add(m);
    });
    // glass boundary walls that rise once zones are defined
    z.wallMat = new THREE.MeshStandardMaterial({ color: 0x9fb8e8, metalness: 0.1, roughness: 0.15, transparent: true, opacity: 0.0, depthWrite: false, side: THREE.DoubleSide, envMapIntensity: 1.2 });
    z.walls = new THREE.Group();
    const H = 0.34;
    [[w, d / 2, 0], [w, -d / 2, 0], [d, w / 2, Math.PI / 2], [d, -w / 2, Math.PI / 2]].forEach(([len, off, rot]) => {
      const p = new THREE.Mesh(new THREE.PlaneGeometry(len, H), z.wallMat);
      p.position.set(rot ? off : 0, H / 2 + 0.05, rot ? 0 : off); p.rotation.y = rot; z.walls.add(p);
      const top = new THREE.Mesh(new THREE.BoxGeometry(rot ? 0.004 : len, 0.004, rot ? len : 0.004), z.rim);
      top.position.set(rot ? off : 0, H + 0.05, rot ? 0 : off); z.walls.add(top);
    });
    z.walls.scale.y = 0.001; z.group.add(z.walls);
    z.ports = [];
  });

  // shared floor plate that holds everything while the network is flat
  const shared = new THREE.Mesh(slab(THREE, 3.1, 0.03, 2.5, 0.006), new THREE.MeshStandardMaterial({ color: 0x0b1018, metalness: 0.5, roughness: 0.5, transparent: true, opacity: 1, envMapIntensity: 0.4 }));
  shared.position.set(0, 0, -0.15); shared.receiveShadow = true; scene.add(shared);

  // devices
  const darkMetal = new THREE.MeshStandardMaterial({ color: 0x1a1f27, metalness: 0.85, roughness: 0.38, envMapIntensity: 0.7 });
  const screenMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0x6f9be8).multiplyScalar(0.5) });
  const serverLed = new THREE.MeshBasicMaterial({ color: new THREE.Color(ORANGE).multiplyScalar(1.6) });
  const iotLed = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xd8e4ff).multiplyScalar(1.4) });
  const work = zones[0], apps = zones[1], guest = zones[2];
  for (let i = 0; i < 6; i++) { // workstations: monitor on a stand
    const x = -0.45 + (i % 3) * 0.45, z = -0.2 + Math.floor(i / 3) * 0.42;
    const g = new THREE.Group(); g.position.set(x, 0.05, z); g.rotation.y = (r() - 0.5) * 0.4;
    const stand = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.09, 0.03), darkMetal); stand.position.y = 0.045;
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.006, 0.08), darkMetal); foot.position.y = 0.003;
    const mon = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.16, 0.012), darkMetal); mon.position.set(0, 0.17, 0); mon.castShadow = true;
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.14), screenMat); scr.position.set(0, 0.17, 0.0065);
    g.add(stand, foot, mon, scr); work.group.add(g);
    work.ports.push(new THREE.Vector3(x, 0.27, z));
  }
  for (let i = 0; i < 4; i++) { // application servers
    const x = -0.28 + (i % 2) * 0.56, z = -0.18 + Math.floor(i / 2) * 0.4;
    const s = new THREE.Mesh(slab(THREE, 0.22, 0.42, 0.3, 0.006), darkMetal); s.position.set(x, 0.05, z); s.castShadow = true;
    for (let k = 0; k < 6; k++) { const led = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.004, 0.003), serverLed); led.position.set(x, 0.1 + k * 0.06, z + 0.152); apps.group.add(led); }
    apps.group.add(s); apps.ports.push(new THREE.Vector3(x, 0.48, z));
  }
  const iotSpots = [[-0.5, -0.15], [-0.15, 0.2], [0.2, -0.2], [0.5, 0.15], [0.0, -0.05]];
  iotSpots.forEach(([x, z], i) => { // cameras, phones and access points
    const g = new THREE.Group(); g.position.set(x, 0.05, z);
    if (i % 3 === 0) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.12, 20), darkMetal); b.position.y = 0.06; const head = new THREE.Mesh(new THREE.SphereGeometry(0.045, 20, 14), darkMetal); head.position.y = 0.14; const l = new THREE.Mesh(new THREE.CircleGeometry(0.012, 16), iotLed); l.position.set(0, 0.14, 0.046); g.add(b, head, l); }
    else if (i % 3 === 1) { const p = new THREE.Mesh(slab(THREE, 0.07, 0.14, 0.012, 0.003), darkMetal); p.rotation.x = -0.25; p.position.y = 0.0; const sc = new THREE.Mesh(new THREE.PlaneGeometry(0.058, 0.115), screenMat); sc.position.set(0, 0.072, 0.01); sc.rotation.x = -0.25; g.add(p, sc); }
    else { const ap = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.02, 32), darkMetal); ap.position.y = 0.01; const ring = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.003, 8, 40), iotLed); ring.rotation.x = Math.PI / 2; ring.position.y = 0.021; g.add(ap, ring); }
    g.traverse((m) => { if (m.isMesh) m.castShadow = true; });
    guest.group.add(g); guest.ports.push(new THREE.Vector3(x, 0.2, z));
  });

  // the policy gateway at the centre: the only place zones meet
  const gw = new THREE.Group(); gw.position.set(0, 0, 0.1); scene.add(gw);
  const pillar = new THREE.Mesh(slab(THREE, 0.24, 0.95, 0.24, 0.01), new THREE.MeshPhysicalMaterial({ color: 0x10141b, metalness: 0.9, roughness: 0.32, clearcoat: 0.3, envMapIntensity: 0.8 }));
  pillar.castShadow = true; gw.add(pillar);
  const gwAccent = new THREE.MeshBasicMaterial({ color: 0x000000 });
  [-1, 1].forEach((s) => { const strip = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.8, 0.004), gwAccent); strip.position.set(s * 0.07, 0.48, 0.123); gw.add(strip); });
  const halo = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.006, 8, 64), gwAccent); halo.rotation.x = Math.PI / 2; halo.position.y = 0.97; gw.add(halo);
  const GW_PORT = new THREE.Vector3(0, 0.9, 0.1);
  const gwSpill = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.6), spillMaterial(THREE, ORANGE)); gwSpill.material.uniforms.uHalf.value.set(0.12, 0.12); gwSpill.rotation.x = -Math.PI / 2; gwSpill.position.set(0, 0.002, 0.1); scene.add(gwSpill);

  // zone placement over time
  const sepAt = (t) => smooth(5.8, 9.4, t);
  const zonePos = (z, t, out) => { const k = FLAT + (1 - FLAT) * sepAt(t); return out.set(z.base.x * k, 0.03 + 0.09 * sepAt(t), z.base.z * k + (1 - k) * 0.15); };
  const finalPos = (z) => new THREE.Vector3(z.base.x, 0.12, z.base.z);
  const flatPos = (z) => new THREE.Vector3(z.base.x * FLAT, 0.03, z.base.z * FLAT + (1 - FLAT) * 0.15);

  const arc = (a, b, h) => { const m = a.clone().lerp(b, 0.5); m.y = Math.max(a.y, b.y) + h; return new THREE.QuadraticBezierCurve3(a, m, b); };
  const tube = (curve, color, seed, radius = 0.0045) => { const len = curve.getLength(); const mat = pulseMaterial(THREE, color, seed, len); mat.uniforms.uSpeed.value = 1.1; const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 120, radius, 6, false), mat); scene.add(mesh); return { mesh, mat, len }; };

  // flat network: any-to-any links between devices in every zone
  const flatLinks = [];
  const allPorts = [];
  zones.forEach((z) => z.ports.forEach((p) => allPorts.push([z, p])));
  for (let i = 0; i < 16; i++) {
    const [za, pa] = allPorts[(r() * allPorts.length) | 0];
    const others = allPorts.filter((x) => x[0] !== za);
    const [zb, pb] = others[(r() * others.length) | 0];
    const a = pa.clone().add(flatPos(za)), b = pb.clone().add(flatPos(zb));
    flatLinks.push(tube(arc(a, b, 0.25 + r() * 0.35), COOL, r()));
  }

  // approved paths through the gateway (built at final zone positions)
  const via = (zFrom, pi, zTo, pj, seed, color = ORANGE) => {
    const a = zFrom.ports[pi].clone().add(finalPos(zFrom)), b = zTo ? zTo.ports[pj].clone().add(finalPos(zTo)) : pj;
    const g = GW_PORT.clone();
    const c = new THREE.CatmullRomCurve3([a, a.clone().lerp(g, 0.5).setY(Math.max(a.y, g.y) + 0.12), g, g.clone().lerp(b, 0.5).setY(Math.max(b.y, g.y) + 0.12), b], false, 'centripetal');
    return tube(c, color, seed);
  };
  const allowed = [
    via(work, 1, apps, 0, 0.1), via(work, 4, apps, 3, 0.45),
    via(guest, 1, null, new THREE.Vector3(0.6, 0.6, -6.5), 0.7, COOL) // guest devices reach the internet only
  ];
  // blocked: a guest device tries to reach an application server and stops at its own boundary
  const bFrom = guest.ports[3].clone().add(finalPos(guest)), bTo = apps.ports[2].clone().add(finalPos(apps));
  const blockedCurve = arc(bFrom, bTo, 0.3);
  const blocked = tube(blockedCurve, ORANGE, 0.2);
  // where the blocked path crosses the guest zone wall
  let stopU = 0.2; { const gp = finalPos(guest), hw = guest.size[0] / 2, hd = guest.size[1] / 2; for (let u = 0; u <= 1; u += 0.005) { const p = blockedCurve.getPoint(u); if (Math.abs(p.x - gp.x) > hw || Math.abs(p.z - gp.z) > hd) { stopU = u; break; } } }
  blocked.mat.uniforms.uStop.value = stopU;
  const stopPoint = blockedCurve.getPoint(stopU);

  // test sweep: a ring of light expanding from the gateway
  const ringMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.98, 1.0, 128), ringMat); ring.rotation.x = -Math.PI / 2; ring.position.set(0, 0.004, 0.1); scene.add(ring);

  // distant points for depth
  const dp = [], dc = [], ds = [], dr = rand(5);
  for (let i = 0; i < 260; i++) { const a = dr() * Math.PI * 2, rad = 7 + dr() * 10; dp.push(Math.cos(a) * rad, 0.3 + dr() * 3.5, -Math.abs(Math.sin(a) * rad) - 2); const c = dr() < 0.85 ? [0.45, 0.65, 1.4] : [1.6, 0.6, 0.2]; dc.push(...c); ds.push(dr()); }
  const dGeo = new THREE.BufferGeometry(); dGeo.setAttribute('position', new THREE.Float32BufferAttribute(dp, 3)); dGeo.setAttribute('aColor', new THREE.Float32BufferAttribute(dc, 3)); dGeo.setAttribute('aSeed', new THREE.Float32BufferAttribute(ds, 1));
  const dMat = pointsMaterial(THREE); dMat.uniforms.uFog.value = 0.05; scene.add(new THREE.Points(dGeo, dMat));

  const tmp = new THREE.Vector3(), size = new THREE.Vector2();
  const labelAt = (z, dy) => (t, v) => zonePos(z, t, v).add(new THREE.Vector3(0, dy, -z.size[1] / 2 + 0.05));

  return {
    duration: L,
    floor: { tile: 0.5, base: 0x04070d },
    chapters: [{ start: 0, label: 'Flat network' }, { start: 5.5, label: 'Zones' }, { start: 11, label: 'Approved paths' }, { start: 16.5, label: 'Test' }],
    labels: [
      { text: 'Workforce', at: labelAt(work, 0.5), alpha: (t) => smooth(7.6, 8.6, t) },
      { text: 'Applications', at: labelAt(apps, 0.62), alpha: (t) => smooth(7.8, 8.8, t) },
      { text: 'Guest & IoT', at: labelAt(guest, 0.45), alpha: (t) => smooth(8.0, 9.0, t) },
      { text: 'Policy gateway', tone: 'accent', at: (t, v) => v.set(0, 1.15, 0.1), alpha: (t) => smooth(11.0, 12.0, t) },
      { text: 'Allowed', tone: 'ok', at: (t, v) => v.copy(allowed[0].mesh.geometry.parameters.path.getPoint(0.72)).add(tmp.set(0, 0.08, 0)), alpha: (t) => smooth(17.6, 18.2, t) },
      { text: 'Blocked', tone: 'stop', at: (t, v) => v.copy(stopPoint).add(tmp.set(0, 0.12, 0)), alpha: (t) => smooth(17.9, 18.5, t) }
    ],
    fade: (t) => shotFade(SHOTS, t),
    update(t) {
      zones.forEach((z) => {
        zonePos(z, t, z.group.position);
        z.walls.scale.y = Math.max(0.001, smooth(8.2, 10.4, t));
        z.wallMat.opacity = 0.11 * smooth(8.2, 10.4, t);
        z.rim.color.set(z.edge).multiplyScalar(0.15 + 1.1 * smooth(7.0, 9.0, t));
      });
      shared.material.opacity = 1 - smooth(5.6, 7.4, t);
      shared.visible = shared.material.opacity > 0.01;
      const flat = 1 - smooth(4.6, 6.2, t);
      flatLinks.forEach((l) => { l.mat.uniforms.uTime.value = t; l.mat.uniforms.uActive.value = 0.32 * flat; l.mesh.visible = flat > 0.01; });
      allowed.forEach((l, k) => { l.mat.uniforms.uTime.value = t; const a = smooth(11.3 + k * 0.5, 12.3 + k * 0.5, t); l.mat.uniforms.uActive.value = a; l.mesh.visible = a > 0.01; });
      const bA = smooth(12.8, 13.6, t);
      blocked.mat.uniforms.uTime.value = t; blocked.mat.uniforms.uActive.value = bA; blocked.mesh.visible = bA > 0.01;
      // flash where each blocked pulse arrives at the wall
      const speed = blocked.mat.uniforms.uSpeed.value / blocked.len, seed = blocked.mat.uniforms.uSeed.value;
      let flash = 0;
      for (let k = 0; k < 4; k++) { const since = (((t * speed + seed + k * 0.25 - stopU) % 1) + 1) % 1 / speed; flash = Math.max(flash, Math.exp(-since * 4.0)); }
      blocked.mat.uniforms.uFlash.value = flash * bA;
      const g = smooth(10.6, 11.6, t);
      gwAccent.color.set(ORANGE).multiplyScalar(0.12 + 1.5 * g);
      gwSpill.material.uniforms.uI.value = 0.05 + 0.3 * g;
      const ru = (t - 17.0) / 2.6;
      if (ru > 0 && ru < 1) { const s = 0.3 + ru * 3.6; ring.scale.set(s, s, 1); ringMat.color.set(0xbfe0ff).multiplyScalar(1.8 * Math.sin(ru * Math.PI)); } else ringMat.color.setRGB(0, 0, 0);
      renderer.getDrawingBufferSize(size); dMat.uniforms.uTime.value = t; dMat.uniforms.uScale.value = size.y * 0.012;
    },
    camera(t, out) {
      shotCamera(SHOTS, [
        [[-2.5, 0.95, 2.7], [-1.35, 0.9, 2.6], [0.1, 0.22, -0.2], [0.5, 0.22, -0.3], 32, 0.0],
        [[0.5, 1.7, 3.9], [0.0, 2.5, 4.3], [0.0, 0.1, -0.2], [0.0, 0.1, -0.3], 34, -0.02],
        [[-2.7, 1.15, 2.4], [-1.7, 1.05, 2.1], [0.1, 0.35, 0.0], [0.8, 0.35, 0.15], 32, 0.0],
        [[3.4, 2.5, 4.1], [2.9, 2.3, 3.7], [0.0, 0.15, -0.35], [0.0, 0.15, -0.35], 32, 0.0]
      ], t, out);
    }
  };
}
