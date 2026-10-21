// Hamdeli lead film v2 · "curiosity cut" · 80 s vertical.
// A riddle opens the film (a blurred object, four flash-forwards), the message hides "something wrong",
// a heartbeat drives the frame into total silence, «سهم تو کجاست؟» lands, the answer opens up, and the riddle
// is paid off with a rack focus on the product. Every sentence has its own motion; transitions vary
// (whip, zoom-through, glitch, VHS rewind). All times come from src/hamdeli/vo2.json, heartbeats from beats2.json.
import React from "react";
import {
  AbsoluteFill, Audio, Easing, Freeze, OffthreadVideo, Sequence, continueRender, delayRender,
  interpolate, random, staticFile, useCurrentFrame,
} from "remotion";
import VO from "./vo2.json";
import BEATS from "./beats2.json";

export const H2_FPS = 30;
export const H2_TOTAL = VO.total;
const FPS = H2_FPS, T = H2_TOTAL;
type Sec = keyof typeof VO.sections;
const S = VO.sections;
const K = (s: Sec, k: string) => (S[s].keys as Record<string, number>)[k];

const C = { night: "#0B1F22", cream: "#E9D3A8", gold: "#F2C46D", text: "#FFF7EA", dim: "rgba(255,247,234,0.74)", red: "#FF7A6B", ok: "#7BD88F" };
const BLACK = "Vazirmatn-Black", BOLD = "Vazirmatn-Bold", REG = "Vazirmatn-Regular", HEAD = "Lalezar";
const fontHandle = delayRender("hamdeli2 fonts");
Promise.all(
  [[BLACK, "Vazirmatn-Black"], [BOLD, "Vazirmatn-Bold"], [REG, "Vazirmatn-Regular"], [HEAD, "Lalezar-Regular"]].map(([fam, file]) =>
    new FontFace(fam, `url('${staticFile(`fonts/${file}.ttf`)}') format('truetype')`).load().then((f) => document.fonts.add(f)),
  ),
).then(() => continueRender(fontHandle)).catch(() => continueRender(fontHandle));

const out3 = Easing.out(Easing.cubic);
const ease = Easing.bezier(0.22, 1, 0.36, 1);
const back = Easing.out(Easing.back(1.7));
const cl = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ip = (t: number, a: number, b: number, from = 0, to = 1, e = ease) => interpolate(t, [a, b], [from, to], { ...cl, easing: e });
const fa = (s: string) => s.replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[+d]);

// heartbeat envelope (lub + dub)
const pulseAt = (t: number) => {
  let p = 0;
  for (const b of BEATS as number[]) {
    if (t >= b && t < b + 0.6) p += Math.exp(-(t - b) * 9);
    if (t >= b + 0.17 && t < b + 0.7) p += 0.6 * Math.exp(-(t - b - 0.17) * 11);
  }
  return Math.min(1.2, p);
};

// ---------------- icons ----------------
const Icon: React.FC<{ name: string; s?: number; c?: string }> = ({ name, s = 56, c = C.gold }) => {
  const p: Record<string, React.ReactNode> = {
    eye: <><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" fill="none" stroke={c} strokeWidth="1.8" /><circle cx="12" cy="12" r="3.2" fill={c} /></>,
    bag: <><path d="M5 8h14l-1.2 12H6.2L5 8z" fill="none" stroke={c} strokeWidth="1.8" strokeLinejoin="round" /><path d="M9 8V6.5a3 3 0 016 0V8" fill="none" stroke={c} strokeWidth="1.8" /></>,
    store: <><path d="M3 9l1.6-5h14.8L21 9M4 9v11h16V9M3 9h18" fill="none" stroke={c} strokeWidth="1.8" strokeLinejoin="round" /><path d="M10 20v-6h4v6" fill="none" stroke={c} strokeWidth="1.8" /></>,
    smile: <><circle cx="12" cy="12" r="9" fill="none" stroke={c} strokeWidth="1.8" /><path d="M8 14.5c1 1.4 2.4 2 4 2s3-.6 4-2" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" /><circle cx="9" cy="10" r="1.2" fill={c} /><circle cx="15" cy="10" r="1.2" fill={c} /></>,
    star: <path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3z" fill="none" stroke={c} strokeWidth="1.8" strokeLinejoin="round" />,
    heart: <path d="M12 20s-7-4.4-9-8.8C1.6 8 3.6 5 6.8 5c1.9 0 3.4 1.1 4.2 2.4l1 1.2 1-1.2C13.8 6.1 15.3 5 17.2 5c3.2 0 5.2 3 3.8 6.2C19 15.6 12 20 12 20z" fill="none" stroke={c} strokeWidth="1.8" strokeLinejoin="round" />,
    check: <><circle cx="12" cy="12" r="9" fill="none" stroke={c} strokeWidth="1.8" /><path d="M7.5 12.5l3 3 6-6.5" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></>,
    link: <><path d="M10 14a4 4 0 005.6 0l3-3a4 4 0 00-5.6-5.6l-1 1" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" /><path d="M14 10a4 4 0 00-5.6 0l-3 3a4 4 0 005.6 5.6l1-1" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" /></>,
    chat: <path d="M4 5h16v11H9l-5 4V5z" fill="none" stroke={c} strokeWidth="1.8" strokeLinejoin="round" />,
    film: <><rect x="3" y="5" width="18" height="14" rx="2" fill="none" stroke={c} strokeWidth="1.8" /><path d="M7 5v14M17 5v14M3 9h4M3 15h4M17 9h4M17 15h4" stroke={c} strokeWidth="1.5" /></>,
    user: <><circle cx="12" cy="8" r="4" fill="none" stroke={c} strokeWidth="1.8" /><path d="M4 21c1.2-4 4.2-6 8-6s6.8 2 8 6" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" /></>,
    factory: <><path d="M3 20V10l5 3V10l5 3V7l8 4v9H3z" fill="none" stroke={c} strokeWidth="1.8" strokeLinejoin="round" /><path d="M7 17h2M11 17h2M15 17h2" stroke={c} strokeWidth="1.8" strokeLinecap="round" /></>,
    home: <><path d="M3 11l9-7 9 7" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /><path d="M5.5 9.5V20h13V9.5" fill="none" stroke={c} strokeWidth="1.8" strokeLinejoin="round" /><path d="M10 20v-5h4v5" fill="none" stroke={c} strokeWidth="1.8" /></>,
    briefcase: <><rect x="3" y="7" width="18" height="13" rx="2" fill="none" stroke={c} strokeWidth="1.8" /><path d="M9 7V5h6v2" fill="none" stroke={c} strokeWidth="1.8" /></>,
  };
  return <svg width={s} height={s} viewBox="0 0 24 24" style={{ flex: "none", overflow: "visible" }}>{p[name]}</svg>;
};

