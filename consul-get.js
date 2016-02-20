'use strict';

var consul = require('consul');

module.exports = function (hosts) {
  var client = consul({ host: hosts[0] });

  function get (key, cb) {
    if (key.indexOf('/') === 0) key = key.substring(1);

    client.kv.get(key, function (err, result) {
      if (err) console.error({ error: err, key: key }, 'Error getting value');
      cb(err, result.Value);
    });
  }

  return get;
};
