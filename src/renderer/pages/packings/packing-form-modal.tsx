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

type PackingFormErrors = Partial<Record<keyof PackingFormState, string>>;

const toFormState = (packing?: IReadPacking): PackingFormState => ({
  name: packing?.name ?? '',
  description: packing?.description ?? '',
  quantity: packing ? String(packing.quantity) : '',
  priceDigits: packing ? currencyDigitStringFromAmount(packing.price) : '',
  unitOfMeasure: String(packing?.unitOfMeasure ?? UnitOfMeasure.mg),
});

export const PackingFormModal = ({
  packing,
  onClose,
  onSubmit,
}: PackingFormModalProps): React.JSX.Element => {
  const [formState, setFormState] = useState<PackingFormState>(toFormState(packing));
  const [formErrors, setFormErrors] = useState<PackingFormErrors>({});

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
      setFormErrors((currentErrors) => {
        if (!currentErrors[field]) {
          return currentErrors;
        }
        const nextErrors = { ...currentErrors };
        delete nextErrors[field];
        return nextErrors;
      });
    };

  const validateForm = (): PackingFormErrors => {
    const nextErrors: PackingFormErrors = {};

    if (!formState.name.trim()) {
      nextErrors.name = 'Informe o nome da embalagem.';
    }

    if (!(quantity > 0)) {
      nextErrors.quantity = 'Informe uma quantidade maior que zero.';
    }

    if (!(price > 0)) {
      nextErrors.priceDigits = 'Informe um preço maior que zero.';
    }

    if (!getUnitOfMeasureValues().includes(Number(formState.unitOfMeasure) as UnitOfMeasure)) {
      nextErrors.unitOfMeasure = 'Selecione uma unidade de medida válida.';
    }

    return nextErrors;
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validateForm();
    if (Object.keys(nextErrors).length > 0) {
      setFormErrors(nextErrors);
      return;
    }
    setFormErrors({});

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
        <p className={ui.requiredHint}>* Campos obrigatórios</p>

        <label className={ui.field}>
          <span>
            Nome
            <strong aria-hidden="true" className={ui.requiredMark}>*</strong>
          </span>
          <input
            aria-describedby={formErrors.name ? 'packing-name-error' : undefined}
            aria-invalid={Boolean(formErrors.name)}
            className={formErrors.name ? ui.fieldControlInvalid : undefined}
            name="name"
            onChange={handleFieldChange('name')}
            type="text"
            value={formState.name}
          />
          {formErrors.name ? (
            <p className={ui.fieldErrorMessage} id="packing-name-error">
              {formErrors.name}
            </p>
          ) : null}
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
            <span>
              Quantidade
              <strong aria-hidden="true" className={ui.requiredMark}>*</strong>
            </span>
            <input
              aria-describedby={formErrors.quantity ? 'packing-quantity-error' : undefined}
              aria-invalid={Boolean(formErrors.quantity)}
              className={formErrors.quantity ? ui.fieldControlInvalid : undefined}
              min="0"
              name="quantity"
              onChange={handleFieldChange('quantity')}
              step="0.01"
              type="number"
              value={formState.quantity}
            />
            {formErrors.quantity ? (
              <p className={ui.fieldErrorMessage} id="packing-quantity-error">
                {formErrors.quantity}
              </p>
            ) : null}
          </label>

          <label className={ui.field}>
            <span>
              Unidade de Medida
              <strong aria-hidden="true" className={ui.requiredMark}>*</strong>
            </span>
            <select
              aria-describedby={formErrors.unitOfMeasure ? 'packing-unit-error' : undefined}
              aria-invalid={Boolean(formErrors.unitOfMeasure)}
              className={formErrors.unitOfMeasure ? ui.fieldControlInvalid : undefined}
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
            {formErrors.unitOfMeasure ? (
              <p className={ui.fieldErrorMessage} id="packing-unit-error">
                {formErrors.unitOfMeasure}
              </p>
            ) : null}
          </label>
        </div>

        <div className={ui.formGrid}>
          <label className={ui.field}>
            <span>
              Preço
              <strong aria-hidden="true" className={ui.requiredMark}>*</strong>
            </span>
            <CurrencyMaskedInput
              ariaDescribedBy={formErrors.priceDigits ? 'packing-price-error' : undefined}
              ariaInvalid={Boolean(formErrors.priceDigits)}
              className={formErrors.priceDigits ? ui.fieldControlInvalid : undefined}
              digits={formState.priceDigits}
              name="price"
              onDigitsChange={(priceDigits) => {
                setFormState((currentState) => ({ ...currentState, priceDigits }));
                setFormErrors((currentErrors) => {
                  if (!currentErrors.priceDigits) {
                    return currentErrors;
                  }
                  const nextErrors = { ...currentErrors };
                  delete nextErrors.priceDigits;
                  return nextErrors;
                });
              }}
            />
            {formErrors.priceDigits ? (
              <p className={ui.fieldErrorMessage} id="packing-price-error">
                {formErrors.priceDigits}
              </p>
            ) : null}
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
