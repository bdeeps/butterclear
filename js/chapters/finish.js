// Chapter 5: washing, working and salting. Left: a microscope box about 100 µm wide (1 unit = 25 µm)
// showing the water droplets left inside the fat. Middle: the lump being pressed with a wooden paddle,
// and the glass of chaas. Right: what the butter is made of, against the FSSAI limits.
// What is real and what is a model:
//  · FSSAI limits (FSS Food Products Standards Regulations, 2011): table butter at least 80.0% milk
//    fat, at most 16.0% moisture, 1.5% curd (milk solids-not-fat) and 3.0% salt; desi (cooking) butter
//    at least 76.0% milk fat. Codex CXS 279-1971: at least 80% fat, at most 16% water, 2% solids-not-fat.
//  · Fat recovered: about 67% with a pot and mathani at 18 °C (FAO/ILCA); a dairy churn loses under
//    0.7% of the fat in the buttermilk (Tetra Pak Dairy Processing Handbook).
//  · Model: freshly drained grains hold about 30% water (typical), and working presses that down to
//    about 15.5%. Each wash takes out about a quarter of the leftover curd. Working also breaks the water
//    into finer droplets, from about 30 µm down to about 4 µm (well-worked butter averages a few µm).
//    Droplets per gram = water volume ÷ volume of one droplet.
//  · The mass balance is exact arithmetic: makhan = fat in × share recovered ÷ fat share of the makhan.
//    The desi method here adds water equal to the dahi before churning, as is usual.
import { THREE, M } from '../kit.js';
import {
  MILKS, COL, TAU, FSSAI, recovery, hex, board, panelBg, title, stacks, legend, note,
  balls, chamber, rng, fitNarrow, reelBoards, clamp, lerp, sci, link,
} from '../butter.js';

const VIEW = { pos: [0.1, 4.6, 10.1], target: [0.1, 4.2, 0] };
const BX = { x0: -4.75, x1: -1.15, y0: 1.0, y1: 4.4, d: 1.2 };
const BOX_UM3 = (3.6 * 25) * (3.4 * 25) * (1.2 * 25);
const ND = 520;
const START = { cow: { name: 'cow-milk dahi', fat: MILKS.cow.fat }, buffalo: { name: 'buffalo-milk dahi', fat: MILKS.buffalo.fat }, cream: { name: 'dairy cream', fat: 40 } };

export function recipe(s) {
  const table = s.kind === 'table';
  const moisture = lerp(30, 15.5, Math.pow(clamp(s.work, 0, 1), 0.8));
  const curd = 2.4 * Math.pow(0.75, s.wash) * (moisture / 30 + 0.5) / 1.5 + 0.5;
  const salt = table ? s.salt : 0;
  const fat = 100 - moisture - curd - salt;
  const d = lerp(30, 4, Math.pow(clamp(s.work, 0, 1), 0.7));                      // µm
  const perG = (moisture / 100) / ((Math.PI / 6) * Math.pow(d * 1e-4, 3));        // droplets per gram (1 g of water ≈ 1 cm³)
  const brine = salt > 0 ? (100 * salt) / (salt + moisture) : 0;
  const st = START[table ? 'cream' : s.from], fatIn = st.fat * 10;               // g of fat in 1 kg
  const rec = table ? 99.3 : recovery(18);
  const butter = (fatIn * rec) / fat;                                             // g
  const liquid = 1000 + (table ? 0 : 1000) - butter;
  const chaasFat = (100 * fatIn * (1 - rec / 100)) / liquid;
  const okTable = fat >= FSSAI.table.fat && moisture <= FSSAI.table.moisture && curd <= FSSAI.table.curd && salt <= FSSAI.table.salt;
  return { table, moisture, curd, salt, fat, d, perG, brine, st, fatIn, rec, butter, liquid, chaasFat, okTable, okDesi: fat >= FSSAI.desi.fat };
}

