import type React from 'react';
import { useState } from 'react';

import { Modal, ModalActions } from '../../components/modal';
import ui from '../../styles/shared-ui.module.css';

type GroupFormModalProps = {
  onClose: () => void;
  onSubmit: (name: string) => void;
};

export const GroupFormModal = ({
  onClose,
  onSubmit,
}: GroupFormModalProps): React.JSX.Element => {
  const [name, setName] = useState('');

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit(name.trim());
  };

  return (
    <Modal
      title="Novo Grupo"
      description="Crie um grupo sem sair do formulario da receita."
      onClose={onClose}
    >
      <form className={ui.form} onSubmit={handleSubmit}>
        <label className={ui.field}>
          <span>Nome</span>
          <input
            name="name"
            onChange={(event) => setName(event.target.value)}
            type="text"
            value={name}
          />
        </label>

        <ModalActions confirmButtonType="submit" confirmLabel="Salvar" onCancel={onClose} />
      </form>
    </Modal>
  );
};
