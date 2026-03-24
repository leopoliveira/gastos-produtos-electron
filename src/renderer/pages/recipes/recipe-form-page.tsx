import type React from 'react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

import type { IReadGroup } from '../../../shared/groups';
import type { IReadPacking } from '../../../shared/packings';
import type {
  ICreateRecipe,
  IRecipeIngredientInput,
  IRecipePackingInput,
} from '../../../shared/recipes';
import type { IReadProduct } from '../../../shared/products';
import { formatCurrency } from '../../../shared/format';
import { getUnitOfMeasureLabel } from '../../../shared/unit-of-measure';
import { GroupService } from '../../services/group-service';
import { PackingService } from '../../services/packing-service';
import { ProductService } from '../../services/product-service';
import { RecipeService } from '../../services/recipe-service';
import { GroupFormModal } from './group-form-modal';
import { IngredientFormModal } from './ingredient-form-modal';
import { PackingSelectionModal } from './packing-selection-modal';

type RecipeFormState = {
  name: string;
  description: string;
  quantity: string;
  sellingValue: string;
  groupId: string;
};

const emptyFormState: RecipeFormState = {
  name: '',
  description: '',
  quantity: '',
  sellingValue: '',
  groupId: '',
};

const getErrorMessage = (error: unknown, fallbackMessage: string): string => {
  if (typeof error === 'object' && error !== null) {
    const candidate = error as { detail?: string; message?: string };
    return candidate.detail ?? candidate.message ?? fallbackMessage;
  }

  return fallbackMessage;
};

const isRecipePayloadValid = (payload: ICreateRecipe): boolean =>
  Boolean(payload.name.trim()) &&
  payload.quantity > 0 &&
  payload.sellingValue > 0 &&
  payload.ingredients.length > 0 &&
  Boolean(payload.groupId);

const upsertIngredient = (
  items: IRecipeIngredientInput[],
  nextItem: IRecipeIngredientInput,
  index: number | null,
): IRecipeIngredientInput[] => {
  if (index === null) {
    return [...items, nextItem];
  }

  return items.map((item, currentIndex) => (currentIndex === index ? nextItem : item));
};

const upsertPacking = (
  items: IRecipePackingInput[],
  nextItem: IRecipePackingInput,
  index: number | null,
): IRecipePackingInput[] => {
  if (index === null) {
    return [...items, nextItem];
  }

  return items.map((item, currentIndex) => (currentIndex === index ? nextItem : item));
};

const buildIngredientLabel = (item: IRecipeIngredientInput, options: IReadProduct[]): string => {
  const option = options.find((candidate) => candidate.id === item.ingredientId);
  if (!option) {
    return 'Item removido';
  }

  return `${option.name} • ${item.quantity} ${getUnitOfMeasureLabel(option.unitOfMeasure)}`;
};

const buildPackingLabel = (item: IRecipePackingInput, options: IReadPacking[]): string => {
  const option = options.find((candidate) => candidate.id === item.packingId);
  if (!option) {
    return 'Item removido';
  }

  return `${option.name} • ${item.quantity} ${getUnitOfMeasureLabel(option.unitOfMeasure)}`;
};

const resolveGroupId = (currentGroupId: string | undefined, groups: IReadGroup[]): string => {
  if (!groups.length) {
    return '';
  }

  if (currentGroupId && groups.some((group) => group.id === currentGroupId)) {
    return currentGroupId;
  }

  return groups[0]?.id ?? '';
};