// ---------------- shots ----------------
type In = "cut" | "fade" | "whip" | "zoom" | "glitch";
type Shot = { src: string; at: number; from: number; rate: number; zoom?: [number, number]; pos?: string; inT?: In; look?: (t: number) => string };
const SHOT2_AT = K("s1", "quote") + 0.8, SHOT5_AT = K("s2", "sold") - 0.48;
const SHOTS: Shot[] = [
  // 00 riddle: the product, out of focus, never shown sharp until the payoff
  { src: "shot6-product", at: 0, from: 0.5, rate: 0.5, zoom: [1.35, 1.5], pos: "50% 40%", inT: "cut",
    look: (t) => `blur(${interpolate(t, [0, 10], [26, 18], cl)}px) brightness(0.55) saturate(0.6)` },
  // 01 message
  { src: "shot1-phone", at: S.s1.start - 0.05, from: 0.2, rate: 0.9, zoom: [1.06, 1.16], inT: "zoom" },
  { src: "shot2-face", at: SHOT2_AT, from: 0.4, rate: 0.85, zoom: [1.06, 1.14], pos: "50% 35%", inT: "whip",
    look: (t) => `saturate(${interpolate(t, [K("s1", "but") - SHOT2_AT, K("s1", "wrong") - SHOT2_AT], [1, 0.45], cl)})` },
  // 02 discovery
  { src: "shot4-cafe", at: S.s2.start - 0.1, from: 0.4, rate: 0.95, zoom: [1.04, 1.2], inT: "zoom" },
  { src: "shot5-pos", at: SHOT5_AT, from: 0.6, rate: 1, zoom: [1.04, 1.12], inT: "glitch" },
  { src: "shot9-sun", at: K("s2", "thatOne") - 0.25, from: 6.1, rate: 0.45, zoom: [1.12, 1.24], pos: "50% 30%", inT: "cut",
    look: () => "saturate(0.35) brightness(0.72) contrast(1.1)" },
  // 03 answer (after the slam on black)
  { src: "shot3-walk", at: S.s3.start - 0.1, from: 0.2, rate: 0.9, zoom: [1.04, 1.12], inT: "fade" },
  { src: "shot7-table", at: K("s3", "exp") - 0.5, from: 0, rate: 0.68, zoom: [1.06, 1.16], inT: "whip" },
  // 04 payoff: blurred product → rack focus
  { src: "shot6-product", at: K("s4", "everyday") - 0.15, from: 0.5, rate: 0.6, zoom: [1.3, 1.12], pos: "50% 40%", inT: "cut",
    look: (t) => {
      const g = K("s4", "product") - (K("s4", "everyday") - 0.15);
      const bl = interpolate(t, [g - 0.2, g + 0.55], [22, 0], { ...cl, easing: out3 });
      return `blur(${bl}px) brightness(${interpolate(bl, [0, 22], [1.05, 0.6])}) saturate(${interpolate(bl, [0, 22], [1.1, 0.6])})`;
    } },
  { src: "shot4-cafe", at: K("s4", "trustP") - 0.2, from: 2.6, rate: 0.85, zoom: [1.14, 1.22], pos: "50% 40%", inT: "whip" },
  // 05 path
  { src: "shot9-sun", at: S.s5.start - 0.15, from: 0, rate: 0.78, zoom: [1.04, 1.12], inT: "zoom" },
];
// the black gap (silence + slam) between the discovery and the answer
const BLACK_FROM = S.s2.end + 0.05, BLACK_TO = S.s3.start - 0.1;
const TR = 0.32;

const ShotLayer: React.FC<{ s: Shot; len: number }> = ({ s, len }) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const z = s.zoom ?? [1.04, 1.1];
  let sc = interpolate(t, [0, len], z, cl);
  let tx = 0, op = 1, blur = 0, sx = 1;
  const p = ip(t, 0, TR, 0, 1, out3);
  if (s.inT === "fade") op = ip(t, 0, 0.5);
  if (s.inT === "whip") { tx = (1 - p) * 760; blur = (1 - p) * 26; sx = 1 + (1 - p) * 0.12; }
  if (s.inT === "zoom") { sc *= interpolate(p, [0, 1], [0.72, 1]); blur = (1 - p) * 18; op = Math.min(1, p * 3); }
  const glitch = s.inT === "glitch" && t < 0.2;
  const base = s.look ? s.look(t) : "";
  const vid = (extra: React.CSSProperties = {}) => (
    <OffthreadVideo
      src={staticFile(`hamdeli/clips/${s.src}.mp4`)}
      muted
      playbackRate={s.rate}
      trimBefore={Math.round(s.from * FPS)}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: s.pos ?? "50% 50%", ...extra }}
    />
  );
  return (
    <AbsoluteFill style={{ opacity: op, transform: `translateX(${tx}px) scale(${sc * sx}, ${sc})`, filter: `${base} ${blur ? `blur(${blur}px)` : ""}` }}>
      {vid()}
      {glitch ? (
        <>
          {[0, 1, 2, 3].map((i) => {
            const y0 = random(`gy${i}${f}`) * 1700, h = 60 + random(`gh${i}${f}`) * 180, dx = (random(`gx${i}${f}`) - 0.5) * 160;
            return <div key={i} style={{ position: "absolute", inset: 0, clipPath: `inset(${y0}px 0 ${1920 - y0 - h}px 0)`, transform: `translateX(${dx}px)` }}>{vid({ filter: i % 2 ? "hue-rotate(160deg) saturate(3)" : "saturate(2.5) brightness(1.4)" })}</div>;
          })}
        </>
      ) : null}
    </AbsoluteFill>
  );
};

