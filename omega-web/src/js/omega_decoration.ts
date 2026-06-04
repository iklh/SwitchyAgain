(function() {
  var orderForType;

  orderForType = {
    'FixedProfile': -2000,
    'PacProfile': -1000,
    'VirtualProfile': 1000,
    'SwitchProfile': 2000,
    'RuleListProfile': 3000
  };

  angular.module('omegaDecoration', []).value('profileIcons', {
    'DirectProfile': 'glyphicon-transfer',
    'SystemProfile': 'glyphicon-off',
    'AutoDetectProfile': 'glyphicon-file',
    'FixedProfile': 'glyphicon-globe',
    'PacProfile': 'glyphicon-file',
    'VirtualProfile': 'glyphicon-question-sign',
    'RuleListProfile': 'glyphicon-list',
    'SwitchProfile': 'glyphicon-retweet'
  }).constant('profileOrder', function(a, b) {
    var diff;
    diff = (orderForType[a.profileType] | 0) - (orderForType[b.profileType] | 0);
    if (diff !== 0) {
      return diff;
    }
    if (a.name === b.name) {
      return 0;
    } else if (a.name < b.name) {
      return -1;
    } else {
      return 1;
    }
  }).constant('getVirtualTarget', function(profile, options) {
    if ((profile != null ? profile.profileType : void 0) === 'VirtualProfile') {
      return options != null ? options['+' + profile.defaultProfileName] : void 0;
    }
  }).directive('omegaProfileIcon', function(profileIcons, getVirtualTarget) {
    return {
      restrict: 'A',
      template: '<span ng-style="{color: color || getColor(profile)}"\n  ng-class="{\'virtual-profile-icon\': isVirtual(profile)}"\n  class="glyphicon {{icon || getIcon(profile)}}">\n</span>',
      scope: {
        'profile': '=?omegaProfileIcon',
        'icon': '=?icon',
        'color': '=?color',
        'options': '=options'
      },
      link: function(scope, element, attrs, ngModel) {
        scope.profileIcons = profileIcons;
        scope.isVirtual = function(profile) {
          return (profile != null ? profile.profileType : void 0) === 'VirtualProfile';
        };
        scope.getIcon = function(profile) {
          var ref, ref1, type;
          type = profile != null ? profile.profileType : void 0;
          type = (ref = (ref1 = getVirtualTarget(profile, scope.options)) != null ? ref1.profileType : void 0) != null ? ref : type;
          return profileIcons[type];
        };
        return scope.getColor = function(profile) {
          var color;
          color = void 0;
          while (profile) {
            color = profile.color;
            profile = getVirtualTarget(profile, scope.options);
          }
          return color;
        };
      }
    };
  }).directive('omegaProfileInline', function() {
    return {
      restrict: 'A',
      template: '<span omega-profile-icon="profile" options="options"></span>\n{{dispName ? dispName(profile) : profile.name}}',
      scope: {
        'profile': '=omegaProfileInline',
        'dispName': '=?dispName',
        'options': '=options'
      }
    };
  }).directive('omegaHtml', function($compile) {
    return {
      restrict: 'A',
      link: function(scope, element, attrs, ngModel) {
        var getHtml, locals;
        locals = {
          $profile: function(profile, dispName, options) {
            if (profile == null) {
              profile = 'profile';
            }
            if (dispName == null) {
              dispName = 'dispNameFilter';
            }
            if (options == null) {
              options = 'options';
            }
            return "<span class=\"profile-inline\" omega-profile-inline=\"" + profile + "\"\n  disp-name=\"" + dispName + "\" options=\"" + options + "\"></span>";
          }
        };
        getHtml = function() {
          return scope.$eval(attrs.omegaHtml, locals);
        };
        return scope.$watch(getHtml, function(html) {
          element.html(html);
          return $compile(element.contents())(scope);
        });
      }
    };
  }).directive('omegaProfileSelect', function($timeout, $compile, profileIcons) {
    var legacyTemplate;
    legacyTemplate = [
      '<div class="btn-group omega-profile-select" dropdown on-toggle="toggled(open)">',
      '  <button class="btn btn-default dropdown-toggle" dropdown-toggle type="button" aria-expanded="false" role="listbox" aria-haspopup="true">',
      '    <span omega-profile-icon="selectedProfile" options="options" icon="selectedProfile ? undefined : &quot;glyphicon-time&quot;"></span>',
      '    <span ng-show="!!profileName">{{getName(selectedProfile)}}</span>',
      '    <span ng-show="!profileName">{{defaultText}}</span>',
      '    <span class="caret"></span>',
      '  </button>',
      '  <ul class="dropdown-menu" role="listbox">',
      '    <li role="option" ng-if="!!defaultText" ng-class="{active: profileName == &quot;&quot;}">',
      '      <a ng-click="setProfileName(&quot;&quot;)"><span class="glyphicon glyphicon-time"></span> {{defaultText}}</a>',
      '    </li>',
      '    <li role="option" ng-repeat="profile in dispProfiles" ng-class="{active: profileName == profile.name}">',
      '      <a ng-click="setProfileName(profile.name)"><span omega-profile-icon="profile" options="options"></span> {{getName(profile)}}</a>',
      '    </li>',
      '  </ul>',
      '</div>'
    ].join('');
    return {
      restrict: 'A',
      require: '?ngModel',
      scope: {
        'profiles': '&omegaProfileSelect',
        'defaultText': '@?defaultText',
        'dispName': '=?dispName',
        'options': '=options'
      },
      link: function(scope, element, attrs, ngModel) {
        var bridge, mounted, render, unwatchers, updateView;
        scope.profileIcons = profileIcons;
        scope.currentProfiles = [];
        scope.dispProfiles = void 0;
        updateView = function() {
          var i, len, profile, ref, results;
          scope.profileIcon = '';
          ref = scope.currentProfiles;
          results = [];
          for (i = 0, len = ref.length; i < len; i++) {
            profile = ref[i];
            if (profile.name === scope.profileName) {
              scope.selectedProfile = profile;
              scope.profileIcon = profileIcons[profile.profileType];
              break;
            } else {
              results.push(void 0);
            }
          }
          return results;
        };
        bridge = (window as any).OmegaReactProfileWidgets;
        if (bridge != null ? bridge.mountProfileSelect : void 0) {
          unwatchers = [];
          render = function() {
            var props;
            props = {
              defaultText: scope.defaultText,
              dispName: scope.dispName,
              name: scope.profileName || '',
              onChange: function(name) {
                return scope.$evalAsync(function() {
                  if (ngModel) {
                    ngModel.$setViewValue(name);
                    return ngModel.$render();
                  }
                });
              },
              options: scope.options,
              profiles: scope.currentProfiles
            };
            if (mounted != null ? mounted.render : void 0) {
              return mounted.render(props);
            } else {
              return mounted = bridge.mountProfileSelect(element[0], props);
            }
          };
          unwatchers.push(scope.$watch(scope.profiles, (function(profiles) {
            scope.currentProfiles = profiles || [];
            updateView();
            return render();
          }), true));
          unwatchers.push(scope.$watch('defaultText', render));
          unwatchers.push(scope.$watch('options', render, true));
          if (ngModel) {
            ngModel.$render = function() {
              scope.profileName = ngModel.$viewValue;
              updateView();
              return render();
            };
          }
          render();
          return scope.$on('$destroy', function() {
            var i, len, unwatch;
            for (i = 0, len = unwatchers.length; i < len; i++) {
              unwatch = unwatchers[i];
              if (unwatch) {
                unwatch();
              }
            }
            if (mounted != null ? mounted.unmount : void 0) {
              return mounted.unmount();
            }
          });
        }
        element.html(legacyTemplate);
        $compile(element.contents())(scope);
        scope.$watch(scope.profiles, (function(profiles) {
          scope.currentProfiles = profiles || [];
          if (scope.dispProfiles != null) {
            scope.dispProfiles = scope.currentProfiles;
          }
          return updateView();
        }), true);
        scope.toggled = function(open) {
          if (open && (scope.dispProfiles == null)) {
            scope.dispProfiles = scope.currentProfiles;
            return scope.toggled = void 0;
          }
        };
        if (ngModel) {
          ngModel.$render = function() {
            scope.profileName = ngModel.$viewValue;
            return updateView();
          };
        }
        scope.setProfileName = function(name) {
          if (ngModel) {
            ngModel.$setViewValue(name);
            return ngModel.$render();
          }
        };
        return scope.getName = function(profile) {
          if (profile) {
            return scope.dispName(profile) || profile.name;
          }
        };
      }
    };
  });

}).call(this);
