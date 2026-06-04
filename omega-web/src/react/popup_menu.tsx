import React from 'react';
import {createRoot} from 'react-dom/client';

type Profile = {
  color?: string;
  defaultProfileName?: string;
  name?: string;
  profileType?: string;
};

type ProfileMap = Record<string, Profile | undefined>;

type PopupProfileLabelProps = {
  dispName?: (profile: Profile) => string;
  icon?: string;
  options?: ProfileMap | null;
  profile?: Profile | null;
};

const PROFILE_ICONS: Record<string, string> = {
  AutoDetectProfile: 'glyphicon-file',
  DirectProfile: 'glyphicon-transfer',
  FixedProfile: 'glyphicon-globe',
  PacProfile: 'glyphicon-file',
  RuleListProfile: 'glyphicon-list',
  SwitchProfile: 'glyphicon-retweet',
  SystemProfile: 'glyphicon-off',
  VirtualProfile: 'glyphicon-question-sign'
};

function getVirtualTarget(profile?: Profile | null, options?: ProfileMap | null) {
  if (profile?.profileType !== 'VirtualProfile') {
    return null;
  }
  return options?.['+' + profile.defaultProfileName] || null;
}

function getIconProfile(profile?: Profile | null, options?: ProfileMap | null) {
  return getVirtualTarget(profile, options) || profile || null;
}

function getProfileColor(profile?: Profile | null, options?: ProfileMap | null) {
  let current = profile || null;
  let color = current?.color;
  while (current) {
    color = current.color || color;
    current = getVirtualTarget(current, options);
  }
  return color;
}

function profileName(profile?: Profile | null, dispName?: (profile: Profile) => string) {
  if (!profile) {
    return '';
  }
  return dispName ? dispName(profile) : profile.name || '';
}

function PopupProfileLabel({dispName, icon, options, profile}: PopupProfileLabelProps) {
  const iconProfile = getIconProfile(profile, options);
  const iconClass = icon || PROFILE_ICONS[iconProfile?.profileType || ''] || 'glyphicon-question-sign';
  const isVirtual = !!getVirtualTarget(profile, options);

  return (
    <>
      <span
        className={`glyphicon ${iconClass}${isVirtual ? ' virtual-profile-icon' : ''}`}
        style={{color: getProfileColor(profile, options)}}
      />{' '}
      {profileName(profile, dispName)}
    </>
  );
}

function mountPopupProfileLabel(element: Element, props: PopupProfileLabelProps = {}) {
  const root = createRoot(element);
  root.render(<PopupProfileLabel {...props} />);
  return {
    render(nextProps: PopupProfileLabelProps = {}) {
      root.render(<PopupProfileLabel {...nextProps} />);
    },
    unmount() {
      root.unmount();
    }
  };
}

const globalWindow = window as any;
globalWindow.OmegaReactPopupMenu = {
  mountPopupProfileLabel
};
