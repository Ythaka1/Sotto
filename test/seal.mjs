import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

/*
 * Step 6. The three facts a screenshot will not catch.
 *
 * Every assertion here is paired with a teeth check that deliberately breaks the
 * thing being asserted and confirms the assertion notices. An assertion about a
 * visual illusion is very easy to write vacuously, and a green that cannot go
 * red is worse than no test at all.
 */

const SP = process.env.SHOT_DIR ?? '/tmp/sotto-shots';
const BASE = process.env.BASE_URL ?? 'http://localhost:3210';
mkdirSync(`${SP}/shots`, { recursive: true });

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
let fails = 0;
const check = (label, ok, detail = '') => {
  if (!ok) fails++;
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${label}${detail ? '  ' + detail : ''}`);
};

/*
 * Paint order, resolved properly.
 *
 * Comparing z-index strings is not enough: z-index only orders siblings inside
 * the same stacking context, so two elements reading "1" and "2" can still paint
 * in the opposite order if their ancestors differ. This walks both elements up
 * to their common ancestor and compares the pair of ancestors that actually
 * decide, using z-index first and document order as the tie break.
 */
const PAINT_ORDER = `(a, b) => {
  const chain = (el) => { const c = []; for (let n = el; n; n = n.parentElement) c.unshift(n); return c; };
  const ca = chain(a), cb = chain(b);
  let i = 0;
  while (i < ca.length && i < cb.length && ca[i] === cb[i]) i++;
  const na = ca[i], nb = cb[i];
  if (!na || !nb) return { verdict: 'nested', za: null, zb: null };
  const z = (el) => { const v = getComputedStyle(el).zIndex; return v === 'auto' ? 0 : Number(v); };
  const za = z(na), zb = z(nb);
  if (za !== zb) return { verdict: za < zb ? 'a-under-b' : 'a-over-b', za, zb };
  const order = na.compareDocumentPosition(nb) & Node.DOCUMENT_POSITION_FOLLOWING;
  return { verdict: order ? 'a-under-b' : 'a-over-b', za, zb };
}`;

const readOrder = (page) =>
  page.evaluate(
    ([fn]) => {
      const note = document.querySelector('[data-testid="note"]');
      const lip = document.querySelector('[data-testid="pocket-front"]');
      if (!note || !lip) return { verdict: 'missing', note: !!note, lip: !!lip };
      return eval(`(${fn})`)(note, lip);
    },
    [PAINT_ORDER],
  );

// ------------------------------------------------------- 1. z-order, every frame
{
  const p = await browser.newPage({ viewport: { width: 420, height: 900 } });
  await p.goto(`${BASE}/kitchen?slow=6`, { waitUntil: 'networkidle' });
  await p.locator('[data-testid="note"]').scrollIntoViewIfNeeded();

  const samples = [];
  const start = Date.now();
  // Across the whole 2.2s arc, stretched by 6.
  while (Date.now() - start < 2300 * 6) {
    samples.push(await readOrder(p));
    await p.waitForTimeout(400);
  }
  const bad = samples.filter((s) => s.verdict !== 'a-under-b');
  check(
    `z-order: note under lip at every frame (${samples.length} samples)`,
    samples.length > 10 && bad.length === 0,
    bad.length ? JSON.stringify(bad[0]) : `all ${samples.length} sampled`,
  );

  // Teeth: force the flip and confirm the assertion notices.
  await p.evaluate(() => {
    document.querySelector('[data-testid="note"]').style.zIndex = '9';
  });
  const flipped = await readOrder(p);
  check('z-order assertion has teeth', flipped.verdict === 'a-over-b', JSON.stringify(flipped));
  await p.close();
}

// ------------------------------------------ 2. the note ends inside the pocket
{
  const p = await browser.newPage({ viewport: { width: 420, height: 900 } });
  await p.goto(`${BASE}/kitchen`, { waitUntil: 'networkidle' });
  await p.locator('[data-testid="note"]').scrollIntoViewIfNeeded();
  await p.waitForTimeout(2600);

  const geom = await p.evaluate(() => {
    const r = (s) => {
      const b = document.querySelector(`[data-testid="${s}"]`).getBoundingClientRect();
      return { top: b.top, bottom: b.bottom, left: b.left, right: b.right };
    };
    return { note: r('note'), pocket: r('pocket-back') };
  });
  const inside =
    geom.note.bottom <= geom.pocket.bottom + 1 &&
    geom.note.top >= geom.pocket.top - 1 &&
    geom.note.left >= geom.pocket.left - 1 &&
    geom.note.right <= geom.pocket.right + 1;
  check(
    'note ends inside the pocket footprint',
    inside,
    `note ${Math.round(geom.note.top)}..${Math.round(geom.note.bottom)}  pocket ${Math.round(geom.pocket.top)}..${Math.round(geom.pocket.bottom)}`,
  );

  // Teeth: push the note below the pocket and confirm it is caught.
  await p.evaluate(() => {
    document.querySelector('[data-testid="note"]').style.transform = 'translateY(400px)';
  });
  await p.waitForTimeout(120);
  const after = await p.evaluate(() => {
    const n = document.querySelector('[data-testid="note"]').getBoundingClientRect();
    const k = document.querySelector('[data-testid="pocket-back"]').getBoundingClientRect();
    return n.bottom <= k.bottom + 1;
  });
  check('footprint assertion has teeth', after === false);
  await p.close();
}

// ------------------------------------------------------- 3. reduced motion
{
  const p = await browser.newPage({ viewport: { width: 420, height: 900 } });
  await p.emulateMedia({ reducedMotion: 'reduce' });
  await p.goto(`${BASE}/kitchen`, { waitUntil: 'networkidle' });
  await p.locator('[data-testid="note"]').scrollIntoViewIfNeeded();
  // Deliberately far shorter than the real arc.
  await p.waitForTimeout(150);

  const rm = await p.evaluate(() => {
    const note = document.querySelector('[data-testid="note"]').getBoundingClientRect();
    const pocket = document.querySelector('[data-testid="pocket-back"]').getBoundingClientRect();
    const mark = document.querySelector('[data-testid="mark"]');
    return {
      noteInside: note.bottom <= pocket.bottom + 1 && note.top >= pocket.top - 1,
      markPresent: !!mark,
      markOpacity: mark ? Number(getComputedStyle(mark).opacity) : 0,
      ringInDom: !!document.querySelector('[data-testid="ring"]'),
    };
  });
  check('reduced motion: note already inside the pocket at 150ms', rm.noteInside);
  check('reduced motion: mark present and visible', rm.markPresent && rm.markOpacity > 0.95, `opacity=${rm.markOpacity}`);
  check('reduced motion: ring absent from the DOM, not merely instant', rm.ringInDom === false);
  await p.screenshot({ path: `${SP}/shots/seal-reduced.png` });
  await p.close();

  // Teeth: without the reduce preference the ring must exist, or the check above
  // would pass for the wrong reason.
  const q = await browser.newPage({ viewport: { width: 420, height: 900 } });
  await q.goto(`${BASE}/kitchen?slow=6`, { waitUntil: 'networkidle' });
  await q.locator('[data-testid="note"]').scrollIntoViewIfNeeded();
  await q.waitForTimeout(1500);
  const ringNormally = await q.evaluate(() => !!document.querySelector('[data-testid="ring"]'));
  check('ring assertion has teeth: ring exists without the preference', ringNormally === true);
  await q.close();
}

// ------------------------------------ nothing claims to be sealed before it is
{
  const SLOW = 6;
  const p = await browser.newPage({ viewport: { width: 420, height: 900 } });
  await p.goto(`${BASE}/kitchen?slow=${SLOW}`, { waitUntil: 'networkidle' });
  await p.locator('[data-testid="note"]').scrollIntoViewIfNeeded();
  await p.getByRole('button', { name: 'Replay' }).click();

  const opacities = async () =>
    p.evaluate(() => ({
      line: Number(getComputedStyle(document.querySelector('[data-testid="sealed-line"]')).opacity),
      mark: Number(getComputedStyle(document.querySelector('[data-testid="mark"]')).opacity),
    }));

  // Row 3.7 puts the line at 1460ms and row 3.5 the mark at 1120ms. Sample
  // safely before each.
  await p.waitForTimeout(900 * SLOW);
  const early = await opacities();
  check('sealed line still hidden at 900ms', early.line < 0.05, `opacity=${early.line}`);
  check('mark still hidden at 900ms', early.mark < 0.05, `opacity=${early.mark}`);

  await p.waitForTimeout(1300 * SLOW);
  const late = await opacities();
  check('sealed line and mark are up by 2200ms', late.line > 0.95 && late.mark > 0.95, JSON.stringify(late));
  await p.close();
}

// ------------------------------------------------------- the sequence seam
{
  const p = await browser.newPage({ viewport: { width: 420, height: 900 } });
  const errors = [];
  p.on('pageerror', (e) => errors.push(e.message));
  await p.goto(`${BASE}/kitchen`, { waitUntil: 'networkidle' });
  check('css closure renders without error', errors.length === 0, errors[0] ?? '');
  await p.close();
}

await browser.close();
console.log(fails === 0 ? '\nALL CHECKS PASSED' : `\n${fails} FAILED`);
process.exit(fails ? 1 : 0);
