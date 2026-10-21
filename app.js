'use strict';
// همدلی — سهم تو کجاست؟ · v2 (curiosity cut)
// intro (blurred message) → part 1: the riddle + the message → slider «به چند نفر پیشنهاد دادی؟» (+ voice) →
// part 2: the discovery → hold your finger to see the question → parts 3–4 with a «بقیه‌ی ماجرا» button →
// invitation → form → success. On Android the phone vibrates with the film's heartbeat.
// Same API and fields as the previous page.
const API = 'https://sahm-hamdeli.amirzaee123.chatgpt.site/api/requests';
const TOTAL = 80;
const PARTS = [
  { src: 'media/p1.mp4', start: 0 },
  { src: 'media/p2.mp4', start: 23.41 },
  { src: 'media/p3.mp4', start: 41.3 },
  { src: 'media/p4.mp4', start: 62.43 },
];
const MINI_AT = 41.76;      // after «سهم تو کجاست؟»
const BUZZ_AT = 12.87;     // the phone in the film vibrates
const HIT_AT = 41.66;       // the hit
const BEATS = [20.804, 21.772, 22.739, 23.662, 24.519, 25.375, 26.227, 27.074, 27.912, 28.74, 29.557, 30.36, 31.149, 31.923, 32.68, 33.422, 34.146, 34.853, 35.544, 36.218, 36.875, 37.516, 38.142, 38.753, 39.348, 39.93, 40.498, 41.052, 77.531, 78.565, 79.45];
const VOICE = { sl: 'media/sl.mp3', cta: 'media/cta.mp3', form: 'media/form.mp3', ok: 'media/ok.mp3' };

const $ = (s) => document.querySelector(s);
const vids = [$('#vA'), $('#vB')];
const stage = $('#stage'), shade = $('#shade'), mini = $('#mini'), bar = $('#progress');
const voice = $('#voice'), loading = $('#loading'), pausedHint = $('#paused'), muteBtn = $('#mute');
let phase = 'intro', part = 0, cur = 0, muted = false, busy = false, consent = false, count = 3;
let requestId = '', requestPayload = '', reference = '', lastT = 0, swappedFrom = -1;

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fa = (s) => String(s).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]);
const video = () => vids[cur];
const other = () => vids[1 - cur];
const filmTime = () => (PARTS[part] ? PARTS[part].start + (video().currentTime || 0) : TOTAL);
const prime = (v) => { try { const m = v.muted; v.muted = true; const p = v.play(); if (p && p.then) p.then(() => { v.pause(); v.muted = m; }).catch(() => { v.muted = m; }); } catch (e) { /* ignore */ } };
// the «بقیه‌ی ماجرا» button hides while the film shows its own honest strip / ending card
const miniOn = (t) => t >= MINI_AT && !(t > 55.36 && t < 62.6) && t < 77.23;
const buzz = (p) => { try { if (!muted && navigator.vibrate) navigator.vibrate(p); } catch (e) { /* not supported */ } };

