import { describe, it, expect } from 'vitest';
import ClientError from '../../src/producer/exceptions/ClientError.js';
import ValidationError from '../../src/producer/exceptions/ValidationError.js';
import AuthenticationError from '../../src/producer/exceptions/AuthenticationError.js';
import NotFoundError from '../../src/producer/exceptions/NotFoundError.js';

describe('Custom Errors', () => {
  describe('ClientError', () => {
    it('should create error with default status 400', () => {
      const error = new ClientError('test');
      expect(error.message).toBe('test');
      expect(error.statusCode).toBe(400);
      expect(error.name).toBe('ClientError');
      expect(error).toBeInstanceOf(Error);
    });

    it('should create error with custom status', () => {
      const error = new ClientError('test', 409);
      expect(error.statusCode).toBe(409);
    });
  });

  describe('ValidationError', () => {
    it('should create error with status 400', () => {
      const error = new ValidationError('invalid');
      expect(error.message).toBe('invalid');
      expect(error.statusCode).toBe(400);
      expect(error.name).toBe('ValidationError');
      expect(error).toBeInstanceOf(ClientError);
    });
  });

  describe('AuthenticationError', () => {
    it('should create error with status 401', () => {
      const error = new AuthenticationError('unauthorized');
      expect(error.message).toBe('unauthorized');
      expect(error.statusCode).toBe(401);
      expect(error.name).toBe('AuthenticationError');
      expect(error).toBeInstanceOf(ClientError);
    });
  });

  describe('NotFoundError', () => {
    it('should create error with status 404', () => {
      const error = new NotFoundError('not found');
      expect(error.message).toBe('not found');
      expect(error.statusCode).toBe(404);
      expect(error.name).toBe('NotFoundError');
      expect(error).toBeInstanceOf(ClientError);
    });
  });
});
