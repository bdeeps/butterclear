// Chapter 2: cream rising. Left: a 10 cm column of milk left to stand (time-lapse), where every
// globule climbs at its own Stokes speed. Middle: a cream separator, cut open, where the same law
// works with thousands of g instead of one.
// Stokes' law: v = d² (ρ_skim − ρ_fat) a ÷ 18 η, with ρ_fat = 930 kg/m³, ρ_skim = 1,035 kg/m³ and
// η = 1.42 mPa·s (Tetra Pak Dairy Processing Handbook; see butter.js). A 3 µm globule rises about
// 1.3 mm an hour with these values (the handbook's own worked example, with a smaller density
// difference, gets 0.6 mm/h). In the separator a = ω² r: the handbook's example bowl turns at 5,400 rpm
// with the discs 0.2 m from the axis, about 6,500 g. Disc gap: about 0.5 mm (typical).
// A separator leaves 0.04–0.07% fat in the skim milk (same handbook).
import { THREE, M } from '../kit.js';
import {
  COL, TAU, G, stokes, spinAcc, hex, board, panelBg, axes, title, line, dot, legend, note,
  balls, lathe, flowArrow, rng, fitNarrow, reelBoards, clamp, fmtTime, fmt,
} from '../butter.js';

const VIEW = { pos: [0.1, 4.6, 10.1], target: [0.1, 4.2, 0] };
const COLUMN = 0.1, HJ = 3.9, JX = -3.2, R_BOWL = 0.2, GAP = 0.0005;
const N = 240, SX = 1.9;
const timeUp = (d) => COLUMN / stokes(d);

