namespace OmegaSwitchProfileBindings {
  export function bindScopeActions(scope: any, deps: any) {
    var unwatchRulesShowNote;
    scope.addRule = function() {
      return OmegaSwitchProfileActions.addRule(scope.profile, scope.attachedOptions);
    };
    scope.removeRule = function(index) {
      var removeForReal, modalScope;
      removeForReal = function() {
        return OmegaSwitchProfileActions.removeRule(scope.profile, index);
      };
      if (scope.options['-confirmDeletion']) {
        modalScope = OmegaSwitchProfileActions.createRuleRemoveScope(scope, scope.profile.rules[index]);
        return deps.$modal.open({
          template: deps.reactModalTemplates.ruleRemoveConfirm,
          scope: modalScope
        }).result.then(removeForReal);
      }
      return removeForReal();
    };
    scope.cloneRule = function(index) {
      return OmegaSwitchProfileActions.cloneRule(scope.profile, index);
    };
    scope.showNotes = false;
    scope.addNote = function(index) {
      return OmegaSwitchProfileActions.addNote(scope, unwatchRulesShowNote);
    };
    unwatchRulesShowNote = scope.$watch('profile.rules', (function(rules) {
      return OmegaSwitchProfileActions.syncShowNotes(scope, rules, unwatchRulesShowNote);
    }), true);
    scope.resetRules = function() {
      var modalScope;
      modalScope = OmegaSwitchProfileActions.createRuleResetScope(scope);
      return deps.$modal.open({
        template: deps.reactModalTemplates.ruleResetConfirm,
        scope: modalScope
      }).result.then(function() {
        return OmegaSwitchProfileActions.resetRuleProfiles(scope.profile, scope.attachedOptions);
      });
    };
    scope.attachNew = function() {
      return OmegaSwitchProfileAttached.attachNew(scope);
    };
    scope.removeAttached = function() {
      var modalScope;
      if (!scope.attached) {
        return;
      }
      modalScope = OmegaSwitchProfileAttached.createDeleteAttachedScope(scope);
      return deps.$modal.open({
        template: deps.reactModalTemplates.deleteAttached,
        scope: modalScope
      }).result.then(function() {
        return OmegaSwitchProfileAttached.removeAttached(scope);
      });
    };
    scope.toggleSource = function() {
      return OmegaSwitchProfileSession.toggleSourceWhenReady(scope, deps.$q, deps.readyState, deps.stateEditorKey, deps.omegaTarget, deps.trFilter);
    };
    return {
      unwatchRulesShowNote: unwatchRulesShowNote
    };
  }
}
