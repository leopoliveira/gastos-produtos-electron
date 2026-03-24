import type React from 'react';

import { ConfirmModal } from '../../components/modal';

type DeleteProductModalProps = {
  onClose: () => void;
  onConfirm: () => void;
};

export const DeleteProductModal = ({
  onClose,
  onConfirm,
}: DeleteProductModalProps): React.JSX.Element => (
  <ConfirmModal
    title="Excluir Matéria Prima"
    description="Deseja realmente excluir esta matéria prima?"
    confirmLabel="Excluir"
    onClose={onClose}
    onConfirm={onConfirm}
  />
);
