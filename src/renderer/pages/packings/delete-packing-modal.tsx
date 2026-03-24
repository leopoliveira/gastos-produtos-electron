import type React from 'react';

import { ConfirmModal } from '../../components/modal';

type DeletePackingModalProps = {
  onClose: () => void;
  onConfirm: () => void;
};

export const DeletePackingModal = ({
  onClose,
  onConfirm,
}: DeletePackingModalProps): React.JSX.Element => (
  <ConfirmModal
    title="Excluir Embalagem"
    description="Deseja realmente excluir esta embalagem?"
    confirmLabel="Excluir"
    onClose={onClose}
    onConfirm={onConfirm}
  />
);
