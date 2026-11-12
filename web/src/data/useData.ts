import { useCallback, useEffect, useState } from 'react';
import { loadJson, peekJson } from './api';
import { DATASETS, DatasetKey, DatasetMap } from './datasets';

export interface DataState<T> {
  data: T | null;
  error: Error | null;
  loading: boolean;
  /** Tải lại sau khi lỗi (lỗi mạng không bị cache, xem api.ts) */
  retry: () => void;
}

/**
 * Tải một file JSON khi component cần. Truyền url = null để chưa tải.
 * Dữ liệu đã tải được trả ngay ở lần render đầu (không hiện trạng thái tải thừa).
 */
export function useJson<T>(url: string | null, parse?: (raw: unknown) => T, cacheKey?: string): DataState<T> {
  const key = url ? cacheKey ?? url : null;
  const [state, setState] = useState<{ key: string | null; data: T | null; error: Error | null }>(() => ({
    key,
    data: key ? peekJson<T>(key) ?? null : null,
    error: null,
  }));
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  useEffect(() => {
    if (!url || !key) return;
    const cached = peekJson<T>(key);
    if (cached !== undefined) {
      setState({ key, data: cached, error: null });
      return;
    }
    let active = true;
    setState({ key, data: null, error: null });
    loadJson<T>(url, parse, key).then(
      (data) => active && setState({ key, data, error: null }),
      (error: Error) => active && setState({ key, data: null, error })
    );
    return () => {
      active = false;
    };
    // parse là hàm thuần gắn với cacheKey, không cần theo dõi
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, key, attempt]);

  // Khi key vừa đổi, state còn của key cũ: dùng cache nếu có, nếu không coi như đang tải
  if (state.key !== key) {
    const cached = key ? peekJson<T>(key) : undefined;
    return { data: cached ?? null, error: null, loading: Boolean(key) && cached === undefined, retry };
  }
  return { data: state.data, error: state.error, loading: Boolean(key) && state.data === null && state.error === null, retry };
}

/** Tải một dataset theo tên (xem data/datasets.ts). enabled = false để hoãn. */
export function useDataset<K extends DatasetKey>(name: K, enabled: boolean = true): DataState<DatasetMap[K]> {
  const spec = DATASETS[name];
  return useJson<DatasetMap[K]>(enabled ? spec.url : null, spec.parse as ((raw: unknown) => DatasetMap[K]) | undefined, `dataset:${name}`);
}
