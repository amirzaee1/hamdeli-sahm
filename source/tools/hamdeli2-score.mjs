// Hamdeli lead film v2 (curiosity cut) · original 80 s score + sound design on the narration's own times
// (src/hamdeli/vo2.json): a cold mystery drone with a four-note riddle motif and flash-forward hits → night piano →
// one held wrong note on «درست نیست» → a heartbeat that speeds up through the discovery → total silence + tinnitus →
// deep hit on «سهم تو کجاست؟» → warm opening (F major, bells, chain chimes) → the riddle motif answered in major →
// an unresolved sus chord at the end (the loop stays open). Heartbeat times → src/hamdeli/beats2.json (phone vibration).
// Mix: narration + score (ducked) + effects, two-pass loudness to -14 LUFS → public/hamdeli2/mix.wav (exactly 80 s).
import fs from "node:fs";
import { execFileSync, spawnSync } from "node:child_process";
import { SR, bell, buf, dec, env, hz, lowpass, highpass, mix, norm, nz, osc, reseed, writeWav } from "./lib/dsp.mjs";

const vo = JSON.parse(fs.readFileSync("src/hamdeli/vo2.json", "utf8"));
const S = vo.sections, T = vo.total;
const K = (s, k) => S[s].keys[k];
reseed(2347);
const out = buf(T + 1);
const sm = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
const ramp = (t, a, b) => sm((t - a) / (b - a));
const sat = (b, k) => { const d = Math.tanh(k); for (let i = 0; i < b.length; i++) b[i] = Math.tanh(b[i] * k) / d; return b; };
const lp = (b, f0, f1) => lowpass(b, (i) => f0 + (f1 - f0) * (i / b.length)); // sweeping low-pass

const pad = (notes, a, b, g, cut = 1400, atk = 1.2) => {
  const len = b - a + 1.6, p = buf(len);
  notes.forEach((n) => [1, 1.004, 0.996].forEach((d) => mix(p, osc(len, hz(n) * d, "tri"), 0, 0.03)));
  env(p, (_, s) => Math.min(1, s / atk) * Math.min(1, (len - s) / 1.4));
  mix(out, lowpass(p, cut), a, g);
};
const piano = (n, at, g = 0.09, tau = 0.6) => mix(out, lowpass(bell(hz(n), 1.8, tau), 3200), at, g);

// ---------- 0 · cold open: drone, breath, riddle motif, flash-forward hits ----------
{
  const a = 0, b = S.s1.start + 0.2, len = b - a;
  const dr = buf(len);
  mix(dr, osc(len, hz(26)), 0, 0.5); // D1
  mix(dr, osc(len, (t) => hz(38) * (1 + 0.002 * Math.sin(t * 0.7))), 0, 0.25);
  mix(dr, lowpass(highpass(nz(len), 200), 900), 0, 0.05); // breath
  mix(dr, osc(len, hz(50), "tri"), 0, 0.09); // D3 (phone-speaker range)
  mix(dr, osc(len, hz(57), "tri"), 0, 0.05); // A3
  env(dr, (_, s) => Math.min(1, s / 1.5) * Math.min(1, (len - s) / 0.8) * (0.8 + 0.2 * Math.sin(s * 1.3)));
  mix(out, dr, a, 0.55);
  pad([50, 57, 64], 0.2, S.c0.end, 0.55, 900, 2.0); // Dm(add9) cold, no third
  // the riddle: four notes that do not resolve (D5 A4 F5 E5)
  [["thing", 74], ["eyes", 69], ["touch", 77], ["never", 76]].forEach(([k, n]) => piano(n, K("c0", k), 0.11, 0.9));
  // reverse swell into the message
  const sw = 1.6, r = env(lp(nz(sw), 300, 4000), (x) => x * x * x);
  mix(out, r, S.s1.start - sw + 0.05, 0.1);
}

