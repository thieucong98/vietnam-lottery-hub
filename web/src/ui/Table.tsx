import React from 'react';
import clsx from 'clsx';
import styles from './Table.module.css';

export interface TableColumn<Row> {
  key: string;
  header: React.ReactNode;
  render: (row: Row, index: number) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
  /** Dùng font mono đậm (ngày, mã kỳ) */
  mono?: boolean;
}

export interface TableProps<Row> {
  columns: TableColumn<Row>[];
  rows: Row[];
  rowKey: (row: Row, index: number) => React.Key;
  emptyText?: React.ReactNode;
  /** Chiều cao tối đa (px) trước khi cuộn */
  maxHeight?: number;
  caption?: string;
}

export function Table<Row>({ columns, rows, rowKey, emptyText = 'Không có dữ liệu.', maxHeight, caption }: TableProps<Row>) {
  const cellClass = (c: TableColumn<Row>) =>
    clsx(c.mono && styles.mono, c.align === 'right' && styles.right, c.align === 'center' && styles.center);
  return (
    <div className={styles.wrap} style={maxHeight ? { maxHeight } : undefined}>
      <table className={styles.table}>
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} scope="col" className={cellClass(c)}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className={styles.empty}>
                {emptyText}
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr key={rowKey(row, i)}>
                {columns.map((c) => (
                  <td key={c.key} className={cellClass(c)}>
                    {c.render(row, i)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
