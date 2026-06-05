import React, {useEffect, useMemo, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {flushSync} from 'react-dom';
import {message} from './options_client';

type Profile = {
  builtin?: boolean;
  color?: string;
  desc?: string;
  name: string;
  profileType?: string;
  validResultProfiles?: string[];
};

type PageInfo = {
  domain?: string;
  errorCount?: number;
  summary?: Record<string, {errorCount?: number}>;
  tempRuleProfileName?: string;
  url?: string;
};

type PopupState = {
  availableProfiles?: Record<string, Profile>;
  currentProfileCanAddRule?: boolean;
  currentProfileName?: string;
  externalProfile?: Profile;
  lastProfileNameForCondition?: string;
  refreshOnProfileChange?: boolean;
  showExternalProfile?: boolean;
  validResultProfiles?: string[];
};

type PopupTarget = {
  addCondition?: (
    condition: any,
    profileName: string,
    addToBottom: boolean,
    callback?: (error?: any) => void
  ) => void;
  addProfile?: (profile: Profile, callback?: (error?: any) => void) => void;
  applyProfile?: (name: string, callback?: (error?: any) => void) => void;
  getActivePageInfo?: (callback: (error?: any, info?: PageInfo) => void) => void;
  getState?: (keys: string[], callback: (error?: any, state?: PopupState) => void) => void;
  openOptions?: (hash?: string | null, callback?: () => void) => void;
  setState?: (name: string, value: any, callback?: (error?: any) => void) => void;
};

declare global {
  interface Window {
    OmegaPopup?: any;
    OmegaReactPopupFlow?: {
      mount: (element: Element) => {unmount: () => void};
    };
    OmegaTargetPopup?: PopupTarget;
  }
}

const conditionTypes = [
  'HostWildcardCondition',
  'HostRegexCondition',
  'UrlWildcardCondition',
  'UrlRegexCondition',
  'KeywordCondition'
];

const iconForProfileType: Record<string, string> = {
  DirectProfile: 'glyphicon-transfer',
  SystemProfile: 'glyphicon-off',
  AutoDetectProfile: 'glyphicon-file',
  FixedProfile: 'glyphicon-globe',
  PacProfile: 'glyphicon-file',
  VirtualProfile: 'glyphicon-question-sign',
  RuleListProfile: 'glyphicon-list',
  SwitchProfile: 'glyphicon-retweet'
};

function closePopup() {
  window.close();
  document.body.style.opacity = '0';
  window.setTimeout(() => history.go(0), 300);
}

function target() {
  return window.OmegaTargetPopup || {};
}

function waitForTarget() {
  if (window.OmegaTargetPopup) {
    return Promise.resolve();
  }
  return new Promise<void>((resolve, reject) => {
    let tries = 0;
    const timer = window.setInterval(() => {
      tries++;
      if (window.OmegaTargetPopup) {
        window.clearInterval(timer);
        resolve();
      } else if (tries > 100) {
        window.clearInterval(timer);
        reject(new Error('Popup target API is unavailable.'));
      }
    }, 20);
  });
}

function callbackPromise<T>(invoke: (callback: (error?: any, value?: T) => void) => void) {
  return new Promise<T>((resolve, reject) => {
    let settled = false;
    const callback = (error?: any, value?: T) => {
      settled = true;
      if (error) {
        reject(error);
      } else {
        resolve(value as T);
      }
    };
    invoke(callback);
    if (!settled) {
      window.setTimeout(() => {
        if (!settled) {
          reject(new Error('Popup target method did not respond.'));
        }
      }, 15000);
    }
  });
}

function getState(keys: string[]) {
  return callbackPromise<PopupState>((callback) => target().getState?.(keys, callback));
}

function getPageInfo() {
  return callbackPromise<PageInfo | undefined>((callback) => target().getActivePageInfo?.(callback));
}

function profileName(profile?: Profile) {
  if (!profile) {
    return '';
  }
  return message(`profile_${profile.name}`, profile.name);
}

function visibleResultProfiles(state?: PopupState) {
  const available = state?.availableProfiles || {};
  return (state?.validResultProfiles || [])
    .filter((name) => name.charAt(0) !== '_' || name.charAt(1) !== '_')
    .map((name) => available[`+${name}`])
    .filter(Boolean);
}

function suggestCondition(domain = '') {
  let currentDomain = domain;
  let currentDomainEscaped = currentDomain.replace(/\./g, '\\.');
  let domainLooksLikeIp = false;
  if (currentDomain.indexOf(':') >= 0) {
    domainLooksLikeIp = true;
    if (currentDomain[0] !== '[') {
      currentDomain = `[${currentDomain}]`;
      currentDomainEscaped = currentDomain.replace(/\./g, '\\.').replace(/\[/g, '\\[').replace(/\]/g, '\\]');
    }
  } else if (currentDomain[currentDomain.length - 1] >= '0' && currentDomain[currentDomain.length - 1] <= '9') {
    domainLooksLikeIp = true;
  }
  if (domainLooksLikeIp) {
    return {
      HostWildcardCondition: currentDomain,
      HostRegexCondition: `^${currentDomainEscaped}$`,
      UrlWildcardCondition: `*://${currentDomain}/*`,
      UrlRegexCondition: `://${currentDomainEscaped}(:\\d+)?/`,
      KeywordCondition: currentDomain
    };
  }
  return {
    HostWildcardCondition: `*.${currentDomain}`,
    HostRegexCondition: `(^|\\.)${currentDomainEscaped}$`,
    UrlWildcardCondition: `*://*.${currentDomain}/*`,
    UrlRegexCondition: `://([^/.]+\\.)*${currentDomainEscaped}(:\\d+)?/`,
    KeywordCondition: currentDomain
  };
}

function lastResultProfile(state?: PopupState, pageInfo?: PageInfo) {
  const profiles = visibleResultProfiles(state);
  const names = new Set(profiles.map((profile) => profile.name));
  if (pageInfo?.tempRuleProfileName && names.has(pageInfo.tempRuleProfileName)) {
    return pageInfo.tempRuleProfileName;
  }
  if (state?.lastProfileNameForCondition && names.has(state.lastProfileNameForCondition)) {
    return state.lastProfileNameForCondition;
  }
  return profiles[0]?.name || 'direct';
}

function requestDomains(info?: PageInfo) {
  return Object.keys(info?.summary || {})
    .map((domain) => ({
      domain,
      errorCount: info?.summary?.[domain]?.errorCount || 0
    }))
    .sort((a, b) => b.errorCount - a.errorCount);
}

function modeFromHash() {
  if (location.hash === '#!requestInfo') {
    return 'requestInfo';
  }
  if (location.hash === '#!external') {
    return 'external';
  }
  return 'condition';
}

function PopupFlow() {
  const [mode, setMode] = useState(modeFromHash);
  const [state, setState] = useState<PopupState>();
  const [pageInfo, setPageInfo] = useState<PageInfo>();
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    waitForTarget().then(() => Promise.all([
      getState([
        'availableProfiles',
        'currentProfileCanAddRule',
        'currentProfileName',
        'externalProfile',
        'lastProfileNameForCondition',
        'refreshOnProfileChange',
        'showExternalProfile',
        'validResultProfiles'
      ]),
      getPageInfo()
    ])).then(([nextState, nextPageInfo]) => {
      setState(nextState);
      setPageInfo(nextPageInfo);
    }).catch((err) => {
      setError(err?.message || String(err));
    });
  }, []);
  useEffect(() => {
    const updateMode = () => setMode(modeFromHash());
    window.addEventListener('hashchange', updateMode);
    return () => window.removeEventListener('hashchange', updateMode);
  }, []);

  const profiles = useMemo(() => visibleResultProfiles(state), [state]);
  const selectedProfile = lastResultProfile(state, pageInfo);
  const [profile, setProfile] = useState(selectedProfile);
  const suggestions = useMemo(() => suggestCondition(pageInfo?.domain || ''), [pageInfo?.domain]);
  const [conditionType, setConditionType] = useState(conditionTypes[0]);
  const [pattern, setPattern] = useState(suggestions.HostWildcardCondition);
  const [externalName, setExternalName] = useState('');
  const domains = useMemo(() => requestDomains(pageInfo), [pageInfo]);
  const [checkedDomains, setCheckedDomains] = useState<Record<string, boolean>>({});
  const externalNameConflict = !!externalName && !!state?.availableProfiles?.[`+${externalName}`];
  const externalNameHidden = externalName.charAt(0) === '_';

  useEffect(() => setProfile(selectedProfile), [selectedProfile]);
  useEffect(() => setPattern(suggestions[conditionType as keyof typeof suggestions] || ''), [conditionType, suggestions]);
  useEffect(() => {
    setCheckedDomains((prev) => {
      const next = {...prev};
      for (const domain of domains) {
        if (next[domain.domain] == null) {
          next[domain.domain] = true;
        }
      }
      return next;
    });
  }, [domains]);
  useEffect(() => setExternalName(state?.externalProfile?.name || ''), [state?.externalProfile?.name]);

  function closeToMenu() {
    location.hash = '';
    document.getElementById('js-popup-flow')?.classList.add('om-hidden');
    document.querySelector('.om-nav')?.classList.remove('om-hidden');
  }

  function openConditionHelp() {
    const currentProfileName = encodeURIComponent(state?.currentProfileName || '');
    target().openOptions?.(`#!/profile/${currentProfileName}?help=condition`, closePopup);
  }

  async function submitCondition(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await callbackPromise<void>((callback) => target().addCondition?.({
        conditionType,
        pattern
      }, profile, true, callback));
      target().setState?.('lastProfileNameForCondition', profile);
      closePopup();
    } catch (err: any) {
      setError(err?.message || String(err));
      setSaving(false);
    }
  }

  async function submitRequestInfo(event: React.FormEvent) {
    event.preventDefault();
    const conditions = domains
      .filter((domain) => checkedDomains[domain.domain])
      .map((domain) => ({
        conditionType: 'HostWildcardCondition',
        pattern: domain.domain
      }));
    if (conditions.length === 0) {
      setError(message('popup_requestErrorCannotAddCondition', 'Select at least one domain.'));
      return;
    }
    setSaving(true);
    setError('');
    try {
      await callbackPromise<void>((callback) => target().addCondition?.(conditions, profile, true, callback));
      target().setState?.('lastProfileNameForCondition', profile);
      closePopup();
    } catch (err: any) {
      setError(err?.message || String(err));
      setSaving(false);
    }
  }

  async function submitExternal(event: React.FormEvent) {
    event.preventDefault();
    if (externalNameConflict || externalNameHidden) {
      return;
    }
    if (!state?.externalProfile || !externalName) {
      closeToMenu();
      return;
    }
    setSaving(true);
    setError('');
    try {
      await callbackPromise<void>((callback) => target().addProfile?.({
        ...state.externalProfile,
        name: externalName
      }, callback));
      target().applyProfile?.(externalName, closePopup);
    } catch (err: any) {
      setError(err?.message || String(err));
      setSaving(false);
    }
  }

  if (!state && !error) {
    return <form className="condition-form om-popup-form"><fieldset>{message('options_profileDownloadStatusDownloading', 'Loading...')}</fieldset></form>;
  }

  if (mode === 'external') {
    return (
      <form className="condition-form om-popup-form" onSubmit={submitExternal}>
        <fieldset>
        <legend>{message('popup_externalProfile', 'External Profile')}</legend>
        {error && <p className="om-alert">{error}</p>}
        <div className="form-group">
          <label>{message('popup_externalProfileName', 'Profile name')}</label>
          <input className="form-control" autoFocus value={externalName} onChange={(event) => setExternalName(event.currentTarget.value)} />
        </div>
        {externalNameConflict && <p className="om-alert">{message('options_profileNameConflict', 'A profile with this name already exists.')}</p>}
        {externalNameHidden && <p className="om-alert">{message('options_profileNameHidden', 'Profiles with names starting with underscore will be hidden on the popup menu.')}</p>}
        <div className="condition-controls">
          <button className="btn btn-default" type="button" onClick={closeToMenu}>{message('dialog_cancel', 'Cancel')}</button>
          <button className="btn btn-primary" type="submit" disabled={saving || !externalName || externalNameConflict || externalNameHidden}>{message('dialog_save', 'Save')}</button>
        </div>
        </fieldset>
      </form>
    );
  }

  if (mode === 'requestInfo') {
    return (
      <form className="request-info-details om-popup-form" onSubmit={submitRequestInfo}>
        <fieldset>
        {state?.currentProfileCanAddRule
          ? <legend>{message('popup_addConditionTo', 'Add condition to')} <span className="profile-inline"><ProfileInline profile={state?.availableProfiles?.[`+${state?.currentProfileName}`]} /></span></legend>
          : <legend>{message('popup_requestErrorHeading', 'Request failures')}</legend>}
        {error && <p className="om-alert">{error}</p>}
        <div className="text-warning">{message('popup_requestErrorWarning', 'Some requests have failed.')}</div>
        <p className="help-block">{message('popup_requestErrorWarningHelp', 'You can add conditions for failed domains.')}</p>
        {state?.currentProfileCanAddRule
          ? <p className="help-block">{message('popup_requestErrorAddCondition', 'Add conditions for selected domains.')}</p>
          : <p className="help-block">{message('popup_requestErrorCannotAddCondition', 'The current profile cannot accept new conditions.')}</p>}
        <div className="om-domain-list">
          {domains.map((domain, index) => (
            <div className="checkbox" key={domain.domain}>
              <label>
                <input
                  autoFocus={index === 0}
                  type="checkbox"
                  checked={!!checkedDomains[domain.domain]}
                  onChange={(event) => setCheckedDomains((prev) => ({...prev, [domain.domain]: event.currentTarget.checked}))}
                />
                <span className="label label-warning">{domain.errorCount}</span>
                {' '}{domain.domain}
              </label>
            </div>
          ))}
        </div>
        {state?.currentProfileCanAddRule && (
          <div className="form-group">
            <label>{message('options_resultProfileForSelectedDomains', 'Result Profile for Selected Domains')}</label>
            <ProfileSelect profiles={profiles} value={profile} onChange={setProfile} />
          </div>
        )}
        <div className="condition-controls">
          <button className="btn btn-default" type="button" onClick={closeToMenu}>{message('dialog_cancel', 'Cancel')}</button>
          {state?.currentProfileCanAddRule
            ? <button className="btn btn-primary" type="submit" disabled={saving || !profiles.length}>{message('popup_addCondition', 'Add Condition')}</button>
            : <button className="btn btn-default pull-right" type="button" onClick={() => target().openOptions?.('#!/general', closePopup)}>{message('popup_configureMonitorWebRequests', 'Configure monitor web requests')}</button>}
        </div>
        </fieldset>
      </form>
    );
  }

  return (
    <form className="condition-form om-popup-form" onSubmit={submitCondition}>
      <fieldset>
      <legend>
        {message('popup_addConditionTo', 'Add condition to')}{' '}
        <span className="profile-inline"><ProfileInline profile={state?.availableProfiles?.[`+${state?.currentProfileName}`]} /></span>
      </legend>
      {error && <p className="om-alert">{error}</p>}
      <div className="form-group">
        <label>
          {message('options_conditionType', 'Condition Type')}{' '}
          <button className="btn btn-link btn-sm clear-padding" type="button" onClick={openConditionHelp}>
            {message('options_showConditionTypeHelp', 'Show condition type help')}{' '}
            <span className="glyphicon glyphicon-new-window" />
          </button>
        </label>
        <select className="form-control" value={conditionType} onChange={(event) => setConditionType(event.currentTarget.value)}>
          {conditionTypes.map((type) => (
            <option key={type} value={type}>{message(`condition_${type}`, type)}</option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label>{message('options_conditionDetails', 'Condition Details')}</label>
        <input className="form-control condition-details" autoFocus required value={pattern} onChange={(event) => setPattern(event.currentTarget.value)} />
      </div>
      <div className="form-group">
        <label>{message('options_resultProfile', 'Result Profile')}</label>
        <ProfileSelect profiles={profiles} value={profile} onChange={setProfile} />
      </div>
      <div className="condition-controls">
        <button className="btn btn-default" type="button" onClick={closeToMenu}>{message('dialog_cancel', 'Cancel')}</button>
        <button className="btn btn-primary" type="submit" disabled={saving || !pattern || !profiles.length}>{message('popup_addCondition', 'Add Condition')}</button>
      </div>
      </fieldset>
    </form>
  );
}

function ProfileSelect({profiles, value, onChange}: {profiles: Profile[]; value: string; onChange: (value: string) => void}) {
  const [open, setOpen] = useState(false);
  const selected = profiles.find((profile) => profile.name === value);
  const choose = (profileName: string) => {
    onChange(profileName);
    setOpen(false);
  };
  return (
    <div className="omega-profile-select-host">
      <div className={`btn-group omega-profile-select ${open ? 'open' : ''}`}>
        <button
          aria-expanded={open}
          aria-haspopup="true"
          className="btn btn-default dropdown-toggle"
          type="button"
          onBlur={() => window.setTimeout(() => setOpen(false), 120)}
          onClick={() => setOpen(!open)}
        >
          <ProfileInline profile={selected} /><span className="caret" />
        </button>
        {open && (
          <ul className="dropdown-menu" role="listbox">
            {profiles.map((profile) => (
              <li className={profile.name === value ? 'active' : ''} key={profile.name} role="option">
                <a href="#" onMouseDown={(event) => event.preventDefault()} onClick={(event) => {
                  event.preventDefault();
                  choose(profile.name);
                }}>
                  <ProfileInline profile={profile} />
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function ProfileInline({profile}: {profile?: Profile}) {
  const iconClass = profile?.profileType ? iconForProfileType[profile.profileType] || 'glyphicon-question-sign' : 'glyphicon-question-sign';
  return (
    <span>
      <span className={`glyphicon ${iconClass}`} style={{color: profile?.color || undefined}} />
      {profileName(profile)}
    </span>
  );
}

function mount(element: Element) {
  const root = createRoot(element);
  flushSync(() => root.render(<PopupFlow />));
  return {
    unmount: () => root.unmount()
  };
}

window.OmegaReactPopupFlow = {mount};

const rootElement = document.getElementById('react-popup-flow-root');
if (rootElement) {
  mount(rootElement);
}
