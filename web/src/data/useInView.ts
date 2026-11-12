import { useCallback, useEffect, useState } from 'react';

/**
 * true khi phần tử đã (từng) xuất hiện gần khung nhìn. Dùng để tải dữ liệu của khối nằm dưới màn hình đầu.
 * Trả về callback ref để vẫn theo dõi được khi phần tử chỉ được gắn sau lần render đầu (vd. sau skeleton).
 */
export function useInView<T extends Element>(rootMargin = '200px') {
  const [element, setElement] = useState<T | null>(null);
  const [inView, setInView] = useState(false);
  const ref = useCallback((node: T | null) => setElement(node), []);
  useEffect(() => {
    if (inView || !element) return;
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) setInView(true);
      },
      { rootMargin }
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [element, inView, rootMargin]);
  return [ref, inView] as const;
}
