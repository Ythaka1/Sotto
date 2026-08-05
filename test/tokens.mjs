import { chromium } from 'playwright';

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
let fails = 0;
const check = (label, actual, expect) => {
  const ok = String(actual).replace(/\s+/g, ' ').trim() === expect;
  if (!ok) fails++;
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${label.padEnd(34)} ${actual}`);
  if (!ok) console.log(`      expected: ${expect}`);
};

const page = await browser.newPage({ viewport: { width: 360, height: 780 } });
await page.goto('http://localhost:3210/kitchen', { waitUntil: 'networkidle' });

// 1. No horizontal overflow at 360px. The bar requires it.
const o = await page.evaluate(() => ({
  s: document.documentElement.scrollWidth,
  c: document.documentElement.clientWidth,
}));
check('360px no horizontal overflow', o.s <= o.c, 'true');

// 2. Every token resolves on :root.
const tokens = await page.evaluate(() => {
  const cs = getComputedStyle(document.documentElement);
  const names = ['--ground', '--plane', '--ink', '--muted', '--seal',
    '--shadow-rest', '--shadow-lift', '--shadow-fly',
    '--radius-card', '--radius-small', '--radius-pill',
    '--ease-standard', '--ease-spring', '--font-sans',
    '--duration-standard', '--duration-spring', '--duration-seal', '--stagger'];
  return names.map(n => [n, cs.getPropertyValue(n).trim()]);
});
console.log('\n-- tokens on :root');
for (const [n, v] of tokens) {
  if (!v) { fails++; console.log(`FAIL  ${n} is EMPTY`); }
  else console.log(`ok    ${n.padEnd(22)} ${v.slice(0, 72)}`);
}

// 3. Every utility compiles to a real value, not a transparent no-op.
console.log('\n-- compiled utilities');
const u = await page.evaluate(() => {
  const g = (sel, prop) => {
    const el = document.querySelector(sel);
    return el ? getComputedStyle(el)[prop] : 'NO ELEMENT: ' + sel;
  };
  return {
    bgPlane: g('.bg-plane', 'backgroundColor'),
    bgSeal: g('.bg-seal', 'backgroundColor'),
    textMuted: g('.text-muted', 'color'),
    shRest: g('.shadow-rest', 'boxShadow'),
    shLift: g('.shadow-lift', 'boxShadow'),
    shFly: g('.shadow-fly', 'boxShadow'),
    rCard: g('.rounded-card', 'borderTopLeftRadius'),
    rSmall: g('.rounded-small', 'borderTopLeftRadius'),
    rPill: g('.rounded-pill', 'borderTopLeftRadius'),
    eStd: g('.ease-standard', 'transitionTimingFunction'),
    eSpr: g('.ease-spring', 'transitionTimingFunction'),
  };
});
check('bg-plane', u.bgPlane, 'rgb(250, 250, 249)');
check('bg-seal', u.bgSeal, 'rgb(46, 71, 57)');
check('text-muted', u.textMuted, 'rgb(110, 112, 117)');
// Tailwind v4 prepends four transparent placeholder layers (ring, ring offset,
// inset shadow, inset ring) to every box-shadow. That is expected, so assert on
// the tail rather than the whole string.
const tail = (s) => s.replace(/^(rgba\(0, 0, 0, 0\) 0px 0px 0px 0px, )+/, '');
check('shadow-rest', tail(u.shRest), 'rgba(28, 22, 18, 0.04) 0px 1px 2px 0px, rgba(28, 22, 18, 0.08) 0px 12px 32px -8px');
check('shadow-lift', tail(u.shLift), 'rgba(28, 22, 18, 0.05) 0px 1px 2px 0px, rgba(28, 22, 18, 0.16) 0px 28px 56px -12px');
check('shadow-fly', tail(u.shFly), 'rgba(28, 22, 18, 0.05) 0px 2px 4px 0px, rgba(28, 22, 18, 0.22) 0px 30px 60px -12px');
check('rounded-card', u.rCard, '28px');
check('rounded-small', u.rSmall, '22px');
check('rounded-pill', u.rPill, '999px');
check('ease-standard', u.eStd, 'cubic-bezier(0.22, 1, 0.36, 1)');
check('ease-spring', u.eSpr, 'cubic-bezier(0.34, 1.56, 0.64, 1)');

// 4. Reduced motion collapses durations to 1ms and stagger to 0.
console.log('\n-- reduced motion');
const rm = await browser.newPage({ viewport: { width: 900, height: 900 } });
await rm.emulateMedia({ reducedMotion: 'reduce' });
await rm.goto('http://localhost:3210/kitchen', { waitUntil: 'networkidle' });
const r = await rm.evaluate(() => {
  const cs = getComputedStyle(document.documentElement);
  return ['--duration-standard', '--duration-spring', '--duration-seal', '--stagger']
    .map(n => [n, cs.getPropertyValue(n).trim()]);
});
for (const [n, v] of r) check(n, v, n === '--stagger' ? '0s' : '1ms');

// 5. Focus is visible, never removed.
console.log('\n-- focus');
await page.goto('http://localhost:3210/', { waitUntil: 'networkidle' });
await page.keyboard.press('Tab');
const focus = await page.evaluate(() => {
  const el = document.activeElement;
  const cs = getComputedStyle(el);
  return { tag: el.tagName, width: cs.outlineWidth, style: cs.outlineStyle, color: cs.outlineColor };
});
check('focused outline width', focus.width, '2px');
check('focused outline style', focus.style, 'solid');
check('focused outline colour', focus.color, 'rgb(23, 24, 26)');

// 6. Font actually loaded.
const fam = await page.evaluate(() => [...new Set([...document.fonts].map(f => f.family))].join(', '));
console.log(`\nloaded families: ${fam}`);

await browser.close();
console.log(fails === 0 ? '\nALL CHECKS PASSED' : `\n${fails} CHECK(S) FAILED`);
process.exit(fails === 0 ? 0 : 1);
