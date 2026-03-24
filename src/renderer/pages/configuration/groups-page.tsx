import type React from 'react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import type { ICreateGroup, IReadGroup } from '../../../shared/groups';
import { DataGrid, type DataGridColumn } from '../../components/data-grid';
import { GroupService } from '../../services/group-service';
import { DeleteGroupModal } from './delete-group-modal';
import { GroupFormModal } from './group-form-modal';

const getErrorMessage = (error: unknown, fallbackMessage: string): string => {
  if (typeof error === 'object' && error !== null) {
    const candidate = error as { detail?: string; message?: string };
    return candidate.detail ?? candidate.message ?? fallbackMessage;
  }

  return fallbackMessage;
};

const buildGroupColumns = (): DataGridColumn<IReadGroup>[] => [
  {
    key: 'name',
    header: 'Nome',
    sortable: true,
    sortValue: (group) => group.name,
    render: (group) => group.name,
  },
  {
    key: 'description',
    header: 'Descrição',
    render: (group) => group.description ?? '-',
  },
];

export const GroupsPage = (): React.JSX.Element => {
  const [groups, setGroups] = useState<IReadGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reRender, setReRender] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [groupInEdition, setGroupInEdition] = useState<IReadGroup | null>(null);
  const [groupPendingDeletion, setGroupPendingDeletion] = useState<IReadGroup | null>(null);

  useEffect(() => {
    if (!reRender) {
      return;
    }

    let isActive = true;

    const loadGroups = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await GroupService.getAllGroups();
        if (isActive) {
          setGroups(response);
        }
      } catch (loadError) {
        if (isActive) {
          setError(getErrorMessage(loadError, 'Não foi possível carregar os grupos.'));
        }
      } finally {
        if (isActive) {
          setLoading(false);
          setReRender(false);
        }
      }
    };

    void loadGroups();

    return () => {
      isActive = false;
    };
  }, [reRender]);

  const closeFormModal = () => {
    setIsCreateModalOpen(false);
    setGroupInEdition(null);
  };

  const handleSaveGroup = async (payload: ICreateGroup) => {
    try {
      if (groupInEdition) {
        await GroupService.updateGroup(groupInEdition.id, payload);
        closeFormModal();
        setReRender(true);
        toast.success('Grupo atualizado com sucesso!');
        return;
      }

      await GroupService.createGroup(payload);
      setIsCreateModalOpen(false);
      setReRender(true);
      toast.success('Grupo criado com sucesso!');
    } catch (saveError) {
      toast.error(getErrorMessage(saveError, 'Não foi possível salvar o grupo.'));
    }
  };

  const handleConfirmDeletion = async () => {
    if (!groupPendingDeletion) {
      return;
    }

    try {
      await GroupService.deleteGroup(groupPendingDeletion.id);
      setGroupPendingDeletion(null);
      setReRender(true);
      toast.success('Grupo excluído com sucesso!');
    } catch (deleteError) {
      toast.error(getErrorMessage(deleteError, 'Não foi possível excluir o grupo.'));
      setGroupPendingDeletion(null);
    }
  };

  const columns = buildGroupColumns();

  return (
    <section className="products-page">
      <header className="page-header">
        <div>
          <p className="products-page__eyebrow">Cadastro auxiliar</p>
          <h2 className="page-header__title">Grupos de Receitas</h2>
          <p className="page-header__description">
            Cadastre e mantenha as classificações consumidas pelo filtro e pelo formulário de receitas.
          </p>
        </div>
        {loading && !groups.length ? (
          <button
            type="button"
            className="products-page__add-button"
            onClick={() => {
              setGroupInEdition(null);
              setIsCreateModalOpen(true);
            }}
          >
            Adicionar
          </button>
        ) : null}
      </header>

      {error ? (
        <section className="products-feedback products-feedback--error" role="alert">
          <p className="products-feedback__title">Falha ao carregar grupos</p>
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
          {loading && !groups.length ? (
            <section className="products-feedback" aria-live="polite">
              <p className="products-feedback__title">Carregando grupos...</p>
            </section>
          ) : (
            <>
              {loading ? (
                <section className="products-feedback" aria-live="polite">
                  <p className="products-feedback__title">Carregando grupos...</p>
                </section>
              ) : null}

              <DataGrid
                title="Grupos de Receitas"
                data={groups}
                columns={columns}
                filterLabel="Filtrar por Nome"
                filterPlaceholder="Digite para buscar"
                actionsRenderer={(group) => (
                  <div className="products-actions">
                    <button
                      type="button"
                      className="products-actions__button"
                      onClick={() => {
                        setGroupInEdition(group);
                        setIsCreateModalOpen(false);
                      }}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className="products-actions__button products-actions__button--danger"
                      onClick={() => setGroupPendingDeletion(group)}
                    >
                      Excluir
                    </button>
                  </div>
                )}
                getFilterValue={(group) => group.name}
                getRowKey={(group) => group.id}
                emptyMessage="Nenhum grupo encontrado."
                onAdd={() => {
                  setGroupInEdition(null);
                  setIsCreateModalOpen(true);
                }}
              />
            </>
          )}
        </>
      )}

      {isCreateModalOpen || groupInEdition ? (
        <GroupFormModal
          group={groupInEdition ?? undefined}
          onClose={closeFormModal}
          onSubmit={handleSaveGroup}
        />
      ) : null}

      {groupPendingDeletion ? (
        <DeleteGroupModal
          descriptionText="Deseja realmente excluir este grupo?"
          onClose={() => setGroupPendingDeletion(null)}
          onConfirm={handleConfirmDeletion}
        />
      ) : null}
    </section>
  );
};
