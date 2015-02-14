'use strict';
process.env.LOG_LEVEL = 'fatal';
var assert = require('chai').assert;
var skyboot = require('../');

describe('Simple Logger', function() {

  it('Has log level functions', function() {
    skyboot.init({}, function () {
      var log = skyboot.log();
      assert.isFunction(log.trace);
      assert.isFunction(log.info);
      assert.isFunction(log.warn);
      assert.isFunction(log.error);
      assert.isFunction(log.fatal);
    });
  });


});
