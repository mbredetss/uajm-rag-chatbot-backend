import jwt from 'jsonwebtoken';
import process from 'process';

export const TokenManager = {
  generateAccessToken: (payload) => jwt.sign(payload, process.env.ACCESS_TOKEN_KEY),
  generateRefreshToken: (payload) => jwt.sign(payload, process.env.REFRESH_TOKEN_KEY),
  verifyRefreshToken: (refreshToken) => jwt.verify(refreshToken, process.env.REFRESH_TOKEN_KEY)
};