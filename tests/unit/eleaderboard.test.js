import test from 'node:test';
import assert from 'node:assert/strict';
import eleaderboard from '../../src/commands/Economy/eleaderboard.js';

function createMockInteraction(guildId = 'guild-123', userId = 'user-1') {
    let editReplyPayload = null;
    const interaction = {
        id: 'interaction-123',
        guildId,
        user: { id: userId },
        createdTimestamp: Date.now(),
        deferred: false,
        replied: false,
        deferReply: async () => {
            interaction.deferred = true;
            return true;
        },
        editReply: async (payload) => {
            editReplyPayload = payload;
            return payload;
        },
        getEditReplyPayload: () => editReplyPayload,
    };
    return interaction;
}

function createMockClient(keysAndData, simulatedDelayMs = 2) {
    const dataMap = new Map(Object.entries(keysAndData));
    return {
        db: {
            list: async (prefix) => {
                return Array.from(dataMap.keys()).filter((k) => k.startsWith(prefix));
            },
            get: async (key) => {
                if (simulatedDelayMs > 0) {
                    await new Promise((resolve) => setTimeout(resolve, simulatedDelayMs));
                }
                return dataMap.get(key);
            },
        },
    };
}

test('eleaderboard command formats top 10 richest users correctly', async () => {
    const guildId = 'guild-test';
    const keysAndData = {};
    for (let i = 1; i <= 15; i++) {
        keysAndData[`economy:${guildId}:user-${i}`] = {
            wallet: i * 100,
            bank: i * 50,
        };
    }

    const interaction = createMockInteraction(guildId, 'user-15');
    const client = createMockClient(keysAndData, 0);

    await eleaderboard.execute(interaction, {}, client);

    const reply = interaction.getEditReplyPayload();
    assert.ok(reply, 'editReply should have been called');
    assert.ok(reply.embeds && reply.embeds.length > 0, 'embed should be present');

    const embed = reply.embeds[0];
    assert.equal(embed.data.title, 'Economy Leaderboard');
    assert.ok(embed.data.description.includes('<@user-15>'));
    assert.ok(embed.data.description.includes('2,250'));
    assert.ok(embed.data.footer.text.includes('Your Rank: #1'));
});

test('eleaderboard command benchmark / performance check', async () => {
    const guildId = 'guild-perf';
    const numUsers = 100;
    const simulatedDelayMs = 2; // 2ms simulated I/O latency per db get
    const keysAndData = {};

    for (let i = 1; i <= numUsers; i++) {
        keysAndData[`economy:${guildId}:user-${i}`] = {
            wallet: i * 10,
            bank: i * 20,
        };
    }

    const interaction = createMockInteraction(guildId, 'user-50');
    const client = createMockClient(keysAndData, simulatedDelayMs);

    const start = performance.now();
    await eleaderboard.execute(interaction, {}, client);
    const duration = performance.now() - start;

    console.log(`[BENCHMARK] eleaderboard concurrent execution for ${numUsers} keys took ${duration.toFixed(2)} ms`);

    const reply = interaction.getEditReplyPayload();
    assert.ok(reply, 'editReply should have been called');
});
