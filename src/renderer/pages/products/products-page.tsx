import type React from 'react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { DataGrid, type DataGridColumn } from '../../components/data-grid';
import { formatCurrency } from '../../../shared/format';
import type { ICreateProduct, IReadProduct } from '../../../shared/products';
import { getUnitOfMeasureLabel } from '../../../shared/unit-of-measure';
import { DeleteProductModal } from './delete-product-modal';
import { ProductFormModal } from './product-form-modal';
import { ProductService } from '../../services/product-service';
import ui from '../../styles/shared-ui.module.css';

const buildProductColumns = (): DataGridColumn<IReadProduct>[] => [
  {
    key: 'name',
    header: 'Nome',
    sortable: true,
    sortValue: (product) => product.name,
    render: (product) => product.name,
  },
  {
    key: 'quantity',
    header: 'Quantidade',
    sortable: true,
    sortValue: (product) => product.quantity,
    render: (product) => product.quantity,
  },
  {
    key: 'price',
    header: 'Preço',
    sortable: true,
    sortValue: (product) => product.price,
    render: (product) => formatCurrency(product.price),
  },
  {
    key: 'unitOfMeasure',
    header: 'Unidade',
    sortable: true,
    sortValue: (product) => getUnitOfMeasureLabel(product.unitOfMeasure),
    render: (product) => getUnitOfMeasureLabel(product.unitOfMeasure),
  },
  {
    key: 'unitPrice',
    header: 'Preço Unitário',
    sortable: true,
    sortValue: (product) => product.unitPrice,
    render: (product) => formatCurrency(product.unitPrice),
  },
];

const isProductPayloadValid = (payload: ICreateProduct): boolean =>
  Boolean(payload.name.trim()) && payload.quantity > 0 && payload.price > 0;

const getErrorMessage = (error: unknown, fallbackMessage: string): string => {
  if (typeof error === 'object' && error !== null) {
    const candidate = error as { detail?: string; message?: string };
    return candidate.detail ?? candidate.message ?? fallbackMessage;
  }

  return fallbackMessage;
};

export const ProductsPage = (): React.JSX.Element => {
  const [products, setProducts] = useState<IReadProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reRender, setReRender] = useState(true);
  const [productInEdition, setProductInEdition] = useState<IReadProduct | null>(null);
  const [productPendingDeletion, setProductPendingDeletion] = useState<IReadProduct | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    if (!reRender) {
      return;
    }

    let isActive = true;

    const loadProducts = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await ProductService.getAllProducts();
        if (isActive) {
          setProducts(response);
        }
      } catch (loadError) {
        if (isActive) {
          setError(getErrorMessage(loadError, 'Não foi possível carregar as matérias-primas.'));
        }
      } finally {
        if (isActive) {
          setLoading(false);
          setReRender(false);
        }
      }
    };

    void loadProducts();

    return () => {
      isActive = false;
    };
  }, [reRender]);

  const closeFormModal = () => {
    setIsCreateModalOpen(false);
    setProductInEdition(null);
  };

  const handleSaveProduct = async (payload: ICreateProduct) => {
    if (!isProductPayloadValid(payload)) {
      toast.error('Preencha nome, quantidade e preço com valores válidos.');
      return;
    }

    if (productInEdition) {
      try {
        await ProductService.updateProduct(productInEdition.id, payload);
        closeFormModal();
        setReRender(true);
        toast.success('Matéria Prima salvo com sucesso!');
      } catch (saveError) {
        toast.error(
          getErrorMessage(saveError, 'Não foi possível salvar a matéria-prima.'),
        );
      }
      return;
    }

    try {
      await ProductService.createProduct(payload);
      setIsCreateModalOpen(false);
      setReRender(true);
      toast.success('Matéria Prima criada com sucesso!');
    } catch (saveError) {
      toast.error(
        getErrorMessage(saveError, 'Não foi possível criar a matéria-prima.'),
      );
    }
  };

  const handleConfirmDeletion = async () => {
    if (!productPendingDeletion) {
      return;
    }

    try {
      await ProductService.deleteProduct(productPendingDeletion.id);
      setProductPendingDeletion(null);
      setReRender(true);
      toast.success('Matéria Prima excluída com sucesso!');
    } catch (deleteError) {
      toast.error(
        getErrorMessage(deleteError, 'Não foi possível excluir a matéria-prima.'),
      );
    }
  };

  const columns = buildProductColumns();

  return (
    <section className={ui.page}>
      <header className="page-header">
        <div>
          <p className={ui.eyebrow}>Cadastro e consulta</p>
          <h2 className="page-header__title">Matéria Prima</h2>
          <p className="page-header__description">
            Centralize os insumos usados nas receitas com referência clara de quantidade,
            preço e custo unitário.
          </p>
        </div>
        {loading && !products.length ? (
          <button
            type="button"
            className={ui.primaryButton}
            onClick={() => {
              setProductInEdition(null);
              setIsCreateModalOpen(true);
            }}
          >
            Adicionar
          </button>
        ) : null}
      </header>

      {error ? (
        <section className={`${ui.feedback} ${ui.feedbackError}`} role="alert">
          <p className={ui.feedbackTitle}>Falha ao carregar matérias-primas</p>
          <p className={ui.feedbackMessage}>{error}</p>
          <button
            type="button"
            className={ui.retryButton}
            onClick={() => setReRender(true)}
          >
            Tentar novamente
          </button>
        </section>
      ) : (
        <>
          {loading && !products.length ? (
            <section className={ui.feedback} aria-live="polite">
              <p className={ui.feedbackTitle}>Carregando matérias-primas...</p>
            </section>
          ) : (
            <>
              {loading ? (
                <section className={ui.feedback} aria-live="polite">
                  <p className={ui.feedbackTitle}>Carregando matérias-primas...</p>
                </section>
              ) : null}

              <DataGrid
                title="Matéria Prima"
                data={products}
                columns={columns}
                filterLabel="Filtrar por Nome"
                filterPlaceholder="Digite para buscar"
                actionsRenderer={(product) => (
                  <div className={ui.actions}>
                    <button
                      type="button"
                      className={ui.actionButton}
                      onClick={() => {
                        setProductInEdition(product);
                        setIsCreateModalOpen(false);
                      }}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className={`${ui.actionButton} ${ui.dangerButton}`}
                      onClick={() => setProductPendingDeletion(product)}
                    >
                      Excluir
                    </button>
                  </div>
                )}
                getFilterValue={(product) => product.name}
                getRowKey={(product) => product.id}
                onAdd={() => {
                  setProductInEdition(null);
                  setIsCreateModalOpen(true);
                }}
              />
            </>
          )}
        </>
      )}

      {isCreateModalOpen || productInEdition ? (
        <ProductFormModal
          product={productInEdition ?? undefined}
          onClose={closeFormModal}
          onSubmit={handleSaveProduct}
        />
      ) : null}

      {productPendingDeletion ? (
        <DeleteProductModal
          onClose={() => setProductPendingDeletion(null)}
          onConfirm={handleConfirmDeletion}
        />
      ) : null}
    </section>
  );
};
