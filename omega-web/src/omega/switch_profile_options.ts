namespace OmegaSwitchProfileOptions {
  export type ConditionModeState = {
    hasConditionTypes: number;
    showConditionTypes: number;
  };

  export function createConditionModeState() {
    return {
      hasConditionTypes: 0,
      showConditionTypes: 0
    };
  }

  export function detectAdvancedConditionTypes(profile: OmegaSwitchProfileState.SwitchProfile, state: ConditionModeState) {
    var basicConditionTypesExpanded, basicConditionTypeSet, flags, isUrlConditionType;
    if (!profile || !profile.rules) {
      return false;
    }
    basicConditionTypesExpanded = OmegaSwitchProfileRules.expandConditionGroups(OmegaSwitchProfileRules.getBasicConditionGroups());
    basicConditionTypeSet = OmegaSwitchProfileRules.createConditionTypeSet(basicConditionTypesExpanded);
    isUrlConditionType = OmegaSwitchProfileRules.getUrlConditionTypeMap();
    flags = OmegaSwitchProfileRules.inspectRules(profile.rules, isUrlConditionType, basicConditionTypeSet, state.hasConditionTypes === 0);
    if (state.hasConditionTypes !== 0 || !flags.hasConditionTypes) {
      return false;
    }
    state.hasConditionTypes = 1;
    state.showConditionTypes = 1;
    return true;
  }

  export function updateConditionMode(profile: OmegaSwitchProfileState.SwitchProfile, options: any, state: ConditionModeState, show: number) {
    show || (show = 0);
    if (show > 0) {
      state.showConditionTypes = show;
    } else {
      detectAdvancedConditionTypes(profile, state);
      state.showConditionTypes = state.hasConditionTypes;
    }
    if (state.showConditionTypes !== 0 && options["-showConditionTypes"] == null) {
      options["-showConditionTypes"] = state.showConditionTypes;
    }
    return state.showConditionTypes;
  }

  export function exportHandlerOptions(options: any, showConditionTypes: number) {
    if (!options['-exportLegacyRuleList']) {
      return {
        legacy: false
      };
    }
    if (showConditionTypes > 0) {
      return {
        legacy: false,
        warning: true
      };
    }
    return {
      legacy: true
    };
  }
}
