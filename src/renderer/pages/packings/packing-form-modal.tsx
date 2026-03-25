import type React from 'react';
import { useState } from 'react';

import type { ICreatePacking, IReadPacking } from '../../../shared/packings';
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

type PackingFormModalProps = {
  packing?: IReadPacking;
  onClose: () => void;
  onSubmit: (payload: ICreatePacking) => void;
};

type PackingFormState = {
  name: string;
  description: string;
  quantity: string;
  priceDigits: string;
  unitOfMeasure: string;
};

const toFormState = (packing?: IReadPacking): PackingFormState => ({
  name: packing?.name ?? '',
  description: packing?.description ?? '',
  quantity: packing ? String(packing.quantity) : '',
  priceDigits: packing ? currencyDigitStringFromAmount(packing.price) : '',
  unitOfMeasure: String(packing?.unitOfMeasure ?? UnitOfMeasure.un),
});

export const PackingFormModal = ({
  packing,
  onClose,
  onSubmit,
}: PackingFormModalProps): React.JSX.Element => {
  const [formState, setFormState] = useState<PackingFormState>(toFormState(packing));

  const quantity = Number(formState.quantity);
  const price = amountFromCurrencyDigitString(formState.priceDigits);
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

        <label className={ui.field}>
          <span>Descrição</span>
          <input
            name="description"
            onChange={handleFieldChange('description')}
            type="text"
            value={formState.description}
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
            <input readOnly type="text" value={formatCurrency(packingUnitPrice)} />
          </label>
        </div>

        <ModalActions confirmButtonType="submit" confirmLabel="Salvar" onCancel={onClose} />
      </form>
    </Modal>
  );
};
