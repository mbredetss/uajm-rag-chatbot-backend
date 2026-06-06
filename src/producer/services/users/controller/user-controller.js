import { response } from '../../../utils/index.js';
import userRepositories from '../repositories/user-repositories.js';

export const createUser = async (req, res) => {
  const { username, password, fullname } = req.validated;

  const isUsernameExist = await userRepositories.verifyNewUsername(username);

  if (isUsernameExist) {
    return response(res, 400, 'Gagal menambahkan user. Username sudah di gunakan!', null);
  }

  const user = await userRepositories.createUser(username, password, fullname);

  if (!user) {
    return response(res, 400, null, null);
  }

  const userId = user.id;
  return response(res, 201, null, { userId });
};