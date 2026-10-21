// Packs a Hamdeli site folder into ONE self-contained .html (videos, voice lines, fonts, cover, css, js inline)
// so it opens with a double-click like a website. Media become blob: URLs at load time.
// usage: node tools/hamdeli-singlefile.mjs videos/04-hamdeli/site2 videos/04-hamdeli/hamdeli-v2-site.html
import fs from "node:fs";
import path from "node:path";
const [dir, outFile] = process.argv.slice(2);
const rd = (p) => fs.readFileSync(path.join(dir, p));
const b64 = (p) => rd(p).toString("base64");
const MIME = { ".mp4": "video/mp4", ".mp3": "audio/mpeg", ".jpg": "image/jpeg", ".woff2": "font/woff2" };
const mime = (p) => MIME[path.extname(p)];

let html = rd("index.html").toString();
let css = rd("styles.css").toString().replace(/url\((fonts\/[^)]+)\)/g, (_, f) => `url(data:${mime(f)};base64,${b64(f)})`);
let js = rd("app.js").toString();

// every media path the page uses
const media = [...new Set([...js.matchAll(/'(media\/[^']+)'/g)].map((m) => m[1]))];
// decode at the moment of use (not when the paths are declared)
js = js.split("el.src = PARTS[i].src;").join("el.src = M(PARTS[i].src);")
  .split("voice.src = VOICE[key];").join("voice.src = M(VOICE[key]);")
  .split("voice.src = VOICE.cta;").join("voice.src = M(VOICE.cta);");
const table = media.map((p) => `${JSON.stringify(p)}:[${JSON.stringify(mime(p))},"${b64(p)}"]`).join(",\n");
const boot = `// media are decoded only when first needed, so the first screen appears at once
const __D={${table}};window.__U={};
const M=(p)=>{if(window.__U[p])return window.__U[p];const d=__D[p];if(!d)return p;const s=atob(d[1]),a=new Uint8Array(s.length);for(let i=0;i<s.length;i++)a[i]=s.charCodeAt(i);return (window.__U[p]=URL.createObjectURL(new Blob([a],{type:d[0]})));};`;

html = html
  .replace(/<meta http-equiv="Content-Security-Policy"[^>]*>/, `<meta http-equiv="Content-Security-Policy" content="default-src 'self'; base-uri 'none'; object-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; font-src data:; img-src data: blob:; media-src blob: data:; connect-src https://sahm-hamdeli.amirzaee123.chatgpt.site; form-action 'none'">`)
  .replace(/\s*<link rel="preload"[^>]*>/g, "")
  .replace(/\s*<meta property="og:image"[^>]*>/, "")
  .replace(/<link rel="stylesheet"[^>]*>/, `<style>\n${css}\n</style>`)
  .replace(/<script src="app\.js[^"]*" defer><\/script>/, "")
  .replace(/poster="(media\/[^"]+)"/g, (_, p) => `poster="data:${mime(p)};base64,${b64(p)}"`)
  .replace("</body>", `<script>\n${boot}\n${js}\n</script>\n</body>`);
fs.writeFileSync(outFile, html);
console.log(`${outFile} · ${(fs.statSync(outFile).size / 1048576).toFixed(1)} MB · ${media.length} media files inlined`);
