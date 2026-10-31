/* Film D, white-label MSP engineering, as a real-time scene.
   Story (22 s loop): the MSP is the customer-facing hub of several client environments ->
   a scoped specialist work package docks behind the MSP, not in front of it ->
   configuration and validation at one client -> the handover goes out under the MSP's brand. */
import { smooth } from './stage.js';
import { canvasTex, rand, texBrushed, pulseMaterial, spillMaterial, pointsMaterial, slab, shotCamera, shotFade } from './lib.js';

const L = 22;
const SHOTS = [0, 5.5, 11, 16.5, L];
const ORANGE = 0xff6a1f, COOL = 0xbcd2ff;
const CLIENT_ANGLES = [165, 125, 75, 30, -10];
const JOB = 2; // the client this engagement is for

function texBrand(THREE) {
  return canvasTex(THREE, 768, 512, (g, w, h) => {
    const grd = g.createLinearGradient(0, 0, 0, h); grd.addColorStop(0, '#16233c'); grd.addColorStop(1, '#0a1222'); g.fillStyle = grd; g.fillRect(0, 0, w, h);
    g.fillStyle = '#ffffff'; g.font = '600 112px Inter, sans-serif'; g.textAlign = 'center'; g.fillText('YOUR MSP', w / 2, h / 2 + 10);
    g.font = '500 30px "JetBrains Mono", monospace'; g.fillStyle = '#a9b6c8'; g.fillText('MANAGED SERVICES', w / 2, h / 2 + 76);
    g.strokeStyle = 'rgba(255,255,255,0.25)'; g.lineWidth = 4; g.strokeRect(16, 16, w - 32, h - 32);
  });
}
function texDoc(THREE) {
  return canvasTex(THREE, 512, 360, (g, w, h) => {
    g.fillStyle = '#eef2f7'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#0b1526'; g.font = '700 40px Inter, sans-serif'; g.fillText('YOUR MSP', 34, 70);
    g.font = '500 22px "JetBrains Mono", monospace'; g.fillStyle = '#56657b'; g.fillText('HANDOVER  ·  CLIENT C', 34, 108);
    ['Migration plan', 'Rollback plan', 'Path validation', 'Documentation'].forEach((s, i) => { g.fillStyle = '#3b4a60'; g.font = '26px Inter, sans-serif'; g.fillText(s, 34, 170 + i * 44); g.fillStyle = '#b8470f'; g.fillText('✓', w - 64, 170 + i * 44); });
  });
}

