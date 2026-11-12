/**
 * Tải JSON tĩnh có cache trong bộ nhớ. Mỗi URL chỉ tải một lần cho cả phiên;
 * lỗi mạng không bị cache để lần sau thử lại.
 */
const pending = new Map<string, Promise<unknown>>();
const resolved = new Map<string, unknown>();

/** File JSON do engine xuất ra trong public/data */
export const dataUrl = (file: string) => `./data/${file}`;
/** Gói dữ liệu gọn sinh lúc build (web/build/dataBundles.ts) */
export const bundleUrl = (file: string) => `./bundles/${file}`;

export function peekJson<T>(cacheKey: string): T | undefined {
  return resolved.get(cacheKey) as T | undefined;
}

export function loadJson<T>(url: string, parse?: (raw: unknown) => T, cacheKey: string = url): Promise<T> {
  let p = pending.get(cacheKey);
  if (!p) {
    p = fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status} khi tải ${url}`);
        return res.json();
      })
      .then((raw) => {
        const value = parse ? parse(raw) : raw;
        resolved.set(cacheKey, value);
        return value;
      });
    p.catch(() => pending.delete(cacheKey));
    pending.set(cacheKey, p);
  }
  return p as Promise<T>;
}

/** Chỉ dùng trong test */
export function clearJsonCache() {
  pending.clear();
  resolved.clear();
}
