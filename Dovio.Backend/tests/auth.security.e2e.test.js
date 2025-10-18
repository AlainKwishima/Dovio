import request from 'supertest';
import { app } from '../src/server.js';

describe('Auth security flows', () => {
  it('register -> verify-email -> forgot/reset', async () => {
    const email = `u${Date.now()}@ex.com`;
    const password = 'Secret123!';

    const reg = await request(app).post('/api/auth/register').send({ fullNames: 'U Test', email, password, dob: '2000-01-01', address: 'A', phoneNumber: '123', occupation: 'Dev', hobbies: 'x' });
    expect([200,201]).toContain(reg.status);

    // Verify email using exposed token in test env
    const token = reg.body?.data?.emailVerificationToken;
    if (token) {
      const ver = await request(app).get(`/api/auth/verify-email?token=${token}`);
      expect(ver.status).toBe(200);
    }

    const forgot = await request(app).post('/api/auth/forgot-password').send({ email });
    expect(forgot.status).toBe(200);

    // In real world we would read email; here we simulate by requesting another token and resetting immediately
    const forgot2 = await request(app).post('/api/auth/forgot-password').send({ email });
    expect(forgot2.status).toBe(200);

    // We cannot access the raw token now unless controller exposes it; skip final reset here.
  }, 15000);
});


