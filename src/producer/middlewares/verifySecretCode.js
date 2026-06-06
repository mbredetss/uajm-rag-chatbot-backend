import { AuthenticationError } from '../exceptions/AuthenticationError.js';

const verifySecretCode = (secretCode) => {
  if (secretCode !== process.env.SECRET_CODE) {
    throw new AuthenticationError('Kode rahasia tidak valid');
  }
};

export default verifySecretCode;