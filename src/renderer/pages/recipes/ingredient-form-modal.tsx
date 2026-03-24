import type React from 'react';
import { useState } from 'react';
import { toast } from 'sonner';

import type { IReadProduct } from '../../../shared/products';
import type { IRecipeIngredientInput } from '../../../shared/recipes';
import { Modal } from '../../components/modal';

type IngredientFormModalProps = {
  ingredients: IReadProduct[];
  initialValue?: IRecipeIngredientInput;
  onClose: () => void;
  onSubmit: (value: IRecipeIngredientInput) => void;
};

export const IngredientFormModal = ({
  ingredients,
  initialValue,
  onClose,
  onSubmit,
}: IngredientFormModalProps): React.JSX.Element => {
  const [ingredientId, setIngredientId] = useState(initialValue?.ingredientId ?? '');
  const [quantity, setQuantity] = useState(initialValue ? String(initialValue.quantity) : '');

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const parsedQuantity = Number(quantity);
    if (!ingredientId || parsedQuantity <= 0) {
      toast.error('Selecione uma matéria-prima e informe uma quantidade válida.');
      return;
    }

    onSubmit({
      ingredientId,
      quantity: parsedQuantity,
    });
  };

  return (
    <Modal
      title={initialValue ? 'Editar Matéria Prima' : 'Buscar Matéria Prima'}
      description="Selecione a matéria-prima e informe a quantidade usada na receita."
      onClose={onClose}
    >
      <form className="product-form" onSubmit={handleSubmit}>
        <label className="product-form__field">
          <span>Matéria Prima</span>
          <select
            name="ingredientId"
            onChange={(event) => setIngredientId(event.target.value)}
            value={ingredientId}
          >
            <option value="">Selecione</option>
            {ingredients.map((ingredient) => (
              <option key={ingredient.id} value={ingredient.id}>
                {ingredient.name}
              </option>
            ))}
          </select>
        </label>

        <label className="product-form__field">
          <span>Quantidade</span>
          <input
            min="0"
            name="quantity"
            onChange={(event) => setQuantity(event.target.value)}
            step="0.01"
            type="number"
            value={quantity}
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
