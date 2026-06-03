(function() {
  angular.module('omega').controller('IoCtrl', function($scope, $rootScope, $window, omegaTarget) {
    omegaTarget.state('web.restoreOnlineUrl').then(function(url) {
      if (url) {
        return $scope.restoreOnlineUrl = url;
      }
    });
    $scope.enableOptionsSync = function(args) {
      var enable;
      enable = function() {
        return omegaTarget.setOptionsSync(true, args)["finally"](function() {
          return $window.location.reload();
        });
      };
      if (args != null ? args.force : void 0) {
        return enable();
      } else {
        return $rootScope.applyOptionsConfirm().then(enable);
      }
    };
    $scope.disableOptionsSync = function() {
      return omegaTarget.setOptionsSync(false).then(function() {
        return $rootScope.applyOptionsConfirm().then(function() {
          return $window.location.reload();
        });
      });
    };
    return $scope.resetOptionsSync = function() {
      return omegaTarget.resetOptionsSync().then(function() {
        return $rootScope.applyOptionsConfirm().then(function() {
          return $window.location.reload();
        });
      });
    };
  });

}).call(this);
