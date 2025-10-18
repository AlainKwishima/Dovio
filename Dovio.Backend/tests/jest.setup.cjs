// Setup in-memory MongoDB for tests
jest.setTimeout(30000);
process.env.NODE_ENV = 'test';

const { connectTestDB } = require('../src/config/database.js');

beforeAll(async () => {
  try {
    await connectTestDB();
  } catch (e) {
    console.error('Failed to start in-memory MongoDB', e);
    throw e;
  }
});



