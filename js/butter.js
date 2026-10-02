// Shared parts for ButterClear: the numbers (milk composition, Stokes' law, the solid fat curve of
// milk fat, the churning model, FSSAI limits), colours, chart boards, instanced globules, and the
// 3D clay pot (matka) with its wooden churn (mathani) that several chapters reuse.
// Sources used across the box:
//  [DPH]   Tetra Pak, Dairy Processing Handbook: "The chemistry of milk" (composition table 2.3,
//          globules 0.1–20 µm, average 3–4 µm, membrane 10–20 nm, fat 0.93 g/cm³ at 15.5 °C, casein
//          micelles about 150 nm), "Centrifugal separators and milk standardisation" (Stokes' law
//          worked example, 5,400 rpm at 0.2 m, skim milk left with 0.04–0.07% fat), "Butter"
//          (Codex: at least 80% milk fat, at most 16% water and 2% milk solids-not-fat).
//  [FSSAI] Food Safety and Standards (Food Products Standards and Food Additives) Regulations, 2011:
//          table butter at least 80.0% milk fat, at most 16.0% moisture, 1.5% curd, 3.0% salt;
//          desi (cooking) butter at least 76.0% milk fat.
//  [FAO]   FAO/ILCA, traditional sour-milk churning in a clay pot: 67% of the fat recovered at 18 °C,
//          44% at 25 °C (fao.org/4/V1650T/v1650T0m.htm).
//  [WIKI]  Wikipedia, "Churning (butter)" (cream at 55–60 °F, about three-quarters of an hour by hand)
//          and "Butter" (melts to a thin liquid at 32–35 °C).
import { THREE, M, clamp, lerp, smooth, arrow } from './kit.js';

export const TAU = Math.PI * 2;
export const G = 9.81;

// ---------------------------------------------------------------- milk
// Typical composition, % by weight. Cow: the means of [DPH] table 2.3. Buffalo: typical figures
// from reviews of buffalo milk (about 7% fat, 4.3% protein, 5% lactose). Water is what is left.
// d = average fat globule diameter in µm (cow 3–4 µm [DPH]; buffalo about 5 µm, typical).
export const MILKS = {
  cow: { name: 'Cow milk', fat: 3.9, protein: 3.4, lactose: 4.8, ash: 0.8, d: 3.5 },
  buffalo: { name: 'Buffalo milk', fat: 7.0, protein: 4.3, lactose: 5.0, ash: 0.8, d: 5.0 },
  cream: { name: 'Cream (40% fat)', fat: 40, protein: 2.1, lactose: 3.0, ash: 0.5, d: 3.5 },
};
export const waterOf = (m) => 100 - m.fat - m.protein - m.lactose - m.ash;
export const RHO_FAT = 930;      // kg/m³ at 15.5 °C [DPH]
export const RHO_SKIM = 1035;    // kg/m³, skim milk at about 20 °C (milk is 1,028–1,038 [DPH])
export const ETA = 1.42e-3;      // Pa·s, the viscosity used in the [DPH] Stokes example
// Share of the volume taken up by fat, from the share by weight.
export const fatVol = (fatPct) => { const f = fatPct / 100; return (f / RHO_FAT) / (f / RHO_FAT + (1 - f) / RHO_SKIM); };
// Globules per millilitre if every globule had the average diameter d (µm).
export const perMl = (fatPct, d) => fatVol(fatPct) / ((Math.PI / 6) * Math.pow(d * 1e-4, 3));
// Membrane area (m²) wrapped around the fat in one litre: 6 φ ÷ d.
export const areaPerL = (fatPct, d) => (6 * fatVol(fatPct)) / (d * 1e-6) / 1000;

