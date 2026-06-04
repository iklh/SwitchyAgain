(function() {
  angular.module('omega').controller('SwitchProfileCtrl', function($scope, $rootScope, $location, $timeout, $q, $modal, profileIcons, getAttachedName, omegaTarget, trFilter, downloadFile, reactModalTemplates) {
    var attachedSourceCache, exportLegacyRuleList, exportRuleList, readyState, stateEditorKey, stopWatchingForRules, unwatchRules;
    exportRuleList = OmegaSwitchProfileExport.createExportRuleListAction($scope, trFilter, downloadFile);
    exportLegacyRuleList = OmegaSwitchProfileExport.createExportLegacyRuleListAction($scope, trFilter, downloadFile);
    $scope.conditionHelp = {
      show: $location.search().help === 'condition'
    };
    unwatchRules = OmegaSwitchProfileOptions.watchConditionMode($scope, exportRuleList, exportLegacyRuleList);
    readyState = OmegaSwitchProfileSession.createReadyState($q);
    stopWatchingForRules = OmegaSwitchProfileSession.watchRulesReady($scope, readyState);
    OmegaSwitchProfileAttached.watchAttachedIdentity($scope, getAttachedName);
    OmegaSwitchProfileAttached.watchAttachedProfile($scope);
    $scope.watchAndUpdateRevision('options[attachedKey]');
    attachedSourceCache = {};
    OmegaSwitchProfileAttached.watchAttachedSourceChanges($scope, attachedSourceCache);
    $scope.attachedOptions = OmegaSwitchProfileAttached.createAttachedOptions();
    OmegaSwitchProfileAttached.watchAttachedOptionSync($scope, readyState);
    stateEditorKey = 'web._profileEditor.' + $scope.profile.name;
    $scope.loadRules = false;
    $scope.editSource = false;
    OmegaSwitchProfileBindings.bindScopeActions($scope, {
      $modal: $modal,
      $q: $q,
      $timeout: $timeout,
      omegaTarget: omegaTarget,
      reactModalTemplates: reactModalTemplates,
      readyState: readyState,
      stateEditorKey: stateEditorKey,
      trFilter: trFilter
    });
    $rootScope.$on('$stateChangeStart', function(event, _, __, fromState) {
      if (OmegaSwitchProfileSession.shouldBlockStateChange($scope, trFilter)) {
        return event.preventDefault();
      }
    });
    $scope.$on('omegaApplyOptions', function(event) {
      var validation;
      validation = OmegaSwitchProfileSession.validateBeforeApply($scope, trFilter);
      if (!validation.attachedValid) {
        event.preventDefault();
        angular.element('#attached-rulelist')[0].focus();
      }
      if (validation.sourceTouched) {
        event.preventDefault();
        if (validation.sourceValid) {
          return $timeout(function() {
            return $rootScope.applyOptions();
          });
        }
      }
    });
    return omegaTarget.state(stateEditorKey).then(function(opts) {
      var restored;
      restored = OmegaSwitchProfileSession.restoreInitialState($scope, opts);
      if (restored.editSource) {
        return $scope.toggleSource();
      } else {
        return OmegaSwitchProfileSession.getSwitchGuideState($q, readyState, omegaTarget).then(function(arg) {
          var _, firstRun, ref, switchGuide;
          _ = arg[0], (ref = arg[1], switchGuide = ref[0], firstRun = ref[1]);
          if (!OmegaSwitchProfileSession.shouldShowSwitchGuide($scope, firstRun, switchGuide)) {
            return;
          }
          omegaTarget.state('web.switchGuide', 'shown');
          return $script('js/switch_profile_guide.js');
        });
      }
    });
  });

}).call(this);
