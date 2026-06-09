import multer from 'multer';
import ClientError from '../exceptions/ClientError.js';
import { response } from '../utils/index.js';

const errorHandler = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return response(res, 400, 'Ukuran dokumen melebihi batas maksimum 10MB');
    }
    return response(res, 400, err.message);
  }

  if (err.isJoi) {
    return response(res, 400, err.details[0].message, null);
  }

  if (err instanceof ClientError) {
    return response(res, err.statusCode, err.message);
  }

  return response(res, 500, 'Terjadi kesalahan pada server');
};

export default errorHandler;
