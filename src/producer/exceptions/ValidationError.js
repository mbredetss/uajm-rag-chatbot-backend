import ClientError from './ClientError.js';

class ValidationError extends ClientError {
  constructor(message) {
    super(message, 400);
    this.name = 'ValidationError';
  }
}

export default ValidationError;