// ---------- 1 · the message: night piano, then one wrong note ----------
const B = 60 / 72;
{
  const but = K("s1", "but");
  const ch = [[50, 57, 62, 65, 69], [46, 53, 58, 62, 65]];
  for (let t = S.s1.start + 0.3, i = 0; t < but - 0.2; t += B / 2, i++) {
    if (i % 2 === 1 && i % 4 !== 3) continue;
    const c = ch[Math.floor(i / 8) % 2];
    piano(c[[2, 3, 4, 3, 1, 3, 4, 2][i % 8]] + 12, t, 0.07);
  }
  pad([50, 57, 62, 65], S.s1.start, but, 0.7);
  // the held wrong note: D4 against Eb4, slow tremolo, until the discovery starts
  const len = S.s2.start - but + 0.6, w = buf(len);
  mix(w, osc(len, hz(62), "tri"), 0, 0.05);
  mix(w, osc(len, hz(63), "tri"), 0, 0.04);
  env(w, (_, s) => Math.min(1, s / 0.6) * Math.min(1, (len - s) / 0.5) * (0.7 + 0.3 * Math.sin(s * 9)));
  mix(out, lowpass(w, 1800), but, 1);
}

// ---------- heartbeat (s1 end → the silence), plus soft ones at the end ----------
const beats = [];
const heart = (at, g) => {
  const lub = sat(dec(osc(0.4, (x) => 48 + 50 * Math.exp(-x * 30)), 0.12), 3);
  const dub = sat(dec(osc(0.3, (x) => 56 + 40 * Math.exp(-x * 34)), 0.08), 3);
  mix(lub, dec(osc(0.2, (x) => 150 + 90 * Math.exp(-x * 40)), 0.05), 0, 0.35);
  mix(lub, dec(lowpass(highpass(nz(0.05), 300), 1400), 0.012), 0, 0.25);
  mix(dub, dec(osc(0.15, (x) => 135 + 70 * Math.exp(-x * 45)), 0.04), 0, 0.25);
  mix(out, lub, at, g);
  mix(out, dub, at + 0.17, g * 0.65);
  beats.push(+at.toFixed(3));
};
{
  // slow beats under the wrong note
  for (let t = K("s1", "but") + 0.2; t < S.s2.start - 0.2; t += 60 / 62) heart(t, 0.22);
  // accelerating through the discovery: 70 → 112 BPM, then two beats in the silence, then nothing
  const a = S.s2.start, b = S.sq.start - 0.35;
  let t = a;
  while (t < b) {
    const p = (t - a) / (b - a);
    heart(t, 0.22 + 0.33 * p);
    t += 60 / (70 + 42 * p * p);
  }
  // the end: three calm beats under the last words, one last beat after them
  for (let t2 = K("s5", "see"); t2 < S.s5.end; t2 += 60 / 58) heart(t2, 0.16);
  heart(T - 0.55, 0.26);
}

// ---------- 2 · the discovery: bass ostinato, tension pad, riser, cut ----------
{
  const a = S.s2.start, cut = K("s2", "thatOne") - 0.1;
  pad([43, 50, 55, 58], a, K("s2", "sold"), 0.6, 1200); // Gm
  pad([46, 53, 58, 62], K("s2", "sold"), K("s2", "three"), 0.6, 1500); // Bb
  pad([45, 52, 57, 61], K("s2", "three"), cut, 0.75, 1900); // A (dominant, wants to resolve)
  for (let t = a; t < cut; t += B) {
    const p = osc(0.5, hz(38));
    mix(out, dec(p, 0.22), t, 0.12 + 0.1 * ramp(t, a, cut));
  }
  // clock ticks at «سه نفر»
  for (let i = 0; i < 6; i++) mix(out, dec(highpass(nz(0.03), 3500), 0.01), K("s2", "three") + i * 0.3, 0.06);
  // riser from «و یه نفر» to the silence
  const r0 = K("s2", "one"), rl = S.s2.end - r0 + 0.3;
  mix(out, env(lp(nz(rl), 200, 5000), (x) => x * x), r0, 0.1);
  mix(out, env(osc(rl, (t) => hz(50) * (1 + t / rl)), (x) => x * x * 0.6), r0, 0.06);
  // «تو بودی»: low thud
  mix(out, sat(dec(osc(1.2, (x) => 40 + 30 * Math.exp(-x * 8)), 0.4), 2.5), K("s2", "you"), 0.5);
  mix(out, dec(osc(0.6, (x) => 120 + 60 * Math.exp(-x * 20)), 0.18), K("s2", "you"), 0.2);
}

