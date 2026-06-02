import React, {useEffect, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Options} from './options_client';
import {message} from './options_client';
import {
  Profile,
  ProfileInline,
  ProfileSelect,
  profileByName
} from './profile_widgets';

type UnsupportedProfileProps = {
  profile?: {
    profileType?: string;
  } | null;
};

type VirtualProfileProps = {
  dispName?: (profile: Profile) => string;
  onReplaceProfile?: (fromName: string, toName: string) => void;
  onTargetChange?: (name: string) => void;
  options?: Options | null;
  profile?: {
    defaultProfileName?: string;
    name?: string;
  } | null;
  targetProfiles?: Profile[];
};

function messageWithNodes(
  key: string,
  fallback: string,
  substitutions: string[],
  nodes: Record<string, React.ReactNode>
) {
  const text = message(key, fallback, substitutions);
  const tokens = Object.keys(nodes);
  if (!tokens.length) {
    return text;
  }
  const pattern = new RegExp(`(${tokens.map((token) => token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'g');
  return text.split(pattern).map((part, index) => nodes[part] ? (
    <React.Fragment key={`${part}-${index}`}>{nodes[part]}</React.Fragment>
  ) : part);
}

function UnsupportedProfile({profile}: UnsupportedProfileProps) {
  const profileType = profile?.profileType || '';
  return (
    <>
      <div className="lead">
        {message('options_profileUnsupported', `Unsupported profile type ${profileType}!`, profileType)}
      </div>
      <p>{message('options_profileUnsupportedHelp', 'The options could be broken, or from a newer version of this program.')}</p>
    </>
  );
}

function VirtualProfile({dispName, onReplaceProfile, onTargetChange, options, profile, targetProfiles}: VirtualProfileProps) {
  const [targetName, setTargetName] = useState(profile?.defaultProfileName || '');
  useEffect(() => {
    setTargetName(profile?.defaultProfileName || '');
  }, [profile?.defaultProfileName]);
  const targetProfile = profileByName(options, targetName);

  function changeTarget(name: string) {
    setTargetName(name);
    onTargetChange?.(name);
  }

  return (
    <div>
      <section className="settings-group">
        <h3>{message('options_group_virtualProfile', 'Virtual Profile')}</h3>
        <p className="help-block">
          {message('options_virtualProfileTargetHelp', 'When this profile is applied, it acts exactly the same as the profile selected below.')}
        </p>
        <div className="form-group">
          <label>{message('options_virtualProfileTarget', 'Target')}</label>{' '}
          <ProfileSelect
            dispName={dispName}
            name={targetName}
            onChange={changeTarget}
            options={options}
            profiles={targetProfiles}
          />
        </div>
      </section>
      <section className="settings-group">
        <h3>{message('options_group_virtualProfileReplace', 'Migrate to Virtual Profile')}</h3>
        <p className="help-block">
          {messageWithNodes(
            'options_virtualProfileReplaceHelp',
            'You can migrate existing options to use this virtual profile instead of __PROFILE__. Doing so will update all existing rules concerning __PROFILE__ and point them to this virtual profile, so that their result profile can be controlled here.',
            ['__PROFILE__'],
            {
              __PROFILE__: <ProfileInline profile={targetProfile} dispName={dispName} />
            }
          )}
        </p>
        <div className="form-group">
          <button type="button" className="btn btn-default" onClick={() => onReplaceProfile?.(targetName, profile?.name || '')}>
            <span className="glyphicon glyphicon-search" /> {message('options_virtualProfileReplace', 'Replace target profile')}
          </button>
        </div>
      </section>
    </div>
  );
}

function mountUnsupportedProfile(element: Element, props: UnsupportedProfileProps = {}) {
  const root = createRoot(element);
  root.render(<UnsupportedProfile {...props} />);
  return {
    render(nextProps: UnsupportedProfileProps = {}) {
      root.render(<UnsupportedProfile {...nextProps} />);
    },
    unmount() {
      root.unmount();
    }
  };
}

function mountVirtualProfile(element: Element, props: VirtualProfileProps = {}) {
  const root = createRoot(element);
  root.render(<VirtualProfile {...props} />);
  return {
    render(nextProps: VirtualProfileProps = {}) {
      root.render(<VirtualProfile {...nextProps} />);
    },
    unmount() {
      root.unmount();
    }
  };
}

const globalWindow = window as any;
globalWindow.OmegaReactProfileContent = {
  mountUnsupportedProfile,
  mountVirtualProfile
};
