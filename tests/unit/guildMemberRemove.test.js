import test from 'node:test';
import assert from 'node:assert/strict';
import guildMemberRemove from '../../src/events/guildMemberRemove.js';
import * as database from '../../src/utils/database.js';

test('guildMemberRemove removes all applications for leaving user', async () => {
  const guildId = 'guild-test-1';
  const userId = 'user-test-1';

  // Track deleted application IDs
  const deletedApps = [];

  // Mock client DB
  const mockClient = {
    db: {
      get: async (key, defaultValue) => {
        if (key === `guild:${guildId}:applications:users:${userId}`) {
          return ['app-1', 'app-2', 'app-3'];
        }
        if (key.startsWith(`guild:${guildId}:applications:app-`)) {
          const appId = key.split(':').pop();
          return { id: appId, userId, status: 'pending' };
        }
        if (key === `guild:${guildId}:welcome`) {
          return { goodbyeEnabled: false };
        }
        return defaultValue;
      },
      delete: async (key) => {
        if (key.startsWith(`guild:${guildId}:applications:`)) {
          const appId = key.split(':').pop();
          deletedApps.push(appId);
        }
        return true;
      },
      set: async () => true,
      list: async () => []
    }
  };

  const mockMember = {
    guild: {
      id: guildId,
      name: 'Test Guild',
      memberCount: 5,
      channels: { cache: new Map() }
    },
    user: {
      id: userId,
      tag: 'TestUser#1234',
      displayAvatarURL: () => 'http://example.com/avatar.png'
    },
    client: mockClient,
    joinedTimestamp: Date.now() - 100000
  };

  await guildMemberRemove.execute(mockMember);

  assert.equal(deletedApps.length, 3);
  assert.deepEqual(deletedApps.sort(), ['app-1', 'app-2', 'app-3'].sort());
});

test('guildMemberRemove benchmark for deleting multiple applications', async () => {
  const guildId = 'guild-bench-1';
  const userId = 'user-bench-1';
  const appCount = 20;
  const mockDelayMs = 10;

  const appIds = Array.from({ length: appCount }, (_, i) => `app-bench-${i}`);
  const deletedApps = [];

  const mockClient = {
    db: {
      get: async (key, defaultValue) => {
        if (key === `guild:${guildId}:applications:users:${userId}`) {
          return appIds;
        }
        if (key.startsWith(`guild:${guildId}:applications:app-bench-`)) {
          const appId = key.replace(`guild:${guildId}:applications:`, '');
          return { id: appId, userId, status: 'pending' };
        }
        if (key === `guild:${guildId}:welcome`) {
          return { goodbyeEnabled: false };
        }
        return defaultValue;
      },
      delete: async (key) => {
        // Simulate database I/O latency
        await new Promise((resolve) => setTimeout(resolve, mockDelayMs));
        if (key.startsWith(`guild:${guildId}:applications:`)) {
          const appId = key.replace(`guild:${guildId}:applications:`, '');
          deletedApps.push(appId);
        }
        return true;
      },
      set: async () => {
        // Simulate database I/O latency for updating user applications list
        await new Promise((resolve) => setTimeout(resolve, mockDelayMs));
        return true;
      },
      list: async () => []
    }
  };

  const mockMember = {
    guild: {
      id: guildId,
      name: 'Bench Guild',
      memberCount: 10,
      channels: { cache: new Map() }
    },
    user: {
      id: userId,
      tag: 'BenchUser#0000',
      displayAvatarURL: () => 'http://example.com/avatar.png'
    },
    client: mockClient,
    joinedTimestamp: Date.now() - 100000
  };

  const startTime = Date.now();
  await guildMemberRemove.execute(mockMember);
  const durationMs = Date.now() - startTime;

  console.log(`[BENCHMARK OPTIMIZED] Duration for removing ${appCount} applications: ${durationMs}ms`);

  assert.equal(deletedApps.length, appCount);
});
