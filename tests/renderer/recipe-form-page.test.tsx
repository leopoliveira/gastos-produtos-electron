import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { IReadRecipe } from '../../src/shared/recipes';
import { UnitOfMeasure } from '../../src/shared/unit-of-measure';

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
  getRecipeByIdMock: vi.fn(),
  createRecipeMock: vi.fn(),
  updateRecipeMock: vi.fn(),
}));

const groupServiceMocks = vi.hoisted(() => ({
  getAllGroupsMock: vi.fn(),
  createGroupMock: vi.fn(),
}));

const productServiceMocks = vi.hoisted(() => ({
  getAllIngredientsDtoMock: vi.fn(),
}));

const packingServiceMocks = vi.hoisted(() => ({
  getAllPackingsDtoMock: vi.fn(),
}));

vi.mock('../../src/renderer/services/recipe-service', () => ({
  RecipeService: {
    getRecipeById: recipeServiceMocks.getRecipeByIdMock,
    createRecipe: recipeServiceMocks.createRecipeMock,
    updateRecipe: recipeServiceMocks.updateRecipeMock,
  },
}));

vi.mock('../../src/renderer/services/group-service', () => ({
  GroupService: {
    getAllGroups: groupServiceMocks.getAllGroupsMock,
    createGroup: groupServiceMocks.createGroupMock,
  },
}));

vi.mock('../../src/renderer/services/product-service', () => ({
  ProductService: {
    getAllIngredientsDto: productServiceMocks.getAllIngredientsDtoMock,
  },
}));

vi.mock('../../src/renderer/services/packing-service', () => ({
  PackingService: {
    getAllPackingsDto: packingServiceMocks.getAllPackingsDtoMock,
  },
}));

import { RecipeFormPage } from '../../src/renderer/pages/recipes/recipe-form-page';

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
    description: 'Caixa para doces',
    price: 20,
    quantity: 50,
    unitOfMeasure: UnitOfMeasure.box,
    packingUnitPrice: 0.4,
  },
];

const groups = [
  {
    id: 'group-1',
    name: 'Brigadeiros',
  },
];

const recipe: IReadRecipe = {
  id: 'recipe-1',
  name: 'Brigadeiro Gourmet',
  description: 'Receita atual',
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

const renderRecipeFormPage = (initialEntry: string) =>
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/recipes/new" element={<RecipeFormPage />} />
        <Route path="/recipes/:id" element={<RecipeFormPage />} />
        <Route path="/recipes" element={<div>Lista de Receitas</div>} />
      </Routes>
    </MemoryRouter>,
  );