// ---------------------------------------------------------------- creaming
// Stokes' law: the steady speed (m/s) of a small sphere of diameter d (µm) through a liquid.
// v = d² Δρ a ÷ 18 η. [DPH] works it with Δρ = 48 kg/m³ and gets 0.6 mm/h for a 3 µm globule; with
// the handbook's own fat density (930) against skim milk (1,035) Δρ is about 105 and the same
// globule rises about 1.3 mm/h. Either way: millimetres per hour.
export const D_RHO = RHO_SKIM - RHO_FAT;
export const stokes = (dUm, a = G) => (Math.pow(dUm * 1e-6, 2) * D_RHO * a) / (18 * ETA);
// Centripetal acceleration (m/s²) at radius r (m) in a bowl turning at `rpm`.
export const spinAcc = (rpm, r) => Math.pow((rpm * TAU) / 60, 2) * r;

// ---------------------------------------------------------------- fat crystals
// Solid fat content of milk fat (% of the fat that is crystal) against temperature. Milk fat is a
// mix of hundreds of triglycerides that melt anywhere from about −40 °C to about +40 °C, so it has a
// melting range, not a melting point. These are typical textbook values (after Walstra, Dairy
// Science and Technology); real butter shifts by several points with season, feed and breed.
const SFC = [[-40, 100], [-20, 82], [-10, 70], [0, 58], [5, 50], [10, 41], [15, 30], [20, 19], [25, 11], [30, 5], [35, 1.5], [40, 0], [60, 0]];
export function sfc(T) {
  if (T <= SFC[0][0]) return 100;
  for (let i = 1; i < SFC.length; i++) if (T <= SFC[i][0]) { const [t0, v0] = SFC[i - 1], [t1, v1] = SFC[i]; return v0 + ((v1 - v0) * (T - t0)) / (t1 - t0); }
  return 0;
}
export const SFC_PTS = SFC.filter(([t]) => t >= -20 && t <= 45);

// ---------------------------------------------------------------- the churn
// A rope wound round a rod of radius r (m): pulling a length L (m) turns the rod by L ÷ r radians.
// One full stroke is a pull one way and a pull back, so the rod swings ±L÷2r about the middle.
export const churnSwing = (L, r) => L / r;                                       // radians per pull
export const churnPeak = (L, r, spm) => (L / (2 * r)) * TAU * (spm / 60);          // rad/s at mid-pull
// Time (minutes) for the cream to "break" into butter grains. There is no neat law for this, so this
// is a rule-of-thumb model, anchored on old dairy practice: cream at about 14 °C churned by hand
// breaks in about 45 minutes [WIKI]. Warmer cream has more liquid fat to glue clumps together, so
// it breaks sooner (here: e-fold for every 6 °C); faster churning means more collisions (time ∝ 1 ÷
// speed); soured cream or dahi breaks a little sooner than sweet cream (×0.8, dairy texts say
// "ripened cream churns more easily"). Below about 7 °C the fat is too hard to stick; above about
// 28 °C too little of it is crystal, and it smears into an oily paste instead of grains.
export const T_COLD = 7, T_SOFT = 20, T_OIL = 28;
export function breakMinutes(T, spm, sour = true) {
  return 45 * Math.exp(-(T - 14) / 6) * (60 / Math.max(5, spm)) * (sour ? 0.8 : 1) * (T < T_COLD ? 1 + (T_COLD - T) * 2 : 1);
}
// Share (%) of the fat that ends up in the makhan with a pot and mathani: a straight line through
// the two [FAO] measurements (67% at 18 °C, 44% at 25 °C), capped at 76% (the best that study got
// at 18 °C with a better paddle). A rough guide, not a law.
export const recovery = (T) => clamp(67 - (23 / 7) * (T - 18), 12, 76) * (T < T_COLD ? 0.5 : 1);
export function churnVerdict(T) {
  if (T < T_COLD) return { k: 'cold', text: 'Too cold: the fat is too hard to stick', col: COL.cold };
  if (T <= T_SOFT) return { k: 'good', text: 'Good: firm, clean grains', col: COL.ok };
  if (T <= T_OIL) return { k: 'soft', text: 'Warm: soft, greasy grains, more fat lost in the chaas', col: COL.warm };
  return { k: 'oil', text: 'Too warm: an oily paste, no grains', col: COL.hot };
}

