"use strict";
/* @module omega-target/options_sync */
Object.defineProperty(exports, "__esModule", { value: true });
var Promise = require('bluebird');
var Storage = require('./storage');
var Log = require('./log');
var Revision = require('omega-pac').Revision;
var jsondiffpatch = require('jsondiffpatch');
var TokenBucket = require('limiter').TokenBucket;
var OptionsSync = /** @class */ (function () {
    function OptionsSync(storage, _bucket) {
        var _this = this;
        this._timeout = null;
        this._bucket = null;
        this._waiting = false;
        /**
         * The debounce timeout (ms) for requestPush scheduling. See requestPush.
         * @type number
         */
        this.debounce = 1000;
        /**
         * The throttling timeout (ms) for watchAndPull. See watchAndPull.
         * @type number
         */
        this.pullThrottle = 1000;
        /**
         * The remote storage of syncing.
         * @type Storage
         */
        this.storage = null;
        /**
         * Whether syncing is enabled or not. See requestPush for the effect.
         * @type boolean
         */
        this.enabled = true;
        /**
         * Merge newVal and oldVal of a given key.
         */
        this.merge = (function () {
            var diff = jsondiffpatch.create({
                objectHash: function (obj) {
                    return JSON.stringify(obj);
                },
                textDiff: {
                    minLength: 1 / 0
                }
            });
            return function (key, newVal, oldVal) {
                var result;
                if (newVal === oldVal) {
                    return oldVal;
                }
                if ((oldVal != null ? oldVal.syncOptions : void 0) === 'disabled' ||
                    (newVal != null ? newVal.syncOptions : void 0) === 'disabled') {
                    return oldVal;
                }
                if ((oldVal != null ? oldVal.revision : void 0) != null &&
                    (newVal != null ? newVal.revision : void 0) != null) {
                    result = Revision.compare(oldVal.revision, newVal.revision);
                    if (result >= 0) {
                        return oldVal;
                    }
                }
                if (diff.diff(oldVal, newVal) == null) {
                    return oldVal;
                }
                return newVal;
            };
        })();
        this.storage = storage;
        this._bucket = _bucket;
        this._pending = {};
        if (this._bucket == null) {
            this._bucket = new TokenBucket(10, 10, 'minute', null);
        }
        if (this._bucket.clear == null) {
            this._bucket.clear = function () {
                return _this._bucket.tryRemoveTokens(_this._bucket.content);
            };
        }
    }
    /**
     * Transform storage values for syncing. The default implementation applies no
     * transformation, but the behavior can be altered by assigning to this field.
     * Note: Transformation is applied before merging.
     * @param {{}} value The value to transform
     * @param {{}} key The key of the item
     * @returns {{}} The transformed value
     */
    OptionsSync.prototype.transformValue = function (v, key) {
        return v;
    };
    /**
     * Request pushing the changes to remote storage.
     * @param {Object.<string, {}>} changes A map from keys to values.
     */
    OptionsSync.prototype.requestPush = function (changes) {
        if (this._timeout != null) {
            clearTimeout(this._timeout);
        }
        for (var key in changes) {
            if (!Object.prototype.hasOwnProperty.call(changes, key))
                continue;
            var value = changes[key];
            if (typeof value !== 'undefined') {
                value = this.transformValue(value, key);
                if (typeof value === 'undefined') {
                    continue;
                }
            }
            this._pending[key] = value;
        }
        if (!this.enabled) {
            return;
        }
        this._timeout = setTimeout(this._doPush.bind(this), this.debounce);
        return this._timeout;
    };
    /**
     * Returning the pending changes not written to the remote storage.
     * @returns {Object.<string, {}>} The pending changes.
     */
    OptionsSync.prototype.pendingChanges = function () {
        return this._pending;
    };
    OptionsSync.prototype._doPush = function () {
        var _this = this;
        this._timeout = null;
        if (this._waiting) {
            return;
        }
        this._waiting = true;
        return this._bucket.removeTokens(1, function () {
            return _this.storage.get(null).then(function (base) {
                var changes = _this._pending;
                _this._pending = {};
                _this._waiting = false;
                return Storage.operationsForChanges(changes, {
                    base: base,
                    merge: _this.merge
                });
            }).then(function (_a) {
                var set = _a.set, remove = _a.remove;
                var doSet = Object.keys(set).length === 0
                    ? Promise.resolve(0)
                    : (Log.log('OptionsSync::set', set), _this.storage.set(set).return(1));
                return doSet.then(function (cost) {
                    set = {};
                    if (remove.length > 0) {
                        if (_this._bucket.tryRemoveTokens(cost)) {
                            Log.log('OptionsSync::remove', remove);
                            return _this.storage.remove(remove);
                        }
                        return Promise.reject('bucket');
                    }
                }).catch(function (e) {
                    var valuesAffected;
                    for (var key in set) {
                        if (!Object.prototype.hasOwnProperty.call(set, key))
                            continue;
                        var value = set[key];
                        if (!(key in _this._pending)) {
                            _this._pending[key] = value;
                        }
                    }
                    for (var _i = 0, remove_1 = remove; _i < remove_1.length; _i++) {
                        var key = remove_1[_i];
                        if (!(key in _this._pending)) {
                            _this._pending[key] = void 0;
                        }
                    }
                    if (e === 'bucket') {
                        return _this._doPush();
                    }
                    else if (e instanceof Storage.RateLimitExceededError) {
                        Log.log('OptionsSync::rateLimitExceeded');
                        _this._bucket.clear();
                        _this.requestPush({});
                    }
                    else if (e instanceof Storage.QuotaExceededError) {
                        valuesAffected = 0;
                        for (var key in set) {
                            if (!Object.prototype.hasOwnProperty.call(set, key))
                                continue;
                            var value = set[key];
                            if (key[0] === '+' && value.syncOptions !== 'disabled') {
                                value.syncOptions = 'disabled';
                                value.syncError = {
                                    reason: 'quotaPerItem'
                                };
                                valuesAffected++;
                            }
                        }
                        if (valuesAffected > 0) {
                            _this.requestPush({});
                        }
                        else {
                            _this._pending = {};
                        }
                    }
                    else {
                        return Promise.reject(e);
                    }
                });
            });
        });
    };
    OptionsSync.prototype._logOperations = function (text, operations) {
        if (Object.keys(operations.set).length) {
            Log.log(text + '::set', operations.set);
        }
        if (operations.remove.length) {
            return Log.log(text + '::remove', operations.remove);
        }
    };
    /**
     * Pull the remote storage for changes, and write them to local.
     * @param {Storage} local The local storage to be written to
     * @returns {function} Calling the returned function will stop watching.
     */
    OptionsSync.prototype.copyTo = function (local) {
        var _this = this;
        return Promise.join(local.get(null), this.storage.get(null), function (base, changes) {
            for (var key in base) {
                if (!Object.prototype.hasOwnProperty.call(base, key))
                    continue;
                if (!(key in changes)) {
                    if (key[0] === '+' && !(base[key] != null ? base[key].syncOptions : void 0) === 'disabled') {
                        changes[key] = void 0;
                    }
                }
            }
            return local.apply({
                changes: changes,
                base: base,
                merge: _this.merge
            }).then(function (operations) {
                return _this._logOperations('OptionsSync::copyTo', operations);
            });
        });
    };
    /**
     * Watch the remote storage for changes, and write them to local.
     * The actual writing is throttled by pullThrottle with initial delay.
     * @param {Storage} local The local storage to be written to
     * @returns {function} Calling the returned function will stop watching.
     */
    OptionsSync.prototype.watchAndPull = function (local) {
        var _this = this;
        var pullScheduled = null;
        var pull = {};
        var doPull = function () {
            return local.get(null).then(function (base) {
                var changes = pull;
                pull = {};
                pullScheduled = null;
                return Storage.operationsForChanges(changes, {
                    base: base,
                    merge: _this.merge
                });
            }).then(function (operations) {
                _this._logOperations('OptionsSync::pull', operations);
                return local.apply(operations);
            });
        };
        return this.storage.watch(null, function (changes) {
            for (var key in changes) {
                if (!Object.prototype.hasOwnProperty.call(changes, key))
                    continue;
                var value = changes[key];
                pull[key] = value;
            }
            if (pullScheduled != null) {
                return;
            }
            pullScheduled = setTimeout(doPull, _this.pullThrottle);
            return pullScheduled;
        });
    };
    OptionsSync.TokenBucket = TokenBucket;
    return OptionsSync;
}());
module.exports = OptionsSync;
