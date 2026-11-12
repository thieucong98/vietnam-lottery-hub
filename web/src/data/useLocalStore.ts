import { useCallback, useEffect, useState } from 'react';

/**
 * State lưu trong localStorage của trình duyệt (không gửi đi đâu). Đồng bộ giữa các component trong cùng tab
 * và giữa các tab. Dữ liệu đọc ra luôn qua hàm `sanitize` để dữ liệu hỏng không làm hỏng trang.
 */
const CHANGE_EVENT = 'vlh-local-store';

function read<T>(key: string, sanitize: (raw: unknown) => T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return sanitize(raw === null ? null : JSON.parse(raw));
  } catch {
    return sanitize(null);
  }
}

export interface LocalStore<T> {
  value: T;
  set: (next: T | ((prev: T) => T)) => void;
  /** false khi trình duyệt chặn localStorage (chế độ riêng tư...): dữ liệu chỉ giữ trong phiên */
  persistent: boolean;
}

export function useLocalStore<T>(key: string, sanitize: (raw: unknown) => T): LocalStore<T> {
  const [value, setValue] = useState<T>(() => read(key, sanitize));
  const [persistent, setPersistent] = useState(true);

  useEffect(() => {
    const reload = (e: Event) => {
      if (e instanceof StorageEvent && e.key !== null && e.key !== key) return;
      if (e instanceof CustomEvent && e.detail !== key) return;
      setValue(read(key, sanitize));
    };
    window.addEventListener('storage', reload);
    window.addEventListener(CHANGE_EVENT, reload);
    return () => {
      window.removeEventListener('storage', reload);
      window.removeEventListener(CHANGE_EVENT, reload);
    };
    // sanitize là hàm thuần gắn với key
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved = typeof next === 'function' ? (next as (p: T) => T)(prev) : next;
        try {
          window.localStorage.setItem(key, JSON.stringify(resolved));
          setPersistent(true);
          // Báo cho component khác trong cùng tab (sự kiện storage chỉ bắn ở tab khác)
          queueMicrotask(() => window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: key })));
        } catch {
          setPersistent(false);
        }
        return resolved;
      });
    },
    [key]
  );

  return { value, set, persistent };
}

/** Xóa hẳn một khóa (nút "Xóa dữ liệu trên máy này") */
export function clearLocalStore(key: string) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // bỏ qua
  }
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: key }));
}

// Khóa localStorage của các tính năng (tiền tố vlh_ như cổng 18+)
export const MY_TICKETS_KEY = 'vlh_my_tickets_v1';
export const BUDGET_KEY = 'vlh_budget_v1';