// ---------- screens ----------
const ICON = '<svg width="24" height="24" viewBox="0 0 24 24"><path d="M4 5h16v10H9l-5 4V5z" fill="#fff"/></svg>';
function render() {
  shade.classList.toggle('on', ['slider', 'hold', 'cta', 'form', 'success'].includes(phase));
  mini.classList.toggle('hidden', !(phase === 'play' && miniOn(filmTime())));
  stage.classList.toggle('top', phase === 'form');
  $('#screen').classList.toggle('is-intro', phase === 'intro');
  muteBtn.classList.toggle('hidden', ['intro', 'form', 'success'].includes(phase));
  pausedHint.classList.add('hidden');
  if (phase === 'intro') {
    stage.innerHTML = `<div class="intro">
      <div class="notif" role="img" aria-label="یک پیام تازه"><div class="app-ico">${ICON}</div><div style="flex:1"><b>سارا <small>۲۳:۴۷</small></b><span class="blurred">اون محصولی که بهم پیشنهاد دادی رو خریدم…</span></div></div>
      <div class="panel"><div class="brand">همدلی</div><h1>یه چیزی هست…<br><b>که هر روز جلوی چشمته.</b></h1>
      <p>یک فیلم کوتاهِ ۸۰ ثانیه‌ای. صدای گوشی‌ات را روشن کن، هدفون بهتر است.</p>
      <button class="primary" id="start" type="button">پیام رو باز کن ▶</button></div></div>`;
    $('#start').onclick = start;
  } else if (phase === 'slider') {
    stage.innerHTML = `<div class="panel"><span class="eyebrow">قبل از اینکه ادامه بدیم…</span>
      <h1>تا حالا به چند نفر یه چیزی رو<br>پیشنهاد دادی که <b>بعدش خریدن؟</b></h1>
      <div class="count"><b id="cnt">${fa(count)}</b><span>نفر</span></div>
      <input id="range" type="range" min="1" max="50" step="1" value="${count}" aria-label="تعداد نفرها">
      <button class="primary" id="go" type="button">همینه</button>
      <div class="verdict" id="verdict"></div></div>`;
    const r = $('#range');
    const upd = () => { count = +r.value; $('#cnt').textContent = count >= 50 ? '۵۰+' : fa(count); r.style.setProperty('--p', `${100 - ((count - 1) / 49) * 100}%`); };
    r.oninput = () => { upd(); buzz(6); }; upd();
    $('#go').onclick = answer;
  } else if (phase === 'hold') {
    stage.innerHTML = `<div class="hold" id="hold" role="button" aria-label="برای دیدن، نگه دار">
      <svg viewBox="0 0 180 180"><circle cx="90" cy="90" r="78" fill="none" stroke="rgba(255,247,234,.15)" stroke-width="6"/>
      <circle id="ring" cx="90" cy="90" r="78" fill="none" stroke="#F2C46D" stroke-width="6" stroke-linecap="round" stroke-dasharray="490" stroke-dashoffset="490" transform="rotate(-90 90 90)"/>
      <g class="beat" style="transform-origin:90px 90px"><circle cx="90" cy="90" r="12" fill="#F2C46D"/></g></svg>
      <p>انگشتت رو روی صفحه نگه دار…</p><small>تا ببینی سهم اون یه نفر کجاست</small></div>`;
    setupHold();
  } else if (phase === 'cta') {
    stage.innerHTML = `<div class="panel"><span class="eyebrow">بقیه‌ی ماجرا</span><h1>می‌خوای بدونی<br><b>سهم تو</b> کجاست؟</h1>
      <p>اسم و شماره‌ت رو بذار. یه مشاور باهات تماس می‌گیره، همه‌چیز رو شفاف توضیح می‌ده… و تصمیم، با خودته.</p>
      <button class="primary" id="yes" type="button">آره، می‌خوام بدونم ←</button>
      <button class="ghost" id="again" type="button">دوباره از اول ببینم</button>
      <span class="note">درآمد تضمینی نیست · سهم فقط از فروش واجد شرایط و طبق توافق</span></div>`;
    $('#yes').onclick = () => { phase = 'form'; render(); say('form'); };
    $('#again').onclick = restart;
  } else if (phase === 'form') {
    stage.innerHTML = `<form class="panel form" id="lead" novalidate>
      <div class="top-row"><span class="eyebrow">یک قدم تا گفت‌وگو</span><button type="button" class="link" id="back">بازگشت</button></div>
      <h1>اسمت و شماره‌ی موبایلت رو بنویس.</h1>
      <div class="trust"><span>بدون هزینه</span><span>بدون تعهد</span><span>فقط برای همین تماس</span></div>
      <label for="name">نام و نام خانوادگی</label>
      <input id="name" name="name" type="text" required minlength="2" maxlength="80" autocomplete="name" placeholder="نام تو">
      <label for="mobile">شماره موبایل</label>
      <input id="mobile" name="mobile" type="tel" inputmode="tel" autocomplete="tel" maxlength="18" required placeholder="0912 345 6789">
      <div class="trap" aria-hidden="true"><input id="website" tabindex="-1" autocomplete="off"></div>
      <label class="consent"><input id="consent" type="checkbox" ${consent ? 'checked' : ''}><span>موافقم از نام و شماره‌ام فقط برای تماس درباره‌ی این درخواست استفاده شود.</span></label>
      <div class="err" id="err" role="alert"></div>
      <button class="primary" id="submit" type="submit" ${consent ? '' : 'disabled'}>ثبت درخواست مشاوره</button>
      <span class="note">ثبت درخواست، تعهد به خرید یا همکاری نیست.</span></form>`;
    $('#consent').onchange = (e) => { consent = e.target.checked; $('#submit').disabled = !consent; };
    $('#back').onclick = () => { stopVoice(); phase = 'cta'; render(); };
    $('#lead').onsubmit = submitForm;
    ['#name', '#mobile'].forEach((q) => $(q).addEventListener('focus', (e) => setTimeout(() => e.target.scrollIntoView({ block: 'center', behavior: 'smooth' }), 300)));
  } else if (phase === 'success') {
    stage.innerHTML = `<div class="panel success"><div class="mark">✓</div><h1>درخواستت ثبت شد.</h1>
      <p>ممنون از اعتمادت. به‌زودی یه مشاور باهات تماس می‌گیره.</p>
      <span class="ref">کد پیگیری: <b dir="ltr">${esc(fa(reference))}</b></span></div>`;
  } else {
    stage.innerHTML = '';
  }
}

