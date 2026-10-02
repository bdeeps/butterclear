// Chapter 3: the churn. A clay matka cut open, a wooden mathani (bilona) held upright by two cord
// loops on a post, and a rope (neti) wound four turns round the rod. 1 scene unit = 10 cm.
// The mechanics are plain geometry: a rope pulled a length L off a rod of radius r turns the rod by
// L ÷ r radians, so a thin rod turns many times for one pull. One stroke = a pull to the right and a
// pull back to the left; the rod swings ±L÷2r and its speed at mid-pull is (L÷2r) × 2π × strokes per
// second (a smooth, sine-shaped pull). Wing tip speed = that × 7.5 cm (the wings span 15 cm).
// Which way it turns: both rope ends leave the rod from the front. Pull the right-hand end and the
// front of the rod moves right: anticlockwise seen from above. Pull the left end and it turns back.
// The liquid: each tracer is dragged towards the rod's speed (more near the wings, less near the wall)
// with a lag of about a third of a second. "Shear" is the difference between rod and liquid speed,
// averaged: it is what stretches, folds and beats the cream. With a one-way motor the liquid catches up
// with the rod and the shear fades; with a reversing rope it never can. (An illustration of the idea,
// not a fluid simulation.)
import { THREE } from '../kit.js';
import {
  COL, TAU, churnSwing, churnPeak, hex, board, panelBg, axes, title, line, dot, legend, note,
  balls, makeMatka, rng, fitNarrow, reelBoards, clamp, fmt, link,
} from '../butter.js';

const VIEW = { pos: [0.1, 4.6, 10.1], target: [0.1, 4.2, 0] };
const PX = 1.7;
const WING = 0.075;       // m, half the span of the wings
const N = 150, NB = 46;

