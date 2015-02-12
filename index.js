'use strict';
var dns = require('dns');
var seq = require('seq');
var configEtcd = require('config-etcd');
var cache_manager = require('cache-manager');

var SimpleLogger = require('./simple-logger');

var initialized = false;
var expanded = false;
var root_config = {};
var srv_records = {};
var memory_cache = cache_manager.caching({store: 'memory', max: 100, ttl: 5});

module.exports.init = init;
module.exports.getSRV = getSRV;
module.exports.getPrefetchedSRV = getPrefetchedSRV;
module.exports.get = get;

function init(incoming_config, cb) {
  var self = this;
  if (!incoming_config) { incoming_config = {}; }
  if (!cb) { cb = function () {}; }
  srv_records = incoming_config.srv_records || {};

  if (!incoming_config.log) { incoming_config.log = new SimpleLogger(); }
  this.log = incoming_config.log;

  seq()
    .seq(getEtcdHosts)
    .seq(getConfig)
    .flatten()
    .parEach(prefetchSrvRecords)
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
      self.log.debug('ETCD hosts found: '+hosts);
      incoming_config.etcd_hosts = hosts;
      return done();
    });
  }

  function getConfig() {
    var done = this;
    if (!incoming_config.etcd_hosts) {
      this.log.warn('No etcd hosts found. Not expanding config.');
      root_config = incoming_config;
      return done();
    }
    // Get the Config from Etcd
    configEtcd(incoming_config.etcd_hosts, incoming_config, function (err, updated_config) {
      if (err) { throw err; }
      root_config = updated_config;
      expanded = true;
      // Set up prefetch phase
      return done(null, updated_config.skydns_prefetch || []);
    });
  }

  function prefetchSrvRecords(service) {
    // SkyDNS Prefetch Values
    var done = this;
    self.log.debug('Prefetching DNS record '+service);
    getSRV(service, function (err, item) {
      if (err) { throw err; }
      srv_records[service] = item;
      done();
    });
  }

  function finish() {
    var done = this;
    cb(null, root_config);
    initialized = true;
    return done();
  }

}

function getSRV(service, cb) {
  ensureInitialized();
  if (srv_records[service]) {
    return cb(srv_records[service]);
  }
  memory_cache.get(service, function (err, result) {
    if (!err && result) {
      var item = result[Math.floor(Math.random() * result.length)];
      return cb(null, item);
    }
    dns.resolveSrv(service, function (err, records) {
      if (err) {
        throw new Error('DNS SRV lookup error for '+service);
      }
      // TODO: We need this more sexy. And (optionally) caching.
      var item = records[Math.floor(Math.random() * records.length)];
      cb(null, item);
      memory_cache.set(service, records);
    });
  });
}

function get(key) {
  ensureInitialized();
  if (root_config[key]) {
    return root_config[key];
  } else {
    throw new Error('Key not found in config: '+key);
  }
}

function getPrefetchedSRV(service) {
  ensureInitialized();
  if (srv_records[service]) {
    return srv_records[service];
  } else {
    throw new Error('SRV record was not prefetched for '+service);
  }
}

function ensureInitialized() {
  if (!initialized) {
    throw new Error('SkyBoot has not initalized');
  }
}
