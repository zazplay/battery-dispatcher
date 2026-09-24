import * as THREE from 'three';
import type { Snapshot } from '../sim/day';
import { VIEW_DIR } from './Stage';

/* The energy site model from the original Claude Design mockup: solar arrays, six battery containers,
   PCS + AI controller cabinet, two pylons with overhead lines, buried cables with energy pulses. */

if (import.meta.hot) import.meta.hot.accept(() => location.reload()); // see Stage.ts

type Mat = THREE.MeshStandardMaterial;
const M = (name: string, color: number, rough = 0.7, metal = 0, extra: THREE.MeshStandardMaterialParameters = {}): Mat =>
  Object.assign(new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal, ...extra }), { name });
const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const UP = V(0, 1, 0);
/** Severity colours of the diagnostics, shared by the 3D beacon and the DOM callouts. */
export const SEV_COLOR = { crit: '#e5484d', warn: '#f59e0b', info: '#3b6cff', ok: '#16a34a' } as const;
export type Sev = keyof typeof SEV_COLOR;

export interface Flow {
  name: string;
  curve: THREE.CurvePath<THREE.Vector3>;
  mat: Mat;
  len: number;
  on: number;
  amt: number;
  dashes: { m: THREE.Object3D; off: number }[];
}
export type LabelId = 'grid' | 'bat' | 'ai' | 'pv';
export type TargetId = 'unit3' | 'unit5' | 'row2' | 'pcs' | 'pylonB' | 'bess';
export interface Site {
  root: THREE.Group;
  flows: Flow[];
  flow: Record<'solarTrunk' | 'solarBattery' | 'batteryGrid' | 'solarGrid', Flow>;
  socMat: Mat[];
  aiMat: Mat;
  greenMat: Mat;
  aiRing: THREE.Mesh;
  aiPos: THREE.Vector3;
  waves: { m: THREE.Mesh; mat: Mat; off: number }[];
  fans: THREE.Object3D[];
  anchors: Record<LabelId, THREE.Vector3>;
  /** Bounds of the objects that matter (pylons, batteries, solar rows) — used to frame the scene tighter on phones. */
  coreBox: THREE.Box3;
  /** Objects the diagnostics can point at. */
  targets: Record<TargetId, THREE.Object3D>;
  /** Pulsing marker (ring on the ground + bobbing pin) that the diagnostics place over a faulty object. */
  beacon: { group: THREE.Group; ring: THREE.Mesh; pin: THREE.Mesh; mat: THREE.MeshBasicMaterial };
}

