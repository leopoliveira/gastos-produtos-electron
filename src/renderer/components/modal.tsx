import type React from 'react';
import { useId } from 'react';

type ModalProps = {
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
};

type ModalActionsProps = {
  confirmLabel: string;
  onCancel: () => void;
  cancelLabel?: string;
  confirmButtonType?: 'button' | 'submit';
  confirmVariant?: 'primary' | 'danger';
  isConfirmDisabled?: boolean;
  onConfirm?: () => void;
};

type ConfirmModalProps = {
  title: string;
  description: string;
  onClose: () => void;
  onConfirm: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
};

export const Modal = ({ title, description, onClose, children }: ModalProps): React.JSX.Element => {
  const titleId = useId();
  const descriptionId = useId();

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      role="presentation"
    >
      <div
        aria-describedby={description ? descriptionId : undefined}
        aria-labelledby={titleId}
        aria-modal="true"
        className="modal"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <header className="modal__header">
          <div>
            <h3 className="modal__title" id={titleId}>
              {title}
            </h3>
            {description ? (
              <p className="modal__description" id={descriptionId}>
                {description}
              </p>
            ) : null}
          </div>

          <button
            aria-label="Fechar modal"
            className="modal__close-button"
            onClick={onClose}
            type="button"
          >
            X
          </button>
        </header>

        {children}
      </div>
    </div>
  );
};

export const ModalActions = ({
  confirmLabel,
  onCancel,
  cancelLabel = 'Cancelar',
  confirmButtonType = 'button',
  confirmVariant = 'primary',
  isConfirmDisabled = false,
  onConfirm,
}: ModalActionsProps): React.JSX.Element => (
  <footer className="modal__footer">
    <button className="modal__secondary-button" onClick={onCancel} type="button">
      {cancelLabel}
    </button>
    <button
      className={confirmVariant === 'danger' ? 'modal__danger-button' : 'modal__primary-button'}
      disabled={isConfirmDisabled}
      onClick={confirmButtonType === 'button' ? onConfirm : undefined}
      type={confirmButtonType}
    >
      {confirmLabel}
    </button>
  </footer>
);

export const ConfirmModal = ({
  title,
  description,
  onClose,
  onConfirm,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
}: ConfirmModalProps): React.JSX.Element => (
  <Modal title={title} onClose={onClose}>
    <div className="modal__body">
      <p className="modal__description">{description}</p>
    </div>

    <ModalActions
      cancelLabel={cancelLabel}
      confirmLabel={confirmLabel}
      confirmVariant="danger"
      onCancel={onClose}
      onConfirm={onConfirm}
    />
  </Modal>
);
