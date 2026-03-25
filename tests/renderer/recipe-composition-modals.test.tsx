import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { IngredientFormModal } from '../../src/renderer/pages/recipes/ingredient-form-modal';
import { PackingSelectionModal } from '../../src/renderer/pages/recipes/packing-selection-modal';
import { UnitOfMeasure } from '../../src/shared/unit-of-measure';

const ingredientOptions = [
  {
    id: 'product-1',
    name: 'Chocolate em po',
    price: 18.9,
    quantity: 1,
    unitOfMeasure: UnitOfMeasure.kg,
    unitPrice: 18.9,
  },
];

const packingOptions = [
  {
    id: 'packing-1',
    name: 'Caixa kraft',
    description: 'Caixa',
    price: 20,
    quantity: 50,
    unitOfMeasure: UnitOfMeasure.kg,
    packingUnitPrice: 0.4,
  },
];

describe('recipe composition modals', () => {
  it('requires quantity after selecting an ingredient', () => {
    const onSubmit = vi.fn();

    render(
      <IngredientFormModal
        ingredients={ingredientOptions}
        onClose={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.change(screen.getByRole('combobox', { name: 'Matéria Prima' }), {
      target: { value: 'product-1' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText('Informe uma quantidade maior que zero.')).toBeInTheDocument();
  });

  it('requires quantity after selecting a packing', () => {
    const onSubmit = vi.fn();

    render(
      <PackingSelectionModal packings={packingOptions} onClose={vi.fn()} onSubmit={onSubmit} />,
    );

    fireEvent.change(screen.getByRole('combobox', { name: 'Embalagem' }), {
      target: { value: 'packing-1' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText('Informe uma quantidade maior que zero.')).toBeInTheDocument();
  });

  it('submits when ingredient and quantity are valid', () => {
    const onSubmit = vi.fn();

    render(
      <IngredientFormModal
        ingredients={ingredientOptions}
        onClose={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.change(screen.getByRole('combobox', { name: 'Matéria Prima' }), {
      target: { value: 'product-1' },
    });
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Quantidade' }), {
      target: { value: '1.5' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(onSubmit).toHaveBeenCalledWith({
      ingredientId: 'product-1',
      quantity: 1.5,
      unitOfMeasure: UnitOfMeasure.kg,
    }, true);
  });
});
