import type React from 'react';
import { useMemo, useState } from 'react';

import type { IReadProduct } from '../../../shared/products';
import type { IRecipeIngredientInput } from '../../../shared/recipes';
import { normalizeString } from '../../../shared/string';
import {
  getCompatibleUnitOfMeasureValues,
  getUnitOfMeasureLabel,
  UnitOfMeasure,
} from '../../../shared/unit-of-measure';
import { Modal, ModalActions } from '../../components/modal';
import ui from '../../styles/shared-ui.module.css';
import pickerStyles from './searchable-name-picker.module.css';

type IngredientFormModalProps = {
  ingredients: IReadProduct[];
  initialValue?: IRecipeIngredientInput;
  onClose: () => void;
  onSubmit: (value: IRecipeIngredientInput, shouldClose: boolean) => void;
};

type IngredientFormErrors = {
  ingredientId?: string;
  quantity?: string;
  unitOfMeasure?: string;
};

export const IngredientFormModal = ({
  ingredients,
  initialValue,
  onClose,
  onSubmit,
}: IngredientFormModalProps): React.JSX.Element => {
  const [ingredientId, setIngredientId] = useState(initialValue?.ingredientId ?? '');
  const [quantity, setQuantity] = useState(initialValue ? String(initialValue.quantity) : '');
  const [unitOfMeasure, setUnitOfMeasure] = useState<UnitOfMeasure | ''>(
    initialValue?.unitOfMeasure ?? '',
  );
  const [formErrors, setFormErrors] = useState<IngredientFormErrors>({});
  const [nameQuery, setNameQuery] = useState('');
  const isEditing = Boolean(initialValue);
  const selectedIngredient = ingredients.find((item) => item.id === ingredientId);

  const filteredIngredients = useMemo(() => {
    const needle = normalizeString(nameQuery);
    if (!needle) {
      return ingredients;
    }
    return ingredients.filter(
      (ingredient) =>
        (ingredientId !== '' && ingredient.id === ingredientId) ||
        normalizeString(ingredient.name).includes(needle),
    );
  }, [ingredients, ingredientId, nameQuery]);
  const availableUnits = selectedIngredient
    ? getCompatibleUnitOfMeasureValues(selectedIngredient.unitOfMeasure)
    : [];

  const validateForm = (): IngredientFormErrors => {
    const nextErrors: IngredientFormErrors = {};

    if (!ingredientId) {
      nextErrors.ingredientId = 'Selecione uma matéria-prima.';
    }

    const parsedQuantity = Number(quantity);
    if (ingredientId && (!quantity.trim() || Number.isNaN(parsedQuantity) || parsedQuantity <= 0)) {
      nextErrors.quantity = 'Informe uma quantidade maior que zero.';
    }

    if (ingredientId && unitOfMeasure === '') {
      nextErrors.unitOfMeasure = 'Selecione uma unidade de medida.';
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
        unitOfMeasure: unitOfMeasure as UnitOfMeasure,
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
      description="Digite para filtrar a lista, escolha a matéria-prima e informe a quantidade."
      onClose={onClose}
    >
      <form className={ui.form} onSubmit={handleSubmit}>
        <p className={ui.requiredHint}>* Campos obrigatórios</p>

        <div className={`${ui.field} ${pickerStyles.pickerBlock}`}>
          <label className={ui.field} htmlFor="ingredient-name-picker-search">
            <span>
              Matéria Prima
              <strong aria-hidden="true" className={ui.requiredMark}>*</strong>
            </span>
            <input
              id="ingredient-name-picker-search"
              aria-controls="ingredient-options-listbox"
              aria-describedby={formErrors.ingredientId ? 'ingredient-id-error' : undefined}
              aria-invalid={Boolean(formErrors.ingredientId)}
              autoComplete="off"
              className={formErrors.ingredientId ? ui.fieldControlInvalid : undefined}
              name="ingredientNameFilter"
              onChange={(event) => setNameQuery(event.target.value)}
              placeholder="Digite para filtrar e escolher na lista"
              type="search"
              value={nameQuery}
            />
          </label>
          {ingredients.length === 0 ? (
            <p className={pickerStyles.emptyState} role="status">
              Nenhuma matéria-prima cadastrada.
            </p>
          ) : (
            <div
              className={pickerStyles.optionList}
              id="ingredient-options-listbox"
              role="listbox"
              aria-label="Matérias-primas disponíveis"
            >
              {filteredIngredients.length === 0 ? (
                <p className={pickerStyles.emptyState} role="status">
                  Nenhuma matéria-prima encontrada com esse nome.
                </p>
              ) : (
                filteredIngredients.map((ingredient) => (
                  <button
                    key={ingredient.id}
                    type="button"
                    className={`${pickerStyles.optionButton} ${
                      ingredient.id === ingredientId ? pickerStyles.optionSelected : ''
                    }`}
                    role="option"
                    aria-selected={ingredient.id === ingredientId}
                    onClick={() => {
                      setIngredientId(ingredient.id);
                      setNameQuery('');
                      setUnitOfMeasure(ingredient.unitOfMeasure);
                      setFormErrors((current) => {
                        if (!current.ingredientId && !current.unitOfMeasure) {
                          return current;
                        }
                        const next = { ...current };
                        delete next.ingredientId;
                        delete next.unitOfMeasure;
                        return next;
                      });
                    }}
                  >
                    {ingredient.name}
                  </button>
                ))
              )}
            </div>
          )}
          {formErrors.ingredientId ? (
            <p className={ui.fieldErrorMessage} id="ingredient-id-error">
              {formErrors.ingredientId}
            </p>
          ) : null}
        </div>

        <label className={ui.field}>
          <span>
            Unidade de Medida
            <strong aria-hidden="true" className={ui.requiredMark}>*</strong>
          </span>
          <select
            aria-describedby={formErrors.unitOfMeasure ? 'ingredient-unit-error' : undefined}
            aria-invalid={Boolean(formErrors.unitOfMeasure)}
            className={formErrors.unitOfMeasure ? ui.fieldControlInvalid : undefined}
            disabled={!ingredientId}
            name="unitOfMeasure"
            onChange={(event) => {
              setUnitOfMeasure(
                event.target.value === '' ? '' : (Number(event.target.value) as UnitOfMeasure),
              );
              setFormErrors((current) => {
                if (!current.unitOfMeasure) {
                  return current;
                }
                const next = { ...current };
                delete next.unitOfMeasure;
                return next;
              });
            }}
            value={unitOfMeasure}
          >
            <option value="">Selecione</option>
            {availableUnits.map((unit) => (
              <option key={unit} value={unit}>
                {getUnitOfMeasureLabel(unit)}
              </option>
            ))}
          </select>
          {formErrors.unitOfMeasure ? (
            <p className={ui.fieldErrorMessage} id="ingredient-unit-error">
              {formErrors.unitOfMeasure}
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
          confirmTooltip="Adiciona o item e fecha a modal"
          onCancel={onClose}
          onSecondaryConfirm={() => {
            const didSubmit = submitForm(false);
            if (!didSubmit) {
              return;
            }
            setIngredientId('');
            setQuantity('');
            setUnitOfMeasure('');
            setNameQuery('');
          }}
          secondaryConfirmLabel={isEditing ? undefined : 'Salvar e Adicionar'}
          secondaryConfirmTooltip={
            isEditing
              ? undefined
              : 'Adiciona o item e abre a modal novamente para nova seleção'
          }
        />
      </form>
    </Modal>
  );
};