const Shots: React.FC<{ t: number }> = ({ t }) => {
  const pulse = pulseAt(t);
  return (
    <AbsoluteFill style={{ transform: `scale(${1 + 0.022 * pulse})` }}>
      {SHOTS.map((s, i) => {
        let end = i + 1 < SHOTS.length ? SHOTS[i + 1].at + TR : T;
        if (s.at < BLACK_FROM && end > BLACK_FROM) end = BLACK_FROM + 0.05;
        const len = end - s.at;
        return (
          <Sequence key={i} from={Math.round(s.at * FPS)} durationInFrames={Math.max(1, Math.round(len * FPS))} layout="none">
            <ShotLayer s={s} len={len} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

// four flash-forwards in the riddle, played back in reverse (VHS) at the payoff
const FLASH: [number, string, number, string][] = [
  [K("c0", "thing"), "shot8-mirror", 4.0, "50% 40%"],
  [K("c0", "eyes"), "shot4-cafe", 2.2, "50% 45%"],
  [K("c0", "touch"), "shot7-table", 3.0, "50% 50%"],
  [K("c0", "never"), "shot9-sun", 6.6, "50% 30%"],
];
const FLEN = 0.42;
const FlashFrame: React.FC<{ src: string; from: number; pos: string; vhs?: boolean }> = ({ src, from, pos, vhs }) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const len = vhs ? 0.2 : FLEN;
  const k = t / len;
  const exp = vhs ? 1 : interpolate(k, [0, 0.12, 1], [2.4, 1.15, 0.9], cl);
  const sc = vhs ? 1.08 : interpolate(k, [0, 1], [1.18, 1.05], cl);
  const off = (random(`fo${src}${f}`) - 0.5) * (vhs ? 60 : 40);
  return (
    <AbsoluteFill style={{ transform: `scale(${sc}) translateX(${off}px)`, filter: `brightness(${exp}) contrast(1.15) ${vhs ? "saturate(0.6) hue-rotate(-12deg)" : "saturate(0.8)"}` }}>
      <OffthreadVideo src={staticFile(`hamdeli/clips/${src}.mp4`)} muted trimBefore={Math.round(from * FPS)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: pos }} />
      <AbsoluteFill style={{ background: "repeating-linear-gradient(0deg, rgba(0,0,0,0.22) 0 2px, rgba(0,0,0,0) 2px 5px)", opacity: vhs ? 0.9 : 0.35 }} />
      {vhs ? <div style={{ position: "absolute", left: 0, right: 0, top: (f * 97) % 1920, height: 70, background: "rgba(255,255,255,0.18)", filter: "blur(6px)" }} /> : null}
    </AbsoluteFill>
  );
};
const Flashes: React.FC = () => {
  const rew = K("s4", "remember") - 0.05;
  return (
    <>
      {FLASH.map(([at, src, from, pos], i) => (
        <Sequence key={i} from={Math.round((at - 0.05) * FPS)} durationInFrames={Math.round(FLEN * FPS)} layout="none">
          <FlashFrame src={src} from={from} pos={pos} />
        </Sequence>
      ))}
      {[...FLASH].reverse().map(([, src, from, pos], i) => (
        <Sequence key={`r${i}`} from={Math.round((rew + i * 0.2) * FPS)} durationInFrames={6} layout="none">
          <FlashFrame src={src} from={from} pos={pos} vhs />
        </Sequence>
      ))}
    </>
  );
};

// ---------------- atmosphere ----------------
const Atmos: React.FC<{ t: number }> = ({ t }) => {
  const pulse = pulseAt(t);
  const blackGap = Math.max(ip(t, BLACK_FROM - 0.15, BLACK_FROM + 0.05), 0) * (1 - ip(t, BLACK_TO, BLACK_TO + 0.5));
  const endDark = ip(t, T - 1.0, T - 0.6, 0, 0.94);
  const seed = Math.floor(t * 24);
  // warm light leak on the opening of the answer and on the payoff
  const leak = Math.max(
    interpolate(t, [S.s3.start - 0.2, S.s3.start + 0.6, K("s3", "econ") + 1.5], [0, 0.55, 0], cl),
    interpolate(t, [K("s4", "product") - 0.1, K("s4", "product") + 0.5, K("s4", "product") + 2.2], [0, 0.5, 0], cl),
  );
  return (
    <>
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(6,16,18,0.6) 0%, rgba(6,16,18,0) 20%, rgba(6,16,18,0) 52%, rgba(6,16,18,0.82) 100%)" }} />
      <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) ${52 - pulse * 10}%, rgba(0,0,0,${0.55 + pulse * 0.25}) 100%)` }} />
      <AbsoluteFill style={{ background: "#2a1a08", mixBlendMode: "soft-light", opacity: 0.3 }} />
      <AbsoluteFill style={{ background: `radial-gradient(circle at 85% 18%, rgba(255,170,80,0.9) 0%, rgba(255,120,40,0.35) 30%, rgba(0,0,0,0) 65%)`, mixBlendMode: "screen", opacity: leak }} />
      <AbsoluteFill style={{ background: "#03090a", opacity: Math.max(blackGap, endDark) }} />
      <Dust t={t} />
      <AbsoluteFill style={{ opacity: 0.1, mixBlendMode: "overlay" }}>
        <svg width="100%" height="100%"><filter id={`g${seed}`}><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={seed} /></filter><rect width="100%" height="100%" filter={`url(#g${seed})`} /></svg>
      </AbsoluteFill>
    </>
  );
};
const Dust: React.FC<{ t: number }> = ({ t }) => (
  <svg width="1080" height="1920" style={{ position: "absolute", mixBlendMode: "screen" }}>
    {Array.from({ length: 26 }, (_, i) => {
      const x = (random(`dx${i}`) * 1080 + t * (8 + random(`dv${i}`) * 14) * (random(`dd${i}`) > 0.5 ? 1 : -1) + 1080) % 1080;
      const y = (random(`dy${i}`) * 1920 - t * (10 + random(`du${i}`) * 18) + 1920 * 4) % 1920;
      const r = 1.2 + random(`dr${i}`) * 2.8;
      const o = 0.15 + 0.35 * (0.5 + 0.5 * Math.sin(t * (0.6 + random(`dp${i}`)) + i));
      return <circle key={i} cx={x} cy={y} r={r} fill={C.cream} opacity={o} />;
    })}
  </svg>
);

// ---------------- chapter kicker (top) + promise line ----------------
const CHAPTERS: [number, number, string, string][] = [
  [0.25, S.s1.start - 0.3, "۰۰", "یک معما"],
  [S.s1.start + 0.2, S.s2.start - 0.3, "۰۱", "یک پیام"],
  [S.s2.start + 0.2, BLACK_FROM - 0.2, "۰۲", "یک کشف"],
  [S.s3.start + 0.3, S.s4.start - 0.3, "۰۳", "یک جواب"],
  [S.s4.start + 0.2, S.s5.start - 0.3, "۰۴", "یک سرنخ"],
  [S.s5.start + 0.2, T - 0.8, "۰۵", "یک مسیر"],
];
const Kicker: React.FC<{ t: number }> = ({ t }) => {
  const ch = CHAPTERS.find(([a, b]) => t >= a - 0.05 && t <= b + 0.4);
  const promise = ip(t, 0, T, 0, 1, Easing.linear);
  return (
    <>
      <div style={{ position: "absolute", top: 36, right: 60, left: 60, height: 3, background: "rgba(255,247,234,0.14)", borderRadius: 2 }}>
        <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: `${promise * 100}%`, background: C.gold, borderRadius: 2, boxShadow: "0 0 10px rgba(242,196,109,0.8)" }} />
      </div>
      {ch ? (() => {
        const [a, b, n, label] = ch;
        const p = ip(t, a, a + 0.5, 0, 1, out3), o = 1 - ip(t, b, b + 0.35);
        return (
          <div style={{ position: "absolute", top: 82, right: 60, display: "flex", alignItems: "center", gap: 18, direction: "rtl", opacity: p * o }}>
            <div style={{ fontFamily: HEAD, fontSize: 46, color: C.gold, transform: `translateY(${(1 - p) * -20}px)` }}>{n}</div>
            <div style={{ height: 2, width: 90 * p, background: C.gold }} />
            <div style={{ fontFamily: BOLD, fontSize: 32, color: C.text, opacity: p, letterSpacing: 0.5, clipPath: `inset(0 0 0 ${(1 - p) * 100}%)` }}>{label}</div>
          </div>
        );
      })() : null}
    </>
  );
};

// ---------------- kinetic lines: each sentence picks its own motion ----------------
type Fx = "rise" | "wipe" | "drop" | "zoom" | "track" | "shine" | "glitch" | "stamp";
type LineOpts = { size?: number; font?: string; gold?: string[]; blurred?: string[]; y?: number; fx?: Fx; icon?: string; icon2?: string; maxW?: number; color?: string };
const Line: React.FC<{ t: number; t0: number; t1: number; text: string } & LineOpts> = ({
  t, t0, t1, text, size = 76, font = BLACK, gold = [], blurred = [], y = 1360, fx = "rise", icon, icon2, maxW = 960, color = C.text,
}) => {
  if (t < t0 - 0.05 || t > t1 + 0.45) return null;
  const words = text.split(" ");
  const exit = ip(t, t1 - 0.04, t1 + 0.16, 0, 1, Easing.in(Easing.quad));
  const lp = ip(t, t0, t0 + 0.55, 0, 1, out3);
  const wrap: React.CSSProperties = {
    position: "absolute", left: (1080 - maxW) / 2, width: maxW, top: y, direction: "rtl", display: "flex", flexWrap: "wrap",
    justifyContent: "center", alignItems: "center", columnGap: size * 0.26, rowGap: size * 0.08,
    opacity: 1 - exit, transform: `translateY(${-exit * 26}px)`, filter: exit ? `blur(${exit * 8}px)` : undefined,
  };
  if (fx === "wipe") wrap.clipPath = `inset(-20% 0 -20% ${(1 - lp) * 100}%)`;
  if (fx === "zoom") Object.assign(wrap, { transform: `scale(${interpolate(lp, [0, 1], [1.45, 1])}) translateY(${-exit * 26}px)`, opacity: Math.min(1, lp * 1.6) * (1 - exit), filter: `blur(${(1 - lp) * 14 + exit * 8}px)` });
  if (fx === "track") Object.assign(wrap, { transform: `scale(${interpolate(lp, [0, 1], [0.86, 1])})`, opacity: lp * (1 - exit) });
  if (fx === "stamp") { const st = ip(t, t0, t0 + 0.22, 0, 1, back); Object.assign(wrap, { transform: `scale(${interpolate(st, [0, 1], [2.2, 1])}) rotate(${(1 - st) * -4}deg)`, opacity: Math.min(1, st * 2) * (1 - exit) }); }
  const jit = fx === "glitch" && t < t0 + 0.28 ? (random(`j${Math.floor(t * 30)}`) - 0.5) * 30 : 0;
  return (
    <div style={{ ...wrap, marginLeft: jit }}>
      {icon ? <div style={{ opacity: lp, transform: `scale(${0.6 + 0.4 * ip(t, t0, t0 + 0.4, 0, 1, back)})`, marginLeft: 6 }}><Icon name={icon} s={size * 0.78} /></div> : null}
      {icon2 ? <div style={{ opacity: ip(t, t0 + 0.12, t0 + 0.45), transform: `scale(${0.6 + 0.4 * ip(t, t0 + 0.12, t0 + 0.52, 0, 1, back)})`, marginLeft: 6 }}><Icon name={icon2} s={size * 0.78} /></div> : null}
      {words.map((w, i) => {
        const a = t0 + i * 0.075;
        let p = fx === "wipe" || fx === "zoom" || fx === "track" || fx === "stamp" ? 1 : ip(t, a, a + 0.42, 0, 1, out3);
        const isGold = gold.some((g) => w.includes(g));
        const isBlur = blurred.some((g) => w.includes(g));
        let ty = (1 - p) * 38, bl = (1 - p) * 10;
        if (fx === "drop") { const d = ip(t, a, a + 0.5, 0, 1, back); ty = (1 - d) * -90; bl = (1 - d) * 6; p = Math.min(1, d * 1.5); }
        // shine: a glow that travels word by word (no background-clip, which the video render drops)
        const sw = fx === "shine" ? ip(t, t0 + 0.35, t0 + 1.5, -1, words.length + 1, Easing.inOut(Easing.cubic)) : -9;
        const glow = fx === "shine" ? Math.exp(-((i - sw) ** 2) * 1.2) : 0;
        const goldNow = glow > 0.05 ? (isGold ? "#FFF1CF" : C.gold) : isGold ? C.gold : color;
        return (
          <span
            key={i}
            style={{
              fontFamily: font, fontSize: size, lineHeight: 1.32, opacity: p,
              color: glow > 0.35 ? goldNow : isGold ? C.gold : color,
              transform: `translateY(${ty - glow * 8}px) scale(${1 + glow * 0.06})`, filter: `blur(${bl + (isBlur ? 7 + 2 * Math.sin(t * 3) : 0)}px)`,
              textShadow: glow > 0.05
                ? `0 0 ${18 + 40 * glow}px rgba(255,214,140,${0.35 + 0.55 * glow}), 0 4px 18px rgba(0,0,0,0.6)`
                : isGold ? "0 0 30px rgba(242,196,109,0.55), 0 4px 18px rgba(0,0,0,0.6)" : "0 4px 22px rgba(0,0,0,0.7)",
            }}
          >
            {w}
          </span>
        );
      })}
    </div>
  );
};

