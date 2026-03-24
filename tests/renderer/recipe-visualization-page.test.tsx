import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { IReadRecipe } from '../../src/shared/recipes';
import { UnitOfMeasure } from '../../src/shared/unit-of-measure';

const recipeServiceMocks = vi.hoisted(() => ({
  getRecipeByIdMock: vi.fn(),
}));

vi.mock('../../src/renderer/services/recipe-service', () => ({
  RecipeService: {
    getRecipeById: recipeServiceMocks.getRecipeByIdMock,
  },
}));

import { RecipeVisualizationPage } from '../../src/renderer/pages/recipes/recipe-visualization-page';

const recipe: IReadRecipe = {
  id: 'recipe-1',
  name: 'Brigadeiro Gourmet',
  description: 'Receita detalhada',
  quantity: 20,
  sellingValue: 3.5,
  groupId: 'group-1',
  groupName: 'Brigadeiros',
  totalCost: 26,
  ingredients: [
    {
      ingredientId: 'product-1',
      name: 'Chocolate em po',
      quantity: 0.5,
      unitOfMeasure: UnitOfMeasure.kg,
      unitPrice: 18.9,
      totalCost: 9.45,
    },
  ],
  packings: [
    {
      packingId: 'packing-1',
      name: 'Caixa kraft',
      quantity: 20,
      unitOfMeasure: UnitOfMeasure.box,
      unitPrice: 0.4,
      totalCost: 8,
    },
  ],
};

const renderVisualizationPage = () =>
  render(
    <MemoryRouter initialEntries={['/recipes/visualize/recipe-1']}>
      <Routes>
        <Route path="/recipes/visualize/:id" element={<RecipeVisualizationPage />} />
        <Route path="/recipes" element={<div>Lista de Receitas</div>} />
      </Routes>
    </MemoryRouter>,
  );

describe('RecipeVisualizationPage', () => {
  beforeEach(() => {
    recipeServiceMocks.getRecipeByIdMock.mockReset();
    recipeServiceMocks.getRecipeByIdMock.mockResolvedValue(recipe);
  });

  it('renders the analytical recipe details and returns to the list', async () => {
    renderVisualizationPage();

    expect(await screen.findByRole('heading', { name: 'Brigadeiro Gourmet' })).toBeInTheDocument();
    expect(screen.getByText('Grupo: Brigadeiros')).toBeInTheDocument();
    expect(screen.getByText('Receita detalhada')).toBeInTheDocument();
    expect(screen.getByText('Chocolate em po')).toBeInTheDocument();
    expect(screen.getByText('Caixa kraft')).toBeInTheDocument();
    expect(screen.getByText('Lucro total')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Voltar' }));
    expect(screen.getByText('Lista de Receitas')).toBeInTheDocument();
  });

  it('shows an error state when the recipe is not found', async () => {
    recipeServiceMocks.getRecipeByIdMock.mockResolvedValue(undefined);

    renderVisualizationPage();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível localizar a receita solicitada.',
    );
  });
});
