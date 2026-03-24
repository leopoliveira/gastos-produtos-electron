import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ProductsPage } from '../../src/renderer/pages/products/products-page';
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

const productServiceMocks = vi.hoisted(() => ({
  getAllProductsMock: vi.fn(),
  createProductMock: vi.fn(),
  updateProductMock: vi.fn(),
  deleteProductMock: vi.fn(),
}));

vi.mock('../../src/renderer/services/product-service', () => ({
  ProductService: {
    getAllProducts: productServiceMocks.getAllProductsMock,
    createProduct: productServiceMocks.createProductMock,
    updateProduct: productServiceMocks.updateProductMock,
    deleteProduct: productServiceMocks.deleteProductMock,
  },
}));

const baseProducts = [
  {
    id: 'product-1',
    name: 'Chocolate em po',
    price: 18.9,
    quantity: 1,
    unitOfMeasure: UnitOfMeasure.kg,
    unitPrice: 18.9,
  },
  {
    id: 'product-2',
    name: 'Leite condensado',
    price: 7.5,
    quantity: 395,
    unitOfMeasure: UnitOfMeasure.g,
    unitPrice: 7.5 / 395,
  },
];

describe('ProductsPage', () => {
  beforeEach(() => {
    sonnerMocks.toastSuccessMock.mockClear();
    sonnerMocks.toastErrorMock.mockClear();
    productServiceMocks.getAllProductsMock.mockReset();
    productServiceMocks.createProductMock.mockReset();
    productServiceMocks.updateProductMock.mockReset();
    productServiceMocks.deleteProductMock.mockReset();
    productServiceMocks.getAllProductsMock.mockResolvedValue(baseProducts);
  });

  it('loads products and filters without accent sensitivity', async () => {
    render(<ProductsPage />);

    await screen.findByRole('cell', { name: 'Chocolate em po' });
    fireEvent.change(screen.getByRole('textbox', { name: 'Filtrar por Nome' }), {
      target: { value: 'po' },
    });

    expect(screen.getByRole('cell', { name: 'Chocolate em po' })).toBeInTheDocument();
    expect(screen.queryByRole('cell', { name: 'Leite condensado' })).not.toBeInTheDocument();
  });

  it('sorts rows when clicking a sortable column header', async () => {
    render(<ProductsPage />);

    await screen.findByRole('cell', { name: 'Chocolate em po' });
    fireEvent.click(screen.getByRole('button', { name: /Nome/ }));

    const rows = screen.getAllByRole('row');
    expect(within(rows[1]).getByRole('cell', { name: 'Chocolate em po' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Nome/ }));

    const sortedRows = screen.getAllByRole('row');
    expect(within(sortedRows[1]).getByRole('cell', { name: 'Leite condensado' })).toBeInTheDocument();
  });

  it('shows an error state and retries the fetch', async () => {
    productServiceMocks.getAllProductsMock
      .mockRejectedValueOnce({ message: 'Falha temporária' })
      .mockResolvedValueOnce(baseProducts);

    render(<ProductsPage />);

    expect(
      await screen.findByRole('alert'),
    ).toHaveTextContent('Falha temporária');

    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));

    expect(await screen.findByRole('cell', { name: 'Chocolate em po' })).toBeInTheDocument();
  });

  it('creates a product and shows the success toast', async () => {
    productServiceMocks.createProductMock.mockResolvedValue(undefined);
    productServiceMocks.getAllProductsMock
      .mockResolvedValueOnce(baseProducts)
      .mockResolvedValueOnce([
        ...baseProducts,
        {
          id: 'product-3',
          name: 'Acucar refinado',
          price: 4.5,
          quantity: 1,
          unitOfMeasure: UnitOfMeasure.un,
          unitPrice: 4.5,
        },
      ]);

    render(<ProductsPage />);

    await screen.findByRole('cell', { name: 'Chocolate em po' });
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Nome' }), {
      target: { value: 'Acucar refinado' },
    });
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Quantidade' }), {
      target: { value: '1' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: 'Preço' }), {
      target: { value: '450' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() =>
      expect(productServiceMocks.createProductMock).toHaveBeenCalledWith({
        name: 'Acucar refinado',
        quantity: 1,
        price: 4.5,
        unitOfMeasure: UnitOfMeasure.un,
      }),
    );
    expect(await screen.findByRole('cell', { name: 'Acucar refinado' })).toBeInTheDocument();
    expect(sonnerMocks.toastSuccessMock).toHaveBeenCalledWith('Matéria Prima criada com sucesso!');
  });

  it('blocks invalid product submission and shows the error toast', async () => {
    render(<ProductsPage />);

    await screen.findByRole('cell', { name: 'Chocolate em po' });
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(sonnerMocks.toastErrorMock).toHaveBeenCalledWith(
      'Preencha nome, quantidade e preço com valores válidos.',
    );
    expect(screen.getByRole('dialog', { name: 'Adicionar Matéria Prima' })).toBeInTheDocument();
  });

  it('edits and deletes a product through the service flow', async () => {
    productServiceMocks.updateProductMock.mockResolvedValue(undefined);
    productServiceMocks.deleteProductMock.mockResolvedValue(undefined);
    productServiceMocks.getAllProductsMock
      .mockResolvedValueOnce(baseProducts)
      .mockResolvedValueOnce([
        {
          ...baseProducts[0],
          name: 'Chocolate 50%',
        },
        baseProducts[1],
      ])
      .mockResolvedValueOnce([baseProducts[1]]);

    render(<ProductsPage />);

    const chocolateRow = await screen.findByRole('row', {
      name: /Chocolate em po/,
    });
    fireEvent.click(within(chocolateRow).getByRole('button', { name: 'Editar' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Nome' }), {
      target: { value: 'Chocolate 50%' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() =>
      expect(productServiceMocks.updateProductMock).toHaveBeenCalledWith('product-1', {
        name: 'Chocolate 50%',
        quantity: 1,
        price: 18.9,
        unitOfMeasure: UnitOfMeasure.kg,
      }),
    );
    expect(await screen.findByRole('cell', { name: 'Chocolate 50%' })).toBeInTheDocument();
    expect(sonnerMocks.toastSuccessMock).toHaveBeenCalledWith('Matéria Prima salvo com sucesso!');

    const updatedRow = screen.getByRole('row', {
      name: /Chocolate 50%/,
    });
    fireEvent.click(within(updatedRow).getByRole('button', { name: 'Excluir' }));
    const deleteDialog = screen.getByRole('dialog', { name: 'Excluir Matéria Prima' });
    fireEvent.click(within(deleteDialog).getByRole('button', { name: 'Excluir' }));

    await waitFor(() =>
      expect(productServiceMocks.deleteProductMock).toHaveBeenCalledWith('product-1'),
    );
    await waitFor(() =>
      expect(screen.queryByRole('cell', { name: 'Chocolate 50%' })).not.toBeInTheDocument(),
    );
    expect(sonnerMocks.toastSuccessMock).toHaveBeenCalledWith('Matéria Prima excluída com sucesso!');
  });
});
