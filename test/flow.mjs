import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

/*
 * Step 7. The undo window, the commit, and the promise that no guest ever sees
 * an error.
 *
 * These are the assertions that matter most and are hardest to see: whether
 * anything was written, and when.
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

/** Watches both routes and records every call, without letting them do real work. */
async function instrument(page, { verdict } = {}) {
  const calls = { verdict: [], commit: [] };

  await page.route('**/api/verdict', async (route) => {
    calls.verdict.push(JSON.parse(route.request().postData() ?? '{}'));
    if (verdict === 'hang') {
      /* Longer than the recovery offer's budget, so the fallback must carry it. */
      await new Promise((r) => setTimeout(r, 9000));
      return route.abort();
    }
    if (verdict === 'offline') return route.abort('internetdisconnected');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        verdict: verdict ?? { severity: 'minor', theme: 'test', summary: 's', recoverable: false },
        source: 'model',
      }),
    });
  });

  await page.route('**/api/commit', async (route) => {
    calls.commit.push(JSON.parse(route.request().postData() ?? '{}'));
    await route.fulfill({ status: 204, body: '' });
  });

  return calls;
}

const reachSeal = async (page, answer) => {
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1100);
  await page.getByRole('button', { name: 'Start' }).click();
  await page.waitForTimeout(500);
  await page.locator('textarea').fill(answer);
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.waitForTimeout(600);
  await page.getByRole('button', { name: 'Send privately' }).click();
};

// ------------------------------------------------------------- undo writes nothing
{
  const p = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const calls = await instrument(p);
  await reachSeal(p, 'The shower was broken and freezing.');

  await p.waitForTimeout(2600);
  check('verdict called once on the press', calls.verdict.length === 1, `${calls.verdict.length} calls`);
  check('nothing committed before undo', calls.commit.length === 0, `${calls.commit.length} calls`);

  await p.getByRole('button', { name: 'Undo' }).click();
  await p.waitForTimeout(1000);

  const back = await p.locator('textarea').inputValue();
  check('undo returns to the answer, intact', back === 'The shower was broken and freezing.', JSON.stringify(back));

  /* Well past the window that would otherwise have committed. */
  await p.waitForTimeout(7000);
  check('undo writes nothing, ever', calls.commit.length === 0, `${calls.commit.length} calls`);
  await p.close();
}

// ------------------------------------------------------------- the window closes
{
  const p = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const calls = await instrument(p);
  await reachSeal(p, 'The room was slightly warm.');

  await p.waitForTimeout(4000);
  check('still uncommitted mid window', calls.commit.length === 0, `${calls.commit.length} at 4s`);

  await p.waitForTimeout(6000);
  check('commits when the window closes', calls.commit.length === 1, `${calls.commit.length} at 10s`);

  const body = calls.commit[0] ?? {};
  check('commit carries the room', body.room === '14', JSON.stringify(body.room));
  check('commit carries the verbatim answer', body.answer === 'The room was slightly warm.');
  check('commit carries the property', body.propertySlug === 'the-aubrey', String(body.propertySlug));
  const closing = await p.textContent('main');
  check('lands on the close screen', /Safe travels/.test(closing ?? ''));
  await p.close();
}

// ------------------------------------------------------------- recovery, serious only
{
  const p = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const calls = await instrument(p, {
    verdict: { severity: 'serious', theme: 'hot water', summary: 's', recoverable: true },
  });
  await reachSeal(p, 'The shower was broken and freezing.');
  await p.waitForTimeout(3000);

  const offer = p.locator('[data-testid="recovery-offer"]');
  check('serious shows the recovery offer', (await offer.count()) === 1);
  const text = await offer.textContent();
  check('offer names the duty manager', /Daniel/.test(text ?? ''), JSON.stringify(text?.slice(0, 60)));
  await p.screenshot({ path: `${SP}/shots/recovery.png` });

  await p.getByRole('button', { name: 'Yes, please' }).click();
  await p.waitForTimeout(900);
  check('answering commits immediately', calls.commit.length === 1, `${calls.commit.length} calls`);
  check('recovery recorded as requested', calls.commit[0]?.recoveryRequested === true);
  await p.close();
}

{
  const p = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await instrument(p, { verdict: { severity: 'minor', theme: 'breakfast', summary: 's', recoverable: false } });
  await reachSeal(p, 'Breakfast could be a little earlier.');
  await p.waitForTimeout(3200);
  check('minor shows no recovery offer', (await p.locator('[data-testid="recovery-offer"]').count()) === 0);
  await p.close();
}

// ------------------------------------------------------------- declined is recorded
{
  const p = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const calls = await instrument(p, {
    verdict: { severity: 'serious', theme: 'hot water', summary: 's', recoverable: true },
  });
  await reachSeal(p, 'The shower was broken.');
  await p.waitForTimeout(3000);
  await p.getByRole('button', { name: 'No thank you' }).click();
  await p.waitForTimeout(900);
  check('declined recorded as false, not null', calls.commit[0]?.recoveryRequested === false, JSON.stringify(calls.commit[0]?.recoveryRequested));
  await p.close();
}

// ------------------------------------------------------------- the quiet exit
{
  const p = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const calls = await instrument(p);
  await p.goto(URL, { waitUntil: 'networkidle' });
  await p.waitForTimeout(1100);
  await p.getByRole('button', { name: 'Nothing to report' }).click();
  await p.waitForTimeout(1200);

  check('quiet exit writes a row', calls.commit.length === 1, `${calls.commit.length} calls`);
  check('quiet exit calls no model', calls.verdict.length === 0, `${calls.verdict.length} calls`);
  const row = calls.commit[0] ?? {};
  check('quiet exit severity is none', row.verdict?.severity === 'none', JSON.stringify(row.verdict?.severity));
  check('quiet exit answer is null', row.answer === null, JSON.stringify(row.answer));
  check('quiet exit room still recorded', row.room === '14', JSON.stringify(row.room));
  await p.close();
}

// ---------------------------------------------- the guest never sees an error
{
  for (const [label, mode] of [['offline', 'offline'], ['hanging', 'hang']]) {
    const p = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
    const errors = [];
    p.on('pageerror', (e) => errors.push(e.message));
    await instrument(p, { verdict: mode });
    await reachSeal(p, 'The shower was broken and freezing.');
    await p.waitForTimeout(4000);

    const body = (await p.textContent('main')) ?? '';
    check(`${label}: seal still completes`, /Sealed\. Only the manager reads this\./.test(body));
    check(`${label}: no error word anywhere on screen`, !/error|failed|sorry|try again|problem|offline/i.test(body), JSON.stringify(body.slice(0, 70)));
    check(`${label}: no uncaught page error`, errors.length === 0, errors[0] ?? '');
    check(`${label}: recovery still offered from the heuristic`, (await p.locator('[data-testid="recovery-offer"]').count()) === 1);
    if (label === 'offline') await p.screenshot({ path: `${SP}/shots/offline-seal.png` });
    await p.close();
  }
}

// ---------------------------------------------- commit survives the tab closing
{
  const p = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const calls = await instrument(p);
  await reachSeal(p, 'The room was slightly warm.');
  await p.waitForTimeout(2600);

  const usesBeacon = await p.evaluate(() => typeof navigator.sendBeacon === 'function');
  check('sendBeacon is the transport available', usesBeacon);

  await p.waitForTimeout(7000);
  check('commit landed', calls.commit.length === 1, `${calls.commit.length}`);
  await p.close();
}

await browser.close();
console.log(fails === 0 ? '\nALL CHECKS PASSED' : `\n${fails} FAILED`);
process.exit(fails ? 1 : 0);
