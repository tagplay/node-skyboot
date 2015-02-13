'use strict';
process.env.LOG_LEVEL = 'fatal';
var assert = require('assert');
var skyboot = require('../');

describe('Simple Logger', function() {

  it('Has log level functions', function() {
    skyboot.init({}, function () {
      var log = skyboot.log();
      assert(typeof log.trace, 'function');
      assert(typeof log.info, 'function');
      assert(typeof log.warn, 'function');
      assert(typeof log.error, 'function');
      assert(typeof log.fatal, 'function');
      log.trace('Testing trace Level');
      log.debug('Testing debug Level');
      log.info('Testing info Level');
      log.warn('Testing warn Level');
      log.error('Testing error Level');
      log.fatal('Testing fatal Level');
    });
  });


});
