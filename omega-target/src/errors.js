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
var NetworkError = /** @class */ (function (_super) {
    __extends(NetworkError, _super);
    function NetworkError(err) {
        var _this = _super.call(this) || this;
        _this.cause = err;
        _this.name = 'NetworkError';
        return _this;
    }
    return NetworkError;
}(Error));
var HttpError = /** @class */ (function (_super) {
    __extends(HttpError, _super);
    function HttpError(err) {
        var _this = _super.call(this, err) || this;
        _this.statusCode = _this.cause != null ? _this.cause.statusCode : void 0;
        _this.name = 'HttpError';
        return _this;
    }
    return HttpError;
}(NetworkError));
var HttpNotFoundError = /** @class */ (function (_super) {
    __extends(HttpNotFoundError, _super);
    function HttpNotFoundError(err) {
        var _this = _super.call(this, err) || this;
        _this.name = 'HttpNotFoundError';
        return _this;
    }
    return HttpNotFoundError;
}(HttpError));
var HttpServerError = /** @class */ (function (_super) {
    __extends(HttpServerError, _super);
    function HttpServerError(err) {
        var _this = _super.call(this, err) || this;
        _this.name = 'HttpServerError';
        return _this;
    }
    return HttpServerError;
}(HttpError));
var ContentTypeRejectedError = /** @class */ (function (_super) {
    __extends(ContentTypeRejectedError, _super);
    function ContentTypeRejectedError() {
        var _this = _super.call(this) || this;
        _this.name = 'ContentTypeRejectedError';
        return _this;
    }
    return ContentTypeRejectedError;
}(Error));
module.exports = {
    NetworkError: NetworkError,
    HttpError: HttpError,
    HttpNotFoundError: HttpNotFoundError,
    HttpServerError: HttpServerError,
    ContentTypeRejectedError: ContentTypeRejectedError
};
