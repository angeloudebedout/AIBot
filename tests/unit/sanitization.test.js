import test from 'node:test';
import assert from 'node:assert/strict';

import {
  sanitizeInput,
  sanitizeMarkdown,
  sanitizeMention,
  escapeHtml
} from '../../src/utils/sanitization.js';

test('sanitizeInput - non-string inputs return empty string', () => {
  assert.equal(sanitizeInput(null), '');
  assert.equal(sanitizeInput(undefined), '');
  assert.equal(sanitizeInput(12345), '');
  assert.equal(sanitizeInput(true), '');
  assert.equal(sanitizeInput({ text: 'hello' }), '');
  assert.equal(sanitizeInput(['hello']), '');
});

test('sanitizeInput - trims leading and trailing whitespace', () => {
  assert.equal(sanitizeInput('   hello world   '), 'hello world');
  assert.equal(sanitizeInput('\t\n hello \r\n'), 'hello');
});

test('sanitizeInput - truncates string exceeding default maxLength (2000)', () => {
  const longInput = 'a'.repeat(2500);
  const result = sanitizeInput(longInput);
  assert.equal(result.length, 2000);
  assert.equal(result, 'a'.repeat(2000));
});

test('sanitizeInput - truncates string exceeding custom maxLength', () => {
  const input = 'Hello, World!';
  assert.equal(sanitizeInput(input, 5), 'Hello');
  assert.equal(sanitizeInput(input, 0), '');
});

test('sanitizeInput - removes hex control characters (0x00-0x1F and 0x7F)', () => {
  const inputWithControlChars = 'hello\x00\x01\x08\x09\x0A\x0D\x1Fworld\x7F';
  const result = sanitizeInput(inputWithControlChars);
  assert.equal(result, 'helloworld');
});

test('sanitizeInput - handles combined whitespace, custom maxLength, and control characters', () => {
  // Input: '   \x00abc\x1Fdef\x7Fghi   '
  // 1. trim() -> '\x00abc\x1Fdef\x7Fghi'
  // 2. substring(0, 6) -> '\x00abc\x1Fd' (length 6 chars: \x00, a, b, c, \x1F, d)
  // 3. remove control chars -> 'abcd'
  const input = '   \x00abc\x1Fdef\x7Fghi   ';
  assert.equal(sanitizeInput(input, 6), 'abcd');
});

test('sanitizeMarkdown - escapes markdown formatting characters', () => {
  assert.equal(sanitizeMarkdown('*bold* _italic_ `code` [link] |pipe| ~strike~'), '\\*bold\\* \\_italic\\_ \\`code\\` \\[link\\] \\|pipe\\| \\~strike\\~');
  assert.equal(sanitizeMarkdown(null), '');
  assert.equal(sanitizeMarkdown(123), '');
});

test('sanitizeMention - validates and extracts numerical Discord ID', () => {
  assert.equal(sanitizeMention('123456789012345678'), '123456789012345678');
  assert.equal(sanitizeMention('invalid-mention'), null);
});

test('escapeHtml - escapes HTML special characters', () => {
  assert.equal(escapeHtml('<script>alert("xss & \'test\'")</script>'), '&lt;script&gt;alert(&quot;xss &amp; &#039;test&#039;&quot;)&lt;/script&gt;');
  assert.equal(escapeHtml(null), '');
  assert.equal(escapeHtml(123), '');
});
