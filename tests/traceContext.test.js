import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createTraceId,
  createInteractionTraceContext,
  runWithTraceContext,
  getTraceContext,
  getTraceId
} from '../src/utils/traceContext.js';

test('createTraceId generates trace ID with default "trc" prefix', () => {
  const traceId = createTraceId();
  assert.equal(typeof traceId, 'string');
  assert.ok(traceId.startsWith('trc_'));
  const hexPart = traceId.slice(4);
  assert.equal(hexPart.length, 32);
  assert.doesNotMatch(hexPart, /-/);
  assert.match(traceId, /^trc_[a-f0-9]{32}$/);
});

test('createTraceId uses custom prefix when provided', () => {
  const customTraceId = createTraceId('req');
  assert.ok(customTraceId.startsWith('req_'));
  assert.match(customTraceId, /^req_[a-f0-9]{32}$/);

  const anotherPrefix = createTraceId('test_prefix');
  assert.ok(anotherPrefix.startsWith('test_prefix_'));
  assert.match(anotherPrefix, /^test_prefix_[a-f0-9]{32}$/);
});

test('createTraceId handles empty prefix string correctly', () => {
  const traceId = createTraceId('');
  assert.ok(traceId.startsWith('_'));
  assert.match(traceId, /^_[a-f0-9]{32}$/);
});

test('createTraceId produces unique IDs across multiple calls', () => {
  const count = 1000;
  const ids = new Set();
  for (let i = 0; i < count; i++) {
    ids.add(createTraceId());
  }
  assert.equal(ids.size, count);
});

test('createInteractionTraceContext correctly extracts metadata and sanitizes command name', () => {
  const mockChatInteraction = {
    id: '123456789',
    type: 2,
    guildId: 'guild_100',
    channelId: 'chan_200',
    user: { id: 'usr_300' },
    isChatInputCommand: () => true,
    commandName: 'ping'
  };

  const context = createInteractionTraceContext(mockChatInteraction);

  assert.equal(typeof context.traceId, 'string');
  assert.ok(context.traceId.startsWith('trc_'));
  assert.equal(context.interactionId, '123456789');
  assert.equal(context.interactionType, 2);
  assert.equal(context.guildId, 'guild_100');
  assert.equal(context.channelId, 'chan_200');
  assert.equal(context.userId, 'usr_300');
  assert.equal(context.command, 'ping');
});

test('createInteractionTraceContext sanitizes button, modal submit, and string select menu interactions', () => {
  const mockButtonInteraction = {
    isChatInputCommand: () => false,
    isButton: () => true,
    customId: 'btn_confirm'
  };
  assert.equal(createInteractionTraceContext(mockButtonInteraction).command, 'btn_confirm');

  const mockModalInteraction = {
    isChatInputCommand: () => false,
    isButton: () => false,
    isModalSubmit: () => true,
    customId: 'modal_feedback'
  };
  assert.equal(createInteractionTraceContext(mockModalInteraction).command, 'modal_feedback');

  const mockSelectInteraction = {
    isChatInputCommand: () => false,
    isButton: () => false,
    isModalSubmit: () => false,
    isStringSelectMenu: () => true,
    customId: 'select_role'
  };
  assert.equal(createInteractionTraceContext(mockSelectInteraction).command, 'select_role');
});

test('createInteractionTraceContext handles null or undefined interaction gracefully', () => {
  const context = createInteractionTraceContext(null);

  assert.equal(typeof context.traceId, 'string');
  assert.equal(context.interactionId, null);
  assert.equal(context.interactionType, null);
  assert.equal(context.guildId, null);
  assert.equal(context.channelId, null);
  assert.equal(context.userId, null);
  assert.equal(context.command, null);
});

test('createInteractionTraceContext respects overrides', () => {
  const mockInteraction = { id: '999', isChatInputCommand: () => false };
  const overrides = { traceId: 'trc_custom_override', extraMeta: 'test' };
  const context = createInteractionTraceContext(mockInteraction, overrides);

  assert.equal(context.traceId, 'trc_custom_override');
  assert.equal(context.extraMeta, 'test');
});

test('runWithTraceContext, getTraceContext, and getTraceId manage async context properly', () => {
  assert.equal(getTraceContext(), null);
  assert.equal(getTraceId(), null);

  const testContext = { traceId: 'trc_test123', userId: 'usr_1' };

  const result = runWithTraceContext(testContext, () => {
    assert.deepEqual(getTraceContext(), testContext);
    assert.equal(getTraceId(), 'trc_test123');
    return 'success';
  });

  assert.equal(result, 'success');
  assert.equal(getTraceContext(), null);
  assert.equal(getTraceId(), null);
});
