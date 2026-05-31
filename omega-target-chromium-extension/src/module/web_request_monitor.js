"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
var Heap, Url, WebRequestMonitor, hasProp = {}.hasOwnProperty;
Heap = require('heap');
Url = require('url');
module.exports = WebRequestMonitor = (function () {
    function WebRequestMonitor(getSummaryId) {
        this.getSummaryId = getSummaryId;
        this._requests = {};
        this._recentRequests = new Heap(function (a, b) {
            return a._startTime - b._startTime;
        });
        this._callbacks = [];
        this._tabCallbacks = [];
        this.tabInfo = {};
    }
    WebRequestMonitor.prototype._callbacks = null;
    WebRequestMonitor.prototype.watching = false;
    WebRequestMonitor.prototype.timer = null;
    WebRequestMonitor.prototype.watch = function (callback) {
        this._callbacks.push(callback);
        if (this.watching) {
            return;
        }
        if (!chrome.webRequest) {
            console.log('Request monitor disabled! No webRequest permission.');
            return;
        }
        chrome.webRequest.onBeforeRequest.addListener(this._requestStart.bind(this), {
            urls: ['<all_urls>']
        });
        chrome.webRequest.onHeadersReceived.addListener(this._requestHeadersReceived.bind(this), {
            urls: ['<all_urls>']
        });
        chrome.webRequest.onBeforeRedirect.addListener(this._requestRedirected.bind(this), {
            urls: ['<all_urls>']
        });
        chrome.webRequest.onCompleted.addListener(this._requestDone.bind(this), {
            urls: ['<all_urls>']
        });
        chrome.webRequest.onErrorOccurred.addListener(this._requestError.bind(this), {
            urls: ['<all_urls>']
        });
        return this.watching = true;
    };
    WebRequestMonitor.prototype._requests = null;
    WebRequestMonitor.prototype._recentRequests = null;
    WebRequestMonitor.prototype._requestStart = function (req) {
        var callback, i, len, ref, results;
        if (req.tabId < 0) {
            return;
        }
        req._startTime = Date.now();
        this._requests[req.requestId] = req;
        this._recentRequests.push(req);
        if (this.timer == null) {
            this.timer = setInterval(this._tick.bind(this), 1000);
        }
        ref = this._callbacks;
        results = [];
        for (i = 0, len = ref.length; i < len; i++) {
            callback = ref[i];
            results.push(callback('start', req));
        }
        return results;
    };
    WebRequestMonitor.prototype._tick = function () {
        var callback, i, len, now, ref, req, reqInfo, results;
        now = Date.now();
        results = [];
        while ((req = this._recentRequests.peek())) {
            reqInfo = this._requests[req.requestId];
            if (reqInfo && !reqInfo.noTimeout) {
                if (now - req._startTime < 5000) {
                    break;
                }
                else {
                    reqInfo.timeoutCalled = true;
                    ref = this._callbacks;
                    for (i = 0, len = ref.length; i < len; i++) {
                        callback = ref[i];
                        callback('timeout', reqInfo);
                    }
                }
            }
            results.push(this._recentRequests.pop());
        }
        return results;
    };
    WebRequestMonitor.prototype._requestHeadersReceived = function (req) {
        var callback, i, len, ref, reqInfo, results;
        reqInfo = this._requests[req.requestId];
        if (!reqInfo) {
            return;
        }
        reqInfo.noTimeout = true;
        if (reqInfo.timeoutCalled) {
            ref = this._callbacks;
            results = [];
            for (i = 0, len = ref.length; i < len; i++) {
                callback = ref[i];
                results.push(callback('ongoing', req));
            }
            return results;
        }
    };
    WebRequestMonitor.prototype._requestRedirected = function (req) {
        var url;
        url = req.redirectUrl;
        if (!url) {
            return;
        }
        if (url.indexOf('data:') === 0 || url.indexOf('about:') === 0) {
            return this._requestDone(req);
        }
    };
    WebRequestMonitor.prototype._requestError = function (req) {
        var callback, i, j, len, len1, ref, ref1, reqInfo, results;
        reqInfo = this._requests[req.requestId];
        delete this._requests[req.requestId];
        if (req.tabId < 0) {
            return;
        }
        if (req.error === 'net::ERR_INCOMPLETE_CHUNKED_ENCODING') {
            return;
        }
        if (req.error.indexOf('BLOCKED') >= 0) {
            return;
        }
        if (req.error.indexOf('net::ERR_FILE_') === 0) {
            return;
        }
        if (req.error.indexOf('NS_ERROR_ABORT') === 0) {
            return;
        }
        if (req.url.indexOf('file:') === 0) {
            return;
        }
        if (req.url.indexOf('chrome') === 0) {
            return;
        }
        if (req.url.indexOf('about:') === 0) {
            return;
        }
        if (req.url.indexOf('moz-') === 0) {
            return;
        }
        if (req.url.indexOf('://127.0.0.1') > 0) {
            return;
        }
        if (!reqInfo) {
            return;
        }
        if (req.error === 'net::ERR_ABORTED') {
            if (reqInfo.timeoutCalled && !reqInfo.noTimeout) {
                ref = this._callbacks;
                for (i = 0, len = ref.length; i < len; i++) {
                    callback = ref[i];
                    callback('timeoutAbort', req);
                }
            }
            return;
        }
        ref1 = this._callbacks;
        results = [];
        for (j = 0, len1 = ref1.length; j < len1; j++) {
            callback = ref1[j];
            results.push(callback('error', req));
        }
        return results;
    };
    WebRequestMonitor.prototype._requestDone = function (req) {
        var callback, i, len, ref;
        ref = this._callbacks;
        for (i = 0, len = ref.length; i < len; i++) {
            callback = ref[i];
            callback('done', req);
        }
        return delete this._requests[req.requestId];
    };
    WebRequestMonitor.prototype.eventCategory = {
        start: 'ongoing',
        ongoing: 'ongoing',
        timeout: 'error',
        error: 'error',
        timeoutAbort: 'error',
        done: 'done'
    };
    WebRequestMonitor.prototype.tabsWatching = false;
    WebRequestMonitor.prototype._tabCallbacks = null;
    WebRequestMonitor.prototype.watchTabs = function (callback) {
        var ref;
        this._tabCallbacks.push(callback);
        if (this.tabsWatching) {
            return;
        }
        this.watch(this.setTabRequestInfo.bind(this));
        this.tabsWatching = true;
        chrome.tabs.onCreated.addListener((function (_this) {
            return function (tab) {
                if (!tab.id) {
                    return;
                }
                return _this.tabInfo[tab.id] = _this._newTabInfo();
            };
        })(this));
        chrome.tabs.onRemoved.addListener((function (_this) {
            return function (tab) {
                return delete _this.tabInfo[tab.id];
            };
        })(this));
        if ((ref = chrome.tabs.onReplaced) != null) {
            ref.addListener((function (_this) {
                return function (added, removed) {
                    var base;
                    if ((base = _this.tabInfo)[added] == null) {
                        base[added] = _this._newTabInfo();
                    }
                    return delete _this.tabInfo[removed];
                };
            })(this));
        }
        chrome.tabs.onUpdated.addListener((function (_this) {
            return function (tabId, changeInfo, tab) {
                var base, i, info, len, name, ref1, results;
                info = (base = _this.tabInfo)[name = tab.id] != null ? base[name] : base[name] = _this._newTabInfo();
                if (!info) {
                    return;
                }
                ref1 = _this._tabCallbacks;
                results = [];
                for (i = 0, len = ref1.length; i < len; i++) {
                    callback = ref1[i];
                    results.push(callback(tab.id, info, null, 'updated'));
                }
                return results;
            };
        })(this));
        return chrome.tabs.query({}, (function (_this) {
            return function (tabs) {
                var base, i, len, name, results, tab;
                results = [];
                for (i = 0, len = tabs.length; i < len; i++) {
                    tab = tabs[i];
                    results.push((base = _this.tabInfo)[name = tab.id] != null ? base[name] : base[name] = _this._newTabInfo());
                }
                return results;
            };
        })(this));
    };
    WebRequestMonitor.prototype._newTabInfo = function () {
        return {
            requests: {},
            requestCount: 0,
            requestStatus: {},
            ongoingCount: 0,
            errorCount: 0,
            doneCount: 0,
            summary: {}
        };
    };
    WebRequestMonitor.prototype.setTabRequestInfo = function (status, req) {
        var callback, i, id, info, key, len, oldStatus, ref, ref1, results, summaryItem, value;
        info = this.tabInfo[req.tabId];
        if (info) {
            if (status === 'start' && req.type === 'main_frame') {
                if (req.url.indexOf('chrome://errorpage/') !== 0) {
                    ref = this._newTabInfo();
                    for (key in ref) {
                        if (!hasProp.call(ref, key))
                            continue;
                        value = ref[key];
                        info[key] = value;
                    }
                }
            }
            if (info.requestCount > 1000) {
                return;
            }
            info.requests[req.requestId] = req;
            if ((oldStatus = info.requestStatus[req.requestId])) {
                info[this.eventCategory[oldStatus] + 'Count']--;
            }
            else {
                if (status === 'timeoutAbort') {
                    return;
                }
                info.requestCount++;
            }
            info.requestStatus[req.requestId] = status;
            info[this.eventCategory[status] + 'Count']++;
            id = typeof this.getSummaryId === "function" ? this.getSummaryId(req) : void 0;
            if (id != null) {
                if (this.eventCategory[status] === 'error') {
                    if (this.eventCategory[oldStatus] !== 'error') {
                        summaryItem = info.summary[id];
                        if (summaryItem == null) {
                            summaryItem = info.summary[id] = {
                                errorCount: 0
                            };
                        }
                        summaryItem.errorCount++;
                    }
                }
                else if (this.eventCategory[oldStatus] === 'error') {
                    summaryItem = info.summary[id];
                    if (summaryItem != null) {
                        summaryItem.errorCount--;
                    }
                }
            }
            ref1 = this._tabCallbacks;
            results = [];
            for (i = 0, len = ref1.length; i < len; i++) {
                callback = ref1[i];
                results.push(callback(req.tabId, info, req, status));
            }
            return results;
        }
    };
    return WebRequestMonitor;
})();
