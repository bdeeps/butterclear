// Chapter 6: why butter is hard from the fridge and soft on a warm day. Left: a microscope box of the
// fat itself, with crystals (pale needles) in liquid fat (golden) and a few water droplets. Middle: a
// block of butter on a plate with a knife pressed into it. Right: the solid fat curve.
// The curve is the typical solid fat content of milk fat from butter.js (about half solid at 5 °C,
// a fifth at 20 °C, fully liquid by about 40 °C; after Walstra's Dairy Science and Technology). Real
// butter moves a few points either way with season, feed and breed. Butter "melts to a thin liquid at
// 32 to 35 °C" (Wikipedia, Butter). The words (hard, spreadable, soft) are bands of solid fat:
// above 40% hard, 20–40% spreadable, below 20% soft. Cold-spreadable butters aim for at most about
// 40% solid fat at 5 °C. The knife depth is a picture of that, not a measured hardness.
// Cooling: fast cooling makes many small crystals, slow cooling fewer and larger ones (the same reason
// slowly cooled ghee turns grainy). The amounts in 100 g assume table butter with 80 g of fat.
import { THREE, M } from '../kit.js';
import {
  COL, TAU, sfc, SFC_PTS, hex, board, panelBg, axes, title, line, dot, note, band,
  balls, chamber, rng, fitNarrow, reelBoards, clamp, lerp, smooth, link,
} from '../butter.js';

const VIEW = { pos: [0.1, 4.6, 10.1], target: [0.1, 4.2, 0] };
const BX = { x0: -4.75, x1: -1.15, y0: 1.0, y1: 4.4, d: 1.2 };
const NCR = 620;
export function stateOf(T) {
  const f = sfc(T);
  if (f > 55) return { t: 'Rock hard', col: COL.cold, k: 0 };
  if (f > 40) return { t: 'Hard: it tears the bread', col: COL.cold, k: 1 };
  if (f > 20) return { t: 'Spreadable', col: COL.ok, k: 2 };
  if (f > 3) return { t: 'Very soft and shiny', col: COL.warm, k: 3 };
  if (f > 0.4) return { t: 'Melting', col: COL.hot, k: 4 };
  return { t: 'Liquid', col: COL.hot, k: 5 };
}
const T_AT = (v) => { for (let T = -20; T <= 45; T += 0.1) if (sfc(T) <= v) return T; return 45; };
const T_HARD = T_AT(40), T_SOFT2 = T_AT(20);