// ---------------------------------------------------------------- standards
export const FSSAI = { table: { fat: 80, moisture: 16, curd: 1.5, salt: 3 }, desi: { fat: 76 } };

// ---------------------------------------------------------------- colours and formats
export const COL = {
  fat: '#ffd76a',      // milk fat
  makhan: '#fff6dc',   // white butter
  butter: '#f7c53a',   // table butter
  water: '#6fb6ff',
  protein: '#c49bff',
  lactose: '#5ce1a9',
  ash: '#9aa6b8',
  salt: '#e8eef8',
  air: '#8ef0ff',
  ok: '#5ce1a9',
  warm: '#ffb547',
  hot: '#ff7a59',
  cold: '#6fb6ff',
  text: '#e8eef8',
};
export const hex = (c) => new THREE.Color(c).getHex();
export const fmt = (v, d = 1) => (Math.abs(v) >= 1000 ? Math.round(v).toLocaleString('en-IN') : v.toFixed(d));
export function fmtTime(sec) {
  if (!isFinite(sec)) return 'never';
  if (sec < 1) return (sec * 1000).toFixed(0) + ' ms';
  if (sec < 90) return sec.toFixed(sec < 10 ? 1 : 0) + ' s';
  if (sec < 5400) return Math.round(sec / 60) + ' min';
  if (sec < 48 * 3600) return (sec / 3600).toFixed(1) + ' h';
  return Math.round(sec / 86400) + ' days';
}
export const fmtMin = (m) => (!isFinite(m) || m > 600 ? 'hours and hours' : m >= 90 ? (m / 60).toFixed(1) + ' h' : m >= 1 ? Math.round(m) + ' min' : Math.round(m * 60) + ' s');
export function sci(v) { const e = Math.floor(Math.log10(v)); return `${(v / Math.pow(10, e)).toFixed(1)} × 10${String(e).replace(/\d/g, (d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d])}`; }
export const link = (slug, name, hash = '') => `<a href="https://glassbox.how/${slug}/${hash ? '#' + hash : ''}">${name}</a>`;

