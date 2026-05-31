(function() {
  angular.module('omega').controller('RuleListProfileCtrl', function($scope) {
    return $scope.ruleListFormats = OmegaPac.Profiles.ruleListFormats;
  });

}).call(this);
