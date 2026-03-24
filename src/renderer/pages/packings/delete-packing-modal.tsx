import type React from 'react';

import { Modal } from '../../components/modal';

type DeletePackingModalProps = {
  onClose: () => void;
  onConfirm: () => void;
};

export const DeletePackingModal = ({
  onClose,
  onConfirm,
}: DeletePackingModalProps): React.JSX.Element => (
  <Modal title="Excluir Embalagem" onClose={onClose}>
    <div className="modal__body">
      <p className="modal__description">Deseja realmente excluir este embalagem?</p>
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
