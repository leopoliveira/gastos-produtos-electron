import type React from 'react';

import { ConfirmModal } from '../../components/modal';

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
  <ConfirmModal
    title="Confirmar Exclusão"
    description={descriptionText}
    confirmLabel="Excluir"
    onClose={onClose}
    onConfirm={onConfirm}
  />
);
