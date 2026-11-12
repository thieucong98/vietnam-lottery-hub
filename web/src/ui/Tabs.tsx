import React, { useRef } from 'react';
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
  /** id của phần tử `role="tabpanel"` hiển thị nội dung tab đang chọn (xem tabId) */
  panelId?: string;
  /** Các tab chia đều chiều ngang */
  fill?: boolean;
  className?: string;
}

/** id của nút tab, để tabpanel đặt `aria-labelledby` */
export const tabId = (panelId: string, id: string) => `${panelId}-tab-${id}`;

/**
 * Mẫu ARIA tabs: chỉ tab đang chọn nằm trong thứ tự Tab; phím mũi tên trái/phải, Home, End
 * chuyển và chọn tab.
 */
export function Tabs<T extends string>({ items, value, onChange, ariaLabel, panelId, fill, className }: TabsProps<T>) {
  const listRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const index = items.findIndex((item) => item.id === value);
    let next = -1;
    if (e.key === 'ArrowRight') next = (index + 1) % items.length;
    else if (e.key === 'ArrowLeft') next = (index - 1 + items.length) % items.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = items.length - 1;
    if (next === -1) return;
    e.preventDefault();
    onChange(items[next].id);
    listRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus();
  };

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label={ariaLabel}
      className={clsx(styles.list, fill && styles.fill, className)}
      onKeyDown={handleKeyDown}
    >
      {items.map((item) => {
        const selected = item.id === value;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            id={panelId ? tabId(panelId, item.id) : undefined}
            aria-selected={selected}
            aria-controls={panelId}
            tabIndex={selected ? 0 : -1}
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
