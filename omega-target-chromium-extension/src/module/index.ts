const chromiumTarget: Record<string, unknown> = {
  Storage: require('./storage'),
  Options: require('./options'),
  ChromeTabs: require('./tabs'),
  ExternalApi: require('./external_api'),
  WebRequestMonitor: require('./web_request_monitor'),
  Inspect: require('./inspect'),
  Url: require('url'),
  proxy: require('./proxy')
};

const omegaTarget = require('omega-target') as Record<string, unknown>;

for (const name of Object.keys(omegaTarget)) {
  if (chromiumTarget[name] == null) {
    chromiumTarget[name] = omegaTarget[name];
  }
}

export = chromiumTarget;
