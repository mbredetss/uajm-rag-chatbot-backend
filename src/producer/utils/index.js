export const response = (res, statusCode, message, data) => {
  if (message) {
    return res
      .status(statusCode)
      .json({
        'status': statusCode < 400 ? 'success' : 'fail',
        message
      });
  }

  return res
    .status(statusCode)
    .json({
      'status': statusCode < 400 ? 'success': 'fail',
      'data': data ?? {}
    });
};