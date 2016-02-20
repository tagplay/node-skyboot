'use strict';
process.env.LOG_LEVEL = 'fatal';
var assert = require('chai').assert;
var SimpleLogger = require('../simple-logger');
var log = new SimpleLogger();

describe('Simple Logger', function () {
  it('Has log level functions', function () {
    assert.isFunction(log.trace);
    assert.isFunction(log.info);
    assert.isFunction(log.warn);
    assert.isFunction(log.error);
    assert.isFunction(log.fatal);
  });
});
