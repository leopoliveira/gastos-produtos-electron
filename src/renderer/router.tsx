import React from 'react';
import { Toaster } from 'sonner';
import {
  Link,
  NavLink,
  Outlet,
  createHashRouter,
  useLocation,
  type RouteObject,
} from 'react-router-dom';

import { ProductsPage } from './pages/products/products-page';
import { PackingsPage } from './pages/packings/packings-page';
import { RecipesPage } from './pages/recipes/recipes-page';
import { RecipeFormPage } from './pages/recipes/recipe-form-page';
import { RecipeVisualizationPage } from './pages/recipes/recipe-visualization-page';
import { ConfigurationPage } from './pages/configuration/configuration-page';
import { GroupsPage } from './pages/configuration/groups-page';

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
      <aside className="sidebar">
        <div className="sidebar__brand">
          <p className="sidebar__eyebrow">Desktop App</p>
          <h1 className="sidebar__title">Amo Doces</h1>
        </div>

        <nav className="sidebar__nav" aria-label="Navegacao principal">
          {navigationItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `sidebar__link${isActive ? ' sidebar__link--active' : ''}`
              }
              end={item.path === '/'}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="main-content">
        <div className="content-panel">
          {location.pathname !== '/' ? (
            <nav className="breadcrumbs" aria-label="Breadcrumb">
              {breadcrumbs.map((breadcrumb, index) => (
                <React.Fragment key={`${breadcrumb.label}-${index}`}>
                  {index > 0 ? (
                    <span className="breadcrumbs__separator" aria-hidden="true">
                      /
                    </span>
                  ) : null}
                  {breadcrumb.to ? <Link to={breadcrumb.to}>{breadcrumb.label}</Link> : breadcrumb.label}
                </React.Fragment>
              ))}
            </nav>
          ) : null}

          <Outlet />
        </div>
      </main>

      <Toaster richColors position="top-right" />
    </div>
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
    element: <AppShell />,
    children: appRoutes.map((route) => ({
      path: route.path === '/' ? '/' : route.path,
      element: route.element ?? <PlaceholderPage title={route.label} description={route.description} />,
    })),
  },
];

export const router = createHashRouter(buildAppRoutes());
