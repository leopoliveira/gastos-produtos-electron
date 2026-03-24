import type React from 'react';
import { useState } from 'react';
import { toast } from 'sonner';

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

export const PackingSelectionModal = ({
  packings,
  initialValue,
  onClose,
  onSubmit,
}: PackingSelectionModalProps): React.JSX.Element => {
  const [packingId, setPackingId] = useState(initialValue?.packingId ?? '');
  const [quantity, setQuantity] = useState(initialValue ? String(initialValue.quantity) : '');

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const parsedQuantity = Number(quantity);
    if (!packingId || parsedQuantity <= 0) {
      toast.error('Selecione uma embalagem e informe uma quantidade válida.');
      return;
    }

    onSubmit({
      packingId,
      quantity: parsedQuantity,
    });
  };

  return (
    <Modal
      title={initialValue ? 'Editar Embalagem' : 'Buscar Embalagem'}
      description="Selecione a embalagem e informe a quantidade usada na receita."
      onClose={onClose}
    >
      <form className={ui.form} onSubmit={handleSubmit}>
        <label className={ui.field}>
          <span>Embalagem</span>
          <select
            name="packingId"
            onChange={(event) => setPackingId(event.target.value)}
            value={packingId}
          >
            <option value="">Selecione</option>
            {packings.map((packing) => (
              <option key={packing.id} value={packing.id}>
                {packing.name}
              </option>
            ))}
          </select>
        </label>

        <label className={ui.field}>
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

        <ModalActions confirmButtonType="submit" confirmLabel="Salvar" onCancel={onClose} />
      </form>
    </Modal>
  );
};
