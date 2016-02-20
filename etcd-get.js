'use strict';

var Etcd = require('node-etcd');

module.exports = function (hosts) {
  var client = new Etcd(hosts);

  function get (key, cb) {
    client.get(key, function (err, res) {
      if (err) return cb(err);

      var result;
      try {
        result = JSON.parse(res.node.value);
      } catch (e) {
        result = res.node.value;
      } finally {
        cb(null, result);
      }
    });
  }

  return get;
};
