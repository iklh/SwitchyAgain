import {Options} from './options_client';

export type SwitchRuleCondition = {
  conditionType?: string;
  days?: string;
  endHour?: number | string | null;
  maxValue?: number | string | null;
  minValue?: number | string | null;
  pattern?: string;
  startHour?: number | string | null;
  [key: string]: any;
};

export type SwitchRule = {
  condition: SwitchRuleCondition;
  note?: string;
  profileName?: string;
};

export type SwitchProfileModel = {
  color?: string;
  defaultProfileName?: string;
  name?: string;
  profileType?: string;
  rules?: SwitchRule[];
};

export type AttachedOptions = {
  defaultProfileName?: string;
  enabled?: boolean;
};

export type RuleListProfileModel = {
  color?: string;
  defaultProfileName?: string;
  format?: string;
  lastUpdate?: any;
  matchProfileName?: string;
  name?: string;
  profileType?: string;
  ruleList?: string;
  sourceUrl?: string;
};

export type ConditionTypeOption = {
  group: string;
  type: string;
};

const BASIC_CONDITION_GROUPS = [
  {
    group: 'default',
    types: ['HostWildcardCondition', 'UrlWildcardCondition', 'UrlRegexCondition', 'FalseCondition']
  }
];

const ADVANCED_CONDITION_GROUPS = [
  {
    group: 'host',
    types: ['HostWildcardCondition', 'HostRegexCondition', 'HostLevelsCondition', 'IpCondition']
  },
  {
    group: 'url',
    types: ['UrlWildcardCondition', 'UrlRegexCondition', 'KeywordCondition']
  },
  {
    group: 'special',
    types: ['WeekdayCondition', 'TimeCondition', 'FalseCondition']
  }
];

const URL_CONDITION_TYPE_MAP: Record<string, boolean> = {
  UrlRegexCondition: true,
  UrlWildcardCondition: true
};

export function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

export function getBasicConditionGroups() {
  return cloneValue(BASIC_CONDITION_GROUPS);
}

export function getAdvancedConditionGroups() {
  return cloneValue(ADVANCED_CONDITION_GROUPS);
}

export function expandConditionGroups(groups: Array<{group: string; types: string[]}>) {
  const result: ConditionTypeOption[] = [];
  for (const group of groups) {
    for (const type of group.types) {
      result.push({
        group: `condition_group_${group.group}`,
        type
      });
    }
  }
  return result;
}

export function conditionTypesForMode(showConditionTypes = 0) {
  return expandConditionGroups(showConditionTypes > 0 ? getAdvancedConditionGroups() : getBasicConditionGroups());
}

export function getUrlConditionTypeMap() {
  return URL_CONDITION_TYPE_MAP;
}

export function createConditionTypeSet(conditionTypes: ConditionTypeOption[]) {
  const result: Record<string, string> = {};
  for (const conditionType of conditionTypes) {
    result[conditionType.type] = conditionType.type;
  }
  return result;
}

export function inspectRules(
  rules: SwitchRule[] | undefined,
  isUrlConditionType = URL_CONDITION_TYPE_MAP,
  basicConditionTypeSet = createConditionTypeSet(expandConditionGroups(BASIC_CONDITION_GROUPS)),
  updateAdvancedState = true
) {
  let hasConditionTypes = false;
  let hasUrlConditions = false;
  for (const rule of rules || []) {
    if (isUrlConditionType[rule.condition.conditionType || '']) {
      hasUrlConditions = true;
    }
    if (updateAdvancedState) {
      if (rule.condition.conditionType === 'TrueCondition') {
        rule.condition = {
          conditionType: 'HostWildcardCondition',
          pattern: '*'
        };
      }
      if (!basicConditionTypeSet[rule.condition.conditionType || '']) {
        hasConditionTypes = true;
      }
    }
  }
  return {
    hasConditionTypes,
    hasUrlConditions
  };
}

export function detectAdvancedConditionTypes(profile?: SwitchProfileModel | null) {
  return inspectRules(profile?.rules).hasConditionTypes ? 1 : 0;
}

export function conditionHasWarning(condition: SwitchRuleCondition) {
  if (condition.conditionType !== 'HostWildcardCondition') {
    return false;
  }
  const pattern = condition.pattern || '';
  return pattern.indexOf(':') >= 0 || pattern.indexOf('/') >= 0;
}

export function createAttachedName(profileName: string) {
  return `__ruleListOf_${profileName}`;
}

export function profileKey(profileOrName: {name?: string} | string) {
  if (typeof OmegaPac !== 'undefined' && OmegaPac?.Profiles?.nameAsKey) {
    return OmegaPac.Profiles.nameAsKey(profileOrName);
  }
  const name = typeof profileOrName === 'string' ? profileOrName : profileOrName.name || '';
  return `+${name}`;
}

export function attachedIdentity(profileName: string) {
  const attachedName = createAttachedName(profileName);
  return {
    attachedKey: profileKey(attachedName),
    attachedName
  };
}

