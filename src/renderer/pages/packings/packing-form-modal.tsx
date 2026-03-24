import type React from 'react';
import { useState } from 'react';

import type { ICreatePacking, IReadPacking } from '../../../shared/packings';
import {
  getUnitOfMeasureLabel,
  getUnitOfMeasureValues,
  UnitOfMeasure,
} from '../../../shared/unit-of-measure';
import { Modal } from '../../components/modal';
import { formatCurrency } from '../../utils/format';

type PackingFormModalProps = {
  packing?: IReadPacking;
  onClose: () => void;
  onSubmit: (payload: ICreatePacking) => void;
};

type PackingFormState = {
  name: string;
  description: string;
  quantity: string;
  price: string;
  unitOfMeasure: string;
};

const toFormState = (packing?: IReadPacking): PackingFormState => ({
  name: packing?.name ?? '',
  description: packing?.description ?? '',
  quantity: packing ? String(packing.quantity) : '',
  price: packing ? String(packing.price) : '',
  unitOfMeasure: String(packing?.unitOfMeasure ?? UnitOfMeasure.un),
});

export const PackingFormModal = ({
  packing,
  onClose,
  onSubmit,
}: PackingFormModalProps): React.JSX.Element => {
  const [formState, setFormState] = useState<PackingFormState>(toFormState(packing));

  const quantity = Number(formState.quantity);
  const price = Number(formState.price);
  const packingUnitPrice = quantity > 0 && price > 0 ? price / quantity : 0;

  const handleFieldChange =
    (field: keyof PackingFormState) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setFormState((currentState) => ({
        ...currentState,
        [field]: event.target.value,
      }));
    };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    onSubmit({
      name: formState.name.trim(),
      description: formState.description.trim() || undefined,
      quantity,
      price,
      unitOfMeasure: Number(formState.unitOfMeasure) as UnitOfMeasure,
    });
  };

  return (
    <Modal
      title={packing ? 'Editar Embalagem' : 'Adicionar Embalagem'}
      description="Preencha os campos obrigatórios para salvar a embalagem."
      onClose={onClose}
    >
      <form className="product-form" onSubmit={handleSubmit}>
        <label className="product-form__field">
          <span>Nome</span>
          <input
            name="name"
            onChange={handleFieldChange('name')}
            type="text"
            value={formState.name}
          />
        </label>

        <label className="product-form__field">
          <span>Descrição</span>
          <input
            name="description"
            onChange={handleFieldChange('description')}
            type="text"
            value={formState.description}
          />
        </label>

        <div className="product-form__grid">
          <label className="product-form__field">
            <span>Quantidade</span>
            <input
              min="0"
              name="quantity"
              onChange={handleFieldChange('quantity')}
              step="0.01"
              type="number"
              value={formState.quantity}
            />
          </label>

          <label className="product-form__field">
            <span>Preço</span>
            <input
              min="0"
              name="price"
              onChange={handleFieldChange('price')}
              step="0.01"
              type="number"
              value={formState.price}
            />
          </label>
        </div>

        <div className="product-form__grid">
          <label className="product-form__field">
            <span>Unidade de Medida</span>
            <select
              name="unitOfMeasure"
              onChange={handleFieldChange('unitOfMeasure')}
              value={formState.unitOfMeasure}
            >
              {getUnitOfMeasureValues().map((unit) => (
                <option key={unit} value={unit}>
                  {getUnitOfMeasureLabel(unit)}
                </option>
              ))}
            </select>
          </label>

          <label className="product-form__field">
            <span>Preço Unitário</span>
            <input readOnly type="text" value={formatCurrency(packingUnitPrice)} />
          </label>
        </div>

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
