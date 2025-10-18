import request from 'supertest';
import { app } from '../src/server.js';

async function registerAndLogin(email) {
  const password = 'Secret123!';
  await request(app).post('/api/auth/register').send({ fullNames: 'User A', email, password, dob: '2000-01-01', address: 'A', phoneNumber: '1', occupation: 'Dev', hobbies: 'x' });
  const login = await request(app).post('/api/auth/login').send({ email, password });
  return login.body?.data?.accessToken;
}

describe('Posts authorization', () => {
  it('only owner can update/delete their post', async () => {
    const aToken = await registerAndLogin(`a${Date.now()}@ex.com`);
    const bToken = await registerAndLogin(`b${Date.now()}@ex.com`);

    const created = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${aToken}`)
      .send({ postText: 'hello' });
    expect([200,201]).toContain(created.status);
    const postId = created.body?.data?.post?.postId || created.body?.data?.post?.postId;

    const updByB = await request(app)
      .put(`/api/posts/${postId}`)
      .set('Authorization', `Bearer ${bToken}`)
      .send({ postText: 'hack' });
    expect([401,403]).toContain(updByB.status);

    const delByB = await request(app)
      .delete(`/api/posts/${postId}`)
      .set('Authorization', `Bearer ${bToken}`);
    expect([401,403]).toContain(delByB.status);
  }, 20000);
});


