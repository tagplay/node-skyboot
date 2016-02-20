'use strict';
var dns = require('dns');
var seq = require('seq');
var cache_manager = require('cache-manager');

var SimpleLogger = require('./simple-logger');
var expander = require('./expander');

var initialized = false;
var root_config = {};
var srv_records = {};
var log = new SimpleLogger();
var memory_cache = cache_manager.caching({store: 'memory', max: 100, ttl: 5});

module.exports.init = init;
module.exports.getSRV = getSRV;
module.exports.config = getConfig;
module.exports.log = getLogger;

function init (incoming_config, cb) {
  if (!incoming_config) { throw new Error('init() called without config'); }
  if (!cb) { throw new Error('init() called without a callback'); }
  srv_records = incoming_config.srv_records || {};

  if (incoming_config.log) {
    log = incoming_config.log;
    delete incoming_config.log;
  }

  // Backwards compatibility
  if (!incoming_config.kvs_service) incoming_config.kvs_service = incoming_config.etcd_service;
  if (!incoming_config.kvs_hosts) incoming_config.kvs_hosts = incoming_config.etcd_hosts;

  seq()
    .seq(getKvsHosts)
    .seq(expandConfig)
    .seq(finish);

  function getKvsHosts () {
    var done = this;
    if (!incoming_config.kvs_service) {
      return done();
    }
    dns.resolveSrv(incoming_config.kvs_service, function (err, records) {
      if (err) { throw err; }
      var hosts = records.map(function (obj) {
        return [obj.name, obj.port].join(':');
      });
      log.debug('Key/value store hosts found: ' + hosts);
      incoming_config.kvs_hosts = hosts;
      return done();
    });
  }

  function expandConfig () {
    var done = this;
    var kvs_type = incoming_config.kvs_type ? incoming_config.kvs_type : 'etcd';
    if (!incoming_config.kvs_hosts) {
      log.warn('No key/value store hosts found. Not expanding kv://');
    }
    expander(kvs_type, getSRV, incoming_config, function (err, expanded_config) {
      if (err) log.warn({ error: err }, 'Problem expanding config');
      root_config = expanded_config;
      return done();
    });
  }

  function finish () {
    var done = this;
    initialized = true;
    cb(null, root_config);
    return done();
  }
}

function getSRV (service, cb) {
  if (srv_records[service]) {
    return cb(null, srv_records[service]);
  }
  memory_cache.get(service, function (err, result) {
    if (!err && result) {
      var item = result[Math.floor(Math.random() * result.length)];
      return cb(null, {host: item.name, port: item.port, from_cache: true});
    }
    dns.resolveSrv(service, function (err, records) {
      if (err) {
        throw new Error('DNS SRV lookup error for ' + service);
      }
      var item = records[Math.floor(Math.random() * records.length)];
      cb(null, {host: item.name, port: item.port});
      memory_cache.set(service, records);
    });
  });
}

function getConfig (key) {
  ensureInitialized('config()');
  if (!key) { return root_config; }
  return root_config[key];
}

function getLogger () {
  ensureInitialized('log()');
  return log;
}

function ensureInitialized (fun) {
  if (!initialized) {
    throw new Error('SkyBoot has not initalized. Unable to call ' + fun);
  }
}
