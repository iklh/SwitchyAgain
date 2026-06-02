import React, {useEffect, useMemo, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {message} from './options_client';

type RenameProfileProps = {
  fromName?: string;
  isProfileNameHidden?: (name: string) => boolean;
  isProfileNameReserved?: (name: string) => boolean;
  onClose?: (name: string) => void;
  onDismiss?: () => void;
  profileByName?: (name: string) => any;
};

function RenameProfileModal({
  fromName = '',
  isProfileNameHidden,
  isProfileNameReserved,
  onClose,
  onDismiss,
  profileByName
}: RenameProfileProps) {
  const [newName, setNewName] = useState(fromName);
  const trimmedName = newName;

  useEffect(() => {
    setNewName(fromName);
  }, [fromName]);

  const errors = useMemo(() => {
    return {
      conflict: Boolean(trimmedName && trimmedName !== fromName && profileByName?.(trimmedName)),
      required: !trimmedName,
      reserved: Boolean(trimmedName && isProfileNameReserved?.(trimmedName))
    };
  }, [fromName, isProfileNameReserved, profileByName, trimmedName]);

  const valid = !errors.required && !errors.reserved && !errors.conflict;
  const hidden = valid && Boolean(trimmedName && isProfileNameHidden?.(trimmedName));

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (valid) {
      onClose?.(trimmedName);
    }
  }

  return (
    <form onSubmit={submit}>
      <div className="modal-header">
        <button type="button" className="close" onClick={onDismiss}>
          <span aria-hidden="true">{'\u00d7'}</span>
          <span className="sr-only">{message('dialog_close', 'Close')}</span>
        </button>
        <h4 className="modal-title">{message('options_modalHeader_renameProfile', 'Rename Profile')}</h4>
      </div>
      <div className="modal-body">
        <div className={`form-group ${valid ? '' : 'has-error'}`}>
          <label htmlFor="profile-new-name">{message('options_renameProfileName', 'New profile name')}</label>
          <input
            id="profile-new-name"
            className="form-control"
            type="text"
            name="profileNewName"
            required
            value={newName}
            onChange={(event) => setNewName(event.currentTarget.value)}
          />
          {errors.required && (
            <div className="help-block">{message('options_profileNameEmpty', 'The name of the profile must not be empty.')}</div>
          )}
          {errors.reserved && (
            <div className="help-block">{message('options_profileNameReserved', 'Profile names beginning with double-underscore are reserved.')}</div>
          )}
          {!errors.reserved && errors.conflict && (
            <div className="help-block">{message('options_profileNameConflict', 'A profile with this name already exists.')}</div>
          )}
          {hidden && (
            <div className="help-block">
              <div className="text-info">
                <span className="glyphicon glyphicon-info-sign" />{' '}
                {message('options_profileNameHidden', 'Profiles with names starting with underscore will be hidden on the popup menu. However, they can still be used in places like switch profile results.')}
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="modal-footer">
        <button type="button" className="btn btn-default" onClick={onDismiss}>
          {message('dialog_cancel', 'Cancel')}
        </button>
        <button type="submit" className="btn btn-primary" disabled={!valid}>
          {message('options_renameProfile', 'Rename')}
        </button>
      </div>
    </form>
  );
}

function mountRenameProfile(element: Element, props: RenameProfileProps = {}) {
  const root = createRoot(element);
  root.render(<RenameProfileModal {...props} />);
  return {
    render(nextProps: RenameProfileProps = {}) {
      root.render(<RenameProfileModal {...nextProps} />);
    },
    unmount() {
      root.unmount();
    }
  };
}

const globalWindow = window as any;
globalWindow.OmegaReactProfileModals = {
  mountRenameProfile
};
