namespace OmegaSwitchProfileRules {
  function cloneValue(value) {
    return angular.fromJson(angular.toJson(value));
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
