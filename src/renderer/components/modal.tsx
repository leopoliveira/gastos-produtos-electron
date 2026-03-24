import type React from 'react';
import { useId } from 'react';

type ModalProps = {
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
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
