// ESM setup file for Jest with VM modules
import { jest } from '@jest/globals';

const jestTimeoutMs = 30000;
jest.setTimeout(jestTimeoutMs);
process.env.NODE_ENV = 'test';

import { connectTestDB, disconnectTestDB } from '../src/config/database.js';

beforeAll(async () => {
  try {
    await connectTestDB();
  } catch (e) {
    // Surface error to fail fast
    // eslint-disable-next-line no-console
    console.error('Failed to start in-memory MongoDB', e);
    throw e;
  }
});

afterAll(async () => {
  await disconnectTestDB();
});


