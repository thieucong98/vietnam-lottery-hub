import { useCallback, useState } from 'react';

/**
 * State dùng được cả hai chế độ: có `value` thì do cha (URL) điều khiển,
 * không có thì tự giữ trong component. Dùng cho tab con của các màn hình.
 */
export function useControllableState<T>(value: T | undefined, onChange: ((next: T) => void) | undefined, initial: T) {
  const [local, setLocal] = useState<T>(initial);
  const controlled = value !== undefined;
  const current = controlled ? value : local;
  const set = useCallback(
    (next: T) => {
      if (!controlled) setLocal(next);
      onChange?.(next);
    },
    [controlled, onChange]
  );
  return [current, set] as const;
}
