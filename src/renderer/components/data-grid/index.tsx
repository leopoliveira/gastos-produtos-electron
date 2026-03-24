import type React from 'react';
import { useId, useState } from 'react';

import { normalizeString } from '../../../shared/string';
import styles from './data-grid.module.css';
import ui from '../../styles/shared-ui.module.css';

type SortDirection = 'asc' | 'desc';

export type DataGridColumn<T> = {
  key: string;
  header: string;
  sortable?: boolean;
  render: (item: T) => React.ReactNode;
  sortValue?: (item: T) => string | number;
};

type DataGridProps<T> = {
  title: string;
  data: T[];
  columns: DataGridColumn<T>[];
  filterLabel?: string;
  filterPlaceholder?: string;
  toolbarContent?: React.ReactNode;
  actionsRenderer?: (item: T) => React.ReactNode;
  addLabel?: string;
  getFilterValue?: (item: T) => string;
  onAdd?: () => void;
  getRowKey: (item: T) => string;
  emptyMessage?: string;
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
  title,
  data,
  columns,
  filterLabel = 'Filtrar',
  filterPlaceholder = 'Digite para buscar',
  toolbarContent,
  actionsRenderer,
  addLabel = 'Adicionar',
  getFilterValue,
  onAdd,
  getRowKey,
  emptyMessage = 'Nenhum registro encontrado.',
}: DataGridProps<T>): React.JSX.Element => {
  const filterId = useId();
  const [filter, setFilter] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const resolvedColumns = actionsRenderer
    ? [
        ...columns,
        {
          key: '__actions',
          header: 'Ações',
          render: actionsRenderer,
        } satisfies DataGridColumn<T>,
      ]
    : columns;

  const normalizedFilter = normalizeString(filter);
  const filteredData = normalizedFilter.length
    ? data.filter((item) => {
        const rawValue = getFilterValue ? getFilterValue(item) : '';
        return normalizeString(rawValue).includes(normalizedFilter);
      })
    : data;

  const sortedData = [...filteredData];
  if (sortColumn) {
    const activeColumn = resolvedColumns.find((column) => column.key === sortColumn);
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
    <section className={styles.dataGrid} aria-label="Lista de registros">
      <div className={styles.header}>
        <p className={styles.title}>{title}</p>
        {onAdd ? (
          <button
            type="button"
            className={`${ui.primaryButton} ${styles.addButton}`}
            onClick={onAdd}
          >
            {addLabel}
          </button>
        ) : null}
      </div>

      <div className={styles.toolbar}>
        <label className={styles.filter} htmlFor={filterId}>
          <span className={styles.filterLabel}>{filterLabel}</span>
          <input
            id={filterId}
            className={styles.filterInput}
            name={filterId}
            type="text"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            placeholder={filterPlaceholder}
          />
        </label>
        {toolbarContent}
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              {resolvedColumns.map((column) => (
                <th key={column.key} scope="col">
                  {column.sortable ? (
                    <button
                      type="button"
                      className={styles.sortButton}
                      onClick={() => handleSort(column)}
                    >
                      <span>{column.header}</span>
                      <span className={styles.sortIndicator} aria-hidden="true">
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
                  {resolvedColumns.map((column) => (
                    <td key={column.key}>{column.render(item)}</td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td className={styles.emptyCell} colSpan={resolvedColumns.length}>
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
