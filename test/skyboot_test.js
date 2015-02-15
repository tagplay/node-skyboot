'use strict';
process.env.LOG_LEVEL = 'fatal';
var dns = require('dns');
var assert = require('chai').assert;
var sinon = require('sinon');

var skyboot = require('../');
var SimpleLogger = require('../simple-logger');


describe('Initializing SkyBoot', function() {
  before(function() {
    sinon.stub(dns, 'resolveSrv', function (service, cb) {
      var records = {
        'etcd.skydns.local': [{name: 'myhost', port: 1337}],
        'service.skydns.local': [{name: 'override_host', port: 1337}]
      };
      if(records[service]) {
        return cb(null, [{name: 'myhost', port: 1337}]);
      }
      throw new Error('DNS.resolveSrv lookup error for '+ service);
    });
  });

  after(function () {
    dns.resolveSrv.restore();
  });

  it('denies you uninitialize access to config()', function () {
    assert.throws(function config() {
      skyboot.config();
    });
  });

  it('denies you uninitialize access to log()', function () {
    assert.throws(function log() {
      skyboot.log();
    });
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

  it('returns you your config', function(done) {
    skyboot.init({test:true}, function () {
      assert.ok(skyboot.config().test);
      assert.ok(skyboot.config('test'));
      done();
    });
  });

  it('returns you a default log object', function(done) {
    skyboot.init({}, function () {
      assert.isObject(skyboot.log());
      done();
    });
  });

  it('returns you custom log object', function(done) {
    var logger = new SimpleLogger();
    logger.test_property = true;
    skyboot.init({log:logger}, function () {
      assert.isObject(skyboot.log());
      assert.ok(skyboot.log().test_property);
      done();
    });
  });

  it('looks up etcd hosts', function(done) {
    skyboot.init({etcd_service:'etcd.skydns.local'}, function () {
      var hosts = skyboot.config().etcd_hosts;
      assert.isArray(hosts);
      assert.include(hosts, 'myhost:1337');
      done();
    });
  });

  it('allows you to look up DNS SRV', function () {
    skyboot.getSRV('service.skydns.local', function (err, host) {
      assert.propertyVal(host, 'host', 'myhost');
      assert.propertyVal(host, 'port', 1337);
    });
  });

  it('uses previous DNS SRV lookup cache', function (done) {
    process.nextTick(function () {
      skyboot.getSRV('service.skydns.local', function (err, host) {
        assert.propertyVal(host, 'host', 'myhost');
        assert.propertyVal(host, 'port', 1337);
        assert.propertyVal(host, 'from_cache', true);
        done();
      });
    });
  });

  it('uses overridden SRV records', function () {
    var template = {
      srv_records: {
        'service.skydns.local': {host: 'override_host', port: 1337}
      }
    };
    skyboot.init(template, function () {
      skyboot.getSRV('service.skydns.local', function (err, host) {
        assert.propertyVal(host, 'host', 'override_host');
        assert.propertyVal(host, 'port', 1337);
      });
    });
  });

});
