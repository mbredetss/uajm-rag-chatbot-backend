import { describe, it, expect, vi, beforeEach } from 'vitest';
import multer from 'multer';
import ClientError from '../../src/producer/exceptions/ClientError.js';
import errorHandler from '../../src/producer/middlewares/errorHandler.js';

const createMockRes = () => {
  const res = {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
  };
  return res;
};

describe('errorHandler middleware', () => {
  let consoleSpy;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should handle MulterError LIMIT_FILE_SIZE', () => {
    const err = new multer.MulterError('LIMIT_FILE_SIZE');
    const res = createMockRes();
    errorHandler(err, {}, res, () => {});
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Ukuran dokumen melebihi batas maksimum 10MB');
  });

  it('should handle other MulterError', () => {
    const err = new multer.MulterError('LIMIT_UNEXPECTED_FILE');
    const res = createMockRes();
    errorHandler(err, {}, res, () => {});
    expect(res.statusCode).toBe(400);
  });

  it('should handle ClientError', () => {
    const err = new ClientError('client error', 422);
    const res = createMockRes();
    errorHandler(err, {}, res, () => {});
    expect(res.statusCode).toBe(422);
    expect(res.body.message).toBe('client error');
  });

  it('should handle unknown error with 500', () => {
    const err = new Error('unknown');
    const res = createMockRes();
    errorHandler(err, {}, res, () => {});
    expect(res.statusCode).toBe(500);
    expect(res.body.message).toBe('Terjadi kesalahan pada server');
    expect(consoleSpy).toHaveBeenCalled();
  });
});
