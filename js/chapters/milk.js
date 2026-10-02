// Chapter 1: what is in milk and cream. A steel glass of milk, a "microscope box" 40 × 40 × 12 µm
// (1 scene unit = 10 µm) with fat globules drawn to scale, and one globule blown up so its membrane
// can be lifted off.
// Numbers: composition, globule sizes (0.1–20 µm, average 3–4 µm), membrane 10–20 nm and casein
// micelles (about 150 nm) from the Tetra Pak Dairy Processing Handbook, chapter 2; buffalo milk
// figures are typical values from reviews (about 7% fat, globules about 5 µm). See butter.js.
// The number of globules in the box is worked out from the fat's share of the volume. Casein
// micelles: about 2.7 g of casein per 100 g of cow milk, each gram swollen to roughly 4 mL of
// micelle, makes about 10% of the volume, or roughly a million 150 nm micelles in this box. Only a
// haze of 1,400 is drawn.
import { THREE, M } from '../kit.js';
import {
  MILKS, COL, TAU, waterOf, fatVol, perMl, areaPerL, hex, board, panelBg, title, stacks, legend, note,
  balls, chamber, rng, fitNarrow, reelBoards, clamp, smooth, sci, link,
} from '../butter.js';

const VIEW = { pos: [0.1, 4.6, 10.1], target: [0.1, 4.2, 0] };
const BOX = { x0: -3.4, x1: 0.6, y0: 0.7, y1: 4.7, d: 1.2 };
const BOX_UM3 = 40 * 40 * 12;
const NMAX = 260;

