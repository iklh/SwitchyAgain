type Listener = (...args: unknown[]) => void;

type ChromeEvent = {
  addListener: (callback: Listener) => void;
  removeListener: (callback: Listener) => void;
  hasListeners?: () => boolean;
  [method: string]: unknown;
};

type Port = {
  disconnect: () => void;
  name: string;
  onDisconnect: ChromeEvent;
  onMessage: ChromeEvent;
  postMessage: (...args: unknown[]) => void;
  sender?: unknown;
};

class TrackedEvent {
  callbacks: Listener[] | null;
  event: ChromeEvent | null;

  constructor(event: ChromeEvent) {
    this.event = event;
    this.callbacks = [];
    for (const methodName of ['hasListener', 'hasListeners', 'addRules', 'getRules', 'removeRules']) {
      const method = this.event[methodName];
      if (typeof method === 'function') {
        (this as Record<string, unknown>)[methodName] = method.bind(this.event);
      }
    }
  }

  addListener(callback: Listener) {
    this.event?.addListener(callback);
    this.callbacks?.push(callback);
    return this;
  }

  removeListener(callback: Listener) {
    this.event?.removeListener(callback);
    const index = this.callbacks?.indexOf(callback) ?? -1;
    if (index >= 0) {
      this.callbacks?.splice(index, 1);
    }
    return this;
  }

  /**
   * Removes all listeners added via this TrackedEvent instance.
   * Note: Won't remove listeners added via other TrackedEvent or raw Event.
   */
  removeAllListeners() {
    for (const callback of this.callbacks || []) {
      this.event?.removeListener(callback);
    }
    this.callbacks = [];
    return this;
  }

  /**
   * Removes all listeners added via this TrackedEvent instance and prevent any
   * further listeners from being added. It is considered safe to nullify any
   * references to this instance and the underlying Event without causing leaks.
   * This should be the last method called in the lifetime of TrackedEvent.
   *
   * Throws if the underlying raw Event object still has listeners. This can
   * happen when listeners have been added via other TrackedEvents or raw Event.
   */
  dispose() {
    this.removeAllListeners();
    if (this.event?.hasListeners?.()) {
      throw new Error('Underlying Event still has listeners!');
    }
    this.event = null;
    this.callbacks = null;
  }
}

class ChromePort {
  disconnect: () => void;
  name: string;
  onDisconnect: TrackedEvent;
  onMessage: TrackedEvent;
  port: Port;
  postMessage: (...args: unknown[]) => void;
  sender?: unknown;

  constructor(port: Port) {
    this.port = port;
    this.name = this.port.name;
    this.sender = this.port.sender;
    this.disconnect = this.port.disconnect.bind(this.port);
    this.postMessage = (...args: unknown[]) => {
      try {
        this.port.postMessage(...args);
      } catch (error) {
      }
    };
    this.onMessage = new TrackedEvent(this.port.onMessage);
    this.onDisconnect = new TrackedEvent(this.port.onDisconnect);
    this.onDisconnect.addListener(this.dispose.bind(this));
  }

  dispose() {
    this.onMessage.dispose();
    this.onDisconnect.dispose();
  }
}

export = ChromePort;
