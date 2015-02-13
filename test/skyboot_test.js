'use strict';
process.env.LOG_LEVEL = 'fatal';
var assert = require('assert');
var skyboot = require('../');

describe('Initializing SkyBoot', function() {

  it('requires config and a callback', function() {
    assert.throws(function () {
      skyboot.init();
    });
    assert.throws(function () {
      skyboot.init({});
    });
  });

  it('start up', function() {
    skyboot.init({}, function (err, config) {
      assert.ifError(err);
      assert(config);
    });
  });

  it('Forwards config', function() {
    skyboot.init({test:true}, function () {
      assert(skyboot.config().test);
    });
  });

});