// ---------------------------------------------------------------- boards (live charts in 3D)
export function panelBg(g, w, h) { g.clearRect(0, 0, w, h); g.fillStyle = 'rgba(10,12,18,.9)'; g.fillRect(0, 0, w, h); }
export function board(root, w, h, pxW, pxH, draw, pos) {
  const c = document.createElement('canvas'); c.width = pxW; c.height = pxH;
  const g = c.getContext('2d'), tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const redraw = () => { draw(g, pxW, pxH); tex.needsUpdate = true; };
  redraw();
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false, side: THREE.DoubleSide }));
  m.position.set(...pos); root.add(m);
  return { tex, redraw, canvas: c, mesh: m };
}
export function axes(g, w, h, { x0 = 84, x1 = w - 28, y0 = h - 64, y1 = 70, xMax, yMax, xMin = 0, yMin = 0, xTicks, yTicks, xFmt = String, yFmt = String, xLabel = '', yLabel = '', logY = false }) {
  const X = (x) => x0 + ((x - xMin) / (xMax - xMin)) * (x1 - x0);
  const Y = logY
    ? (y) => y0 - ((Math.log10(Math.max(y, 1e-30)) - Math.log10(yMin)) / (Math.log10(yMax) - Math.log10(yMin))) * (y0 - y1)
    : (y) => y0 - ((y - yMin) / (yMax - yMin)) * (y0 - y1);
  g.strokeStyle = 'rgba(255,255,255,.12)'; g.lineWidth = 1; g.fillStyle = 'rgba(255,255,255,.6)'; g.font = '19px sans-serif';
  for (const t of xTicks) { g.beginPath(); g.moveTo(X(t), y1); g.lineTo(X(t), y0); g.stroke(); const s = xFmt(t); g.fillText(s, X(t) - g.measureText(s).width / 2, y0 + 26); }
  for (const t of yTicks) { g.beginPath(); g.moveTo(x0, Y(t)); g.lineTo(x1, Y(t)); g.stroke(); const s = yFmt(t); g.fillText(s, x0 - 10 - g.measureText(s).width, Y(t) + 6); }
  g.strokeStyle = 'rgba(255,255,255,.4)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x0, y1); g.lineTo(x0, y0); g.lineTo(x1, y0); g.stroke();
  g.fillStyle = 'rgba(255,255,255,.75)'; g.font = '18px sans-serif';
  if (xLabel) g.fillText(xLabel, x1 - g.measureText(xLabel).width, y0 + 52);
  if (yLabel) g.fillText(yLabel, x0 + 8, y1 - 10);
  return { X, Y, x0, x1, y0, y1 };
}
export function title(g, text, sub = '') {
  g.fillStyle = COL.text; g.font = 'bold 24px sans-serif'; g.fillText(text, 20, 34);
  if (sub) { const x = 34 + g.measureText(text).width; g.font = '17px sans-serif'; g.fillStyle = 'rgba(255,255,255,.6)'; g.fillText(sub, x, 34); }
}
export function line(g, pts, X, Y, col, wdt = 5, dash = null) {
  if (pts.length < 2) return;
  g.strokeStyle = col; g.lineWidth = wdt; g.setLineDash(dash || []); g.lineJoin = 'round'; g.beginPath();
  pts.forEach(([x, y], i) => (i ? g.lineTo(X(x), Y(y)) : g.moveTo(X(x), Y(y))));
  g.stroke(); g.setLineDash([]);
}
export function dot(g, x, y, col, r = 10) { g.fillStyle = col; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 2; g.stroke(); }
export function legend(g, items, x = 24, y = 50, font = 18) {
  g.font = `bold ${font}px sans-serif`;
  for (const [n, c] of items) { g.fillStyle = c; g.fillRect(x, y, 16, 16); g.fillStyle = COL.text; g.fillText(n, x + 22, y + 15); x += 36 + g.measureText(n).width; }
}
export function note(g, text, x, y, col = 'rgba(255,255,255,.75)', font = '17px sans-serif') { g.font = font; g.fillStyle = col; g.fillText(text, x, y); }
export function band(g, x0, x1, y0, y1, col) { g.fillStyle = col; g.fillRect(Math.min(x0, x1), Math.min(y0, y1), Math.abs(x1 - x0), Math.abs(y1 - y0)); }
// Stacked horizontal bars: rows [{ label, parts: [[value, colour], …] }], all in %.
export function stacks(g, rows, { x = 20, y = 64, w = 600, rowH = 56, labelW = 170 } = {}) {
  const span = w - labelW - 20;
  rows.forEach((r, i) => {
    const yy = y + i * rowH; let xx = x + labelW;
    g.font = 'bold 19px sans-serif'; g.fillStyle = COL.text; g.fillText(r.label, x, yy + 26);
    for (const [v, c] of r.parts) { const L = (v / 100) * span; g.fillStyle = c; g.fillRect(xx, yy + 6, Math.max(0, L - 1), rowH - 20); xx += L; }
    if (r.text) { g.font = '16px sans-serif'; g.fillStyle = 'rgba(255,255,255,.7)'; g.fillText(r.text, x + labelW, yy + rowH - 0); }
  });
}