export default {
  id: 'churn',
  short: 'The churn',
  title: 'The mathani: a rope, a rod and a pot',
  subtitle: 'Pull one end of the rope and the rod spins one way. Pull the other and it spins back. That reversal is the whole trick.',
  view: VIEW,
  learn: `<p>The Indian churn has three parts. A pot, the <b>matka</b>, holds dahi or collected malai thinned with water. A wooden rod, the <b>mathani</b> (also called <b>bilona</b> or ravai), stands in it with carved wings at the bottom. A rope, the <b>neti</b>, is wound a few turns round the rod. Loops tied to a post keep the rod upright, and the person churning sits in front with one end of the rope in each hand.</p>
    <p>Pull the right-hand end of the rope and it unwinds from the rod, spinning it one way. Pull the left end and it spins back. The rod is thin, so a short pull gives many turns: a 30 cm pull on a rod 2.8 cm thick turns it more than <b>three full turns</b>. At a steady rhythm the wings reach hundreds of turns a minute.</p>
    <p>Why back and forth, and not round and round? If you stir one way, the liquid soon spins <b>along with</b> the rod, like tea following a spoon. Nothing rubs against anything. Each time the mathani reverses, the wings slam into liquid still moving the other way. That difference in speed, called <b>shear</b>, is what beats the cream, folds in <b>air</b> and knocks fat globules into each other.</p>
    <p>Mixers solve the same problem with baffles or sharp blades, as ${link('mixerclear', 'MixerClear')} shows. A dairy's butter churn is a big drum that tumbles the cream instead. The idea is the same everywhere: keep the liquid from simply going along for the ride.</p>
    <p class="tip"><b>Try it:</b> switch to "One way" and watch the shear in the readout die away as the liquid catches up. Switch back to the rope and it returns. Then try a thinner rod: more turns for the same pull.</p>`,
  terms: [
    { t: 'Mathani', d: 'The wooden churning rod with wings at its lower end. Also called bilona, madhani or ravai in different parts of India.' },
    { t: 'Neti', d: 'The rope wound round the rod. Pulling its two ends in turn spins the rod back and forth.' },
    { t: 'Matka', d: 'The round clay pot that holds the dahi. Clay stays cool, which helps the butter form.' },
    { t: 'Shear', d: 'Layers of liquid sliding past each other at different speeds. It is what stretches and beats the cream.' },
  ],
  defaults: { spm: 50, pull: 0.3, rod: 2.8, mode: 'rope', slow: 0.25 },
  controls: [
    { key: 'mode', type: 'seg', label: 'Drive', options: [{ v: 'rope', label: 'Rope: back and forth' }, { v: 'oneway', label: 'One way' }] },
    { key: 'spm', type: 'range', label: 'Rhythm', min: 20, max: 110, step: 1, ends: ['slow', 'fast'], fmt: (v) => `${v} strokes a minute` },
    { key: 'pull', type: 'range', label: 'Length of each pull', min: 0.1, max: 0.36, step: 0.01, ends: ['10 cm', '36 cm'], fmt: (v) => `${Math.round(v * 100)} cm` },
    { key: 'rod', type: 'range', label: 'Rod thickness', min: 1.6, max: 5, step: 0.1, ends: ['1.6 cm', '5 cm'], fmt: (v, s) => `${v.toFixed(1)} cm · ${(churnSwing(s.pull, v / 200) / TAU).toFixed(1)} turns a pull` },
    { key: 'slow', type: 'seg', label: 'Playback', options: [{ v: 1, label: 'Real speed' }, { v: 0.25, label: '¼ speed' }, { v: 0.1, label: '⅒ speed' }] },
  ],
  quiz: [
    { q: 'You pull 30 cm of rope off a rod 3 cm thick (about 9.4 cm round). About how many turns does the rod make?', options: ['About 1', 'About 3', 'About 10', 'About 30'], answer: 1, why: 'Each turn uses one circumference of rope: 30 cm ÷ 9.4 cm is about 3 turns. A thinner rod would turn even more.' },
    { q: 'Why does the mathani go back and forth instead of round and round?', options: ['The rope can only pull, and every reversal makes the wings hit liquid still moving the other way', 'It is easier to carve', 'To keep the pot from breaking', 'To cool the dahi'], answer: 0, why: 'A rope cannot push, so two hands pull in turn. The bonus: the liquid never gets to spin along with the rod, so the beating stays strong.' },
    { q: 'What does a one-way stirrer need to churn well?', options: ['Nothing extra', 'Baffles, blades or a tumbling drum to stop the liquid simply spinning with it', 'More water', 'A thicker rope'], answer: 1, why: 'If the liquid turns with the stirrer there is no shear. Baffles, sharp blades or a tumbling drum keep liquid and paddle moving at different speeds.' },
  ],
  reel: [
    { ms: 5400, caption: 'The mathani: a rope wound on a rod. Pull right and it spins one way, pull left and it spins back.', set: { mode: 'rope', spm: 50, pull: 0.32, rod: 2.8, slow: 0.4 }, view: { pos: [1.7, 5.0, 8.6], target: [1.7, 4.6, 0] }, spin: 0.05 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);
    const rnd = rng(21);
    const pot = makeMatka(root, { x: PX, level: 1.85 });
    const tr = balls(N, { seg: 8, basic: true }); pot.g.add(tr);
    const T = Array.from({ length: N }, () => { const y = 0.3 + rnd() * 1.4, r = (0.15 + 0.85 * Math.sqrt(rnd())) * (pot.inner(y) - 0.12); return { y, r, a: rnd() * TAU, w: 0, c: clamp(1.05 - r / 1.6, 0.25, 0.95) * (y < 1.1 ? 1 : 0.75), j: rnd() }; });
    const cTr = new THREE.Color(0xffe9a8); for (let i = 0; i < N; i++) tr.tint(i, cTr);
    const bub = balls(NB, { seg: 8, basic: true, opacity: 0.8 }); pot.g.add(bub);
    const B = Array.from({ length: NB }, () => ({ life: 0, a: 0, r: 0, y: 0 }));
    const cB = new THREE.Color(COL.air); for (let i = 0; i < NB; i++) bub.tint(i, cB);

    const lRod = stage.label('Mathani (churning rod)', [PX + 1.5, 6.1, 0], root);
    const lRope = stage.label('Neti (rope), four turns round the rod', [PX - 1.0, 4.85, 0.3], root, 'hot'); lRope.element.style.setProperty('--c', '#e8dcc0');
    const lPost = stage.label('Loops on a post hold the rod upright', [PX + 1.4, 5.3, -1.7], root);
    const lPot = stage.label('Matka: dahi and water', [PX + 2.0, 0.6, 0.6], root);
    const lWing = stage.label('Wings', [PX - 1.9, 0.45, 1.2], root);
    const lR = stage.label('', [0, 0, 0], pot.hand[0], 'hot'), lL = stage.label('', [0, 0, 0], pot.hand[1], 'hot');
    lR.position.y = lL.position.y = -0.5;
    const lDir = stage.label('', [PX + 0.6, 6.75, 0], root, 'hot'); lDir.element.style.setProperty('--c', COL.warm);

    let S = { spm: 50, pull: 0.3, rod: 2.8, mode: 'rope' }, tt = 0, theta = 0, omega = 0, shear = 0, bacc = 0;
    const A = (s) => s.pull / (s.rod / 100);                  // L ÷ 2r, with r = rod ÷ 200 m
    const bd = board(root, 3.7, 2.54, 640, 440, (g, w, h) => {
      panelBg(g, w, h); title(g, 'The rod’s angle', S.mode === 'rope' ? 'in turns, over three strokes' : 'in turns, one-way drive');
      const f = S.spm / 60, a = A(S) / TAU, T3 = 3 / f, top = S.mode === 'rope' ? Math.max(1, Math.ceil(a)) : Math.ceil(churnPeak(S.pull, S.rod / 200, S.spm) / TAU * T3);
      const { X, Y } = axes(g, w, h, { x0: 84, y1: 84, y0: h - 60, xMin: 0, xMax: T3, yMin: S.mode === 'rope' ? -top : 0, yMax: top, xTicks: [0, T3 / 3, (2 * T3) / 3, T3], yTicks: S.mode === 'rope' ? [-top, 0, top] : [0, top / 2, top], xFmt: (v) => v.toFixed(1) + ' s', yFmt: (v) => (v > 0 && S.mode === 'rope' ? '+' : '') + fmt(v, v % 1 ? 1 : 0) });
      const pts = []; for (let i = 0; i <= 120; i++) { const t = (i / 120) * T3; pts.push([t, S.mode === 'rope' ? a * Math.sin(TAU * f * t) : (churnPeak(S.pull, S.rod / 200, S.spm) / TAU) * t]); }
      line(g, pts, X, Y, COL.warm, 5);
      const tn = tt % T3; dot(g, X(tn), Y(S.mode === 'rope' ? a * Math.sin(TAU * f * tn) : (churnPeak(S.pull, S.rod / 200, S.spm) / TAU) * tn), COL.warm);
      note(g, S.mode === 'rope' ? 'Rising: right hand pulls. Falling: left hand pulls.' : 'A motor at the rope’s top speed, never reversing.', 20, 62);
    }, [-3.45, 3.75, 0]);
    const bd2 = board(root, 3.7, 1.57, 640, 272, (g, w, h) => {
      panelBg(g, w, h); title(g, 'Shear: rod against liquid');
      const mx = 1;
      g.fillStyle = 'rgba(255,255,255,.1)'; g.fillRect(20, 70, w - 40, 54);
      g.fillStyle = shear > 0.25 ? COL.ok : COL.hot; g.fillRect(20, 70, (w - 40) * clamp(shear / mx, 0, 1), 54);
      note(g, 'liquid going along with the rod', 20, 152); note(g, 'strong beating', w - 135, 152);
      note(g, S.mode === 'rope' ? 'Every reversal throws the wings against liquid still going the other way.' : 'The liquid has caught up with the rod. Little rubs against anything.', 20, 200, COL.text);
      note(g, 'Relative scale: an illustration, not a measurement.', 20, 240, 'rgba(255,255,255,.55)', '15px sans-serif');
    }, [-3.45, 1.5, 0]);

    let fr = 0;
    return {
      update(dt, s) {
        dt = Math.max(0, Math.min(dt, 0.05)); S = s;
        fitNarrow(stage, [lPost, lWing, lPot, lRope, lRod, lDir]); reelBoards([bd, bd2], PX, stage, VIEW, 8.4, 2.9, 0.95);
        const sd = dt * s.slow; tt += sd;
        const f = s.spm / 60, amp = A(s), wPk = churnPeak(s.pull, s.rod / 200, s.spm);
        pot.setRod(s.rod / 2.8);
        if (s.mode === 'rope') { theta = amp * Math.sin(TAU * f * tt); omega = wPk * Math.cos(TAU * f * tt); pot.showHands(true); pot.pose(theta, 5 * s.pull * Math.sin(TAU * f * tt)); }
        else { omega = wPk; theta += omega * sd; pot.showHands(false); pot.pose(theta, 0); }
        lR.visible = lL.visible = s.mode === 'rope';
        const pr = omega > 0;
        lR.element.innerHTML = pr ? '<b>Right hand pulls</b>' : 'Right hand gives rope'; lL.element.innerHTML = pr ? 'Left hand gives rope' : '<b>Left hand pulls</b>';
        lR.element.style.setProperty('--c', pr ? COL.warm : '#9aa6b8'); lL.element.style.setProperty('--c', pr ? '#9aa6b8' : COL.warm);
        lDir.element.innerHTML = s.mode === 'rope' ? (pr ? '↺ anticlockwise from above' : '↻ clockwise from above') : '↺ one way only';
        // the liquid: dragged towards the rod's speed with a lag
        let sh = 0;
        T.forEach((p, i) => {
          p.w += (p.c * omega - p.w) * (1 - Math.exp(-sd / 0.35));
          p.a += p.w * sd;
          const slip = Math.abs(omega - p.w / p.c) / Math.max(1, wPk); sh += slip;
          const jit = 0.1 * clamp(slip, 0, 1.5);
          tr.place(i, (p.r + jit * Math.sin(tt * 31 * p.j + i)) * Math.cos(p.a), p.y + jit * Math.sin(tt * 27 * p.j + i * 2), (p.r + jit * Math.sin(tt * 31 * p.j + i)) * Math.sin(p.a), 0.035);
        });
        tr.done();
        shear += (clamp(sh / N, 0, 1.2) - shear) * (1 - Math.exp(-sd / 0.4));
        // air folded in at the surface, more when the shear is strong
        bacc += sd * 40 * clamp(shear, 0, 1);
        B.forEach((b, i) => {
          if (b.life <= 0 && bacc >= 1) { bacc -= 1; b.life = 0.5 + 0.6 * rnd(); b.a = rnd() * TAU; b.r = 0.25 + 0.9 * rnd(); b.y = 1.82; }
          if (b.life > 0) { b.life -= sd; b.y -= sd * 0.7; b.a += omega * 0.3 * sd; }
          bub.place(i, b.r * Math.cos(b.a), b.y, b.r * Math.sin(b.a), b.life > 0 ? 0.05 + 0.04 * b.life : 0.0001);
        });
        if (bacc > 10) bacc = 10;
        bub.done();
        if (fr++ % 3 === 0) { bd.redraw(); bd2.redraw(); }
      },
      readout: (s) => {
        const r = s.rod / 200, turns = churnSwing(s.pull, r) / TAU, wPk = churnPeak(s.pull, r, s.spm);
        return `<div class="big">${turns.toFixed(1)} turns for every ${Math.round(s.pull * 100)} cm pull</div>
          <div class="row"><span>Rod: ${s.rod.toFixed(1)} cm thick</span><b>${(Math.PI * s.rod).toFixed(1)} cm of rope per turn</b></div>
          <div class="row"><span>Top speed, mid-pull</span><b>${fmt((wPk * 60) / TAU, 0)} rpm</b></div>
          <div class="row"><span>Wing tips (15 cm span)</span><b>${(wPk * WING).toFixed(1)} m/s</b></div>
          <div class="row"><span>Reversals</span><b>${s.mode === 'rope' ? s.spm * 2 + ' a minute' : 'none'}</b></div>
          <div class="row"><span>Shear between rod and liquid</span><b style="color:${shear > 0.25 ? COL.ok : COL.hot}">${shear > 0.5 ? 'strong' : shear > 0.25 ? 'medium' : 'weak'}</b></div>
          <small>${s.mode === 'rope' ? 'The rod turns as far as the rope lets it, then the other hand takes over. The liquid never settles into a steady spin.' : 'One way only: the liquid spins up with the rod and the beating fades. A real motor churn adds baffles or blades to stop this.'}</small>`;
      },
    };
  },
};
