// Test Modules
// Modules
const WINSTON = require('winston');

const logger = WINSTON.createLogger({
  level: 'info',
  transports: [new WINSTON.transports.Console()]
});

logger.info('Hello world!');
