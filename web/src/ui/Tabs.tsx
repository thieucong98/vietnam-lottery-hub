import React from 'react';
import clsx from 'clsx';
import styles from './Tabs.module.css';

export interface TabItem<T extends string> {
  id: T;
  label: React.ReactNode;
  icon?: React.ReactNode;
}

export interface TabsProps<T extends string> {
  items: TabItem<T>[];
  value: T;
  onChange: (id: T) => void;
  /** Nhãn cho trình đọc màn hình */
  ariaLabel: string;
  /** Các tab chia đều chiều ngang */
  fill?: boolean;
  className?: string;
}

export function Tabs<T extends string>({ items, value, onChange, ariaLabel, fill, className }: TabsProps<T>) {
  return (
    <div role="tablist" aria-label={ariaLabel} className={clsx(styles.list, fill && styles.fill, className)}>
      {items.map((item) => {
        const selected = item.id === value;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={selected}
            className={clsx(styles.tab, selected && styles.active)}
            onClick={() => onChange(item.id)}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
