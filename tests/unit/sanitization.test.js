import test from 'node:test';
import assert from 'node:assert/strict';

import {
  escapeHtml,
  sanitizeMarkdown,
  sanitizeInput,
  sanitizeMention
} from '../../src/utils/sanitization.js';

test('escapeHtml handles non-string inputs', () => {
  assert.equal(escapeHtml(null), '');
  assert.equal(escapeHtml(undefined), '');
  assert.equal(escapeHtml(123), '');
  assert.equal(escapeHtml({}), '');
  assert.equal(escapeHtml([]), '');
  assert.equal(escapeHtml(true), '');
});

test('escapeHtml leaves plain strings untouched', () => {
  assert.equal(escapeHtml('Hello World 123!'), 'Hello World 123!');
});

test('escapeHtml escapes HTML special characters', () => {
  assert.equal(escapeHtml('&'), '&amp;');
  assert.equal(escapeHtml('<'), '&lt;');
  assert.equal(escapeHtml('>'), '&gt;');
  assert.equal(escapeHtml('"'), '&quot;');
  assert.equal(escapeHtml("'"), '&#039;');
});

test('escapeHtml correctly escapes HTML tags and script payloads', () => {
  const input = '<script>alert("XSS & \'more\'")</script>';
  const expected = '&lt;script&gt;alert(&quot;XSS &amp; &#039;more&#039;&quot;)&lt;/script&gt;';
  assert.equal(escapeHtml(input), expected);
});

test('escapeHtml correctly escapes HTML attributes and query parameters', () => {
  const input = '<a href="https://example.com?a=1&b=2">Link</a>';
  const expected = '&lt;a href=&quot;https://example.com?a=1&amp;b=2&quot;&gt;Link&lt;/a&gt;';
  assert.equal(escapeHtml(input), expected);
});

test('sanitizeMarkdown escapes markdown formatting syntax', () => {
  assert.equal(sanitizeMarkdown(null), '');
  assert.equal(sanitizeMarkdown('*bold* _italic_ `code` [link] |table| ~strike~'), '\\*bold\\* \\_italic\\_ \\`code\\` \\[link\\] \\|table\\| \\~strike\\~');
});

test('sanitizeInput trims, strips control characters, and enforces length limit', () => {
  assert.equal(sanitizeInput(null), '');
  assert.equal(sanitizeInput('  hello\x00world\x1F!  ', 12), 'helloworld');
  assert.equal(sanitizeInput('1234567890extra', 10), '1234567890');
});

test('sanitizeMention extracts valid Discord ID or returns null', () => {
  assert.equal(sanitizeMention('<@!1234567890'), '1234567890');
  assert.equal(sanitizeMention('<&1234567890'), '1234567890');
  assert.equal(sanitizeMention('1234567890'), '1234567890');
  assert.equal(sanitizeMention('<@invalid_id>'), null);
});
