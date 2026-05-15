const CONSTANTS = require('../utils/constant');
const logger = require('../utils/logger');

/**
 * Global error handler middleware
 */
function errorHandlerMiddleware(err, req, res, next) {
  logger.error(`Error: ${err.message}`, err.stack);

  const statusCode = err.status || CONSTANTS.HTTP_STATUS.INTERNAL_ERROR;
  const message = err.message || CONSTANTS.ERRORS.INTERNAL_ERROR;

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

module.exports = { errorHandlerMiddleware };
