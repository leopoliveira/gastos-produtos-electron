import type React from 'react';
import { useState } from 'react';

import type { IReadProduct } from '../../../shared/products';
import type { IRecipeIngredientInput } from '../../../shared/recipes';
import { Modal, ModalActions } from '../../components/modal';
import ui from '../../styles/shared-ui.module.css';

type IngredientFormModalProps = {
  ingredients: IReadProduct[];
  initialValue?: IRecipeIngredientInput;
  onClose: () => void;
  onSubmit: (value: IRecipeIngredientInput, shouldClose: boolean) => void;
};

type IngredientFormErrors = {
  ingredientId?: string;
  quantity?: string;
};

export const IngredientFormModal = ({
  ingredients,
  initialValue,
  onClose,
  onSubmit,
}: IngredientFormModalProps): React.JSX.Element => {
  const [ingredientId, setIngredientId] = useState(initialValue?.ingredientId ?? '');
  const [quantity, setQuantity] = useState(initialValue ? String(initialValue.quantity) : '');
  const [formErrors, setFormErrors] = useState<IngredientFormErrors>({});
  const isEditing = Boolean(initialValue);

  const validateForm = (): IngredientFormErrors => {
    const nextErrors: IngredientFormErrors = {};

    if (!ingredientId) {
      nextErrors.ingredientId = 'Selecione uma matéria-prima.';
    }

    const parsedQuantity = Number(quantity);
    if (ingredientId && (!quantity.trim() || Number.isNaN(parsedQuantity) || parsedQuantity <= 0)) {
      nextErrors.quantity = 'Informe uma quantidade maior que zero.';
    }

    return nextErrors;
  };

  const submitForm = (shouldClose: boolean): boolean => {
    const nextErrors = validateForm();
    if (Object.keys(nextErrors).length > 0) {
      setFormErrors(nextErrors);
      return false;
    }

    setFormErrors({});
    onSubmit(
      {
      ingredientId,
      quantity: Number(quantity),
      },
      shouldClose,
    );
    return true;
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submitForm(true);
  };

  return (
    <Modal
      title={isEditing ? 'Editar Matéria Prima' : 'Buscar Matéria Prima'}
      description="Selecione a matéria-prima e informe a quantidade usada na receita."
      onClose={onClose}
    >
      <form className={ui.form} onSubmit={handleSubmit}>
        <p className={ui.requiredHint}>* Campos obrigatórios</p>

        <label className={ui.field}>
          <span>
            Matéria Prima
            <strong aria-hidden="true" className={ui.requiredMark}>*</strong>
          </span>
          <select
            aria-describedby={formErrors.ingredientId ? 'ingredient-id-error' : undefined}
            aria-invalid={Boolean(formErrors.ingredientId)}
            className={formErrors.ingredientId ? ui.fieldControlInvalid : undefined}
            name="ingredientId"
            onChange={(event) => {
              setIngredientId(event.target.value);
              setFormErrors((current) => {
                if (!current.ingredientId) {
                  return current;
                }
                const next = { ...current };
                delete next.ingredientId;
                return next;
              });
            }}
            value={ingredientId}
          >
            <option value="">Selecione</option>
            {ingredients.map((ingredient) => (
              <option key={ingredient.id} value={ingredient.id}>
                {ingredient.name}
              </option>
            ))}
          </select>
          {formErrors.ingredientId ? (
            <p className={ui.fieldErrorMessage} id="ingredient-id-error">
              {formErrors.ingredientId}
            </p>
          ) : null}
        </label>

        <label className={ui.field}>
          <span>
            Quantidade
            <strong aria-hidden="true" className={ui.requiredMark}>*</strong>
          </span>
          <input
            aria-describedby={formErrors.quantity ? 'ingredient-quantity-error' : undefined}
            aria-invalid={Boolean(formErrors.quantity)}
            className={formErrors.quantity ? ui.fieldControlInvalid : undefined}
            min="0"
            name="quantity"
            onChange={(event) => {
              setQuantity(event.target.value);
              setFormErrors((current) => {
                if (!current.quantity) {
                  return current;
                }
                const next = { ...current };
                delete next.quantity;
                return next;
              });
            }}
            step="0.01"
            type="number"
            value={quantity}
          />
          {formErrors.quantity ? (
            <p className={ui.fieldErrorMessage} id="ingredient-quantity-error">
              {formErrors.quantity}
            </p>
          ) : null}
        </label>

        <ModalActions
          confirmButtonType="submit"
          confirmLabel="Salvar"
          onCancel={onClose}
          onSecondaryConfirm={() => {
            const didSubmit = submitForm(false);
            if (!didSubmit) {
              return;
            }
            setIngredientId('');
            setQuantity('');
          }}
          secondaryConfirmLabel={isEditing ? undefined : 'Salvar e Adicionar'}
        />
      </form>
    </Modal>
  );
};
