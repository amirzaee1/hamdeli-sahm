// Hamdeli lead film v2 (curiosity cut) · narration locked to exactly 80.0 s: cold open + five sections
// (take b, randy gage, eleven_v4), one tempo for all, dramatic fixed pauses (a held silence before «سهم تو کجاست؟»);
// key-word times from the connector alignment, scaled. → public/hamdeli2/vo/film-vo.wav + src/hamdeli/vo2.json
import fs from "node:fs";
import { execFileSync, spawnSync } from "node:child_process";
// every section at the same loudness (the intimate takes came out quieter)
const lufs = (file) => {
  const log = spawnSync("ffmpeg", ["-nostdin", "-i", file, "-af", "ebur128", "-f", "null", "-"]).stderr.toString();
  const sum = log.slice(log.lastIndexOf("Summary:"));
  const m = sum.match(/I:\s+(-?[\d.]+) LUFS/);
  return m ? +m[1] : -20;
};
const level = (file, target) => { const g = target - lufs(file); const tmp = file.replace(/\.wav$/, ".tmp.wav"); execFileSync("ffmpeg", ["-nostdin", "-v", "error", "-y", "-i", file, "-af", `volume=${g.toFixed(2)}dB,alimiter=limit=0.89:level=false`, "-ar", "48000", "-ac", "1", tmp]); fs.renameSync(tmp, file); return g; };
const V = "videos/04-hamdeli/vo2", OUT = "public/hamdeli2/vo";
const TOTAL = 80;
// [id, take, a, b, keys (s in the take), pause after]
const S = [
  { id: "c0", take: "c0b", a: 0, b: 10.56, gap: 0.6, keys: { thing: 0.2, eyes: 2.72, touch: 4.64, never: 6.24, notSeen: 7.36, end: 8.48, see: 9.72 } },
  { id: "s1", take: "s1b", a: 0, b: 14.56, gap: 0.5, keys: { clock: 0, phone: 2.92, vibrate: 3.307, msg: 4.2, quote: 5.7, great: 8.16, thanks: 9.08, smile: 10.32, but: 11.68, thisMsg: 12.48, wrong: 13.56 } },
  { id: "s2", take: "s2b", a: 0.08, b: 18.88, gap: 1.3, keys: { look: 0.08, notSeller: 2.0, butBuy: 3.76, sold: 7.08, profit: 8.453, happy: 9.947, three: 11.36, one: 13.547, empty: 14.587, thatOne: 16.311, you: 17.76 } },
  { id: "sq", take: "s2b", a: 19.36, b: 20.8, gap: 1.0, keys: { share: 19.36 } },
  { id: "s3", take: "s3b", a: 0, b: 20.56, gap: 0.45, keys: { answer: 0, closer: 1.6, near: 3.88, econ: 4.96, exp: 7.32, trust: 8.16, trust2: 9.52, choice: 10.4, choice2: 11.36, partner: 11.92, rule: 13.08, share: 15.36, noPromise: 17.52, noGuarantee: 19.08 } },
  { id: "s4", take: "s4b", a: 0.153, b: 8.88, gap: 0.45, keys: { remember: 0.153, everyday: 1.84, product: 3.84, bag: 4.8, trustP: 6.0, people: 7.12 } },
  { id: "s5", take: "s5nb", a: 0, b: 9.68, gap: 0, keys: { rest: 0, film: 1.44, job: 2.64, work: 3.76, life: 4.24, conv: 5.76, see: 7.52, share: 8.48 } }, // «لازم نیست چیزی رو توی کار یا زندگیت عوض کنی…» (works for homemakers too)
];
const HEAD = 0.25, TAIL = 0.55;
const speech = S.reduce((s, x) => s + (x.b - x.a), 0);
const fixed = HEAD + TAIL + S.reduce((s, x) => s + x.gap, 0);
const k = speech / (TOTAL - fixed);
if (k > 1.15) throw new Error("tempo too high " + k);
fs.mkdirSync(OUT, { recursive: true });
let t = HEAD;
const parts = [];
const out = { tempo: +k.toFixed(4), total: TOTAL, sections: {} };
for (const x of S) {
  const len = (x.b - x.a) / k;
  const file = `${OUT}/${x.id}.wav`;
  execFileSync("ffmpeg", ["-nostdin", "-v", "error", "-y", "-ss", String(Math.max(0, x.a - 0.03)), "-to", String(x.b + 0.12), "-i", `${V}/${x.take}.mp3`, "-af", `rubberband=tempo=${k.toFixed(4)}:transients=smooth:detector=soft:pitchq=quality:formant=preserved,adeclick=w=55:o=75,afade=t=in:d=0.01,afade=t=out:st=${Math.max(0, len - 0.02).toFixed(3)}:d=0.1`, "-ar", "48000", "-ac", "1", file]);
  out.sections[x.id] = { start: +t.toFixed(3), end: +(t + len).toFixed(3), keys: Object.fromEntries(Object.entries(x.keys).map(([n, s]) => [n, +(t + (s - x.a) / k).toFixed(3)])) };
  level(file, -20);
  parts.push([file, t]);
  t += len + x.gap;
}
const inputs = parts.flatMap(([f]) => ["-i", f]);
const graph = parts.map(([, at], i) => `[${i}:a]adelay=${Math.round(at * 1000)}|${Math.round(at * 1000)}[d${i}]`).join(";") + ";" + parts.map((_, i) => `[d${i}]`).join("") + `amix=inputs=${parts.length}:normalize=0,apad=whole_dur=${TOTAL},atrim=0:${TOTAL}[o]`;
execFileSync("ffmpeg", ["-nostdin", "-v", "error", "-y", ...inputs, "-filter_complex", graph, "-map", "[o]", "-ar", "48000", "-ac", "1", `${OUT}/film-vo.wav`]);
// separate lines for the page (slider reply, invitation, form); the thank-you line is the same text as v1
const trim = "silenceremove=start_periods=1:start_threshold=-45dB,rubberband=tempo=1.04:transients=smooth:detector=soft:pitchq=quality:formant=preserved,adeclick=w=55:o=75,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse,apad=pad_dur=0.15";
for (const [n, src] of [["sl", "slb"], ["cta", "ctab"], ["form", "formb"]]) execFileSync("ffmpeg", ["-nostdin", "-v", "error", "-y", "-i", `${V}/${src}.mp3`, "-af", trim, "-ar", "48000", "-ac", "1", `${OUT}/${n}.wav`]);
fs.copyFileSync("public/hamdeli/vo/ok.wav", `${OUT}/ok.wav`);
// page voice lines: as loud as the film (-14 LUFS) so nothing drops when the film stops
for (const n of ["sl", "cta", "form", "ok"]) level(`${OUT}/${n}.wav`, -14.5);
fs.writeFileSync("src/hamdeli/vo2.json", JSON.stringify(out, null, 1));
console.log(`tempo ${k.toFixed(4)} · ` + Object.entries(out.sections).map(([n, s]) => `${n} ${s.start}–${s.end}`).join(" | "));
