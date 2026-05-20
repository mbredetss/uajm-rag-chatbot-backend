import { describe, it, expect, vi, afterAll, afterEach } from 'vitest';

// Mock RabbitMQ
vi.mock('../../src/producer/utils/rabbitmq.js', () => ({
  connectRabbitMQ: vi.fn(),
  publishToQueue: vi.fn(),
  consumeFromQueue: vi.fn(),
  closeRabbitMQ: vi.fn(),
}));

process.env.SECRET_CODE = 'test_secret';
process.env.VERIFY_TOKEN = 'test_verify_token';
process.env.PGHOST = process.env.PGHOST || 'localhost';
process.env.PGPORT = process.env.PGPORT || '5432';
process.env.PGUSER = process.env.PGUSER || 'postgres';
process.env.PGPASSWORD = process.env.PGPASSWORD || 'mbredets882';
process.env.PGDATABASE = process.env.PGDATABASE || 'uajm_chatbot_test';

const { default: app } = await import('../../src/producer/server/index.js');
const { publishToQueue } = await import('../../src/producer/utils/rabbitmq.js');
const { default: pool } = await import('../../src/producer/utils/database.js');

const request = async (method, urlPath, options = {}) => {
  const server = app.listen(0);
  const address = server.address();
  const baseUrl = `http://localhost:${address.port}`;

  try {
    const fetchOptions = { method };
    if (options.body) {
      if (typeof options.body === 'string') {
        fetchOptions.body = options.body;
        fetchOptions.headers = { 'Content-Type': 'application/json' };
      } else {
        fetchOptions.body = options.body;
        fetchOptions.headers = options.headers;
      }
    }
    const res = await fetch(`${baseUrl}${urlPath}`, fetchOptions);
    const contentType = res.headers.get('content-type');
    let data;
    if (contentType && contentType.includes('application/json')) {
      data = await res.json();
    } else {
      data = await res.text();
    }
    return { status: res.status, body: data };
  } finally {
    server.close();
  }
};

describe('Webhook API', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('GET / (webhook verification)', () => {
    it('should verify webhook with valid token', async () => {
      const res = await request(
        'GET',
        '/?hub.mode=subscribe&hub.verify_token=test_verify_token&hub.challenge=challenge_123',
      );
      expect(res.status).toBe(200);
      expect(res.body).toBe('challenge_123');
    });

    it('should reject webhook with invalid token', async () => {
      const res = await request(
        'GET',
        '/?hub.mode=subscribe&hub.verify_token=wrong_token&hub.challenge=challenge_123',
      );
      expect(res.status).toBe(403);
    });

    it('should reject webhook with invalid mode', async () => {
      const res = await request(
        'GET',
        '/?hub.mode=invalid&hub.verify_token=test_verify_token&hub.challenge=challenge_123',
      );
      expect(res.status).toBe(403);
    });
  });

  describe('POST / (webhook incoming message)', () => {
    it('should process incoming message and publish to queue', async () => {
      const payload = {
        entry: [{
          changes: [{
            value: {
              messages: [{
                from: '6281234567890',
                type: 'text',
                text: { body: 'Halo apa kabar' },
              }],
            },
          }],
        }],
      };

      const res = await request('POST', '/', {
        body: JSON.stringify(payload),
      });

      expect(res.status).toBe(200);
      expect(publishToQueue).toHaveBeenCalledWith('chat_queue', {
        message: 'Halo apa kabar',
        phoneNumber: '6281234567890',
      });
    });

    it('should not publish message shorter than 2 characters', async () => {
      const payload = {
        entry: [{
          changes: [{
            value: {
              messages: [{
                from: '6281234567890',
                type: 'text',
                text: { body: 'A' },
              }],
            },
          }],
        }],
      };

      const res = await request('POST', '/', {
        body: JSON.stringify(payload),
      });

      expect(res.status).toBe(200);
      expect(publishToQueue).not.toHaveBeenCalled();
    });

    it('should handle empty body gracefully', async () => {
      const res = await request('POST', '/', {
        body: JSON.stringify({}),
      });
      expect(res.status).toBe(200);
      expect(publishToQueue).not.toHaveBeenCalled();
    });

    it('should ignore non-text messages', async () => {
      const payload = {
        entry: [{
          changes: [{
            value: {
              messages: [{
                from: '6281234567890',
                type: 'image',
              }],
            },
          }],
        }],
      };

      const res = await request('POST', '/', {
        body: JSON.stringify(payload),
      });

      expect(res.status).toBe(200);
      expect(publishToQueue).not.toHaveBeenCalled();
    });
  });
});

