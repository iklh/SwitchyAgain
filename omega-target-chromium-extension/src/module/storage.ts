// @ts-nocheck
var ChromeStorage, OmegaTarget, Promise, chromeApiPromisify,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

chromeApiPromisify = require('./chrome_api').chromeApiPromisify;

OmegaTarget = require('omega-target');

Promise = OmegaTarget.Promise;

ChromeStorage = (function(superClass) {
  extend(ChromeStorage, superClass);

  ChromeStorage.parseStorageErrors = function(err) {
    var sustainedPerMinute;
    if (err != null ? err.message : void 0) {
      sustainedPerMinute = 'MAX_SUSTAINED_WRITE_OPERATIONS_PER_MINUTE';
      if (err.message.indexOf('QUOTA_BYTES_PER_ITEM') >= 0) {
        err = new OmegaTarget.Storage.QuotaExceededError();
        err.perItem = true;
      } else if (err.message.indexOf('QUOTA_BYTES') >= 0) {
        err = new OmegaTarget.Storage.QuotaExceededError();
      } else if (err.message.indexOf('MAX_ITEMS') >= 0) {
        err = new OmegaTarget.Storage.QuotaExceededError();
        err.maxItems = true;
      } else if (err.message.indexOf('MAX_WRITE_OPERATIONS_') >= 0) {
        err = new OmegaTarget.Storage.RateLimitExceededError();
        if (err.message.indexOf('MAX_WRITE_OPERATIONS_PER_HOUR') >= 0) {
          err.perHour = true;
        } else if (err.message.indexOf('MAX_WRITE_OPERATIONS_PER_MINUTE') >= 0) {
          err.perMinute = true;
        }
      } else if (err.message.indexOf(sustainedPerMinute) >= 0) {
        err = new OmegaTarget.Storage.RateLimitExceededError();
        err.perMinute = true;
        err.sustained = 10;
      } else if (err.message.indexOf('is not available') >= 0) {
        err = new OmegaTarget.Storage.StorageUnavailableError();
      } else if (err.message.indexOf('Please set webextensions.storage.sync.enabled to true') >= 0) {
        err = new OmegaTarget.Storage.StorageUnavailableError();
      }
    }
    return Promise.reject(err);
  };

  function ChromeStorage(areaName1) {
    var ref;
    this.areaName = areaName1;
    if (typeof browser !== "undefined" && browser !== null ? (ref = browser.storage) != null ? ref[this.areaName] : void 0 : void 0) {
      this.storage = browser.storage[this.areaName];
    } else {
      this.storage = {
        get: chromeApiPromisify(chrome.storage[this.areaName], 'get'),
        set: chromeApiPromisify(chrome.storage[this.areaName], 'set'),
        remove: chromeApiPromisify(chrome.storage[this.areaName], 'remove'),
        clear: chromeApiPromisify(chrome.storage[this.areaName], 'clear')
      };
    }
  }

  ChromeStorage.prototype.get = function(keys) {
    if (keys == null) {
      keys = null;
    }
    return Promise.resolve(this.storage.get(keys))["catch"](ChromeStorage.parseStorageErrors);
  };

  ChromeStorage.prototype.set = function(items) {
    if (Object.keys(items).length === 0) {
      return Promise.resolve({});
    }
    return Promise.resolve(this.storage.set(items))["catch"](ChromeStorage.parseStorageErrors);
  };

  ChromeStorage.prototype.remove = function(keys) {
    if (keys == null) {
      return Promise.resolve(this.storage.clear());
    }
    if (Array.isArray(keys) && keys.length === 0) {
      return Promise.resolve({});
    }
    return Promise.resolve(this.storage.remove(keys))["catch"](ChromeStorage.parseStorageErrors);
  };

  ChromeStorage.prototype.watch = function(keys, callback) {
    var area, base, i, id, key, keyMap, len, name, watcher;
    if ((base = ChromeStorage.watchers)[name = this.areaName] == null) {
      base[name] = {};
    }
    area = ChromeStorage.watchers[this.areaName];
    watcher = {
      keys: keys,
      callback: callback
    };
    id = Date.now().toString();
    while (area[id]) {
      id = Date.now().toString();
    }
    if (Array.isArray(keys)) {
      keyMap = {};
      for (i = 0, len = keys.length; i < len; i++) {
        key = keys[i];
        keyMap[key] = true;
      }
      keys = keyMap;
    }
    area[id] = {
      keys: keys,
      callback: callback
    };
    if (!ChromeStorage.onChangedListenerInstalled) {
      chrome.storage.onChanged.addListener(ChromeStorage.onChangedListener);
      ChromeStorage.onChangedListenerInstalled = true;
    }
    return function() {
      return delete area[id];
    };
  };

  ChromeStorage.onChangedListener = function(changes, areaName) {
    var _, change, key, map, match, ref, results, watcher;
    map = null;
    ref = ChromeStorage.watchers[areaName];
    results = [];
    for (_ in ref) {
      watcher = ref[_];
      match = watcher.keys === null;
      if (!match) {
        for (key in changes) {
          if (!hasProp.call(changes, key)) continue;
          if (watcher.keys[key]) {
            match = true;
            break;
          }
        }
      }
      if (match) {
        if (map == null) {
          map = {};
          for (key in changes) {
            if (!hasProp.call(changes, key)) continue;
            change = changes[key];
            map[key] = change.newValue;
          }
        }
        results.push(watcher.callback(map));
      } else {
        results.push(void 0);
      }
    }
    return results;
  };

  ChromeStorage.onChangedListenerInstalled = false;

  ChromeStorage.watchers = {};

  return ChromeStorage;

})(OmegaTarget.Storage);

module.exports = ChromeStorage;

export {};
