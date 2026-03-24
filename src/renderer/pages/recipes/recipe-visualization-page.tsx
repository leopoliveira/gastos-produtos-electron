import type React from 'react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import type { IReadRecipe } from '../../../shared/recipes';
import { formatCurrency } from '../../../shared/format';
import { getUnitOfMeasureLabel } from '../../../shared/unit-of-measure';
import { RecipeService } from '../../services/recipe-service';

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

const getTotalProfit = (recipe: IReadRecipe): number =>
  recipe.sellingValue * recipe.quantity - recipe.totalCost;

export const RecipeVisualizationPage = (): React.JSX.Element => {
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();
  const recipeId = params.id;

  const [recipe, setRecipe] = useState<IReadRecipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    const loadRecipe = async () => {
      setLoading(true);
      setError(null);

      try {
        if (!recipeId) {
          throw new Error('Receita inválida.');
        }

        const loadedRecipe = await RecipeService.getRecipeById(recipeId);

        if (!isActive) {
          return;
        }

        if (!loadedRecipe) {
          setError('Não foi possível localizar a receita solicitada.');
          return;
        }

        setRecipe(loadedRecipe);
      } catch (loadError) {
        if (isActive) {
          setError(getErrorMessage(loadError, 'Não foi possível carregar a receita.'));
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    void loadRecipe();

    return () => {
      isActive = false;
    };
  }, [recipeId]);

  if (loading) {
    return (
      <section className="products-page">
        <header className="page-header">
          <h2 className="page-header__title">Visualizar Receita</h2>
        </header>
        <section className="products-feedback" aria-live="polite">
          <p className="products-feedback__title">Carregando receita...</p>
        </section>
      </section>
    );
  }

  if (error || !recipe) {
    return (
      <section className="products-page">
        <header className="page-header">
          <h2 className="page-header__title">Visualizar Receita</h2>
        </header>
        <section className="products-feedback products-feedback--error" role="alert">
          <p className="products-feedback__title">Falha ao carregar receita</p>
          <p className="products-feedback__message">{error ?? 'Receita não encontrada.'}</p>
        </section>
      </section>
    );
  }

  return (
    <section className="products-page">
      <header className="page-header products-page__header">
        <div>
          <p className="products-page__eyebrow">Visualização analítica</p>
          <h2 className="page-header__title">{recipe.name}</h2>
          <p className="page-header__description">
            {recipe.groupName ? `Grupo: ${recipe.groupName}` : 'Grupo não informado'}
          </p>
          {recipe.description ? (
            <p className="page-header__description">{recipe.description}</p>
          ) : null}
        </div>

        <button
          type="button"
          className="products-page__add-button"
          onClick={() => navigate('/recipes')}
        >
          Voltar
        </button>
      </header>

      <section className="recipe-form-page__metrics">
        <article>
          <span className="products-page__eyebrow">Custo total</span>
          <strong>{formatCurrency(recipe.totalCost)}</strong>
        </article>
        <article>
          <span className="products-page__eyebrow">Quantidade produzida</span>
          <strong>{recipe.quantity}</strong>
        </article>
        <article>
          <span className="products-page__eyebrow">Custo por unidade</span>
          <strong>{formatCurrency(getUnitCost(recipe))}</strong>
        </article>
        <article>
          <span className="products-page__eyebrow">Preço de venda</span>
          <strong>{formatCurrency(recipe.sellingValue)}</strong>
        </article>
        <article>
          <span className="products-page__eyebrow">Lucro por unidade</span>
          <strong>{formatCurrency(getProfitPerUnit(recipe))}</strong>
        </article>
        <article>
          <span className="products-page__eyebrow">Lucro total</span>
          <strong>{formatCurrency(getTotalProfit(recipe))}</strong>
        </article>
      </section>

      <section className="recipe-visualization__section">
        <div className="recipe-form-page__section-header">
          <div>
            <h3 className="recipe-form-page__section-title">Ingredientes</h3>
            <p className="recipe-form-page__section-description">
              Custos detalhados por matéria-prima utilizada.
            </p>
          </div>
        </div>

        <div className="recipe-visualization__cards">
          {recipe.ingredients.map((ingredient) => (
            <article
              key={`${ingredient.ingredientId}-${ingredient.quantity}`}
              className="recipe-visualization__card"
            >
              <h4 className="recipe-visualization__card-title">{ingredient.name}</h4>
              <p className="recipe-visualization__card-copy">
                Quantidade: {ingredient.quantity} {getUnitOfMeasureLabel(ingredient.unitOfMeasure)}
              </p>
              <p className="recipe-visualization__card-copy">
                Preço unitário: {formatCurrency(ingredient.unitPrice)}
              </p>
              <p className="recipe-visualization__card-total">
                Custo total: {formatCurrency(ingredient.totalCost)}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="recipe-visualization__section">
        <div className="recipe-form-page__section-header">
          <div>
            <h3 className="recipe-form-page__section-title">Embalagens</h3>
            <p className="recipe-form-page__section-description">
              Custos detalhados por embalagem associada.
            </p>
          </div>
        </div>

        <div className="recipe-visualization__cards">
          {recipe.packings.length ? (
            recipe.packings.map((packing) => (
              <article
                key={`${packing.packingId}-${packing.quantity}`}
                className="recipe-visualization__card"
              >
                <h4 className="recipe-visualization__card-title">{packing.name}</h4>
                <p className="recipe-visualization__card-copy">
                  Quantidade: {packing.quantity} {getUnitOfMeasureLabel(packing.unitOfMeasure)}
                </p>
                <p className="recipe-visualization__card-copy">
                  Preço unitário: {formatCurrency(packing.unitPrice)}
                </p>
                <p className="recipe-visualization__card-total">
                  Custo total: {formatCurrency(packing.totalCost)}
                </p>
              </article>
            ))
          ) : (
            <p className="recipe-form-page__empty">Nenhuma embalagem associada.</p>
          )}
        </div>
      </section>
    </section>
  );
};
