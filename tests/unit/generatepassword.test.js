import test from 'node:test';
import assert from 'node:assert/strict';
import generatepassword from '../../src/commands/Tools/generatepassword.js';

function createMockInteraction(options = {}) {
  let replyData = null;
  return {
    id: 'mock-interaction-1',
    createdTimestamp: Date.now(),
    user: { id: 'test-user-1' },
    guildId: 'test-guild-1',
    deferred: false,
    replied: false,
    isRepliable() {
      return true;
    },
    options: {
      getInteger(name) {
        return options[name] !== undefined ? options[name] : null;
      },
      getBoolean(name) {
        return options[name] !== undefined ? options[name] : null;
      }
    },
    async deferReply() {
      this.deferred = true;
      return true;
    },
    async editReply(data) {
      replyData = data;
      return data;
    },
    getReplyData() {
      return replyData;
    }
  };
}

test('generatepassword command generates valid password with default options', async () => {
  const originalMathRandom = Math.random;
  let mathRandomCalled = false;
  Math.random = () => {
    mathRandomCalled = true;
    return originalMathRandom();
  };

  try {
    const interaction = createMockInteraction();
    await generatepassword.execute(interaction);

    assert.equal(mathRandomCalled, false, 'Math.random should not be called');

    const reply = interaction.getReplyData();
    assert.ok(reply, 'Interaction should receive editReply');
    assert.ok(reply.embeds && reply.embeds.length > 0, 'Reply should contain embeds');

    const embed = reply.embeds[0].data;
    const fullText = `${embed.title || ''}\n${embed.description || ''}`;
    const passwordMatch = fullText.match(/\|\|`([^`]+)`\|\|/);
    assert.ok(passwordMatch, 'Password should be formatted in spoiler inline code');

    const password = passwordMatch[1];
    assert.equal(password.length, 16, 'Default password length should be 16');
    assert.ok(/[a-z]/.test(password), 'Password should contain lowercase');
    assert.ok(/[A-Z]/.test(password), 'Password should contain uppercase');
    assert.ok(/[0-9]/.test(password), 'Password should contain number');
    assert.ok(/[^a-zA-Z0-9]/.test(password), 'Password should contain symbol');
  } finally {
    Math.random = originalMathRandom;
  }
});

test('generatepassword command respects custom length and option flags', async () => {
  const originalMathRandom = Math.random;
  let mathRandomCalled = false;
  Math.random = () => {
    mathRandomCalled = true;
    return originalMathRandom();
  };

  try {
    const interaction = createMockInteraction({
      length: 24,
      uppercase: true,
      numbers: false,
      symbols: false
    });
    await generatepassword.execute(interaction);

    assert.equal(mathRandomCalled, false, 'Math.random should not be called');

    const reply = interaction.getReplyData();
    const embed = reply.embeds[0].data;
    const fullText = `${embed.title || ''}\n${embed.description || ''}`;
    const passwordMatch = fullText.match(/\|\|`([^`]+)`\|\|/);
    assert.ok(passwordMatch);

    const password = passwordMatch[1];
    assert.equal(password.length, 24, 'Password length should be 24');
    assert.ok(/[A-Z]/.test(password), 'Password should contain uppercase');
    assert.equal(/[0-9]/.test(password), false, 'Password should not contain numbers when option disabled');
  } finally {
    Math.random = originalMathRandom;
  }
});

test('generatepassword handles invalid length gracefully', async () => {
  const interaction = createMockInteraction({ length: 5 });
  await generatepassword.execute(interaction);

  const reply = interaction.getReplyData();
  assert.ok(reply.embeds && reply.embeds.length > 0);
  const embed = reply.embeds[0].data;
  const fullText = `${embed.title || ''}\n${embed.description || ''}`;
  assert.ok(fullText.includes('Invalid Length'));
});
