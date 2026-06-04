const Storage = require('./storage');
const Promise = require('bluebird');

class BrowserStorage extends Storage {
  storage: any;
  prefix: string;
  proto: any;

  constructor(storage: any, prefix?: string) {
    super();
    this.storage = storage;
    this.prefix = prefix != null ? prefix : '';
    this.proto = Object.getPrototypeOf(this.storage);
  }

  ready(): any {
    return Promise.resolve(this.storage.ready);
  }

  get(keys: any): any {
    return this.ready().then(() => {
      let map: any = {};
      if (typeof keys === 'string') {
        map[keys] = void 0;
      } else if (Array.isArray(keys)) {
        for (const key of keys) {
          map[key] = void 0;
        }
      } else if (typeof keys === 'object') {
        map = keys;
      }
      for (const key in map) {
        if (!Object.prototype.hasOwnProperty.call(map, key)) continue;
        let value;
        try {
          value = JSON.parse(this.proto.getItem.call(this.storage, this.prefix + key));
        } catch (error) {}
        if (value != null) {
          map[key] = value;
        }
        if (typeof map[key] === 'undefined') {
          delete map[key];
        }
      }
      return map;
    });
  }

  set(items: any): any {
    return this.ready().then(() => {
      for (const key in items) {
        if (!Object.prototype.hasOwnProperty.call(items, key)) continue;
        let value = items[key];
        value = JSON.stringify(value);
        this.proto.setItem.call(this.storage, this.prefix + key, value);
      }
      return items;
    });
  }

  remove(keys: any): any {
    return this.ready().then(() => {
      if (keys == null) {
        if (!this.prefix) {
          this.proto.clear.call(this.storage);
        } else {
          let index = 0;
          while (true) {
            const key = this.proto.key.call(index);
            if (key === null) {
              break;
            }
            if (this.key.substr(0, this.prefix.length) === this.prefix) {
              this.proto.removeItem.call(this.storage, this.prefix + keys);
            } else {
              index++;
            }
          }
        }
        return;
      }
      if (typeof keys === 'string') {
        this.proto.removeItem.call(this.storage, this.prefix + keys);
        return;
      }
      for (const key of keys) {
        this.proto.removeItem.call(this.storage, this.prefix + key);
      }
    });
  }
}

module.exports = BrowserStorage;

export {};
