import type React from 'react';
import { useMemo, useState } from 'react';

import type { IReadPacking } from '../../../shared/packings';
import type { IRecipePackingInput } from '../../../shared/recipes';
import { normalizeString } from '../../../shared/string';
import {
  getCompatibleUnitOfMeasureValues,
  getUnitOfMeasureLabel,
  UnitOfMeasure,
} from '../../../shared/unit-of-measure';
import { Modal, ModalActions } from '../../components/modal';
import ui from '../../styles/shared-ui.module.css';

type PackingSelectionModalProps = {
  packings: IReadPacking[];
  initialValue?: IRecipePackingInput;
  onClose: () => void;
  onSubmit: (value: IRecipePackingInput, shouldClose: boolean) => void;
};

type PackingFormErrors = {
  packingId?: string;
  quantity?: string;
  unitOfMeasure?: string;
};

export const PackingSelectionModal = ({
  packings,
  initialValue,
  onClose,
  onSubmit,
}: PackingSelectionModalProps): React.JSX.Element => {
  const [packingId, setPackingId] = useState(initialValue?.packingId ?? '');
  const [quantity, setQuantity] = useState(initialValue ? String(initialValue.quantity) : '');
  const [unitOfMeasure, setUnitOfMeasure] = useState<UnitOfMeasure | ''>(
    initialValue?.unitOfMeasure ?? '',
  );
  const [formErrors, setFormErrors] = useState<PackingFormErrors>({});
  const [nameQuery, setNameQuery] = useState('');
  const isEditing = Boolean(initialValue);
  const selectedPacking = packings.find((item) => item.id === packingId);

  const filteredPackings = useMemo(() => {
    const needle = normalizeString(nameQuery);
    if (!needle) {
      return packings;
    }
    return packings.filter(
      (packing) =>
        (packingId !== '' && packing.id === packingId) ||
        normalizeString(packing.name).includes(needle),
    );
  }, [packings, packingId, nameQuery]);
  const availableUnits = selectedPacking
    ? getCompatibleUnitOfMeasureValues(selectedPacking.unitOfMeasure)
    : [];

  const validateForm = (): PackingFormErrors => {
    const nextErrors: PackingFormErrors = {};

    if (!packingId) {
      nextErrors.packingId = 'Selecione uma embalagem.';
    }

    const parsedQuantity = Number(quantity);
    if (packingId && (!quantity.trim() || Number.isNaN(parsedQuantity) || parsedQuantity <= 0)) {
      nextErrors.quantity = 'Informe uma quantidade maior que zero.';
    }

    if (packingId && unitOfMeasure === '') {
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
        packingId,
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
      title={isEditing ? 'Editar Embalagem' : 'Buscar Embalagem'}
      description="Selecione a embalagem e informe a quantidade usada na receita."
      onClose={onClose}
    >
      <form className={ui.form} onSubmit={handleSubmit}>
        <p className={ui.requiredHint}>* Campos obrigatórios</p>

        <label className={ui.field}>
          <span>Pesquisar embalagem pelo nome</span>
          <input
            autoComplete="off"
            name="packingNameFilter"
            onChange={(event) => setNameQuery(event.target.value)}
            placeholder="Digite para filtrar a lista"
            type="search"
            value={nameQuery}
          />
        </label>

        <div className={ui.field}>
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
                const nextPacking = packings.find((item) => item.id === event.target.value);
                setUnitOfMeasure(nextPacking?.unitOfMeasure ?? '');
                setFormErrors((current) => {
                  if (!current.packingId && !current.unitOfMeasure) {
                    return current;
                  }
                  const next = { ...current };
                  delete next.packingId;
                  delete next.unitOfMeasure;
                  return next;
                });
              }}
              value={packingId}
            >
              <option value="">Selecione</option>
              {filteredPackings.map((packing) => (
                <option key={packing.id} value={packing.id}>
                  {packing.name}
                </option>
              ))}
            </select>
          </label>
          {nameQuery.trim() && filteredPackings.length === 0 ? (
            <p className={ui.feedbackMessage} role="status" style={{ margin: 0 }}>
              Nenhuma embalagem encontrada com esse nome.
            </p>
          ) : null}
          {formErrors.packingId ? (
            <p className={ui.fieldErrorMessage} id="packing-id-error">
              {formErrors.packingId}
            </p>
          ) : null}
        </div>

        <label className={ui.field}>
          <span>
            Unidade de Medida
            <strong aria-hidden="true" className={ui.requiredMark}>*</strong>
          </span>
          <select
            aria-describedby={formErrors.unitOfMeasure ? 'packing-unit-error' : undefined}
            aria-invalid={Boolean(formErrors.unitOfMeasure)}
            className={formErrors.unitOfMeasure ? ui.fieldControlInvalid : undefined}
            disabled={!packingId}
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
            <p className={ui.fieldErrorMessage} id="packing-unit-error">
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
            setPackingId('');
            setQuantity('');
            setUnitOfMeasure('');
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
