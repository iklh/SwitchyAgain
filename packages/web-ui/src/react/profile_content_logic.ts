import {
  conditionTypesForMode as switchConditionTypesForMode
} from './switch_profile_runtime';
import type {
  ConditionTypeOption
} from './switch_profile_runtime';
import type {
  FixedProfileBypassCondition,
  FixedProfileModel,
  FixedProfileProxyEditors,
  FixedProfileProxyField,
  FixedProfileProxyProtocol,
  FixedProfileScheme
} from './profile_types';

export const FIXED_PROFILE_SCHEMES: FixedProfileScheme[] = ['', 'http', 'https'];
export const FIXED_PROFILE_PROXY_FIELDS: Record<FixedProfileScheme, FixedProfileProxyField> = {
  '': 'fallbackProxy',
  http: 'proxyForHttp',
  https: 'proxyForHttps'
};
export const FIXED_PROFILE_SCHEME_DISP: Record<FixedProfileScheme, string | null> = {
  '': null,
  http: 'http://',
  https: 'https://'
};
export const FIXED_PROFILE_DEFAULT_PORT: Record<FixedProfileProxyProtocol, number> = {
  http: 80,
  https: 443,
  socks4: 1080,
  socks5: 1080
};
export const FIXED_PROFILE_PROTOCOLS: FixedProfileProxyProtocol[] = ['http', 'https', 'socks4', 'socks5'];

export function normalizeColor(color?: string) {
  if (!color) {
    return '#000000';
  }
  if (/^#[0-9a-f]{3}$/i.test(color)) {
    return '#' + color.charAt(1) + color.charAt(1) + color.charAt(2) + color.charAt(2) + color.charAt(3) + color.charAt(3);
  }
  if (/^#[0-9a-f]{6}$/i.test(color)) {
    return color;
  }
  return '#000000';
}

export function groupedConditionTypes(conditionTypes: ConditionTypeOption[] = []) {
  const groups: Record<string, ConditionTypeOption[]> = {};
  const order: string[] = [];
  for (const conditionType of conditionTypes) {
    if (!groups[conditionType.group]) {
      groups[conditionType.group] = [];
      order.push(conditionType.group);
    }
    groups[conditionType.group].push(conditionType);
  }
  return order.map((group) => ({group, types: groups[group]}));
}

export function conditionTypesForMode(showConditionTypes = 0): ConditionTypeOption[] {
  return switchConditionTypesForMode(showConditionTypes);
}

export function conditionTypeFromSelectValue(conditionTypes: ConditionTypeOption[], value: string) {
  return conditionTypes.find((conditionType) => conditionType.type === value)?.type;
}

export function moveIndex(indices: number[], fromIndex: number, toIndex: number) {
  if (fromIndex === toIndex) {
    return indices;
  }
  const next = indices.slice();
  const [item] = next.splice(fromIndex, 1);
  if (item == null) {
    return indices;
  }
  next.splice(toIndex, 0, item);
  return next;
}

export function isFileUrl(url: string) {
  return /^file:\/\//i.test(url || '');
}

export function isFixedProfileProxyProtocol(value?: string): value is FixedProfileProxyProtocol {
  return FIXED_PROFILE_PROTOCOLS.includes(value as FixedProfileProxyProtocol);
}

export function cloneProxyEditors(proxyEditors?: Partial<FixedProfileProxyEditors>): FixedProfileProxyEditors {
  const cloned: FixedProfileProxyEditors = {
    '': {},
    http: {},
    https: {}
  };
  for (const scheme of FIXED_PROFILE_SCHEMES) {
    cloned[scheme] = {...(proxyEditors?.[scheme] || {})};
  }
  return cloned;
}

export function fixedProfileEditors(profile: FixedProfileModel) {
  const editors = cloneProxyEditors();
  for (const scheme of FIXED_PROFILE_SCHEMES) {
    const field = FIXED_PROFILE_PROXY_FIELDS[scheme];
    editors[scheme] = {...(profile[field] || {})};
  }
  return editors;
}

export function fixedProfileBypassText(profile: FixedProfileModel) {
  return (profile.bypassList || []).map((item) => item.pattern).join('\n');
}

export function fixedProfileBypassList(value: string): FixedProfileBypassCondition[] {
  return value.split(/\r?\n/).filter(Boolean).map((pattern) => ({
    conditionType: 'BypassCondition',
    pattern
  }));
}

export function fixedProfileHasAdvancedProxy(editors: FixedProfileProxyEditors) {
  return !!(editors.http?.scheme || editors.https?.scheme);
}

export function fixedProfileAuthActive(profile: FixedProfileModel, scheme: FixedProfileScheme) {
  return !!profile.auth?.[FIXED_PROFILE_PROXY_FIELDS[scheme]];
}
