// Chapter 4: the break. Left: a microscope box of cream (about 40 µm wide) where you can follow the
// fat globules through the four stages of churning. Middle: the matka. Right: the time-to-break chart.
// The stages (Tetra Pak Dairy Processing Handbook, "Butter"; Wikipedia, "Churning (butter)"):
//   1. cream: globules apart, each in its membrane (fat in water);
//   2. foam: churning beats in air, and globules gather on the bubble surfaces;
//   3. clumps: membranes tear, a little liquid fat leaks out and glues globules together, while the
//      fat crystals inside keep each globule's shape (partial coalescence). Bubbles start to collapse;
//   4. the break: the clumps join into butter grains with water trapped inside them (water in fat),
//      and the rest drains off as buttermilk (chaas), carrying the membrane pieces with it.
// Time to break and fat recovered: the rule-of-thumb model and the FAO measurements in butter.js
// (45 minutes at 14 °C by hand; 67% of the fat recovered at 18 °C and 44% at 25 °C in a clay pot).
// Solid fat at each temperature: the typical curve in butter.js. Both crystals and liquid fat are
// needed, which is why there is a best temperature window.
import { THREE } from '../kit.js';
import {
  COL, TAU, T_COLD, T_SOFT, T_OIL, breakMinutes, recovery, churnVerdict, sfc, hex, board, panelBg, axes, title, line, dot, note, band,
  balls, chamber, makeMatka, rng, fitNarrow, reelBoards, clamp, lerp, smooth, fmtMin, link,
} from '../butter.js';

const VIEW = { pos: [0.1, 4.6, 10.1], target: [0.1, 4.2, 0] };
const BX = { x0: -2.4, x1: 1.4, y0: 0.9, y1: 4.7, d: 1.2 };
const NG = 230, NBUB = 7, NC = 14, NGR = 3, NM = 130, PX = 3.75;
const STAGES = ['Cream', 'Foam', 'Clumps', 'Butter + chaas'];
const stageOf = (p) => (p < 0.15 ? 0 : p < 0.5 ? 1 : p < 1 ? 2 : 3);

