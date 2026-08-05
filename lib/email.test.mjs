import { test } from 'node:test';
import assert from 'node:assert/strict';
import { subject, textBody, htmlBody } from './email.compiled.mjs';

const base = {
  propertyName: 'The Aubrey',
  room: '14',
  answer: 'The shower took about ten minutes to warm up and I gave up waiting.',
  followUpQuestion: 'That should not have happened. When was it?',
  followUpAnswer: 'This morning, and yesterday too.',
  verdict: { severity: 'serious', theme: 'shower ran cold', summary: 'x', recoverable: true },
  recoveryRequested: null,
  at: new Date('2026-08-05T11:42:00Z'),
  timeZone: 'UTC',
};

test('subject names the property when nobody is waiting', () => {
  assert.equal(subject(base), 'The Aubrey, room 14: shower ran cold');
});

test('subject leads with Guest waiting only when recovery was requested', () => {
  assert.equal(
    subject({ ...base, recoveryRequested: true }),
    'Guest waiting, room 14: shower ran cold',
  );
  assert.equal(
    subject({ ...base, recoveryRequested: false }),
    'The Aubrey, room 14: shower ran cold',
  );
});

test('subject drops the room clause rather than asserting an absence', () => {
  const s = subject({ ...base, room: null });
  assert.equal(s, 'The Aubrey: shower ran cold');
  assert.ok(!/not given|unknown|n\/a|none/i.test(s));
});

test('the guest words appear verbatim and are never cleaned up', () => {
  const messy = 'the shower NEVER got hot!! i waited ten mins';
  const body = textBody({ ...base, answer: messy });
  assert.ok(body.includes(messy), 'verbatim answer missing');
  const html = htmlBody({ ...base, answer: messy });
  assert.ok(html.includes('the shower NEVER got hot!! i waited ten mins'));
});

test('the summary never replaces the guest words in the body', () => {
  const body = textBody({
    ...base,
    verdict: { ...base.verdict, summary: 'The guest raised hot water at checkout.' },
  });
  assert.ok(!body.includes('The guest raised hot water at checkout.'));
  assert.ok(body.includes(base.answer));
});

test('the email never apologises or recommends action', () => {
  const body = textBody({ ...base, recoveryRequested: true });
  const html = htmlBody({ ...base, recoveryRequested: true });
  for (const s of [body, html]) {
    assert.ok(!/sorry|apolog|regret|unfortunate/i.test(s), 'apology found');
    assert.ok(!/you should|we recommend|suggest|please ensure|action required/i.test(s), 'advice found');
  }
});

test('recovery line states the three states correctly', () => {
  assert.match(textBody({ ...base, recoveryRequested: true }), /Recovery {5}Requested\./);
  assert.match(textBody({ ...base, recoveryRequested: false }), /Recovery {5}Offered and declined\./);
  assert.ok(!/Recovery/.test(textBody({ ...base, recoveryRequested: null })));
});

test('room, checkout and time lead the body', () => {
  assert.match(textBody(base), /^Room 14, checkout, 11:42/);
  assert.match(textBody({ ...base, room: null }), /^checkout, 11:42/);
});

test('no em dashes anywhere in the email', () => {
  for (const s of [subject(base), textBody(base), htmlBody(base)]) {
    assert.ok(!s.includes('—'), 'em dash found');
  }
});

test('no tracking pixel, no images, no unsubscribe furniture', () => {
  const html = htmlBody(base);
  assert.ok(!/<img/i.test(html), 'image found');
  assert.ok(!/unsubscribe/i.test(html));
  assert.ok(!/https?:\/\//.test(html), 'external URL found');
});

test('html is table based so it survives Outlook', () => {
  const html = htmlBody(base);
  assert.ok(/<table/i.test(html));
  assert.ok(!/display:\s*flex/i.test(html), 'flexbox found');
  assert.ok(!/display:\s*grid/i.test(html), 'grid found');
});

test('the only colour beyond ink and muted is the seal line', () => {
  const html = htmlBody({ ...base, recoveryRequested: true });
  const colours = [...html.matchAll(/#[0-9A-Fa-f]{6}/g)].map((m) => m[0].toUpperCase());
  const allowed = new Set(['#2E4739', '#17181A', '#6E7075', '#F1F0EE']);
  for (const c of colours) assert.ok(allowed.has(c), `unexpected colour ${c}`);
  assert.ok(colours.includes('#2E4739'), 'seal colour missing when a guest is waiting');
});

test('the seal colour is absent when nobody is waiting', () => {
  const html = htmlBody({ ...base, recoveryRequested: false });
  assert.ok(!html.includes('#2E4739'));
});

test('guest text is escaped so it cannot break the html', () => {
  const html = htmlBody({ ...base, answer: 'the "sign" said <b>closed</b> & I left' });
  assert.ok(html.includes('&lt;b&gt;closed&lt;/b&gt;'), 'tags not escaped');
  assert.ok(!/<b>closed<\/b>/.test(html), 'raw tag survived');
});

test('the follow up is omitted entirely when the guest skipped it', () => {
  const body = textBody({ ...base, followUpAnswer: null });
  assert.ok(!/Then/.test(body));
  assert.ok(!/""/.test(body), 'empty quote left behind');
});

test('a null answer does not produce a broken quote', () => {
  const body = textBody({ ...base, answer: null, followUpAnswer: null });
  assert.ok(body.includes('What the guest said'));
});
