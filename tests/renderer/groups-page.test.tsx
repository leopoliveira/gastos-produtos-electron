import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GroupsPage } from '../../src/renderer/pages/configuration/groups-page';

const sonnerMocks = vi.hoisted(() => ({
  toastSuccessMock: vi.fn(),
  toastErrorMock: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    success: sonnerMocks.toastSuccessMock,
    error: sonnerMocks.toastErrorMock,
  },
}));

const groupServiceMocks = vi.hoisted(() => ({
  getAllGroupsMock: vi.fn(),
  createGroupMock: vi.fn(),
  updateGroupMock: vi.fn(),
  deleteGroupMock: vi.fn(),
}));

vi.mock('../../src/renderer/services/group-service', () => ({
  GroupService: {
    getAllGroups: groupServiceMocks.getAllGroupsMock,
    createGroup: groupServiceMocks.createGroupMock,
    updateGroup: groupServiceMocks.updateGroupMock,
    deleteGroup: groupServiceMocks.deleteGroupMock,
  },
}));

const baseGroups = [
  {
    id: 'group-1',
    name: 'Brigadeiros',
    description: 'Receitas de brigadeiro e doces similares.',
  },
  {
    id: 'group-2',
    name: 'Bolos',
    description: 'Massas, recheios e coberturas para bolos.',
  },
];

describe('GroupsPage', () => {
  beforeEach(() => {
    sonnerMocks.toastSuccessMock.mockReset();
    sonnerMocks.toastErrorMock.mockReset();
    groupServiceMocks.getAllGroupsMock.mockReset();
    groupServiceMocks.createGroupMock.mockReset();
    groupServiceMocks.updateGroupMock.mockReset();
    groupServiceMocks.deleteGroupMock.mockReset();
    groupServiceMocks.getAllGroupsMock.mockResolvedValue(baseGroups);
  });

  it('loads groups and filters the grid by name', async () => {
    render(<GroupsPage />);

    await screen.findByRole('cell', { name: 'Brigadeiros' });
    fireEvent.change(screen.getByRole('textbox', { name: 'Filtrar por Nome' }), {
      target: { value: 'bolo' },
    });

    expect(screen.getByRole('cell', { name: 'Bolos' })).toBeInTheDocument();
    expect(screen.queryByRole('cell', { name: 'Brigadeiros' })).not.toBeInTheDocument();
  });

  it('sorts groups by name', async () => {
    render(<GroupsPage />);

    await screen.findByRole('cell', { name: 'Brigadeiros' });
    fireEvent.click(screen.getByRole('button', { name: /Nome/ }));

    const rows = screen.getAllByRole('row');
    expect(within(rows[1]).getByRole('cell', { name: 'Bolos' })).toBeInTheDocument();
  });

  it('shows a field error when trying to save without a name', async () => {
    render(<GroupsPage />);

    await screen.findByRole('cell', { name: 'Brigadeiros' });
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(screen.getByText('Informe o nome do grupo.')).toBeInTheDocument();
    expect(groupServiceMocks.createGroupMock).not.toHaveBeenCalled();
  });

  it('creates a group and shows the success toast', async () => {
    groupServiceMocks.createGroupMock.mockResolvedValue(undefined);
    groupServiceMocks.getAllGroupsMock
      .mockResolvedValueOnce(baseGroups)
      .mockResolvedValueOnce([
        {
          id: 'group-3',
          name: 'Doces finos',
          description: 'Linha premium.',
        },
        ...baseGroups,
      ]);

    render(<GroupsPage />);

    await screen.findByRole('cell', { name: 'Brigadeiros' });
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Nome' }), {
      target: { value: 'Doces finos' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: 'Descrição' }), {
      target: { value: 'Linha premium.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() =>
      expect(groupServiceMocks.createGroupMock).toHaveBeenCalledWith({
        name: 'Doces finos',
        description: 'Linha premium.',
      }),
    );
    expect(await screen.findByRole('cell', { name: 'Doces finos' })).toBeInTheDocument();
    expect(sonnerMocks.toastSuccessMock).toHaveBeenCalledWith('Grupo criado com sucesso!');
  });

  it('updates and deletes a group through the service flow', async () => {
    groupServiceMocks.updateGroupMock.mockResolvedValue(undefined);
    groupServiceMocks.deleteGroupMock.mockResolvedValue(undefined);
    groupServiceMocks.getAllGroupsMock
      .mockResolvedValueOnce(baseGroups)
      .mockResolvedValueOnce([
        {
          ...baseGroups[0],
          name: 'Brigadeiros gourmet',
        },
        baseGroups[1],
      ])
      .mockResolvedValueOnce([baseGroups[1]]);

    render(<GroupsPage />);

    const groupRow = await screen.findByRole('row', { name: /Brigadeiros/ });
    fireEvent.click(within(groupRow).getByRole('button', { name: 'Editar' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Nome' }), {
      target: { value: 'Brigadeiros gourmet' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() =>
      expect(groupServiceMocks.updateGroupMock).toHaveBeenCalledWith('group-1', {
        name: 'Brigadeiros gourmet',
        description: 'Receitas de brigadeiro e doces similares.',
      }),
    );
    expect(await screen.findByRole('cell', { name: 'Brigadeiros gourmet' })).toBeInTheDocument();
    expect(sonnerMocks.toastSuccessMock).toHaveBeenCalledWith('Grupo atualizado com sucesso!');

    const updatedRow = screen.getByRole('row', { name: /Brigadeiros gourmet/ });
    fireEvent.click(within(updatedRow).getByRole('button', { name: 'Excluir' }));
    const deleteDialog = screen.getByRole('dialog', { name: 'Confirmar Exclusão' });
    fireEvent.click(within(deleteDialog).getByRole('button', { name: 'Excluir' }));

    await waitFor(() => expect(groupServiceMocks.deleteGroupMock).toHaveBeenCalledWith('group-1'));
    await waitFor(() =>
      expect(screen.queryByRole('cell', { name: 'Brigadeiros gourmet' })).not.toBeInTheDocument(),
    );
    expect(sonnerMocks.toastSuccessMock).toHaveBeenCalledWith('Grupo excluído com sucesso!');
  });

  it('shows an error state and retries loading', async () => {
    groupServiceMocks.getAllGroupsMock
      .mockRejectedValueOnce({ detail: 'API indisponível' })
      .mockResolvedValueOnce(baseGroups);

    render(<GroupsPage />);

    expect(await screen.findByRole('alert')).toHaveTextContent('API indisponível');

    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));

    expect(await screen.findByRole('cell', { name: 'Brigadeiros' })).toBeInTheDocument();
  });

  it('shows an error toast and closes the delete modal when deletion fails', async () => {
    groupServiceMocks.deleteGroupMock.mockRejectedValue({ message: 'Falha ao excluir' });

    render(<GroupsPage />);

    const groupRow = await screen.findByRole('row', { name: /Brigadeiros/ });
    fireEvent.click(within(groupRow).getByRole('button', { name: 'Excluir' }));
    const deleteDialog = screen.getByRole('dialog', { name: 'Confirmar Exclusão' });
    fireEvent.click(within(deleteDialog).getByRole('button', { name: 'Excluir' }));

    await waitFor(() =>
      expect(sonnerMocks.toastErrorMock).toHaveBeenCalledWith('Falha ao excluir'),
    );
    expect(screen.queryByRole('dialog', { name: 'Confirmar Exclusão' })).not.toBeInTheDocument();
  });
});
