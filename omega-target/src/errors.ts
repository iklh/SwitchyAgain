class NetworkError extends Error {
  cause: any;

  constructor(err?: any) {
    super();
    this.cause = err;
    this.name = 'NetworkError';
  }
}

class HttpError extends NetworkError {
  statusCode: any;

  constructor(err?: any) {
    super(err);
    this.statusCode = this.cause != null ? this.cause.statusCode : void 0;
    this.name = 'HttpError';
  }
}

class HttpNotFoundError extends HttpError {
  constructor(err?: any) {
    super(err);
    this.name = 'HttpNotFoundError';
  }
}

class HttpServerError extends HttpError {
  constructor(err?: any) {
    super(err);
    this.name = 'HttpServerError';
  }
}

class ContentTypeRejectedError extends Error {
  constructor() {
    super();
    this.name = 'ContentTypeRejectedError';
  }
}

module.exports = {
  NetworkError,
  HttpError,
  HttpNotFoundError,
  HttpServerError,
  ContentTypeRejectedError
};

export {};
