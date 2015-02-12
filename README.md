# SkyBoot

Helper library for starting up apps with [SkyDNS](https://github.com/skynetservices/skydns) and [Config-Etcd](https://www.npmjs.com/package/config-etcd).

Simple standalone example:

```js
var skyboot = require('skyboot');
var config_template = {
  etcd_service: 'etcd-4001.skydns.local',
  skydns_prefetch: ['mqtt.skydns.local', 'redis.skydns.local'],
  port: 'etcd:/apps/myservice/port'
  github: { api_key: 'etcd:/apps/github/api_key' }
};

skyboot.init(config_template, function () {
  var mqtt_config = skyboot.getPrefetchedSRV('mqtt.skydns.local');
  mqtt.connect(mqtt_config.port, mqtt_config.connect);
  // ... Do all your stuff like starting a http server listener
});
```

Works wonderfully with other boot phase libs like [bootable](https://www.npmjs.com/package/bootable) or  [onboot](https://www.npmjs.com/package/onboot):

```js
var onboot = require('onboot');
var skyboot = require('skyboot');

onboot.strap(function (done) {
  var config_template = {
    etcd_service: 'etcd-4001.skydns.local',
    skydns_prefetch: ['mqtt.skydns.local', 'redis.skydns.local'],
    port: 'etcd:/apps/myservice/port'
  };
  skyboot.init(config_template, done);
})
onboot.strap(function (done) {
  // Do other async pre stuff
});

onboot.up(function () {
  var mqtt_config = skyboot.getPrefetchedSRV('mqtt.skydns.local');
  mqtt.connect(mqtt_config.port, mqtt_config.connect);
  // ... Do all your stuff like starting a http server listener
});
```