// ---------------------------------------------------------------- small helpers
export function rng(seed = 1) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
export const inReel = () => document.body.classList.contains('gb-reel');
// True in the tall or square reel video, where boards stack above the model.
export const reelTall = (stage) => inReel() && stage.camera.aspect <= 1.3;
// On a phone-width stage: hide minor labels and nudge the picture down, clear of the readout.
export function fitNarrow(stage, minor = []) {
  const narrow = stage.host.clientWidth < 560;
  minor.forEach((l) => { if (l) l.visible = !narrow; });
  const y = narrow && !inReel() ? -0.16 : 0;
  if (!stage.shift || stage.shift[1] !== y) stage.setShift(0, y);
  return narrow;
}
const WIDE = { pos: [0.1, 4.35, 11.9], target: [0.1, 3.95, 0] };
// Chart boards sit above and beside the model. In the tall reel video they stack above it instead.
export function reelBoards(boards, x = 0, stage = null, view = null, top = 6.6, gap = 3.0, sc = 1.0) {
  const r = inReel(), wide = r && stage && stage.camera.aspect > 1.3;
  boards.forEach((b, i) => {
    if (!b.home) b.home = b.mesh.position.clone();
    // only the first board fits above the model in the tall video
    b.mesh.visible = !(r && !wide && i > 0);
    if (r && !wide) { b.mesh.position.set(x, top - i * gap, 0); b.mesh.scale.setScalar(sc); }
    else { b.mesh.position.copy(b.home); b.mesh.scale.setScalar(1); }
  });
  // the wide (16:9) video shows the whole two-row layout, from a little further back than the page does
  if (wide && view) { stage.controls.autoRotate = false; if (stage.home?.pos !== WIDE.pos) stage.setView(WIDE.pos, WIDE.target, 0.01); }
}

// ---------------------------------------------------------------- 3D pieces
// Many shaded spheres in one instanced mesh, each with its own size and colour.
export function balls(n, { seg = 14, rough = 0.35, opacity = 1, basic = false } = {}) {
  const mat = basic
    ? new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false, transparent: opacity < 1, opacity, depthWrite: opacity >= 1 })
    : new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: rough, metalness: 0, transparent: opacity < 1, opacity, depthWrite: opacity >= 1 });
  const mesh = new THREE.InstancedMesh(new THREE.SphereGeometry(1, seg, Math.max(6, seg - 4)), mat, n);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); mesh.frustumCulled = false;
  const o = new THREE.Object3D(), c = new THREE.Color(0xffffff);
  for (let i = 0; i < n; i++) { mesh.setColorAt(i, c); o.scale.setScalar(0.0001); o.updateMatrix(); mesh.setMatrixAt(i, o.matrix); }
  mesh.place = (i, x, y, z, s = 1, sy = s) => { o.position.set(x, y, z); o.scale.set(Math.max(1e-4, s), Math.max(1e-4, sy), Math.max(1e-4, s)); o.updateMatrix(); mesh.setMatrixAt(i, o.matrix); };
  mesh.tint = (i, col) => mesh.setColorAt(i, col);
  mesh.done = () => { mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true; };
  return mesh;
}
// A see-through box with bright edges: the "microscope view".
export function chamber(parent, x0, x1, y0, y1, d, { color = 0xcfe8ff, opacity = 0.08, edge = 0x9fb4c8 } = {}) {
  const g = new THREE.Group();
  const glass = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, y1 - y0, d), M.clear(color, opacity)); glass.position.set((x0 + x1) / 2, (y0 + y1) / 2, 0); g.add(glass);
  const e = new THREE.LineSegments(new THREE.EdgesGeometry(glass.geometry), new THREE.LineBasicMaterial({ color: edge, transparent: true, opacity: 0.7 }));
  e.position.copy(glass.position); g.add(e);
  parent.add(g); g.glass = glass; g.edges = e;
  return g;
}
// An arrow that ignores depth, aimed from a point along a direction.
const UP = new THREE.Vector3(0, 1, 0), tmpV = new THREE.Vector3(), tmpA = new THREE.Vector3(), tmpB = new THREE.Vector3();
export function flowArrow(color, r = 0.05, head = 0.28) {
  const a = arrow(color, 1, head, r);
  a.traverse((o) => { if (o.material) { o.material.depthTest = false; o.renderOrder = 10; } });
  a.aim = (from, dir, len) => {
    a.position.set(...from);
    tmpV.set(...dir); if (tmpV.lengthSq() < 1e-9) tmpV.set(1, 0, 0);
    a.quaternion.setFromUnitVectors(UP, tmpV.normalize());
    a.set(Math.max(0.001, len));
    if (len < 0.05) a.visible = false;
  };
  return a;
}
// A cylinder you can re-aim every frame between two points (ropes, drips).
export function strand(r, mat) {
  const g = new THREE.CylinderGeometry(r, r, 1, 10);
  const m = new THREE.Mesh(g, mat); m.castShadow = true;
  m.span = (a, b) => {
    tmpA.set(...a); tmpB.set(...b);
    const len = tmpA.distanceTo(tmpB);
    m.position.copy(tmpA).add(tmpB).multiplyScalar(0.5);
    m.scale.set(1, Math.max(1e-3, len), 1);
    m.quaternion.setFromUnitVectors(UP, tmpB.sub(tmpA).normalize());
  };
  return m;
}
// A lathed shape around the vertical axis from [r, y] pairs. `cut` opens a wedge towards the viewer.
export function lathe(profile, mat, cut = 0, seg = 56) {
  const g = new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(Math.max(0, r), y)), seg, Math.PI * cut, Math.PI * (2 - 2 * cut));
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, mat); m.castShadow = true; m.receiveShadow = true;
  return m;
}