export function createAttachedOptions(profile: SwitchProfileModel, attached?: RuleListProfileModel | null): AttachedOptions {
  const identity = attachedIdentity(profile.name || '');
  const enabled = profile.defaultProfileName === identity.attachedName;
  return {
    defaultProfileName: attached && enabled ? attached.defaultProfileName : profile.defaultProfileName,
    enabled
  };
}

export function createAttachedProfile(profile: SwitchProfileModel, attachedName: string) {
  const attached = OmegaPac.Profiles.create({
    color: profile.color,
    defaultProfileName: profile.defaultProfileName,
    name: attachedName,
    profileType: 'RuleListProfile'
  });
  OmegaPac.Profiles.updateRevision(attached);
  return attached;
}

export function createRule(rules: SwitchRule[], defaultProfileName?: string) {
  let rule: SwitchRule;
  if (rules.length > 0) {
    rule = cloneValue(rules[rules.length - 1]);
  } else {
    rule = {
      condition: {
        conditionType: 'HostWildcardCondition',
        pattern: ''
      },
      profileName: defaultProfileName
    };
  }
  if (rule.condition.pattern) {
    rule.condition.pattern = '';
  }
  return rule;
}

export function addRule(profile: SwitchProfileModel, defaultProfileName?: string) {
  profile.rules || (profile.rules = []);
  profile.rules.push(createRule(profile.rules, defaultProfileName));
}

export function removeRule(profile: SwitchProfileModel, index: number) {
  profile.rules || (profile.rules = []);
  profile.rules.splice(index, 1);
}

export function cloneRule(profile: SwitchProfileModel, index: number) {
  profile.rules || (profile.rules = []);
  const rule = cloneValue(profile.rules[index]);
  profile.rules.splice(index + 1, 0, rule);
}

export function moveRule(rules: SwitchRule[], fromIndex: number, toIndex: number) {
  if (fromIndex === toIndex) {
    return false;
  }
  const rule = rules.splice(fromIndex, 1)[0];
  rules.splice(toIndex, 0, rule);
  return true;
}

export function updateConditionField(rule: SwitchRule | undefined, field: string, value: any) {
  if (!rule) {
    return;
  }
  if (field === 'minValue' || field === 'maxValue' || field === 'startHour' || field === 'endHour') {
    rule.condition[field] = value === '' ? null : Number(value);
    return;
  }
  rule.condition[field] = value;
}

export function updateConditionType(rule: SwitchRule | undefined, type: string) {
  if (!rule) {
    return;
  }
  rule.condition.conditionType = type;
}

export function updateIpCondition(rule: SwitchRule | undefined, value: string) {
  if (!rule) {
    return;
  }
  rule.condition = value ? OmegaPac.Conditions.fromStr(`Ip: ${value}`) : {
    conditionType: 'IpCondition',
    ip: '0.0.0.0',
    prefixLength: 0
  };
}

export function updateRuleNote(rule: SwitchRule | undefined, note: string) {
  if (rule) {
    rule.note = note;
  }
}

export function updateRuleProfile(rule: SwitchRule | undefined, name: string) {
  if (rule) {
    rule.profileName = name;
  }
}

export function updateRuleWeekday(rule: SwitchRule | undefined, dayIndex: number, selected: boolean) {
  if (!rule) {
    return;
  }
  rule.condition.days || (rule.condition.days = '-------');
  const char = selected ? 'SMTWtFs'[dayIndex] : '-';
  rule.condition.days = rule.condition.days.substr(0, dayIndex) + char + rule.condition.days.substr(dayIndex + 1);
  delete rule.condition.startDay;
  delete rule.condition.endDay;
}

export function resetRuleProfiles(profile: SwitchProfileModel, defaultProfileName?: string) {
  for (const rule of profile.rules || []) {
    rule.profileName = defaultProfileName;
  }
}

export function hasNotes(rules?: SwitchRule[]) {
  return Boolean(rules?.some((rule) => !!rule.note));
}

export function composeSource(profile: SwitchProfileModel, defaultProfileName?: string) {
  return OmegaPac.RuleList.Switchy.compose({
    defaultProfileName,
    rules: profile.rules || []
  }, {
    withResult: true
  });
}

export function parseSource(code: string, options: Options | null | undefined) {
  const profilesByKey: Record<string, string> = {};
  for (const key of Object.keys(options || {})) {
    const profile = options?.[key];
    if (key.charAt(0) === '+' && profile?.name) {
      profilesByKey[key] = profile.name;
    }
  }
  try {
    const refs = OmegaPac.RuleList.Switchy.directReferenceSet({ruleList: code});
    for (const key of Object.keys(refs || {})) {
      if (!profilesByKey[key]) {
        return {
          error: new Error(`Unknown profile: ${refs[key]}`)
        };
      }
    }
    return {
      rules: OmegaPac.RuleList.Switchy.parseOmega(code, null, null, {
        source: false,
        strict: true
      }) as SwitchRule[]
    };
  } catch (error) {
    return {
      error
    };
  }
}
