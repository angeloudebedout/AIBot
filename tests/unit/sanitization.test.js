import test from 'node:test';
import assert from 'node:assert/strict';

import {
  sanitizeMarkdown,
  sanitizeInput,
  sanitizeMention,
  escapeHtml
} from '../../src/utils/sanitization.js';

test('sanitizeMarkdown returns empty string for non-string inputs', () => {
  assert.equal(sanitizeMarkdown(null), '');
  assert.equal(sanitizeMarkdown(undefined), '');
  assert.equal(sanitizeMarkdown(123), '');
  assert.equal(sanitizeMarkdown({}), '');
  assert.equal(sanitizeMarkdown([]), '');
  assert.equal(sanitizeMarkdown(true), '');
});

test('sanitizeMarkdown leaves plain strings unchanged', () => {
  assert.equal(sanitizeMarkdown('Hello World'), 'Hello World');
  assert.equal(sanitizeMarkdown(''), '');
});

test('sanitizeMarkdown escapes individual markdown special characters', () => {
  assert.equal(sanitizeMarkdown('*bold*'), '\\*bold\\*');
  assert.equal(sanitizeMarkdown('_italic_'), '\\_italic\\_');
  assert.equal(sanitizeMarkdown('`code`'), '\\`code\\`');
  assert.equal(sanitizeMarkdown('[link]'), '\\[link\\]');
  assert.equal(sanitizeMarkdown('|spoiler|'), '\\|spoiler\\|');
  assert.equal(sanitizeMarkdown('~strikethrough~'), '\\~strikethrough\\~');
});

test('sanitizeMarkdown handles combined/nested markdown characters', () => {
  const input = '*_`[test]|~*';
  const expected = '\\*\\_\\`\\[test\\]\\|\\~\\*';
  assert.equal(sanitizeMarkdown(input), expected);
});

test('sanitizeInput returns empty string for non-string inputs', () => {
  assert.equal(sanitizeInput(null), '');
  assert.equal(sanitizeInput(123), '');
  assert.equal(sanitizeInput(undefined), '');
});

test('sanitizeInput trims whitespace and removes control characters', () => {
  assert.equal(sanitizeInput('  hello\x00world\x1F!  '), 'helloworld!');
});

test('sanitizeInput enforces maximum length constraint', () => {
  const longInput = 'a'.repeat(3000);
  assert.equal(sanitizeInput(longInput, 2000).length, 2000);
  assert.equal(sanitizeInput('abcdef', 3), 'abc');
});

test('sanitizeMention parses valid discord mention formats', () => {
  assert.equal(sanitizeMention('123456789012345678'), '123456789012345678');
  assert.equal(sanitizeMention('@123456789012345678'), '123456789012345678');
  assert.equal(sanitizeMention('<@!123456789012345678'), '123456789012345678');
  assert.equal(sanitizeMention('#123456789012345678'), '123456789012345678');
  assert.equal(sanitizeMention('&123456789012345678'), '123456789012345678');
});

test('sanitizeMention returns null for invalid mention strings', () => {
  assert.equal(sanitizeMention('invalid'), null);
  assert.equal(sanitizeMention('<@abc>'), null);
  assert.equal(sanitizeMention(''), null);
});

test('escapeHtml handles non-string and HTML special characters', () => {
  assert.equal(escapeHtml(null), '');
  assert.equal(escapeHtml(123), '');
  assert.equal(
    escapeHtml('<script>alert("xss & \'test\'")</script>'),
    '&lt;script&gt;alert(&quot;xss &amp; &#039;test&#039;&quot;)&lt;/script&gt;'
  );
});