// ---------- the silence + tinnitus, then the hit on «سهم تو کجاست؟» ----------
{
  const a = S.s2.end, b = S.sq.start;
  const len = b - a + 0.05, ring = osc(len, 6800);
  env(ring, (x) => sm(x) * 0.9);
  mix(out, ring, a, 0.012);
  const s = S.sq.start - 0.02;
  const hit = buf(3.6);
  mix(hit, dec(osc(3.6, (x) => 34 + 80 * Math.exp(-x * 7)), 1.3), 0, 0.95);
  mix(hit, dec(lowpass(nz(0.7), 800), 0.3), 0, 0.4);
  mix(hit, dec(highpass(nz(1.5), 4000), 0.5), 0, 0.05); // metallic air
  sat(hit, 2.4);
  mix(hit, dec(osc(1.2, (x) => 110 + 90 * Math.exp(-x * 14)), 0.35), 0, 0.45);
  mix(hit, dec(lowpass(highpass(nz(0.25), 500), 3000), 0.06), 0, 0.3);
  mix(out, hit, s, 0.85);
  mix(out, env(osc(3.4, hz(26)), (_, t) => Math.min(1, t / 0.05) * Math.exp(-t / 1.6)), s, 0.22);
}

// ---------- 3 · the answer: the music opens ----------
{
  const a = S.s3.start - 0.3;
  pad([41, 48, 53, 57, 60], a, K("s3", "exp"), 0.75, 2200);
  pad([48, 55, 60, 64], K("s3", "exp"), K("s3", "partner"), 0.7, 2400);
  pad([46, 53, 58, 62, 65], K("s3", "partner"), K("s3", "rule") + 1.5, 0.7, 2400);
  pad([41, 48, 53, 57], K("s3", "rule") + 1.5, S.s3.end + 0.3, 0.6, 1800);
  for (let t = a + 0.4, i = 0; t < S.s3.end; t += B / 2, i++) {
    const c = t < K("s3", "exp") ? [53, 57, 60, 65, 69] : t < K("s3", "partner") ? [55, 60, 64, 67, 72] : [53, 58, 62, 65, 70];
    piano(c[[1, 2, 3, 2, 0, 2, 3, 4][i % 8]] + 12, t, 0.055, 0.5);
  }
  const pent = [65, 67, 69, 72, 74, 77];
  [2, 3, 4, 3, 5, 4].forEach((ix, j) => mix(out, bell(hz(pent[ix] + 12), 1.6, 0.7), K("s3", "econ") + j * B * 0.5, 0.045));
  for (let t = K("s3", "exp"); t < S.s3.end - 0.5; t += B) mix(out, dec(osc(0.35, (x) => 52 + 60 * Math.exp(-x * 34)), 0.14), t, 0.08);
}

// ---------- 4 · the riddle answered in major ----------
{
  pad([41, 48, 55, 57, 64], S.s4.start - 0.2, S.s4.end + 0.3, 0.6, 2000); // Fmaj9
  [["remember", 77], ["everyday", 72], ["product", 81], ["trustP", 79]].forEach(([k, n]) => mix(out, bell(hz(n), 2.2, 1.0), K("s4", k), 0.05));
  const a = K("s4", "product"), len = S.s4.end - a + 0.6;
  mix(out, lowpass(env(highpass(nz(len), 6000), (x) => Math.sin(Math.PI * x) * 0.5), 11000), a, 0.04);
}

// ---------- 5 · warm, then left open ----------
{
  pad([46, 53, 58, 62, 65], S.s5.start - 0.2, K("s5", "conv"), 0.65, 2000);
  pad([41, 48, 53, 57, 60], K("s5", "conv"), K("s5", "share"), 0.65, 2200);
  // the open ending: Csus4 that never resolves to C
  const a = K("s5", "share") - 0.2, len = T - a + 0.5, p = buf(len);
  [48, 53, 55, 60, 65].forEach((n) => [1, 1.003, 0.997].forEach((d) => mix(p, osc(len, hz(n) * d, "tri"), 0, 0.03)));
  env(p, (_, s) => Math.min(1, s / 1.0) * Math.max(0, Math.min(1, (len - 0.5 - s) / 1.6)));
  mix(out, lowpass(p, 2400), a, 0.75);
  [1, 2, 3, 4, 3].forEach((ix, j) => mix(out, bell(hz([65, 67, 69, 72, 74][ix] + 12), 1.6, 0.7), S.s5.start + 1.2 + j * B, 0.04));
}
env(out, (_, s) => Math.min(1, s / 0.4) * (s > T - 1.2 ? Math.max(0, (T - s) / 1.2) : 1));
fs.mkdirSync("public/hamdeli2", { recursive: true });
writeWav("public/hamdeli2/score.wav", norm(lowpass(out, 10000), 0.72));
fs.writeFileSync("src/hamdeli/beats2.json", JSON.stringify(beats));

