import request from 'supertest';
import { jest } from '@jest/globals';

// Mock the database query
jest.unstable_mockModule('../db.js', () => ({
  query: jest.fn(),
  pool: {
    on: jest.fn(),
    end: jest.fn()
  }
}));

const { query } = await import('../db.js');
const { default: app } = await import('../index.js');

describe('Client API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockClient = {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    job: 'Developer',
    rate: 100,
    isactive: true
  };

  describe('GET /api/clients', () => {
    it('should return all clients', async () => {
      query.mockResolvedValueOnce({ rows: [mockClient] });

      const response = await request(app).get('/api/clients');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([mockClient]);
      expect(query).toHaveBeenCalledWith('SELECT * FROM clients_tb');
    });

    it('should return 500 on database error', async () => {
        query.mockRejectedValueOnce(new Error('DB Error'));
  
        const response = await request(app).get('/api/clients');
  
        expect(response.status).toBe(500);
        expect(response.body).toEqual({ message: 'Internal Server Error' });
    });
  });

  describe('POST /api/clients', () => {
    const newClient = {
      name: 'Jane Doe',
      email: 'jane@example.com',
      job: 'Designer',
      rate: 90,
      isactive: true
    };

    it('should create a new client', async () => {
      query.mockResolvedValueOnce({ rows: [{ ...newClient, id: 2 }] });

      const response = await request(app)
        .post('/api/clients')
        .send(newClient);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ ...newClient, id: 2 });
      expect(query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO clients_tb'), expect.any(Array));
    });

    it('should return 500 on failure', async () => {
        query.mockRejectedValueOnce(new Error('DB Error'));
  
        const response = await request(app)
          .post('/api/clients')
          .send(newClient);
  
        expect(response.status).toBe(500);
    });
  });

  describe('PUT /api/clients/:id', () => {
    const updatedData = { ...mockClient, name: 'John Updated' };

    it('should update an existing client', async () => {
        query.mockResolvedValueOnce({ rows: [updatedData] });

        const response = await request(app)
            .put('/api/clients/1')
            .send(updatedData);

        expect(response.status).toBe(200);
        expect(response.body).toEqual(updatedData);
        expect(query).toHaveBeenCalledWith(expect.stringContaining('UPDATE clients_tb'), expect.any(Array));
    });

    it('should return 404 if client not found', async () => {
        query.mockResolvedValueOnce({ rows: [] }); // Update returns empty rows if ID not found

        const response = await request(app)
            .put('/api/clients/999')
            .send(updatedData);

        expect(response.status).toBe(404);
        expect(response.body).toEqual({ message: 'Client not found' });
    });
  });

  describe('DELETE /api/clients/:id', () => {
      it('should delete a client', async () => {
          query.mockResolvedValueOnce({ rowCount: 1 });

          const response = await request(app).delete('/api/clients/1');

          expect(response.status).toBe(200);
      });

      it('should return 404 if client not found', async () => {
          query.mockResolvedValueOnce({ rowCount: 0 });

          const response = await request(app).delete('/api/clients/999');

          expect(response.status).toBe(404);
      });
  });
  
  describe('GET /api/clients/search', () => {
      it('should search clients', async () => {
          query.mockResolvedValueOnce({ rows: [mockClient] });

          const response = await request(app).get('/api/clients/search?q=John');

          expect(response.status).toBe(200);
          expect(response.body).toEqual([mockClient]);
          expect(query).toHaveBeenCalledWith(expect.stringContaining('SELECT * FROM clients_tb WHERE'), expect.any(Array));
      });
  });
});
