# CLAUDE.md — Hamdeli («همدلی — سهم تو کجاست؟»)

Interactive lead page (static HTML/CSS/JS, no build step) around an 80-second vertical film.
Goal: make people outside network marketing curious, then collect **name + mobile** for a callback.
Owner: Amir Mirzaei. **Always talk to the owner in Persian (Farsi).**

## Files
- `index.html` — shell. Two `<video>` elements (`#vA`, `#vB`) alternate so parts hand off without gaps. Bump `?v=` on `styles.css`/`app.js` after every change (cache busting).
- `styles.css` — dark green/gold theme, RTL, mobile-first; on desktop the page sits in a 1:2 phone frame. The film uses `object-fit: contain` (no side crop on tall phones).
- `app.js` — the whole flow: `intro → play(p1) → slider → play(p2) → hold → play(p3→p4) → cta → form → success`.
  - `PARTS` = film cut points (seconds on the 80 s timeline): 0 / 23.41 / 41.3 / 62.43.
  - `BEATS`, `BUZZ_AT`, `HIT_AT`, `MINI_AT`, `miniOn()` are synced to the film (heartbeat vibration on Android, the «بقیه‌ی ماجرا» button window).
  - p1 starts buffering while the intro is shown; the next part preloads while the current one plays; p3→p4 swaps 0.1 s early (`swappedFrom`).
  - Form: POST `https://sahm-hamdeli.amirzaee123.chatgpt.site/api/requests` with `{id, name, mobile, consent:true, website}` (`website` is a honeypot). Mobile is normalized (Persian/Arabic digits, 98/0098) and must match `^09\d{9}$`.
  - NEXA first (T162): the same fields + `referralCode` (only a NEXA code from `?ref=`) + `summaries` (the slider answer) go to `https://nexa-net.app/external-leads/hamdeli-sahm`. On 404/5xx/network/timeout the form falls back to the API above; NEXA's 4xx answers show a Persian message (no fallback). CSP `connect-src` includes `https://nexa-net.app`.
- `media/p1.mp4…p4.mp4` — the film in 4 parts (720×1280, H.264 ~600 kbps two-pass, AAC 64k, faststart). `sl/cta/form/ok.mp3` — voice lines (ElevenLabs, voice "randy gage"), -15 LUFS.
- `film/hamdeli-v2-film-80s.mp4` — full film for messengers.
- `source/` — reference only (it was built inside the owner's Remotion kit `D:\NFP-Alvana`, which is not in this repo):
  `Film2.tsx` (the film composition), `vo2.json` (narration word timings), `beats2.json`, `tools/` (narration builder, score/mix builder, single-file packer), `direction.md` (script, decisions, history).

## Rules (keep them)
1. **Honesty:** never promise income. Keep «درآمد تضمینی نیست · سهم فقط از فروش واجد شرایط و طبق توافق».
2. **No text over faces** in the film; captions live in the lower third.
3. Persian RTL everywhere; never split Persian words letter by letter; Persian digits in UI.
4. Keep the form API, fields, consent checkbox and honeypot exactly compatible.
5. Do not add an «AI-generated» note (the owner removed it on purpose).
6. Mobile first and light: the site targets weak connections in Iran (total ~7 MB). Do not add heavy libraries or external CDNs (CSP: `default-src 'self'`; `connect-src` allows only the API and NEXA).
7. Do not submit real test leads to the API unless the owner asks.

## Run locally
`npx serve .` then open on a phone-sized viewport. Test the full path: start → slider → hold → button → form validation.
