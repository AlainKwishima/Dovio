import request from 'supertest';
import { app } from '../src/server.js';

describe('Docs and public endpoints', () => {
  it('serves swagger UI', async () => {
    const res = await request(app).get('/api/docs');
    expect([200, 301]).toContain(res.status);
  });
});


