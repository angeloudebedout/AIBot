import test from 'node:test';
import assert from 'node:assert/strict';

import {
  sanitizeMention,
  sanitizeMarkdown,
  sanitizeInput,
  escapeHtml
} from '../../src/utils/sanitization.js';

test('sanitizeMention correctly extracts valid ID from standard Discord user mention (<@ID>)', () => {
  const result = sanitizeMention('<@123456789012345678>');
  assert.equal(result, '123456789012345678');
});

test('sanitizeMention correctly extracts valid ID from nickname user mention (<@!ID>)', () => {
  const result = sanitizeMention('<@!123456789012345678>');
  assert.equal(result, '123456789012345678');
});

test('sanitizeMention correctly extracts valid ID from role mention (<@&ID>)', () => {
  const result = sanitizeMention('<@&123456789012345678>');
  assert.equal(result, '123456789012345678');
});

test('sanitizeMention correctly extracts valid ID from channel mention (<#ID>)', () => {
  const result = sanitizeMention('<#123456789012345678>');
  assert.equal(result, '123456789012345678');
});

test('sanitizeMention accepts raw snowflake ID string', () => {
  const result = sanitizeMention('123456789012345678');
  assert.equal(result, '123456789012345678');
});

test('sanitizeMention rejects malformed mention with letters', () => {
  assert.equal(sanitizeMention('<@!123abc456>'), null);
});

test('sanitizeMention rejects malformed mention with whitespace or extra text', () => {
  assert.equal(sanitizeMention('<@!123456789012345678> extra'), null);
  assert.equal(sanitizeMention('hello <@!123456789012345678>'), null);
});

test('sanitizeMention rejects empty string or string without digits', () => {
  assert.equal(sanitizeMention(''), null);
  assert.equal(sanitizeMention('<@!&#>'), null);
  assert.equal(sanitizeMention('abc'), null);
});

test('sanitizeMention rejects HTML / script injection strings', () => {
  assert.equal(sanitizeMention('<script>alert(1)</script>'), null);
  assert.equal(sanitizeMention('<@!12345; DROP TABLE users;--'), null);
});

test('sanitizeMention handles non-string inputs safely', () => {
  assert.equal(sanitizeMention(null), null);
  assert.equal(sanitizeMention(undefined), null);
  assert.equal(sanitizeMention(123456789), null);
  assert.equal(sanitizeMention({ id: '12345' }), null);
  assert.equal(sanitizeMention(['12345']), null);
  assert.equal(sanitizeMention(true), null);
});

test('sanitizeMarkdown escapes markdown special characters', () => {
  assert.equal(sanitizeMarkdown('*bold* _italic_ `code` [link] |spoiler| ~strike~'), '\\*bold\\* \\_italic\\_ \\`code\\` \\[link\\] \\|spoiler\\| \\~strike\\~');
  assert.equal(sanitizeMarkdown(null), '');
  assert.equal(sanitizeMarkdown(123), '');
});

test('sanitizeInput strips control chars and trims string within length limit', () => {
  assert.equal(sanitizeInput('  hello\x00world  ', 20), 'helloworld');
  assert.equal(sanitizeInput('long text string', 4), 'long');
  assert.equal(sanitizeInput(null), '');
  assert.equal(sanitizeInput(undefined), '');
});

test('escapeHtml escapes HTML special characters', () => {
  assert.equal(escapeHtml('<script>alert("xss" & \'test\')</script>'), '&lt;script&gt;alert(&quot;xss&quot; &amp; &#039;test&#039;)&lt;/script&gt;');
  assert.equal(escapeHtml(null), '');
  assert.equal(escapeHtml(123), '');
});