export default {
  id: 'finish',
  short: 'Wash, work, salt',
  title: 'From grains to makhan and butter',
  subtitle: 'Pressing drives out buttermilk and breaks the water left behind into droplets too small to see.',
  view: VIEW,
  learn: `<p>Fresh butter grains are still wet with buttermilk. Three steps finish the job.</p>
    <p><b>Washing.</b> The grains are rinsed in cold water. This carries away buttermilk, with its protein and lactose, which would turn sour first. <b>Working.</b> The grains are pressed and folded, by hand, with a wooden paddle or by rollers in a dairy. Loose water runs out, and the water that stays is broken into <b>tiny droplets</b>, a few thousandths of a millimetre across, each sealed inside fat. A gram of well-worked butter holds billions of them. Bacteria trapped in such a small droplet have almost nothing to feed on, so well-worked butter keeps longer. <b>Salting.</b> Salt dissolves only in the water, not in the fat. So 2% salt in butter makes the droplets about as salty as strong brine.</p>
    <p><b>White makhan</b>, the desi kind, is churned from dahi or soured malai. It is unsalted, soft, a little tangy from the lactic acid and the aroma compound diacetyl, and holds more water. It is white when made from buffalo milk, because buffalo milk fat carries almost no yellow carotene. Makhan does not keep long, which is one reason it is usually cooked on into ghee: see ${link('gheeclear', 'GheeClear')}.</p>
    <p><b>Table butter</b> from a dairy starts as pasteurised cream. It is churned cold, worked hard, salted and often coloured with annatto or carotene. In India, FSSAI says it must have at least <b>80% milk fat</b>, and at most 16% moisture, 1.5% curd and 3% salt. Desi butter needs at least 76% fat.</p>
    <p>What is left in the pot is <b>chaas</b>: water, milk protein, lactose and a little fat. Nothing is wasted.</p>
    <p class="tip"><b>Try it:</b> work the butter more and watch the droplets shrink and multiply. Then switch to table butter, add salt, and see whether your block passes the FSSAI limits.</p>`,
  terms: [
    { t: 'Working', d: 'Pressing and folding butter to squeeze out loose water and break the rest into fine droplets.' },
    { t: 'White makhan', d: 'Unsalted desi butter churned from dahi or soured malai. Soft, tangy and usually made into ghee.' },
    { t: 'Table butter', d: 'Dairy butter from pasteurised cream, usually salted. FSSAI: at least 80% milk fat, at most 16% moisture.' },
    { t: 'Curd (in butter)', d: 'The milk solids other than fat left in butter: protein, lactose and minerals. FSSAI allows at most 1.5% in table butter.' },
    { t: 'Chaas', d: 'The buttermilk left after churning dahi: mostly water with protein, lactose and a little fat.' },
    { t: 'Annatto', d: 'A yellow-orange food colour from the seeds of the achiote tree, often used in butter and cheese.' },
  ],
  defaults: { kind: 'desi', from: 'buffalo', work: 0.55, wash: 1, salt: 2 },
  controls: [
    { key: 'kind', type: 'seg', label: 'Make', options: [{ v: 'desi', label: 'White makhan (desi)' }, { v: 'table', label: 'Table butter (dairy)' }] },
    { key: 'from', type: 'seg', label: 'Makhan: start with 1 kg of', options: [{ v: 'cow', label: 'Cow dahi' }, { v: 'buffalo', label: 'Buffalo dahi' }], hint: 'Table butter always starts from 1 kg of 40% cream here.' },
    { key: 'work', type: 'range', label: 'Working', min: 0, max: 1, step: 0.01, ends: ['just drained', 'worked hard'], fmt: (v, s) => `${recipe(s).moisture.toFixed(1)}% water` },
    { key: 'wash', type: 'range', label: 'Washes in cold water', min: 0, max: 3, step: 1, ends: ['none', 'three'], fmt: (v) => `${v}` },
    { key: 'salt', type: 'range', label: 'Salt (table butter)', min: 0, max: 4, step: 0.1, ends: ['unsalted', '4%'], fmt: (v, s) => (s.kind === 'table' ? `${v.toFixed(1)}%` : 'makhan is unsalted') },
  ],
  onChange(s, key) { if (key === 'kind') { if (s.kind === 'table') { s.work = 1; s.wash = 2; } else { s.work = 0.55; s.wash = 1; } } },
  quiz: [
    { q: 'What does working (pressing and folding) do to butter?', options: ['Adds air to make it fluffy', 'Squeezes out loose water and breaks the rest into tiny sealed droplets', 'Melts the fat', 'Turns it into ghee'], answer: 1, why: 'Working drives out buttermilk and leaves the remaining water as droplets a few micrometres across, each surrounded by fat.' },
    { q: 'Under FSSAI rules, table butter must contain at least how much milk fat?', options: ['50%', '65%', '80%', '99.5%'], answer: 2, why: 'Table butter: at least 80% milk fat, with at most 16% moisture, 1.5% curd and 3% salt. Desi butter needs at least 76% fat.' },
    { q: 'Butter has 2% salt and 16% water. Roughly how salty is the water inside it?', options: ['2%', 'About 11%', '16%', '50%'], answer: 1, why: 'Salt dissolves only in the water: 2 ÷ (2 + 16) is about 11%, a strong brine.' },
  ],
  reel: [
    { ms: 5200, caption: 'Washing and pressing drive out the buttermilk. The water left behind ends up as billions of tiny droplets.', set: { kind: 'desi', from: 'buffalo', wash: 1 }, anim: { work: [0, 1] }, view: { pos: [-0.6, 4.5, 8.4], target: [-0.6, 4.1, 0] }, spin: 0.03 },
    { ms: 5200, caption: 'White makhan is soft and unsalted. Table butter is salted, coloured, and at least 80% fat by FSSAI rules.', set: { kind: 'table', work: 1, wash: 2 }, anim: { salt: [0, 2.5] }, view: { pos: [-0.6, 4.5, 8.4], target: [-0.6, 4.1, 0] }, spin: 0.03 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);
    const rnd = rng(41);
    const W = BX.x1 - BX.x0, Hh = BX.y1 - BX.y0, cx = (BX.x0 + BX.x1) / 2;
    const ch = chamber(root, BX.x0, BX.x1, BX.y0, BX.y1, BX.d, { color: hex(COL.fat), opacity: 0.5 });
    const drops = balls(ND, { seg: 12, basic: true }); root.add(drops);
    const D = Array.from({ length: ND }, () => ({ x: BX.x0 + rnd() * W, y: BX.y0 + rnd() * Hh, z: (rnd() - 0.5) * 1.0, f: 0.75 + 0.5 * rnd() }));
    const cW = new THREE.Color(0x4a9dff), cS = new THREE.Color(0xd9f3ff), cc = new THREE.Color();
    const lBox = stage.label('', [cx, BX.y1 + 0.3, 0], root);
    const lDrop = stage.label('Water droplets sealed in fat', [cx, BX.y0 - 0.3, 0.6], root, 'hot'); lDrop.element.style.setProperty('--c', COL.water);

    // the worktop: a wooden board, the lump, a paddle, and a glass of chaas
    const wood = M.matte(0x9a6a3c);
    const top = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.16, 2.2), wood); top.position.set(0.9, 0.6, 0); top.castShadow = top.receiveShadow = true; root.add(top);
    for (const dx of [-1.2, 1.2]) { const leg = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.52, 2.0), M.matte(0x6f4a28)); leg.position.set(0.9 + dx, 0.26, 0); root.add(leg); }
    const lumpMat = new THREE.MeshStandardMaterial({ color: hex(COL.makhan), roughness: 0.45 });
    const lump = new THREE.Mesh(new THREE.SphereGeometry(0.85, 40, 28), lumpMat); lump.castShadow = true; root.add(lump);
    const block = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.75, 1.0), lumpMat); block.castShadow = true; root.add(block);
    const paddle = new THREE.Group(); root.add(paddle);
    const blade = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.1, 1.0), M.matte(0xc79a5c)); blade.castShadow = true; paddle.add(blade);
    const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 1.3, 12), M.matte(0xc79a5c)); grip.rotation.z = Math.PI / 2; grip.position.x = 1.35; paddle.add(grip);
    const saltB = balls(60, { seg: 6, basic: true }); root.add(saltB);
    const SP = Array.from({ length: 60 }, () => ({ x: (rnd() - 0.5) * 1.5, z: (rnd() - 0.5) * 0.85 }));
    const drip = balls(24, { seg: 8, basic: true, opacity: 0.85 }); root.add(drip);
    const DR = Array.from({ length: 24 }, () => ({ u: rnd(), x: 0.9 + (rnd() - 0.5) * 2.6, z: 1.1 + rnd() * 0.05 })); const cDr = new THREE.Color(0xdfeeff); for (let i = 0; i < 24; i++) drip.tint(i, cDr);
    const lLump = stage.label('', [0.9, 2.7, 0], root, 'hot');
    // chaas
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.4, 1.5, 36, 1, true), M.metal(0xc9ced8, { roughness: 0.3, side: THREE.DoubleSide })); cup.position.set(3.2, 0.77, 0.4); cup.castShadow = true; root.add(cup);
    const cupB = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.04, 36), M.metal(0xc9ced8)); cupB.position.set(3.2, 0.03, 0.4); root.add(cupB);
    const chaas = new THREE.Mesh(new THREE.CylinderGeometry(0.47, 0.47, 0.04, 36), new THREE.MeshStandardMaterial({ color: 0xf4f6f2, roughness: 0.3 })); chaas.position.set(3.2, 1.3, 0.4); root.add(chaas);
    const lCh = stage.label('', [3.2, 1.95, 0.4], root);

    let S = { kind: 'desi', from: 'buffalo', work: 0.55, wash: 1, salt: 2 };
    const PARTS = [['Milk fat', COL.fat], ['Water', COL.water], ['Curd', COL.protein], ['Salt', COL.salt]];
    const bd = board(root, 3.55, 2.93, 640, 528, (g, w, h) => {
      const r = recipe(S);
      panelBg(g, w, h); title(g, 'What 100 g is made of'); legend(g, PARTS, 20, 50, 15);
      stacks(g, [
        { label: r.table ? 'Your butter' : 'Your makhan', parts: [[r.fat, COL.fat], [r.moisture, COL.water], [r.curd, COL.protein], [r.salt, COL.salt]], text: `fat ${r.fat.toFixed(1)}% · water ${r.moisture.toFixed(1)}% · curd ${r.curd.toFixed(1)}%${r.salt ? ` · salt ${r.salt.toFixed(1)}%` : ''}` },
        { label: 'Table butter', parts: [[80, COL.fat], [16, COL.water], [1.5, COL.protein], [2.5, COL.salt]], text: 'FSSAI: fat ≥ 80% · water ≤ 16% · curd ≤ 1.5% · salt ≤ 3%' },
        { label: 'Desi butter', parts: [[76, COL.fat], [24, 'rgba(255,255,255,.14)']], text: 'FSSAI: fat ≥ 76%' },
      ], { y: 92, w: 620, rowH: 96, labelW: 150 });
      const ok = r.table ? r.okTable : r.okDesi;
      note(g, ok ? `✓ Meets the FSSAI standard for ${r.table ? 'table' : 'desi'} butter` : `✗ Not yet ${r.table ? 'table' : 'desi'} butter by FSSAI: ${r.table ? (r.salt > 3 ? 'too much salt' : r.curd > 1.5 ? 'too much curd: wash it' : 'work out more water') : 'work out more water'}`, 20, 404, ok ? COL.ok : COL.hot, 'bold 19px sans-serif');
      note(g, `From 1 kg of ${r.st.name} (${r.st.fat}% fat): ${Math.round(r.fatIn)} g of fat`, 20, 444, COL.text, '18px sans-serif');
      note(g, `→ ${Math.round(r.butter)} g of ${r.table ? 'butter' : 'makhan'} (${r.rec.toFixed(0)}% of the fat recovered)`, 20, 474, COL.fat, 'bold 18px sans-serif');
      note(g, `→ ${Math.round(r.liquid)} g of ${r.table ? 'buttermilk' : 'chaas'} with ${r.chaasFat.toFixed(1)}% fat`, 20, 504, COL.water, 'bold 18px sans-serif');
    }, [3.6, 6.45, 0]);

    let key = '', tt = 0;
    return {
      update(dt, s) {
        dt = Math.max(0, Math.min(dt, 0.05)); S = s; tt += dt;
        fitNarrow(stage, [lDrop, lCh]); reelBoards([bd], -0.6, stage, VIEW, 6.6, 3, 1.25);
        const r = recipe(s);
        // droplets: the right number for this box, at the right size
        const rad = r.d / 2 / 25, n = Math.min(ND, Math.max(3, Math.round(((r.moisture / 100) * 0.93 * BOX_UM3) / ((Math.PI / 6) * r.d ** 3))));
        D.forEach((q, i) => { drops.place(i, clamp(q.x, BX.x0 + rad, BX.x1 - rad), clamp(q.y, BX.y0 + rad, BX.y1 - rad), q.z * clamp(1.1 - 2 * rad, 0.05, 1), i < n ? rad * q.f : 1e-4); drops.tint(i, cc.copy(cW).lerp(cS, clamp(r.brine / 30, 0, 0.5))); });
        drops.done();
        ch.glass.material.color.set(r.table ? 0xffc93d : 0xffe9a6);
        lBox.element.innerHTML = `Inside the ${r.table ? 'butter' : 'makhan'}: a box 90 µm wide · droplets about <b>${r.d.toFixed(0)} µm</b>`;
        // the lump and the paddle
        lumpMat.color.set(r.table ? hex(COL.butter) : s.from === 'cow' ? 0xfff0b8 : hex(COL.makhan));
        const press = 0.5 + 0.5 * Math.sin(tt * 3.2), sq = 1 - 0.12 * press;
        lump.visible = !r.table; block.visible = r.table;
        lump.position.set(0.9, 0.68 + 0.55 * sq, 0); lump.scale.set(1 + 0.1 * press, 0.65 * sq, 0.8 + 0.06 * press);
        block.position.set(0.9, 0.68 + 0.375 * sq, 0); block.scale.set(1 + 0.04 * press, sq, 1 + 0.04 * press);
        const topY = r.table ? 0.68 + 0.75 * sq : 0.68 + 1.1 * sq;
        paddle.position.set(0.9, topY + 0.06 + 0.5 * (1 - press), 0);
        SP.forEach((q, i) => saltB.place(i, 0.9 + q.x * 0.9, topY - 0.01 - (r.table ? 0 : 0.25 * (q.x * q.x + q.z * q.z)), q.z * 0.9, r.table && i < r.salt * 15 ? 0.022 : 1e-4)); saltB.done();
        const wet = clamp((r.moisture - 15.5) / 14.5, 0, 1);
        DR.forEach((q, i) => { q.u = (q.u + dt * (0.5 + 0.6 * wet)) % 1; drip.place(i, q.x, 0.52 - q.u * 0.5, q.z, i < 24 * wet ? 0.04 : 1e-4); }); drip.done();
        lLump.element.style.setProperty('--c', r.table ? COL.butter : COL.makhan);
        lLump.element.innerHTML = r.table ? `<b>Table butter</b> · ${r.fat.toFixed(0)}% fat` : `<b>White makhan</b> · ${r.fat.toFixed(0)}% fat`;
        lCh.element.innerHTML = `${r.table ? 'Buttermilk' : 'Chaas'}: ${r.chaasFat.toFixed(1)}% fat`;
        const k = `${s.kind}|${s.from}|${s.work.toFixed(2)}|${s.wash}|${s.salt.toFixed(1)}`; if (k !== key) { key = k; bd.redraw(); }
      },
      readout: (s) => {
        const r = recipe(s), ok = r.table ? r.okTable : r.okDesi;
        return `<div class="big">${r.table ? 'Table butter' : 'White makhan'}: ${r.fat.toFixed(1)}% fat, ${r.moisture.toFixed(1)}% water</div>
          <div class="row"><span>Curd (protein, lactose, minerals)</span><b>${r.curd.toFixed(1)}%</b></div>
          <div class="row"><span>Water droplets</span><b>about ${r.d.toFixed(0)} µm · ${sci(r.perG)} in a gram</b></div>
          <div class="row"><span>Salt in the butter · in its water</span><b>${r.salt ? `${r.salt.toFixed(1)}% · ${r.brine.toFixed(0)}% brine` : 'none'}</b></div>
          <div class="row"><span>FSSAI ${r.table ? 'table' : 'desi'} butter standard</span><b style="color:${ok ? COL.ok : COL.hot}">${ok ? 'meets it' : 'not yet'}</b></div>
          <div class="row"><span>From 1 kg of ${r.st.name}</span><b>${Math.round(r.butter)} g of ${r.table ? 'butter' : 'makhan'}</b></div>
          <small>${r.table ? 'A dairy churn keeps over 99% of the fat. The colour is partly carotene from the cow’s feed and often added annatto.' : 'A pot and mathani recover roughly two thirds of the fat at 18 °C (FAO figures). The rest stays in the chaas, which is why home chaas tastes rich.'} Water and droplet sizes are a typical-values model.</small>`;
      },
    };
  },
};
