import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { IReadRecipe } from '../../src/shared/recipes';

const sonnerMocks = vi.hoisted(() => ({
  toastSuccessMock: vi.fn(),
  toastErrorMock: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    success: sonnerMocks.toastSuccessMock,
    error: sonnerMocks.toastErrorMock,
  },
}));

const recipeServiceMocks = vi.hoisted(() => ({
  getAllRecipesMock: vi.fn(),
  deleteRecipeMock: vi.fn(),
}));

const groupServiceMocks = vi.hoisted(() => ({
  getAllGroupsMock: vi.fn(),
}));

vi.mock('../../src/renderer/services/recipe-service', () => ({
  RecipeService: {
    getAllRecipes: recipeServiceMocks.getAllRecipesMock,
    deleteRecipe: recipeServiceMocks.deleteRecipeMock,
  },
}));

vi.mock('../../src/renderer/services/group-service', () => ({
  GroupService: {
    getAllGroups: groupServiceMocks.getAllGroupsMock,
  },
}));

import { RecipesPage } from '../../src/renderer/pages/recipes/recipes-page';

const baseRecipes: IReadRecipe[] = [
  {
    id: 'recipe-1',
    name: 'Brigadeiro Tradicional',
    description: 'Receita de brigadeiro',
    quantity: 20,
    sellingValue: 3,
    groupId: 'group-1',
    groupName: 'Brigadeiros',
    ingredients: [],
    packings: [],
    totalCost: 24,
  },
  {
    id: 'recipe-2',
    name: 'Bolo de Pote',
    description: 'Receita de bolo',
    quantity: 10,
    sellingValue: 12,
    groupId: 'group-2',
    groupName: 'Bolos',
    ingredients: [],
    packings: [],
    totalCost: 55,
  },
];

const baseGroups = [
  { id: 'group-1', name: 'Brigadeiros' },
  { id: 'group-2', name: 'Bolos' },
];

const renderRecipesPage = (initialEntry = '/recipes') =>
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/recipes" element={<RecipesPage />} />
        <Route path="/recipes/new" element={<div>Nova Receita</div>} />
        <Route path="/recipes/:id" element={<div>Editar Receita</div>} />
        <Route path="/recipes/visualize/:id" element={<div>Visualizar Receita</div>} />
      </Routes>
    </MemoryRouter>,
  );

describe('RecipesPage', () => {
  beforeEach(() => {
    sonnerMocks.toastSuccessMock.mockReset();
    sonnerMocks.toastErrorMock.mockReset();
    recipeServiceMocks.getAllRecipesMock.mockReset();
    recipeServiceMocks.deleteRecipeMock.mockReset();
    groupServiceMocks.getAllGroupsMock.mockReset();
    recipeServiceMocks.getAllRecipesMock.mockResolvedValue(baseRecipes);
    groupServiceMocks.getAllGroupsMock.mockResolvedValue(baseGroups);
  });

  it('loads recipes and applies name and group filters', async () => {
    renderRecipesPage();

    await screen.findByRole('cell', { name: 'Brigadeiro Tradicional' });

    fireEvent.change(screen.getByRole('textbox', { name: 'Filtrar por Nome' }), {
      target: { value: 'bolo' },
    });

    expect(screen.getByRole('cell', { name: 'Bolo de Pote' })).toBeInTheDocument();
    expect(screen.queryByRole('cell', { name: 'Brigadeiro Tradicional' })).not.toBeInTheDocument();

    fireEvent.change(screen.getByRole('textbox', { name: 'Filtrar por Nome' }), {
      target: { value: '' },
    });
    fireEvent.change(screen.getByRole('combobox', { name: 'Filtrar por Grupo' }), {
      target: { value: 'group-1' },
    });

    expect(screen.getByRole('cell', { name: 'Brigadeiro Tradicional' })).toBeInTheDocument();
    expect(screen.queryByRole('cell', { name: 'Bolo de Pote' })).not.toBeInTheDocument();
  });

  it('navigates to visualize and edit routes from the list actions', async () => {
    renderRecipesPage();

    const brigadeiroRow = await screen.findByRole('row', {
      name: /Brigadeiro Tradicional/,
    });

    fireEvent.click(within(brigadeiroRow).getByRole('button', { name: 'Visualizar' }));
    expect(screen.getByText('Visualizar Receita')).toBeInTheDocument();
  });

  it('navigates to the edit route from the list actions', async () => {
    renderRecipesPage();

    const brigadeiroRow = await screen.findByRole('row', {
      name: /Brigadeiro Tradicional/,
    });

    fireEvent.click(within(brigadeiroRow).getByRole('button', { name: 'Editar' }));
    expect(screen.getByText('Editar Receita')).toBeInTheDocument();
  });

  it('deletes recipes and refreshes the list', async () => {
    recipeServiceMocks.deleteRecipeMock.mockResolvedValue(undefined);
    recipeServiceMocks.getAllRecipesMock
      .mockResolvedValueOnce(baseRecipes)
      .mockResolvedValueOnce([baseRecipes[1]]);

    renderRecipesPage();

    const deleteRow = await screen.findByRole('row', {
      name: /Brigadeiro Tradicional/,
    });
    fireEvent.click(within(deleteRow).getByRole('button', { name: 'Excluir' }));
    const deleteDialog = screen.getByRole('dialog', { name: 'Excluir Receita' });
    fireEvent.click(within(deleteDialog).getByRole('button', { name: 'Excluir' }));

    await waitFor(() => expect(recipeServiceMocks.deleteRecipeMock).toHaveBeenCalledWith('recipe-1'));
    await waitFor(() =>
      expect(screen.queryByRole('cell', { name: 'Brigadeiro Tradicional' })).not.toBeInTheDocument(),
    );
    expect(sonnerMocks.toastSuccessMock).toHaveBeenCalledWith('Receita excluída com sucesso!');
  });

  it('shows an error state and retries loading', async () => {
    recipeServiceMocks.getAllRecipesMock
      .mockRejectedValueOnce({ detail: 'Falha temporária' })
      .mockResolvedValueOnce(baseRecipes);

    renderRecipesPage();

    expect(await screen.findByRole('alert')).toHaveTextContent('Falha temporária');

    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));

    expect(await screen.findByRole('cell', { name: 'Brigadeiro Tradicional' })).toBeInTheDocument();
  });
});
