import { chromium } from 'playwright';
import { createRequire } from 'node:module';

/*
 * The QR codes must decode to URLs that actually resolve.
 *
 * A code is the one artifact here that cannot be corrected after the fact. Once
 * it is printed and stuck to a folio, a wrong slug or a dropped room parameter
 * is a dead pilot, and nothing in the app would ever report it.
 *
 * So the codes are decoded rather than eyeballed, and the decoded URL is then
 * fetched to confirm the route answers.
 */

const jsQR = createRequire(import.meta.url)('jsqr').default;
const BASE = process.env.BASE_URL ?? 'http://localhost:3210';

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
let fails = 0;
const check = (label, ok, detail = '') => {
  if (!ok) fails++;
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${label}${detail ? '  ' + detail : ''}`);
};

const page = await browser.newPage({ viewport: { width: 1000, height: 1400 }, deviceScaleFactor: 3 });
await page.goto(`${BASE}/kitchen/qr`, { waitUntil: 'networkidle' });

const cells = page.locator('.cell');
const total = await cells.count();
check('sheet has one cell per room', total === 24, `${total} cells`);

const decode = async (index) => {
  const cell = cells.nth(index);
  const label = ((await cell.locator('p').textContent()) ?? '').trim();
  const shot = await cell.locator('svg').screenshot();
  const { data, w, h } = await page.evaluate(async (b64) => {
    const img = new Image();
    img.src = `data:image/png;base64,${b64}`;
    await img.decode();
    const c = document.createElement('canvas');
    c.width = img.width;
    c.height = img.height;
    const ctx = c.getContext('2d');
    /* The SVG has no background of its own, and a transparent quiet zone reads
       as black once flattened, which no scanner will accept. */
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.drawImage(img, 0, 0);
    const d = ctx.getImageData(0, 0, c.width, c.height);
    return { data: Array.from(d.data), w: c.width, h: c.height };
  }, shot.toString('base64'));
  const res = jsQR(Uint8ClampedArray.from(data), w, h);
  return { label, url: res?.data ?? null };
};

/* First, a middle one, and the last, which is the awkward non numeric room. */
for (const i of [0, 12, total - 1]) {
  const { label, url } = await decode(i);
  check(`${label} decodes`, !!url, url ?? 'undecodable');
  if (!url) continue;

  const parsed = new URL(url);
  const room = label.replace(/^Room\s+/i, '');
  check(`${label} carries its room`, parsed.searchParams.get('r') === room, `r=${parsed.searchParams.get('r')}`);
  check(`${label} points at a known property`, /^\/f\/(the-aubrey|aubrey)$/.test(parsed.pathname), parsed.pathname);

  /* The decisive check: the URL the printed code contains actually resolves. */
  const res = await page.request.get(`${BASE}${parsed.pathname}${parsed.search}`);
  check(`${label} URL resolves`, res.status() === 200, `HTTP ${res.status()}`);
}

/* Teeth: a URL with a slug that does not exist must not resolve, or the check
   above would pass for anything. */
const dead = await page.request.get(`${BASE}/f/not-a-property?r=14`);
check('unknown property 404s, so the resolve check means something', dead.status() === 404, `HTTP ${dead.status()}`);

await browser.close();
console.log(fails === 0 ? '\nALL CHECKS PASSED' : `\n${fails} FAILED`);
process.exit(fails ? 1 : 0);
