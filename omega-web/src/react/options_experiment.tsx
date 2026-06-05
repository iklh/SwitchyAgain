import React, {useEffect, useMemo, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {About} from './about';
import {GeneralSettings} from './general_settings';
import {ImportExport} from './import_export';
import {
  Options,
  lastUrl,
  loadOptions,
  message,
  openShortcutConfig,
  patchOptions
} from './options_client';
import {OptionsAlert, OptionsShell} from './options_shell';
import {
  FixedProfileContent,
  PacProfile,
  ProfileShell,
  RuleListProfile,
  SwitchProfileContent,
  UnsupportedProfile,
  VirtualProfile
} from './profile_content';
import {profileByName} from './profile_widgets';
import {
  addRule,
  attachedIdentity,
  cloneRule,
  composeSource,
  createAttachedOptions,
  createAttachedProfile,
  detectAdvancedConditionTypes,
  hasNotes,
  moveRule,
  parseSource,
  profileKey,
  removeRule,
  resetRuleProfiles,
  updateConditionField,
  updateConditionType,
  updateIpCondition,
  updateRuleNote,
  updateRuleProfile,
  updateRuleWeekday
} from './switch_profile_runtime';
import {UiSettings} from './ui_settings';

type RouteName = 'about' | 'general' | 'io' | 'profile' | 'ui';

type Route = {
  name: RouteName;
  profileName?: string;
};

type AlertState = {
  i18n?: string;
  message?: string;
  type?: string;
} | null;

function cloneOptions(options: Options) {
  return JSON.parse(JSON.stringify(options));
}

function sameValue(a: any, b: any) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function optionsPatch(before: Options, after: Options) {
  const patch: Options = {};
  const keys = new Set(Object.keys(before || {}).concat(Object.keys(after || {})));
  keys.forEach((key) => {
    const oldValue = before?.[key];
    const nextValue = after?.[key];
    if (sameValue(oldValue, nextValue)) {
      return;
    }
    if (typeof nextValue === 'undefined') {
      patch[key] = [oldValue, 0, 0];
      return;
    }
    if (typeof oldValue === 'undefined') {
      patch[key] = [nextValue];
      return;
    }
    patch[key] = [oldValue, nextValue];
  });
  return patch;
}

function isPatchEmpty(patch: Options) {
  return Object.keys(patch).length === 0;
}

function routeHref(route: RouteName, params?: Record<string, string>) {
  if (route === 'profile') {
    return `#/profile/${encodeURIComponent(params?.name || '')}`;
  }
  return `#/${route}`;
}

function parseRoute(hash = window.location.hash): Route {
  const value = hash.replace(/^#\/?/, '');
  const parts = value.split('/');
  switch (parts[0]) {
    case 'ui':
      return {name: 'ui'};
    case 'general':
      return {name: 'general'};
    case 'io':
      return {name: 'io'};
    case 'profile':
      return {
        name: 'profile',
        profileName: decodeURIComponent(parts.slice(1).join('/') || '')
      };
    case 'about':
    default:
      return {name: 'about'};
  }
}

function useHashRoute() {
  const [route, setRoute] = useState(parseRoute);
  useEffect(() => {
    function syncRoute() {
      const nextRoute = parseRoute();
      setRoute(nextRoute);
      lastUrl(routeHref(nextRoute.name, nextRoute.profileName ? {name: nextRoute.profileName} : undefined).replace(/^#/, ''));
    }
    window.addEventListener('hashchange', syncRoute);
    if (!window.location.hash) {
      const storedUrl = lastUrl();
      window.location.hash = storedUrl || routeHref('about');
    }
    syncRoute();
    return () => window.removeEventListener('hashchange', syncRoute);
  }, []);
  return route;
}

function SwitchProfilePreview({
  options,
  profile,
  showPending,
  updateOptionsDraft,
  updateProfile
}: {
  options: Options;
  profile: any;
  showPending: () => void;
  updateOptionsDraft: (updater: (options: Options) => void) => void;
  updateProfile: (profileName: string, updater: (profile: any) => void) => void;
}) {
  const identity = attachedIdentity(profile.name || '');
  const attached = options[identity.attachedKey] || null;
  const attachedOptions = createAttachedOptions(profile, attached);
  const [conditionHelpShown, setConditionHelpShown] = useState(false);
  const [editSource, setEditSource] = useState(false);
  const [showNotes, setShowNotes] = useState(() => hasNotes(profile.rules));
  const [source, setSource] = useState<{code?: string; error?: {message?: string}; touched?: boolean}>({});
  const showConditionTypes = options['-showConditionTypes'] ?? detectAdvancedConditionTypes(profile);

  useEffect(() => {
    if (hasNotes(profile.rules)) {
      setShowNotes(true);
    }
  }, [profile.rules]);

  function mutateProfile(updater: (nextProfile: any) => void) {
    updateProfile(profile.name || '', updater);
  }

  function mutateAttached(updater: (nextAttached: any) => void) {
    updateOptionsDraft((nextOptions) => {
      const nextAttached = {
        ...(nextOptions[identity.attachedKey] || {})
      };
      updater(nextAttached);
      if (typeof OmegaPac !== 'undefined' && OmegaPac?.Profiles?.updateRevision) {
        OmegaPac.Profiles.updateRevision(nextAttached);
      }
      nextOptions[identity.attachedKey] = nextAttached;
    });
  }

  function toggleSource() {
    if (!editSource) {
      setSource({
        code: composeSource(profile, attachedOptions.defaultProfileName)
      });
      setEditSource(true);
      return;
    }
    const result = parseSource(source.code || '', options);
    if (result.error) {
      setSource((current) => ({
        ...current,
        error: {
          message: result.error?.message || String(result.error)
        }
      }));
      return;
    }
    updateOptionsDraft((nextOptions) => {
      const nextProfile = nextOptions[profileKey(profile.name || '')];
      const nextAttached = nextOptions[identity.attachedKey];
      const rules = (result.rules || []).slice();
      const defaultRule = rules.pop();
      const defaultProfileName = defaultRule?.profileName || 'direct';
      nextProfile.rules = rules;
      if (nextAttached && nextProfile.defaultProfileName === identity.attachedName) {
        nextAttached.defaultProfileName = defaultProfileName;
        OmegaPac.Profiles.updateRevision(nextAttached);
      } else {
        nextProfile.defaultProfileName = defaultProfileName;
      }
      OmegaPac.Profiles.updateRevision(nextProfile);
    });
    setSource({});
    setEditSource(false);
  }

  return (
    <SwitchProfileContent
      attached={attached}
      attachedOptions={attachedOptions}
      editSource={editSource}
      loadRules
      onAddNote={() => setShowNotes(true)}
      onAddRule={() => mutateProfile((nextProfile) => addRule(nextProfile, attachedOptions.defaultProfileName))}
      onAttachNew={() => updateOptionsDraft((nextOptions) => {
        const nextProfile = nextOptions[profileKey(profile.name || '')];
        const nextAttached = createAttachedProfile(nextProfile, identity.attachedName);
        nextOptions[identity.attachedKey] = nextAttached;
        nextProfile.defaultProfileName = identity.attachedName;
        OmegaPac.Profiles.updateRevision(nextProfile);
      })}
      onAttachedChange={(field, value) => mutateAttached((nextAttached) => {
        nextAttached[field] = value;
      })}
      onAttachedEnabledChange={(enabled) => mutateProfile((nextProfile) => {
        if (enabled) {
          nextProfile.defaultProfileName = identity.attachedName;
          return;
        }
        if (nextProfile.defaultProfileName === identity.attachedName) {
          nextProfile.defaultProfileName = attached?.defaultProfileName || attachedOptions.defaultProfileName || 'direct';
        }
      })}
      onAttachedMatchProfileChange={(name) => mutateAttached((nextAttached) => {
        nextAttached.matchProfileName = name;
      })}
      onCloneRule={(index) => mutateProfile((nextProfile) => cloneRule(nextProfile, index))}
      onClose={() => setConditionHelpShown(false)}
      onConditionFieldChange={(index, field, value) => mutateProfile((nextProfile) => {
        updateConditionField(nextProfile.rules?.[index], field, value);
      })}
      onConditionTypeChange={(index, type) => mutateProfile((nextProfile) => {
        updateConditionType(nextProfile.rules?.[index], type);
      })}
      onDefaultProfileChange={(name) => updateOptionsDraft((nextOptions) => {
        const nextProfile = nextOptions[profileKey(profile.name || '')];
        if (nextProfile.defaultProfileName === identity.attachedName && nextOptions[identity.attachedKey]) {
          nextOptions[identity.attachedKey].defaultProfileName = name;
          OmegaPac.Profiles.updateRevision(nextOptions[identity.attachedKey]);
          return;
        }
        nextProfile.defaultProfileName = name;
        OmegaPac.Profiles.updateRevision(nextProfile);
      })}
      onDownload={showPending}
      onIpConditionInputChange={(index, value) => mutateProfile((nextProfile) => {
        updateIpCondition(nextProfile.rules?.[index], value);
      })}
      onMoveRule={(fromIndex, toIndex) => mutateProfile((nextProfile) => {
        moveRule(nextProfile.rules || [], fromIndex, toIndex);
      })}
      onNoteChange={(index, note) => mutateProfile((nextProfile) => {
        updateRuleNote(nextProfile.rules?.[index], note);
      })}
      onProfileChange={(index, name) => mutateProfile((nextProfile) => {
        updateRuleProfile(nextProfile.rules?.[index], name);
      })}
      onRemoveAttached={() => updateOptionsDraft((nextOptions) => {
        const nextProfile = nextOptions[profileKey(profile.name || '')];
        const nextAttached = nextOptions[identity.attachedKey];
        if (nextAttached && nextProfile.defaultProfileName === identity.attachedName) {
          nextProfile.defaultProfileName = nextAttached.defaultProfileName || 'direct';
          OmegaPac.Profiles.updateRevision(nextProfile);
        }
        delete nextOptions[identity.attachedKey];
      })}
      onRemoveRule={(index) => mutateProfile((nextProfile) => removeRule(nextProfile, index))}
      onResetRules={() => mutateProfile((nextProfile) => resetRuleProfiles(nextProfile, attachedOptions.defaultProfileName))}
      onSourceChange={(code) => setSource({
        code,
        touched: true
      })}
      onToggleConditionHelp={() => setConditionHelpShown((shown) => !shown)}
      onToggleSource={toggleSource}
      onWeekdayChange={(index, dayIndex, selected) => mutateProfile((nextProfile) => {
        updateRuleWeekday(nextProfile.rules?.[index], dayIndex, selected);
      })}
      options={options}
      profile={profile}
      rules={profile.rules || []}
      show={conditionHelpShown}
      showConditionTypes={showConditionTypes}
      showNotes={showNotes}
      source={source}
    />
  );
}

function OptionsExperiment() {
  const route = useHashRoute();
  const [savedOptions, setSavedOptions] = useState<Options | null>(null);
  const [options, setOptions] = useState<Options | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'saving' | 'error'>('loading');
  const [alert, setAlert] = useState<AlertState>(null);
  const [alertShown, setAlertShown] = useState(false);

  useEffect(() => {
    loadOptions().then((loadedOptions) => {
      const cloned = cloneOptions(loadedOptions);
      setSavedOptions(cloned);
      setOptions(cloneOptions(cloned));
      setStatus('ready');
    }).catch((err) => {
      setAlert({
        type: 'error',
        message: err?.message || String(err)
      });
      setAlertShown(true);
      setStatus('error');
    });
  }, []);

  const dirty = useMemo(() => {
    if (!savedOptions || !options) {
      return false;
    }
    return !sameValue(savedOptions, options);
  }, [options, savedOptions]);

  function showAlert(nextAlert: AlertState) {
    setAlert(nextAlert);
    setAlertShown(Boolean(nextAlert));
    if (nextAlert) {
      window.setTimeout(() => setAlertShown(false), 3000);
    }
  }

  function replaceOptions(nextOptions: Options, opts?: {dirty?: boolean}) {
    const cloned = cloneOptions(nextOptions);
    setOptions(cloneOptions(cloned));
    if (!opts?.dirty) {
      setSavedOptions(cloned);
    }
  }

  function updateOptions(nextOptions: Options) {
    setOptions(cloneOptions(nextOptions));
  }

  function updateOptionsDraft(updater: (nextOptions: Options) => void) {
    setOptions((current) => {
      if (!current) {
        return current;
      }
      const nextOptions = cloneOptions(current);
      updater(nextOptions);
      return nextOptions;
    });
  }

  function updateProfile(profileName: string, updater: (profile: any) => void) {
    setOptions((current) => {
      if (!current) {
        return current;
      }
      const nextOptions = cloneOptions(current);
      const key = profileKey(profileName);
      const profile = {
        ...(nextOptions[key] || {})
      };
      updater(profile);
      if (typeof OmegaPac !== 'undefined' && OmegaPac?.Profiles?.updateRevision) {
        OmegaPac.Profiles.updateRevision(profile);
      }
      nextOptions[key] = profile;
      return nextOptions;
    });
  }

  function applyOptions() {
    if (!savedOptions || !options) {
      return Promise.resolve();
    }
    const patch = optionsPatch(savedOptions, options);
    if (isPatchEmpty(patch)) {
      setSavedOptions(cloneOptions(options));
      showAlert({type: 'success', i18n: 'options_saveSuccess'});
      return Promise.resolve();
    }
    setStatus('saving');
    return patchOptions(patch).then((loadedOptions) => {
      replaceOptions(loadedOptions);
      setStatus('ready');
      showAlert({type: 'success', i18n: 'options_saveSuccess'});
    }).catch((err) => {
      setStatus('ready');
      showAlert({
        type: 'error',
        message: err?.message || String(err)
      });
      return Promise.reject(err);
    });
  }

  function discardOptions() {
    if (!savedOptions) {
      return;
    }
    setOptions(cloneOptions(savedOptions));
    showAlert(null);
  }

  function navigate(name: string, params?: Record<string, string>) {
    window.location.hash = routeHref(name as RouteName, params);
  }

  function renderContent() {
    if (status === 'loading' || !options) {
      return (
        <div className="react-options">
          <div className="page-header">
            <h2>{message('options_loading', 'Loading...')}</h2>
          </div>
        </div>
      );
    }
    if (route.name === 'ui') {
      return (
        <div className="react-settings-host-ui">
          <UiSettings
            embedded
            options={options}
            onOpenShortcutConfig={openShortcutConfig}
            onOptionsChange={updateOptions}
          />
        </div>
      );
    }
    if (route.name === 'general') {
      return (
        <div className="react-settings-host-general">
          <GeneralSettings embedded options={options} onOptionsChange={updateOptions} />
        </div>
      );
    }
    if (route.name === 'io') {
      return (
        <div className="react-settings-host-import-export">
          <ImportExport
            embedded
            options={options}
            optionsDirty={dirty}
            onApplyOptions={applyOptions}
            onImportSuccess={() => showAlert({type: 'success', i18n: 'options_importSuccess'})}
            onOptionsReplace={replaceOptions}
          />
        </div>
      );
    }
    if (route.name === 'profile') {
      const profile = route.profileName ? profileByName(options, route.profileName) : null;
      if (!profile) {
        return (
          <div className="react-options">
            <div className="page-header">
              <h2>{message('options_profileNotFound', 'Profile not found')}</h2>
            </div>
          </div>
        );
      }
      const showPending = () => showAlert({
        type: 'warning',
        message: message('options_profileEditorReactPending', 'This action is not wired in the React preview yet.')
      });
      const referenced = () => {
        if (typeof OmegaPac === 'undefined' || !OmegaPac?.Profiles?.referencedBySet) {
          return false;
        }
        return Object.keys(OmegaPac.Profiles.referencedBySet(profile, options)).length > 0;
      };
      const content = (() => {
        switch (profile.profileType) {
          case 'FixedProfile':
            return (
              <FixedProfileContent
                profile={profile}
                onBypassListChange={(value) => updateProfile(profile.name || '', (nextProfile) => {
                  nextProfile.bypassList = value;
                })}
                onEditProxyAuth={showPending}
                onProxyChange={(field, value, changeOptions) => updateProfile(profile.name || '', (nextProfile) => {
                  if (changeOptions?.clearAuth && nextProfile.auth) {
                    nextProfile.auth[field] = void 0;
                  }
                  if (typeof value === 'undefined') {
                    delete nextProfile[field];
                    return;
                  }
                  nextProfile[field] = value;
                })}
              />
            );
          case 'PacProfile':
            return (
              <PacProfile
                profile={profile}
                referenced={referenced()}
                onDownload={showPending}
                onEditProxyAuth={showPending}
                onProfileChange={(field, value) => updateProfile(profile.name || '', (nextProfile) => {
                  nextProfile[field] = value;
                })}
              />
            );
          case 'RuleListProfile':
            return (
              <RuleListProfile
                options={options}
                profile={profile}
                onDownload={showPending}
                onProfileChange={(field, value) => updateProfile(profile.name || '', (nextProfile) => {
                  nextProfile[field] = value;
                })}
              />
            );
          case 'VirtualProfile':
            return (
              <VirtualProfile
                options={options}
                profile={profile}
                onReplaceProfile={showPending}
                onTargetChange={(name) => updateProfile(profile.name || '', (nextProfile) => {
                  nextProfile.defaultProfileName = name;
                })}
              />
            );
          case 'SwitchProfile':
            return (
              <SwitchProfilePreview
                options={options}
                profile={profile}
                showPending={showPending}
                updateOptionsDraft={updateOptionsDraft}
                updateProfile={updateProfile}
              />
            );
          default:
            return <UnsupportedProfile profile={profile} />;
        }
      })();
      return (
        <div>
          <ProfileShell
            profile={profile}
            profileColor={profile.color}
            scriptable={profile.profileType !== 'DirectProfile' && profile.profileType !== 'SystemProfile'}
            onColorChange={(color) => updateProfile(profile.name || '', (nextProfile) => {
              nextProfile.color = color;
            })}
            onDelete={showPending}
            onExportScript={showPending}
            onRename={showPending}
          />
          {content}
        </div>
      );
    }
    return (
      <About
        embedded
        onResetOptions={() => navigate('io')}
      />
    );
  }

  return (
    <>
      <div className="container-fluid">
        <header className="col-lg-2 col-sm-3 side-nav">
          <OptionsShell
            currentProfileName={route.profileName || ''}
            currentState={route.name}
            generalHref={routeHref('general')}
            importExportHref={routeHref('io')}
            onApply={applyOptions}
            onDiscard={discardOptions}
            onNavigate={navigate}
            options={options}
            optionsDirty={dirty || status === 'saving'}
            profileHref={(profile) => routeHref('profile', {name: profile.name || ''})}
            uiHref={routeHref('ui')}
          />
        </header>
        <main className="col-lg-10 col-sm-9 col-lg-offset-2 col-sm-offset-3 angular-animate">
          {renderContent()}
        </main>
      </div>
      <OptionsAlert alert={alert} shown={alertShown} onClose={() => setAlertShown(false)} />
    </>
  );
}

const rootElement = document.getElementById('react-root');

if (!rootElement) {
  throw new Error('Missing React root element.');
}

createRoot(rootElement).render(<OptionsExperiment />);
