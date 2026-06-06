import { response } from '../utils/index.js';

const verifyAdmin = (req, res, next) => {
  const { role } = req.user;

  if (role !== 'admin' || role !== 'super admin') {
    return response(res, 403, 'Akses ditolak. Anda tidak memiliki hak akses sebagai admin');
  }

  next();
};

export default verifyAdmin;