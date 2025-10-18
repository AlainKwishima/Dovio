import request from 'supertest';
import { app } from '../src/server.js';

async function createUser(email) {
  const password = 'Secret123!';
  const reg = await request(app).post('/api/auth/register').send({ fullNames: 'U', email, password, dob: '2000-01-01', address: 'A', phoneNumber: '1', occupation: 'Dev', hobbies: 'x' });
  const login = await request(app).post('/api/auth/login').send({ email, password });
  return { token: login.body?.data?.accessToken, userId: reg.body?.data?.user?.userId };
}

describe('Messages authorization', () => {
  it('only sender or receiver can delete message', async () => {
    const a = await createUser(`ma${Date.now()}@ex.com`);
    const b = await createUser(`mb${Date.now()}@ex.com`);
    const c = await createUser(`mc${Date.now()}@ex.com`);

    const sent = await request(app)
      .post('/api/messages')
      .set('Authorization', `Bearer ${a.token}`)
      .send({ receiverId: b.userId, content: 'hello' });
    expect([200,201]).toContain(sent.status);
    const messageId = sent.body?.data?.message?.messageId;

    const delByC = await request(app)
      .delete(`/api/messages/${messageId}`)
      .set('Authorization', `Bearer ${c.token}`);
    expect([401,403]).toContain(delByC.status);
  }, 20000);
});


