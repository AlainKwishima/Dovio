import { jest } from '@jest/globals';
import request from 'supertest';
import { app } from '../src/server.js';
jest.unstable_mockModule('../src/utils/mailer.js', () => ({
  sendMail: async () => ({ previewUrl: null })
}));

describe('Smoke', () => {
  it('returns health OK', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body?.success).toBe(true);
  });
});


