const app = require('./app');
const env = require('./config/env');
const logger = require('./utils/logger');

const PORT = env.PORT;

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT} in ${env.NODE_ENV} mode`);
});
