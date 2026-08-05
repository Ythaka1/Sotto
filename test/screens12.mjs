import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

/*
 * Step 5 behaviour. The things a screenshot cannot catch.
 *
 * Every assertion here is written so it can fail, and the ones where a vacuous
 * pass is easy report what they actually measured.
 */

const SP = process.env.SHOT_DIR ?? '/tmp/sotto-shots';
const BASE = process.env.BASE_URL ?? 'http://localhost:3210';
const URL = `${BASE}/f/the-aubrey?r=14`;
mkdirSync(`${SP}/shots`, { recursive: true });

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
let fails = 0;
const check = (label, ok, detail = '') => {
  if (!ok) fails++;
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${label}${detail ? '  ' + detail : ''}`);
};

const openQuestion = async (page) => {
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1100);
  await page.getByRole('button', { name: 'Start' }).click();
  await page.waitForTimeout(600);
};

// ---------------------------------------------------------------- state
{
  const p = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await openQuestion(p);

  const ta = p.locator('textarea');
  await ta.fill('The shower took ages to warm up.');
  await p.waitForTimeout(120);
  await p.getByRole('button', { name: 'Continue' }).click();
  await p.waitForTimeout(700);

  const q2 = await p.locator('h1').textContent();
  check('screen 2 reached', /When was it|worth knowing/.test(q2 ?? ''), JSON.stringify(q2));

  await p.locator('textarea').fill('This morning.');
  await p.waitForTimeout(120);

  // Back to screen 1: the answer must still be there.
  await p.getByRole('button', { name: 'Back' }).click();
  await p.waitForTimeout(700);
  const back1 = await p.locator('textarea').inputValue();
  check('back to screen 1 keeps the answer', back1 === 'The shower took ages to warm up.', JSON.stringify(back1));

  const caret = await p.evaluate(() => {
    const el = document.querySelector('textarea');
    return { start: el.selectionStart, end: el.selectionEnd, len: el.value.length, focused: document.activeElement === el };
  });
  check('cursor sits at the end', caret.start === caret.len && caret.end === caret.len, JSON.stringify(caret));
  check('field is focused on return', caret.focused === true);

  // Back again to screen 0.
  await p.getByRole('button', { name: 'Back' }).click();
  await p.waitForTimeout(700);
  const onArrival = await p.getByRole('button', { name: 'Start' }).count();
  check('back again reaches screen 0', onArrival === 1);

  // Forward again: screen 2 keeps its own text.
  await p.getByRole('button', { name: 'Start' }).click();
  await p.waitForTimeout(600);
  const again1 = await p.locator('textarea').inputValue();
  check('forward keeps screen 1 text', again1 === 'The shower took ages to warm up.', JSON.stringify(again1));
  await p.getByRole('button', { name: 'Continue' }).click();
  await p.waitForTimeout(700);
  const again2 = await p.locator('textarea').inputValue();
  check('forward keeps screen 2 text', again2 === 'This morning.', JSON.stringify(again2));
  await p.close();
}

// ---------------------------------------------------------------- chips
{
  const p = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await openQuestion(p);
  const ta = p.locator('textarea');

  await p.getByRole('button', { name: 'room comfort' }).click();
  await p.waitForTimeout(200);
  const afterChip = await ta.inputValue();
  check('chip fills the field', afterChip === 'The room was ', JSON.stringify(afterChip));

  const caret = await p.evaluate(() => {
    const el = document.querySelector('textarea');
    return el.selectionStart === el.value.length;
  });
  check('chip puts the cursor at the end', caret);

  // Second chip, guest has not typed: replaces.
  await p.getByRole('button', { name: 'breakfast' }).click();
  await p.waitForTimeout(200);
  const afterSecond = await ta.inputValue();
  check('second chip replaces before typing', afterSecond === 'Breakfast was ', JSON.stringify(afterSecond));

  // Now type, then try another chip: must be inert.
  await ta.click();
  await ta.press('End');
  await ta.type('cold');
  await p.waitForTimeout(200);
  const typed = await ta.inputValue();

  const inertAttr = await p.locator('[data-testid="chip"]').first().getAttribute('aria-disabled');
  check('chips report inert after typing', inertAttr === 'true', `aria-disabled=${inertAttr}`);

  await p.getByRole('button', { name: 'noise' }).click({ force: true });
  await p.waitForTimeout(250);
  const afterInert = await ta.inputValue();
  check('inert chip does not destroy typing', afterInert === typed, JSON.stringify({ before: typed, after: afterInert }));
  await p.close();
}

// ---------------------------------------------------------------- continue
{
  const p = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await openQuestion(p);
  const cont = p.getByRole('button', { name: 'Continue' });

  const disabled = await cont.evaluate((el) => ({
    aria: el.getAttribute('aria-disabled'),
    opacity: getComputedStyle(el).opacity,
    pointer: getComputedStyle(el).pointerEvents,
    describedby: el.getAttribute('aria-describedby'),
    tabbable: el.tabIndex >= 0,
  }));
  check('continue disabled at .4 opacity', Math.abs(Number(disabled.opacity) - 0.4) < 0.02, `opacity=${disabled.opacity}`);
  check('continue pointer-events none', disabled.pointer === 'none');
  check('continue aria-disabled true', disabled.aria === 'true');
  check('continue still in tab order', disabled.tabbable === true);
  check('continue describes why', !!disabled.describedby, String(disabled.describedby));

  const hint = await p.locator(`#${disabled.describedby}`).textContent();
  check('hint reads correctly', hint?.trim() === 'Add a few words to continue.', JSON.stringify(hint));
  const hidden = await p.locator(`#${disabled.describedby}`).evaluate((el) => {
    const r = el.getBoundingClientRect();
    return r.width <= 1 && r.height <= 1;
  });
  check('hint is visually hidden', hidden);

  // Clicking a disabled Continue must not advance.
  await cont.click({ force: true });
  await p.waitForTimeout(500);
  const stillQ1 = await p.locator('h1').textContent();
  check('disabled continue does not advance', /one small thing/.test(stillQ1 ?? ''));

  // With text, it goes live.
  await p.locator('textarea').fill('Breakfast was cold.');
  await p.waitForTimeout(350);
  const live = await cont.evaluate((el) => ({
    aria: el.getAttribute('aria-disabled'),
    opacity: getComputedStyle(el).opacity,
  }));
  check('continue goes live with text', live.aria === 'false' && Number(live.opacity) > 0.95, JSON.stringify(live));
  await p.close();
}

