import bcrypt from 'bcrypt';
import { TokenManager } from '../../../security/token-manager.js';
import { response } from '../../../utils/index.js';
import authenticationRepositories from '../repositories/authentication-repositories.js';

export const login = async (req, res) => {
  const { username, password } = req.validated;

  const user = await authenticationRepositories.verifyUserCredential(username);

  if (user) {
    const isCredentialValid = await bcrypt.compare(password, user.password);

    if (isCredentialValid) {
      const { id, role } = user;
      const accessToken = TokenManager.generateAccessToken({ id, role });
      const refreshToken = TokenManager.generateRefreshToken({ id, role });

      await authenticationRepositories.addRefreshToken(refreshToken);

      return response(res, 201, null, {
        accessToken,
        refreshToken,
        role
      });
    }
    return response(res, 401, 'Username atau password salah!', null);
  }

  return response(res, 401, 'Username atau password salah!', null);
};

export const newAccessToken = async (req, res) => {
  const refreshToken = req.validated.refreshToken;

  const isRefreshTokenValid = await authenticationRepositories.verifyRefreshToken(refreshToken);

  if (isRefreshTokenValid) {
    const { id, role } = TokenManager.verifyRefreshToken(refreshToken);
    const accessToken = TokenManager.generateAccessToken({ id, role });

    return response(res, 200, null, { accessToken });
  }

  return response(res, 400, 'Refresh token tidak valid');
};

export const deleteRefreshAccessToken = async (req, res) => {
  const refreshToken = req.validated.refreshToken;

  const isRefreshTokenValid = await authenticationRepositories.verifyRefreshToken(refreshToken);

  if (isRefreshTokenValid) {
    await authenticationRepositories.deleteRefreshToken(refreshToken);

    return response(res, 200, 'Refresh token berhasil dihapus!', null);
  }

  return response(res, 400, 'Refresh token tidak valid', null);
};