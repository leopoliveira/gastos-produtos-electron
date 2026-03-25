import type React from 'react';
import { useState } from 'react';

import type { IReadPacking } from '../../../shared/packings';
import type { IRecipePackingInput } from '../../../shared/recipes';
import { Modal, ModalActions } from '../../components/modal';
import ui from '../../styles/shared-ui.module.css';

type PackingSelectionModalProps = {
  packings: IReadPacking[];
  initialValue?: IRecipePackingInput;
  onClose: () => void;
  onSubmit: (value: IRecipePackingInput) => void;
};

type PackingFormErrors = {
  packingId?: string;
  quantity?: string;
};

export const PackingSelectionModal = ({
  packings,
  initialValue,
  onClose,
  onSubmit,
}: PackingSelectionModalProps): React.JSX.Element => {
  const [packingId, setPackingId] = useState(initialValue?.packingId ?? '');
  const [quantity, setQuantity] = useState(initialValue ? String(initialValue.quantity) : '');
  const [formErrors, setFormErrors] = useState<PackingFormErrors>({});

  const validateForm = (): PackingFormErrors => {
    const nextErrors: PackingFormErrors = {};

    if (!packingId) {
      nextErrors.packingId = 'Selecione uma embalagem.';
    }

    const parsedQuantity = Number(quantity);
    if (packingId && (!quantity.trim() || Number.isNaN(parsedQuantity) || parsedQuantity <= 0)) {
      nextErrors.quantity = 'Informe uma quantidade maior que zero.';
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
      packingId,
      quantity: Number(quantity),
    });
  };

  return (
    <Modal
      title={initialValue ? 'Editar Embalagem' : 'Buscar Embalagem'}
      description="Selecione a embalagem e informe a quantidade usada na receita."
      onClose={onClose}
    >
      <form className={ui.form} onSubmit={handleSubmit}>
        <p className={ui.requiredHint}>* Campos obrigatórios</p>

        <label className={ui.field}>
          <span>
            Embalagem
            <strong aria-hidden="true" className={ui.requiredMark}>*</strong>
          </span>
          <select
            aria-describedby={formErrors.packingId ? 'packing-id-error' : undefined}
            aria-invalid={Boolean(formErrors.packingId)}
            className={formErrors.packingId ? ui.fieldControlInvalid : undefined}
            name="packingId"
            onChange={(event) => {
              setPackingId(event.target.value);
              setFormErrors((current) => {
                if (!current.packingId) {
                  return current;
                }
                const next = { ...current };
                delete next.packingId;
                return next;
              });
            }}
            value={packingId}
          >
            <option value="">Selecione</option>
            {packings.map((packing) => (
              <option key={packing.id} value={packing.id}>
                {packing.name}
              </option>
            ))}
          </select>
          {formErrors.packingId ? (
            <p className={ui.fieldErrorMessage} id="packing-id-error">
              {formErrors.packingId}
            </p>
          ) : null}
        </label>

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
            <p className={ui.fieldErrorMessage} id="packing-quantity-error">
              {formErrors.quantity}
            </p>
          ) : null}
        </label>

        <ModalActions confirmButtonType="submit" confirmLabel="Salvar" onCancel={onClose} />
      </form>
    </Modal>
  );
};