export default {
  id: 'milk',
  short: 'What is in milk',
  title: 'Milk is water with fat hidden in it',
  subtitle: 'Billions of tiny fat globules float in every spoonful, each wrapped in its own thin skin.',
  view: VIEW,
  learn: `<p>Milk looks like one smooth white liquid. It is really mostly <b>water</b>, about 87% in cow milk, with other things floating or dissolved in it: <b>fat</b>, <b>protein</b> (mostly casein), the milk sugar <b>lactose</b>, and minerals.</p>
    <p>Fat and water do not mix, so the fat sits in the water as tiny balls called <b>fat globules</b>. An average one is 3 to 4 thousandths of a millimetre across. A single millilitre of milk holds a few billion of them. A liquid full of droplets of another liquid is an <b>emulsion</b>, and milk is a fat-in-water emulsion.</p>
    <p>Why do the globules not simply join into one blob of fat? Each one is wrapped in a <b>membrane</b>, a skin only 10 to 20 millionths of a millimetre thick made of phospholipids and proteins. One end of a phospholipid likes fat and the other end likes water, so the skin sits happily between the two and keeps neighbours apart. <b>Making makhan means breaking that skin.</b></p>
    <p><b>Buffalo milk</b> has nearly twice the fat of cow milk, in bigger globules. That is why it gives a thicker malai and more makhan. <b>Cream</b> is simply milk with the globules crowded together: 40% fat instead of 4%. The other part of milk, the casein, is the star of ${link('curdclear', 'CurdClear')}.</p>
    <p class="tip"><b>Try it:</b> switch between cow milk, buffalo milk and cream and count the globules in the box. Then lift the membrane off the big globule to see what is inside.</p>`,
  terms: [
    { t: 'Emulsion', d: 'Tiny droplets of one liquid spread through another that it does not mix with. Milk is fat in water. Butter is water in fat.' },
    { t: 'Fat globule', d: 'A ball of milk fat, 0.1 to 20 micrometres across, wrapped in a membrane.' },
    { t: 'Milk fat globule membrane', d: 'The skin of phospholipids and proteins, 10 to 20 nanometres thick, that stops globules from merging.' },
    { t: 'Casein micelle', d: 'A cluster of casein protein about 150 nanometres across. Micelles scatter light and make milk white.' },
    { t: 'Micrometre (µm)', d: 'A thousandth of a millimetre. A hair is about 70 µm thick.' },
  ],
  defaults: { milk: 'cow', open: 0 },
  controls: [
    { key: 'milk', type: 'seg', label: 'In the glass', options: [{ v: 'cow', label: 'Cow milk' }, { v: 'buffalo', label: 'Buffalo milk' }, { v: 'cream', label: 'Cream' }], fmt: (v) => `${MILKS[v].fat}% fat` },
    { key: 'open', type: 'range', label: 'Lift the membrane', min: 0, max: 1, step: 0.01, ends: ['closed', 'open'], fmt: (v) => (v < 0.05 ? 'whole globule' : 'membrane lifted') },
  ],
  quiz: [
    { q: 'What is milk, to a chemist?', options: ['A pure liquid', 'An emulsion: tiny fat globules spread through water', 'Fat with a little water in it', 'A gas dissolved in water'], answer: 1, why: 'Milk is about 87% water with fat floating in it as billions of tiny globules: a fat-in-water emulsion.' },
    { q: 'Why do the fat globules in fresh milk not merge into one lump?', options: ['They are frozen', 'Each is wrapped in a membrane that keeps it apart from its neighbours', 'Milk has no fat', 'Gravity pushes them apart'], answer: 1, why: 'The membrane of phospholipids and proteins sits between fat and water and stops globules from merging. Churning has to break it.' },
    { q: 'Why does buffalo milk give more makhan than the same amount of cow milk?', options: ['It has nearly twice the fat', 'It is colder', 'It has more water', 'It has no membranes'], answer: 0, why: 'Typical buffalo milk has about 7% fat against about 4% in cow milk. More fat in means more makhan out.' },
  ],
  reel: [
    { ms: 5200, caption: 'Milk hides its fat as billions of tiny globules, each wrapped in its own skin.', set: { milk: 'cow', open: 0 }, anim: { open: [0, 1] }, view: { pos: [0.3, 4.5, 8.2], target: [0.3, 4.1, 0] }, spin: 0.06 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);
    const rnd = rng(11);

    // the steel glass of milk
    const glass = new THREE.Group(); glass.position.set(-4.5, 0, 0.3); glass.scale.setScalar(0.85); root.add(glass);
    const cupMat = M.metal(0xc9ced8, { roughness: 0.3, side: THREE.DoubleSide });
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.48, 1.9, 40, 1, true), cupMat); cup.position.y = 0.95; cup.castShadow = true; glass.add(cup);
    const cupBase = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.05, 40), cupMat); cupBase.position.y = 0.03; glass.add(cupBase);
    const milkMat = new THREE.MeshStandardMaterial({ color: 0xfbf7ea, roughness: 0.3 });
    const milkTop = new THREE.Mesh(new THREE.CylinderGeometry(0.585, 0.585, 0.04, 40), milkMat); milkTop.position.y = 1.7; glass.add(milkTop);
    const lGlass = stage.label('', [-4.6, 2.35, 0.3], root);
    // the zoom lines from the glass to the box
    const zl = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-4.6, 1.72, 0.3), new THREE.Vector3(BOX.x0, BOX.y1, 0), new THREE.Vector3(-4.6, 1.72, 0.3), new THREE.Vector3(BOX.x0, BOX.y0, 0)]), new THREE.LineBasicMaterial({ color: 0x9fb4c8, transparent: true, opacity: 0.5 }));
    root.add(zl);

    // the microscope box
    const cx = (BOX.x0 + BOX.x1) / 2, cy = (BOX.y0 + BOX.y1) / 2;
    const ch = chamber(root, BOX.x0, BOX.x1, BOX.y0, BOX.y1, BOX.d, { color: 0x9fd0ff, opacity: 0.1 });
    const glob = balls(NMAX, { rough: 0.3 }); root.add(glob);
    const haze = balls(1400, { seg: 6, basic: true, opacity: 0.75 }); root.add(haze);
    const H = Array.from({ length: 1400 }, () => ({ x: BOX.x0 + 0.05 + rnd() * 3.9, y: BOX.y0 + 0.05 + rnd() * 3.9, z: (rnd() - 0.5) * 1.1, p: rnd() * TAU }));
    const hazeCol = new THREE.Color(COL.protein); for (let i = 0; i < 1400; i++) haze.tint(i, hazeCol);
    let P = [], shown = '';
    function fill(kind) {
      const m = MILKS[kind], target = fatVol(m.fat) * BOX_UM3, col = new THREE.Color(kind === 'buffalo' ? 0xfff3d0 : COL.fat);
      P = []; let vol = 0, guard = 0;
      while (vol < target && P.length < NMAX && guard++ < 4000) {
        const d = clamp(m.d * Math.exp(0.33 * (rnd() + rnd() + rnd() - 1.5) * 2) * 0.86, 0.8, 11), r = d / 20;   // radius in scene units
        let ok = false, x, y, z;
        for (let t = 0; t < 25 && !ok; t++) {
          x = BOX.x0 + r + rnd() * (4 - 2 * r); y = BOX.y0 + r + rnd() * (4 - 2 * r); z = (rnd() - 0.5) * Math.max(0.02, 1.2 - 2 * r);
          ok = P.every((q) => (q.x - x) ** 2 + (q.y - y) ** 2 + (q.z - z) ** 2 > (q.r + r) ** 2 * 0.9);
        }
        if (!ok) continue;
        P.push({ x, y, z, r, p: rnd() * TAU }); vol += (Math.PI / 6) * d ** 3;
      }
      for (let i = 0; i < NMAX; i++) glob.tint(i, col);
      milkMat.color.set(kind === 'cow' ? 0xfbf6e4 : kind === 'buffalo' ? 0xffffff : 0xfff0c2);
      core.material.color.set(kind === 'buffalo' ? 0xfff3d0 : hex(COL.fat));
      lGlass.element.innerHTML = `<b>${m.name}</b>`;
      shown = kind;
    }
    const lBox = stage.label('', [cx, BOX.y1 + 0.3, 0], root);
    const lFat = stage.label('Fat globule', [BOX.x0 + 0.9, BOX.y0 - 0.25, 0.6], root, 'hot'); lFat.element.style.setProperty('--c', COL.fat);
    const lCas = stage.label('Casein micelles (the haze)', [BOX.x1 - 0.9, BOX.y0 - 0.25, 0.6], root, 'hot'); lCas.element.style.setProperty('--c', COL.protein);

    // one globule, blown up
    const hero = new THREE.Group(); hero.position.set(3.1, 2.1, 0.2); hero.scale.setScalar(1.3); root.add(hero);
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.86, 40, 28), new THREE.MeshStandardMaterial({ color: hex(COL.fat), roughness: 0.25 })); core.castShadow = true; hero.add(core);
    const memMat = new THREE.MeshStandardMaterial({ color: 0xe58ad0, roughness: 0.5, transparent: true, opacity: 0.9, side: THREE.DoubleSide });
    const halves = [0, 1].map((i) => {
      const g = new THREE.Group();
      g.add(new THREE.Mesh(new THREE.SphereGeometry(0.93, 40, 20, 0, TAU, i ? Math.PI / 2 : 0, Math.PI / 2), memMat));
      const bumps = balls(46, { seg: 8, rough: 0.5 }), bc = new THREE.Color(0xb46be0);
      for (let k = 0; k < 46; k++) {
        const u = rnd(), a = rnd() * TAU, cz = i ? -u : u, s = Math.sqrt(1 - cz * cz);
        bumps.place(k, 0.95 * s * Math.cos(a), 0.95 * cz, 0.95 * s * Math.sin(a), 0.05 + 0.04 * rnd()); bumps.tint(k, bc);
      }
      bumps.done(); g.add(bumps); hero.add(g); return g;
    });
    const lMem = stage.label('Membrane: 10–20 nm of phospholipids and proteins', [0, 1.2, 0], hero, 'hot'); lMem.element.style.setProperty('--c', '#e58ad0');
    const lCore = stage.label('Milk fat: part liquid, part crystal', [0, -1.3, 0], hero, 'hot'); lCore.element.style.setProperty('--c', COL.fat);
    const lHero = stage.label('One globule, blown up', [0, -1.75, 0], hero);

    const PARTS = [['Water', COL.water, waterOf], ['Fat', COL.fat, (m) => m.fat], ['Protein', COL.protein, (m) => m.protein], ['Lactose', COL.lactose, (m) => m.lactose], ['Minerals', COL.ash, (m) => m.ash]];
    let S = { milk: 'cow' };
    const bd = board(root, 4.2, 2.89, 640, 440, (g, w, h) => {
      panelBg(g, w, h); title(g, 'What 100 g is made of', 'typical values');
      legend(g, PARTS.map(([n, c]) => [n, c]), 20, 50, 15);
      stacks(g, ['cow', 'buffalo', 'cream'].map((k) => ({ label: (k === S.milk ? '▸ ' : '') + MILKS[k].name.replace(' (40% fat)', ''), parts: PARTS.map(([, c, f]) => [f(MILKS[k]), c]), text: `water ${waterOf(MILKS[k]).toFixed(0)}% · fat ${MILKS[k].fat}% · protein ${MILKS[k].protein}% · lactose ${MILKS[k].lactose}%` })), { y: 92, w: 620, rowH: 100, labelW: 150 });
      note(g, 'Cow: Tetra Pak Dairy Processing Handbook. Buffalo: typical.', 20, h - 16, 'rgba(255,255,255,.55)', '15px sans-serif');
    }, [3.3, 6.6, 0]);

    let key = '';
    return {
      update(dt, s, time) {
        dt = Math.max(0, dt); S = s;
        const narrow = fitNarrow(stage, [lCas, lFat, lHero, lCore]); reelBoards([bd], 0.3, stage, VIEW, 6.75);
        if (s.milk !== shown) fill(s.milk);
        P.forEach((p, i) => glob.place(i, p.x + 0.03 * Math.sin(time * 0.7 + p.p), p.y + 0.03 * Math.sin(time * 0.6 + p.p * 2), p.z, p.r));
        for (let i = P.length; i < NMAX; i++) glob.place(i, 0, -50, 0, 0.0001);
        glob.done();
        const hz = s.milk === 'cream' ? 0.6 : 1;
        H.forEach((q, i) => haze.place(i, q.x + 0.05 * Math.sin(time * 2.3 + q.p), q.y + 0.05 * Math.sin(time * 1.9 + q.p * 3), q.z, i < 1400 * hz ? 0.022 : 0.0001));
        haze.done();
        const k = smooth(clamp(s.open, 0, 1));
        halves[0].position.y = 0.95 * k; halves[0].rotation.z = 0.35 * k; halves[0].position.x = -0.25 * k;
        halves[1].position.y = -0.25 * k;
        lMem.position.y = 1.2 + 0.95 * k; lCore.visible = !narrow && k > 0.3;
        hero.rotation.y = time * 0.25;
        lBox.element.innerHTML = `Under a microscope: a box 40 µm wide · <b>${P.length} globules</b>`;
        const kk = s.milk; if (kk !== key) { key = kk; bd.redraw(); }
      },
      readout: (s) => {
        const m = MILKS[s.milk], n = perMl(m.fat, m.d);
        return `<div class="big">${m.name}: ${m.fat}% fat in ${waterOf(m).toFixed(0)}% water</div>
          <div class="row"><span>Average fat globule</span><b>${m.d} µm across</b></div>
          <div class="row"><span>Globules in 1 mL (if all were average)</span><b>about ${(n / 1e9).toFixed(n > 1e10 ? 0 : 1)} billion</b></div>
          <div class="row"><span>Fat's share of the volume</span><b>${(fatVol(m.fat) * 100).toFixed(1)}%</b></div>
          <div class="row"><span>Membrane wrapped round the fat in 1 litre</span><b>about ${Math.round(areaPerL(m.fat, m.d) / 10) * 10} m²</b></div>
          <div class="row"><span>Membrane thickness</span><b>10–20 nm</b></div>
          <small>${s.milk === 'cream' ? 'Cream is the same globules, crowded together. They are close enough to bump into each other, which is what churning needs.' : s.milk === 'buffalo' ? 'Fewer globules than cow milk, but bigger ones, and nearly twice the fat overall.' : 'The haze between the globules is casein: roughly a million micelles in this box. They make milk white.'}</small>`;
      },
    };
  },
};
