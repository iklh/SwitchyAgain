(function() {
  handleClick('js-option', showOptions);
  handleClick('js-temprule', showTempRuleDropdown);
  handleClick('js-direct', applyProfile.bind(this, 'direct'));
  handleClick('js-system', applyProfile.bind(this, 'system'));
  handleClick('js-addrule', showFlow.bind(this, 'addRule'));
  handleClick('js-reqinfo', showFlow.bind(this, 'requestInfo'));
  OmegaPopup.addTempRule = addTempRule;
  OmegaPopup.setDefaultProfile = setDefaultProfile;
  OmegaPopup.applyProfile = applyProfile;
  OmegaPopup.showFlow = showFlow;
  if (location.hash.indexOf('!') >= 0) {
    showFlow(location.hash.substr(2));
  }
  return;

  function handleClick(id, handler) {
    document.getElementById(id).addEventListener('click', handler, false);
  }

  function closePopup() {
    window.close();
    // If the popup is opened as a tab, the above won't work. Let's reload then.
    document.body.style.opacity = 0;
    setTimeout(function() { history.go(0); }, 300);
  }

  function showOptions(e) {
    if (typeof OmegaTargetPopup !== 'undefined') {
      try {
        OmegaTargetPopup.openOptions(null, closePopup);
        e.preventDefault();
      } catch (_) {
      }
    }
  }

  function applyProfile(profileName) {
    $script.ready('om-target', function() {
      OmegaTargetPopup.applyProfile(profileName);
    });
    closePopup();
  }

  function setDefaultProfile(profileName, defaultProfileName) {
    $script.ready('om-target', function() {
      OmegaTargetPopup.setDefaultProfile(profileName, defaultProfileName);
    });
    closePopup();
  }

  function addTempRule(domain, profileName) {
    $script.ready('om-target', function() {
      OmegaTargetPopup.addTempRule(domain, profileName);
    });
    closePopup();
  }

  function showFlow(mode, e) {
    if (e) e.preventDefault();
    location.hash = '#!' + mode;
    document.querySelector('.om-nav').classList.add('om-hidden');
    document.getElementById('js-popup-flow').classList.remove('om-hidden');
  }

  function showTempRuleDropdown() {
    $script.ready('om-dropdowns', function() {
      OmegaPopup.showTempRuleDropdown();
    });
  }
})();
