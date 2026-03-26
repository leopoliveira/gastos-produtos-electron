import { fireEvent, render, screen, within } from '@testing-library/react';
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

const ingredientOptionsForFilter = [
  {
    id: 'ing-a',
    name: 'Açúcar refinado',
    price: 5,
    quantity: 1,
    unitOfMeasure: UnitOfMeasure.kg,
    unitPrice: 5,
  },
  {
    id: 'ing-b',
    name: 'Farinha de trigo',
    price: 4,
    quantity: 1,
    unitOfMeasure: UnitOfMeasure.kg,
    unitPrice: 4,
  },
  {
    id: 'ing-c',
    name: 'Chocolate em po',
    price: 18.9,
    quantity: 1,
    unitOfMeasure: UnitOfMeasure.kg,
    unitPrice: 18.9,
  },
] as const;

const packingOptionsForFilter = [
  {
    id: 'pack-a',
    name: 'Caixa kraft',
    description: 'Caixa',
    price: 20,
    quantity: 50,
    unitOfMeasure: UnitOfMeasure.kg,
    packingUnitPrice: 0.4,
  },
  {
    id: 'pack-b',
    name: 'Saco plástico PP',
    description: 'Saco',
    price: 10,
    quantity: 100,
    unitOfMeasure: UnitOfMeasure.kg,
    packingUnitPrice: 0.1,
  },
] as const;

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

  it('filters ingredient list by name, ignoring accents', () => {
    render(
      <IngredientFormModal
        ingredients={[...ingredientOptionsForFilter]}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    const ingredientSelect = screen.getByRole('combobox', { name: 'Matéria Prima' });
    expect(within(ingredientSelect).getAllByRole('option')).toHaveLength(4);

    fireEvent.change(screen.getByRole('searchbox'), {
      target: { value: 'acucar' },
    });

    const optionsAfterFilter = within(ingredientSelect).getAllByRole('option');
    expect(optionsAfterFilter).toHaveLength(2);
    expect(optionsAfterFilter.map((option) => option.textContent)).toEqual([
      'Selecione',
      'Açúcar refinado',
    ]);
  });

  it('shows empty state when ingredient name filter matches nothing', () => {
    render(
      <IngredientFormModal
        ingredients={[...ingredientOptionsForFilter]}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText('Digite para filtrar a lista'), {
      target: { value: 'xyzsemresultado' },
    });

    const ingredientSelect = screen.getByRole('combobox', { name: 'Matéria Prima' });
    expect(within(ingredientSelect).getAllByRole('option')).toHaveLength(1);
    expect(
      screen.getByText('Nenhuma matéria-prima encontrada com esse nome.'),
    ).toBeInTheDocument();
  });

  it('filters packing list by name', () => {
    render(
      <PackingSelectionModal
        packings={[...packingOptionsForFilter]}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    const packingSelect = screen.getByRole('combobox', { name: 'Embalagem' });
    expect(within(packingSelect).getAllByRole('option')).toHaveLength(3);

    fireEvent.change(screen.getByPlaceholderText('Digite para filtrar a lista'), {
      target: { value: 'plastico' },
    });

    expect(within(packingSelect).getAllByRole('option').map((o) => o.textContent)).toEqual([
      'Selecione',
      'Saco plástico PP',
    ]);
  });

  it('shows empty state when packing name filter matches nothing', () => {
    render(
      <PackingSelectionModal
        packings={[...packingOptionsForFilter]}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText('Digite para filtrar a lista'), {
      target: { value: 'inexistente' },
    });

    expect(screen.getByText('Nenhuma embalagem encontrada com esse nome.')).toBeInTheDocument();
  });
});
