'use strict';
var dns = require('dns');
var seq = require('seq');
var configEtcd = require('config-etcd');

var SimpleLogger = require('./simple-logger');

var root_config = {};
var srv_records = {};

module.exports.init = init;
module.exports.getSRV = getSRV;
module.exports.getPrefetchedSRV = getPrefetchedSRV;
module.exports.get = get;

function init(options, cb) {
  var self = this;
  if (!options) { options = {}; }
  if (!cb) { cb = function () {}; }

  if (!options.log) { options.log = new SimpleLogger(); }
  this.log = options.log;

  if (!options.etcd_service) {
    this.log.fatal('No options.etcd_service found. Not expanding options.');
    root_config = options;
    srv_records = options.srv_records || {};
    return cb();
  }

  seq()
    .seq('etcd_hosts', getEtcdHosts)
    .seq('config', getConfig)
    .flatten()
    .parEach(prefetchSrvRecords)
    .seq(finish);

  function getEtcdHosts() {
    var done = this;
    dns.resolveSrv(options.etcd_service, function (err, records) {
      if (err) { throw err }
      var hosts = records.map(function (obj) {
        return [obj.name, obj.port].join(':');
      });
      self.log.debug('ETCD hosts found: '+hosts);
      return done(null, hosts);
    });
  }

  function getConfig() {
    var done = this;
    // Get the Config from Etcd
    configEtcd(this.vars.etcd_hosts, options, function (err, updated_config) {
      if (err) { throw err; }
      root_config = updated_config;
      // Set up prefetch phase
      return done(null, updated_config.skydns_prefetch || []);
    });
  }

  function prefetchSrvRecords(service) {
    // SkyDNS Prefetch Values
    var done = this;
    self.log.debug('Prefetching DNS record '+service);
    getSRV(service, function (err, item) {
      srv_records[service] = item;
      done(err, item);
    });
  }

  function finish() {
    cb(null, root_config);
    this(null);
  }

}

function getSRV(service, cb) {
  dns.resolveSrv(service, function (err, records) {
    if (err) {
      throw new Error('DNS SRV lookup error for '+service);
    }
    // TODO: We need this more sexy. And (optionally) caching.
    var item = records[Math.floor(Math.random() * records.length)];
    return cb(null, item);
  });
}

function get(key) {
  if (root_config[key]) {
    return root_config[key];
  } else {
    throw new Error('Key not found in config: '+key);
  }
}

function getPrefetchedSRV(service) {
  if (srv_records[service]) {
    return srv_records[service];
  } else {
    throw new Error('SRV record was not prefetched for '+service);
  }
}