export function buildSite(): Site {
  const root = new THREE.Group();
  root.name = 'energy_site';

  const mat = {
    concrete: M('concrete', 0xd9dce0, 0.85),
    cladding: M('cladding_dark', 0x4a4e55, 0.6, 0.2),
    roof: M('roof', 0x9a9ea5, 0.8),
    steel: M('steel_dark', 0x3a3d42, 0.5, 0.35),
    panel: M('pv_cell', 0x2c3a52, 0.3, 0.3),
    frame: M('aluminium', 0xb8bcc2, 0.4, 0.35),
    battery: M('battery_shell', 0xf7f8f9, 0.5, 0.05),
    vent: M('vent_grey', 0x8d9299, 0.6, 0.2),
    green: M('accent_green', 0x22c55e, 0.4, 0, { emissive: 0x16a34a, emissiveIntensity: 0.6 }),
    warm: M('warm_light', 0xf3b76a, 0.5, 0, { emissive: 0xe89a4a, emissiveIntensity: 0.7 }),
    cable: M('cable', 0xbfc3c8, 0.8),
  };

  const add = (parent: THREE.Object3D, name: string, geo: THREE.BufferGeometry, m: THREE.Material, x = 0, y = 0, z = 0, cast = true) => {
    const mesh = new THREE.Mesh(geo, m);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.castShadow = cast;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  };
  const box = (p: THREE.Object3D, n: string, w: number, h: number, d: number, m: THREE.Material, x: number, y: number, z: number) =>
    add(p, n, new THREE.BoxGeometry(w, h, d), m, x, y, z);
  const beam = (p: THREE.Object3D, n: string, a: THREE.Vector3, b: THREE.Vector3, r: number, m: THREE.Material) => {
    const dir = new THREE.Vector3().subVectors(b, a);
    const len = dir.length();
    const mesh = add(p, n, new THREE.CylinderGeometry(r, r, len, 6), m);
    mesh.position.copy(a).addScaledVector(dir, 0.5);
    mesh.quaternion.setFromUnitVectors(UP, dir.normalize());
    return mesh;
  };

  const SPREAD = 1.4;

  // ---------- Building (built like in the mockup, then removed from the scene) ----------
  const bld = new THREE.Group();
  bld.name = 'building';
  bld.position.set(0, 0, -22);
  root.add(bld);
  const BW = 34, BD = 20, BH = 13;
  box(bld, 'plinth', BW + 0.4, 3.2, BD + 0.4, mat.concrete, 0, 1.6, 0);
  box(bld, 'cladding', BW, BH - 3.2 - 0.002, BD, mat.cladding, 0, 3.2 + (BH - 3.2) / 2, 0);
  box(bld, 'roof', BW - 0.4, 0.1, BD - 0.4, mat.roof, 0, BH + 0.06, 0);

  // ---------- Pylons ----------
  function pylon(name: string, x: number, z: number) {
    const g = new THREE.Group();
    g.name = name;
    g.position.set(x, 0, z);
    root.add(g);
    const H = 26, base = 3.2, top = 0.7;
    const w = (y: number) => base + (top - base) * (y / H);
    const corners: [number, number][] = [[1, 1], [1, -1], [-1, -1], [-1, 1]];
    corners.forEach(([sx, sz], i) => beam(g, `leg_${i}`, V(sx * base, 0, sz * base), V(sx * top, H, sz * top), 0.12, mat.steel));
    const levels = 9;
    for (let l = 0; l < levels; l++) {
      const y0 = (l / levels) * H, y1 = ((l + 1) / levels) * H, a = w(y0), b = w(y1);
      for (let f = 0; f < 4; f++) {
        const [sx0, sz0] = corners[f], [sx1, sz1] = corners[(f + 1) % 4];
        const p0 = V(sx0 * a, y0, sz0 * a), p1 = V(sx1 * a, y0, sz1 * a);
        const q0 = V(sx0 * b, y1, sz0 * b), q1 = V(sx1 * b, y1, sz1 * b);
        beam(g, `brace_${l}_${f}_a`, p0, q1, 0.05, mat.steel);
        beam(g, `brace_${l}_${f}_b`, p1, q0, 0.05, mat.steel);
        beam(g, `ring_${l}_${f}`, q0, q1, 0.06, mat.steel);
      }
    }
    ([[H * 0.62, 6], [H * 0.78, 5], [H * 0.92, 3.8]] as [number, number][]).forEach(([y, len], k) => {
      const hw = w(y);
      for (const s of [1, -1]) {
        beam(g, `arm_${k}_${s}_top`, V(s * hw, y, hw), V(s * (hw + len), y, 0), 0.07, mat.steel);
        beam(g, `arm_${k}_${s}_bot`, V(s * hw, y, -hw), V(s * (hw + len), y, 0), 0.07, mat.steel);
        beam(g, `arm_${k}_${s}_low`, V(s * hw, y - 1.2, 0), V(s * (hw + len), y, 0), 0.06, mat.steel);
        add(g, `insulator_${k}_${s}`, new THREE.CylinderGeometry(0.18, 0.18, 1.4, 12), mat.frame, s * (hw + len - 0.3), y - 0.7, 0);
      }
    });
    beam(g, 'peak', V(0, H, 0), V(0, H + 2.5, 0), 0.08, mat.steel);
    corners.forEach(([sx, sz], i) => box(g, `footing_${i}`, 1.2, 0.4, 1.2, mat.concrete, sx * base, 0.2, sz * base));
    return g;
  }
  const pA = pylon('pylon_A', -46, -6);
  pA.rotation.y = Math.PI / 4;
  const pB = pylon('pylon_B', -36, 16);
  pB.rotation.y = Math.PI / 4;

  // ---------- Solar arrays ----------
  function solarRow(name: string, x: number, z: number) {
    const g = new THREE.Group();
    g.name = name;
    g.position.set(x, 0, z);
    g.rotation.y = -Math.PI / 14;
    root.add(g);
    const cols = 14, rows = 4, pw = 1.9, ph = 1.1, tilt = THREE.MathUtils.degToRad(28);
    const table = new THREE.Group();
    table.name = 'table';
    table.position.y = 3.0;
    table.rotation.x = tilt;
    g.add(table);
    const W = cols * (pw + 0.04), D = rows * (ph + 0.04);
    box(table, 'table_frame', W + 0.2, 0.08, D + 0.2, mat.frame, 0, -0.06, 0);
    for (let c = 0; c < cols; c++)
      for (let r = 0; r < rows; r++)
        box(table, `module_${c}_${r}`, pw, 0.05, ph, mat.panel, -W / 2 + (c + 0.5) * (pw + 0.04), 0.01, -D / 2 + (r + 0.5) * (ph + 0.04));
    for (let i = 0; i < 5; i++) {
      const px = -W / 2 + 1 + (i * (W - 2)) / 4;
      const fz = (Math.cos(tilt) * D) / 2, fy = (Math.sin(tilt) * D) / 2;
      beam(g, `post_front_${i}`, V(px, 0, fz - 0.2), V(px, 2.2 - fy + 0.1, fz - 0.2), 0.07, mat.frame);
      beam(g, `post_back_${i}`, V(px, 0, -fz + 0.2), V(px, 2.2 + fy - 0.1, -fz + 0.2), 0.07, mat.frame);
      beam(g, `strut_${i}`, V(px, 0, fz - 0.2), V(px, 2.2 + fy - 0.1, -fz + 0.2), 0.05, mat.frame);
    }
    return g;
  }
  const rows: THREE.Group[] = [];
  for (let r = 0; r < 4; r++) rows[r] = solarRow(`solar_row_${r + 1}`, 34, r * 8);

  // ---------- Battery storage ----------
  const socMat = [0, 1, 2, 3].map((i) => M(`soc_led_${i}`, 0x22c55e, 0.4, 0, { emissive: 0x16a34a, emissiveIntensity: 0.6 }));
  const bess = new THREE.Group();
  bess.name = 'battery_storage';
  bess.position.set(0, 0, 12);
  bess.rotation.y = -Math.PI / 14;
  root.add(bess);
  box(bess, 'bess_pad', 34, 0.3, 17, M('pad_dark', 0x9ea3aa, 0.9), 0, 0.15, 0);
  const UW = 8, UH = 3.2, UD = 3;
  for (let u = 0; u < 6; u++) {
    const g = new THREE.Group();
    g.name = `battery_unit_${u + 1}`;
    g.position.set(-11 + (u % 3) * 9.4, 0.3, u < 3 ? -3.8 : 3.8);
    bess.add(g);
    box(g, 'shell', UW, UH, UD, mat.battery, 0, UH / 2, 0);
    box(g, 'roof_cap', UW + 0.1, 0.12, UD + 0.1, mat.vent, 0, UH + 0.06, 0);
    box(g, 'base_rail', UW + 0.05, 0.14, UD + 0.05, mat.steel, 0, 0.07, 0);
    for (let d = 0; d < 4; d++) {
      const dx = -UW / 2 + 1.0 + d * 2.0;
      box(g, `door_${d}`, 1.9, UH - 0.5, 0.03, mat.battery, dx, UH / 2, UD / 2 + 0.016);
      box(g, `door_seam_${d}`, 0.03, UH - 0.5, 0.04, mat.vent, dx + 0.98, UH / 2, UD / 2 + 0.01);
      box(g, `handle_${d}`, 0.05, 0.35, 0.06, mat.steel, dx + 0.75, UH / 2, UD / 2 + 0.05);
      for (let s = 0; s < 4; s++) box(g, `louvre_${d}_${s}`, 1.0, 0.04, 0.03, mat.vent, dx, 0.55 + s * 0.12, UD / 2 + 0.04);
    }
    box(g, 'status_bar', 1.2, 0.12, 0.03, mat.green, UW / 2 - 1.0, UH - 0.22, UD / 2 + 0.035);
    box(g, 'hvac', 0.5, 1.2, 1.4, mat.vent, UW / 2 + 0.25, 1.4, 0);
    add(g, 'hvac_fan', new THREE.CylinderGeometry(0.42, 0.42, 0.04, 32), mat.steel, UW / 2 + 0.52, 1.4, 0).rotation.z = Math.PI / 2;
    for (let b = 0; b < 4; b++) box(g, `soc_${b}`, 0.03, 0.14, 0.4, socMat[b], -UW / 2 - 0.016, 1.0 + b * 0.2, 0);
  }
  const pcs = new THREE.Group();
  pcs.name = 'inverter_pcs';
  pcs.position.set(15, 0.3, 0);
  bess.add(pcs);
  box(pcs, 'pcs_body', 2.2, 2.2, 1.8, mat.vent, 0, 1.1, 0);
  box(pcs, 'pcs_panel', 1.6, 1.4, 0.03, mat.battery, 0, 1.2, 0.916);
  box(pcs, 'pcs_led', 0.4, 0.08, 0.03, mat.green, 0, 1.75, 0.94);
  const aiMat = M('ai_glow', 0x5b8cff, 0.35, 0, { emissive: 0x3b6cff, emissiveIntensity: 0.9 });
  const ai = new THREE.Group();
  ai.name = 'ai_controller';
  ai.position.set(15, 0.3, -4.5);
  bess.add(ai);
  box(ai, 'ai_body', 1.8, 2.6, 1.6, mat.steel, 0, 1.3, 0);
  box(ai, 'ai_screen', 1.2, 0.7, 0.03, aiMat, 0, 1.9, 0.816);
  for (let s = 0; s < 3; s++) box(ai, `ai_rack_${s}`, 1.3, 0.08, 0.03, mat.vent, 0, 0.6 + s * 0.3, 0.816);
  add(ai, 'ai_mast', new THREE.CylinderGeometry(0.06, 0.06, 2.2, 12), mat.frame, 0, 3.7, 0);
  const aiCore = add(ai, 'ai_core', new THREE.SphereGeometry(0.32, 32, 16), aiMat, 0, 4.9, 0);
  const aiRing = add(ai, 'ai_ring', new THREE.TorusGeometry(0.7, 0.05, 12, 64), aiMat, 0, 4.9, 0);
  const bolt = new THREE.Shape(
    ([[0.3, 1], [-0.35, -0.05], [0.02, -0.05], [-0.3, -1], [0.38, 0.12], [0.0, 0.12]] as [number, number][]).map((p) => new THREE.Vector2(...p)),
  );
  const boltMesh = add(bess, 'roof_emblem', new THREE.ExtrudeGeometry(bolt, { depth: 0.04, bevelEnabled: false }), mat.green, -1.6, 0.3 + UH + 0.13, 3.8);
  boltMesh.rotation.x = -Math.PI / 2;

  // ---------- Spread layout, then wire real connections ----------
  root.children.forEach((c) => {
    if ((c as THREE.Group).isGroup) {
      c.position.x *= SPREAD;
      c.position.z *= SPREAD;
    }
  });
  root.updateMatrixWorld(true);
  const coreBox = new THREE.Box3();
  [pA, pB, bess, ...rows].forEach((g) => coreBox.expandByObject(g));
  const W = (obj: THREE.Object3D, x: number, y: number, z: number) => obj.localToWorld(V(x, y, z));
  const net = new THREE.Group();
  net.name = 'cables';
  root.add(net);
  const flows: Flow[] = [];
  function terminal(name: string, p: THREE.Vector3, h = 1.2) {
    add(net, name + '_riser', new THREE.CylinderGeometry(0.2, 0.2, h, 12), mat.cable, p.x, h / 2, p.z);
    box(net, name + '_junction', 0.9, 0.7, 0.9, mat.vent, p.x, h, p.z);
  }
  function orthoPath(pts: THREE.Vector3[], r = 4) {
    const path = new THREE.CurvePath<THREE.Vector3>();
    const P = pts.map((p) => V(p.x, 0.18, p.z));
    let cur = P[0];
    for (let i = 1; i < P.length - 1; i++) {
      const inD = P[i].clone().sub(P[i - 1]), outD = P[i + 1].clone().sub(P[i]);
      const rr = Math.min(r, inD.length() / 2, outD.length() / 2);
      const s = P[i].clone().addScaledVector(inD.normalize(), -rr), e = P[i].clone().addScaledVector(outD.normalize(), rr);
      if (cur.distanceTo(s) > 1e-3) path.add(new THREE.LineCurve3(cur, s));
      path.add(new THREE.QuadraticBezierCurve3(s, P[i].clone(), e));
      cur = e;
    }
    path.add(new THREE.LineCurve3(cur, P[P.length - 1]));
    return path;
  }
  function cable(name: string, pts: THREE.Vector3[], flow: Mat): Flow {
    const curve = orthoPath(pts);
    const segs = Math.max(64, Math.round(curve.getLength() * 3));
    add(net, name, new THREE.TubeGeometry(curve, segs, 0.28, 12, false), mat.cable, 0, 0, 0, false);
    terminal(name + '_a', pts[0]);
    terminal(name + '_b', pts[pts.length - 1]);
    const f: Flow = { name, curve, mat: flow, len: curve.getLength(), on: 1, amt: 1, dashes: [] };
    flows.push(f);
    return f;
  }
  const pBfoot = W(pB, 0, 0, 0);
  const pcsOut = W(pcs, 1.8, -0.3, 0), bessBack = W(bess, -4, 0, -9.5);
  root.remove(bld);
  const comb = rows.map((g, r) => {
    const p = W(g, -15.2, 0, 2.6);
    box(net, `combiner_box_${r + 1}`, 1.0, 1.4, 0.5, mat.battery, p.x, 0.7, p.z);
    return p;
  });
  const cx = comb[0].x, busZ = -6, loopZ = 52, midX = (cx + pcsOut.x) / 2;
  const P2 = (x: number, z: number) => V(x, 0, z);
  const flow = {
    solarTrunk: cable('cable_solar_trunk', [comb[3], comb[0]], mat.green),
    solarBattery: cable('cable_solar_battery', [comb[0], P2(midX, comb[0].z), P2(midX, pcsOut.z), pcsOut], mat.green),
    batteryGrid: cable('cable_battery_grid', [bessBack, P2(bessBack.x, busZ), P2(pBfoot.x, busZ), pBfoot], mat.green),
    solarGrid: cable('cable_solar_grid', [comb[3], P2(cx - 4, comb[3].z), P2(cx - 4, loopZ), P2(pBfoot.x, loopZ), pBfoot], mat.green),
  };

  // overhead conductors between the pylons
  const tipsA: THREE.Object3D[] = [], tipsB: THREE.Object3D[] = [];
  pA.traverse((o) => { if (o.name.startsWith('insulator_')) tipsA.push(o); });
  pB.traverse((o) => { if (o.name.startsWith('insulator_')) tipsB.push(o); });
  tipsA.forEach((ia, k) => {
    const a = ia.localToWorld(V(0, -0.7, 0)), b = tipsB[k].localToWorld(V(0, -0.7, 0));
    const mid = a.clone().lerp(b, 0.5);
    mid.y -= 2.2;
    add(net, `overhead_line_${k}`, new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(a, mid, b), 48, 0.05, 6, false), mat.steel, 0, 0, 0, false);
  });

  // ---------- Animation helpers: energy orbs, AI signal rings, fans, alert beacon ----------
  const fx = new THREE.Group();
  fx.name = 'energy_flow_fx';
  root.add(fx);
  // energy pulses: a glowing yellow orb with a soft halo and a lightning-bolt sprite (the second mockup's look)
  const orbGeo = new THREE.SphereGeometry(1.0, 24, 16);
  const orbMat = M('energy_orb', 0xfacc15, 0.3, 0, { emissive: 0xf5b301, emissiveIntensity: 0.9 });
  const boltTex = (() => {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const g = c.getContext('2d')!;
    g.translate(64, 64);
    g.beginPath();
    ([[10, -52], [-26, 6], [-2, 6], [-12, 52], [26, -10], [2, -10], [10, -52]] as [number, number][]).forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
    g.closePath();
    g.lineJoin = 'round';
    g.lineWidth = 8;
    g.strokeStyle = '#b45309';
    g.stroke();
    g.fillStyle = '#ffffff';
    g.fill();
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  })();
  // depthTest on (unlike the mockup) so a bolt behind a solar row is hidden by it; no depth write + alphaTest so its transparent corners don't cut holes in the halo
  const boltMat = new THREE.SpriteMaterial({ map: boltTex, depthTest: true, depthWrite: false, alphaTest: 0.2, transparent: true });
  const haloMat = new THREE.MeshBasicMaterial({ color: 0xfde047, transparent: true, opacity: 0.3, depthWrite: false });
  const haloGeo = new THREE.SphereGeometry(1.45, 20, 14);
  const noShadow = (o: THREE.Object3D) => { o.castShadow = false; o.receiveShadow = false; o.userData.noShadow = true; };
  flows.forEach((f) => {
    const n = Math.max(2, Math.round(f.len / 11));
    for (let k = 0; k < n; k++) {
      const m = new THREE.Group();
      m.name = 'energy_orb';
      const core = new THREE.Mesh(orbGeo, orbMat); core.name = 'orb_core'; noShadow(core); m.add(core);
      const halo = new THREE.Mesh(haloGeo, haloMat); halo.name = 'orb_halo'; noShadow(halo); m.add(halo);
      const bolt = new THREE.Sprite(boltMat); bolt.name = 'orb_bolt'; bolt.scale.set(1.7, 1.7, 1); bolt.renderOrder = 10;
      bolt.position.copy(VIEW_DIR).multiplyScalar(1.6); // in front of the orb as seen from the camera, so the depth test passes against the orb but not against a panel
      m.add(bolt);
      fx.add(m);
      f.dashes.push({ m, off: k / n });
    }
  });
  // alert beacon: red ring on the ground + a pin bobbing above the object; hidden until the diagnostics use it
  const beaconMat = new THREE.MeshBasicMaterial({ color: 0xe5484d, transparent: true, opacity: 0.8, depthWrite: false });
  const beaconGroup = new THREE.Group();
  beaconGroup.name = 'alert_beacon';
  beaconGroup.visible = false;
  fx.add(beaconGroup);
  const bRing = new THREE.Mesh(new THREE.TorusGeometry(1, 0.12, 8, 48), beaconMat); bRing.rotation.x = Math.PI / 2; noShadow(bRing); beaconGroup.add(bRing);
  const bPin = new THREE.Mesh(new THREE.SphereGeometry(0.6, 16, 12), beaconMat); noShadow(bPin); beaconGroup.add(bPin);
  const waves = [0, 1, 2].map((k) => {
    const wm = aiMat.clone();
    wm.transparent = true;
    const m = new THREE.Mesh(new THREE.TorusGeometry(1, 0.06, 8, 64), wm);
    m.name = 'ai_signal';
    m.rotation.x = Math.PI / 2;
    m.castShadow = false;
    m.receiveShadow = false;
    m.userData.noShadow = true;
    fx.add(m);
    return { m, mat: wm, off: k / 3 };
  });
  const aiPos = aiCore.getWorldPosition(V(0, 0, 0));
  const fans: THREE.Object3D[] = [];
  root.traverse((o) => { if (o.name === 'hvac_fan') fans.push(o); });

  return {
    root,
    flows,
    flow,
    socMat,
    aiMat,
    greenMat: mat.green,
    aiRing,
    aiPos,
    waves,
    fans,
    anchors: {
      grid: pB.localToWorld(V(0, 28.5, 0)),
      bat: W(bess, -4, 4, 0),
      ai: aiPos.clone().add(V(0, 1.2, 0)),
      pv: W(rows[1], 9, 4, 0), // right part of the second row, so the label stays clear of the AI / battery callouts
    },
    coreBox,
    targets: {
      unit3: bess.getObjectByName('battery_unit_3')!,
      unit5: bess.getObjectByName('battery_unit_5')!,
      row2: rows[1],
      pcs,
      pylonB: pB,
      bess,
    },
    beacon: { group: beaconGroup, ring: bRing, pin: bPin, mat: beaconMat },
  };
}

