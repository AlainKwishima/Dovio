import request from 'supertest';
import { app } from '../src/server.js';

describe('Verify email and reset password', () => {
  it('verifies email with token and resets password', async () => {
    const email = `v${Date.now()}@ex.com`;
    const password = 'Secret123!';

    const reg = await request(app)
      .post('/api/auth/register')
      .send({ fullNames: 'V Test', email, password, dob: '2000-01-01', address: 'A', phoneNumber: '1', occupation: 'Dev', hobbies: 'x' });
    expect([200,201]).toContain(reg.status);

    const token = reg.body?.data?.emailVerificationToken;
    if (token) {
      const ver = await request(app).get(`/api/auth/verify-email?token=${token}`);
      expect(ver.status).toBe(200);
    }

    const forgot = await request(app).post('/api/auth/forgot-password').send({ email });
    expect(forgot.status).toBe(200);
    const resetToken = forgot.body?.resetToken;
    if (resetToken) {
      const reset = await request(app).post('/api/auth/reset-password').send({ token: resetToken, newPassword: 'NewSecret123!' });
      expect(reset.status).toBe(200);
      const loginNew = await request(app).post('/api/auth/login').send({ email, password: 'NewSecret123!' });
      expect(loginNew.status).toBe(200);
    }
  }, 15000);
});


