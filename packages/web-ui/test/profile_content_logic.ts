import {
  FIXED_PROFILE_DEFAULT_PORT,
  FIXED_PROFILE_PROTOCOLS,
  FIXED_PROFILE_PROXY_FIELDS,
  cloneProxyEditors,
  conditionTypeFromSelectValue,
  conditionTypesForMode,
  fixedProfileAuthActive,
  fixedProfileBypassList,
  fixedProfileBypassText,
  fixedProfileEditors,
  fixedProfileHasAdvancedProxy,
  groupedConditionTypes,
  isFileUrl,
  isFixedProfileProxyProtocol,
  moveIndex,
  normalizeColor
} from '../src/react/profile_content_logic';
import type {ConditionTypeOption} from '../src/react/switch_profile_runtime';
import type {FixedProfileModel, FixedProfileProxyEditors} from '../src/react/profile_types';

describe('profile content logic', () => {
  it('normalizes profile colors for color input controls', () => {
    expect(normalizeColor()).toBe('#000000');
    expect(normalizeColor('#abc')).toBe('#aabbcc');
    expect(normalizeColor('#A1b2C3')).toBe('#A1b2C3');
    expect(normalizeColor('red')).toBe('#000000');
  });

  it('groups condition types while preserving group order', () => {
    const conditionTypes: ConditionTypeOption[] = [
      {
        group: 'condition_group_host',
        type: 'HostWildcardCondition'
      },
      {
        group: 'condition_group_url',
        type: 'UrlRegexCondition'
      },
      {
        group: 'condition_group_host',
        type: 'HostRegexCondition'
      }
    ];

    expect(groupedConditionTypes(conditionTypes)).toEqual([
      {
        group: 'condition_group_host',
        types: [
          {
            group: 'condition_group_host',
            type: 'HostWildcardCondition'
          },
          {
            group: 'condition_group_host',
            type: 'HostRegexCondition'
          }
        ]
      },
      {
        group: 'condition_group_url',
        types: [
          {
            group: 'condition_group_url',
            type: 'UrlRegexCondition'
          }
        ]
      }
    ]);
    expect(conditionTypeFromSelectValue(conditionTypes, 'HostRegexCondition')).toBe('HostRegexCondition');
    expect(conditionTypeFromSelectValue(conditionTypes, 'UnknownCondition')).toBeUndefined();
  });

  it('returns condition type sets for basic and advanced modes', () => {
    expect(conditionTypesForMode(0).map((conditionType) => conditionType.type)).toContain('HostWildcardCondition');
    expect(conditionTypesForMode(1).map((conditionType) => conditionType.type)).toContain('IpCondition');
  });

  it('moves visual rule indices without mutating the original array', () => {
    const indices = [0, 1, 2, 3];

    expect(moveIndex(indices, 0, 2)).toEqual([1, 2, 0, 3]);
    expect(indices).toEqual([0, 1, 2, 3]);
    expect(moveIndex(indices, 1, 1)).toBe(indices);
    expect(moveIndex(indices, 10, 0)).toBe(indices);
  });

  it('detects file URLs case-insensitively', () => {
    expect(isFileUrl('file:///tmp/proxy.pac')).toBe(true);
    expect(isFileUrl('FILE:///tmp/proxy.pac')).toBe(true);
    expect(isFileUrl('https://example.com/proxy.pac')).toBe(false);
  });

  it('defines fixed profile proxy schemes and defaults', () => {
    expect(FIXED_PROFILE_PROXY_FIELDS).toEqual({
      '': 'fallbackProxy',
      http: 'proxyForHttp',
      https: 'proxyForHttps'
    });
    expect(FIXED_PROFILE_PROTOCOLS).toEqual(['http', 'https', 'socks4', 'socks5']);
    expect(FIXED_PROFILE_DEFAULT_PORT).toEqual({
      http: 80,
      https: 443,
      socks4: 1080,
      socks5: 1080
    });
    expect(isFixedProfileProxyProtocol('socks5')).toBe(true);
    expect(isFixedProfileProxyProtocol('direct')).toBe(false);
  });

  it('clones fixed profile proxy editors by scheme', () => {
    const editors: FixedProfileProxyEditors = {
      '': {
        host: 'default.example',
        port: 8080,
        scheme: 'http'
      },
      http: {
        host: 'http.example',
        scheme: 'https'
      },
      https: {}
    };

    const cloned = cloneProxyEditors(editors);

    expect(cloned).toEqual(editors);
    expect(cloned).not.toBe(editors);
    expect(cloned['']).not.toBe(editors['']);
    expect(cloned.http).not.toBe(editors.http);
  });

  it('maps fixed profile fields into editors', () => {
    const profile: FixedProfileModel = {
      fallbackProxy: {
        host: 'default.example',
        port: 8080,
        scheme: 'http'
      },
      profileType: 'FixedProfile',
      proxyForHttps: {
        host: 'secure.example',
        port: 8443,
        scheme: 'https'
      }
    };

    expect(fixedProfileEditors(profile)).toEqual({
      '': {
        host: 'default.example',
        port: 8080,
        scheme: 'http'
      },
      http: {},
      https: {
        host: 'secure.example',
        port: 8443,
        scheme: 'https'
      }
    });
  });

  it('converts fixed profile bypass list text and records', () => {
    const profile: FixedProfileModel = {
      bypassList: [
        {
          conditionType: 'BypassCondition',
          pattern: 'localhost'
        },
        {
          conditionType: 'BypassCondition',
          pattern: '*.internal'
        }
      ],
      profileType: 'FixedProfile'
    };

    expect(fixedProfileBypassText(profile)).toBe('localhost\n*.internal');
    expect(fixedProfileBypassList('localhost\n\n*.internal\r\n')).toEqual([
      {
        conditionType: 'BypassCondition',
        pattern: 'localhost'
      },
      {
        conditionType: 'BypassCondition',
        pattern: '*.internal'
      }
    ]);
  });

  it('detects advanced proxy and active proxy auth state', () => {
    expect(fixedProfileHasAdvancedProxy({
      '': {
        scheme: 'http'
      },
      http: {},
      https: {}
    })).toBe(false);
    expect(fixedProfileHasAdvancedProxy({
      '': {},
      http: {
        scheme: 'https'
      },
      https: {}
    })).toBe(true);
    expect(fixedProfileAuthActive({
      auth: {
        proxyForHttps: {
          username: 'user'
        }
      }
    }, 'https')).toBe(true);
    expect(fixedProfileAuthActive({}, 'http')).toBe(false);
  });
});
