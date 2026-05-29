var errors;
var utils;

module.exports = {
  Log: require('./src/log'),
  Storage: require('./src/storage'),
  BrowserStorage: require('./src/browser_storage'),
  Options: require('./src/options'),
  OptionsSync: require('./src/options_sync'),
  OmegaPac: require('omega-pac')
};

utils = require('./src/utils');
for (var name in utils) {
  if (!Object.prototype.hasOwnProperty.call(utils, name)) {
    continue;
  }
  module.exports[name] = utils[name];
}

errors = require('./src/errors');
for (var errorName in errors) {
  if (!Object.prototype.hasOwnProperty.call(errors, errorName)) {
    continue;
  }
  module.exports[errorName] = errors[errorName];
}
