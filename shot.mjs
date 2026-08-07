import { chromium } from 'playwright';
import fs from 'fs';

const b64 = f => fs.readFileSync(f).toString('base64');
const I = 'node_modules/@fontsource-variable/inter/files/';
const M = 'node_modules/@fontsource-variable/jetbrains-mono/files/';
const U = 'node_modules/@fontsource-variable/unbounded/files/';
const face = (fam, file) =>
  `@font-face{font-family:'${fam}';src:url(data:font/woff2;base64,${b64(file)}) format('woff2-variations');font-weight:100 900;font-display:block}`;
const fontCss = [
  face('Inter', I + 'inter-latin-wght-normal.woff2'),
  face('Inter', I + 'inter-cyrillic-wght-normal.woff2'),
  face('JetBrains Mono', M + 'jetbrains-mono-latin-wght-normal.woff2'),
  face('JetBrains Mono', M + 'jetbrains-mono-cyrillic-wght-normal.woff2'),
  face('Unbounded', U + 'unbounded-latin-wght-normal.woff2'),
  face('Unbounded', U + 'unbounded-cyrillic-wght-normal.woff2'),
].join('\n');

const W = Number(process.env.W || 1440);
const H = Number(process.env.H || 900);

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await b.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 2 });
const errs = [];
p.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
await p.goto('http://localhost:4173/', { waitUntil: 'domcontentloaded' });
await p.addStyleTag({ content: fontCss });
await p.waitForTimeout(1500);

const h = await p.evaluate(() => document.body.scrollHeight);
for (let i = 0; i < Math.ceil(h / 500); i++) {
  await p.mouse.wheel(0, 500);
  await p.waitForTimeout(140);
}
await p.waitForTimeout(1500);

const audit = await p.evaluate(() => {
  const stuck = [...document.querySelectorAll('body *')]
    .filter(e => +getComputedStyle(e).opacity < 0.95 && e.textContent.trim().length > 3)
    .map(e => ({ o: +(+getComputedStyle(e).opacity).toFixed(2), t: e.textContent.trim().slice(0, 28) }));
  const sizes = {};
  document.querySelectorAll('body *').forEach(e => {
    if (![...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim().length > 1)) return;
    if (!e.getBoundingClientRect().width) return;
    const s = Math.round(parseFloat(getComputedStyle(e).fontSize));
    sizes[s] = (sizes[s] || 0) + 1;
  });
  return {
    y: Math.round(scrollY),
    stuckCount: stuck.length,
    stuck: stuck.slice(0, 6),
    sizes,
    docW: document.documentElement.scrollWidth,
    vw: innerWidth,
    docH: document.body.scrollHeight,
  };
});
console.log(JSON.stringify({ audit, errs: errs.slice(0, 4) }, null, 1));

await p.evaluate(() => {
  document.documentElement.style.scrollBehavior = 'auto';
});
const shots = process.env.SHOTS ? JSON.parse(process.env.SHOTS) : [];
for (const [n, y] of shots) {
  await p.evaluate(v => scrollTo(0, v), y);
  await p.waitForTimeout(400);
  await p.screenshot({ path: `/tmp/s-${n}.png` });
}
await b.close();