/** Advance the visual state of the site to the current simulation snapshot. */
export function animateSite(site: Site, s: Snapshot) {
  const { t, dt, mode } = s;
  site.aiRing.rotation.y = t * 1.5;
  site.aiRing.rotation.x = Math.sin(t) * 0.4;
  site.waves.forEach((w) => {
    const u = (w.off + t * 0.5) % 1;
    w.m.position.set(site.aiPos.x, 0.6, site.aiPos.z);
    w.m.scale.setScalar(1 + u * 14);
    w.mat.opacity = (1 - u) * (mode === 'hold' ? 0.25 : 0.7);
  });
  site.flow.solarTrunk.on = s.flows.solarTrunk ? 1 : 0;
  site.flow.solarBattery.on = s.flows.solarBattery ? 1 : 0;
  site.flow.batteryGrid.on = s.flows.batteryGrid ? 1 : 0;
  site.flow.solarGrid.on = s.flows.solarGrid ? 1 : 0;
  site.flows.forEach((f) => {
    f.amt += (f.on - f.amt) * Math.min(1, dt * 4);
    f.dashes.forEach((p) => {
      const u = (p.off + (t * 6) / f.len) % 1;
      const pos = f.curve.getPointAt(u);
      p.m.position.set(pos.x, 0.6, pos.z);
      const fade = Math.min(1, u * 12, (1 - u) * 12) * f.amt;
      p.m.visible = fade > 0.02;
      p.m.scale.setScalar(fade * (1 + 0.06 * Math.sin(t * 8 + p.off * 30)));
    });
  });
  site.fans.forEach((fn) => { fn.rotation.x = t * 6; });
  site.greenMat.emissiveIntensity = 0.45 + 0.35 * (0.5 + 0.5 * Math.sin(t * 3));
  site.socMat.forEach((m, i) => {
    const lit = s.soc > i / 4 + 0.05;
    m.color.setHex(lit ? 0x22c55e : 0x8d9299);
    m.emissiveIntensity = lit ? 0.6 : 0;
  });
  site.aiMat.emissiveIntensity = mode === 'hold' ? 0.5 : 1.1;
}
