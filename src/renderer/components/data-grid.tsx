import type React from 'react';
import { useId, useState } from 'react';

import { normalizeString } from '../utils/string';

type SortDirection = 'asc' | 'desc';

export type DataGridColumn<T> = {
  key: string;
  header: string;
  sortable?: boolean;
  render: (item: T) => React.ReactNode;
  sortValue?: (item: T) => string | number;
};

type DataGridProps<T> = {
  data: T[];
  columns: DataGridColumn<T>[];
  filterLabel: string;
  filterPlaceholder: string;
  toolbarContent?: React.ReactNode;
  getFilterValue?: (item: T) => string;
  getRowKey: (item: T) => string;
  emptyMessage: string;
};

const compareValues = (left: string | number, right: string | number, direction: SortDirection): number => {
  const normalizedLeft = typeof left === 'string' ? normalizeString(left) : left;
  const normalizedRight = typeof right === 'string' ? normalizeString(right) : right;

  if (normalizedLeft === normalizedRight) {
    return 0;
  }

  if (direction === 'asc') {
    return normalizedLeft > normalizedRight ? 1 : -1;
  }

  return normalizedLeft < normalizedRight ? 1 : -1;
};

export const DataGrid = <T,>({
  data,
  columns,
  filterLabel,
  filterPlaceholder,
  toolbarContent,
  getFilterValue,
  getRowKey,
  emptyMessage,
}: DataGridProps<T>): React.JSX.Element => {
  const filterId = useId();
  const [filter, setFilter] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const normalizedFilter = normalizeString(filter);
  const filteredData = normalizedFilter.length
    ? data.filter((item) => {
        const rawValue = getFilterValue ? getFilterValue(item) : '';
        return normalizeString(rawValue).includes(normalizedFilter);
      })
    : data;

  const sortedData = [...filteredData];
  if (sortColumn) {
    const activeColumn = columns.find((column) => column.key === sortColumn);
    if (activeColumn?.sortValue) {
      sortedData.sort((left, right) =>
        compareValues(activeColumn.sortValue(left), activeColumn.sortValue(right), sortDirection),
      );
    }
  }

  const handleSort = (column: DataGridColumn<T>) => {
    if (!column.sortable) {
      return;
    }

    if (sortColumn !== column.key) {
      setSortColumn(column.key);
      setSortDirection('asc');
      return;
    }

    setSortDirection((currentDirection) => (currentDirection === 'asc' ? 'desc' : 'asc'));
  };

  return (
    <section className="data-grid" aria-label="Lista de registros">
      <div className="data-grid__toolbar">
        <label className="data-grid__filter" htmlFor={filterId}>
          <span className="data-grid__filter-label">{filterLabel}</span>
          <input
            id={filterId}
            className="data-grid__filter-input"
            name={filterId}
            type="text"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            placeholder={filterPlaceholder}
          />
        </label>
        {toolbarContent}
      </div>

      <div className="data-grid__table-wrapper">
        <table className="data-grid__table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.key} scope="col">
                  {column.sortable ? (
                    <button
                      type="button"
                      className="data-grid__sort-button"
                      onClick={() => handleSort(column)}
                    >
                      <span>{column.header}</span>
                      <span className="data-grid__sort-indicator" aria-hidden="true">
                        {sortColumn === column.key ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}
                      </span>
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedData.length ? (
              sortedData.map((item) => (
                <tr key={getRowKey(item)}>
                  {columns.map((column) => (
                    <td key={column.key}>{column.render(item)}</td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td className="data-grid__empty-cell" colSpan={columns.length}>
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};
