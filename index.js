'use strict';
var dns = require('dns');
var seq = require('seq');
var Etcd = require('node-etcd');
var cache_manager = require('cache-manager');

var SimpleLogger = require('./simple-logger');
var expander = require('./expander');

var initialized = false;
var root_config = {};
var srv_records = {};
var etcd = false;
var log = new SimpleLogger();
var memory_cache = cache_manager.caching({store: 'memory', max: 100, ttl: 5});

module.exports.init = init;
module.exports.getSRV = getSRV;
module.exports.config = getConfig;
module.exports.log = getLogger;

function init(incoming_config, cb) {
  if (!incoming_config) { throw new Error('init() called without config'); }
  if (!cb) { throw new Error('init() called without a callback'); }
  srv_records = incoming_config.srv_records || {};

  if (incoming_config.log) {
    log = incoming_config.log;
    delete incoming_config.log;
   }

  seq()
    .seq(getEtcdHosts)
    .seq(expandConfig)
    .seq(finish);

  function getEtcdHosts() {
    var done = this;
    if (!incoming_config.etcd_service) {
      return done();
    }
    dns.resolveSrv(incoming_config.etcd_service, function (err, records) {
      if (err) { throw err }
      var hosts = records.map(function (obj) {
        return [obj.name, obj.port].join(':');
      });
      log.debug('ETCD hosts found: '+hosts);
      incoming_config.etcd_hosts = hosts;
      return done();
    });
  }

  function expandConfig() {
    var done = this;
    if (!incoming_config.etcd_hosts) {
      log.warn('No etcd hosts found. Not expanding etcd://');
    } else {
      etcd = new Etcd(incoming_config.etcd_hosts);
    }
    expander(etcd, getSRV, incoming_config, function (err, expanded_config) {
      root_config = expanded_config;
      return done();
    });
  }

  function finish() {
    var done = this;
    initialized = true;
    cb(null, root_config);
    return done();
  }

}

function getSRV(service, cb) {
  if (srv_records[service]) {
    return cb(srv_records[service]);
  }
  memory_cache.get(service, function (err, result) {
    if (!err && result) {
      var item = result[Math.floor(Math.random() * result.length)];
      return cb(null, {host: item.name, port: item.port});
    }
    dns.resolveSrv(service, function (err, records) {
      if (err) {
        throw new Error('DNS SRV lookup error for '+service);
      }
      // TODO: We need this more sexy. And (optionally) caching.
      var item = records[Math.floor(Math.random() * records.length)];
      cb(null, {host: item.name, port: item.port});
      memory_cache.set(service, records);
    });
  });
}

function getConfig(key) {
  ensureInitialized('config()');
  if (!key) { return root_config; }
  return root_config[key];
}

function getLogger() {
  ensureInitialized('log()');
  return log;
}

function ensureInitialized(fun) {
  if (!initialized) {
    throw new Error('SkyBoot has not initalized. Unable to call '+fun);
  }
}
