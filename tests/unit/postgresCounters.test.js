import test from 'node:test';
import assert from 'node:assert/strict';

import { PostgreSQLDatabase } from '../../src/utils/postgresDatabase.js';
import { pgConfig } from '../../src/config/postgres.js';

test('PostgreSQLDatabase uses parameterized query and quoted table identifier when checking and adding counters column', async () => {
  const db = new PostgreSQLDatabase();
  const executedQueries = [];

  db.isConnected = true;
  db.pool = {
    query: async (queryText, params) => {
      executedQueries.push({ queryText, params });
      if (queryText.includes('information_schema.columns')) {
        return { rows: [] };
      }
      return { rows: [] };
    }
  };

  const setRes = await db.setStructuredData({ type: 'counters', guildId: '123456789' }, []);
  assert.equal(setRes, true);

  const columnCheck = executedQueries.find(q => q.queryText.includes('information_schema.columns'));
  assert.ok(columnCheck, 'Should execute information_schema.columns query');
  assert.equal(columnCheck.params[0], pgConfig.tables.guilds);

  const alterQuery = executedQueries.find(q => q.queryText.includes('ALTER TABLE'));
  assert.ok(alterQuery, 'Should execute ALTER TABLE query');
  assert.ok(
    alterQuery.queryText.includes(`ALTER TABLE "${pgConfig.tables.guilds}"`),
    'ALTER TABLE query should use quoted safe identifier'
  );
});

test('PostgreSQLDatabase rejects unsafe table identifier if pgConfig.tables.guilds is modified to invalid value', async () => {
  const db = new PostgreSQLDatabase();
  db.isConnected = true;
  db.pool = {
    query: async () => ({ rows: [] })
  };

  const originalGuildsTable = pgConfig.tables.guilds;
  try {
    pgConfig.tables.guilds = 'guilds; DROP TABLE users;--';

    const setRes = await db.setStructuredData({ type: 'counters', guildId: '123456789' }, []);
    assert.equal(setRes, false, 'Structured data set should fail when table identifier is invalid');
  } finally {
    pgConfig.tables.guilds = originalGuildsTable;
  }
});
