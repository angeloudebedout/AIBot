import test from 'node:test';
import assert from 'node:assert/strict';
import { deleteApplication } from '../../src/utils/database.js';

test('Benchmark: sequential vs concurrent application deletion with latency', async () => {
    // Mock storage with simulated I/O delay (e.g. 5ms per operation)
    const simulatedDelayMs = 5;
    const store = new Map();

    const mockDb = {
        async get(key, defaultValue = null) {
            await new Promise(r => setTimeout(r, simulatedDelayMs));
            return store.has(key) ? store.get(key) : defaultValue;
        },
        async set(key, value) {
            await new Promise(r => setTimeout(r, simulatedDelayMs));
            store.set(key, value);
        },
        async delete(key) {
            await new Promise(r => setTimeout(r, simulatedDelayMs));
            store.delete(key);
        }
    };

    const mockClient = { db: mockDb };
    const guildId = 'guild-bench-1';
    const appCount = 20;

    // Populate apps
    const apps1 = [];
    for (let i = 0; i < appCount; i++) {
        const appId = `app-seq-${i}`;
        const userId = `user-${i % 5}`;
        apps1.push({ id: appId, userId, roleId: 'role-bench' });
        store.set(`guild:${guildId}:applications:${appId}`, { id: appId, guildId, userId });
        store.set(`guild:${guildId}:applications:users:${userId}`, [appId]);
    }

    // Measure sequential deletion time
    const seqStart = performance.now();
    for (const app of apps1) {
        await deleteApplication(mockClient, guildId, app.id, app.userId);
    }
    const seqDuration = performance.now() - seqStart;

    // Populate apps for concurrent test
    const apps2 = [];
    for (let i = 0; i < appCount; i++) {
        const appId = `app-conc-${i}`;
        const userId = `user-${i % 5}`;
        apps2.push({ id: appId, userId, roleId: 'role-bench' });
        store.set(`guild:${guildId}:applications:${appId}`, { id: appId, guildId, userId });
        store.set(`guild:${guildId}:applications:users:${userId}`, [appId]);
    }

    // Measure concurrent deletion time
    const concStart = performance.now();
    await Promise.all(apps2.map(app => deleteApplication(mockClient, guildId, app.id, app.userId)));
    const concDuration = performance.now() - concStart;

    console.log(`\n--- BENCHMARK RESULTS (Simulated ${simulatedDelayMs}ms DB I/O Latency) ---`);
    console.log(`Sequential deletion (${appCount} apps): ${seqDuration.toFixed(2)} ms`);
    console.log(`Concurrent deletion (${appCount} apps): ${concDuration.toFixed(2)} ms`);
    console.log(`Speedup: ${(seqDuration / concDuration).toFixed(2)}x`);
    console.log(`------------------------------------------------------------------\n`);

    // Verify deletions
    for (const app of apps1) {
        assert.equal(store.get(`guild:${guildId}:applications:${app.id}`), undefined);
    }
    for (const app of apps2) {
        assert.equal(store.get(`guild:${guildId}:applications:${app.id}`), undefined);
    }
});
