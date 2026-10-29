import test from 'node:test';
import assert from 'node:assert/strict';

import { assertAllowlistedIdentifier, quoteIdentifier } from '../../src/utils/sqlIdentifiers.js';

test('assertAllowlistedIdentifier throws when identifier is not a string or is empty/whitespace', () => {
  const allowlist = new Set(['valid_table']);

  const invalidInputs = [null, undefined, 123, {}, [], true, '', '   ', '\t\n'];

  for (const input of invalidInputs) {
    assert.throws(
      () => assertAllowlistedIdentifier(input, allowlist),
      /SQL identifier must be a non-empty string/
    );
  }
});

test('assertAllowlistedIdentifier throws when identifier contains unsafe characters or invalid format', () => {
  const allowlist = new Set(['valid_table', 'users']);

  const unsafeInputs = [
    'Users',
    'user-table',
    'user table',
    '1user',
    'users; DROP TABLE users--',
    'user$',
    'user.table',
  ];

  for (const input of unsafeInputs) {
    assert.throws(
      () => assertAllowlistedIdentifier(input, allowlist),
      new RegExp(`SQL identifier contains unsafe characters: ${input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`)
    );
  }
});

test('assertAllowlistedIdentifier throws when identifier is not in allowlist', () => {
  const allowlist = new Set(['users', 'posts']);

  assert.throws(
    () => assertAllowlistedIdentifier('comments', allowlist),
    /SQL identifier is not in the allowlist: comments/
  );
});

test('assertAllowlistedIdentifier respects custom label in error messages', () => {
  const allowlist = new Set(['users']);

  assert.throws(
    () => assertAllowlistedIdentifier('', allowlist, 'Table name'),
    /Table name must be a non-empty string/
  );

  assert.throws(
    () => assertAllowlistedIdentifier('INVALID!', allowlist, 'Column name'),
    /Column name contains unsafe characters: INVALID!/
  );

  assert.throws(
    () => assertAllowlistedIdentifier('posts', allowlist, 'Schema name'),
    /Schema name is not in the allowlist: posts/
  );
});

test('assertAllowlistedIdentifier returns identifier on valid match', () => {
  const allowlist = new Set(['users', 'posts_v2', '_internal']);

  assert.equal(assertAllowlistedIdentifier('users', allowlist), 'users');
  assert.equal(assertAllowlistedIdentifier('posts_v2', allowlist), 'posts_v2');
  assert.equal(assertAllowlistedIdentifier('_internal', allowlist), '_internal');
});

test('quoteIdentifier wraps identifier in double quotes', () => {
  assert.equal(quoteIdentifier('users'), '"users"');
  assert.equal(quoteIdentifier('created_at'), '"created_at"');
});
