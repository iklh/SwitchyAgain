type ProxyImplConstructor = {
  isSupported: () => boolean;
  new(log: unknown): unknown;
};

const ListenerProxyImpl = require('./proxy_impl_listener') as ProxyImplConstructor;
const SettingsProxyImpl = require('./proxy_impl_settings') as ProxyImplConstructor;

export const proxyImpls = [ListenerProxyImpl, SettingsProxyImpl];

export function getProxyImpl(log: unknown) {
  for (const Impl of proxyImpls) {
    if (Impl.isSupported()) {
      return new Impl(log);
    }
  }
  throw new Error('Your browser does not support proxy settings!');
}
