import type React from 'react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { formatCurrency } from '../../../shared/format';
import type { IReadGroup } from '../../../shared/groups';
import type { IReadRecipe } from '../../../shared/recipes';
import { DataGrid, type DataGridColumn } from '../../components/data-grid';
import { GroupService } from '../../services/group-service';
import { RecipeService } from '../../services/recipe-service';
import { DeleteRecipeModal } from './delete-recipe-modal';

const getErrorMessage = (error: unknown, fallbackMessage: string): string => {
  if (typeof error === 'object' && error !== null) {
    const candidate = error as { detail?: string; message?: string };
    return candidate.detail ?? candidate.message ?? fallbackMessage;
  }

  return fallbackMessage;
};

const getUnitCost = (recipe: IReadRecipe): number =>
  recipe.quantity > 0 ? recipe.totalCost / recipe.quantity : 0;

const getProfitPerUnit = (recipe: IReadRecipe): number => recipe.sellingValue - getUnitCost(recipe);

const buildRecipeColumns = (): DataGridColumn<IReadRecipe>[] => [
  {
    key: 'name',
    header: 'Nome',
    sortable: true,
    sortValue: (recipe) => recipe.name,
    render: (recipe) => recipe.name,
  },
  {
    key: 'totalCost',
    header: 'Custo Total',
    sortable: true,
    sortValue: (recipe) => recipe.totalCost,
    render: (recipe) => formatCurrency(recipe.totalCost),
  },
  {
    key: 'quantity',
    header: 'Qtde. Produzida',
    sortable: true,
    sortValue: (recipe) => recipe.quantity,
    render: (recipe) => recipe.quantity,
  },
  {
    key: 'unitCost',
    header: 'Custo por Unidade',
    render: (recipe) => formatCurrency(getUnitCost(recipe)),
  },
  {
    key: 'sellingValue',
    header: 'Preço de Venda da Un.',
    sortable: true,
    sortValue: (recipe) => recipe.sellingValue,
    render: (recipe) => formatCurrency(recipe.sellingValue),
  },
  {
    key: 'profitPerUnit',
    header: 'Lucro por Un.',
    render: (recipe) => formatCurrency(getProfitPerUnit(recipe)),
  },
];

export const RecipesPage = (): React.JSX.Element => {
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState<IReadRecipe[]>([]);
  const [groups, setGroups] = useState<IReadGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reRender, setReRender] = useState(true);
  const [recipePendingDeletion, setRecipePendingDeletion] = useState<IReadRecipe | null>(null);

  useEffect(() => {
    if (!reRender) {
      return;
    }

    let isActive = true;

    const loadRecipesPageData = async () => {
      setLoading(true);
      setError(null);

      try {
        const [loadedRecipes, loadedGroups] = await Promise.all([
          RecipeService.getAllRecipes(),
          GroupService.getAllGroups(),
        ]);

        if (isActive) {
          setRecipes(loadedRecipes);
          setGroups(loadedGroups);
        }
      } catch (loadError) {
        if (isActive) {
          setError(getErrorMessage(loadError, 'Não foi possível carregar as receitas.'));
        }
      } finally {
        if (isActive) {
          setLoading(false);
          setReRender(false);
        }
      }
    };

    void loadRecipesPageData();

    return () => {
      isActive = false;
    };
  }, [reRender]);

  const filteredRecipes =
    selectedGroupId === 'all'
      ? recipes
      : recipes.filter((recipe) => recipe.groupId === selectedGroupId);

  const columns = buildRecipeColumns();

  const handleConfirmDeletion = async () => {
    if (!recipePendingDeletion) {
      return;
    }

    try {
      await RecipeService.deleteRecipe(recipePendingDeletion.id);
      setRecipePendingDeletion(null);
      setReRender(true);
      toast.success('Receita excluída com sucesso!');
    } catch (deleteError) {
      toast.error(getErrorMessage(deleteError, 'Não foi possível excluir a receita.'));
    }
  };

  return (
    <section className="products-page">
      <header className="page-header">
        <div>
          <p className="products-page__eyebrow">Cadastro e analise</p>
          <h2 className="page-header__title">Receitas</h2>
          <p className="page-header__description">
            Gerencie a composicao das receitas, acompanhe custos e mantenha a margem
            por unidade visivel antes da producao.
          </p>
        </div>
        {loading && !recipes.length ? (
          <button
            type="button"
            className="products-page__add-button"
            onClick={() => navigate('/recipes/new')}
          >
            Adicionar
          </button>
        ) : null}
      </header>

      {error ? (
        <section className="products-feedback products-feedback--error" role="alert">
          <p className="products-feedback__title">Falha ao carregar receitas</p>
          <p className="products-feedback__message">{error}</p>
          <button
            type="button"
            className="products-feedback__retry-button"
            onClick={() => setReRender(true)}
          >
            Tentar novamente
          </button>
        </section>
      ) : (
        <>
          {loading && !recipes.length ? (
            <section className="products-feedback" aria-live="polite">
              <p className="products-feedback__title">Carregando receitas...</p>
            </section>
          ) : (
            <>
              {loading ? (
                <section className="products-feedback" aria-live="polite">
                  <p className="products-feedback__title">Carregando receitas...</p>
                </section>
              ) : null}

              <DataGrid
                title="Receitas"
                data={filteredRecipes}
                columns={columns}
                filterLabel="Filtrar por Nome"
                filterPlaceholder="Digite para buscar"
                toolbarContent={(
                  <label className="data-grid__filter" htmlFor="recipe-group-filter">
                    <span className="data-grid__filter-label">Filtrar por Grupo</span>
                    <select
                      id="recipe-group-filter"
                      className="data-grid__filter-input"
                      name="recipe-group-filter"
                      value={selectedGroupId}
                      onChange={(event) => setSelectedGroupId(event.target.value)}
                    >
                      <option value="all">Todos os Grupos</option>
                      {groups.map((group) => (
                        <option key={group.id} value={group.id}>
                          {group.name}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                actionsRenderer={(recipe) => (
                  <div className="products-actions">
                    <button
                      type="button"
                      className="products-actions__button"
                      onClick={() => navigate(`/recipes/visualize/${recipe.id}`)}
                    >
                      Visualizar
                    </button>
                    <button
                      type="button"
                      className="products-actions__button"
                      onClick={() => navigate(`/recipes/${recipe.id}`)}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className="products-actions__button products-actions__button--danger"
                      onClick={() => setRecipePendingDeletion(recipe)}
                    >
                      Excluir
                    </button>
                  </div>
                )}
                getFilterValue={(recipe) => recipe.name}
                getRowKey={(recipe) => recipe.id}
                emptyMessage="Nenhuma receita encontrada."
                onAdd={() => navigate('/recipes/new')}
              />
            </>
          )}
        </>
      )}

      {recipePendingDeletion ? (
        <DeleteRecipeModal
          onClose={() => setRecipePendingDeletion(null)}
          onConfirm={handleConfirmDeletion}
        />
      ) : null}
    </section>
  );
};
