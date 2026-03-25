import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PackingsPage } from '../../src/renderer/pages/packings/packings-page';
import { UnitOfMeasure } from '../../src/shared/unit-of-measure';

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

const packingServiceMocks = vi.hoisted(() => ({
  getAllPackingsMock: vi.fn(),
  createPackingMock: vi.fn(),
  updatePackingMock: vi.fn(),
  deletePackingMock: vi.fn(),
}));

vi.mock('../../src/renderer/services/packing-service', () => ({
  PackingService: {
    getAllPackings: packingServiceMocks.getAllPackingsMock,
    createPacking: packingServiceMocks.createPackingMock,
    updatePacking: packingServiceMocks.updatePackingMock,
    deletePacking: packingServiceMocks.deletePackingMock,
  },
}));

const basePackings = [
  {
    id: 'packing-1',
    name: 'Caixa kraft',
    description: 'Caixa para 4 brigadeiros',
    price: 20,
    quantity: 50,
    unitOfMeasure: UnitOfMeasure.kg,
    packingUnitPrice: 0.4,
  },
  {
    id: 'packing-2',
    name: 'Saco celofane',
    description: 'Saco transparente',
    price: 15,
    quantity: 100,
    unitOfMeasure: UnitOfMeasure.un,
    packingUnitPrice: 0.15,
  },
];

describe('PackingsPage', () => {
  beforeEach(() => {
    sonnerMocks.toastSuccessMock.mockClear();
    sonnerMocks.toastErrorMock.mockClear();
    packingServiceMocks.getAllPackingsMock.mockReset();
    packingServiceMocks.createPackingMock.mockReset();
    packingServiceMocks.updatePackingMock.mockReset();
    packingServiceMocks.deletePackingMock.mockReset();
    packingServiceMocks.getAllPackingsMock.mockResolvedValue(basePackings);
  });

  it('loads packings and filters the grid', async () => {
    render(<PackingsPage />);

    await screen.findByRole('cell', { name: 'Caixa kraft' });
    fireEvent.change(screen.getByRole('textbox', { name: 'Filtrar por Nome' }), {
      target: { value: 'celofane' },
    });

    expect(screen.getByRole('cell', { name: 'Saco celofane' })).toBeInTheDocument();
    expect(screen.queryByRole('cell', { name: 'Caixa kraft' })).not.toBeInTheDocument();
  });

  it('shows an error state and retries the fetch', async () => {
    packingServiceMocks.getAllPackingsMock
      .mockRejectedValueOnce({ detail: 'API indisponível' })
      .mockResolvedValueOnce(basePackings);

    render(<PackingsPage />);

    expect(await screen.findByRole('alert')).toHaveTextContent('API indisponível');

    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));

    expect(await screen.findByRole('cell', { name: 'Caixa kraft' })).toBeInTheDocument();
  });

  it('creates a packing and shows the success toast', async () => {
    packingServiceMocks.createPackingMock.mockResolvedValue(undefined);
    packingServiceMocks.getAllPackingsMock
      .mockResolvedValueOnce(basePackings)
      .mockResolvedValueOnce([
        ...basePackings,
        {
          id: 'packing-3',
          name: 'Fita de cetim',
          description: 'Fita decorativa',
          price: 8,
          quantity: 20,
          unitOfMeasure: UnitOfMeasure.kg,
          packingUnitPrice: 0.4,
        },
      ]);

    render(<PackingsPage />);

    await screen.findByRole('cell', { name: 'Caixa kraft' });
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Nome' }), {
      target: { value: 'Fita de cetim' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: 'Descrição' }), {
      target: { value: 'Fita decorativa' },
    });
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Quantidade' }), {
      target: { value: '20' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: 'Preço' }), {
      target: { value: '800' },
    });
    fireEvent.change(screen.getByRole('combobox', { name: 'Unidade de Medida' }), {
      target: { value: String(UnitOfMeasure.kg) },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() =>
      expect(packingServiceMocks.createPackingMock).toHaveBeenCalledWith({
        name: 'Fita de cetim',
        description: 'Fita decorativa',
        quantity: 20,
        price: 8,
        unitOfMeasure: UnitOfMeasure.kg,
      }),
    );
    expect(await screen.findByRole('cell', { name: 'Fita de cetim' })).toBeInTheDocument();
    expect(sonnerMocks.toastSuccessMock).toHaveBeenCalledWith('Embalagem criada com sucesso!');
  });

  it('blocks invalid packing submission and highlights invalid fields', async () => {
    render(<PackingsPage />);

    await screen.findByRole('cell', { name: 'Caixa kraft' });
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Nome' }), {
      target: { value: '   ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(packingServiceMocks.createPackingMock).not.toHaveBeenCalled();
    expect(screen.getByText('Informe o nome da embalagem.')).toBeInTheDocument();
    expect(screen.getByText('Informe uma quantidade maior que zero.')).toBeInTheDocument();
    expect(screen.getByText('Informe um preço maior que zero.')).toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: 'Adicionar Embalagem' })).toBeInTheDocument();
  });

  it('edits and deletes a packing through the service flow', async () => {
    packingServiceMocks.updatePackingMock.mockResolvedValue(undefined);
    packingServiceMocks.deletePackingMock.mockResolvedValue(undefined);
    packingServiceMocks.getAllPackingsMock
      .mockResolvedValueOnce(basePackings)
      .mockResolvedValueOnce([
        {
          ...basePackings[0],
          name: 'Caixa kraft premium',
        },
        basePackings[1],
      ])
      .mockResolvedValueOnce([basePackings[1]]);

    render(<PackingsPage />);

    const packingRow = await screen.findByRole('row', {
      name: /Caixa kraft/,
    });
    fireEvent.click(within(packingRow).getByRole('button', { name: 'Editar' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Nome' }), {
      target: { value: 'Caixa kraft premium' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() =>
      expect(packingServiceMocks.updatePackingMock).toHaveBeenCalledWith('packing-1', {
        name: 'Caixa kraft premium',
        description: 'Caixa para 4 brigadeiros',
        quantity: 50,
        price: 20,
        unitOfMeasure: UnitOfMeasure.kg,
      }),
    );
    expect(await screen.findByRole('cell', { name: 'Caixa kraft premium' })).toBeInTheDocument();
    expect(sonnerMocks.toastSuccessMock).toHaveBeenCalledWith('Embalagem salvo com sucesso!');

    const updatedRow = screen.getByRole('row', {
      name: /Caixa kraft premium/,
    });
    fireEvent.click(within(updatedRow).getByRole('button', { name: 'Excluir' }));
    const deleteDialog = screen.getByRole('dialog', { name: 'Excluir Embalagem' });
    fireEvent.click(within(deleteDialog).getByRole('button', { name: 'Excluir' }));

    await waitFor(() =>
      expect(packingServiceMocks.deletePackingMock).toHaveBeenCalledWith('packing-1'),
    );
    await waitFor(() =>
      expect(screen.queryByRole('cell', { name: 'Caixa kraft premium' })).not.toBeInTheDocument(),
    );
    expect(sonnerMocks.toastSuccessMock).toHaveBeenCalledWith('Embalagem excluída com sucesso!');
  });
});
