'use strict';
var seq = require('seq');

var consul = require('./consul-get.js');
var etcd = require('./etcd-get.js');

var getKV = false;
var getSRV = false;

module.exports = expander;
function expander (kvs_type, getSRVExternal, incoming_config, cb) {
  getKV = getter(kvs_type, incoming_config);
  getSRV = getSRVExternal;
  recursiveEach(incoming_config, resolveKV, function (err, first_expanded) {
    if (err) console.log({ error: err }, 'Error in recursiveEach callback');
    recursiveEach(first_expanded, resolveSRV, cb);
  });
}

function getter (type, incoming_config) {
  if (type === 'consul') {
    return consul(incoming_config.kvs_hosts);
  } else {
    return etcd(incoming_config.kvs_hosts);
  }
}

function recursiveEach (obj, action, cb) {
  seq(Object.keys(obj))
    .parEach(function (key) {
      var done = this;
      var val = obj[key];
      if (typeof val === 'object') {
        recursiveEach(val, action, function (err, new_val) {
          if (err) console.log({ error: err }, 'Error in recursiveEach if');
          obj[key] = new_val;
          done();
        });
      } else {
        action(val, function (err, new_val) {
          if (err) console.log({ error: err }, 'Error in recursiveEach else');
          obj[key] = new_val;
          done();
        });
      }
    }).seq(function () {
      cb(null, obj);
      return this();
    });
}

function resolveSRV (val, cb) {
  var regex = /^srv:(.*)$/;
  if (matches(regex, val)) {
    var key = val.match(regex)[1];
    getSRV(key, function (err, record) {
      if (err) console.log({ error: err }, 'Error in resolveSRV');
      return cb(null, record);
    });
  } else {
    return cb(null, val);
  }
}

function resolveKV (val, cb) {
  var regex = /^kv:(.*)$/;
  if (matches(regex, val) && getKV) {
    getKV(val.match(regex)[1], function (err, value) {
      if (err) {
        console.log({ error: err }, 'Error getting key/value');
        return cb(err, val);
      }
      return cb(null, value);
    });
  } else {
    return cb(null, val);
  }
}

function matches (reg, val) {
  return typeof val === 'string' && reg.test(val);
}
