const logger = require('../utils/logger');

// Simple in-memory storage for Redis mock
const store = new Map();

const client = {
  isOpen: true,
  
  async connect() {
    logger.info('Mock Redis connected');
    return this;
  },

  async set(key, value) {
    logger.info(`REDIS SET: ${key}`);
    store.set(key, value);
    return 'OK';
  },

  async setex(key, seconds, value) {
    logger.info(`REDIS SETEX: ${key} (${seconds}s)`);
    store.set(key, value);
    // In a real mock we might set a timeout to delete it, but for demo we just keep it
    return 'OK';
  },

  async get(key) {
    logger.info(`REDIS GET: ${key}`);
    return store.get(key) || null;
  },

  async del(key) {
    logger.info(`REDIS DEL: ${key}`);
    store.delete(key);
    return 1;
  },

  async exists(key) {
    return store.has(key) ? 1 : 0;
  },

  on() {},
  
  async ensureConnection() {
    return this;
  }
};

logger.info('Using Demo Redis (Extended for Cart)');

module.exports = client;