export const RecipeFormPage = (): React.JSX.Element => {
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();
  const recipeId = params.id;
  const isEditing = Boolean(recipeId);

  const [formState, setFormState] = useState<RecipeFormState>(emptyFormState);
  const [groups, setGroups] = useState<IReadGroup[]>([]);
  const [ingredientsOptions, setIngredientsOptions] = useState<IReadProduct[]>([]);
  const [packingOptions, setPackingOptions] = useState<IReadPacking[]>([]);
  const [ingredients, setIngredients] = useState<IRecipeIngredientInput[]>([]);
  const [packings, setPackings] = useState<IRecipePackingInput[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reRender, setReRender] = useState(true);
  const [isIngredientModalOpen, setIsIngredientModalOpen] = useState(false);
  const [editingIngredientIndex, setEditingIngredientIndex] = useState<number | null>(null);
  const [isPackingModalOpen, setIsPackingModalOpen] = useState(false);
  const [editingPackingIndex, setEditingPackingIndex] = useState<number | null>(null);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);

  useEffect(() => {
    if (!reRender) {
      return;
    }

    let isActive = true;

    const loadRecipeForm = async () => {
      setLoading(true);
      setError(null);

      try {
        const [loadedGroups, loadedIngredients, loadedPackings, recipe] = await Promise.all([
          GroupService.getAllGroups(),
          ProductService.getAllIngredientsDto(),
          PackingService.getAllPackingsDto(),
          recipeId ? RecipeService.getRecipeById(recipeId) : Promise.resolve(undefined),
        ]);

        if (!isActive) {
          return;
        }

        setGroups(loadedGroups);
        setIngredientsOptions(loadedIngredients);
        setPackingOptions(loadedPackings);

        if (recipeId && !recipe) {
          setError('Não foi possível localizar a receita solicitada.');
          return;
        }

        if (recipe) {
          setFormState({
            name: recipe.name,
            description: recipe.description ?? '',
            quantity: String(recipe.quantity),
            sellingValue: String(recipe.sellingValue),
            groupId: resolveGroupId(recipe.groupId, loadedGroups),
          });
          setIngredients(
            recipe.ingredients.map((ingredient: { ingredientId: string; quantity: number }) => ({
              ingredientId: ingredient.ingredientId,
              quantity: ingredient.quantity,
            })),
          );
          setPackings(
            recipe.packings.map((packing: { packingId: string; quantity: number }) => ({
              packingId: packing.packingId,
              quantity: packing.quantity,
            })),
          );
          return;
        }

        setFormState((currentState) => ({
          ...currentState,
          groupId: resolveGroupId(currentState.groupId, loadedGroups),
        }));
      } catch (loadError) {
        if (isActive) {
          setError(getErrorMessage(loadError, 'Não foi possível carregar o formulário da receita.'));
        }
      } finally {
        if (isActive) {
          setLoading(false);
          setReRender(false);
        }
      }
    };

    void loadRecipeForm();

    return () => {
      isActive = false;
    };
  }, [recipeId, reRender]);

  const quantity = Number(formState.quantity);
  const sellingValue = Number(formState.sellingValue);
  const estimatedIngredientCost = ingredients.reduce((sum, ingredient) => {
    const source = ingredientsOptions.find((option) => option.id === ingredient.ingredientId);
    return sum + (source?.unitPrice ?? 0) * ingredient.quantity;
  }, 0);
  const estimatedPackingCost = packings.reduce((sum, packing) => {
    const source = packingOptions.find((option) => option.id === packing.packingId);
    return sum + (source?.packingUnitPrice ?? 0) * packing.quantity;
  }, 0);
  const estimatedTotalCost = estimatedIngredientCost + estimatedPackingCost;
  const estimatedUnitCost = quantity > 0 ? estimatedTotalCost / quantity : 0;
  const estimatedProfitPerUnit = sellingValue - estimatedUnitCost;

  const handleFieldChange =
    (field: keyof RecipeFormState) =>
    (
      event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
    ) => {
      setFormState((currentState) => ({
        ...currentState,
        [field]: event.target.value,
      }));
    };

  const closeIngredientModal = () => {
    setIsIngredientModalOpen(false);
    setEditingIngredientIndex(null);
  };

  const closePackingModal = () => {
    setIsPackingModalOpen(false);
    setEditingPackingIndex(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload: ICreateRecipe = {
      name: formState.name.trim(),
      description: formState.description.trim() || undefined,
      quantity,
      sellingValue,
      groupId: formState.groupId || undefined,
      ingredients,
      packings,
    };

    if (!isRecipePayloadValid(payload)) {
      toast.error('Preencha todos os campos obrigatórios, incluindo o grupo.');
      return;
    }

    setSaving(true);

    try {
      if (recipeId) {
        await RecipeService.updateRecipe(recipeId, payload);
        toast.success('Receita salva com sucesso!');
      } else {
        await RecipeService.createRecipe(payload);
        toast.success('Receita criada com sucesso!');
      }

      navigate('/recipes');
    } catch (saveError) {
      toast.error(getErrorMessage(saveError, 'Não foi possível salvar a receita.'));
    } finally {
      setSaving(false);
    }
  };

  const handleCreateGroup = async (name: string) => {
    if (!name) {
      toast.error('Informe um nome válido para o grupo.');
      return;
    }

    try {
      await GroupService.createGroup({ name });
      const loadedGroups = await GroupService.getAllGroups();
      setGroups(loadedGroups);
      setFormState((currentState) => ({
        ...currentState,
        groupId: resolveGroupId(undefined, loadedGroups),
      }));
      setIsGroupModalOpen(false);
      toast.success('Grupo criado com sucesso!');
    } catch (groupError) {
      toast.error(getErrorMessage(groupError, 'Não foi possível criar o grupo.'));
    }
  };

  if (error) {
    return (
      <section className="products-page">
        <header className="page-header">
          <h2 className="page-header__title">{isEditing ? 'Editar Receita' : 'Nova Receita'}</h2>
        </header>

        <section className="products-feedback products-feedback--error" role="alert">
          <p className="products-feedback__title">Falha ao carregar formulário</p>
          <p className="products-feedback__message">{error}</p>
          <button
            type="button"
            className="products-feedback__retry-button"
            onClick={() => setReRender(true)}
          >
            Tentar novamente
          </button>
        </section>
      </section>
    );
  }

  if (loading) {
    return (
      <section className="products-page">
        <header className="page-header">
          <h2 className="page-header__title">{isEditing ? 'Editar Receita' : 'Nova Receita'}</h2>
        </header>

        <section className="products-feedback" aria-live="polite">
          <p className="products-feedback__title">Carregando formulário da receita...</p>
        </section>
      </section>
    );
  }

  return (
    <section className="products-page">
      <header className="page-header">
        <p className="products-page__eyebrow">Cadastro completo</p>
        <h2 className="page-header__title">{isEditing ? 'Editar Receita' : 'Nova Receita'}</h2>
        <p className="page-header__description">
          Monte a composicao da receita com ingredientes, embalagens e grupo obrigatorio.
        </p>
      </header>

      <form className="recipe-form-page" onSubmit={handleSubmit}>
        <section className="data-grid recipe-form-page__section">
          <div className="recipe-form-page__grid">
            <label className="product-form__field recipe-form-page__field--wide">
              <span>Nome</span>
              <input
                name="name"
                onChange={handleFieldChange('name')}
                type="text"
                value={formState.name}
              />
            </label>

            <label className="product-form__field recipe-form-page__field--wide">
              <span>Descrição</span>
              <textarea
                className="recipe-form-page__textarea"
                name="description"
                onChange={handleFieldChange('description')}
                value={formState.description}
              />
            </label>

            <div className="product-form__grid recipe-form-page__field--wide">
              <label className="product-form__field">
                <span>Quantidade Produzida</span>
                <input
                  min="0"
                  name="quantity"
                  onChange={handleFieldChange('quantity')}
                  step="0.01"
                  type="number"
                  value={formState.quantity}
                />
              </label>

              <label className="product-form__field">
                <span>Preço de Venda da Unidade</span>
                <input
                  min="0"
                  name="sellingValue"
                  onChange={handleFieldChange('sellingValue')}
                  step="0.01"
                  type="number"
                  value={formState.sellingValue}
                />
              </label>
            </div>

            <div className="recipe-form-page__group-row recipe-form-page__field--wide">
              {groups.length ? (
                <>
                  <label className="product-form__field recipe-form-page__group-field">
                    <span>Grupo</span>
                    <select
                      name="groupId"
                      onChange={handleFieldChange('groupId')}
                      value={formState.groupId}
                    >
                      <option value="">Selecione</option>
                      {groups.map((group) => (
                        <option key={group.id} value={group.id}>
                          {group.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    type="button"
                    className="products-actions__button"
                    onClick={() => setIsGroupModalOpen(true)}
                  >
                    Novo
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="products-page__add-button"
                  onClick={() => setIsGroupModalOpen(true)}
                >
                  Criar Grupo
                </button>
              )}
            </div>
          </div>
        </section>

        <section className="data-grid recipe-form-page__section">
          <div className="recipe-form-page__section-header">
            <div>
              <h3 className="recipe-form-page__section-title">Ingredientes</h3>
              <p className="recipe-form-page__section-description">
                Adicione ao menos uma matéria-prima para compor a receita.
              </p>
            </div>
            <button
              type="button"
              className="products-actions__button"
              onClick={() => setIsIngredientModalOpen(true)}
            >
              Buscar Matéria Prima
            </button>
          </div>

          <div className="recipe-form-page__tags">
            {ingredients.length ? (
              ingredients.map((ingredient, index) => (
                <div key={`${ingredient.ingredientId}-${index}`} className="recipe-form-page__tag">
                  <button
                    type="button"
                    className="recipe-form-page__tag-button"
                    onClick={() => {
                      setEditingIngredientIndex(index);
                      setIsIngredientModalOpen(true);
                    }}
                  >
                    {buildIngredientLabel(ingredient, ingredientsOptions)}
                  </button>
                  <button
                    type="button"
                    className="recipe-form-page__tag-remove"
                    aria-label={`Remover ${buildIngredientLabel(ingredient, ingredientsOptions)}`}
                    onClick={() =>
                      setIngredients((currentItems) =>
                        currentItems.filter((_, currentIndex) => currentIndex !== index),
                      )
                    }
                  >
                    X
                  </button>
                </div>
              ))
            ) : (
              <p className="recipe-form-page__empty">Nenhuma matéria-prima adicionada.</p>
            )}
          </div>
        </section>

        <section className="data-grid recipe-form-page__section">
          <div className="recipe-form-page__section-header">
            <div>
              <h3 className="recipe-form-page__section-title">Embalagens</h3>
              <p className="recipe-form-page__section-description">
                Adicione embalagens quando elas fizerem parte do custo final.
              </p>
            </div>
            <button
              type="button"
              className="products-actions__button"
              onClick={() => setIsPackingModalOpen(true)}
            >
              Buscar Embalagem
            </button>
          </div>

          <div className="recipe-form-page__tags">
            {packings.length ? (
              packings.map((packing, index) => (
                <div key={`${packing.packingId}-${index}`} className="recipe-form-page__tag">
                  <button
                    type="button"
                    className="recipe-form-page__tag-button"
                    onClick={() => {
                      setEditingPackingIndex(index);
                      setIsPackingModalOpen(true);
                    }}
                  >
                    {buildPackingLabel(packing, packingOptions)}
                  </button>
                  <button
                    type="button"
                    className="recipe-form-page__tag-remove"
                    aria-label={`Remover ${buildPackingLabel(packing, packingOptions)}`}
                    onClick={() =>
                      setPackings((currentItems) =>
                        currentItems.filter((_, currentIndex) => currentIndex !== index),
                      )
                    }
                  >
                    X
                  </button>
                </div>
              ))
            ) : (
              <p className="recipe-form-page__empty">Nenhuma embalagem adicionada.</p>
            )}
          </div>
        </section>

        <section className="data-grid recipe-form-page__section">
          <div className="recipe-form-page__metrics">
            <article>
              <span className="products-page__eyebrow">Custo estimado</span>
              <strong>{formatCurrency(estimatedTotalCost)}</strong>
            </article>
            <article>
              <span className="products-page__eyebrow">Custo por unidade</span>
              <strong>{formatCurrency(estimatedUnitCost)}</strong>
            </article>
            <article>
              <span className="products-page__eyebrow">Lucro por unidade</span>
              <strong>{formatCurrency(estimatedProfitPerUnit)}</strong>
            </article>
          </div>
        </section>

        <footer className="recipe-form-page__footer">
          <button
            className="modal__secondary-button"
            type="button"
            onClick={() => navigate('/recipes')}
          >
            Cancelar
          </button>
          <button className="modal__primary-button" disabled={saving} type="submit">
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </footer>
      </form>

      {isIngredientModalOpen ? (
        <IngredientFormModal
          ingredients={ingredientsOptions}
          initialValue={
            editingIngredientIndex === null ? undefined : ingredients[editingIngredientIndex]
          }
          onClose={closeIngredientModal}
          onSubmit={(value) => {
            setIngredients((currentItems) =>
              upsertIngredient(currentItems, value, editingIngredientIndex),
            );
            closeIngredientModal();
          }}
        />
      ) : null}

      {isPackingModalOpen ? (
        <PackingSelectionModal
          packings={packingOptions}
          initialValue={editingPackingIndex === null ? undefined : packings[editingPackingIndex]}
          onClose={closePackingModal}
          onSubmit={(value) => {
            setPackings((currentItems) => upsertPacking(currentItems, value, editingPackingIndex));
            closePackingModal();
          }}
        />
      ) : null}

      {isGroupModalOpen ? (
        <GroupFormModal onClose={() => setIsGroupModalOpen(false)} onSubmit={handleCreateGroup} />
      ) : null}
    </section>
  );
};