// ---------- mix ----------
const L = (f) => `public/sfx-lib/${f}.wav`;
// the phone buzz is synthesized (two short pulses)
{
  const b = buf(0.9);
  [0, 0.45].forEach((at) => mix(b, env(osc(0.32, 155, "sq"), (x) => Math.sin(Math.PI * x) * (0.6 + 0.4 * Math.sin(x * 60))), at, 0.5));
  writeWav("public/hamdeli2/buzz.wav", lowpass(b, 1200));
}
const flash = ["thing", "eyes", "touch", "never"].map((k) => K("c0", k));
const fx = [
  ...flash.map((t, i) => [L(i % 2 ? "whoosh" : "glitch"), t - 0.08, 0.25]),
  ["public/hamdeli2/buzz.wav", K("s1", "vibrate") - 0.3, 0.7],
  [L("notif"), K("s1", "msg") - 0.05, 0.45],
  [L("pop"), K("s1", "quote") - 0.1, 0.3],
  [L("whoosh"), S.s2.start - 0.15, 0.25],
  [L("chime"), K("s3", "econ") - 0.05, 0.35],
  [L("node1"), K("s3", "exp"), 0.3],
  [L("node2"), K("s3", "trust2"), 0.3],
  [L("node3"), K("s3", "choice"), 0.3],
  [L("lock"), K("s3", "partner"), 0.35],
  [L("sweep"), S.s4.start - 0.1, 0.22],
  [L("chime"), K("s4", "product") + 0.1, 0.25],
];
const files = ["public/hamdeli2/vo/film-vo.wav", "public/hamdeli2/score.wav", ...new Set(fx.map((f) => f[0]))];
const ufx = files.slice(2);
const uses = ufx.map((f) => fx.filter((x) => x[0] === f).length);
const parts = [
  `[0:a]aformat=sample_rates=48000:channel_layouts=stereo,asplit=2[vo][sc]`,
  `[1:a]aformat=sample_rates=48000:channel_layouts=stereo,volume=0.8[mu]`,
  `[mu][sc]sidechaincompress=threshold=0.05:ratio=2:attack=80:release=1400:knee=6:makeup=1[mud]`,
];
ufx.forEach((_, i) => parts.push(`[${i + 2}:a]aformat=sample_rates=48000:channel_layouts=stereo,asplit=${uses[i]}${Array.from({ length: uses[i] }, (_, j) => `[u${i}_${j}]`).join("")}`));
const taken = ufx.map(() => 0);
fx.forEach(([f, at, v], i) => {
  const u = ufx.indexOf(f), j = taken[u]++;
  const ms = Math.max(0, Math.round(at * 1000));
  parts.push(`[u${u}_${j}]volume=${(v * 0.5).toFixed(3)},adelay=${ms}|${ms}[f${i}]`);
});
parts.push(`${fx.map((_, i) => `[f${i}]`).join("")}amix=inputs=${fx.length}:normalize=0[fx]`);
parts.push(`[vo][mud][fx]amix=inputs=3:normalize=0,atrim=0:${T},apad=whole_dur=${T},alimiter=limit=0.95[out]`);
const graph = "public/hamdeli2/mix.graph.txt";
fs.writeFileSync(graph, parts.join(";\n"));
execFileSync("ffmpeg", ["-nostdin", "-v", "error", "-y", ...files.flatMap((f) => ["-i", f]), "-/filter_complex", graph, "-map", "[out]", "-ar", "48000", "public/hamdeli2/mix-raw.wav"]);
const m = spawnSync("ffmpeg", ["-nostdin", "-i", "public/hamdeli2/mix-raw.wav", "-af", "loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-"]).stderr.toString();
const j = JSON.parse(m.slice(m.lastIndexOf("{"), m.lastIndexOf("}") + 1));
execFileSync("ffmpeg", ["-nostdin", "-v", "error", "-y", "-i", "public/hamdeli2/mix-raw.wav", "-af", `loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=${j.input_i}:measured_TP=${j.input_tp}:measured_LRA=${j.input_lra}:measured_thresh=${j.input_thresh}:offset=${j.target_offset}:linear=true,atrim=0:${T}`, "-ar", "48000", "public/hamdeli2/mix.wav"]);
fs.rmSync(graph, { force: true });
console.log(`score ${T}s · ${beats.length} heartbeats · ${fx.length} effects · mix in ${j.input_i} LUFS → -14 (SR ${SR})`);
