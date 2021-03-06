'use strict';
var seq = require('seq');
var etcd = false;
var getSRV = false;

module.exports = expander;
function expander (etcdExternal, getSRVExternal, incoming_config, cb) {
  etcd = etcdExternal;
  getSRV = getSRVExternal;
  recursiveEach(incoming_config, resolveETCD, function (err, first_expanded) {
    if (err) console.log({ error: err }, 'Error in recursiveEach callback');
    recursiveEach(first_expanded, resolveSRV, cb);
  });
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

function resolveETCD (val, cb) {
  var regex = /^etcd:(.*)$/;
  if (matches(regex, val) && etcd) {
    var key = val.match(regex)[1];
    etcd.get(key, function (err, res) {
      if (err) {
        return cb(null, val);
      }
      var result;
      try {
        result = JSON.parse(res.node.value);
      } catch (e) {
        result = res.node.value;
      } finally {
        cb(null, result);
      }
    });
  } else {
    return cb(null, val);
  }
}

function matches (reg, val) {
  return typeof val === 'string' && reg.test(val);
}
