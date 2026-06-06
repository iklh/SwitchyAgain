import {message} from './options_client';

export type Profile = {
  builtin?: boolean;
  color?: string;
  defaultProfileName?: string;
  desc?: string;
  name: string;
  profileType?: string;
  validResultProfiles?: string[];
};

export type PageInfo = {
  domain?: string;
  errorCount?: number;
  summary?: Record<string, {errorCount?: number}>;
  tempRuleProfileName?: string;
  url?: string;
};

export type PopupState = {
  availableProfiles?: Record<string, Profile>;
  currentProfileCanAddRule?: boolean;
  currentProfileName?: string;
  externalProfile?: Profile;
  isSystemProfile?: boolean;
  lastProfileNameForCondition?: string;
  proxyNotControllable?: string;
  refreshOnProfileChange?: boolean;
  showExternalProfile?: boolean;
  validResultProfiles?: string[];
};

export type PopupCondition = Record<string, unknown> | Array<Record<string, unknown>>;

export type PopupTarget = {
  addCondition?: (
    condition: PopupCondition,
    profileName: string,
    addToBottom: boolean,
    callback?: (error?: unknown) => void
  ) => void;
  addProfile?: (profile: Profile, callback?: (error?: unknown) => void) => void;
  addTempRule?: (domain: string, profileName: string, callback?: (error?: unknown) => void) => void;
  applyProfile?: (name: string, callback?: (error?: unknown) => void) => void;
  getActivePageInfo?: (callback: (error?: unknown, info?: PageInfo) => void) => void;
  getMessage?: (key: string, substitutions?: string | string[]) => string;
  getState?: (keys: string[], callback: (error?: unknown, state?: PopupState) => void) => void;
  openManage?: (callback?: () => void) => void;
  openOptions?: (hash?: string | null, callback?: () => void) => void;
  setDefaultProfile?: (
    profileName: string,
    defaultProfileName: string,
    callback?: (error?: unknown) => void
  ) => void;
  setState?: (name: string, value: unknown, callback?: (error?: unknown) => void) => void;
};

declare global {
  interface Window {
    OmegaTargetPopup?: PopupTarget;
  }
}

export function closePopup() {
  window.close();
  document.body.style.opacity = '0';
  window.setTimeout(() => history.go(0), 300);
}

export function popupTarget() {
  return window.OmegaTargetPopup || {};
}

export function waitForPopupTarget() {
  if (window.OmegaTargetPopup) {
    return Promise.resolve();
  }
  return new Promise<void>((resolve, reject) => {
    let tries = 0;
    const timer = window.setInterval(() => {
      tries++;
      if (window.OmegaTargetPopup) {
        window.clearInterval(timer);
        resolve();
      } else if (tries > 100) {
        window.clearInterval(timer);
        reject(new Error('Popup target API is unavailable.'));
      }
    }, 20);
  });
}

export function callbackPromise<T>(
  invoke: (callback: (error?: unknown, value?: T) => void) => void
) {
  return new Promise<T>((resolve, reject) => {
    let settled = false;
    const callback = (error?: unknown, value?: T) => {
      settled = true;
      if (error) {
        reject(error);
      } else {
        resolve(value as T);
      }
    };
    invoke(callback);
    if (!settled) {
      window.setTimeout(() => {
        if (!settled) {
          reject(new Error('Popup target method did not respond.'));
        }
      }, 15000);
    }
  });
}

export function getPopupState(keys: string[]) {
  return callbackPromise<PopupState>((callback) => popupTarget().getState?.(keys, callback));
}

export function getPopupPageInfo() {
  return callbackPromise<PageInfo | undefined>((callback) => popupTarget().getActivePageInfo?.(callback));
}

export function popupMessage(key: string, fallback = key, substitutions?: string | string[]) {
  return popupTarget().getMessage?.(key, substitutions) || message(key, fallback, substitutions);
}
