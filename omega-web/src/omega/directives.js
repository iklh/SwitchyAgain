(function() {
  angular.module('omega').directive('inputGroupClear', function($timeout) {
    return {
      restrict: 'A',
      templateUrl: 'partials/input_group_clear.html',
      scope: {
        'model': '=model',
        'type': '@type',
        'ngPattern': '=?ngPattern',
        'placeholder': '@placeholder',
        'controller': '=?controller'
      },
      link: function(scope, element, attrs) {
        scope.catchAll = new RegExp('');
        $timeout(function() {
          return scope.controller = element.find('input').controller('ngModel');
        });
        scope.oldModel = '';
        scope.controller = scope.input;
        scope.modelChange = function() {
          if (scope.model) {
            return scope.oldModel = '';
          }
        };
        return scope.toggleClear = function() {
          var ref;
          return ref = [scope.oldModel, scope.model], scope.model = ref[0], scope.oldModel = ref[1], ref;
        };
      }
    };
  });

  angular.module('omega').directive('omegaIp2str', function() {
    return {
      restrict: 'A',
      priority: 2,
      require: 'ngModel',
      link: function(scope, element, attr, ngModel) {
        ngModel.$parsers.push(function(value) {
          if (value) {
            return OmegaPac.Conditions.fromStr('Ip: ' + value);
          } else {
            return {
              conditionType: 'IpCondition',
              ip: '0.0.0.0',
              prefixLength: 0
            };
          }
        });
        return ngModel.$formatters.push(function(value) {
          if (value != null ? value.ip : void 0) {
            return OmegaPac.Conditions.str(value).split(' ', 2)[1];
          } else {
            return '';
          }
        });
      }
    };
  });

}).call(this);
