import { useEffect, useState } from 'react';

/** Trả true sau khi trình duyệt rảnh lần đầu, để hoãn các tải dữ liệu không cần cho lần vẽ đầu tiên. */
export function useIdle(timeout = 2000): boolean {
  const [idle, setIdle] = useState(false);
  useEffect(() => {
    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(() => setIdle(true), { timeout });
      return () => window.cancelIdleCallback(id);
    }
    const id = window.setTimeout(() => setIdle(true), 300);
    return () => window.clearTimeout(id);
  }, [timeout]);
  return idle;
}
