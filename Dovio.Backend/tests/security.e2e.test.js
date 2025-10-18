import request from 'supertest';
import { app } from '../src/server.js';

describe('Security and auth guards', () => {
  it('denies access to protected users/profile without token', async () => {
    const res = await request(app).get('/api/users/profile');
    expect([401, 403]).toContain(res.status);
  });

  it('denies access to protected follows without token', async () => {
    const res = await request(app).post('/api/follows').send({ userId: 'x' });
    expect([401, 403]).toContain(res.status);
  });

  it('denies access to messages without token', async () => {
    const res = await request(app).post('/api/messages').send({ toUserId: 'x', text: 'hi' });
    expect([401, 403]).toContain(res.status);
  });

  it('denies creating posts without token', async () => {
    const res = await request(app).post('/api/posts').send({ text: 'hello' });
    expect([401, 403]).toContain(res.status);
  });
});