describe('RecipeFormPage', () => {
  beforeEach(() => {
    sonnerMocks.toastSuccessMock.mockReset();
    sonnerMocks.toastErrorMock.mockReset();
    recipeServiceMocks.getRecipeByIdMock.mockReset();
    recipeServiceMocks.createRecipeMock.mockReset();
    recipeServiceMocks.updateRecipeMock.mockReset();
    groupServiceMocks.getAllGroupsMock.mockReset();
    groupServiceMocks.createGroupMock.mockReset();
    productServiceMocks.getAllIngredientsDtoMock.mockReset();
    packingServiceMocks.getAllPackingsDtoMock.mockReset();

    recipeServiceMocks.getRecipeByIdMock.mockResolvedValue(recipe);
    recipeServiceMocks.createRecipeMock.mockResolvedValue(undefined);
    recipeServiceMocks.updateRecipeMock.mockResolvedValue(undefined);
    groupServiceMocks.getAllGroupsMock.mockResolvedValue(groups);
    groupServiceMocks.createGroupMock.mockResolvedValue({
      id: 'group-2',
      name: 'Doces finos',
    });
    productServiceMocks.getAllIngredientsDtoMock.mockResolvedValue(ingredientOptions);
    packingServiceMocks.getAllPackingsDtoMock.mockResolvedValue(packingOptions);
  });

  it('blocks invalid submission with the required validation message', async () => {
    groupServiceMocks.getAllGroupsMock.mockResolvedValue([]);
    recipeServiceMocks.getRecipeByIdMock.mockResolvedValue(undefined);

    renderRecipeFormPage('/recipes/new');

    await screen.findByRole('heading', { name: 'Nova Receita' });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(sonnerMocks.toastErrorMock).toHaveBeenCalledWith(
      'Preencha todos os campos obrigatórios, incluindo o grupo.',
    );
  });

  it('creates a recipe with inline group creation and composition items', async () => {
    groupServiceMocks.getAllGroupsMock
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ id: 'group-2', name: 'Doces finos' }]);
    recipeServiceMocks.getRecipeByIdMock.mockResolvedValue(undefined);

    renderRecipeFormPage('/recipes/new');

    await screen.findByRole('heading', { name: 'Nova Receita' });

    fireEvent.change(screen.getByRole('textbox', { name: 'Nome' }), {
      target: { value: ' Cookie premium ' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: 'Descrição' }), {
      target: { value: ' Receita assinatura ' },
    });
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Quantidade Produzida' }), {
      target: { value: '12' },
    });
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Preço de Venda da Unidade' }), {
      target: { value: '8' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Criar Grupo' }));
    const groupDialog = screen.getByRole('dialog', { name: 'Novo Grupo' });
    fireEvent.change(within(groupDialog).getByRole('textbox', { name: 'Nome' }), {
      target: { value: ' Doces finos ' },
    });
    fireEvent.click(within(groupDialog).getByRole('button', { name: 'Salvar' }));

    await waitFor(() =>
      expect(groupServiceMocks.createGroupMock).toHaveBeenCalledWith({ name: 'Doces finos' }),
    );
    expect(sonnerMocks.toastSuccessMock).toHaveBeenCalledWith('Grupo criado com sucesso!');

    fireEvent.click(screen.getByRole('button', { name: 'Buscar Matéria Prima' }));
    const ingredientDialog = screen.getByRole('dialog', { name: 'Buscar Matéria Prima' });
    fireEvent.change(within(ingredientDialog).getByRole('combobox', { name: 'Matéria Prima' }), {
      target: { value: 'product-1' },
    });
    fireEvent.change(within(ingredientDialog).getByRole('spinbutton', { name: 'Quantidade' }), {
      target: { value: '0.5' },
    });
    fireEvent.click(within(ingredientDialog).getByRole('button', { name: 'Salvar' }));

    expect(
      screen.getByRole('button', { name: 'Chocolate em po • 0.5 kg' }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Buscar Embalagem' }));
    const packingDialog = screen.getByRole('dialog', { name: 'Buscar Embalagem' });
    fireEvent.change(within(packingDialog).getByRole('combobox', { name: 'Embalagem' }), {
      target: { value: 'packing-1' },
    });
    fireEvent.change(within(packingDialog).getByRole('spinbutton', { name: 'Quantidade' }), {
      target: { value: '12' },
    });
    fireEvent.click(within(packingDialog).getByRole('button', { name: 'Salvar' }));

    expect(screen.getByRole('button', { name: 'Caixa kraft • 12 box' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() =>
      expect(recipeServiceMocks.createRecipeMock).toHaveBeenCalledWith({
        name: 'Cookie premium',
        description: 'Receita assinatura',
        quantity: 12,
        sellingValue: 8,
        groupId: 'group-2',
        ingredients: [
          {
            ingredientId: 'product-1',
            quantity: 0.5,
          },
        ],
        packings: [
          {
            packingId: 'packing-1',
            quantity: 12,
          },
        ],
      }),
    );
    expect(await screen.findByText('Lista de Receitas')).toBeInTheDocument();
    expect(sonnerMocks.toastSuccessMock).toHaveBeenCalledWith('Receita criada com sucesso!');
  });

  it('loads an existing recipe, allows editing tags and submits the update', async () => {
    renderRecipeFormPage('/recipes/recipe-1');

    expect(await screen.findByDisplayValue('Brigadeiro Gourmet')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Chocolate em po • 0.5 kg' }),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByRole('textbox', { name: 'Nome' }), {
      target: { value: 'Brigadeiro Gourmet Premium' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Chocolate em po • 0.5 kg' }));
    const ingredientDialog = screen.getByRole('dialog', { name: 'Editar Matéria Prima' });
    fireEvent.change(within(ingredientDialog).getByRole('spinbutton', { name: 'Quantidade' }), {
      target: { value: '0.75' },
    });
    fireEvent.click(within(ingredientDialog).getByRole('button', { name: 'Salvar' }));

    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() =>
      expect(recipeServiceMocks.updateRecipeMock).toHaveBeenCalledWith('recipe-1', {
        name: 'Brigadeiro Gourmet Premium',
        description: 'Receita atual',
        quantity: 20,
        sellingValue: 3.5,
        groupId: 'group-1',
        ingredients: [
          {
            ingredientId: 'product-1',
            quantity: 0.75,
          },
        ],
        packings: [
          {
            packingId: 'packing-1',
            quantity: 20,
          },
        ],
      }),
    );
    expect(await screen.findByText('Lista de Receitas')).toBeInTheDocument();
    expect(sonnerMocks.toastSuccessMock).toHaveBeenCalledWith('Receita salva com sucesso!');
  });

  it('falls back to the first available group when the recipe group no longer exists', async () => {
    groupServiceMocks.getAllGroupsMock.mockResolvedValue([
      { id: 'group-2', name: 'Doces finos' },
      { id: 'group-3', name: 'Tortas' },
    ]);

    renderRecipeFormPage('/recipes/recipe-1');

    expect(await screen.findByDisplayValue('Brigadeiro Gourmet')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Grupo' })).toHaveValue('group-2');

    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() =>
      expect(recipeServiceMocks.updateRecipeMock).toHaveBeenCalledWith('recipe-1', {
        name: 'Brigadeiro Gourmet',
        description: 'Receita atual',
        quantity: 20,
        sellingValue: 3.5,
        groupId: 'group-2',
        ingredients: [
          {
            ingredientId: 'product-1',
            quantity: 0.5,
          },
        ],
        packings: [
          {
            packingId: 'packing-1',
            quantity: 20,
          },
        ],
      }),
    );
  });
});
