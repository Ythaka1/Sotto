import { test } from 'node:test';
import assert from 'node:assert/strict';
import { detectSeverity, detectTheme, heuristicVerdict, followUpQuestion } from './severity.compiled.mjs';

test('broken things are serious', () => {
  assert.equal(detectSeverity('The shower was broken.'), 'serious');
  assert.equal(detectSeverity('There was no hot water at all.'), 'serious');
  assert.equal(detectSeverity('The room was filthy.'), 'serious');
});

test('being treated badly is serious', () => {
  assert.equal(detectSeverity('The man on reception was rude to my wife.'), 'serious');
  assert.equal(detectSeverity('We were ignored at the desk for ages.'), 'serious');
});

test('ordinary imperfections are minor', () => {
  assert.equal(detectSeverity('The room was slightly warm.'), 'minor');
  assert.equal(detectSeverity('Breakfast could be a little earlier.'), 'minor');
  assert.equal(detectSeverity('I would have liked a firmer pillow.'), 'minor');
});

test('markers never fire as substrings of innocent words', () => {
  // Every one of these was a real false positive under substring matching.
  const innocent = [
    ['I would have liked a firmer pillow.', 'ill inside pillow'],
    ['The staff were pleasant.', 'ant inside pleasant'],
    ['The restaurant was lovely.', 'ant inside restaurant'],
    ['We wanted a later checkout.', 'ant inside wanted'],
    ['Breakfast was smaller than expected.', 'mall inside smaller'],
  ];
  for (const [text, why] of innocent) {
    assert.equal(detectSeverity(text), 'minor', `${why}: ${text}`);
  }
});

test('a short wait is not serious but a long one is', () => {
  assert.equal(detectSeverity('We waited five minutes at the desk.'), 'minor');
  assert.equal(detectSeverity('We waited an hour for the key.'), 'serious');
  assert.equal(detectSeverity('We waited 40 minutes at the desk.'), 'serious');
});

test('breakfast hours is a subject, not a complaint', () => {
  assert.equal(detectSeverity('Could breakfast hours start earlier?'), 'minor');
});

test('shouting is a signal on its own', () => {
  assert.equal(detectSeverity('the room was NEVER cleaned'), 'serious');
  assert.equal(detectSeverity('nobody helped us!!'), 'serious');
});

test('a single capitalised word is not shouting', () => {
  assert.equal(detectSeverity('The Aubrey was lovely but breakfast was late.'), 'minor');
});

test('repetition across days escalates', () => {
  assert.equal(detectSeverity('The bins were full every morning.'), 'serious');
  assert.equal(detectSeverity('It happened both nights.'), 'serious');
});

test('themes are detected', () => {
  assert.equal(detectTheme('The shower took a while to warm up.'), 'hot water');
  assert.equal(detectTheme('Check in was quick but the lift was hard to find.'), 'check in');
  assert.equal(detectTheme('Breakfast ran out of oat milk by nine.'), 'breakfast');
  assert.equal(detectTheme('It was noisy from the street.'), 'noise');
  assert.equal(detectTheme('Everything was wonderful.'), 'general');
});

test('the verdict never editorialises or apologises', () => {
  const v = heuristicVerdict('The shower was broken and freezing.');
  assert.equal(v.severity, 'serious');
  assert.equal(v.theme, 'hot water');
  assert.ok(!/sorry|apolog|unfortunate|regret/i.test(v.summary), v.summary);
  assert.ok(!/should|recommend|suggest|please/i.test(v.summary), v.summary);
});

test('no em dashes or double hyphens in generated copy', () => {
  const v = heuristicVerdict('The room was dirty.');
  for (const s of [v.summary, v.theme, followUpQuestion('serious'), followUpQuestion('minor')]) {
    assert.ok(!s.includes('—'), `em dash in: ${s}`);
    assert.ok(!s.includes(' - '), `hyphen as punctuation in: ${s}`);
  }
});

test('billing outlives the stay and is not recoverable in the lobby', () => {
  assert.equal(heuristicVerdict('I was charged twice for the minibar.').recoverable, false);
  assert.equal(heuristicVerdict('The shower was broken.').recoverable, true);
});

test('minor is never flagged recoverable', () => {
  assert.equal(heuristicVerdict('The room was slightly warm.').recoverable, false);
});

test('the follow up branches on severity', () => {
  assert.equal(followUpQuestion('serious'), 'That should not have happened. When was it?');
  assert.equal(followUpQuestion('minor'), 'Anything else worth knowing?');
});

test('the follow up never apologises on the property behalf', () => {
  for (const s of ['serious', 'minor']) {
    assert.ok(!/sorry|we apologise|our system|being serviced/i.test(followUpQuestion(s)));
  }
});

test('empty input does not throw and stays minor', () => {
  assert.equal(detectSeverity(''), 'minor');
  assert.equal(heuristicVerdict('').theme, 'general');
});
