export const successResponse = (data, message = 'Success') => {
  return { success: true, message, data, timestamp: new Date().toISOString() };
};

export const errorResponse = (message, statusCode = 500) => {
  return { success: false, message, statusCode, timestamp: new Date().toISOString() };
};
