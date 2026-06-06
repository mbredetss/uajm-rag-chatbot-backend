import multer from 'multer';
import ClientError from '../exceptions/ClientError.js';
import { errorResponse } from '../utils/response.js';
import { response } from '../utils/index.js';

const errorHandler = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return errorResponse(res, 400, 'Ukuran dokumen melebihi batas maksimum 10MB');
    }
    return errorResponse(res, 400, err.message);
  }

  if (err.isJoi) {
    return response(res, 400, err.details[0].message, null);
  }

  if (err instanceof ClientError) {
    return errorResponse(res, err.statusCode, err.message);
  }

  console.error(err);
  return errorResponse(res, 500, 'Terjadi kesalahan pada server');
};

export default errorHandler;
