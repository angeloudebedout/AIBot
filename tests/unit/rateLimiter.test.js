import test from 'node:test';
import assert from 'node:assert/strict';
import {
  checkRateLimit,
  getRateLimitStatus,
  clearRateLimit,
  clearAllRateLimits
} from '../../src/utils/rateLimiter.js';

test('clearRateLimit removes specific key from store', async () => {
  clearAllRateLimits();

  const key1 = 'user:123';
  const key2 = 'user:456';

  await checkRateLimit(key1, 5, 60000);
  await checkRateLimit(key2, 5, 60000);

  assert.equal(getRateLimitStatus(key1).attempts, 1);
  assert.equal(getRateLimitStatus(key2).attempts, 1);

  clearRateLimit(key1);

  assert.equal(getRateLimitStatus(key1).attempts, undefined);
  assert.equal(getRateLimitStatus(key1).limited, false);
  assert.equal(getRateLimitStatus(key2).attempts, 1);
});

test('clearRateLimit handles non-existent keys gracefully', () => {
  clearAllRateLimits();
  assert.doesNotThrow(() => {
    clearRateLimit('non-existent-key');
  });
});

test('checkRateLimit and getRateLimitStatus track attempts accurately', async () => {
  clearAllRateLimits();
  const key = 'test-key';

  const initialStatus = getRateLimitStatus(key);
  assert.equal(initialStatus.limited, false);
  assert.equal(initialStatus.attempts, undefined);

  for (let i = 0; i < 3; i++) {
    const allowed = await checkRateLimit(key, 3, 60000);
    assert.equal(allowed, true);
  }

  const fourthAttempt = await checkRateLimit(key, 3, 60000);
  assert.equal(fourthAttempt, false);

  const limitedStatus = getRateLimitStatus(key);
  assert.equal(limitedStatus.attempts, 3);

  clearRateLimit(key);

  const resetAllowed = await checkRateLimit(key, 3, 60000);
  assert.equal(resetAllowed, true);
});

test('clearAllRateLimits clears all entries', async () => {
  clearAllRateLimits();
  await checkRateLimit('k1', 5, 60000);
  await checkRateLimit('k2', 5, 60000);

  assert.equal(getRateLimitStatus('k1').attempts, 1);
  assert.equal(getRateLimitStatus('k2').attempts, 1);

  clearAllRateLimits();

  assert.equal(getRateLimitStatus('k1').attempts, undefined);
  assert.equal(getRateLimitStatus('k2').attempts, undefined);
});
