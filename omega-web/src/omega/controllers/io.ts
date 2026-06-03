(function() {
  angular.module('omega').controller('IoCtrl', function($scope, omegaTarget) {
    omegaTarget.state('web.restoreOnlineUrl').then(function(url) {
      if (url) {
        return $scope.restoreOnlineUrl = url;
      }
    });
  });

}).call(this);
