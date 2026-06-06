import process from 'process';
import { response } from '../utils/index.js';
import jwt from 'jsonwebtoken';

function authenticateToken(req, res, next) {
  const token = req.headers.authorization;
  if (token && token.indexOf('Bearer ') !== -1) {
    try {
      const user = jwt.verify(token.split('Bearer ')[1], process.env.ACCESS_TOKEN_KEY);
      req.user = user;
      return next();
    } catch (e) {
      return response(res, 401, e.message, null);
    }
  }

  return response(res, 401, 'Unauthorized', null);
}

export default authenticateToken;