// ---------------------------------------------------------------- the matka and the mathani
// Scene units here are 10 cm. A clay pot about 30 cm across and 28 cm tall, cut open towards the
// viewer, with a wooden churning rod (mathani, or bilona) standing in it. The rod is held upright by
// two cord loops tied to a post behind the pot. A rope (neti) is wound a few turns round the rod;
// the churner sits in front with one end in each hand. Pulling the right-hand end turns the rod one
// way, pulling the left-hand end turns it back.
const POT = [[0.0, 0.0], [0.7, 0.03], [1.2, 0.35], [1.48, 0.95], [1.5, 1.45], [1.32, 2.05], [1.0, 2.45], [0.95, 2.62], [1.12, 2.84]];
const potR = (y) => { for (let i = 1; i < POT.length; i++) if (y <= POT[i][1]) { const [r0, y0] = POT[i - 1], [r1, y1] = POT[i]; return r0 + ((r1 - r0) * (y - y0)) / (y1 - y0); } return 1.1; };
export function makeMatka(parent, { x = 0, rodR = 0.14, level = 1.9, post = true, hands = true, liquid = 0xfdf8ea } = {}) {
  const g = new THREE.Group(); g.position.x = x; parent.add(g);
  const clay = new THREE.MeshStandardMaterial({ color: 0xb5613a, roughness: 0.9, side: THREE.DoubleSide });
  g.add(lathe(POT, clay, 0.3));
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.13, 10, 40), M.matte(0xc9a25e)); ring.rotation.x = Math.PI / 2; ring.position.y = 0.06; g.add(ring);
  // the liquid: the pot's inner shape up to the level
  const liqMat = new THREE.MeshStandardMaterial({ color: liquid, roughness: 0.25, transparent: true, opacity: 0.62, depthWrite: false });
  const liq = new THREE.Group(); g.add(liq);
  let lvl = -1;
  const setLevel = (h) => {
    h = clamp(h, 0.3, 2.4); if (Math.abs(h - lvl) < 0.01) return; lvl = h;
    liq.children.slice().forEach((c) => { liq.remove(c); c.geometry.dispose(); });
    const prof = [[0, 0.08]]; for (const [, y] of POT) if (y > 0.08 && y < h) prof.push([potR(y) - 0.07, y]);
    prof.push([potR(h) - 0.07, h], [0, h]);
    liq.add(new THREE.Mesh(new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y)), 48), liqMat));
  };
  setLevel(level);
  // the churn
  const wood = M.matte(0x9a6a3c), woodD = M.matte(0x6f4a28);
  const rod = new THREE.Group(); g.add(rod);
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(rodR, rodR, 5.6, 20), wood); shaft.position.y = 0.5 + 2.8; shaft.castShadow = true; rod.add(shaft);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(rodR * 1.5, 16, 12), woodD); knob.position.y = 6.15; rod.add(knob);
  // a painted stripe so the turning shows
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.03, 1.4, rodR * 2.06), M.matte(0xe2483a)); stripe.position.set(0, 5.2, 0); rod.add(stripe);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.26, 0.5, 16), woodD); hub.position.y = 0.62; rod.add(hub);
  for (let i = 0; i < 4; i++) {          // the head: a cross of carved wooden wings
    const w = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.42, 0.09), wood); w.rotation.y = (i / 4) * Math.PI; w.position.y = 0.62; w.castShadow = true; rod.add(w);
  }
  // rope coil on the rod (four turns), part of the rod so it turns with it
  const ropeMat = M.matte(0xe8dcc0), coil = [];
  for (let i = 0; i <= 96; i++) { const a = (i / 96) * 4 * TAU; coil.push(new THREE.Vector3((rodR + 0.035) * Math.sin(a), 4.05 + (i / 96) * 0.36, (rodR + 0.035) * Math.cos(a))); }
  const coilMesh = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(coil), 200, 0.035, 8), ropeMat); rod.add(coilMesh);
  const ropes = [strand(0.035, ropeMat), strand(0.035, ropeMat)], hand = [];
  if (hands) {
    ropes.forEach((r) => g.add(r));
    for (let i = 0; i < 2; i++) { const h = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 12), M.plastic(0xd9a273)); g.add(h); hand.push(h); }
  }
  if (post) {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 6.0, 14), woodD); p.position.set(0, 3.0, -1.75); p.castShadow = true; g.add(p);
    for (const y of [3.1, 5.6]) {
      const loop = new THREE.Mesh(new THREE.TorusGeometry(rodR + 0.07, 0.03, 8, 24), ropeMat); loop.rotation.x = Math.PI / 2; loop.position.y = y; g.add(loop);
      const tie = strand(0.03, ropeMat); tie.span([0, y, -rodR - 0.05], [0, y, -1.6]); g.add(tie);
    }
  }
  let rk = 1;
  const api = {
    g, rod, liq, liqMat, hand, ropes, rodR, setLevel, level: () => lvl, inner: (y) => potR(y) - 0.07,
    // make the rod thicker or thinner (k = 1 is 2.8 cm across)
    setRod(k) { rk = k; shaft.scale.set(k, 1, k); coilMesh.scale.set(k, 1, k); stripe.scale.z = k; },
    showHands(on) { ropes.forEach((r) => { r.visible = on; }); hand.forEach((h) => { h.visible = on; }); },
    // theta: the rod's angle (radians, anticlockwise seen from above). Rope paid out = rodR × theta.
    // shift: how far the rope has been pulled to the right (scene units); by default rod radius × angle.
    pose(theta, shift = rodR * rk * theta) {
      rod.rotation.y = theta;
      if (!hands) return;
      const s = clamp(shift, -1.8, 1.8), rodR = api.rodR * rk;
      // both rope ends leave the rod from its front, so a pull to the right turns the front of the rod to the right
      // the churner sits in front: the hands are out to each side and towards the viewer
      const R = [1.5 + 0.7 * s, 3.85, 1.1 + 0.7 * s], L = [-1.5 + 0.7 * s, 3.85, 1.1 - 0.7 * s];
      ropes[0].span([rodR * 0.6, 4.1, rodR], R); ropes[1].span([-rodR * 0.6, 4.38, rodR], L);
      hand[0].position.set(...R); hand[1].position.set(...L);
    },
  };
  api.pose(0);
  return api;
}
export { clamp, lerp, smooth };