// captions: [start, end, text, opts]
const CAP: [number, number, string, LineOpts?][] = [
  // 00 riddle — centred, big, on the blurred object
  [0.25, K("c0", "eyes") - 0.08, "یه چیزی هست…", { size: 104, y: 1260, fx: "rise" }],
  [K("c0", "eyes"), K("c0", "touch") - 0.08, "که هر روز جلوی چشمته.", { size: 86, y: 1260, fx: "wipe", gold: ["چشمته"], icon: "eye" }],
  [K("c0", "touch"), K("c0", "never") - 0.08, "هر روز بهش دست می‌زنی…", { size: 86, y: 1260, fx: "drop" }],
  [K("c0", "never"), K("c0", "end") - 0.08, "و تا حالا هیچ‌وقت واقعاً ندیدیش.", { size: 82, y: 1260, fx: "rise", blurred: ["ندیدیش"] }],
  [K("c0", "end"), S.s1.start - 0.25, "تا آخر این فیلم، می‌بینیش.", { size: 92, y: 1260, fx: "zoom", gold: ["می‌بینیش"] }],
  // 01 message
  [K("s1", "but"), K("s1", "wrong") - 0.06, "ولی یه چیزی توی این پیام…", { size: 60, font: BOLD, y: 1580, fx: "wipe" }],
  [K("s1", "wrong"), S.s2.start - 0.15, "درست نیست.", { size: 124, font: HEAD, y: 1530, fx: "glitch", gold: ["نیست"] }],
  // 02 discovery
  [K("s2", "look"), K("s2", "notSeller") - 0.06, "بیا دقیق‌تر نگاه کنیم.", { size: 72, y: 1420, fx: "track", icon: "eye" }],
  [K("s2", "notSeller"), K("s2", "butBuy") - 0.06, "تو فروشنده نبودی…", { size: 84, y: 1410, fx: "rise" }],
  [K("s2", "butBuy"), SHOT5_AT - 0.15, "ولی خرید، به خاطر حرف تو اتفاق افتاد.", { size: 70, y: 1400, fx: "wipe", gold: ["حرف", "تو"], icon: "chat" }],
  [K("s2", "three"), K("s2", "one") - 0.06, "سه نفر از این ماجرا چیزی برداشتن…", { size: 60, font: BOLD, y: 1600, fx: "track" }],
  [K("s2", "empty"), K("s2", "thatOne") - 0.3, "دست خالی برگشت.", { size: 64, font: BOLD, y: 1600, fx: "rise", gold: ["خالی"] }],
  [K("s2", "thatOne"), K("s2", "you") - 0.06, "اون یه نفر…", { size: 80, y: 1400, fx: "track" }],
  [K("s2", "you"), S.s2.end - 0.05, "تو بودی.", { size: 170, font: HEAD, y: 1300, fx: "stamp", gold: ["تو"] }],
  // 03 answer
  [S.s3.start + 0.05, K("s3", "closer") - 0.06, "این سؤال جواب داره…", { size: 80, y: 1400, fx: "wipe" }],
  [K("s3", "closer"), K("s3", "econ") - 0.12, "و جوابش از اون چیزی که فکر می‌کنی، نزدیک‌تره.", { size: 66, y: 1390, fx: "rise", gold: ["نزدیک‌تره"] }],
  // 04 payoff
  [S.s4.start + 0.55, K("s4", "everyday") - 0.06, "یادته اول گفتم…", { size: 76, y: 1400, fx: "glitch" }],
  [K("s4", "everyday"), K("s4", "product") - 0.06, "یه چیزی هر روز جلوی چشمته؟", { size: 80, y: 1400, fx: "wipe", gold: ["چشمته"], icon: "eye" }],
  [K("s4", "product"), K("s4", "trustP") - 0.25, "همون محصولیه که توی کیفته…", { size: 78, y: 1400, fx: "shine", gold: ["محصولیه", "کیفته…"], icon: "bag" }],
  [K("s4", "trustP"), S.s4.end + 0.2, "و اعتمادیه که آدم‌ها به حرف تو دارن.", { size: 74, y: 1400, fx: "shine", gold: ["اعتمادیه"], icon: "heart" }],
  // 05 path
  [S.s5.start + 0.05, K("s5", "job") - 0.06, "بقیه‌ش رو نمی‌شه توی یه فیلم گفت.", { size: 68, y: 1400, fx: "wipe", icon: "film" }],
  [K("s5", "job"), K("s5", "conv") - 0.06, "لازم نیست چیزی رو توی کار یا زندگیت عوض کنی…", { size: 64, y: 1390, fx: "rise", icon: "briefcase", icon2: "home", gold: ["کار", "زندگیت"] }],
  [K("s5", "conv"), K("s5", "see") - 0.06, "فقط یه گفت‌وگوی کوتاه،", { size: 80, y: 1400, fx: "track", icon: "chat", gold: ["گفت‌وگوی"] }],
  [K("s5", "see"), T - 0.85, "تا خودت ببینی سهمت کجاست.", { size: 104, font: HEAD, y: 1290, fx: "zoom", gold: ["سهمت", "کجاست."] }],
];

