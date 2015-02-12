'use strict';

var levels = {
  'fatal': 4,
  'error': 3,
  'info': 2,
  'debug': 1
};

module.exports = SimpleLogger;

function SimpleLogger() {
  this.level = process.env.LOG_LEVEL || 'debug';
}

SimpleLogger.prototype.should = function (level) {
  return levels[level] >= levels[this.level];
};

SimpleLogger.prototype.fatal = function (message) { if (this.should('fatal')) { console.log('[FATAL] '+message) } };
SimpleLogger.prototype.error = function (message) { if (this.should('error')) { console.log('[ERROR] '+message) } };
SimpleLogger.prototype.info = function (message) { if (this.should('info')) { console.log('[INFO] '+message) } };
SimpleLogger.prototype.debug = function (message) { if (this.should('debug')) { console.log('[DEBUG] '+message) } };
