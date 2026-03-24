import type React from 'react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { DataGrid, type DataGridColumn } from '../../components/data-grid';
import type { ICreateProduct, IReadProduct } from '../../../shared/products';
import { getUnitOfMeasureLabel } from '../../../shared/unit-of-measure';
import { formatCurrency } from '../../utils/format';
import { DeleteProductModal } from './delete-product-modal';
import { ProductFormModal } from './product-form-modal';
import { ProductService } from '../../services/product-service';

const buildProductColumns = ({
  onEdit,
  onDelete,
}: {
  onEdit: (product: IReadProduct) => void;
  onDelete: (product: IReadProduct) => void;
}): DataGridColumn<IReadProduct>[] => [
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
  {
    key: 'actions',
    header: 'Ações',
    render: (product) => (
      <div className="products-actions">
        <button
          type="button"
          className="products-actions__button"
          onClick={() => onEdit(product)}
        >
          Editar
        </button>
        <button
          type="button"
          className="products-actions__button products-actions__button--danger"
          onClick={() => onDelete(product)}
        >
          Excluir
        </button>
      </div>
    ),
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

  const columns = buildProductColumns({
    onEdit: (product) => {
      setProductInEdition(product);
      setIsCreateModalOpen(false);
    },
    onDelete: (product) => setProductPendingDeletion(product),
  });

  return (
    <section className="products-page">
      <header className="page-header products-page__header">
        <div>
          <p className="products-page__eyebrow">Cadastro e consulta</p>
          <h2 className="page-header__title">Matéria Prima</h2>
          <p className="page-header__description">
            Centralize os insumos usados nas receitas com referência clara de quantidade,
            preço e custo unitário.
          </p>
        </div>

        <button
          type="button"
          className="products-page__add-button"
          onClick={() => {
            setProductInEdition(null);
            setIsCreateModalOpen(true);
          }}
        >
          Adicionar
        </button>
      </header>

      {error ? (
        <section className="products-feedback products-feedback--error" role="alert">
          <p className="products-feedback__title">Falha ao carregar matérias-primas</p>
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
          {loading && !products.length ? (
            <section className="products-feedback" aria-live="polite">
              <p className="products-feedback__title">Carregando matérias-primas...</p>
            </section>
          ) : (
            <>
              {loading ? (
                <section className="products-feedback" aria-live="polite">
                  <p className="products-feedback__title">Carregando matérias-primas...</p>
                </section>
              ) : null}

              <DataGrid
                data={products}
                columns={columns}
                filterLabel="Filtrar por Nome"
                filterPlaceholder="Digite para buscar"
                getFilterValue={(product) => product.name}
                getRowKey={(product) => product.id}
                emptyMessage="Nenhum registro encontrado."
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
