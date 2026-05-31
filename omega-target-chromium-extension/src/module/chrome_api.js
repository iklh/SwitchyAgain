"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
var OmegaTarget, Promise, slice = [].slice;
OmegaTarget = require('omega-target');
Promise = OmegaTarget.Promise;
exports.chromeApiPromisify = function (target, method) {
    return function () {
        var args;
        args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
        return new Promise(function (resolve, reject) {
            var callback;
            callback = function () {
                var callbackArgs, error;
                callbackArgs = 1 <= arguments.length ? slice.call(arguments, 0) : [];
                if (chrome.runtime.lastError != null) {
                    error = new Error(chrome.runtime.lastError.message);
                    error.original = chrome.runtime.lastError;
                    return reject(error);
                }
                if (callbackArgs.length <= 1) {
                    return resolve(callbackArgs[0]);
                }
                else {
                    return resolve(callbackArgs);
                }
            };
            args.push(callback);
            return target[method].apply(target, args);
        });
    };
};
