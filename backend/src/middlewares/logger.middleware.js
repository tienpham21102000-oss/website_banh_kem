const logger = require('../utils/logger');

/**
 * Request logging middleware
 */
function requestLoggerMiddleware(req, res, next) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
  });

  next();
}

module.exports = { requestLoggerMiddleware };
