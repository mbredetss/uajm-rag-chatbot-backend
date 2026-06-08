import AuthenticationError from '../exceptions/AuthenticationError.js';

const verifySecretCode = (req, res, next) => {
  const secretCode = req.headers['secret-code'];

  if (secretCode !== process.env.SECRET_CODE) {
    throw new AuthenticationError('Kode rahasia tidak valid');
  }
  return next();
};

export default verifySecretCode;