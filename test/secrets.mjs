import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

/*
 * No server secret may reach the browser.
 *
 * Checked against the built client bundle rather than assumed from where the
 * import sits. A single accidental import of lib/supabase into a 'use client'
 * file would inline the service role key into JavaScript served to every guest,
 * and nothing else in the build would complain.
 */

const ROOT = '.next';
let fails = 0;
const check = (label, ok, detail = '') => {
  if (!ok) fails++;
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${label}${detail ? '  ' + detail : ''}`);
};

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    const s = statSync(p);
    if (s.isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

/* Everything the browser can download. */
const clientFiles = walk(join(ROOT, 'static')).filter((f) => f.endsWith('.js') || f.endsWith('.css'));
check('client bundle found', clientFiles.length > 0, `${clientFiles.length} files`);

const blob = clientFiles.map((f) => readFileSync(f, 'utf8')).join('\n');

/* Names first: the literal env identifiers must not survive into client code. */
const forbiddenNames = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_URL',
  'GROQ_API_KEY',
  'RESEND_API_KEY',
  'MANAGER_EMAIL',
];
for (const name of forbiddenNames) {
  check(`no ${name} in client bundle`, !blob.includes(name));
}

/* Then shapes, so a key leaks even under a different name. Supabase service
   role keys are JWTs and always begin with this header. Groq and Resend keys
   carry fixed prefixes. */
const forbiddenShapes = [
  ['supabase service role JWT', /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9/],
  ['groq key prefix', /\bgsk_[A-Za-z0-9]{20,}/],
  ['resend key prefix', /\bre_[A-Za-z0-9]{20,}/],
  ['supabase host', /[a-z0-9]{20}\.supabase\.co/],
];
for (const [label, re] of forbiddenShapes) {
  const hit = blob.match(re);
  check(`no ${label} in client bundle`, !hit, hit ? String(hit[0]).slice(0, 24) : '');
}

/* Teeth. The scan must be capable of finding something in this blob at all. A
   pass proves nothing if the haystack was never read. */
check('scan has teeth: finds a known present string', blob.includes('Sealed.'), `${Math.round(blob.length / 1024)}kb scanned`);

console.log(fails === 0 ? '\nALL CHECKS PASSED' : `\n${fails} FAILED`);
process.exit(fails ? 1 : 0);
