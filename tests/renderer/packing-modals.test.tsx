import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { DeletePackingModal } from '../../src/renderer/pages/packings/delete-packing-modal';
import { PackingFormModal } from '../../src/renderer/pages/packings/packing-form-modal';
import { formatCurrency } from '../../src/shared/format';
import { UnitOfMeasure } from '../../src/shared/unit-of-measure';

describe('packing modals', () => {
  it('computes the packing unit price and submits trimmed values', () => {
    const onSubmit = vi.fn();

    render(<PackingFormModal onClose={vi.fn()} onSubmit={onSubmit} />);

    fireEvent.change(screen.getByRole('textbox', { name: 'Nome' }), {
      target: { value: ' Caixa mini ' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: 'Descrição' }), {
      target: { value: ' Embalagem kraft ' },
    });
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Quantidade' }), {
      target: { value: '10' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: 'Preço' }), {
      target: { value: '2500' },
    });
    fireEvent.change(screen.getByRole('combobox', { name: 'Unidade de Medida' }), {
      target: { value: String(UnitOfMeasure.kg) },
    });

    expect(screen.getByRole('textbox', { name: 'Preço Unitário' })).toHaveValue(
      formatCurrency(2.5),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Caixa mini',
      description: 'Embalagem kraft',
      quantity: 10,
      price: 25,
      unitOfMeasure: UnitOfMeasure.kg,
    });
  });

  it('renders the current deletion copy and triggers the destructive action', () => {
    const onConfirm = vi.fn();

    render(<DeletePackingModal onClose={vi.fn()} onConfirm={onConfirm} />);

    expect(screen.getByText('Deseja realmente excluir esta embalagem?')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Excluir' }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('closes through the overlay and the close button', () => {
    const onClose = vi.fn();

    render(<DeletePackingModal onClose={onClose} onConfirm={vi.fn()} />);

    fireEvent.click(screen.getByRole('presentation'));
    fireEvent.click(screen.getByRole('button', { name: 'Fechar modal' }));

    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
