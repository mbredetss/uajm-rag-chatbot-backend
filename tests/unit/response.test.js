import { describe, it, expect } from 'vitest';
import { successResponse, errorResponse } from '../../src/producer/utils/response.js';

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

describe('response utils', () => {
  describe('successResponse', () => {
    it('should return success response with data', () => {
      const res = createMockRes();
      successResponse(res, 200, 'ok', { id: 1 });
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({ status: 'success', message: 'ok', data: { id: 1 } });
    });

    it('should return success response without data', () => {
      const res = createMockRes();
      successResponse(res, 201, 'created');
      expect(res.statusCode).toBe(201);
      expect(res.body).toEqual({ status: 'success', message: 'created' });
    });
  });

  describe('errorResponse', () => {
    it('should return error response', () => {
      const res = createMockRes();
      errorResponse(res, 400, 'bad');
      expect(res.statusCode).toBe(400);
      expect(res.body).toEqual({ status: 'fail', message: 'bad' });
    });
  });
});
