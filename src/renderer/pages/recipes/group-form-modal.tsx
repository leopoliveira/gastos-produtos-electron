import type React from 'react';
import { useState } from 'react';

import { Modal } from '../../components/modal';

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
      <form className="product-form" onSubmit={handleSubmit}>
        <label className="product-form__field">
          <span>Nome</span>
          <input
            name="name"
            onChange={(event) => setName(event.target.value)}
            type="text"
            value={name}
          />
        </label>

        <footer className="modal__footer">
          <button className="modal__secondary-button" onClick={onClose} type="button">
            Cancelar
          </button>
          <button className="modal__primary-button" type="submit">
            Salvar
          </button>
        </footer>
      </form>
    </Modal>
  );
};
