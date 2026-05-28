/* @module omega-target/options_sync */

const Promise = require('bluebird');
const Storage = require('./storage');
const Log = require('./log');
const Revision = require('omega-pac').Revision;
const jsondiffpatch = require('jsondiffpatch');
const TokenBucket = require('limiter').TokenBucket;

class OptionsSync {
  static TokenBucket = TokenBucket;

  _timeout: any = null;
  _bucket: any = null;
  _waiting: boolean = false;
  _pending: any;

  /**
   * The debounce timeout (ms) for requestPush scheduling. See requestPush.
   * @type number
   */
  debounce: number = 1000;

  /**
   * The throttling timeout (ms) for watchAndPull. See watchAndPull.
   * @type number
   */
  pullThrottle: number = 1000;

  /**
   * The remote storage of syncing.
   * @type Storage
   */
  storage: any = null;

  /**
   * Whether syncing is enabled or not. See requestPush for the effect.
   * @type boolean
   */
  enabled: boolean = true;

  constructor(storage: any, _bucket?: any) {
    this.storage = storage;
    this._bucket = _bucket;
    this._pending = {};
    if (this._bucket == null) {
      this._bucket = new TokenBucket(10, 10, 'minute', null);
    }
    if (this._bucket.clear == null) {
      this._bucket.clear = () => {
        return this._bucket.tryRemoveTokens(this._bucket.content);
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
  transformValue(v: any, key?: any): any {
    return v;
  }

  /**
   * Merge newVal and oldVal of a given key.
   */
  merge = (() => {
    const diff = jsondiffpatch.create({
      objectHash(obj: any) {
        return JSON.stringify(obj);
      },
      textDiff: {
        minLength: 1 / 0
      }
    });
    return function(key: string, newVal: any, oldVal: any): any {
      let result;
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

  /**
   * Request pushing the changes to remote storage.
   * @param {Object.<string, {}>} changes A map from keys to values.
   */
  requestPush(changes: any): any {
    if (this._timeout != null) {
      clearTimeout(this._timeout);
    }
    for (const key in changes) {
      if (!Object.prototype.hasOwnProperty.call(changes, key)) continue;
      let value = changes[key];
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
  }

  /**
   * Returning the pending changes not written to the remote storage.
   * @returns {Object.<string, {}>} The pending changes.
   */
  pendingChanges(): any {
    return this._pending;
  }

  _doPush(): any {
    this._timeout = null;
    if (this._waiting) {
      return;
    }
    this._waiting = true;
    return this._bucket.removeTokens(1, () => {
      return this.storage.get(null).then((base: any) => {
        const changes = this._pending;
        this._pending = {};
        this._waiting = false;
        return Storage.operationsForChanges(changes, {
          base: base,
          merge: this.merge
        });
      }).then(({set, remove}: any) => {
        const doSet = Object.keys(set).length === 0
          ? Promise.resolve(0)
          : (Log.log('OptionsSync::set', set), this.storage.set(set).return(1));
        return doSet.then((cost: any) => {
          set = {};
          if (remove.length > 0) {
            if (this._bucket.tryRemoveTokens(cost)) {
              Log.log('OptionsSync::remove', remove);
              return this.storage.remove(remove);
            }
            return Promise.reject('bucket');
          }
        }).catch((e: any) => {
          let valuesAffected;
          for (const key in set) {
            if (!Object.prototype.hasOwnProperty.call(set, key)) continue;
            const value = set[key];
            if (!(key in this._pending)) {
              this._pending[key] = value;
            }
          }
          for (const key of remove) {
            if (!(key in this._pending)) {
              this._pending[key] = void 0;
            }
          }
          if (e === 'bucket') {
            return this._doPush();
          } else if (e instanceof Storage.RateLimitExceededError) {
            Log.log('OptionsSync::rateLimitExceeded');
            this._bucket.clear();
            this.requestPush({});
          } else if (e instanceof Storage.QuotaExceededError) {
            valuesAffected = 0;
            for (const key in set) {
              if (!Object.prototype.hasOwnProperty.call(set, key)) continue;
              const value = set[key];
              if (key[0] === '+' && value.syncOptions !== 'disabled') {
                value.syncOptions = 'disabled';
                value.syncError = {
                  reason: 'quotaPerItem'
                };
                valuesAffected++;
              }
            }
            if (valuesAffected > 0) {
              this.requestPush({});
            } else {
              this._pending = {};
            }
          } else {
            return Promise.reject(e);
          }
        });
      });
    });
  }

  _logOperations(text: string, operations: any): any {
    if (Object.keys(operations.set).length) {
      Log.log(text + '::set', operations.set);
    }
    if (operations.remove.length) {
      return Log.log(text + '::remove', operations.remove);
    }
  }

  /**
   * Pull the remote storage for changes, and write them to local.
   * @param {Storage} local The local storage to be written to
   * @returns {function} Calling the returned function will stop watching.
   */
  copyTo(local: any): any {
    return Promise.join(local.get(null), this.storage.get(null), (base: any, changes: any) => {
      for (const key in base) {
        if (!Object.prototype.hasOwnProperty.call(base, key)) continue;
        if (!(key in changes)) {
          if (key[0] === '+' && (!((base[key] != null ? base[key].syncOptions : void 0) as any) as any) === 'disabled') {
            changes[key] = void 0;
          }
        }
      }
      return local.apply({
        changes: changes,
        base: base,
        merge: this.merge
      }).then((operations: any) => {
        return this._logOperations('OptionsSync::copyTo', operations);
      });
    });
  }

  /**
   * Watch the remote storage for changes, and write them to local.
   * The actual writing is throttled by pullThrottle with initial delay.
   * @param {Storage} local The local storage to be written to
   * @returns {function} Calling the returned function will stop watching.
   */
  watchAndPull(local: any): any {
    let pullScheduled: any = null;
    let pull: any = {};
    const doPull = () => {
      return local.get(null).then((base: any) => {
        const changes = pull;
        pull = {};
        pullScheduled = null;
        return Storage.operationsForChanges(changes, {
          base: base,
          merge: this.merge
        });
      }).then((operations: any) => {
        this._logOperations('OptionsSync::pull', operations);
        return local.apply(operations);
      });
    };
    return this.storage.watch(null, (changes: any) => {
      for (const key in changes) {
        if (!Object.prototype.hasOwnProperty.call(changes, key)) continue;
        const value = changes[key];
        pull[key] = value;
      }
      if (pullScheduled != null) {
        return;
      }
      pullScheduled = setTimeout(doPull, this.pullThrottle);
      return pullScheduled;
    });
  }
}

module.exports = OptionsSync;

export {};
