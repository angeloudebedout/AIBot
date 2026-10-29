import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createTraceId,
  createInteractionTraceContext,
  runWithTraceContext,
  getTraceContext,
  getTraceId
} from '../../src/utils/traceContext.js';

test('createTraceId generates trace ID with default or custom prefix', () => {
  const defaultTraceId = createTraceId();
  assert.ok(defaultTraceId.startsWith('trc_'));
  assert.equal(defaultTraceId.length, 4 + 32);

  const customTraceId = createTraceId('custom');
  assert.ok(customTraceId.startsWith('custom_'));
  assert.equal(customTraceId.length, 7 + 32);
});

test('createInteractionTraceContext extracts details for ChatInputCommand interaction', () => {
  const interaction = {
    id: 'int-123',
    type: 2,
    guildId: 'guild-456',
    channelId: 'channel-789',
    user: { id: 'user-101' },
    isChatInputCommand: () => true,
    commandName: 'ping'
  };

  const context = createInteractionTraceContext(interaction);

  assert.ok(context.traceId.startsWith('trc_'));
  assert.equal(context.interactionId, 'int-123');
  assert.equal(context.interactionType, 2);
  assert.equal(context.guildId, 'guild-456');
  assert.equal(context.channelId, 'channel-789');
  assert.equal(context.userId, 'user-101');
  assert.equal(context.command, 'ping');
});

test('createInteractionTraceContext extracts details for Button interaction', () => {
  const interaction = {
    id: 'btn-1',
    type: 3,
    guildId: 'guild-1',
    channelId: 'channel-1',
    user: { id: 'user-1' },
    isButton: () => true,
    customId: 'btn_confirm'
  };

  const context = createInteractionTraceContext(interaction);
  assert.equal(context.command, 'btn_confirm');
});

test('createInteractionTraceContext extracts details for ModalSubmit interaction', () => {
  const interaction = {
    id: 'modal-1',
    isModalSubmit: () => true,
    customId: 'feedback_modal'
  };

  const context = createInteractionTraceContext(interaction);
  assert.equal(context.command, 'feedback_modal');
});

test('createInteractionTraceContext extracts details for StringSelectMenu interaction', () => {
  const interaction = {
    id: 'select-1',
    isStringSelectMenu: () => true,
    customId: 'role_select'
  };

  const context = createInteractionTraceContext(interaction);
  assert.equal(context.command, 'role_select');
});

test('createInteractionTraceContext handles null or undefined interaction safely', () => {
  const nullContext = createInteractionTraceContext(null);
  assert.ok(nullContext.traceId.startsWith('trc_'));
  assert.equal(nullContext.interactionId, null);
  assert.equal(nullContext.interactionType, null);
  assert.equal(nullContext.guildId, null);
  assert.equal(nullContext.channelId, null);
  assert.equal(nullContext.userId, null);
  assert.equal(nullContext.command, null);

  const undefinedContext = createInteractionTraceContext(undefined);
  assert.equal(undefinedContext.interactionId, null);

  const emptyObjContext = createInteractionTraceContext({});
  assert.equal(emptyObjContext.command, null);
});

test('createInteractionTraceContext applies overrides', () => {
  const interaction = {
    id: 'int-1',
    guildId: 'guild-1'
  };

  const context = createInteractionTraceContext(interaction, {
    guildId: 'override-guild',
    customTag: 'extra-info'
  });

  assert.equal(context.interactionId, 'int-1');
  assert.equal(context.guildId, 'override-guild');
  assert.equal(context.customTag, 'extra-info');
});

test('runWithTraceContext, getTraceContext, and getTraceId operate correctly with AsyncLocalStorage', () => {
  assert.equal(getTraceContext(), null);
  assert.equal(getTraceId(), null);

  const mockContext = { traceId: 'trc_test_123', userId: 'user-1' };

  const result = runWithTraceContext(mockContext, () => {
    assert.deepEqual(getTraceContext(), mockContext);
    assert.equal(getTraceId(), 'trc_test_123');
    return 'success';
  });

  assert.equal(result, 'success');
  assert.equal(getTraceContext(), null);
  assert.equal(getTraceId(), null);
});
