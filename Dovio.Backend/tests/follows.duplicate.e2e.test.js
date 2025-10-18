import request from 'supertest';
import { app } from '../src/server.js';

async function createUser(email) {
  const password = 'Secret123!';
  const reg = await request(app).post('/api/auth/register').send({ fullNames: 'U', email, password, dob: '2000-01-01', address: 'A', phoneNumber: '1', occupation: 'Dev', hobbies: 'x' });
  const login = await request(app).post('/api/auth/login').send({ email, password });
  return { token: login.body?.data?.accessToken, userId: reg.body?.data?.user?.userId };
}

describe('Follows duplicate prevention', () => {
  it('prevents duplicate follows', async () => {
    const a = await createUser(`fa${Date.now()}@ex.com`);
    const b = await createUser(`fb${Date.now()}@ex.com`);

    const first = await request(app).post('/api/follows').set('Authorization', `Bearer ${a.token}`).send({ followeeId: b.userId });
    expect([200,201]).toContain(first.status);
    const second = await request(app).post('/api/follows').set('Authorization', `Bearer ${a.token}`).send({ followeeId: b.userId });
    expect([400,409]).toContain(second.status);
  }, 20000);
});


