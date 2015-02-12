# SkyBoot

Helper library for starting up and configuring apps with [SkyDNS](https://github.com/skynetservices/skydns) and [Etcd](https://github.com/coreos/etcd).

## Methods

### skyboot.init(config, callback);

Initializes the config. Once everything has been set up it runs `callback`. Everything that depends on the config should be run inside that callback.

### skyboot.getSrv(service, _cb(err, record)_ );

Looks up the DNS SRV record and returns a random service from the list of services.

`record` will be in the form:
```js
{ host: 'hostname.service.skydns.local', port: 8080}
```

### skyboot.log

Get the log object.

### skyboot.config

Access the config object.


## Config Explanation

SkyBoot expands values that begin with etcd: or srv: into the values received from the etcd or the DNS srv records.

For example:

```js
{
  etcd_service: 'etcd-4001.skydns.local',
  db: {
    server: 'srv:redis.skydns.local'
    password: 'etcd:/services/db/password'
  }
}
```

Will be expanded to:

```js
{
  etcd_service: 'etcd-4001.skydns.local',
  db: {
    server: { host: 'redis1.redis.skydns.local', port: 1337 }
    password: 'mysuperpass'
  }
}
```

### Special Keys

#### etcd_service: ""

Defines a DNS SRV record to look up etcd servers. The results will then override etcd_hosts.

#### etcd_hosts: []

A list of etcd servers in the format `'host:port'`.

If etcd_hosts and etcd_service are empty `etcd:` config values will not expand but initialization will complete.

#### srv_records: {}

Custom prefilling of dns lookup results for config expansion and `getSrv()`.

This is mostly useful for local development that might not have access to the right DNS and when controlled results are required from config expansion and `getSrv()`.

#### log: SimpleLogger

Set a logging object. This object will be used by SkyBoot for messages.

## Quick Example

Simple standalone example:

```js
var http = require('http');
var request = require('request');
var skyboot = require('skyboot');
var mqtt = require('mqtt');
var config_template = {
  etcd_service: 'etcd-4001.skydns.local',
  mqtt: 'srv:mqtt.skynds.local',
  port: 'etcd:/apps/myservice/port',
  github: { api_key: 'etcd:/apps/github/api_key' }
};

skyboot.init(config_template, function () {
  var mqtt_config = skyboot.config.mqtt;
  mqtt.connect(mqtt_config.port, mqtt_config.host);
  var server = http.createServer().listen(skyboot.config.port);
  skyboot.getSRV('metrics.skynds.local', function (err, service) {
    var url = ['http://', service.host, ':', service.port, '/announce/server_start'].join();
    request.post(url, { listening: 'myserver', port: skyboot.config.port });
  });
});
```

Works wonderfully with other boot phase libs like [bootable](https://www.npmjs.com/package/bootable) or  [onboot](https://www.npmjs.com/package/onboot):

```js
var onboot = require('onboot');
var skyboot = require('skyboot');

onboot.strap(function (done) {
  var config_template = {
    etcd_service: 'etcd-4001.skydns.local',
    mqtt: 'srv:mqtt.skynds.local',
    port: 'etcd:/apps/myservice/port'
  };
  skyboot.init(config_template, done);
})
onboot.strap(function (done) {
  // Do other async pre stuff
});

onboot.up(function () {
  mqtt.connect(skyboot.config.mqtt.port, skyboot.config.mqtt.host);
  // ... Do all your stuff like starting a http server listener
});
```