export default {
  id: 'cream',
  short: 'Cream rises',
  title: 'Why malai comes to the top',
  subtitle: 'Fat is lighter than the watery milk around it, so every globule slowly floats up. A spinning bowl does it thousands of times faster.',
  view: VIEW,
  learn: `<p>Milk fat is lighter than the watery part of milk: about 930 kg per cubic metre against about 1,035. So every fat globule is pushed gently upward, like a cork held under water. Leave milk to stand and a layer of <b>cream</b> collects on top.</p>
    <p>How fast? <b>Stokes' law</b> (George Stokes, 1851) gives the answer for any small ball moving through a liquid: <b>v = d² Δρ g ÷ 18 η</b>. The speed grows with the <b>square of the diameter d</b>, with the density difference Δρ and with gravity g, and falls with the liquid's stickiness η. For one 3 µm globule that comes to about a millimetre an hour. Double the size and it rises four times as fast.</p>
    <p>That is why <b>size matters so much</b>. In cold raw cow milk, globules stick together in loose clusters that rise like one big ball, so cream forms in hours. The <b>malai</b> on boiled milk is a little different: a skin of heat-set milk protein forms on top and traps the risen fat with it. Buffalo milk gives a thicker malai mostly because it has nearly twice the fat.</p>
    <p>In 1878 the Swedish engineer <b>Gustaf de Laval</b> patented a way to stop waiting. Spin the milk in a bowl and the heavy skim milk is flung outward while the light fat is pushed <b>inward</b>, towards the axis. The pull is no longer g but <b>ω²r</b>, thousands of times stronger. A stack of cone-shaped discs splits the milk into thin layers, so a globule only has to travel half a millimetre to be caught.</p>
    <p class="tip"><b>Try it:</b> slide the globule size from 1 µm to 10 µm and watch the time to rise 10 cm. Then raise the separator's speed and compare the two times in the readout.</p>`,
  terms: [
    { t: "Stokes' law", d: 'The speed of a small ball through a liquid: v = d² Δρ g ÷ 18 η. Twice the diameter, four times the speed.' },
    { t: 'Creaming', d: 'Fat globules floating up through milk because they are lighter than the liquid around them.' },
    { t: 'Malai', d: 'The thick layer skimmed off milk. On boiled milk it is risen fat held in a skin of heat-set protein.' },
    { t: 'Cream separator', d: 'A fast-spinning bowl with a stack of cone-shaped discs. Skim milk goes outward, cream goes inward.' },
    { t: 'Skim milk', d: 'Milk after the cream is taken out. A good separator leaves only about 0.05% fat in it.' },
  ],
  defaults: { d: 3.5, rpm: 5400, fast: 7200 },
  controls: [
    { key: 'd', type: 'log', label: 'Globule size', min: 0.5, max: 20, ends: ['0.5 µm', '20 µm'], fmt: (v) => `${v.toFixed(1)} µm · ${fmt(stokes(v) * 3.6e6, 2)} mm/h`, hint: 'Single globules average 3 to 4 µm. Clusters in cold raw cow milk act like globules of 10 µm or more.' },
    { key: 'rpm', type: 'range', label: 'Separator speed', min: 500, max: 8000, step: 100, ends: ['500 rpm', '8,000 rpm'], fmt: (v) => `${fmt(v, 0)} rpm · ${fmt(spinAcc(v, R_BOWL) / G, 0)} g` },
    { key: 'fast', type: 'seg', label: 'Standing pot: time-lapse', options: [{ v: 3600, label: '1 s = 1 hour' }, { v: 7200, label: '1 s = 2 hours' }, { v: 21600, label: '1 s = 6 hours' }] },
    { key: 'go', type: 'buttons', label: 'Start again', items: [{ label: 'Stir the pot', act: (s, inst) => inst.restart() }] },
  ],
  onChange(s, key) { if (key === 'd') s._restart = true; },
  quiz: [
    { q: 'A fat globule twice as wide as its neighbour rises…', options: ['at the same speed', 'twice as fast', 'four times as fast', 'half as fast'], answer: 2, why: "Stokes' law has d² in it. Twice the diameter means 2 × 2 = 4 times the speed." },
    { q: 'In a spinning cream separator, where does the fat go?', options: ['Outward, to the wall of the bowl', 'Inward, towards the axis', 'Straight down', 'It dissolves'], answer: 1, why: 'The heavier skim milk is flung outward. The lighter fat is pushed the other way, inward, just as it floats up under gravity.' },
    { q: 'Why does a separator work so much faster than a standing pot?', options: ['It heats the milk to boiling', 'The spin replaces gravity with a pull thousands of times stronger, and the discs make the journey very short', 'It adds chemicals', 'It makes the globules heavier'], answer: 1, why: 'At 5,400 rpm and 0.2 m the pull is about 6,500 g, and a globule only has to cross a gap of about half a millimetre between two discs.' },
  ],
  reel: [
    { ms: 5200, caption: 'Left alone, the fat floats up by about a millimetre an hour. That layer on top is cream.', set: { d: 3.5, rpm: 5400, fast: 21600 }, act: (s, inst) => inst.restart(), view: { pos: [-0.4, 4.6, 8.4], target: [-0.4, 4.2, 0] }, spin: 0.04 },
    { ms: 5200, caption: 'In 1878 Gustaf de Laval patented the spinning separator: thousands of g, and cream in seconds.', set: { d: 3.5, fast: 7200 }, anim: { rpm: [800, 7000] }, view: { pos: [-0.4, 4.6, 8.4], target: [-0.4, 4.2, 0] }, spin: 0.04 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);
    const rnd = rng(5);

    // ---- the standing column of milk (1 unit = about 2.3 cm)
    const jar = new THREE.Group(); jar.position.set(JX, 0, 0); root.add(jar);
    const jw = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.95, HJ + 0.5, 48, 1, true), M.clear(0xdff2ff, 0.16)); jw.position.y = 0.1 + (HJ + 0.5) / 2; jar.add(jw);
    const jb = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.95, 0.1, 48), M.clear(0xdff2ff, 0.35)); jb.position.y = 0.05; jar.add(jb);
    const milkMat = new THREE.MeshStandardMaterial({ color: 0xf6f3ea, roughness: 0.3, transparent: true, opacity: 0.5, depthWrite: false });
    const mg = new THREE.CylinderGeometry(0.9, 0.9, 1, 48); mg.translate(0, 0.5, 0);
    const milk = new THREE.Mesh(mg, milkMat); milk.position.y = 0.1; jar.add(milk);
    const creamLayer = new THREE.Mesh(mg, new THREE.MeshStandardMaterial({ color: hex(COL.fat), roughness: 0.5, transparent: true, opacity: 0.92 })); jar.add(creamLayer);
    const gl = balls(N, { seg: 10, rough: 0.35 }); jar.add(gl);
    const fc = new THREE.Color(COL.fat); for (let i = 0; i < N; i++) gl.tint(i, fc);
    const P = Array.from({ length: N }, () => ({ f: Math.exp(0.4 * (rnd() + rnd() + rnd() - 1.5) * 2), a: rnd() * TAU, r: 0.82 * Math.sqrt(rnd()), y: 0, y0: rnd() }));
    const volTot = P.reduce((a, p) => a + p.f ** 3, 0);
    let t = 0, risen = 0;
    const restart = () => { t = 0; P.forEach((p) => { p.y = p.y0 * HJ; }); };
    restart();
    const lJar = stage.label('', [JX, HJ + 0.95, 0], root);
    const lCream = stage.label('Cream', [JX - 1.35, HJ + 0.1, 0], root, 'hot'); lCream.element.style.setProperty('--c', COL.fat);
    const up = flowArrow(hex(COL.fat), 0.04, 0.2); root.add(up);
    const lUp = stage.label('Fat floats up', [JX - 1.3, 2.9, 0], root, 'hot'); lUp.element.style.setProperty('--c', COL.fat);

    // ---- the separator, cut open towards the viewer
    const sep = new THREE.Group(); sep.position.set(SX, 0, 0); root.add(sep);
    const steel = M.metal(0xc6ccd6, { roughness: 0.35, side: THREE.DoubleSide });
    const base = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.25, 0.6, 40), M.matte(0x2a3140)); base.position.y = 0.3; base.castShadow = true; sep.add(base);
    const spindle = new THREE.Group(); spindle.position.y = 0.6; sep.add(spindle);
    const sp = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.34, 20), M.metal(0x9aa3b2)); sp.position.y = 0.12; spindle.add(sp);
    for (let i = 0; i < 4; i++) { const st = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.3, 0.05), M.glow(0xffb547)); st.position.set(0.22 * Math.cos((i / 4) * TAU), 0.12, 0.22 * Math.sin((i / 4) * TAU)); spindle.add(st); }
    const CUT = 0.3;
    sep.add(lathe([[0.25, 0.88], [1.6, 0.92], [1.66, 1.5], [1.5, 2.2], [0.78, 3.1], [0.7, 3.5]], steel, CUT));
    const coneY = (j, r) => 1.08 + 0.17 * j + ((1.25 - r) / 0.8) * 0.85;
    const discMat = new THREE.MeshStandardMaterial({ color: 0xdfe6f2, metalness: 0.6, roughness: 0.3, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false });
    const ND = 6;
    for (let j = 0; j < ND; j++) {
      const c = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 1.25, 0.85, 48, 1, true, Math.PI * CUT, Math.PI * (2 - 2 * CUT)), discMat);
      c.position.y = 1.08 + 0.17 * j + 0.425; sep.add(c);
    }
    const feed = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 2.9, 20, 1, true, Math.PI * CUT, Math.PI * (2 - 2 * CUT)), steel); feed.position.y = 2.55; sep.add(feed);
    // flowing dots on the two cut faces
    const NF = 150, fl = balls(NF, { seg: 8, basic: true }); sep.add(fl);
    const F = Array.from({ length: NF }, (_, i) => ({ kind: i % 3 === 0 ? 1 : 0, j: i % ND, u: rnd(), side: i % 2 ? 1 : -1, w: 0.7 + 0.6 * rnd() }));
    const cFat = new THREE.Color(COL.fat), cSkim = new THREE.Color(0xbfe0ff);
    F.forEach((f, i) => fl.tint(i, f.kind ? cFat : cSkim));
    const pathOf = (f) => {
      const yj = (r) => coneY(f.j, r) - 0.085;
      return f.kind
        ? [[0.1, 3.7], [0.1, 1.0], [0.85, 0.98], [0.85, yj(0.85)], [0.5, yj(0.5)], [0.36, yj(0.45) + 0.1], [0.34, 3.2], [0.45, 3.75]]
        : [[0.1, 3.7], [0.1, 1.0], [0.85, 0.98], [0.85, yj(0.85)], [1.3, yj(1.25)], [1.5, 1.6], [1.38, 2.2], [0.72, 3.0], [0.62, 3.45], [0.95, 3.8]];
    };
    F.forEach((f) => { f.path = pathOf(f); f.len = []; let L = 0; for (let k = 1; k < f.path.length; k++) { L += Math.hypot(f.path[k][0] - f.path[k - 1][0], f.path[k][1] - f.path[k - 1][1]); f.len.push(L); } f.L = L; });
    const at = (f, u) => { const d = u * f.L; let k = 0; while (k < f.len.length - 1 && f.len[k] < d) k++; const d0 = k ? f.len[k - 1] : 0, q = (d - d0) / (f.len[k] - d0), a = f.path[k], b = f.path[k + 1]; return [a[0] + (b[0] - a[0]) * q, a[1] + (b[1] - a[1]) * q]; };
    const phiC = Math.PI * CUT - 0.03;
    const lSep = stage.label('', [SX, 4.45, 0], root);
    const lIn = stage.label('Milk in', [SX, 4.05, 0.3], root);
    const lCr = stage.label('Cream out (from near the axis)', [SX - 2.0, 3.75, 0.6], root, 'hot'); lCr.element.style.setProperty('--c', COL.fat);
    const lSk = stage.label('Skim milk out (from the rim)', [SX + 1.7, 3.3, 0.6], root, 'hot'); lSk.element.style.setProperty('--c', '#bfe0ff');
    const lDisc = stage.label('Disc stack', [SX + 2.0, 1.6, 1.2], root);

    let S = { d: 3.5, rpm: 5400 };
    const bd = board(root, 4.2, 2.89, 640, 440, (g, w, h) => {
      panelBg(g, w, h); title(g, 'How fast a globule moves', 'mm per hour');
      const { X, Y, x0, x1 } = axes(g, w, h, { x0: 96, y1: 84, y0: h - 60, xMin: 0, xMax: 20, yMin: 0.01, yMax: 1e8, logY: true, xTicks: [0, 5, 10, 15, 20], yTicks: [0.01, 1, 100, 1e4, 1e6, 1e8], xFmt: (v) => v + ' µm', yFmt: (v) => (v >= 1e6 ? `10${v >= 1e8 ? '⁸' : '⁶'}` : v >= 1e4 ? '10⁴' : String(v)), xLabel: 'globule diameter' });
      const ds = []; for (let d = 0.5; d <= 20; d += 0.25) ds.push(d);
      const a = spinAcc(S.rpm, R_BOWL);
      line(g, ds.map((d) => [d, stokes(d) * 3.6e6]), X, Y, COL.fat, 5);
      line(g, ds.map((d) => [d, stokes(d, a) * 3.6e6]), X, Y, COL.air, 5);
      dot(g, X(S.d), Y(stokes(S.d) * 3.6e6), COL.fat); dot(g, X(S.d), Y(stokes(S.d, a) * 3.6e6), COL.air);
      legend(g, [['Standing pot (1 g)', COL.fat], [`Separator (${fmt(a / G, 0)} g)`, COL.air]], 20, 48, 16);
      note(g, `${fmt(a / G, 0)} times faster`, x1 - 190, (Y(stokes(S.d) * 3.6e6) + Y(stokes(S.d, a) * 3.6e6)) / 2 + 6, COL.text, 'bold 18px sans-serif');
    }, [3.3, 6.6, 0]);

    let key = '', spin = 0;
    return {
      restart,
      update(dt, s, time) {
        dt = Math.max(0, Math.min(dt, 0.05)); S = s;
        fitNarrow(stage, [lUp, lDisc, lIn]); reelBoards([bd], -0.4, stage, VIEW, 7.2);
        if (s._restart) { s._restart = false; restart(); }
        // the standing pot
        t += dt * s.fast;
        let vol = 0;
        P.forEach((p, i) => {
          const d = clamp(s.d * p.f, 0.2, 40);
          p.y = Math.min(HJ, p.y + (stokes(d) * dt * s.fast / COLUMN) * HJ);
          const top = p.y >= HJ - 0.001; if (top) vol += p.f ** 3;
          gl.place(i, p.r * Math.cos(p.a), 0.1 + (top ? HJ + 0.02 : p.y), p.r * Math.sin(p.a), top ? 0.0001 : clamp(0.045 * Math.sqrt(d), 0.03, 0.2));
        });
        gl.done();
        risen = vol / volTot;
        const th = 0.04 + 0.5 * risen;
        milk.scale.y = HJ - th + 0.04; creamLayer.position.y = 0.1 + HJ - th + 0.04; creamLayer.scale.y = th;
        milkMat.color.setRGB(0.96 - 0.08 * risen, 0.95 - 0.03 * risen, 0.92 + 0.06 * risen);
        up.aim([JX - 1.3, 1.3, 0], [0, 1, 0], 0.5 + clamp(Math.log10(stokes(s.d) * 3.6e6 + 1) * 0.9, 0, 1.6));
        lJar.element.innerHTML = `A 10 cm column, standing · <b>${fmtTime(t)}</b>`;
        // the separator
        const a = spinAcc(s.rpm, R_BOWL), sp2 = clamp(s.rpm / 5400, 0.1, 1.6);
        spin += dt * sp2 * 14; spindle.rotation.y = spin;
        // how well it separates: a globule must cross the gap before the milk leaves the disc (about 1 s here)
        const caught = clamp((stokes(s.d, a) * 1) / GAP, 0, 1);
        F.forEach((f, i) => {
          f.u = (f.u + dt * 0.11 * f.w * (0.5 + sp2)) % 1;
          const [r, y] = at(f, f.u), ph = f.side * phiC;
          const stray = f.kind && caught < 0.999 && (i % 9) / 9 > caught;      // fat that slips out with the skim
          fl.place(i, r * Math.sin(ph), y, r * Math.cos(ph) + 0.02, stray ? 0.0001 : f.kind ? 0.06 : 0.045);
        });
        fl.done();
        lSep.element.innerHTML = `Cream separator · <b>${fmt(s.rpm, 0)} rpm</b> · ${fmt(a / G, 0)} g`;
        const k = `${s.d.toFixed(2)}|${s.rpm}`; if (k !== key) { key = k; bd.redraw(); }
      },
      readout: (s) => {
        const v = stokes(s.d), a = spinAcc(s.rpm, R_BOWL), vc = stokes(s.d, a);
        return `<div class="big">${s.d.toFixed(1)} µm globule: ${fmt(v * 3.6e6, 2)} mm an hour</div>
          <div class="row"><span>Standing pot: time to rise 10 cm</span><b style="color:${COL.fat}">${fmtTime(timeUp(s.d))}</b></div>
          <div class="row"><span>Fat risen so far (${fmtTime(t)})</span><b>${(risen * 100).toFixed(0)}%</b></div>
          <div class="row"><span>Separator pull at 0.2 m, ${fmt(s.rpm, 0)} rpm</span><b>${fmt(a / G, 0)} g</b></div>
          <div class="row"><span>Speed in the separator</span><b style="color:${COL.air}">${fmt(vc * 1000, 2)} mm a second</b></div>
          <div class="row"><span>Time to cross a 0.5 mm disc gap</span><b style="color:${COL.air}">${fmtTime(GAP / vc)}</b></div>
          <small>${s.d < 1.2 ? 'The very smallest globules are too slow even for a separator. That is the 0.05% of fat left in skim milk.' : s.d > 8 ? 'Clusters this big rise in hours, not days. That is how cream forms overnight in cold raw milk.' : 'Stokes’ law is the same in both. Only the pull changes: g in the pot, ω²r in the bowl.'}</small>`;
      },
    };
  },
};
