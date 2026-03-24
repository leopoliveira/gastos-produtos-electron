import type React from 'react';
import { useState } from 'react';

import type { ICreateGroup, IReadGroup } from '../../../shared/groups';
import { Modal } from '../../components/modal';

type GroupFormModalProps = {
  group?: IReadGroup;
  onClose: () => void;
  onSubmit: (payload: ICreateGroup) => void;
};

type GroupFormState = {
  name: string;
  description: string;
};

const toFormState = (group?: IReadGroup): GroupFormState => ({
  name: group?.name ?? '',
  description: group?.description ?? '',
});

export const GroupFormModal = ({
  group,
  onClose,
  onSubmit,
}: GroupFormModalProps): React.JSX.Element => {
  const [formState, setFormState] = useState<GroupFormState>(toFormState(group));
  const [nameError, setNameError] = useState<string | null>(null);

  const handleFieldChange =
    (field: keyof GroupFormState) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const nextValue = event.target.value;

      setFormState((currentState) => ({
        ...currentState,
        [field]: nextValue,
      }));

      if (field === 'name' && nextValue.trim()) {
        setNameError(null);
      }
    };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!formState.name.trim()) {
      setNameError('Nome é obrigatório');
      return;
    }

    onSubmit({
      name: formState.name.trim(),
      description: formState.description.trim() || undefined,
    });
  };

  return (
    <Modal
      title={group ? 'Editar Grupo' : 'Adicionar Grupo'}
      description="Preencha os campos do grupo que será usado nas receitas."
      onClose={onClose}
    >
      <form className="product-form" onSubmit={handleSubmit}>
        <label className="product-form__field">
          <span>Nome</span>
          <input
            aria-invalid={nameError ? 'true' : 'false'}
            name="name"
            onChange={handleFieldChange('name')}
            type="text"
            value={formState.name}
          />
          {nameError ? <small className="form-field__error">{nameError}</small> : null}
        </label>

        <label className="product-form__field">
          <span>Descrição</span>
          <textarea
            className="group-form__textarea"
            name="description"
            onChange={handleFieldChange('description')}
            value={formState.description}
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
