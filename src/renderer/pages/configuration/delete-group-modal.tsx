import type React from 'react';

import { Modal } from '../../components/modal';

type DeleteGroupModalProps = {
  descriptionText: string;
  onClose: () => void;
  onConfirm: () => void;
};

export const DeleteGroupModal = ({
  descriptionText,
  onClose,
  onConfirm,
}: DeleteGroupModalProps): React.JSX.Element => (
  <Modal title="Confirmar Exclusão" onClose={onClose}>
    <div className="modal__body">
      <p className="modal__description">{descriptionText}</p>
    </div>

    <footer className="modal__footer">
      <button className="modal__secondary-button" onClick={onClose} type="button">
        Cancelar
      </button>
      <button className="modal__danger-button" onClick={onConfirm} type="button">
        Excluir
      </button>
    </footer>
  </Modal>
);