export default {
  id: 'spread',
  short: 'Hard and soft',
  title: 'Why butter is hard cold and soft warm',
  subtitle: 'Butter fat is not one fat. It is hundreds, each with its own melting point, so butter softens little by little.',
  view: VIEW,
  learn: `<p>Ice melts at exactly 0 °C. Butter does no such thing. It is rock hard in the freezer, firm in the fridge, spreadable on the table, shiny and soft in a summer kitchen, and a clear golden liquid on a hot tawa. It has a <b>melting range</b>, not a melting point.</p>
    <p>The reason is that milk fat is a mixture of hundreds of different fat molecules, called <b>triglycerides</b>. Some stay liquid far below freezing. Others stay solid until nearly 40 °C. At any temperature in between, part of the fat is tiny solid <b>crystals</b> and the rest is liquid oil.</p>
    <p>The crystals link up into a <b>network</b>, like a sponge, and the liquid fat and water droplets sit in its holes. Plenty of crystals make a stiff sponge: hard butter. Fewer crystals make a weak one that a knife can push through. That is <b>spreadable</b> butter, with roughly a fifth to two fifths of the fat solid. Warm it more and the network falls apart.</p>
    <p>Butter melts completely just below body temperature, which is why it melts in the mouth. Makhan, with more water and often more liquid fat, is softer still.</p>
    <p>How butter was <b>cooled</b> matters too. Fast cooling makes many small crystals and a smooth, firm butter. Slow cooling grows fewer, bigger ones. Melt butter fully and cool it slowly and you can feel the grains, which is the <i>danedar</i> texture prized in ghee: see ${link('gheeclear', 'GheeClear')}. The cold that keeps your butter firm is explained in ${link('fridgeclear', 'FridgeClear')}.</p>
    <p class="tip"><b>Try it:</b> slide the temperature from the freezer to a hot day and watch the crystals vanish and the knife sink. Find the range where butter spreads.</p>`,
  terms: [
    { t: 'Melting range', d: 'The span of temperatures over which a mixture goes from all solid to all liquid. For milk fat it runs from about −40 °C to about +40 °C.' },
    { t: 'Triglyceride', d: 'A fat molecule: three fatty acids joined to glycerol. Milk fat has hundreds of kinds.' },
    { t: 'Solid fat content', d: 'The share of a fat that is crystal at a given temperature. About half for butter fat at 5 °C.' },
    { t: 'Crystal network', d: 'Tiny fat crystals linked into a sponge-like frame that holds liquid fat and water and gives butter its firmness.' },
    { t: 'Plastic', d: 'In food science: a solid that keeps its shape but can be spread or moulded. Butter is plastic when it is partly crystal, partly liquid.' },
  ],
  defaults: { temp: 5, cool: 'fast' },
  controls: [
    { key: 'temp', type: 'range', label: 'Temperature of the butter', min: -18, max: 45, step: 1, ends: ['−18 °C', '45 °C'], fmt: (v) => `${v} °C · ${sfc(v).toFixed(0)}% of the fat is solid` },
    { key: 'place', type: 'buttons', label: 'Put it in', items: [
      { label: 'Freezer', act: (s) => { s.temp = -18; } }, { label: 'Fridge', act: (s) => { s.temp = 5; } }, { label: 'Cool room', act: (s) => { s.temp = 18; } },
      { label: 'Summer kitchen', act: (s) => { s.temp = 32; } }, { label: 'Mouth', act: (s) => { s.temp = 37; } },
    ] },
    { key: 'cool', type: 'seg', label: 'How it was cooled', options: [{ v: 'fast', label: 'Fast: small crystals' }, { v: 'slow', label: 'Slow: big crystals' }] },
  ],
  quiz: [
    { q: 'Why does butter soften gradually instead of melting at one temperature?', options: ['It contains air', 'Its fat is a mixture of hundreds of triglycerides with different melting points', 'It contains salt', 'It is not really a solid'], answer: 1, why: 'Each kind of triglyceride melts at its own temperature, anywhere from about −40 °C to about +40 °C, so the solid share falls step by step.' },
    { q: 'What makes fridge-cold butter hard?', options: ['The water in it freezes', 'About half the fat is crystal, linked into a stiff network', 'The salt hardens', 'Air is squeezed out'], answer: 1, why: 'At about 5 °C roughly half the fat is solid crystals that form a strong network. The water is not frozen at fridge temperature.' },
    { q: 'Melted butter is cooled very slowly. Its texture will most likely be…', options: ['Smoother than before', 'Grainy, because fewer and bigger crystals grow', 'Harder than steel', 'Exactly the same'], answer: 1, why: 'Slow cooling gives crystals time to grow large. That graininess is unwanted in butter but prized in ghee.' },
  ],
  reel: [
    { ms: 5400, caption: 'Butter fat is hundreds of fats with different melting points. Cold, half of it is crystal. Warm, the crystals melt away.', set: { cool: 'fast' }, anim: { temp: [2, 37] }, view: { pos: [-0.6, 4.5, 8.4], target: [-0.6, 4.1, 0] }, spin: 0.03 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);
    const rnd = rng(61);
    const W = BX.x1 - BX.x0, Hh = BX.y1 - BX.y0, cx = (BX.x0 + BX.x1) / 2;
    const ch = chamber(root, BX.x0, BX.x1, BX.y0, BX.y1, BX.d, { color: 0xffc93d, opacity: 0.3 });
    const cr = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 0.075, 0.05), new THREE.MeshStandardMaterial({ color: 0xfffbe8, roughness: 0.4 }), NCR);
    cr.instanceMatrix.setUsage(THREE.DynamicDrawUsage); cr.frustumCulled = false; root.add(cr);
    const CR = Array.from({ length: NCR }, (_, i) => ({ x: BX.x0 + 0.15 + rnd() * (W - 0.3), y: BX.y0 + 0.15 + rnd() * (Hh - 0.3), z: (rnd() - 0.5) * 0.9, rx: rnd() * TAU, ry: rnd() * TAU, rz: rnd() * TAU, m: (i + rnd()) / NCR, L: 0.7 + 0.6 * rnd() }));
    const o = new THREE.Object3D();
    const drops = balls(14, { seg: 12, basic: true }); root.add(drops);
    const cW = new THREE.Color(0x4a9dff);
    for (let i = 0; i < 14; i++) { drops.place(i, BX.x0 + 0.3 + rnd() * (W - 0.6), BX.y0 + 0.3 + rnd() * (Hh - 0.6), (rnd() - 0.5) * 0.8, 0.07 + 0.06 * rnd()); drops.tint(i, cW); }
    drops.done();
    const lBox = stage.label('', [cx, BX.y1 + 0.3, 0], root);
    const lCr = stage.label('Fat crystals', [BX.x0 + 0.8, BX.y0 - 0.3, 0.6], root, 'hot'); lCr.element.style.setProperty('--c', '#fffbe8');
    const lOil = stage.label('Liquid fat', [cx + 0.2, BX.y0 - 0.3, 0.6], root, 'hot'); lOil.element.style.setProperty('--c', COL.fat);
    const lW = stage.label('Water', [BX.x1 - 0.5, BX.y0 - 0.3, 0.6], root, 'hot'); lW.element.style.setProperty('--c', COL.water);

    // the plate, the block, the puddle and the knife
    const PXc = 1.5;
    const plate = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 1.6, 0.14, 48), M.plastic(0xe9edf3, { roughness: 0.25 })); plate.position.set(PXc, 0.07, 0); plate.receiveShadow = true; root.add(plate);
    const bMat = new THREE.MeshStandardMaterial({ color: hex(COL.butter), roughness: 0.5 });
    const block = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.0, 1.3, 6, 6, 6), bMat); block.castShadow = true; root.add(block);
    const pud = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.05, 48), new THREE.MeshStandardMaterial({ color: 0xffc93d, roughness: 0.08, transparent: true, opacity: 0.85 })); pud.position.set(PXc, 0.17, 0); root.add(pud);
    const knife = new THREE.Group(); root.add(knife);
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.5, 0.42), M.metal(0xd5dae3, { roughness: 0.2 })); blade.position.y = 0.75; blade.castShadow = true; knife.add(blade);
    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.0, 0.36), M.matte(0x2a3140)); handle.position.y = 2.0; knife.add(handle);
    const lBlock = stage.label('', [PXc, 4.45, 0], root, 'hot');
    const lKnife = stage.label('', [PXc + 1.9, 1.9, 0.5], root);

    let S = { temp: 5, cool: 'fast' };
    const bd = board(root, 3.8, 2.75, 640, 464, (g, w, h) => {
      panelBg(g, w, h); title(g, 'How much of the fat is solid', 'typical milk fat');
      const { X, Y, y0, y1 } = axes(g, w, h, { x0: 76, y1: 62, y0: h - 60, xMin: -20, xMax: 45, yMin: 0, yMax: 100, xTicks: [-20, -10, 0, 10, 20, 30, 40], yTicks: [0, 25, 50, 75, 100], xFmt: (v) => v + '°', yFmt: (v) => v + '%', xLabel: 'temperature, °C' });
      band(g, X(-20), X(T_HARD), y0, y1, 'rgba(111,182,255,.13)'); band(g, X(T_HARD), X(T_SOFT2), y0, y1, 'rgba(92,225,169,.16)'); band(g, X(T_SOFT2), X(45), y0, y1, 'rgba(255,181,71,.12)');
      note(g, 'hard', X(-8), y1 + 20, COL.cold, '16px sans-serif'); note(g, 'spreads', X(T_HARD) + 4, y1 + 20, COL.ok, '16px sans-serif'); note(g, 'soft, then liquid', X(T_SOFT2) + 10, y1 + 20, COL.warm, '16px sans-serif');
      line(g, SFC_PTS, X, Y, COL.fat, 5);
      for (const [T, n] of [[-18, 'freezer'], [5, 'fridge'], [37, 'mouth']]) { g.strokeStyle = 'rgba(255,255,255,.35)'; g.setLineDash([5, 5]); g.beginPath(); g.moveTo(X(T), y0); g.lineTo(X(T), Y(sfc(T))); g.stroke(); g.setLineDash([]); note(g, n, X(T) + 4, y0 - 8, 'rgba(255,255,255,.65)', '15px sans-serif'); }
      dot(g, X(S.temp), Y(sfc(S.temp)), stateOf(S.temp).col);
    }, [3.5, 6.55, 0]);

    let key = '', tt = 0, Tv = 5;
    return {
      update(dt, s) {
        dt = Math.max(0, Math.min(dt, 0.05)); S = s; tt += dt;
        fitNarrow(stage, [lCr, lOil, lW, lKnife]); reelBoards([bd], -0.6, stage, VIEW, 6.6, 3, 1.2);
        Tv += (s.temp - Tv) * (1 - Math.exp(-dt * 5));
        const f = sfc(Tv) / 100, st = stateOf(Tv), slow = s.cool === 'slow';
        // crystals: the highest-melting ones are the last to go
        const share = f / 0.82, step = slow ? 4 : 1;
        CR.forEach((c, i) => {
          const on = i % step === 0 ? clamp((share - c.m) * 30, 0, 1) : 0, L = (slow ? 0.8 : 0.42) * c.L;
          o.position.set(c.x, c.y, c.z); o.rotation.set(c.rx, c.ry, c.rz); o.scale.set(Math.max(1e-4, L * on), slow ? 2.4 * on + 1e-4 : on + 1e-4, slow ? 2.4 * on + 1e-4 : on + 1e-4); o.updateMatrix(); cr.setMatrixAt(i, o.matrix);
        });
        cr.instanceMatrix.needsUpdate = true;
        ch.glass.material.opacity = lerp(0.42, 0.3, f);
        lBox.element.innerHTML = `Inside the fat · <b>${(f * 100).toFixed(0)}% crystal</b>, ${(100 - f * 100).toFixed(0)}% liquid`;
        // the block: slumps as the network weakens, then melts into a puddle
        const soft = 1 - smooth(clamp(f / 0.3, 0, 1)), melt = smooth(clamp((0.06 - f) / 0.06, 0, 1));
        const hgt = lerp(1.0, 0.6, soft) * (1 - melt), wid = lerp(1, 1.18, soft);
        block.visible = hgt > 0.02; block.scale.set(wid, Math.max(0.02, hgt), wid); block.position.set(PXc, 0.14 + 0.5 * hgt, 0);
        bMat.roughness = lerp(0.6, 0.15, soft); bMat.color.set(hex(COL.butter)).lerp(new THREE.Color(0xfff2c0), clamp(-Tv / 25, 0, 0.5));
        pud.visible = soft > 0.35; pud.scale.set(lerp(1.0, 1.75, melt) * (0.6 + 0.4 * soft), 1 + 2 * melt, lerp(0.7, 1.6, melt) * (0.6 + 0.4 * soft));
        // the knife pushes down with the same force each time: how far it sinks shows the firmness
        const depth = clamp(1 - Math.pow(f / 0.5, 1.6), 0.02, 1) * hgt, cyc = (tt * 0.45) % 1, push = cyc < 0.45 ? smooth(cyc / 0.45) : cyc < 0.7 ? 1 : 1 - smooth((cyc - 0.7) / 0.3);
        const topY = 0.14 + hgt;
        knife.position.set(PXc + 0.3, topY + 0.7 * (1 - push) - depth * push, 0); knife.rotation.z = -0.12;
        knife.visible = melt < 0.9;
        lBlock.element.style.setProperty('--c', st.col); lBlock.element.innerHTML = `<b>${Math.round(Tv)} °C</b> · ${st.t}`;
        lKnife.element.innerHTML = st.k <= 1 ? 'The knife barely dents it' : st.k === 2 ? 'The knife sinks in and spreads' : st.k === 3 ? 'The knife falls straight through' : '';
        lKnife.visible = lKnife.visible && st.k <= 3;
        const k = `${Math.round(Tv * 2)}`; if (k !== key) { key = k; bd.redraw(); }
      },
      readout: (s) => {
        const f = sfc(s.temp), st = stateOf(s.temp);
        return `<div class="big" style="color:${st.col}">${s.temp} °C: ${st.t}</div>
          <div class="row"><span>Fat that is solid crystal</span><b>${f.toFixed(0)}%</b></div>
          <div class="row"><span>Fat that is liquid</span><b>${(100 - f).toFixed(0)}%</b></div>
          <div class="row"><span>In 100 g of butter</span><b>${(0.8 * f).toFixed(0)} g crystal · ${(80 - 0.8 * f).toFixed(0)} g oil · 16 g water</b></div>
          <div class="row"><span>Spreads between about</span><b>${T_HARD.toFixed(0)} and ${T_SOFT2.toFixed(0)} °C</b></div>
          <div class="row"><span>Crystals</span><b>${s.cool === 'slow' ? 'few and large: grainy' : 'many and small: smooth'}</b></div>
          <small>${s.temp <= 0 ? 'Even in the freezer a good part of the fat is still liquid oil, held inside the crystal network.' : s.temp >= 36 ? 'At body temperature almost every crystal has melted. That is why butter melts in the mouth.' : st.k === 2 ? 'Enough crystals to hold a shape, few enough for a knife to break their network.' : st.k < 2 ? 'Too many crystals, locked into a stiff network. Leave it out for a while before spreading.' : 'The crystal network is too thin to hold the liquid fat, so the block shines and slumps.'} Typical values: real butter varies with season and feed.</small>`;
      },
    };
  },
};
