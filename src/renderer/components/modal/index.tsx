import type React from 'react';
import { useId } from 'react';
import styles from './modal.module.css';

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
  confirmTooltip?: string;
  secondaryConfirmLabel?: string;
  onSecondaryConfirm?: () => void;
  isSecondaryConfirmDisabled?: boolean;
  secondaryConfirmTooltip?: string;
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
      className={styles.backdrop}
      onClick={onClose}
      role="presentation"
    >
      <div
        aria-describedby={description ? descriptionId : undefined}
        aria-labelledby={titleId}
        aria-modal="true"
        className={styles.modal}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <header className={styles.header}>
          <div>
            <h3 className={styles.title} id={titleId}>
              {title}
            </h3>
            {description ? (
              <p className={styles.description} id={descriptionId}>
                {description}
              </p>
            ) : null}
          </div>

          <button
            aria-label="Fechar modal"
            className={styles.closeButton}
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
  confirmTooltip,
  secondaryConfirmLabel,
  onSecondaryConfirm,
  isSecondaryConfirmDisabled = false,
  secondaryConfirmTooltip,
}: ModalActionsProps): React.JSX.Element => (
  <footer className={styles.footer}>
    <button className={`${styles.button} ${styles.buttonSecondary}`} onClick={onCancel} type="button">
      {cancelLabel}
    </button>
    {secondaryConfirmLabel ? (
      <button
        className={`${styles.button} ${styles.buttonPrimary}`}
        disabled={isSecondaryConfirmDisabled}
        onClick={onSecondaryConfirm}
        title={secondaryConfirmTooltip}
        type="button"
      >
        {secondaryConfirmLabel}
      </button>
    ) : null}
    <button
      className={`${styles.button} ${confirmVariant === 'danger' ? styles.buttonDanger : styles.buttonPrimary}`}
      disabled={isConfirmDisabled}
      onClick={confirmButtonType === 'button' ? onConfirm : undefined}
      title={confirmTooltip}
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
    <div className={styles.body}>
      <p className={styles.description}>{description}</p>
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
