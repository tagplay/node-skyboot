'use strict';

var levels = {
  'fatal': 60,
  'error': 50,
  'warn':  40,
  'info':  30,
  'debug': 20,
  'trace': 10
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
SimpleLogger.prototype.warn = function (message) { if (this.should('warn')) { console.log('[WARN] '+message) } };
SimpleLogger.prototype.info = function (message) { if (this.should('info')) { console.log('[INFO] '+message) } };
SimpleLogger.prototype.debug = function (message) { if (this.should('debug')) { console.log('[DEBUG] '+message) } };
SimpleLogger.prototype.trace = function (message) { if (this.should('trace')) { console.log('[TRACE] '+message) } };