// ---------- film ----------
function load(el, i) {
  if (!PARTS[i] || el.dataset.part === String(i)) return;
  el.dataset.part = String(i);
  el.src = PARTS[i].src;
  el.preload = 'auto';
  el.muted = muted;
  el.load();
}
function playPart(i) {
  part = i;
  const v = video();
  load(v, i);
  // seamless hand-off: the new part sits on top; the old picture stays until the new one shows its first frame
  const old = vids.find((x) => x !== v);
  v.classList.remove('hidden');
  v.style.zIndex = '2'; old.style.zIndex = '1';
  const hideOld = () => { if (video() === v) old.classList.add('hidden'); };
  if (v.readyState >= 2 && !v.paused) hideOld(); else v.addEventListener('playing', hideOld, { once: true });
  setTimeout(hideOld, 1500);
  phase = 'play';
  lastT = PARTS[i].start;
  render();
  v.play().catch(() => pausedHint.classList.remove('hidden'));
}
function next() {
  if (part === 0) { phase = 'slider'; render(); return; }
  if (part === 1) { phase = 'hold'; render(); return; }
  if (part + 1 < PARTS.length) { cur = 1 - cur; playPart(part + 1); return; }
  toCta();
}
vids.forEach((v) => {
  v.addEventListener('ended', () => { if (v === video() && phase === 'play') next(); });
  v.addEventListener('timeupdate', () => {
    if (v !== video()) return;
    bar.style.width = `${Math.min(100, (filmTime() / TOTAL) * 100)}%`;
    if (phase === 'play') mini.classList.toggle('hidden', !miniOn(filmTime()));
    if (v.currentTime > 2 && part + 1 < PARTS.length) load(other(), part + 1);
  });
  v.addEventListener('waiting', () => { if (v === video() && phase === 'play') loading.classList.remove('hidden'); });
  v.addEventListener('playing', () => { loading.classList.add('hidden'); pausedHint.classList.add('hidden'); });
  v.addEventListener('error', () => { if (v === video() && phase === 'play') { loading.classList.add('hidden'); toast('بارگذاری ویدئو کامل نشد. دوباره بزن تا ادامه پیدا کند.'); } });
});
// haptics in sync with the film (Android; iPhone ignores vibration)
(function tick() {
  if (phase === 'play' && !video().paused) {
    const t = filmTime();
    if (t > lastT && t - lastT < 0.5) {
      BEATS.forEach((b) => { if (b > lastT && b <= t) buzz([38, 130, 24]); });
      if (BUZZ_AT > lastT && BUZZ_AT <= t) buzz([300, 150, 300]);
      if (HIT_AT > lastT && HIT_AT <= t) buzz(420);
    }
    lastT = t;
    // automatic part changes (3 → 4) start a moment early, so there is no gap or lag between the pieces
    const v = video();
    if (part >= 2 && part + 1 < PARTS.length && swappedFrom !== part && v.duration && v.duration - v.currentTime < 0.1) {
      swappedFrom = part; cur = 1 - cur; playPart(part + 1);
    }
  }
  requestAnimationFrame(tick);
})();
$('#screen').addEventListener('click', (e) => {
  if (phase !== 'play' || e.target.closest('button')) return;
  const v = video();
  if (v.paused) { v.play().catch(() => {}); pausedHint.classList.add('hidden'); }
  else { v.pause(); pausedHint.classList.remove('hidden'); }
});
function toast(msg) {
  pausedHint.textContent = msg;
  pausedHint.classList.remove('hidden');
  setTimeout(() => { pausedHint.textContent = '▶ ادامه'; }, 4000);
}

// ---------- voice lines ----------
function say(key, done) {
  stopVoice();
  voice.src = VOICE[key];
  voice.muted = muted;
  let finished = false;
  const fin = () => { if (finished) return; finished = true; done && done(); };
  voice.onended = fin;
  voice.onerror = fin;
  voice.play().catch(fin);
  if (done) setTimeout(fin, 8000);
}
function stopVoice() { voice.onended = voice.onerror = null; voice.pause(); }

