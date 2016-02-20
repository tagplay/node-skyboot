'use strict';
process.env.LOG_LEVEL = 'fatal';
var assert = require('chai').assert;

var expander = require('../expander');

var getSRVmock = function (key, cb) {
  cb(null, {host: 'localhost', port: 1337});
};

var etcd_mock = {
  get: function (key, cb) {
    var res = {node: {value: 'etcdvalue'}};
    cb(null, res);
  }
};

describe('Expander', function () {
  it('expands config', function () {
    var template = {
      test: true,
      my_host: 'srv:anotherbites',
      my_key: 'etcd:/some/key/val'
    };
    expander('etcd', getSRVmock, template, function (err, config) {
      assert.ok(config.test);
      assert.isObject(config.my_host);
      assert.deepPropertyVal(config, 'my_host.host', 'localhost');
      assert.deepPropertyVal(config, 'my_host.port', 1337);
      assert.propertyVal(config, 'my_key', 'etcdvalue');
    });
  });
});
