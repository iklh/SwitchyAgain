"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var Storage = require('./storage');
var Promise = require('bluebird');
var BrowserStorage = /** @class */ (function (_super) {
    __extends(BrowserStorage, _super);
    function BrowserStorage(storage, prefix) {
        var _this = _super.call(this) || this;
        _this.storage = storage;
        _this.prefix = prefix != null ? prefix : '';
        _this.proto = Object.getPrototypeOf(_this.storage);
        return _this;
    }
    BrowserStorage.prototype.get = function (keys) {
        var map = {};
        if (typeof keys === 'string') {
            map[keys] = void 0;
        }
        else if (Array.isArray(keys)) {
            for (var _i = 0, keys_1 = keys; _i < keys_1.length; _i++) {
                var key = keys_1[_i];
                map[key] = void 0;
            }
        }
        else if (typeof keys === 'object') {
            map = keys;
        }
        for (var key in map) {
            if (!Object.prototype.hasOwnProperty.call(map, key))
                continue;
            var value = void 0;
            try {
                value = JSON.parse(this.proto.getItem.call(this.storage, this.prefix + key));
            }
            catch (error) { }
            if (value != null) {
                map[key] = value;
            }
            if (typeof map[key] === 'undefined') {
                delete map[key];
            }
        }
        return Promise.resolve(map);
    };
    BrowserStorage.prototype.set = function (items) {
        for (var key in items) {
            if (!Object.prototype.hasOwnProperty.call(items, key))
                continue;
            var value = items[key];
            value = JSON.stringify(value);
            this.proto.setItem.call(this.storage, this.prefix + key, value);
        }
        return Promise.resolve(items);
    };
    BrowserStorage.prototype.remove = function (keys) {
        if (keys == null) {
            if (!this.prefix) {
                this.proto.clear.call(this.storage);
            }
            else {
                var index = 0;
                while (true) {
                    var key = this.proto.key.call(index);
                    if (key === null) {
                        break;
                    }
                    if (this.key.substr(0, this.prefix.length) === this.prefix) {
                        this.proto.removeItem.call(this.storage, this.prefix + keys);
                    }
                    else {
                        index++;
                    }
                }
            }
        }
        if (typeof keys === 'string') {
            this.proto.removeItem.call(this.storage, this.prefix + keys);
        }
        for (var _i = 0, keys_2 = keys; _i < keys_2.length; _i++) {
            var key = keys_2[_i];
            this.proto.removeItem.call(this.storage, this.prefix + key);
        }
        return Promise.resolve();
    };
    return BrowserStorage;
}(Storage));
module.exports = BrowserStorage;