export function mspScene(ctx) {
  const { THREE, scene, renderer } = ctx;
  scene.fog.density = 0.055;
  const brushed = texBrushed(THREE);
  const r = rand(31);

  // lights (rims sit low so flat tops don't mirror them into the lens)
  scene.add(new THREE.HemisphereLight(0x22355c, 0x020308, 0.55));
  const key = new THREE.SpotLight(0xe6eeff, 40, 0, 0.62, 0.85, 2); key.position.set(0.8, 5.0, 3.6); key.target.position.set(0, 0, 0.4);
  key.castShadow = true; key.shadow.mapSize.set(1024, 1024); key.shadow.bias = -0.0004; scene.add(key, key.target);
  const rimO = new THREE.SpotLight(0xff7a33, 8, 0, 0.5, 0.8, 2); rimO.position.set(1.2, 0.22, -3.4); rimO.target.position.set(0, 0.3, 0); scene.add(rimO, rimO.target);
  const rimC = new THREE.SpotLight(0x5f86d6, 12, 0, 0.6, 0.8, 2); rimC.position.set(-3.6, 0.2, -1.2); rimC.target.position.set(0, 0.2, 0.5); scene.add(rimC, rimC.target);
  const fill = new THREE.PointLight(0x5875ad, 3, 0, 2); fill.position.set(0, 1.6, 4.6); scene.add(fill);

  const metal = new THREE.MeshStandardMaterial({ color: 0x141920, metalness: 0.85, roughness: 0.4, roughnessMap: brushed, envMapIntensity: 0.6 });
  const darkPlate = new THREE.MeshStandardMaterial({ color: 0x0c1119, metalness: 0.6, roughness: 0.5, envMapIntensity: 0.4 });

  // the MSP hub: platform, console and brand plate
  const hub = new THREE.Group(); scene.add(hub);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.88, 0.1, 64), darkPlate); base.position.y = 0.05; base.receiveShadow = true; base.castShadow = true; hub.add(base);
  const hubRingMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(COOL).multiplyScalar(0.9) });
  const hubRing = new THREE.Mesh(new THREE.TorusGeometry(0.86, 0.004, 8, 96), hubRingMat); hubRing.rotation.x = Math.PI / 2; hubRing.position.y = 0.1; hub.add(hubRing);
  const consoleBody = new THREE.Mesh(slab(THREE, 0.78, 0.9, 0.14, 0.01), metal); consoleBody.position.set(0, 0.1, -0.15); consoleBody.castShadow = true; hub.add(consoleBody);
  const brandMat = new THREE.MeshBasicMaterial({ map: texBrand(THREE), color: new THREE.Color(1, 1, 1) });
  const brand = new THREE.Mesh(new THREE.PlaneGeometry(0.66, 0.44), brandMat); brand.position.set(0, 0.62, -0.079); hub.add(brand);
  const hubSpill = new THREE.Mesh(new THREE.PlaneGeometry(3, 3), spillMaterial(THREE, COOL)); hubSpill.material.uniforms.uHalf.value.set(0.7, 0.7); hubSpill.rotation.x = -Math.PI / 2; hubSpill.position.y = 0.002; scene.add(hubSpill);

  // client environments around the hub
  const ledMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const clients = CLIENT_ANGLES.map((deg, i) => {
    const a = THREE.MathUtils.degToRad(deg), R = 2.25;
    const pos = new THREE.Vector3(Math.cos(a) * R, 0, Math.sin(a) * R);
    const g = new THREE.Group(); g.position.copy(pos); g.rotation.y = -a + Math.PI / 2; scene.add(g);
    const disk = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.44, 0.06, 48), darkPlate); disk.position.y = 0.03; disk.receiveShadow = true; g.add(disk);
    const leds = [];
    for (let k = 0; k < 3; k++) {
      const cab = new THREE.Mesh(slab(THREE, 0.15, 0.4 + (k === 1 ? 0.08 : 0), 0.2, 0.005), metal); cab.position.set(-0.19 + k * 0.19, 0.06, -0.02); cab.castShadow = true; g.add(cab);
      for (let u = 0; u < 5; u++) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.004, 0.003), ledMat.clone()); l.position.set(-0.19 + k * 0.19, 0.12 + u * 0.065, 0.082); g.add(l); leds.push(l); }
    }
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.43, 0.003, 8, 64), new THREE.MeshBasicMaterial({ color: new THREE.Color(COOL).multiplyScalar(0.6) })); ring.rotation.x = Math.PI / 2; ring.position.y = 0.062; g.add(ring);
    return { pos, g, leds, ring, letter: 'ABCDE'[i] };
  });

  // service paths hub <-> clients (the MSP relationship, always on)
  const tube = (curve, color, seed, radius = 0.006) => { const len = curve.getLength(); const mat = pulseMaterial(THREE, color, seed, len); mat.uniforms.uSpeed.value = 1.0; const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 160, radius, 6, false), mat); scene.add(mesh); return { mesh, mat, len, curve }; };
  const pathTo = (c) => {
    const dir = c.pos.clone().normalize();
    const a = dir.clone().multiplyScalar(0.9).setY(0.012), b = c.pos.clone().sub(dir.clone().multiplyScalar(0.45)).setY(0.012);
    const m = a.clone().lerp(b, 0.5).setY(0.04);
    return new THREE.CatmullRomCurve3([a, m, b]);
  };
  const service = clients.map((c, i) => tube(pathTo(c), COOL, r()));
  const work = tube(pathTo(clients[JOB]), ORANGE, 0.1, 0.0075);

  // VALO: the specialist work package arrives from behind and docks at the back of the console
  const DOCK = new THREE.Vector3(0, 0.36, -0.42);
  const approach = new THREE.CatmullRomCurve3([new THREE.Vector3(0.4, 0.5, -7.5), new THREE.Vector3(0.25, 0.42, -4.0), new THREE.Vector3(0.05, 0.38, -1.6), DOCK.clone()]);
  const inbound = tube(approach, ORANGE, 0.3, 0.005);
  const pkg = new THREE.Group(); scene.add(pkg);
  const pkgBody = new THREE.Mesh(slab(THREE, 0.34, 0.16, 0.28, 0.008), new THREE.MeshPhysicalMaterial({ color: 0x15181e, metalness: 0.9, roughness: 0.36, clearcoat: 0.3, envMapIntensity: 0.8 }));
  pkgBody.position.y = -0.08; pkgBody.castShadow = true; pkg.add(pkgBody);
  const seamMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
  [-0.02, 0.03].forEach((y) => { const s = new THREE.Mesh(new THREE.BoxGeometry(0.345, 0.004, 0.285), seamMat); s.position.y = y; pkg.add(s); });
  const pkgLight = new THREE.PointLight(0xff6a1f, 0, 1.2, 2); pkg.add(pkgLight);

  // validation ring at the client and the handover document
  const vRingMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
  const vRing = new THREE.Mesh(new THREE.RingGeometry(0.97, 1.0, 96), vRingMat); vRing.rotation.x = -Math.PI / 2; vRing.position.copy(clients[JOB].pos).setY(0.01); scene.add(vRing);
  const docMat = new THREE.MeshStandardMaterial({ map: texDoc(THREE), color: new THREE.Color(0xaeb7c4), roughness: 0.85, metalness: 0, transparent: true, opacity: 0, emissive: new THREE.Color(0xffffff), emissiveIntensity: 0.1, emissiveMap: null, envMapIntensity: 0.15 });
  docMat.emissiveMap = docMat.map;
  const doc = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.21), docMat); doc.castShadow = true; scene.add(doc);
  const docPath = new THREE.CatmullRomCurve3([DOCK.clone().add(new THREE.Vector3(0, 0.1, 0)), new THREE.Vector3(0, 1.2, -0.15), new THREE.Vector3(0, 0.95, 0.35), clients[JOB].pos.clone().multiplyScalar(0.5).setY(0.55), clients[JOB].pos.clone().setY(0.62)]);

  // distant points for depth
  const dp = [], dc = [], ds = [], dr = rand(13);
  for (let i = 0; i < 260; i++) { const a = dr() * Math.PI * 2, rad = 7 + dr() * 10; dp.push(Math.cos(a) * rad, 0.2 + dr() * 4, Math.sin(a) * rad - 3); dc.push(0.45, 0.62, 1.3); ds.push(dr()); }
  const dGeo = new THREE.BufferGeometry(); dGeo.setAttribute('position', new THREE.Float32BufferAttribute(dp, 3)); dGeo.setAttribute('aColor', new THREE.Float32BufferAttribute(dc, 3)); dGeo.setAttribute('aSeed', new THREE.Float32BufferAttribute(ds, 1));
  const dMat = pointsMaterial(THREE); dMat.uniforms.uFog.value = 0.045; scene.add(new THREE.Points(dGeo, dMat));

  const tmpC = new THREE.Color(), size = new THREE.Vector2(), up = new THREE.Vector3();
  const arrive = (t) => smooth(5.9, 9.2, t);

  return {
    duration: L,
    floor: { tile: 0.7, base: 0x04070d },
    chapters: [{ start: 0, label: 'Scope' }, { start: 5.5, label: 'Engineer' }, { start: 11, label: 'Validate' }, { start: 16.5, label: 'Hand over' }],
    labels: [
      { text: 'Your MSP', at: (t, v) => v.set(0, 1.15, -0.15), alpha: (t) => (1 - smooth(5.0, 5.6, t)) + smooth(17.0, 17.8, t) },
      { text: 'Client environments', at: (t, v) => v.copy(clients[3].pos).setY(0.75), alpha: (t) => smooth(0.8, 1.8, t) * (1 - smooth(4.8, 5.4, t)) },
      { text: 'Specialist work package', tone: 'accent', at: (t, v) => v.copy(pkg.position).add(up.set(0, 0.24, 0)), alpha: (t) => smooth(6.6, 7.4, t) * (1 - smooth(10.2, 10.8, t)) },
      { text: 'Client C', at: (t, v) => v.copy(clients[JOB].pos).setY(0.72), alpha: (t) => smooth(11.4, 12.2, t) * (1 - smooth(16.0, 16.5, t)) },
      { text: 'Handover, in your name', tone: 'ok', at: (t, v) => v.copy(doc.position).add(up.set(0, 0.2, 0)), alpha: (t) => smooth(18.4, 19.0, t) * (1 - smooth(21.2, 21.7, t)) }
    ],
    fade: (t) => shotFade(SHOTS, t),
    update(t) {
      service.forEach((s, i) => { s.mat.uniforms.uTime.value = t; s.mat.uniforms.uActive.value = i === JOB ? 0.55 : 0.4; });
      // package arrives along its own path and docks behind the console
      const ar = arrive(t);
      inbound.mat.uniforms.uTime.value = t; inbound.mat.uniforms.uActive.value = smooth(5.6, 6.2, t) * (1 - smooth(9.2, 10.0, t));
      inbound.mesh.visible = inbound.mat.uniforms.uActive.value > 0.01;
      approach.getPoint(Math.min(1, 0.02 + ar * 0.98), pkg.position);
      pkg.visible = t > 5.6;
      pkg.rotation.y = (1 - ar) * 0.6;
      const glow = smooth(6.0, 6.8, t) * (1 - 0.6 * smooth(19.5, 21, t));
      seamMat.color.set(ORANGE).multiplyScalar(0.2 + 1.6 * glow);
      pkgLight.intensity = 0.3 * glow;

      // work goes out to one client: configuration, then validation
      work.mat.uniforms.uTime.value = t; work.mat.uniforms.uActive.value = smooth(11.2, 11.8, t) * (1 - smooth(14.2, 14.8, t));
      work.mesh.visible = work.mat.uniforms.uActive.value > 0.01;
      const config = smooth(12.4, 13.0, t) * (1 - smooth(14.6, 15.4, t));
      clients.forEach((c, i) => c.leds.forEach((l, k) => {
        const ph = Math.sin(k * 12.9898 + i * 4.1) * 43758.5; const f = ph - Math.floor(ph);
        const blink = Math.sin(t * (2 + f * 5) + f * 20) > -0.3 ? 1 : 0.25;
        if (i === JOB && config > 0) tmpC.set(ORANGE).multiplyScalar((0.6 + 1.2 * blink) * config + 0.5 * (1 - config));
        else tmpC.setRGB(0.45, 1.1, 0.7).multiplyScalar(0.25 + 0.5 * blink * (f > 0.3 ? 1 : 0.3));
        l.material.color.copy(tmpC);
      }));
      const vu = (t - 14.4) / 1.6;
      if (vu > 0 && vu < 1) { const s = 0.45 + vu * 0.55; vRing.scale.set(s, s, 1); vRingMat.color.set(0xd8ecff).multiplyScalar(2.0 * Math.sin(vu * Math.PI)); } else vRingMat.color.setRGB(0, 0, 0);

      // handover: document leaves the package, passes over the MSP brand and goes to the client
      const du = smooth(16.9, 20.4, t);
      docPath.getPoint(du, doc.position);
      doc.lookAt(doc.position.x, doc.position.y + 1, doc.position.z + 1.2);
      docMat.opacity = smooth(16.8, 17.3, t) * (1 - smooth(21.0, 21.6, t));
      doc.visible = docMat.opacity > 0.01;
      const brandPulse = 1 + 0.5 * Math.exp(-Math.pow((t - 18.3) * 2.2, 2));
      brandMat.color.setScalar(0.85 * brandPulse);
      hubRingMat.color.set(COOL).multiplyScalar(0.7 + 0.6 * (brandPulse - 1));
      hubSpill.material.uniforms.uI.value = 0.08 + 0.1 * (brandPulse - 1);
      clients[JOB].ring.material.color.set(COOL).multiplyScalar(0.6 + 1.2 * smooth(20.0, 20.6, t));

      renderer.getDrawingBufferSize(size); dMat.uniforms.uTime.value = t; dMat.uniforms.uScale.value = size.y * 0.012;
    },
    camera(t, out) {
      shotCamera(SHOTS, [
        [[-1.2, 2.3, 5.2], [0.7, 2.1, 4.9], [0.0, 0.35, 0.4], [0.2, 0.35, 0.4], 36, 0.0],
        [[2.1, 0.95, -2.5], [1.5, 0.78, -1.95], [0.15, 0.4, -1.0], [0.0, 0.42, -0.5], 32, -0.04],
        [[2.7, 1.55, 3.6], [2.2, 1.4, 3.9], [0.2, 0.3, 1.0], [0.45, 0.3, 1.6], 34, 0.0],
        [[-1.7, 2.9, 4.6], [-1.25, 2.6, 4.1], [0.2, 0.35, 0.6], [0.2, 0.35, 0.6], 34, 0.0]
      ], t, out);
    }
  };
}
