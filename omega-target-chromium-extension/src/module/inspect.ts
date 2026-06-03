// @ts-nocheck
var Inspect, OmegaPac, OmegaTarget, Promise,
  hasProp = {}.hasOwnProperty;

OmegaTarget = require('omega-target');

OmegaPac = OmegaTarget.OmegaPac;

Promise = OmegaTarget.Promise;

module.exports = Inspect = (function() {
  Inspect.prototype._enabled = false;

  function Inspect(onInspect) {
    this.onInspect = onInspect;
    this._onContextMenuClicked = this._onContextMenuClicked.bind(this);
  }

  Inspect.prototype.enable = function() {
    var webResource;
    if (chrome.contextMenus == null) {
      return;
    }
    if (chrome.i18n.getUILanguage == null) {
      return;
    }
    if (this._enabled) {
      return;
    }
    chrome.contextMenus.onClicked.addListener(this._onContextMenuClicked);
    webResource = ["http://*/*", "https://*/*", "ftp://*/*"];

    /* Not so useful...
    chrome.contextMenus.create({
      id: 'inspectPage'
      title: chrome.i18n.getMessage('contextMenu_inspectPage')
      contexts: ['page']
      onclick: @inspect.bind(this)
      documentUrlPatterns: webResource
    })
     */
    chrome.contextMenus.create({
      id: 'inspectFrame',
      title: chrome.i18n.getMessage('contextMenu_inspectFrame'),
      contexts: ['frame'],
      documentUrlPatterns: webResource
    });
    chrome.contextMenus.create({
      id: 'inspectLink',
      title: chrome.i18n.getMessage('contextMenu_inspectLink'),
      contexts: ['link'],
      targetUrlPatterns: webResource
    });
    chrome.contextMenus.create({
      id: 'inspectElement',
      title: chrome.i18n.getMessage('contextMenu_inspectElement'),
      contexts: ['image', 'video', 'audio'],
      targetUrlPatterns: webResource
    });
    return this._enabled = true;
  };

  Inspect.prototype.disable = function() {
    var menuId, ref;
    if (!this._enabled) {
      return;
    }
    ref = this.propForMenuItem;
    for (menuId in ref) {
      if (!hasProp.call(ref, menuId)) continue;
      if (menuId === 'inspectPage') {
        continue;
      }
      try {
        chrome.contextMenus.remove(menuId, function() {
          chrome.runtime.lastError;
        });
      } catch (error) {}
    }
    chrome.contextMenus.onClicked.removeListener(this._onContextMenuClicked);
    return this._enabled = false;
  };

  Inspect.prototype.propForMenuItem = {
    'inspectPage': 'pageUrl',
    'inspectFrame': 'frameUrl',
    'inspectLink': 'linkUrl',
    'inspectElement': 'srcUrl'
  };

  Inspect.prototype._onContextMenuClicked = function(info, tab) {
    if (!this.propForMenuItem[info.menuItemId]) {
      return;
    }
    return this.inspect(info, tab);
  };

  Inspect.prototype.inspect = function(info, tab) {
    var url;
    if (!info.menuItemId) {
      return;
    }
    url = info[this.propForMenuItem[info.menuItemId]];
    if (!url && info.menuItemId === 'inspectPage') {
      url = tab.url;
    }
    if (!url) {
      return;
    }
    return this.onInspect(url, tab);
  };

  return Inspect;

})();

export {};
