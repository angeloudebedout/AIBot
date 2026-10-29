import test from 'node:test';
import assert from 'node:assert/strict';

import { getMonthName } from '../../src/utils/dateUtils.js';

test('getMonthName returns correct month name for valid month numbers (1-12)', () => {
  const expectedMonths = [
    { num: 1, name: 'Jan' },
    { num: 2, name: 'Feb' },
    { num: 3, name: 'Mar' },
    { num: 4, name: 'Apr' },
    { num: 5, name: 'May' },
    { num: 6, name: 'Jun' },
    { num: 7, name: 'Jul' },
    { num: 8, name: 'Aug' },
    { num: 9, name: 'Sep' },
    { num: 10, name: 'Oct' },
    { num: 11, name: 'Nov' },
    { num: 12, name: 'Dec' },
  ];

  for (const { num, name } of expectedMonths) {
    assert.equal(getMonthName(num), name);
  }
});

test('getMonthName returns "Invalid Month" for out-of-bounds integers', () => {
  assert.equal(getMonthName(0), 'Invalid Month');
  assert.equal(getMonthName(13), 'Invalid Month');
  assert.equal(getMonthName(-1), 'Invalid Month');
  assert.equal(getMonthName(-12), 'Invalid Month');
  assert.equal(getMonthName(100), 'Invalid Month');
});

test('getMonthName returns "Invalid Month" for non-integer numbers and special numeric values', () => {
  assert.equal(getMonthName(1.5), 'Invalid Month');
  assert.equal(getMonthName(0.99), 'Invalid Month');
  assert.equal(getMonthName(NaN), 'Invalid Month');
  assert.equal(getMonthName(Infinity), 'Invalid Month');
  assert.equal(getMonthName(-Infinity), 'Invalid Month');
});

test('getMonthName returns "Invalid Month" for non-numeric or invalid string inputs', () => {
  assert.equal(getMonthName(undefined), 'Invalid Month');
  assert.equal(getMonthName(null), 'Invalid Month');
  assert.equal(getMonthName('invalid'), 'Invalid Month');
  assert.equal(getMonthName({}), 'Invalid Month');
  assert.equal(getMonthName([]), 'Invalid Month');
});
