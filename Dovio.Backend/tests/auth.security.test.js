import request from 'supertest';
import { app } from '../src/server.js';

describe('Auth security endpoints', () => {
  it('forgot-password returns success even for unknown emails', async () => {
    const res = await request(app).post('/api/auth/forgot-password').send({ email: 'unknown@example.com' });
    expect(res.status).toBe(200);
    expect(res.body?.success).toBe(true);
  });

  it('verify-email requires token', async () => {
    const res = await request(app).get('/api/auth/verify-email');
    expect([400, 422]).toContain(res.status);
  });

  it('2fa request returns success', async () => {
    const res = await request(app).post('/api/auth/2fa/request').send({ email: 'unknown@example.com' });
    expect(res.status).toBe(200);
    expect(res.body?.success).toBe(true);
  });
});


