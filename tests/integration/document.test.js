import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Mock RabbitMQ before importing app
vi.mock('../../src/producer/utils/rabbitmq.js', () => ({
  connectRabbitMQ: vi.fn(),
  publishToQueue: vi.fn(),
  consumeFromQueue: vi.fn(),
  closeRabbitMQ: vi.fn(),
}));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set env for testing
process.env.SECRET_CODE = 'test_secret';
process.env.VERIFY_TOKEN = 'test_verify_token';
process.env.PGHOST = process.env.PGHOST || 'localhost';
process.env.PGPORT = process.env.PGPORT || '5432';
process.env.PGUSER = process.env.PGUSER || 'postgres';
process.env.PGPASSWORD = process.env.PGPASSWORD || 'mbredets882';
process.env.PGDATABASE = process.env.PGDATABASE || 'uajm_chatbot_test';

const { default: app } = await import('../../src/producer/server/index.js');
const { default: pool } = await import('../../src/producer/utils/database.js');
const { publishToQueue } = await import('../../src/producer/utils/rabbitmq.js');

const uploadDir = path.join(__dirname, '..', '..', 'uploads');

// Simple HTTP test helper
const request = async (method, urlPath, options = {}) => {
  const server = app.listen(0);
  const address = server.address();
  const baseUrl = `http://localhost:${address.port}`;

  try {
    const fetchOptions = { method };
    if (options.body) {
      fetchOptions.body = options.body;
    }
    if (options.headers) {
      fetchOptions.headers = options.headers;
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

describe('Document API', () => {
  beforeAll(async () => {
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    // Ensure tables exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id SERIAL PRIMARY KEY,
        source VARCHAR(500) NOT NULL,
        type VARCHAR(10) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'in progress',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await pool.query('CREATE EXTENSION IF NOT EXISTS vector');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS langchain_pg_embedding (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        collection_id UUID,
        embedding vector(384),
        content TEXT,
        metadata JSONB
      )
    `);
  });

  afterEach(async () => {
    // Clean up database
    await pool.query('DELETE FROM documents');
    await pool.query('DELETE FROM langchain_pg_embedding');
    // Clean up uploaded files
    if (fs.existsSync(uploadDir)) {
      const files = fs.readdirSync(uploadDir);
      for (const file of files) {
        fs.unlinkSync(path.join(uploadDir, file));
      }
    }
    vi.clearAllMocks();
  });

  afterAll(async () => {
    await pool.query('DROP TABLE IF EXISTS langchain_pg_embedding');
    await pool.query('DROP TABLE IF EXISTS documents');
    await pool.end();
  });

  describe('POST /documents (upload file)', () => {
    it('should reject when no document is sent', async () => {
      const formData = new FormData();
      formData.append('secretCode', 'test_secret');

      const res = await request('POST', '/documents', { body: formData });
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Dokumen harus dikirim');
    });

    it('should reject when secret code is invalid', async () => {
      const pdfContent = Buffer.from('%PDF-1.4 dummy content');
      const blob = new Blob([pdfContent], { type: 'application/pdf' });

      const formData = new FormData();
      formData.append('document', blob, 'test.pdf');
      formData.append('secretCode', 'wrong_secret');

      const res = await request('POST', '/documents', { body: formData });
      expect(res.status).toBe(401);
      expect(res.body.message).toBe('Kode rahasia tidak valid');
    });

    it('should upload PDF document successfully', async () => {
      const pdfContent = Buffer.from('%PDF-1.4 dummy content');
      const blob = new Blob([pdfContent], { type: 'application/pdf' });

      const formData = new FormData();
      formData.append('document', blob, 'test.pdf');
      formData.append('secretCode', 'test_secret');

      const res = await request('POST', '/documents', { body: formData });
      expect(res.status).toBe(201);
      expect(res.body.data.type).toBe('docs');
      expect(res.body.data.status).toBe('in progress');
      expect(publishToQueue).toHaveBeenCalledWith('indexing_queue', expect.objectContaining({
        type: 'docs',
        documentId: res.body.data.id,
      }));
    });

    it('should upload CSV document successfully', async () => {
      const csvContent = Buffer.from('col1,col2\nval1,val2');
      const blob = new Blob([csvContent], { type: 'text/csv' });

      const formData = new FormData();
      formData.append('document', blob, 'test.csv');
      formData.append('secretCode', 'test_secret');

      const res = await request('POST', '/documents', { body: formData });
      expect(res.status).toBe(201);
      expect(res.body.data.type).toBe('docs');
    });

    it('should upload DOCX document successfully', async () => {
      const docxContent = Buffer.from('dummy docx content');
      const blob = new Blob([docxContent], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });

      const formData = new FormData();
      formData.append('document', blob, 'test.docx');
      formData.append('secretCode', 'test_secret');

      const res = await request('POST', '/documents', { body: formData });
      expect(res.status).toBe(201);
      expect(res.body.data.type).toBe('docs');
    });

    it('should reject unsupported file format', async () => {
      const txtContent = Buffer.from('hello');
      const blob = new Blob([txtContent], { type: 'text/plain' });

      const formData = new FormData();
      formData.append('document', blob, 'test.txt');
      formData.append('secretCode', 'test_secret');

      const res = await request('POST', '/documents', { body: formData });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Format dokumen tidak diizinkan');
    });

    it('should reject when secretCode is missing', async () => {
      const pdfContent = Buffer.from('%PDF-1.4 dummy content');
      const blob = new Blob([pdfContent], { type: 'application/pdf' });

      const formData = new FormData();
      formData.append('document', blob, 'test.pdf');

      const res = await request('POST', '/documents', { body: formData });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /urls (upload URL)', () => {
    it('should reject when no URL is sent', async () => {
      const res = await request('POST', '/urls', {
        body: JSON.stringify({ secretCode: 'test_secret' }),
        headers: { 'Content-Type': 'application/json' },
      });
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('URL harus dikirim');
    });

    it('should reject when secret code is invalid', async () => {
      const res = await request('POST', '/urls', {
        body: JSON.stringify({ url: 'https://example.com', secretCode: 'wrong_secret' }),
        headers: { 'Content-Type': 'application/json' },
      });
      expect(res.status).toBe(401);
      expect(res.body.message).toBe('Kode rahasia tidak valid');
    });

    it('should reject when URL format is invalid', async () => {
      const res = await request('POST', '/urls', {
        body: JSON.stringify({ url: 'not-a-url', secretCode: 'test_secret' }),
        headers: { 'Content-Type': 'application/json' },
      });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Format URL tidak valid');
    });

    it('should upload URL successfully', async () => {
      const res = await request('POST', '/urls', {
        body: JSON.stringify({ url: 'https://example.com', secretCode: 'test_secret' }),
        headers: { 'Content-Type': 'application/json' },
      });
      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.type).toBe('url');
      expect(res.body.data.source).toBe('https://example.com');
      expect(res.body.data.status).toBe('in progress');
      expect(publishToQueue).toHaveBeenCalledWith('indexing_queue', {
        source: 'https://example.com',
        type: 'url',
        documentId: res.body.data.id,
      });
    });

    it('should reject when secretCode is missing for URL', async () => {
      const res = await request('POST', '/urls', {
        body: JSON.stringify({ url: 'https://example.com' }),
        headers: { 'Content-Type': 'application/json' },
      });
      expect(res.status).toBe(400);
    });
  });

  describe('GET /documents', () => {
    it('should return empty array when no documents', async () => {
      const res = await request('GET', '/documents');
      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
    });

    it('should return all documents', async () => {
      await pool.query(
        "INSERT INTO documents (source, type, status) VALUES ('test.pdf', 'docs', 'completed')",
      );
      await pool.query(
        "INSERT INTO documents (source, type, status) VALUES ('https://example.com', 'url', 'in progress')",
      );

      const res = await request('GET', '/documents');
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
    });
  });

  describe('DELETE /documents', () => {
    it('should delete document by source successfully', async () => {
      // Insert into documents table
      await pool.query(
        "INSERT INTO documents (source, type, status) VALUES ('uploads/test.pdf', 'docs', 'completed')",
      );
      // Insert into vector store
      await pool.query(
        `INSERT INTO langchain_pg_embedding (content, metadata) VALUES ('test content', '{"source": "uploads/test.pdf"}'::jsonb)`,
      );

      const res = await request('DELETE', '/documents', {
        body: JSON.stringify({ source: 'uploads/test.pdf', secretCode: 'test_secret' }),
        headers: { 'Content-Type': 'application/json' },
      });
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.deletedEmbeddings).toBe(1);
      expect(res.body.data.deletedDocuments).toBe(1);
    });

    it('should reject when source is missing', async () => {
      const res = await request('DELETE', '/documents', {
        body: JSON.stringify({ secretCode: 'test_secret' }),
        headers: { 'Content-Type': 'application/json' },
      });
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Source harus dikirim');
    });

    it('should reject when secretCode is invalid', async () => {
      const res = await request('DELETE', '/documents', {
        body: JSON.stringify({ source: 'uploads/test.pdf', secretCode: 'wrong' }),
        headers: { 'Content-Type': 'application/json' },
      });
      expect(res.status).toBe(401);
      expect(res.body.message).toBe('Kode rahasia tidak valid');
    });

    it('should reject when secretCode is missing', async () => {
      const res = await request('DELETE', '/documents', {
        body: JSON.stringify({ source: 'uploads/test.pdf' }),
        headers: { 'Content-Type': 'application/json' },
      });
      expect(res.status).toBe(400);
    });

    it('should return 404 when source not found', async () => {
      const res = await request('DELETE', '/documents', {
        body: JSON.stringify({ source: 'nonexistent.pdf', secretCode: 'test_secret' }),
        headers: { 'Content-Type': 'application/json' },
      });
      expect(res.status).toBe(404);
      expect(res.body.message).toContain('tidak ditemukan');
    });
  });
});
