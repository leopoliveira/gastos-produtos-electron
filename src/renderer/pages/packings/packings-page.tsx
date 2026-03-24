import type React from 'react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import type { ICreatePacking, IReadPacking } from '../../../shared/packings';
import { formatCurrency } from '../../../shared/format';
import {
  getUnitOfMeasureLabel,
  getUnitOfMeasureValues,
} from '../../../shared/unit-of-measure';
import { DataGrid, type DataGridColumn } from '../../components/data-grid';
import { PackingService } from '../../services/packing-service';
import { DeletePackingModal } from './delete-packing-modal';
import { PackingFormModal } from './packing-form-modal';
import ui from '../../styles/shared-ui.module.css';

const buildPackingColumns = (): DataGridColumn<IReadPacking>[] => [
  {
    key: 'name',
    header: 'Nome',
    sortable: true,
    sortValue: (packing) => packing.name,
    render: (packing) => packing.name,
  },
  {
    key: 'quantity',
    header: 'Quantidade',
    sortable: true,
    sortValue: (packing) => packing.quantity,
    render: (packing) => packing.quantity,
  },
  {
    key: 'price',
    header: 'Preço',
    sortable: true,
    sortValue: (packing) => packing.price,
    render: (packing) => formatCurrency(packing.price),
  },
  {
    key: 'unitOfMeasure',
    header: 'Unidade',
    sortable: true,
    sortValue: (packing) => getUnitOfMeasureLabel(packing.unitOfMeasure),
    render: (packing) => getUnitOfMeasureLabel(packing.unitOfMeasure),
  },
  {
    key: 'packingUnitPrice',
    header: 'Preço Unitário',
    sortable: true,
    sortValue: (packing) => packing.packingUnitPrice,
    render: (packing) => formatCurrency(packing.packingUnitPrice),
  },
];

const isPackingPayloadValid = (payload: ICreatePacking): boolean =>
  Boolean(payload.name.trim()) &&
  payload.quantity > 0 &&
  payload.price > 0 &&
  getUnitOfMeasureValues().includes(payload.unitOfMeasure);

const getErrorMessage = (error: unknown, fallbackMessage: string): string => {
  if (typeof error === 'object' && error !== null) {
    const candidate = error as { detail?: string; message?: string };
    return candidate.detail ?? candidate.message ?? fallbackMessage;
  }

  return fallbackMessage;
};

export const PackingsPage = (): React.JSX.Element => {
  const [packings, setPackings] = useState<IReadPacking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reRender, setReRender] = useState(true);
  const [packingInEdition, setPackingInEdition] = useState<IReadPacking | null>(null);
  const [packingPendingDeletion, setPackingPendingDeletion] = useState<IReadPacking | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    if (!reRender) {
      return;
    }

    let isActive = true;

    const loadPackings = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await PackingService.getAllPackings();
        if (isActive) {
          setPackings(response);
        }
      } catch (loadError) {
        if (isActive) {
          setError(getErrorMessage(loadError, 'Não foi possível carregar as embalagens.'));
        }
      } finally {
        if (isActive) {
          setLoading(false);
          setReRender(false);
        }
      }
    };

    void loadPackings();

    return () => {
      isActive = false;
    };
  }, [reRender]);

  const closeFormModal = () => {
    setIsCreateModalOpen(false);
    setPackingInEdition(null);
  };

  const handleSavePacking = async (payload: ICreatePacking) => {
    if (!isPackingPayloadValid(payload)) {
      toast.error('Preencha nome, quantidade, preço e unidade com valores válidos.');
      return;
    }

    if (packingInEdition) {
      try {
        await PackingService.updatePacking(packingInEdition.id, payload);
        closeFormModal();
        setReRender(true);
        toast.success('Embalagem salvo com sucesso!');
      } catch (saveError) {
        toast.error(getErrorMessage(saveError, 'Não foi possível salvar a embalagem.'));
      }
      return;
    }

    try {
      await PackingService.createPacking(payload);
      setIsCreateModalOpen(false);
      setReRender(true);
      toast.success('Embalagem criada com sucesso!');
    } catch (saveError) {
      toast.error(getErrorMessage(saveError, 'Não foi possível criar a embalagem.'));
    }
  };

  const handleConfirmDeletion = async () => {
    if (!packingPendingDeletion) {
      return;
    }

    try {
      await PackingService.deletePacking(packingPendingDeletion.id);
      setPackingPendingDeletion(null);
      setReRender(true);
      toast.success('Embalagem excluída com sucesso!');
    } catch (deleteError) {
      toast.error(getErrorMessage(deleteError, 'Não foi possível excluir a embalagem.'));
    }
  };

  const columns = buildPackingColumns();

  return (
    <section className={ui.page}>
      <header className="page-header">
        <div>
          <p className={ui.eyebrow}>Cadastro e consulta</p>
          <h2 className="page-header__title">Embalagens</h2>
          <p className="page-header__description">
            Organize as embalagens com referencia clara de quantidade, preco e custo
            unitario para apoiar a composicao das receitas.
          </p>
        </div>
        {loading && !packings.length ? (
          <button
            type="button"
            className={ui.primaryButton}
            onClick={() => {
              setPackingInEdition(null);
              setIsCreateModalOpen(true);
            }}
          >
            Adicionar
          </button>
        ) : null}
      </header>

      {error ? (
        <section className={`${ui.feedback} ${ui.feedbackError}`} role="alert">
          <p className={ui.feedbackTitle}>Falha ao carregar embalagens</p>
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
          {loading && !packings.length ? (
            <section className={ui.feedback} aria-live="polite">
              <p className={ui.feedbackTitle}>Carregando embalagens...</p>
            </section>
          ) : (
            <>
              {loading ? (
                <section className={ui.feedback} aria-live="polite">
                  <p className={ui.feedbackTitle}>Carregando embalagens...</p>
                </section>
              ) : null}

              <DataGrid
                title="Embalagens"
                data={packings}
                columns={columns}
                filterLabel="Filtrar por Nome"
                filterPlaceholder="Digite para buscar"
                actionsRenderer={(packing) => (
                  <div className={ui.actions}>
                    <button
                      type="button"
                      className={ui.actionButton}
                      onClick={() => {
                        setPackingInEdition(packing);
                        setIsCreateModalOpen(false);
                      }}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className={`${ui.actionButton} ${ui.dangerButton}`}
                      onClick={() => setPackingPendingDeletion(packing)}
                    >
                      Excluir
                    </button>
                  </div>
                )}
                getFilterValue={(packing) => packing.name}
                getRowKey={(packing) => packing.id}
                onAdd={() => {
                  setPackingInEdition(null);
                  setIsCreateModalOpen(true);
                }}
              />
            </>
          )}
        </>
      )}

      {isCreateModalOpen || packingInEdition ? (
        <PackingFormModal
          packing={packingInEdition ?? undefined}
          onClose={closeFormModal}
          onSubmit={handleSavePacking}
        />
      ) : null}

      {packingPendingDeletion ? (
        <DeletePackingModal
          onClose={() => setPackingPendingDeletion(null)}
          onConfirm={handleConfirmDeletion}
        />
      ) : null}
    </section>
  );
};
