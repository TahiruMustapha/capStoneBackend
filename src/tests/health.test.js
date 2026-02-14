import request from 'supertest';
import { jest } from '@jest/globals';

// Mock the database query before importing the app
jest.unstable_mockModule('../db.js', () => ({
  query: jest.fn(),
  pool: {
    on: jest.fn(),
    end: jest.fn()
  }
}));

// Import the mocked module
const { query } = await import('../db.js');
const { default: app } = await import('../index.js');

describe('GET /health', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 200 and status ok when database is healthy', async () => {
    query.mockResolvedValueOnce({ rows: [{ '?column?': 1 }] });

    const response = await request(app)
      .get('/health')
      .set('Accept', 'application/json');
    
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok', database: 'connected' });
  });

  it('should return 500 when database fails', async () => {
    query.mockRejectedValueOnce(new Error('DB Connection Failed'));

    const response = await request(app)
      .get('/health')
      .set('Accept', 'application/json');
    
    expect(response.status).toBe(500);
    expect(response.body).toEqual({ status: 'error', database: 'disconnected' });
  });

  it('should return HTML when requested', async () => {
    query.mockResolvedValueOnce({ rows: [{ '?column?': 1 }] });

    const response = await request(app)
      .get('/health')
      .set('Accept', 'text/html');
    
    expect(response.status).toBe(200);
    expect(response.text).toContain('System is Operational');
  });
});
