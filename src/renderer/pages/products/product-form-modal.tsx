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

type ProductFormErrors = Partial<Record<keyof ProductFormState, string>>;

const toFormState = (product?: IReadProduct): ProductFormState => ({
  name: product?.name ?? '',
  quantity: product ? String(product.quantity) : '',
  priceDigits: product ? currencyDigitStringFromAmount(product.price) : '',
  unitOfMeasure: String(product?.unitOfMeasure ?? UnitOfMeasure.mg),
});

export const ProductFormModal = ({
  product,
  onClose,
  onSubmit,
}: ProductFormModalProps): React.JSX.Element => {
  const [formState, setFormState] = useState<ProductFormState>(toFormState(product));
  const [formErrors, setFormErrors] = useState<ProductFormErrors>({});

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
      setFormErrors((currentErrors) => {
        if (!currentErrors[field]) {
          return currentErrors;
        }
        const nextErrors = { ...currentErrors };
        delete nextErrors[field];
        return nextErrors;
      });
    };

  const validateForm = (): ProductFormErrors => {
    const nextErrors: ProductFormErrors = {};

    if (!formState.name.trim()) {
      nextErrors.name = 'Informe o nome da matéria-prima.';
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
        <p className={ui.requiredHint}>* Campos obrigatórios</p>

        <label className={ui.field}>
          <span>
            Nome
            <strong aria-hidden="true" className={ui.requiredMark}>*</strong>
          </span>
          <input
            aria-describedby={formErrors.name ? 'product-name-error' : undefined}
            aria-invalid={Boolean(formErrors.name)}
            className={formErrors.name ? ui.fieldControlInvalid : undefined}
            name="name"
            onChange={handleFieldChange('name')}
            type="text"
            value={formState.name}
          />
          {formErrors.name ? (
            <p className={ui.fieldErrorMessage} id="product-name-error">
              {formErrors.name}
            </p>
          ) : null}
        </label>

        <div className={ui.formGrid}>
          <label className={ui.field}>
            <span>
              Quantidade
              <strong aria-hidden="true" className={ui.requiredMark}>*</strong>
            </span>
            <input
              aria-describedby={formErrors.quantity ? 'product-quantity-error' : undefined}
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
              <p className={ui.fieldErrorMessage} id="product-quantity-error">
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
              aria-describedby={formErrors.unitOfMeasure ? 'product-unit-error' : undefined}
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
              <p className={ui.fieldErrorMessage} id="product-unit-error">
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
              ariaDescribedBy={formErrors.priceDigits ? 'product-price-error' : undefined}
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
              <p className={ui.fieldErrorMessage} id="product-price-error">
                {formErrors.priceDigits}
              </p>
            ) : null}
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