// ---------------------------------------------------------------- screen 2 send
{
  const p = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await openQuestion(p);
  await p.locator('textarea').fill('The room was slightly warm.');
  await p.getByRole('button', { name: 'Continue' }).click();
  await p.waitForTimeout(700);
  const send = p.getByRole('button', { name: 'Send privately' });
  const state = await send.evaluate((el) => ({
    aria: el.getAttribute('aria-disabled'),
    opacity: Number(getComputedStyle(el).opacity),
  }));
  check('screen 2 send is live while empty', state.aria === 'false' && state.opacity > 0.95, JSON.stringify(state));
  const empty = await p.locator('textarea').inputValue();
  check('screen 2 starts empty', empty === '', JSON.stringify(empty));
  await p.close();
}

// ---------------------------------------------------------------- severity branch
{
  for (const [answer, expect] of [
    ['The shower was broken and freezing.', /That should not have happened/],
    ['The room was slightly warm.', /Anything else worth knowing/],
  ]) {
    const p = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await openQuestion(p);
    await p.locator('textarea').fill(answer);
    await p.getByRole('button', { name: 'Continue' }).click();
    await p.waitForTimeout(700);
    const q = await p.locator('h1').textContent();
    check(`branch for "${answer.slice(0, 26)}"`, expect.test(q ?? ''), JSON.stringify(q));
    await p.close();
  }
}

// ---------------------------------------------------------------- chrome
{
  for (const w of [360, 390]) {
    const p = await browser.newPage({ viewport: { width: w, height: 844 }, deviceScaleFactor: 2 });
    await openQuestion(p);

    const ov = await p.evaluate(() => ({ s: document.documentElement.scrollWidth, c: document.documentElement.clientWidth }));
    check(`${w}px screen 1 no overflow`, ov.s <= ov.c, `${ov.s}/${ov.c}`);

    const fs = await p.locator('textarea').evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
    check(`${w}px textarea is 16px or more`, fs >= 16, `${fs}px`);

    const chevron = await p.getByRole('button', { name: 'Back' }).evaluate((el) => {
      const r = el.getBoundingClientRect();
      const plane = el.firstElementChild.getBoundingClientRect();
      return { tap: Math.round(Math.min(r.width, r.height)), plane: Math.round(plane.width) };
    });
    check(`${w}px chevron 44px target, 38px plane`, chevron.tap >= 44 && chevron.plane === 38, JSON.stringify(chevron));

    await p.screenshot({ path: `${SP}/shots/s1-${w}.png` });

    // Focused, so the lift is visible and measurable.
    const card = p.locator('[data-testid="question-card"]');
    const rest = await card.evaluate((el) => getComputedStyle(el).boxShadow);
    await p.locator('textarea').focus();
    await p.waitForTimeout(400);
    const lifted = await card.evaluate((el) => getComputedStyle(el).boxShadow);
    check(`${w}px focus lifts the card`, rest !== lifted);
    await p.screenshot({ path: `${SP}/shots/s1-${w}-focus.png` });

    await p.locator('textarea').fill('Breakfast was cold.');
    await p.getByRole('button', { name: 'Continue' }).click();
    await p.waitForTimeout(700);
    const ov2 = await p.evaluate(() => ({ s: document.documentElement.scrollWidth, c: document.documentElement.clientWidth }));
    check(`${w}px screen 2 no overflow`, ov2.s <= ov2.c, `${ov2.s}/${ov2.c}`);
    await p.screenshot({ path: `${SP}/shots/s2-${w}.png` });
    await p.close();
  }
}

// ---------------------------------------------------------------- chevron absence
{
  const p = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await p.goto(URL, { waitUntil: 'networkidle' });
  await p.waitForTimeout(1100);
  check('no chevron on screen 0', (await p.getByRole('button', { name: 'Back' }).count()) === 0);
  await p.getByRole('button', { name: 'Nothing to report' }).click();
  await p.waitForTimeout(700);
  check('no chevron on close', (await p.getByRole('button', { name: 'Back' }).count()) === 0);
  await p.close();
}

await browser.close();
console.log(fails === 0 ? '\nALL CHECKS PASSED' : `\n${fails} FAILED`);
process.exit(fails ? 1 : 0);
