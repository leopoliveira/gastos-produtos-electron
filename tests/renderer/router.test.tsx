import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

vi.mock('sonner', () => ({
  Toaster: () => <div data-testid="global-toaster" />,
  toast: {
    success: vi.fn(),
    error: vi.fn(),
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

    expect(
      screen.getByRole('heading', { name: 'Amo Doces', level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Navegacao principal' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Home' })).toHaveClass('sidebar__link--active');
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
    ).toHaveClass('sidebar__link--active');
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
    ).toHaveClass('sidebar__link--active');
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
      'sidebar__link--active',
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
});
