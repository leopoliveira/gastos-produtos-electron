import React from 'react';
import { Link, Outlet, createHashRouter, useLocation, type RouteObject } from 'react-router-dom';

import { Breadcrumb } from './components/breadcrumb';
import { Sidebar } from './components/sidebar';
import { ProductsPage } from './pages/products/products-page';
import { PackingsPage } from './pages/packings/packings-page';
import { RecipesPage } from './pages/recipes/recipes-page';
import { RecipeFormPage } from './pages/recipes/recipe-form-page';
import { RecipeVisualizationPage } from './pages/recipes/recipe-visualization-page';
import { ConfigurationPage } from './pages/configuration/configuration-page';
import { GroupsPage } from './pages/configuration/groups-page';
import { AppProviders } from './providers/app-providers';

type AppRouteDefinition = {
  path: string;
  label: string;
  description: string;
  showInNavigation?: boolean;
  element?: React.JSX.Element;
};

export const appRoutes: AppRouteDefinition[] = [
  {
    path: '/',
    label: 'Home',
    description: 'Visao geral inicial da migracao do frontend para Electron + React.',
    showInNavigation: true,
  },
  {
    path: '/products',
    label: 'Produtos',
    description: 'Base da tela de materia-prima. O CRUD sera implementado na proxima etapa.',
    showInNavigation: true,
    element: <ProductsPage />,
  },
  {
    path: '/packings',
    label: 'Embalagens',
    description: 'CRUD de embalagens com listagem, filtros, modais e custo unitario.',
    showInNavigation: true,
    element: <PackingsPage />,
  },
  {
    path: '/recipes',
    label: 'Receitas',
    description: 'Listagem de receitas com filtros, custos e acoes principais.',
    showInNavigation: true,
    element: <RecipesPage />,
  },
  {
    path: '/recipes/new',
    label: 'Nova Receita',
    description: 'Entrada preparada para o formulario de criacao de receitas.',
    element: <RecipeFormPage />,
  },
  {
    path: '/recipes/:id',
    label: 'Editar Receita',
    description: 'Entrada preparada para a edicao detalhada de uma receita.',
    element: <RecipeFormPage />,
  },
  {
    path: '/recipes/visualize/:id',
    label: 'Visualizar Receita',
    description: 'Entrada preparada para a visualizacao detalhada da receita.',
    element: <RecipeVisualizationPage />,
  },
  {
    path: '/configuration',
    label: 'Configuracoes',
    description: 'Area de configuracoes do app com acesso aos grupos de receita.',
    showInNavigation: true,
    element: <ConfigurationPage />,
  },
  {
    path: '/configuration/groups',
    label: 'Grupos',
    description: 'Entrada preparada para o CRUD de grupos obrigatorios das receitas.',
    element: <GroupsPage />,
  },
];

const navigationItems = appRoutes.filter((route) => route.showInNavigation);

const routeMetadata = appRoutes.reduce<Record<string, AppRouteDefinition>>(
  (accumulator, route) => {
    accumulator[route.path] = route;
    return accumulator;
  },
  {},
);

export const getBreadcrumbs = (pathname: string): Array<{ label: string; to?: string }> => {
  if (pathname === '/') {
    return [{ label: 'Home' }];
  }

  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs: Array<{ label: string; to?: string }> = [{ label: 'Home', to: '/' }];

  let currentPath = '';
  for (const [index, segment] of segments.entries()) {
    currentPath += `/${segment}`;

    if (segment === 'new') {
      breadcrumbs.push({ label: 'Nova Receita' });
      continue;
    }

    if (segment === 'visualize') {
      breadcrumbs.push({ label: 'Visualizar' });
      continue;
    }

    if (!routeMetadata[currentPath]) {
      const previousSegment = segments[index - 1];
      const isRecipeRoute = segments[0] === 'recipes';
      const label =
        previousSegment === 'visualize'
          ? 'Receita'
          : isRecipeRoute
            ? 'Editar Receita'
            : 'Detalhe';

      breadcrumbs.push({ label });
      continue;
    }

    const matchedRoute = routeMetadata[currentPath];
    breadcrumbs.push({
      label: matchedRoute?.label ?? segment,
      to: matchedRoute ? currentPath : undefined,
    });
  }

  return breadcrumbs;
};

export const AppShell = (): React.JSX.Element => {
  const location = useLocation();
  const breadcrumbs = getBreadcrumbs(location.pathname);

  return (
    <div className="app-shell">
      <Sidebar items={navigationItems} />

      <main className="main-content">
        <div className="content-panel">
          {location.pathname !== '/' ? <Breadcrumb items={breadcrumbs} /> : null}

          <Outlet />
        </div>
      </main>
    </div>
  );
};

const HomePage = (): React.JSX.Element => {
  const homeCards = navigationItems.filter((route) => route.path !== '/');

  return (
    <section>
      <header className="page-header">
        <h2 className="page-header__title">Home</h2>
        <p className="page-header__description">
          Acesse diretamente os principais módulos do sistema.
        </p>
      </header>

      <div className="home-grid">
        {homeCards.map((route) => (
          <Link key={route.path} className="home-card" to={route.path}>
            <p className="home-card__eyebrow">Funcionalidade</p>
            <h3 className="home-card__title">{route.label}</h3>
            <p className="home-card__description">{route.description}</p>
            <span className="home-card__action">Abrir módulo</span>
          </Link>
        ))}
      </div>
    </section>
  );
};

const PlaceholderPage = ({
  title,
  description,
}: {
  title: string;
  description: string;
}): React.JSX.Element => (
  <section>
    <header className="page-header">
      <h2 className="page-header__title">{title}</h2>
      <p className="page-header__description">{description}</p>
    </header>

    <div className="placeholder-grid">
      <article className="placeholder-card">
        <p className="placeholder-card__label">Estrutura</p>
        <p className="placeholder-card__text">
          Layout, navegacao e hierarquia da tela definidos para receber os componentes reais.
        </p>
      </article>
      <article className="placeholder-card">
        <p className="placeholder-card__label">Proxima Etapa</p>
        <p className="placeholder-card__text">
          O comportamento de CRUD, chamadas HTTP e validacoes entram nas etapas de dominio.
        </p>
      </article>
      <article className="placeholder-card">
        <p className="placeholder-card__label">Status</p>
        <p className="placeholder-card__text">
          Esta etapa estabelece apenas a base visual e de roteamento do renderer.
        </p>
      </article>
    </div>
  </section>
);

export const buildAppRoutes = (): RouteObject[] => [
  {
    path: '/',
    element: (
      <AppProviders>
        <AppShell />
      </AppProviders>
    ),
    children: appRoutes.map((route) => ({
      path: route.path === '/' ? '/' : route.path,
      element:
        route.path === '/'
          ? <HomePage />
          : route.element ?? <PlaceholderPage title={route.label} description={route.description} />,
    })),
  },
];

export const router = createHashRouter(buildAppRoutes());
