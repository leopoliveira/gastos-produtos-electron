import type React from 'react';
import { useState } from 'react';

import type { ICreateGroup, IReadGroup } from '../../../shared/groups';
import { Modal, ModalActions } from '../../components/modal';
import ui from '../../styles/shared-ui.module.css';

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
      setNameError('Informe o nome do grupo.');
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
      <form className={ui.form} onSubmit={handleSubmit}>
        <p className={ui.requiredHint}>* Campos obrigatórios</p>

        <label className={ui.field}>
          <span>
            Nome
            <strong aria-hidden="true" className={ui.requiredMark}>*</strong>
          </span>
          <input
            aria-describedby={nameError ? 'config-group-name-error' : undefined}
            aria-invalid={Boolean(nameError)}
            className={nameError ? ui.fieldControlInvalid : undefined}
            name="name"
            onChange={handleFieldChange('name')}
            type="text"
            value={formState.name}
          />
          {nameError ? (
            <p className={ui.fieldErrorMessage} id="config-group-name-error">
              {nameError}
            </p>
          ) : null}
        </label>

        <label className={ui.field}>
          <span>Descrição</span>
          <textarea
            className={ui.textareaLarge}
            name="description"
            onChange={handleFieldChange('description')}
            value={formState.description}
          />
        </label>

        <ModalActions confirmButtonType="submit" confirmLabel="Salvar" onCancel={onClose} />
      </form>
    </Modal>
  );
};