// ---------------- 01 · phone: clock, buzz, notification, message, the hunt ----------------
const Clock: React.FC<{ t: number }> = ({ t }) => {
  const a = S.s1.start, b = K("s1", "msg") - 0.1;
  if (t < a - 0.1 || t > b + 0.5) return null;
  const p = ip(t, a + 0.05, a + 0.6, 0, 1, out3), o = 1 - ip(t, b, b + 0.4);
  const flip = (d: string, i: number) => {
    const fp = ip(t, a + 0.1 + i * 0.07, a + 0.45 + i * 0.07, 0, 1, out3);
    return <span key={i} style={{ display: "inline-block", transform: `perspective(600px) rotateX(${(1 - fp) * 90}deg)`, opacity: fp }}>{d}</span>;
  };
  return (
    <div style={{ position: "absolute", top: 260, width: "100%", textAlign: "center", opacity: p * o, direction: "ltr" }}>
      <div style={{ fontFamily: REG, fontSize: 38, color: C.dim, marginBottom: 4, direction: "rtl" }}>سه‌شنبه · شب</div>
      <div style={{ fontFamily: BOLD, fontSize: 200, color: C.text, lineHeight: 1, textShadow: "0 0 50px rgba(120,200,210,0.35)" }}>
        {[...fa("23")].map(flip)}<span style={{ opacity: Math.floor(t * 2) % 2 ? 0.25 : 1 }}>:</span>{[...fa("47")].map((d, i) => flip(d, i + 2))}
      </div>
    </div>
  );
};
const Buzz: React.FC<{ t: number }> = ({ t }) => {
  const a = K("s1", "vibrate") - 0.3;
  if (t < a || t > a + 1.6) return null;
  return (
    <svg width="1080" height="1920" style={{ position: "absolute" }}>
      {[0, 0.45].flatMap((d, j) => [0, 0.18].map((e, i) => {
        const p = ip(t, a + d + e, a + d + e + 0.8, 0, 1, out3);
        return p > 0 && p < 1 ? <ellipse key={`${j}${i}`} cx={560} cy={1330} rx={120 + p * 360} ry={40 + p * 120} fill="none" stroke={C.cream} strokeWidth={3} opacity={(1 - p) * 0.7} /> : null;
      }))}
    </svg>
  );
};
const AppIco: React.FC<{ s?: number }> = ({ s = 74 }) => (
  <div style={{ width: s, height: s, borderRadius: s * 0.26, background: "linear-gradient(160deg,#5ED38A,#1F9E5A)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
    <svg width={s * 0.6} height={s * 0.6} viewBox="0 0 24 24"><path d="M4 5h16v10H9l-5 4V5z" fill="#fff" /></svg>
  </div>
);
const Notification: React.FC<{ t: number }> = ({ t }) => {
  const a = K("s1", "msg"), b = K("s1", "quote") - 0.15;
  if (t < a - 0.1 || t > b + 0.6) return null;
  const p = ip(t, a, a + 0.45, 0, 1, back), o = ip(t, b, b + 0.4, 0, 1, out3);
  return (
    <div style={{ position: "absolute", left: 60, right: 60, top: 150 + (1 - p) * -240 - o * 260, opacity: 1 - o, direction: "rtl", background: "rgba(245,245,245,0.85)", backdropFilter: "blur(24px)", borderRadius: 44, padding: "28px 32px", display: "flex", gap: 24, alignItems: "center", boxShadow: "0 30px 80px rgba(0,0,0,0.45)" }}>
      <AppIco />
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: BOLD, fontSize: 38, color: "#111" }}><span>سارا</span><span style={{ fontFamily: REG, fontSize: 30, color: "#666" }}>همین الان</span></div>
        <div style={{ fontFamily: REG, fontSize: 35, color: "#333", marginTop: 6 }}>اون محصولی که بهم پیشنهاد دادی رو خریدم…</div>
      </div>
    </div>
  );
};
const Message: React.FC<{ t: number }> = ({ t }) => {
  const a = K("s1", "quote") - 0.15, q = K("s1", "quote"), but = K("s1", "but"), end = S.s1.end + 0.3;
  if (t < a - 0.1 || t > end + 0.4) return null;
  const p = ip(t, a, a + 0.45, 0, 1, out3), o = 1 - ip(t, end, end + 0.35);
  const top = interpolate(t, [SHOT2_AT - 0.3, SHOT2_AT + 0.3], [300, 1120], { ...cl, easing: ease });
  const parts: [number, string][] = [[q, "اون محصولی که بهم پیشنهاد دادی رو خریدم…"], [K("s1", "great"), "عالی بود."], [K("s1", "thanks"), "ممنونم ازت!"]];
  const heart = ip(t, K("s1", "smile"), K("s1", "smile") + 0.35, 0, 1, back);
  // after «ولی»: the bubble cools, flickers, and a magnifier hunts across it
  const cold = ip(t, but, but + 0.6);
  const flick = t > but && t < but + 0.5 && Math.floor(t * 30) % 3 === 0 ? 0.55 : 1;
  const hunt = ip(t, K("s1", "thisMsg"), S.s1.end, 0, 1, Easing.inOut(Easing.sin));
  const lensX = interpolate(hunt, [0, 0.35, 0.7, 1], [720, 260, 560, 420]);
  const lensY = interpolate(hunt, [0, 0.35, 0.7, 1], [120, 150, 110, 140]);
  return (
    <div style={{ position: "absolute", left: 70, right: 70, top, opacity: p * o * flick, transform: `translateY(${(1 - p) * 60}px)`, direction: "rtl" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 24 }}>
        <div style={{ width: 66, height: 66, borderRadius: 33, background: "linear-gradient(160deg,#E9D3A8,#B48A52)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: BOLD, fontSize: 34, color: "#3a2a12" }}>س</div>
        <div style={{ fontFamily: BOLD, fontSize: 38, color: C.text }}>سارا</div>
        <div style={{ fontFamily: REG, fontSize: 30, color: C.dim, marginRight: "auto", direction: "ltr" }}>{fa("23:47")}</div>
      </div>
      <div style={{ position: "relative", maxWidth: 860, background: `rgba(255,255,255,${0.93 - cold * 0.25})`, borderRadius: "44px 44px 44px 12px", padding: "30px 38px", boxShadow: "0 24px 70px rgba(0,0,0,0.45)", filter: `saturate(${1 - cold})` }}>
        {t < q ? (
          <div style={{ display: "flex", gap: 14, padding: "14px 6px", direction: "ltr" }}>
            {[0, 1, 2].map((i) => <div key={i} style={{ width: 22, height: 22, borderRadius: 11, background: "#8a8a8a", opacity: 0.35 + 0.65 * Math.max(0, Math.sin(t * 9 - i * 0.9)) }} />)}
          </div>
        ) : (
          <div style={{ fontFamily: BOLD, fontSize: 50, lineHeight: 1.6, color: "#1b1b1b" }}>
            {parts.map(([at, txt], i) => (t >= at - 0.05 ? <span key={i} style={{ opacity: ip(t, at - 0.05, at + 0.3) }}>{txt} </span> : null))}
          </div>
        )}
        <div style={{ position: "absolute", left: 26, bottom: -34, transform: `scale(${heart})`, width: 66, height: 66, borderRadius: 33, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 20px rgba(0,0,0,0.3)" }}>
          <Icon name="heart" s={38} c="#E5484D" />
        </div>
        {hunt > 0 ? (
          <svg width="940" height="380" style={{ position: "absolute", left: -40, top: -60, overflow: "visible", opacity: Math.min(1, hunt * 5) }}>
            <circle cx={lensX} cy={lensY} r="78" fill="rgba(242,196,109,0.08)" stroke={C.gold} strokeWidth="6" />
            <line x1={lensX + 55} y1={lensY + 55} x2={lensX + 120} y2={lensY + 120} stroke={C.gold} strokeWidth="12" strokeLinecap="round" />
          </svg>
        ) : null}
      </div>
    </div>
  );
};

// ---------------- 02 · look-closer brackets, the badge, the cards ----------------
const Brackets: React.FC<{ t: number }> = ({ t }) => {
  const a = K("s2", "look"), b = K("s2", "notSeller") + 0.2;
  if (t < a || t > b + 0.4) return null;
  const p = ip(t, a, a + 0.7, 0, 1, out3), o = 1 - ip(t, b, b + 0.35);
  const w = interpolate(p, [0, 1], [980, 520]), h = interpolate(p, [0, 1], [1700, 620]), cx = 560, cy = 900;
  const L = 70;
  const corner = (x: number, y: number, dx: number, dy: number, k: number) => <path key={k} d={`M${x} ${y + dy * L} L${x} ${y} L${x + dx * L} ${y}`} fill="none" stroke={C.gold} strokeWidth="6" strokeLinecap="round" />;
  return (
    <svg width="1080" height="1920" style={{ position: "absolute", opacity: o }}>
      {corner(cx - w / 2, cy - h / 2, 1, 1, 0)}{corner(cx + w / 2, cy - h / 2, -1, 1, 1)}{corner(cx - w / 2, cy + h / 2, 1, -1, 2)}{corner(cx + w / 2, cy + h / 2, -1, -1, 3)}
      <circle cx={cx} cy={cy} r={6 + 3 * Math.sin(t * 8)} fill={C.gold} opacity={p} />
    </svg>
  );
};
const Badge: React.FC<{ t: number }> = ({ t }) => {
  const a = K("s2", "notSeller") + 0.1, b = K("s2", "butBuy") - 0.05;
  if (t < a || t > b + 0.4) return null;
  const p = ip(t, a, a + 0.4, 0, 1, back), strike = ip(t, a + 0.45, a + 0.85, 0, 1, out3), o = 1 - ip(t, b, b + 0.3);
  return (
    <div style={{ position: "absolute", top: 1230, width: "100%", display: "flex", justifyContent: "center", opacity: o }}>
      <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 16, padding: "16px 30px", borderRadius: 18, background: "rgba(10,28,30,0.7)", border: "2px solid rgba(255,247,234,0.25)", transform: `scale(${p}) rotate(-3deg)`, direction: "rtl" }}>
        <Icon name="user" s={44} c={C.text} />
        <div style={{ fontFamily: BOLD, fontSize: 40, color: C.text }}>فروشنده</div>
        <div style={{ position: "absolute", right: 14, top: "50%", height: 6, width: `calc(${strike * 100}% - 28px)`, background: C.red, borderRadius: 3, transform: "rotate(-4deg)" }} />
      </div>
    </div>
  );
};
const Influence: React.FC<{ t: number }> = ({ t }) => {
  const a = K("s2", "butBuy") + 0.3, b = SHOT5_AT - 0.15;
  if (t < a || t > b + 0.4) return null;
  const p = ip(t, a, a + 1.0, 0, 1, out3), o = 1 - ip(t, b, b + 0.3);
  const dot = ip(t, a + 0.2, a + 1.4, 0, 1, Easing.inOut(Easing.sin));
  return (
    <div style={{ position: "absolute", top: 1200, left: 160, right: 160, height: 120, opacity: o, direction: "ltr" }}>
      <svg width="760" height="120" style={{ position: "absolute" }}>
        <path d="M640 60 C520 -10 240 130 120 60" fill="none" stroke={C.gold} strokeWidth="5" strokeDasharray="620" strokeDashoffset={620 * (1 - p)} />
        <circle cx={640 - 520 * dot} cy={60 + Math.sin(dot * Math.PI) * -20} r="10" fill="#fff" opacity={dot > 0 && dot < 1 ? 1 : 0} />
      </svg>
      <div style={{ position: "absolute", right: 0, top: 22 }}><Icon name="chat" s={76} /></div>
      <div style={{ position: "absolute", left: 0, top: 22, transform: `scale(${ip(t, a + 1.1, a + 1.5, 0, 1, back)})` }}><Icon name="bag" s={76} /></div>
    </div>
  );
};
const Scramble: React.FC<{ t: number; size?: number }> = ({ t, size = 52 }) => {
  const f = Math.floor(t * 18);
  const n = Array.from({ length: 4 }, (_, i) => Math.floor(random(`sc${f}${i}`) * 10)).join("");
  return <span style={{ fontFamily: HEAD, fontSize: size, color: C.gold, direction: "ltr", display: "inline-block", minWidth: size * 2.6, filter: "blur(1.5px)" }}>{fa(n)}</span>;
};
const Cards: React.FC<{ t: number }> = ({ t }) => {
  const a = K("s2", "sold") - 0.05, end = K("s2", "thatOne") - 0.3;
  if (t < a || t > end + 0.4) return null;
  const rows: [number, string, string, string, boolean][] = [
    [K("s2", "sold"), "تولیدکننده", "محصولش فروخته شد", "factory", false],
    [K("s2", "profit"), "فروشنده", "سود کرد", "store", false],
    [K("s2", "happy"), "دوستت", "راضی شد", "smile", false],
    [K("s2", "one"), "تو", "سهمت؟", "user", true],
  ];
  const o = 1 - ip(t, end, end + 0.35);
  const three = ip(t, K("s2", "three"), K("s2", "three") + 0.5);
  return (
    <div style={{ position: "absolute", left: 110, right: 110, top: 930, display: "flex", flexDirection: "column", gap: 20, direction: "rtl", opacity: o }}>
      {rows.map(([at, who, what, ic, empty], i) => {
        const p = ip(t, at, at + 0.5, 0, 1, out3);
        const chk = ip(t, at + 0.25, at + 0.7, 0, 1, out3);
        const glow = !empty && three > 0 ? three * (0.5 + 0.5 * Math.sin(t * 6 + i)) : 0;
        const shake = empty ? Math.sin(t * 40) * 8 * ip(t, K("s2", "empty"), K("s2", "empty") + 0.3) * (1 - ip(t, end - 0.4, end)) : 0;
        return (
          <div key={i} style={{ opacity: p, transform: `translateX(${(1 - p) * -90 + shake}px)`, display: "flex", alignItems: "center", gap: 24, padding: "22px 30px", borderRadius: 28, background: empty ? "rgba(242,196,109,0.07)" : "rgba(8,24,26,0.68)", border: empty ? `3px dashed ${C.gold}` : `2px solid rgba(123,216,143,${0.25 + glow * 0.6})`, boxShadow: glow ? `0 0 ${30 * glow}px rgba(123,216,143,${0.35 * glow})` : undefined, backdropFilter: "blur(14px)" }}>
            <div style={{ width: 76, height: 76, borderRadius: 22, background: empty ? "rgba(242,196,109,0.12)" : "rgba(123,216,143,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name={ic} s={46} c={empty ? C.gold : C.ok} />
            </div>
            <div style={{ flex: 1, display: "flex", alignItems: "baseline", gap: 16, whiteSpace: "nowrap" }}>
              <span style={{ fontFamily: BLACK, fontSize: 48, color: empty ? C.gold : C.text }}>{who}</span>
              <span style={{ fontFamily: BOLD, fontSize: 36, color: empty ? C.gold : C.dim }}>{what}</span>
            </div>
            {empty ? <Scramble t={t} /> : <svg width="52" height="52" viewBox="0 0 52 52"><path d="M13 27 l9 9 l17 -19" stroke={C.ok} strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="48" strokeDashoffset={48 * (1 - chk)} /></svg>}
          </div>
        );
      })}
    </div>
  );
};

// ---------------- the silence + the slam ----------------
const HeartRing: React.FC<{ t: number }> = ({ t }) => {
  if (t < BLACK_FROM || t > S.sq.start + 0.05) return null;
  const pulse = pulseAt(t);
  return (
    <svg width="1080" height="1920" style={{ position: "absolute" }}>
      <circle cx="540" cy="900" r={120 + pulse * 40} fill="none" stroke={C.gold} strokeWidth={3} opacity={0.25 + pulse * 0.5} />
      <circle cx="540" cy="900" r={6 + pulse * 6} fill={C.gold} opacity={0.6 + pulse * 0.4} />
    </svg>
  );
};
const Slam: React.FC<{ t: number }> = ({ t }) => {
  const a = S.sq.start, b = S.s3.start - 0.4;
  if (t < a - 0.05 || t > b + 0.5) return null;
  const p = ip(t, a - 0.05, a + 0.2, 0, 1, out3);
  const sc = interpolate(t, [a - 0.05, a + 0.2, b], [1.8, 1, 1.08], cl);
  const shake = interpolate(t, [a + 0.18, a + 0.6], [16, 0], cl) * Math.sin(t * 70);
  const o = 1 - ip(t, b, b + 0.45);
  const ring = ip(t, a + 0.1, a + 1.2, 0, 1, out3);
  const flare = interpolate(t, [a + 0.08, a + 0.25, a + 1.6], [0, 1, 0.25], cl);
  const sparks = Array.from({ length: 40 }, (_, i) => {
    const ang = random(`a${i}`) * Math.PI * 2, sp = 260 + random(`s${i}`) * 560, life = ip(t, a + 0.15, a + 1.9, 0, 1, Easing.linear);
    return { x: 540 + Math.cos(ang) * sp * life, y: 900 + Math.sin(ang) * sp * life * 0.8 + life * life * 140, o: life > 0 ? 1 - life : 0, r: 2.5 + random(`r${i}`) * 6 };
  });
  return (
    <AbsoluteFill style={{ opacity: o }}>
      <svg width="1080" height="1920" style={{ position: "absolute" }}>
        <circle cx="540" cy="900" r={150 + ring * 820} fill="none" stroke={C.gold} strokeWidth={8 * (1 - ring)} opacity={1 - ring} />
        {sparks.map((s, i) => <circle key={i} cx={s.x} cy={s.y} r={s.r} fill={C.gold} opacity={s.o} />)}
      </svg>
      <div style={{ position: "absolute", top: 880, left: 0, right: 0, height: 6, background: `linear-gradient(90deg, transparent, rgba(255,230,170,${flare}), transparent)`, filter: "blur(2px)" }} />
      <div style={{ position: "absolute", top: 860, left: 240, right: 240, height: 46, background: `radial-gradient(ellipse, rgba(255,220,150,${flare * 0.5}) 0%, transparent 70%)` }} />
      <div style={{ position: "absolute", top: 600, width: "100%", textAlign: "center", direction: "rtl", opacity: p, transform: `translateX(${shake}px) scale(${sc})` }}>
        <div style={{ fontFamily: HEAD, fontSize: 250, lineHeight: 1.12, color: C.gold, textShadow: "0 0 60px rgba(242,196,109,0.6), 0 10px 40px rgba(0,0,0,0.6)" }}>سهم تو</div>
        <div style={{ fontFamily: HEAD, fontSize: 250, lineHeight: 1.12, color: C.text, textShadow: "0 0 40px rgba(255,247,234,0.35), 0 10px 40px rgba(0,0,0,0.6)" }}>کجاست؟</div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------- 03 · title, chain, rule ----------------
const EconTitle: React.FC<{ t: number }> = ({ t }) => {
  const a = K("s3", "econ"), b = K("s3", "exp") - 0.55;
  if (t < a - 0.05 || t > b + 0.45) return null;
  const p = ip(t, a, a + 0.6, 0, 1, out3), o = 1 - ip(t, b, b + 0.4);
  const line = ip(t, a + 0.3, a + 1.0, 0, 1, out3);
  // a light streak sweeps right → left behind the title (anamorphic flare)
  const sx = ip(t, a + 0.4, a + 1.5, 900, -200, Easing.inOut(Easing.cubic));
  const so = Math.sin(Math.PI * ip(t, a + 0.4, a + 1.5, 0, 1, Easing.linear));
  return (
    <div style={{ position: "absolute", width: "100%", top: 1180, textAlign: "center", opacity: p * o, direction: "rtl", transform: `translateY(${(1 - p) * 50}px)` }}>
      <div style={{ position: "absolute", top: 120, left: sx - 300, width: 600, height: 150, background: "radial-gradient(ellipse, rgba(255,214,140,0.55) 0%, rgba(255,214,140,0) 70%)", opacity: so, mixBlendMode: "screen" }} />
      <div style={{ position: "absolute", top: 190, left: 0, right: 0, height: 4, background: `linear-gradient(90deg, transparent, rgba(255,232,180,${0.9 * so}) ${(sx / 1080) * 100}%, transparent)` }} />
      <div style={{ fontFamily: REG, fontSize: 42, color: C.cream, opacity: 0.85, marginBottom: 6, clipPath: `inset(0 0 0 ${(1 - p) * 100}%)` }}>اسمش</div>
      <div style={{ position: "relative", fontFamily: HEAD, fontSize: 150, lineHeight: 1.18, color: C.text, filter: `blur(${(1 - p) * 10}px)`, textShadow: "0 8px 30px rgba(0,0,0,0.6)" }}>
        اقتصاد <span style={{ color: C.gold, textShadow: `0 0 ${30 + 30 * so}px rgba(242,196,109,${0.5 + 0.4 * so}), 0 8px 30px rgba(0,0,0,0.6)` }}>مشارکتی</span>
      </div>
      <div style={{ margin: "8px auto 0", height: 6, width: 640 * line, background: `linear-gradient(90deg, transparent, ${C.gold}, transparent)`, borderRadius: 3 }} />
    </div>
  );
};
const Chain: React.FC<{ t: number }> = ({ t }) => {
  const a = K("s3", "exp") - 0.3, end = K("s3", "rule") - 0.35;
  if (t < a || t > end + 0.45) return null;
  const nodes: [number, string, string][] = [[K("s3", "exp"), "تجربه", "star"], [K("s3", "trust"), "اعتماد", "heart"], [K("s3", "choice"), "انتخاب", "check"], [K("s3", "partner"), "مشارکت", "link"]];
  const o = 1 - ip(t, end, end + 0.4);
  const X = [870, 650, 430, 210], Y = 1180;
  return (
    <AbsoluteFill style={{ opacity: o }}>
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(6,16,18,0) 45%, rgba(6,16,18,0.7) 62%, rgba(6,16,18,0.7) 78%, rgba(6,16,18,0) 92%)", opacity: ip(t, a, a + 0.5) }} />
      <svg width="1080" height="1920" style={{ position: "absolute" }}>
        {nodes.slice(1).map(([at], i) => {
          const p = ip(t, at - 0.35, at, 0, 1, out3), x1 = X[i] - 86, x2 = X[i + 1] + 86;
          return (
            <g key={i}>
              <line x1={x1} y1={Y} x2={x1 + (x2 - x1) * p} y2={Y} stroke={C.gold} strokeWidth="6" strokeLinecap="round" style={{ filter: "drop-shadow(0 0 10px rgba(242,196,109,0.9))" }} />
              {p > 0 && p < 1 ? <circle cx={x1 + (x2 - x1) * p} cy={Y} r="10" fill="#fff" /> : null}
            </g>
          );
        })}
      </svg>
      {nodes.map(([at, label, ic], i) => {
        const p = ip(t, at, at + 0.45, 0, 1, back), last = i === 3, glow = last ? 0.6 + 0.4 * Math.sin(t * 5) : 0.45;
        return (
          <div key={i} style={{ position: "absolute", left: X[i] - 86, top: Y - 86, width: 172, height: 172, transform: `scale(${p})`, opacity: Math.min(1, p * 1.5) }}>
            <div style={{ width: 172, height: 172, borderRadius: 86, border: `5px solid ${C.gold}`, background: last ? "rgba(242,196,109,0.28)" : "rgba(8,24,26,0.75)", boxShadow: `0 0 ${44 * glow}px rgba(242,196,109,${glow})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name={ic} s={78} />
            </div>
            <div style={{ position: "absolute", top: 190, width: 260, left: -44, textAlign: "center", fontFamily: BLACK, fontSize: 48, color: last ? C.gold : C.text, textShadow: "0 4px 18px rgba(0,0,0,0.8)" }}>{label}</div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
const Rule: React.FC<{ t: number }> = ({ t }) => {
  const a = K("s3", "rule") + 0.1, end = S.s3.end + 0.15;
  if (t < a - 0.05 || t > end + 0.45) return null;
  const p = ip(t, a, a + 0.5, 0, 1, out3), o = 1 - ip(t, end, end + 0.4);
  const share = ip(t, K("s3", "share"), K("s3", "share") + 0.5, 0, 1, back);
  const Item: React.FC<{ at: number; txt: string }> = ({ at, txt }) => {
    const n = ip(t, at, at + 0.45, 0, 1, out3), st = ip(t, at + 0.35, at + 0.8, 0, 1, out3);
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 20, opacity: n, transform: `translateY(${(1 - n) * 30}px)` }}>
        <svg width="46" height="46" viewBox="0 0 48 48"><path d="M12 12 L36 36 M36 12 L12 36" stroke={C.red} strokeWidth="6" strokeLinecap="round" /></svg>
        <div style={{ position: "relative", fontFamily: BOLD, fontSize: 50, color: C.text }}>{txt}<div style={{ position: "absolute", right: 0, top: "52%", height: 5, width: `${st * 100}%`, background: C.red, borderRadius: 3 }} /></div>
      </div>
    );
  };
  return (
    <div style={{ position: "absolute", left: 80, right: 80, top: 1040, direction: "rtl", opacity: p * o, transform: `translateY(${(1 - p) * 60}px)` }}>
      <div style={{ padding: "36px 40px", borderRadius: 40, background: "rgba(8,24,26,0.8)", border: "2px solid rgba(242,196,109,0.45)", backdropFilter: "blur(16px)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 18, fontFamily: BLACK, fontSize: 44, color: C.text, whiteSpace: "nowrap" }}>
          <Icon name="bag" s={52} c={C.text} /><span>فروش واجد شرایط</span><span style={{ color: C.gold, fontSize: 56 }}>←</span>
          <span style={{ color: C.gold, display: "inline-block", transform: `scale(${0.7 + 0.3 * share})`, opacity: share }}>سهم طبق توافق</span>
        </div>
        <div style={{ height: 2, background: "rgba(255,247,234,0.15)", margin: "30px 0" }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <Item at={K("s3", "noPromise")} txt="وعده‌ی پول‌دار شدن" />
          <Item at={K("s3", "noGuarantee")} txt="درآمد تضمینی" />
        </div>
      </div>
    </div>
  );
};
const Disclaimer: React.FC<{ t: number }> = ({ t }) => {
  const on = Math.max(
    interpolate(t, [K("s3", "rule"), K("s3", "rule") + 0.5, S.s3.end, S.s3.end + 0.4], [0, 1, 1, 0], cl),
    interpolate(t, [K("s5", "see"), K("s5", "see") + 0.5, T - 0.8, T - 0.3], [0, 1, 1, 0], cl),
  );
  if (on <= 0) return null;
  return <div style={{ position: "absolute", bottom: 70, width: "100%", textAlign: "center", opacity: on * 0.9, direction: "rtl", fontFamily: REG, fontSize: 31, color: C.dim }}>درآمد تضمینی نیست · سهم فقط از فروش واجد شرایط و طبق توافق</div>;
};

// ---------------- 04 · payoff: focus reticle and the trust arc ----------------
const FocusMark: React.FC<{ t: number }> = ({ t }) => {
  const a = K("s4", "everyday"), g = K("s4", "product");
  if (t < a || t > K("s4", "trustP")) return null;
  const lock = ip(t, g - 0.1, g + 0.45, 0, 1, out3), o = 1 - ip(t, K("s4", "trustP") - 0.35, K("s4", "trustP"));
  const r = interpolate(lock, [0, 1], [300, 210]);
  const spin = (1 - lock) * t * 40;
  return (
    <svg width="1080" height="1920" style={{ position: "absolute", opacity: o * (0.6 + 0.4 * lock) }}>
      <g transform={`translate(540 760) rotate(${spin})`}>
        {[0, 90, 180, 270].map((d) => <path key={d} d={`M${r} -40 A${r} ${r} 0 0 1 ${r} 40`} transform={`rotate(${d})`} fill="none" stroke={lock > 0.95 ? C.gold : C.cream} strokeWidth="5" strokeLinecap="round" />)}
      </g>
    </svg>
  );
};
const TrustArc: React.FC<{ t: number }> = ({ t }) => {
  const a = K("s4", "trustP") + 0.2, end = S.s4.end + 0.2;
  if (t < a || t > end + 0.4) return null;
  const p = ip(t, a, a + 0.9, 0, 1, out3), o = 1 - ip(t, end, end + 0.35), pulse = 0.6 + 0.4 * Math.sin(t * 6);
  return (
    <svg width="1080" height="1920" style={{ position: "absolute", opacity: o }}>
      <circle cx="290" cy="1290" r={20} fill={C.cream} opacity={p} />
      <circle cx="790" cy="1290" r={20} fill={C.cream} opacity={p} />
      <path d={`M310 1290 Q540 ${1290 - 130 * p} 770 1290`} stroke={C.gold} strokeWidth="7" fill="none" strokeDasharray="560" strokeDashoffset={560 * (1 - p)} style={{ filter: `drop-shadow(0 0 ${16 * pulse}px rgba(242,196,109,0.95))` }} />
    </svg>
  );
};

// ---------------- ending: the open loop ----------------
const Ending: React.FC<{ t: number }> = ({ t }) => {
  const a = T - 0.75;
  if (t < a) return null;
  const p = ip(t, a, a + 0.4, 0, 1, back);
  return (
    <div style={{ position: "absolute", top: 1240, width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 24, direction: "rtl", opacity: Math.min(1, p * 1.5) }}>
      <div style={{ display: "flex", alignItems: "center", gap: 20, padding: "22px 34px", borderRadius: 28, border: `3px dashed ${C.gold}`, background: "rgba(242,196,109,0.07)", transform: `scale(${0.8 + 0.2 * p})` }}>
        <Icon name="user" s={52} />
        <span style={{ fontFamily: BLACK, fontSize: 52, color: C.gold }}>سهم تو</span>
        <Scramble t={t} size={56} />
      </div>
      <div style={{ padding: "20px 56px", borderRadius: 70, background: `linear-gradient(135deg, ${C.gold}, #D9A441)`, fontFamily: BLACK, fontSize: 44, color: "#1d1405" }}>بقیه‌ی ماجرا ←</div>
    </div>
  );
};

// ---------------- film ----------------
const Body: React.FC<{ audio?: boolean }> = ({ audio }) => {
  const t = useCurrentFrame() / FPS;
  return (
    <AbsoluteFill style={{ background: C.night }}>
      <Shots t={t} />
      <Flashes />
      <Atmos t={t} />
      <Kicker t={t} />
      <Clock t={t} />
      <Buzz t={t} />
      <Notification t={t} />
      <Message t={t} />
      <Brackets t={t} />
      <Badge t={t} />
      <Influence t={t} />
      <Cards t={t} />
      <HeartRing t={t} />
      <Slam t={t} />
      <EconTitle t={t} />
      <Chain t={t} />
      <Rule t={t} />
      <FocusMark t={t} />
      <TrustArc t={t} />
      {CAP.map(([a, b, txt, o], i) => <Line key={i} t={t} t0={a} t1={b} text={txt} {...o} />)}
      <Disclaimer t={t} />
      <Ending t={t} />
      {audio ? <Audio src={staticFile("hamdeli2/mix.wav")} /> : null}
    </AbsoluteFill>
  );
};

export const Hamdeli2Film: React.FC<{ audio?: boolean; times?: number[] }> = ({ audio, times }) => {
  const f = useCurrentFrame();
  if (times) return <Freeze frame={Math.round(times[Math.min(f, times.length - 1)] * FPS)}><Body /></Freeze>;
  return <Body audio={audio} />;
};

export const H2_LOOK = [
  0.9, K("c0", "eyes") + 0.15, K("c0", "eyes") + 0.7, K("c0", "never") + 1.2, K("c0", "end") + 0.8,
  K("s1", "vibrate") + 0.2, K("s1", "great") + 0.5, K("s1", "thisMsg") + 0.8, K("s1", "wrong") + 0.4,
  K("s2", "look") + 0.6, K("s2", "notSeller") + 0.7, K("s2", "butBuy") + 1.4, SHOT5_AT + 0.1, K("s2", "one") + 0.8, K("s2", "you") + 0.4,
  S.sq.start - 0.9, S.sq.start + 0.5, K("s3", "closer") + 0.9, K("s3", "econ") + 1.0, K("s3", "partner") + 0.6, K("s3", "noGuarantee") + 0.9,
  S.s4.start + 0.15, K("s4", "everyday") + 0.6, K("s4", "product") + 0.8, K("s4", "trustP") + 1.0,
  K("s5", "job") + 0.6, K("s5", "see") + 1.0, T - 0.3,
];
export const H2_FACECHECK = Array.from({ length: 80 }, (_, i) => i + 0.5);
