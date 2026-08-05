import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const SP = process.env.SHOT_DIR ?? '/tmp/sotto-shots';
const URL = 'http://localhost:3210/f/the-aubrey?r=14';
mkdirSync(`${SP}/shots`, { recursive: true });
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
let fails = 0;
const check = (label, ok, detail = '') => {
  if (!ok) fails++;
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${label}${detail ? '  ' + detail : ''}`);
};

// 1. No overflow, and every example fully visible, at the narrow bar.
for (const w of [360, 390, 430]) {
  const p = await b.newPage({ viewport: { width: w, height: 780 } });
  await p.goto(URL, { waitUntil: 'networkidle' });
  await p.waitForTimeout(1400);
  const r = await p.evaluate(() => ({
    s: document.documentElement.scrollWidth,
    c: document.documentElement.clientWidth,
  }));
  check(`${w}px no horizontal overflow`, r.s <= r.c, `${r.s}/${r.c}`);

  // Every example line must actually be on top at its own pixels.
  // A rotated card's getBoundingClientRect is an inflated axis aligned box, so
  // rectangle maths reports overlap the eye never sees. Hit test instead: sample
  // points across each line and ask the document what is painted there.
  const occlusion = await p.evaluate(() => {
    const lines = [...document.querySelectorAll('main p')].filter((n) =>
      n.className.includes('t-example') || n.className.includes('t-label'));
    const bad = [];
    let sampled = 0;
    for (const line of lines) {
      // getBoundingClientRect on a rotated element is an inflated axis aligned
      // box, so sampling it lands outside the glyphs. Rebuild the true rotated
      // quad instead: the rect's centre is the transformed centre under pure
      // rotation, and offsetWidth/offsetHeight give the untransformed size.
      // (getBoxQuads, which would do this directly, is not in this Chromium.)
      const card = line.closest('[style*="border-radius"]');
      const m = new DOMMatrix(getComputedStyle(card ?? line).transform);
      const theta = Math.atan2(m.b, m.a);
      const dir = { x: Math.cos(theta), y: Math.sin(theta) };
      const perp = { x: -Math.sin(theta), y: Math.cos(theta) };
      const r = line.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const hw = line.offsetWidth / 2;
      const hh = line.offsetHeight / 2;
      if (hw === 0 || hh === 0) continue;

      let hidden = 0, total = 0;
      for (let u = -0.9; u <= 0.9; u += 0.15) {
        for (const v of [-0.45, 0.45]) {
          const x = cx + dir.x * u * hw + perp.x * v * hh;
          const y = cy + dir.y * u * hw + perp.y * v * hh;
          const hit = document.elementFromPoint(x, y);
          total++;
          if (hit && hit !== line && !line.contains(hit)) hidden++;
        }
      }
      sampled += total;
      if (hidden > 0) bad.push(`"${(line.textContent || '').slice(0, 24)}" ${hidden}/${total} covered`);
    }
    // A loop that silently sampled nothing would pass forever.
    if (sampled === 0) bad.push('VACUOUS: no points sampled');
    return bad;
  });
  check(`${w}px example text not occluded`, occlusion.length === 0, occlusion.join('; '));
  await p.close();
}

// 2. The quiet exit reaches the close screen.
const p2 = await b.newPage({ viewport: { width: 390, height: 844 } });
await p2.goto(URL, { waitUntil: 'networkidle' });
await p2.waitForTimeout(1200);
await p2.getByRole('button', { name: 'Nothing to report' }).click();
await p2.waitForTimeout(600);
const closed = await p2.textContent('main');
check('quiet exit reaches Safe travels', /Safe travels/.test(closed ?? ''), JSON.stringify(closed?.trim().slice(0, 40)));

// 3. Reduced motion: everything is present and settled with no wait.
const p3 = await b.newPage({ viewport: { width: 390, height: 844 } });
await p3.emulateMedia({ reducedMotion: 'reduce' });
await p3.goto(URL, { waitUntil: 'networkidle' });
await p3.waitForTimeout(120); // deliberately shorter than any real delay
const rm = await p3.evaluate(() => {
  const q = document.querySelector('h1');
  const btn = document.querySelector('button');
  const cs = q ? getComputedStyle(q) : null;
  return {
    heading: q?.textContent ?? '',
    headingOpacity: cs ? Number(cs.opacity) : 0,
    transform: cs?.transform ?? '',
    buttonVisible: btn ? Number(getComputedStyle(btn).opacity) : 0,
  };
});
check('reduced motion: heading settled at 120ms', rm.headingOpacity === 1, `opacity=${rm.headingOpacity}`);
check('reduced motion: no residual offset', rm.transform === 'none' || /matrix\(1, 0, 0, 1, 0, 0\)/.test(rm.transform), rm.transform);
await p3.screenshot({ path: `${SP}/shots/screen0-reduced.png` });

// 4. Focus order and visible ring.
const p4 = await b.newPage({ viewport: { width: 390, height: 844 } });
await p4.goto(URL, { waitUntil: 'networkidle' });
await p4.waitForTimeout(1200);
const order = [];
for (let i = 0; i < 3; i++) {
  await p4.keyboard.press('Tab');
  order.push(await p4.evaluate(() => {
    const el = document.activeElement;
    const cs = getComputedStyle(el);
    return `${el.tagName}:${(el.textContent || '').trim().slice(0, 22)}|outline=${cs.outlineWidth} ${cs.outlineStyle}`;
  }));
}
console.log('  tab order:', order.join('  ->  '));
check('first two stops are Start then the exit',
  /Start/.test(order[0]) && /Nothing to report/.test(order[1]));
check('focus ring visible on both', order.slice(0, 2).every((o) => /outline=2px solid/.test(o)));

await b.close();
console.log(fails === 0 ? '\nALL CHECKS PASSED' : `\n${fails} FAILED`);
process.exit(fails ? 1 : 0);
