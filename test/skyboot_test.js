'use strict';
process.env.LOG_LEVEL = 'fatal';
var dns = require('dns');
var assert = require('chai').assert;
var sinon = require('sinon');

var skyboot = require('../');


describe('Initializing SkyBoot', function() {
  before(function() {
    sinon.stub(dns, 'resolveSrv', function (key, cb) {
      cb(null, [{name: 'myhost', port: 1337}]);
    });
  });

  after(function () {
    dns.resolveSrv.restore();
  });

  it('requires config', function() {
    assert.throws(function () {
      skyboot.init();
    });
  });

  it('requires callback', function() {
    assert.throws(function () {
      skyboot.init({});
    });
  });

  it('start up', function(done) {
    skyboot.init({}, function (err, config) {
      assert.ifError(err);
      assert(config);
      done();
    });
  });

  it('forwards config', function(done) {
    skyboot.init({test:true}, function () {
      assert(skyboot.config().test);
      done();
    });
  });

  it('looks up etcd hosts', function(done) {
    skyboot.init({etcd_service:true}, function () {
      var hosts = skyboot.config().etcd_hosts;
      assert.isArray(hosts);
      assert.include(hosts, 'myhost:1337');
      done();
    });
  });

});
