import type React from 'react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import type { IReadRecipe } from '../../../shared/recipes';
import { formatCurrency } from '../../../shared/format';
import { getUnitOfMeasureLabel } from '../../../shared/unit-of-measure';
import { RecipeService } from '../../services/recipe-service';
import ui from '../../styles/shared-ui.module.css';
import styles from './recipe-visualization-page.module.css';

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
      <section className={ui.page}>
        <header className="page-header">
          <h2 className="page-header__title">Visualizar Receita</h2>
        </header>
        <section className={ui.feedback} aria-live="polite">
          <p className={ui.feedbackTitle}>Carregando receita...</p>
        </section>
      </section>
    );
  }

  if (error || !recipe) {
    return (
      <section className={ui.page}>
        <header className="page-header">
          <h2 className="page-header__title">Visualizar Receita</h2>
        </header>
        <section className={`${ui.feedback} ${ui.feedbackError}`} role="alert">
          <p className={ui.feedbackTitle}>Falha ao carregar receita</p>
          <p className={ui.feedbackMessage}>{error ?? 'Receita não encontrada.'}</p>
        </section>
      </section>
    );
  }

  return (
    <section className={ui.page}>
      <header className={`page-header ${ui.pageHeaderSplit}`}>
        <div>
          <p className={ui.eyebrow}>Visualização analítica</p>
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
          className={ui.primaryButton}
          onClick={() => navigate('/recipes')}
        >
          Voltar
        </button>
      </header>

      <section className={styles.metrics}>
        <article className={styles.metricCard}>
          <span className={ui.eyebrow}>Custo total</span>
          <strong className={styles.metricValue}>{formatCurrency(recipe.totalCost)}</strong>
        </article>
        <article className={styles.metricCard}>
          <span className={ui.eyebrow}>Quantidade produzida</span>
          <strong className={styles.metricValue}>{recipe.quantity}</strong>
        </article>
        <article className={styles.metricCard}>
          <span className={ui.eyebrow}>Custo por unidade</span>
          <strong className={styles.metricValue}>{formatCurrency(getUnitCost(recipe))}</strong>
        </article>
        <article className={styles.metricCard}>
          <span className={ui.eyebrow}>Preço de venda</span>
          <strong className={styles.metricValue}>{formatCurrency(recipe.sellingValue)}</strong>
        </article>
        <article className={styles.metricCard}>
          <span className={ui.eyebrow}>Lucro por unidade</span>
          <strong className={styles.metricValue}>{formatCurrency(getProfitPerUnit(recipe))}</strong>
        </article>
        <article className={styles.metricCard}>
          <span className={ui.eyebrow}>Lucro total</span>
          <strong className={styles.metricValue}>{formatCurrency(getTotalProfit(recipe))}</strong>
        </article>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <h3 className={styles.sectionTitle}>Ingredientes</h3>
            <p className={styles.sectionDescription}>
              Custos detalhados por matéria-prima utilizada.
            </p>
          </div>
        </div>

        <div className={styles.cards}>
          {recipe.ingredients.map((ingredient) => (
            <article key={`${ingredient.ingredientId}-${ingredient.quantity}`} className={styles.card}>
              <h4 className={styles.cardTitle}>{ingredient.name}</h4>
              <p className={styles.cardCopy}>
                Quantidade: {ingredient.quantity} {getUnitOfMeasureLabel(ingredient.unitOfMeasure)}
              </p>
              <p className={styles.cardCopy}>
                Preço unitário: {formatCurrency(ingredient.unitPrice)}
              </p>
              <p className={styles.cardTotal}>
                Custo total: {formatCurrency(ingredient.totalCost)}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <h3 className={styles.sectionTitle}>Embalagens</h3>
            <p className={styles.sectionDescription}>
              Custos detalhados por embalagem associada.
            </p>
          </div>
        </div>

        <div className={styles.cards}>
          {recipe.packings.length ? (
            recipe.packings.map((packing) => (
              <article key={`${packing.packingId}-${packing.quantity}`} className={styles.card}>
                <h4 className={styles.cardTitle}>{packing.name}</h4>
                <p className={styles.cardCopy}>
                  Quantidade: {packing.quantity} {getUnitOfMeasureLabel(packing.unitOfMeasure)}
                </p>
                <p className={styles.cardCopy}>
                  Preço unitário: {formatCurrency(packing.unitPrice)}
                </p>
                <p className={styles.cardTotal}>
                  Custo total: {formatCurrency(packing.totalCost)}
                </p>
              </article>
            ))
          ) : (
            <p className={styles.empty}>Nenhuma embalagem associada.</p>
          )}
        </div>
      </section>
    </section>
  );
};