export default {
  id: 'break',
  short: 'The break',
  title: 'The moment cream turns inside out',
  subtitle: 'For a long time nothing seems to happen. Then, in a few strokes, fat-in-water flips to water-in-fat.',
  view: VIEW,
  learn: `<p>Churning does not squeeze the fat out. It makes the globules <b>stick to each other</b>, in four steps.</p>
    <p><b>1. Air goes in.</b> The mathani whips air into the cream. Fat globules gather on the surface of every bubble, with their skins stretched thin. <b>2. Skins tear.</b> As bubbles collide and burst, the <b>membranes</b> rip. Inside each cool globule the fat is part solid <b>crystal</b> and part <b>liquid</b>. A little liquid fat leaks out and works like glue. <b>3. Clumps grow.</b> Globules stick but do not fully merge, because their crystals hold their shape. This is <b>partial coalescence</b>. <b>4. The break.</b> Clumps join into grains you can see, with droplets of water trapped inside. The foam collapses and thin <b>buttermilk</b> drains free.</p>
    <p>Cream was fat droplets in water. Butter is water droplets in fat. That flip is called <b>phase inversion</b>.</p>
    <p><b>Temperature decides everything.</b> Too cold and the fat is nearly all crystal: nothing leaks, nothing sticks. Too warm and it is nearly all liquid: the globules smear into a greasy paste and much of the fat is lost in the buttermilk. Dairies churn cream at about <b>10 to 15 °C</b>. This is why, in an Indian summer, <b>cold water or ice</b> goes into the matka, and why makhan was churned in the cool of early morning. In a cold winter, a little warm water does the opposite job.</p>
    <p>Dahi or soured malai also breaks a little more easily than sweet cream. How dahi sets is the story of ${link('curdclear', 'CurdClear')}.</p>
    <p class="tip"><b>Try it:</b> churn at 14 °C and watch all four stages. Then start a fresh pot at 32 °C and see the paste. Add cold water and try again.</p>`,
  terms: [
    { t: 'Phase inversion', d: 'An emulsion turning inside out. Cream (fat in water) becomes butter (water in fat).' },
    { t: 'Partial coalescence', d: 'Fat globules sticking together without fully merging, glued by liquid fat while their crystals keep their shape.' },
    { t: 'The break', d: 'The moment butter grains suddenly appear and buttermilk runs free.' },
    { t: 'Buttermilk (chaas)', d: 'The thin liquid left after the fat has clumped. It holds the water, protein, lactose and membrane pieces.' },
    { t: 'Butter grains', d: 'The first small lumps of butter, about the size of wheat grains, floating in buttermilk.' },
  ],
  defaults: { temp: 14, spm: 60, cream: 'dahi', fast: 180, pset: -1 },
  controls: [
    { key: 'temp', type: 'range', label: 'Temperature of the cream', min: 2, max: 38, step: 1, ends: ['2 °C', '38 °C'], fmt: (v) => `${v} °C · ${sfc(v).toFixed(0)}% of the fat is crystal` },
    { key: 'spm', type: 'range', label: 'Churning speed', min: 20, max: 110, step: 1, ends: ['slow', 'fast'], fmt: (v) => `${v} strokes a minute` },
    { key: 'cream', type: 'seg', label: 'In the pot', options: [{ v: 'dahi', label: 'Dahi or soured malai' }, { v: 'sweet', label: 'Sweet cream' }] },
    { key: 'fast', type: 'seg', label: 'Time-lapse', options: [{ v: 60, label: '1 s = 1 min' }, { v: 180, label: '1 s = 3 min' }, { v: 600, label: '1 s = 10 min' }] },
    { key: 'go', type: 'buttons', label: 'In the kitchen', items: [{ label: 'Fresh pot', act: (s, inst) => inst.restart() }, { label: 'Add cold water (−6 °C)', act: (s) => { s.temp = Math.max(2, s.temp - 6); } }] },
  ],
  onChange(s, key) { if (key === 'cream') s._restart = true; },
  quiz: [
    { q: 'What is "phase inversion" in butter making?', options: ['Milk turning sour', 'Fat-in-water (cream) flipping to water-in-fat (butter)', 'Butter melting', 'Water boiling off'], answer: 1, why: 'In cream, fat droplets float in water. In butter, water droplets sit inside a continuous mass of fat. Churning flips one into the other.' },
    { q: 'Why does very warm cream give a greasy paste instead of butter grains?', options: ['There is too much air', 'Nearly all the fat is liquid, so globules smear together instead of clumping around crystals', 'The membranes get thicker', 'The water freezes'], answer: 1, why: 'Grains need fat crystals to hold their shape and a little liquid fat as glue. With almost no crystals the fat just smears, and more of it is lost in the buttermilk.' },
    { q: 'Why is cold water or ice added to the matka in summer?', options: ['To add weight', 'To bring the cream down to a temperature where part of the fat is crystal', 'To wash the pot', 'To make more chaas only'], answer: 1, why: 'Churning works best at roughly 10 to 15 °C. Cold water brings warm dahi back towards that window so firm grains can form.' },
  ],
  reel: [
    { ms: 5600, caption: 'Churning whips in air. Fat globules crowd onto the bubbles, their skins tear, and liquid fat glues them into clumps.', set: { temp: 14, spm: 60, cream: 'dahi', fast: 180 }, anim: { pset: [0, 0.9] }, view: { pos: [-0.5, 4.5, 7.2], target: [-0.5, 4.2, 0] }, spin: 0.03 },
    { ms: 5400, caption: 'Then it breaks. Fat-in-water flips to water-in-fat: butter grains float in thin buttermilk.', set: { temp: 14, spm: 60, cream: 'dahi', fast: 180 }, anim: { pset: [0.9, 1.3] }, view: { pos: [-0.5, 4.5, 7.2], target: [-0.5, 4.2, 0] }, spin: 0.03 },
    { ms: 5000, caption: 'Temperature decides. Too warm gives a greasy paste, so in summer ice goes into the pot.', set: { spm: 60, cream: 'dahi', fast: 180, pset: 1.3 }, anim: { temp: [14, 34] }, view: { pos: [-0.5, 4.5, 7.2], target: [-0.5, 4.2, 0] }, spin: 0.03 },
  ],

  build({ stage, s: s0 }) {
    const root = new THREE.Group(); stage.root.add(root);
    const rnd = rng(31);
    const W = BX.x1 - BX.x0, Hh = BX.y1 - BX.y0, cx = (BX.x0 + BX.x1) / 2;
    const rp = (m = 0.25) => [BX.x0 + m + rnd() * (W - 2 * m), BX.y0 + m + rnd() * (Hh - 2 * m), (rnd() - 0.5) * 0.7];
    const dir = () => { const u = rnd() * 2 - 1, a = rnd() * TAU, q = Math.sqrt(1 - u * u); return [q * Math.cos(a), q * Math.sin(a), u * 0.6]; };

    const ch = chamber(root, BX.x0, BX.x1, BX.y0, BX.y1, BX.d, { color: 0xfff6e0, opacity: 0.22 });
    const BUB = Array.from({ length: NBUB }, () => ({ c: rp(0.75), R: 0.45 + 0.3 * rnd() }));
    const CL = Array.from({ length: NC }, () => ({ c: rp(0.5) }));
    const GR = Array.from({ length: NGR }, (_, i) => ({ c: [BX.x0 + W * (0.22 + 0.28 * i), BX.y1 - 1.0 - 0.25 * (i % 2), 0] }));
    const glob = balls(NG, { rough: 0.3 }); root.add(glob);
    const GL = Array.from({ length: NG }, (_, i) => {
      const b = i % 5 < 3 ? i % NBUB : -1, c = Math.floor(rnd() * NC), d = dir(), d2 = dir(), d3 = dir();
      return { h: rp(0.2), b, c, gr: c % NGR, d, k2: 0.34 * Math.cbrt(rnd()), d2, k3: 0.85 * Math.cbrt(rnd()), d3, r: 0.1 + 0.08 * rnd(), ph: rnd() * TAU };
    });
    const bubs = balls(NBUB, { seg: 20, opacity: 0.28, rough: 0.1 }); root.add(bubs);
    const cAir = new THREE.Color(COL.air); for (let i = 0; i < NBUB; i++) bubs.tint(i, cAir);
    const mem = balls(NM, { seg: 6, basic: true }); root.add(mem);
    const cMem = new THREE.Color(0xe58ad0); const MM = Array.from({ length: NM }, () => ({ p: rp(0.1), ph: rnd() * TAU })); for (let i = 0; i < NM; i++) mem.tint(i, cMem);
    const oil = balls(5, { seg: 24, opacity: 0.85, rough: 0.15 }); root.add(oil);
    const OIL = Array.from({ length: 5 }, () => ({ c: rp(0.9), R: 0.5 + 0.35 * rnd() })); const cOil = new THREE.Color(0xffc93d); for (let i = 0; i < 5; i++) oil.tint(i, cOil);
    const lBox = stage.label('', [cx, BX.y1 + 0.3, 0], root);
    const lS = stage.label('', [cx, BX.y0 - 0.3, 0.6], root, 'hot');
    const lAir = stage.label('Air bubble', [0, 0, 0], root, 'hot'); lAir.element.style.setProperty('--c', COL.air);
    const lMem = stage.label('Torn membrane', [BX.x1 - 0.8, BX.y0 + 0.5, 0.6], root, 'hot'); lMem.element.style.setProperty('--c', '#e58ad0');

    // the pot
    const pot = makeMatka(root, { x: PX, level: 1.6, post: true, hands: false }); pot.g.scale.setScalar(0.78);
    const grains = balls(34, { rough: 0.6 }); pot.g.add(grains);
    const GRN = Array.from({ length: 34 }, () => ({ a: rnd() * TAU, r: 0.85 * Math.sqrt(rnd()), s: 0.1 + 0.09 * rnd() }));
    const lPot = stage.label('', [PX, 5.1, 0], root);

    let S = s0, p = 0, tmin = 0, broke = null, cFree = new THREE.Color(0xfff3cf), cFat = new THREE.Color(COL.fat), cc = new THREE.Color(), tt = 0;
    const tb = (s) => breakMinutes(s.temp, s.spm, s.cream === 'dahi');
    const restart = () => { p = 0; tmin = 0; broke = null; };
    const bd = board(root, 4.2, 2.89, 640, 440, (g, w, h) => {
      panelBg(g, w, h); title(g, 'Time to break', `at ${S.spm} strokes a minute`);
      const { X, Y, y0, y1 } = axes(g, w, h, { x0: 84, y1: 62, y0: h - 60, xMin: 2, xMax: 38, yMin: 1, yMax: 1000, logY: true, xTicks: [5, 10, 15, 20, 25, 30, 35], yTicks: [1, 10, 100, 1000], xFmt: (v) => v + ' °C', yFmt: (v) => (v >= 60 ? `${Math.round(v / 60)} h` : v + ' min') });
      band(g, X(2), X(T_COLD), y0, y1, 'rgba(111,182,255,.14)'); band(g, X(T_COLD), X(T_SOFT), y0, y1, 'rgba(92,225,169,.14)'); band(g, X(T_SOFT), X(T_OIL), y0, y1, 'rgba(255,181,71,.14)'); band(g, X(T_OIL), X(38), y0, y1, 'rgba(255,122,89,.16)');
      note(g, 'cold', X(2) + 6, y1 + 18, COL.cold, '15px sans-serif'); note(g, 'firm grains', X(T_COLD) + 30, y1 + 18, COL.ok, '15px sans-serif'); note(g, 'greasy', X(T_SOFT) + 14, y1 + 18, COL.warm, '15px sans-serif'); note(g, 'oily paste', X(T_OIL) + 12, y1 + 18, COL.hot, '15px sans-serif');
      const pts = []; for (let T = 2; T <= 38; T += 0.5) pts.push([T, clamp(breakMinutes(T, S.spm, S.cream === 'dahi'), 1, 1000)]);
      line(g, pts, X, Y, COL.text, 4);
      dot(g, X(S.temp), Y(clamp(tb(S), 1, 1000)), churnVerdict(S.temp).col);
      note(g, 'Against the temperature of the cream. A rule-of-thumb model.', 84, h - 12, 'rgba(255,255,255,.6)', '16px sans-serif');
    }, [3.3, 6.7, 0]);
    const bd2 = board(root, 2.5, 2.5, 400, 400, (g, w, h) => {
      panelBg(g, w, h); g.fillStyle = COL.text; g.font = 'bold 24px sans-serif'; g.fillText('The four stages', 20, 36);
      const st = stageOf(p);
      STAGES.forEach((n, i) => {
        const y = 58 + i * 62;
        g.fillStyle = i < st ? 'rgba(92,225,169,.35)' : i === st ? 'rgba(255,181,71,.6)' : 'rgba(255,255,255,.08)'; g.fillRect(20, y, w - 40, 50);
        g.fillStyle = COL.text; g.font = 'bold 22px sans-serif'; g.fillText(`${i + 1}. ${n}`, 34, y + 33);
      });
      g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(20, 318, w - 40, 14); g.fillStyle = COL.warm; g.fillRect(20, 318, (w - 40) * clamp(p, 0, 1), 14);
      note(g, p >= 1 ? (churnVerdict(S.temp).k === 'oil' ? 'An oily paste: no grains' : 'Broken: now water in fat') : `${Math.round(clamp(p, 0, 1) * 100)}% of the way to the break`, 20, 366, COL.text, 'bold 19px sans-serif');
    }, [-4.05, 2.7, 0]);

    let key = '', lv = 0;
    return {
      restart,
      update(dt, s, time) {
        dt = Math.max(0, Math.min(dt, 0.05)); S = s; tt += dt;
        const narrow = fitNarrow(stage, [lMem, lAir, lPot]); reelBoards([bd, bd2], -0.5, stage, VIEW, 6.75, 2.9, 1.0);
        if (s._restart) { s._restart = false; restart(); }
        const T = tb(s), v = churnVerdict(s.temp);
        if (s.pset >= 0) { p = s.pset; tmin = p * T; }
        else if (p < 1.3) { const dm = (dt * s.fast) / 60; p = Math.min(1.3, p + dm / Math.max(0.5, T) * (p >= 1 ? 4 : 1)); if (p < 1) tmin += dm; else broke ??= tmin; }
        const oily = v.k === 'oil';
        // ---- microscope box
        const a = smooth((p - 0.08) / 0.3), b2 = smooth((p - 0.5) / 0.4), c3 = smooth((p - 1.0) / 0.25);
        const bubK = smooth(p / 0.3) * (1 - smooth((p - 0.6) / 0.35));
        BUB.forEach((bb, i) => bubs.place(i, bb.c[0], bb.c[1] + 0.05 * Math.sin(tt * 1.3 + i), bb.c[2], Math.max(1e-4, bb.R * bubK)));
        bubs.done();
        lAir.position.set(BUB[0].c[0], BUB[0].c[1], 0.7); lAir.visible = !narrow && bubK > 0.6;
        GL.forEach((q, i) => {
          let x = q.h[0], y = q.h[1], z = q.h[2];
          if (q.b >= 0) { const bb = BUB[q.b], R = bb.R * Math.max(0.35, bubK) + q.r; x = lerp(x, bb.c[0] + q.d[0] * R, a); y = lerp(y, bb.c[1] + q.d[1] * R, a); z = lerp(z, bb.c[2] + q.d[2] * R, a); }
          const c = CL[q.c].c; x = lerp(x, c[0] + q.d2[0] * q.k2, b2); y = lerp(y, c[1] + q.d2[1] * q.k2, b2); z = lerp(z, c[2] + q.d2[2] * q.k2, b2);
          const g = GR[q.gr].c; x = lerp(x, g[0] + q.d3[0] * q.k3, c3); y = lerp(y, g[1] + q.d3[1] * q.k3 * 0.75 + 0.06 * Math.sin(tt + q.gr), c3); z = lerp(z, g[2] + q.d3[2] * q.k3 * 0.6, c3);
          const jig = 0.05 * (1 - b2) * (0.4 + clamp(s.spm / 60, 0.3, 2));
          x += jig * Math.sin(tt * 5.1 + q.ph); y += jig * Math.sin(tt * 4.3 + q.ph * 2);
          glob.place(i, x, y, z, q.r * (oily ? 1 - 0.95 * b2 : 1 + 0.25 * c3));
          glob.tint(i, cc.copy(cFree).lerp(cFat, 0.25 + 0.75 * b2));
        });
        glob.done();
        OIL.forEach((o, i) => oil.place(i, o.c[0], o.c[1] + 0.2 * b2, o.c[2], oily ? Math.max(1e-4, o.R * b2) : 1e-4)); oil.done();
        MM.forEach((m, i) => mem.place(i, m.p[0] + 0.08 * Math.sin(tt * 1.7 + m.ph), m.p[1] + 0.08 * Math.sin(tt * 1.3 + m.ph * 2), m.p[2], i < NM * b2 ? 0.028 : 1e-4)); mem.done();
        lMem.visible = !narrow && b2 > 0.5;
        ch.glass.material.color.setRGB(lerp(1, 0.75, c3), lerp(0.96, 0.88, c3), lerp(0.88, 1, c3)); ch.glass.material.opacity = lerp(0.22, 0.1, c3);
        const st = stageOf(p);
        lBox.element.innerHTML = `Under a microscope · <b>${STAGES[st]}</b>`;
        lS.element.style.setProperty('--c', p >= 1 ? v.col : COL.warm);
        lS.element.innerHTML = p >= 1 ? (oily ? 'Fat smeared into oily blobs: no grains' : 'Grains of fat with water trapped inside') : st === 0 ? 'Globules apart, each in its skin' : st === 1 ? 'Globules crowd onto the air bubbles' : 'Skins tear. Liquid fat glues globules into clumps';
        // ---- the pot
        const f = s.spm / 60, wob = Math.sin(TAU * f * tt * 0.5);
        pot.pose(p < 1.28 || s.pset >= 0 ? 6 * wob : 0);
        const lev = 1.6 + 0.45 * bubK - 0.15 * c3; if (Math.abs(lev - lv) > 0.03) { lv = lev; pot.setLevel(lev); }
        pot.liqMat.color.setRGB(lerp(0.99, 0.93, c3), lerp(0.97, 0.95, c3), lerp(0.92, 0.9, c3)); pot.liqMat.opacity = lerp(0.7, 0.45, c3);
        GRN.forEach((q, i) => grains.place(i, q.r * Math.cos(q.a + tt * 0.2), pot.level() + 0.02 + 0.03 * Math.sin(tt * 2 + i), q.r * Math.sin(q.a + tt * 0.2), c3 > 0 ? q.s * c3 * (oily ? 0.5 : 1) : 1e-4, c3 > 0 ? q.s * c3 * (oily ? 0.15 : 0.8) : 1e-4));
        grains.done();
        lPot.element.innerHTML = p >= 1 ? (oily ? 'A greasy film, no grains' : '<b>Makhan grains</b> floating on chaas') : bubK > 0.5 ? 'Thick and foamy' : 'Churning…';
        const k = `${s.temp}|${s.spm}|${s.cream}|${Math.round(p * 60)}`; if (k !== key) { key = k; bd.redraw(); bd2.redraw(); }
      },
      readout: (s) => {
        const T = tb(s), v = churnVerdict(s.temp), rec = recovery(s.temp);
        return `<div class="big" style="color:${v.col}">${s.temp} °C · ${v.text}</div>
          <div class="row"><span>Time to break at this setting</span><b>${v.k === 'cold' ? fmtMin(T) : 'about ' + fmtMin(T)}</b></div>
          <div class="row"><span>Churned so far</span><b>${fmtMin(tmin)}${p >= 1 ? ' · broken' : ''}</b></div>
          <div class="row"><span>Stage</span><b>${STAGES[stageOf(p)]}</b></div>
          <div class="row"><span>The fat at ${s.temp} °C</span><b>${sfc(s.temp).toFixed(0)}% solid · ${(100 - sfc(s.temp)).toFixed(0)}% liquid</b></div>
          <div class="row"><span>Fat recovered (pot and mathani)</span><b>roughly ${rec.toFixed(0)}%</b></div>
          <small>${v.k === 'cold' ? 'Hard globules bounce off each other. Add a little warm water, as people do in winter.' : v.k === 'good' ? 'Enough crystals to hold a shape, enough liquid fat to glue. A dairy churn at this temperature loses under 1% of the fat.' : v.k === 'soft' ? 'It breaks fast, but the grains are soft and a lot of fat stays in the chaas. Cold water helps.' : 'Almost no crystals left. Add cold water or ice and start again.'} Times are a simple model, not a measurement.</small>`;
      },
    };
  },
};
