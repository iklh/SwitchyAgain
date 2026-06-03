namespace OmegaSwitchProfileRules {
  var hasProp = {}.hasOwnProperty;
  var basicConditionGroups = [
    {
      group: 'default',
      types: ['HostWildcardCondition', 'UrlWildcardCondition', 'UrlRegexCondition', 'FalseCondition']
    }
  ];
  var advancedConditionGroups = [
    {
      group: 'host',
      types: ['HostWildcardCondition', 'HostRegexCondition', 'HostLevelsCondition', 'IpCondition']
    }, {
      group: 'url',
      types: ['UrlWildcardCondition', 'UrlRegexCondition', 'KeywordCondition']
    }, {
      group: 'special',
      types: ['WeekdayCondition', 'TimeCondition', 'FalseCondition']
    }
  ];

  function cloneValue(value) {
    return angular.fromJson(angular.toJson(value));
  }

  export function getBasicConditionGroups() {
    return cloneValue(basicConditionGroups);
  }

  export function getAdvancedConditionGroups() {
    return cloneValue(advancedConditionGroups);
  }

  export function expandConditionGroups(groups) {
    var group, j, k, len, len1, ref, result, type;
    result = [];
    for (j = 0, len = groups.length; j < len; j++) {
      group = groups[j];
      ref = group.types;
      for (k = 0, len1 = ref.length; k < len1; k++) {
        type = ref[k];
        result.push({
          type: type,
          group: 'condition_group_' + group.group
        });
      }
    }
    return result;
  }

  export function createConditionTypeSet(conditionTypes) {
    var j, len, result, type;
    result = {};
    for (j = 0, len = conditionTypes.length; j < len; j++) {
      type = conditionTypes[j];
      result[type.type] = type.type;
    }
    return result;
  }

  export function getUrlConditionTypeMap() {
    return {
      'UrlWildcardCondition': true,
      'UrlRegexCondition': true
    };
  }

  export function inspectRules(rules, isUrlConditionType, basicConditionTypeSet, updateAdvancedState) {
    var hasConditionTypes, hasUrlConditions, j, len, rule;
    hasConditionTypes = false;
    hasUrlConditions = false;
    if (!rules) {
      return {
        hasConditionTypes: hasConditionTypes,
        hasUrlConditions: hasUrlConditions
      };
    }
    for (j = 0, len = rules.length; j < len; j++) {
      rule = rules[j];
      if (isUrlConditionType[rule.condition.conditionType]) {
        hasUrlConditions = true;
      }
      if (updateAdvancedState) {
        if (rule.condition.conditionType === 'TrueCondition') {
          rule.condition = {
            conditionType: 'HostWildcardCondition',
            pattern: '*'
          };
        }
        if (!basicConditionTypeSet[rule.condition.conditionType]) {
          hasConditionTypes = true;
        }
      }
    }
    return {
      hasConditionTypes: hasConditionTypes,
      hasUrlConditions: hasUrlConditions
    };
  }

  export function composeOmegaRuleList(rules, defaultProfileName, usageUrl, dateText) {
    var eol, info, text;
    text = OmegaPac.RuleList.Switchy.compose({
      rules: rules,
      defaultProfileName: defaultProfileName
    });
    eol = '\r\n';
    info = '\n';
    info += '; Require: SwitchyOmega >= 2.3.2' + eol;
    info += ("; Date: " + dateText) + eol;
    info += ("; Usage: " + usageUrl) + eol;
    return text.replace('\n', info);
  }

  export function composeLegacyRuleList(rules, defaultProfileName, usageUrl, dateText) {
    var i, j, len, regexpRules, rule, wildcardRules;
    wildcardRules = '';
    regexpRules = '';
    for (j = 0, len = rules.length; j < len; j++) {
      rule = rules[j];
      i = '';
      if (rule.profileName === defaultProfileName) {
        i = '!';
      }
      switch (rule.condition.conditionType) {
        case 'HostWildcardCondition':
          wildcardRules += i + '@*://' + rule.condition.pattern + '/*' + '\r\n';
          break;
        case 'UrlWildcardCondition':
          wildcardRules += i + '@' + rule.condition.pattern + '\r\n';
          break;
        case 'UrlRegexCondition':
          regexpRules += i + rule.condition.pattern + '\r\n';
      }
    }
    return "; Summary: Proxy Switchy! Exported Rule List\n; Date: " + dateText + "\n; Website: " + usageUrl + "\n\n#BEGIN\n\n[wildcard]\n" + wildcardRules + "\n[regexp]\n" + regexpRules + "\n#END";
  }

  export function parseOmegaRules(code, profilesByKey, arg, translateError) {
    var detect, err, key, name, ref, refs, requireResult, setError;
    ref = arg != null ? arg : {}, detect = ref.detect, requireResult = ref.requireResult;
    setError = function(error) {
      var message;
      if (error.reason) {
        message = translateError(error);
        if (message) {
          error.message = message;
        }
      }
      return {
        error: error
      };
    };
    if (detect && !OmegaPac.RuleList.Switchy.detect(code)) {
      return {
        error: {
          reason: 'notSwitchy'
        }
      };
    }
    refs = OmegaPac.RuleList.Switchy.directReferenceSet({
      ruleList: code
    });
    if (requireResult && !refs) {
      return setError({
        reason: 'resultNotEnabled'
      });
    }
    for (key in refs) {
      if (!hasProp.call(refs, key)) continue;
      name = refs[key];
      if (!OmegaPac.Profiles.byKey(key, profilesByKey)) {
        return setError({
          reason: 'unknownProfile',
          args: [name]
        });
      }
    }
    try {
      return {
        rules: OmegaPac.RuleList.Switchy.parseOmega(code, null, null, {
          strict: true,
          source: false
        })
      };
    } catch (error1) {
      err = error1;
      return setError(err);
    }
  }

  export function createRule(rules, defaultProfileName) {
    var rule;
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

  export function addRule(rules, defaultProfileName) {
    var rule = createRule(rules, defaultProfileName);
    rules.push(rule);
    return rule;
  }

  export function removeRule(rules, index) {
    return rules.splice(index, 1);
  }

  export function cloneRule(rules, index) {
    var rule = cloneValue(rules[index]);
    rules.splice(index + 1, 0, rule);
    return rule;
  }

  export function resetRuleProfiles(rules, defaultProfileName) {
    var j, len, rule;
    for (j = 0, len = rules.length; j < len; j++) {
      rule = rules[j];
      rule.profileName = defaultProfileName;
    }
  }

  export function hasNotes(rules) {
    return rules && rules.some(function(rule) {
      return !!rule.note;
    });
  }

  export function validateCondition(condition, pattern) {
    var _;
    if (condition.conditionType.indexOf('Regex') >= 0) {
      try {
        new RegExp(pattern);
      } catch (error1) {
        _ = error1;
        return false;
      }
    }
    return true;
  }

  export function conditionHasWarning(condition) {
    var pattern;
    if (condition.conditionType === 'HostWildcardCondition') {
      pattern = condition.pattern;
      return pattern.indexOf(':') >= 0 || pattern.indexOf('/') >= 0;
    }
    return false;
  }

  export function updateDay(condition, i, selected) {
    var char;
    condition.days || (condition.days = '-------');
    char = selected ? 'SMTWtFs'[i] : '-';
    condition.days = condition.days.substr(0, i) + char + condition.days.substr(i + 1);
    delete condition.startDay;
    return delete condition.endDay;
  }
}
