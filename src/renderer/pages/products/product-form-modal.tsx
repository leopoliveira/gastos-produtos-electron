import type React from 'react';
import { useState } from 'react';

import type { ICreateProduct, IReadProduct } from '../../../shared/products';
import {
  getUnitOfMeasureLabel,
  getUnitOfMeasureValues,
  UnitOfMeasure,
} from '../../../shared/unit-of-measure';
import { amountFromCurrencyDigitString, currencyDigitStringFromAmount } from '../../../shared/currency-input';
import { formatCurrency } from '../../../shared/format';
import { CurrencyMaskedInput } from '../../components/currency-masked-input';
import { Modal, ModalActions } from '../../components/modal';
import ui from '../../styles/shared-ui.module.css';

type ProductFormModalProps = {
  product?: IReadProduct;
  onClose: () => void;
  onSubmit: (payload: ICreateProduct) => void;
};

type ProductFormState = {
  name: string;
  quantity: string;
  priceDigits: string;
  unitOfMeasure: string;
};

const toFormState = (product?: IReadProduct): ProductFormState => ({
  name: product?.name ?? '',
  quantity: product ? String(product.quantity) : '',
  priceDigits: product ? currencyDigitStringFromAmount(product.price) : '',
  unitOfMeasure: String(product?.unitOfMeasure ?? UnitOfMeasure.un),
});

export const ProductFormModal = ({
  product,
  onClose,
  onSubmit,
}: ProductFormModalProps): React.JSX.Element => {
  const [formState, setFormState] = useState<ProductFormState>(toFormState(product));

  const quantity = Number(formState.quantity);
  const price = amountFromCurrencyDigitString(formState.priceDigits);
  const unitPrice = quantity > 0 && price > 0 ? price / quantity : 0;

  const handleFieldChange =
    (field: keyof ProductFormState) =>
    (
      event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    ) => {
      setFormState((currentState) => ({
        ...currentState,
        [field]: event.target.value,
      }));
    };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    onSubmit({
      name: formState.name.trim(),
      quantity,
      price,
      unitOfMeasure: Number(formState.unitOfMeasure) as UnitOfMeasure,
    });
  };

  return (
    <Modal
      title={product ? 'Editar Matéria Prima' : 'Adicionar Matéria Prima'}
      description="Preencha os campos obrigatórios para salvar a matéria-prima."
      onClose={onClose}
    >
      <form className={ui.form} onSubmit={handleSubmit}>
        <label className={ui.field}>
          <span>Nome</span>
          <input
            name="name"
            onChange={handleFieldChange('name')}
            type="text"
            value={formState.name}
          />
        </label>

        <div className={ui.formGrid}>
          <label className={ui.field}>
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

          <label className={ui.field}>
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
        </div>

        <div className={ui.formGrid}>
          <label className={ui.field}>
            <span>Preço</span>
            <CurrencyMaskedInput
              digits={formState.priceDigits}
              name="price"
              onDigitsChange={(priceDigits) =>
                setFormState((currentState) => ({ ...currentState, priceDigits }))
              }
            />
          </label>

          <label className={ui.field}>
            <span>Preço Unitário</span>
            <input readOnly type="text" value={formatCurrency(unitPrice)} />
          </label>
        </div>

        <ModalActions confirmButtonType="submit" confirmLabel="Salvar" onCancel={onClose} />
      </form>
    </Modal>
  );
};
