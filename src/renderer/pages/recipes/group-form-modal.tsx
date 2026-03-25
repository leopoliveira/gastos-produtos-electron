import type React from 'react';
import { useState } from 'react';

import type { ICreateGroup } from '../../../shared/groups';
import { Modal, ModalActions } from '../../components/modal';
import ui from '../../styles/shared-ui.module.css';

type GroupFormModalProps = {
  onClose: () => void;
  onSubmit: (payload: ICreateGroup) => void;
};

export const GroupFormModal = ({
  onClose,
  onSubmit,
}: GroupFormModalProps): React.JSX.Element => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim()) {
      setNameError('Informe o nome do grupo.');
      return;
    }

    onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
    });
  };

  return (
    <Modal
      title="Novo Grupo"
      description="Crie um grupo sem sair do formulario da receita."
      onClose={onClose}
    >
      <form className={ui.form} onSubmit={handleSubmit}>
        <p className={ui.requiredHint}>* Campos obrigatórios</p>

        <label className={ui.field}>
          <span>
            Nome
            <strong aria-hidden="true" className={ui.requiredMark}>*</strong>
          </span>
          <input
            aria-describedby={nameError ? 'recipe-group-name-error' : undefined}
            aria-invalid={Boolean(nameError)}
            className={nameError ? ui.fieldControlInvalid : undefined}
            name="name"
            onChange={(event) => {
              setName(event.target.value);
              if (event.target.value.trim()) {
                setNameError(null);
              }
            }}
            type="text"
            value={name}
          />
          {nameError ? (
            <p className={ui.fieldErrorMessage} id="recipe-group-name-error">
              {nameError}
            </p>
          ) : null}
        </label>

        <label className={ui.field}>
          <span>Descrição</span>
          <textarea
            className={ui.textareaLarge}
            name="description"
            onChange={(event) => setDescription(event.target.value)}
            value={description}
          />
        </label>

        <ModalActions confirmButtonType="submit" confirmLabel="Salvar" onCancel={onClose} />
      </form>
    </Modal>
  );
};
