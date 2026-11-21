import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from './app.js';

describe('API health endpoint', () => {
  it('returns an OK status', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ status: 'ok', service: 'itsuki-studio-api' });
  });

  it('returns JSON for unknown routes', async () => {
    const response = await request(app).get('/api/not-a-route');
    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Resource not found.');
  });
});
