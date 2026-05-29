/* istanbul ignore file */
const successResponse = (res, statusCode, message, data = null) => {
  const response = { status: 'success', message };
  if (data !== null) {
    response.data = data;
  }
  return res.status(statusCode).json(response);
};

const errorResponse = (res, statusCode, message) => {
  return res.status(statusCode).json({ status: 'fail', message });
};

export { successResponse, errorResponse };
