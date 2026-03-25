import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { UnitOfMeasure } from '../../src/shared/unit-of-measure';
import sidebarStyles from '../../src/renderer/components/sidebar/sidebar.module.css';

vi.mock('sonner', () => ({
  Toaster: () => <div data-testid="global-toaster" />,
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('../../src/renderer/services/product-service', () => ({
  ProductService: {
    getAllProducts: vi.fn().mockResolvedValue([
      {
        id: 'product-1',
        name: 'Chocolate em po',
        price: 18.9,
        quantity: 1,
        unitOfMeasure: UnitOfMeasure.kg,
        unitPrice: 18.9,
      },
    ]),
    getAllIngredientsDto: vi.fn().mockResolvedValue([
      {
        id: 'product-1',
        name: 'Chocolate em po',
        price: 18.9,
        quantity: 1,
        unitOfMeasure: UnitOfMeasure.kg,
        unitPrice: 18.9,
      },
    ]),
    createProduct: vi.fn(),
    updateProduct: vi.fn(),
    deleteProduct: vi.fn(),
  },
}));

vi.mock('../../src/renderer/services/packing-service', () => ({
  PackingService: {
    getAllPackings: vi.fn().mockResolvedValue([
      {
        id: 'packing-1',
        name: 'Caixa para brigadeiro',
        description: 'Caixa premium com tampa transparente',
        price: 24.9,
        quantity: 50,
        unitOfMeasure: UnitOfMeasure.kg,
        packingUnitPrice: 24.9 / 50,
      },
    ]),
    getAllPackingsDto: vi.fn().mockResolvedValue([
      {
        id: 'packing-1',
        name: 'Caixa para brigadeiro',
        description: 'Caixa premium com tampa transparente',
        price: 24.9,
        quantity: 50,
        unitOfMeasure: UnitOfMeasure.kg,
        packingUnitPrice: 24.9 / 50,
      },
    ]),
    createPacking: vi.fn(),
    updatePacking: vi.fn(),
    deletePacking: vi.fn(),
  },
}));

vi.mock('../../src/renderer/services/group-service', () => ({
  GroupService: {
    getAllGroups: vi.fn().mockResolvedValue([
      {
        id: 'group-1',
        name: 'Brigadeiros',
        description: 'Receitas de brigadeiro e doces similares.',
      },
    ]),
    createGroup: vi.fn(),
    updateGroup: vi.fn(),
    deleteGroup: vi.fn(),
  },
}));

vi.mock('../../src/renderer/services/recipe-service', () => ({
  RecipeService: {
    getAllRecipes: vi.fn().mockResolvedValue([
      {
        id: 'recipe-1',
        name: 'Brigadeiro Tradicional',
        description: 'Receita de brigadeiro',
        quantity: 20,
        sellingValue: 3,
        groupId: 'group-1',
        groupName: 'Brigadeiros',
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
        packings: [],
        totalCost: 24,
      },
    ]),
    getRecipeById: vi.fn().mockResolvedValue({
      id: 'recipe-1',
      name: 'Brigadeiro Tradicional',
      description: 'Receita de brigadeiro',
      quantity: 20,
      sellingValue: 3,
      groupId: 'group-1',
      groupName: 'Brigadeiros',
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
      packings: [],
      totalCost: 24,
    }),
    createRecipe: vi.fn(),
    updateRecipe: vi.fn(),
    deleteRecipe: vi.fn(),
  },
}));

import { buildAppRoutes, getBreadcrumbs } from '../../src/renderer/router';

const renderRoute = (initialEntry: string) => {
  const router = createMemoryRouter(buildAppRoutes(), {
    initialEntries: [initialEntry],
  });

  return render(<RouterProvider router={router} />);
};

describe('renderer shell', () => {
  it('renders the global navigation shell on the home route', () => {
    renderRoute('/');

    const homeSection = screen.getByRole('heading', { name: 'Home', level: 2 }).closest('section');

    expect(
      screen.getByRole('heading', { name: 'Amo Doces', level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Navegacao principal' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Home' })).toHaveClass(sidebarStyles.linkActive);
    expect(homeSection).not.toBeNull();
    expect(within(homeSection as HTMLElement).getByRole('link', { name: /Produtos/i })).toHaveAttribute(
      'href',
      '/products',
    );
    expect(
      within(homeSection as HTMLElement).getByRole('link', { name: /Embalagens/i }),
    ).toHaveAttribute('href', '/packings');
    expect(within(homeSection as HTMLElement).getByRole('link', { name: /Receitas/i })).toHaveAttribute(
      'href',
      '/recipes',
    );
    expect(within(homeSection as HTMLElement).getByRole('link', { name: /Configuracoes/i })).toHaveAttribute(
      'href',
      '/configuration',
    );
    expect(screen.getByTestId('global-toaster')).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Breadcrumb' })).not.toBeInTheDocument();
  });

  it('renders breadcrumb and active navigation state on a functional route', async () => {
    renderRoute('/products');

    const breadcrumb = screen.getByRole('navigation', { name: 'Breadcrumb' });
    const primaryNavigation = screen.getByRole('navigation', {
      name: 'Navegacao principal',
    });

    expect(within(breadcrumb).getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
    expect(within(breadcrumb).getByRole('link', { name: 'Produtos' })).toHaveAttribute(
      'href',
      '/products',
    );
    expect(screen.getByRole('heading', { name: 'Matéria Prima', level: 2 })).toBeInTheDocument();
    expect(
      within(primaryNavigation).getByRole('link', { name: 'Produtos' }),
    ).toHaveClass(sidebarStyles.linkActive);
    expect(screen.getByRole('button', { name: 'Adicionar' })).toBeInTheDocument();
    expect(await screen.findByRole('textbox', { name: 'Filtrar por Nome' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Preço Unitário' })).toBeInTheDocument();
    expect(await screen.findByRole('cell', { name: 'Chocolate em po' })).toBeInTheDocument();
  });

  it('renders the packings route inside the application shell', async () => {
    renderRoute('/packings');

    const breadcrumb = screen.getByRole('navigation', { name: 'Breadcrumb' });
    const primaryNavigation = screen.getByRole('navigation', {
      name: 'Navegacao principal',
    });

    expect(within(breadcrumb).getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
    expect(within(breadcrumb).getByRole('link', { name: 'Embalagens' })).toHaveAttribute(
      'href',
      '/packings',
    );
    expect(screen.getByRole('heading', { name: 'Embalagens', level: 2 })).toBeInTheDocument();
    expect(
      within(primaryNavigation).getByRole('link', { name: 'Embalagens' }),
    ).toHaveClass(sidebarStyles.linkActive);
    expect(screen.getByRole('button', { name: 'Adicionar' })).toBeInTheDocument();
    expect(await screen.findByRole('textbox', { name: 'Filtrar por Nome' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Preço Unitário' })).toBeInTheDocument();
    expect(await screen.findByRole('cell', { name: 'Caixa para brigadeiro' })).toBeInTheDocument();
  });

  it('builds breadcrumbs for dynamic recipe visualization routes', () => {
    expect(getBreadcrumbs('/recipes/visualize/123')).toEqual([
      { label: 'Home', to: '/' },
      { label: 'Receitas', to: '/recipes' },
      { label: 'Visualizar' },
      { label: 'Receita' },
    ]);
  });

  it('renders the recipes route inside the application shell', async () => {
    renderRoute('/recipes');

    const breadcrumb = screen.getByRole('navigation', { name: 'Breadcrumb' });
    const primaryNavigation = screen.getByRole('navigation', {
      name: 'Navegacao principal',
    });

    expect(within(breadcrumb).getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
    expect(within(breadcrumb).getByRole('link', { name: 'Receitas' })).toHaveAttribute(
      'href',
      '/recipes',
    );
    expect(screen.getByRole('heading', { name: 'Receitas', level: 2 })).toBeInTheDocument();
    expect(within(primaryNavigation).getByRole('link', { name: 'Receitas' })).toHaveClass(
      sidebarStyles.linkActive,
    );
    expect(screen.getByRole('button', { name: 'Adicionar' })).toBeInTheDocument();
    expect(await screen.findByRole('textbox', { name: 'Filtrar por Nome' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Filtrar por Grupo' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Custo Total' })).toBeInTheDocument();
    expect(await screen.findByRole('cell', { name: 'Brigadeiro Tradicional' })).toBeInTheDocument();
  });

  it('renders the recipe visualization route inside the application shell', async () => {
    renderRoute('/recipes/visualize/recipe-1');

    expect(
      await screen.findByRole('heading', { name: 'Brigadeiro Tradicional', level: 2 }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Voltar' })).toBeInTheDocument();
    expect(screen.getByText('Grupo: Brigadeiros')).toBeInTheDocument();
    expect(screen.getByText('Chocolate em po')).toBeInTheDocument();
  });

  it('renders the configuration hub with access to groups', () => {
    renderRoute('/configuration');

    const breadcrumb = screen.getByRole('navigation', { name: 'Breadcrumb' });
    const primaryNavigation = screen.getByRole('navigation', {
      name: 'Navegacao principal',
    });

    expect(within(breadcrumb).getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
    expect(within(breadcrumb).getByRole('link', { name: 'Configuracoes' })).toHaveAttribute(
      'href',
      '/configuration',
    );
    expect(screen.getByRole('heading', { name: 'Configurações', level: 2 })).toBeInTheDocument();
    expect(within(primaryNavigation).getByRole('link', { name: 'Configuracoes' })).toHaveClass(
      sidebarStyles.linkActive,
    );
    expect(screen.getByRole('link', { name: 'Grupos de Receitas' })).toHaveAttribute(
      'href',
      '/configuration/groups',
    );
  });

  it('renders the groups route inside the application shell', () => {
    renderRoute('/configuration/groups');

    const breadcrumb = screen.getByRole('navigation', { name: 'Breadcrumb' });

    expect(within(breadcrumb).getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
    expect(within(breadcrumb).getByRole('link', { name: 'Configuracoes' })).toHaveAttribute(
      'href',
      '/configuration',
    );
    expect(within(breadcrumb).getByRole('link', { name: 'Grupos' })).toHaveAttribute(
      'href',
      '/configuration/groups',
    );
    expect(
      screen.getByRole('heading', { name: 'Grupos de Receitas', level: 2 }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Adicionar' })).toBeInTheDocument();
    expect(screen.getByText('Carregando grupos...')).toBeInTheDocument();
  });
});
