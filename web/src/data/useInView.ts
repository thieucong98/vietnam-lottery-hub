import { useEffect, useRef, useState } from 'react';

/** true khi phần tử đã (từng) xuất hiện gần khung nhìn. Dùng để tải dữ liệu của khối nằm dưới màn hình đầu. */
export function useInView<T extends Element>(rootMargin = '200px') {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    if (inView || !ref.current) return;
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
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [inView, rootMargin]);
  return [ref, inView] as const;
}
