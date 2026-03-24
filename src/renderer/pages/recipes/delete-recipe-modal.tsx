import type React from 'react';

import { ConfirmModal } from '../../components/modal';

type DeleteRecipeModalProps = {
  onClose: () => void;
  onConfirm: () => void;
};

export const DeleteRecipeModal = ({
  onClose,
  onConfirm,
}: DeleteRecipeModalProps): React.JSX.Element => (
  <ConfirmModal
    title="Excluir Receita"
    description="Deseja realmente excluir esta receita?"
    confirmLabel="Excluir"
    onClose={onClose}
    onConfirm={onConfirm}
  />
);
