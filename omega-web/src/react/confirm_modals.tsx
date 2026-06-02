import React from 'react';
import {createRoot} from 'react-dom/client';
import {message} from './options_client';

type ConfirmKind = 'apply' | 'reset';

type ConfirmModalProps = {
  kind: ConfirmKind;
  onClose?: () => void;
  onDismiss?: () => void;
};

function ConfirmModal({kind, onClose, onDismiss}: ConfirmModalProps) {
  const isReset = kind === 'reset';
  return (
    <>
      <div className="modal-header">
        <button type="button" className="close" onClick={onDismiss}>
          <span aria-hidden="true">{'\u00d7'}</span>
          <span className="sr-only">{message('dialog_close', 'Close')}</span>
        </button>
        <h4 className="modal-title">
          {isReset
            ? message('options_modalHeader_resetOptions', 'Reset Options')
            : message('options_modalHeader_applyOptions', 'Apply Options')}
        </h4>
      </div>
      <div className="modal-body">
        {isReset ? (
          <p className="text-danger">{message('options_resetOptionsConfirm', 'Do you really want to reset the options? All profiles and settings will be LOST!')}</p>
        ) : (
          <>
            <p>{message('options_applyOptionsRequired', 'Your changes to the options must be applied before you proceed.')}</p>
            <p>{message('options_applyOptionsConfirm', 'Do you want to save and apply the options?')}</p>
          </>
        )}
      </div>
      <div className="modal-footer">
        <button type="button" className="btn btn-default" onClick={onDismiss}>
          {message('dialog_cancel', 'Cancel')}
        </button>
        <button type="button" className={`btn ${isReset ? 'btn-danger' : 'btn-primary'}`} onClick={onClose}>
          {isReset ? message('options_reset', 'Reset') : message('options_apply', 'Apply changes')}
        </button>
      </div>
    </>
  );
}

function mount(element: Element, props: ConfirmModalProps) {
  const root = createRoot(element);
  root.render(<ConfirmModal {...props} />);
  return {
    render(nextProps: ConfirmModalProps) {
      root.render(<ConfirmModal {...nextProps} />);
    },
    unmount() {
      root.unmount();
    }
  };
}

const globalWindow = window as any;
globalWindow.OmegaReactConfirmModal = {
  mount
};
