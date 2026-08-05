/*
 * node --test lib/room.test.mjs
 *
 * Run against the compiled output so the test exercises what ships.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseRoom, emailSubject } from './room.compiled.mjs';

test('reads a plain room number', () => {
  assert.equal(parseRoom('14'), '14');
});

test('reads rooms that are not just digits', () => {
  assert.equal(parseRoom('2B'), '2B');
  assert.equal(parseRoom('Suite-3'), 'Suite-3');
});

test('trims incidental whitespace', () => {
  assert.equal(parseRoom(' 14 '), '14');
});

test('absent is null, not an error', () => {
  assert.equal(parseRoom(undefined), null);
  assert.equal(parseRoom(null), null);
  assert.equal(parseRoom(''), null);
});

test('takes the first value when the param repeats', () => {
  assert.equal(parseRoom(['14', '99']), '14');
});

test('rejects rather than stores dirty', () => {
  assert.equal(parseRoom('../../etc/passwd'), null);
  assert.equal(parseRoom('<script>'), null);
  assert.equal(parseRoom('room 14'), null, 'space is not allowed');
  assert.equal(parseRoom('123456789'), null, 'over 8 characters');
  assert.equal(parseRoom("14'; drop table responses;--"), null);
});

test('subject names the room when it is known', () => {
  assert.equal(emailSubject('The Aubrey', 'cold room', '14'), 'The Aubrey, room 14: cold room');
});

test('subject omits the clause entirely when the room is absent', () => {
  const subject = emailSubject('The Aubrey', 'cold room', null);
  assert.equal(subject, 'The Aubrey: cold room');
  assert.ok(!/not given|unknown|n\/a/i.test(subject), 'never asserts an absence');
});