// ---------- interactions ----------
function start() {
  voice.src = VOICE.cta; voice.muted = true;
  voice.play().then(() => { voice.pause(); voice.muted = muted; }).catch(() => { voice.muted = muted; });
  buzz(20);
  load(other(), 1);
  prime(other());
  playPart(0);
}
function answer() {
  $('#go').disabled = true; $('#range').disabled = true;
  prime(other());
  const n = count >= 50 ? 'بیشتر از ۵۰' : fa(count);
  $('#verdict').innerHTML = `<b>یعنی روی <i>${n}</i> خرید اثر گذاشتی.</b><span>و سهمت؟ ۰</span>`;
  buzz([30, 80, 30]);
  say('sl', () => { if (phase === 'slider') { cur = 1 - cur; playPart(1); } });
}
function setupHold() {
  const el = $('#hold'), ring = $('#ring');
  const NEED = 1400;
  let t0 = 0, raf = 0, prog = 0, done = false, timer = 0;
  const draw = () => ring.setAttribute('stroke-dashoffset', String(490 * (1 - prog)));
  const step = () => {
    if (done) return;
    prog = Math.min(1, (performance.now() - t0) / NEED);
    draw();
    if (prog >= 1) { done = true; clearInterval(timer); buzz(200); load(other(), 2); cur = 1 - cur; playPart(2); return; }
    raf = requestAnimationFrame(step);
  };
  const down = (e) => { e.preventDefault(); if (done) return; prime(other()); t0 = performance.now() - prog * NEED; buzz([40, 120, 25]); timer = setInterval(() => buzz([40, 120, 25]), 700); raf = requestAnimationFrame(step); };
  const up = () => {
    if (done) return;
    cancelAnimationFrame(raf); clearInterval(timer);
    const from = prog, t1 = performance.now();
    const back = () => { prog = Math.max(0, from - (performance.now() - t1) / 600); draw(); if (prog > 0 && !done && !t0Active) requestAnimationFrame(back); };
    t0Active = false; requestAnimationFrame(back);
  };
  let t0Active = false;
  el.addEventListener('pointerdown', (e) => { t0Active = true; down(e); });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach((n) => el.addEventListener(n, up));
  el.addEventListener('contextmenu', (e) => e.preventDefault());
  // keyboard: hold Space/Enter
  el.tabIndex = 0;
  el.addEventListener('keydown', (e) => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { t0Active = true; down(e); } });
  el.addEventListener('keyup', (e) => { if (e.key === ' ' || e.key === 'Enter') up(); });
  el.focus({ preventScroll: true });
}
mini.addEventListener('click', (e) => { e.stopPropagation(); video().pause(); toCta(); });
function toCta() { phase = 'cta'; render(); say('cta'); }
function restart() {
  stopVoice(); cur = 0; swappedFrom = -1;
  vids.forEach((v) => { v.pause(); v.removeAttribute('src'); delete v.dataset.part; v.load(); });
  load(other(), 1);
  playPart(0);
}
muteBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  muted = !muted;
  vids.forEach((v) => (v.muted = muted));
  voice.muted = muted;
  muteBtn.textContent = muted ? '🔇' : '🔊';
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden && phase === 'play') { video().pause(); pausedHint.classList.remove('hidden'); }
  if (document.hidden) voice.pause();
});

// ---------- form ----------
function makeRequestId() {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16)); b[6] = (b[6] & 15) | 64; b[8] = (b[8] & 63) | 128;
  const h = Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}
function normalize(s) {
  return s.replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d))
    .replace(/\D/g, '').replace(/^0098/, '0').replace(/^98/, '0');
}
async function submitForm(e) {
  e.preventDefault();
  if (busy || !consent) return;
  const err = $('#err'), submit = $('#submit');
  const name = $('#name').value.trim(), mobile = normalize($('#mobile').value);
  if (name.length < 2) { err.textContent = 'نامت رو کامل بنویس.'; $('#name').focus(); return; }
  if (!/^09\d{9}$/.test(mobile)) { err.textContent = 'شماره موبایل باید ۱۱ رقم و با ۰۹ شروع شود.'; $('#mobile').focus(); return; }
  busy = true; err.textContent = ''; submit.disabled = true; submit.textContent = 'در حال ثبت…'; stopVoice();
  const payload = JSON.stringify({ name, mobile, consent: true });
  if (payload !== requestPayload) { requestId = makeRequestId(); requestPayload = payload; }
  const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(API, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: controller.signal,
      body: JSON.stringify({ id: requestId, name, mobile, consent: true, website: $('#website').value }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) throw new Error(data.error || 'ثبت انجام نشد؛ دوباره تلاش کن.');
    reference = String(data.reference || requestId.slice(0, 8));
    phase = 'success'; render(); say('ok'); buzz([60, 80, 60]);
  } catch (x) {
    err.textContent = x.name === 'AbortError' ? 'ارتباط طول کشید؛ دوباره تلاش کن.' : x.message || 'ارتباط برقرار نشد؛ دوباره تلاش کن.';
    submit.disabled = !consent; submit.textContent = 'ثبت درخواست مشاوره';
  } finally { clearTimeout(timer); busy = false; }
}

render();
// speed: start buffering the first part while the visitor reads the intro, so the film starts the moment they tap
load(vids[0], 0);
