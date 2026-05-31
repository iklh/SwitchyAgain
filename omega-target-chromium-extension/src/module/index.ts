// @ts-nocheck
var base, name, ref, value;

module.exports = {
  Storage: require('./storage'),
  Options: require('./options'),
  ChromeTabs: require('./tabs'),
  SwitchySharp: require('./switchysharp'),
  ExternalApi: require('./external_api'),
  WebRequestMonitor: require('./web_request_monitor'),
  Inspect: require('./inspect'),
  Url: require('url'),
  proxy: require('./proxy')
};

ref = require('omega-target');
for (name in ref) {
  value = ref[name];
  if ((base = module.exports)[name] == null) {
    base[name] = value;
  }
}

export {};
