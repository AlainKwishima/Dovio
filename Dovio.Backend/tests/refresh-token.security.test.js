import request from 'supertest';
import { app } from '../src/server.js';

describe('Refresh token security', () => {
  it('rejects invalid refresh token', async () => {
    const res = await request(app).post('/api/auth/refresh-token').send({ refreshToken: 'not-a-valid-token' });
    expect([400,401]).toContain(res.status);
  });
});


