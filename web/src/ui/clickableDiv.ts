import type { KeyboardEvent } from 'react';

/**
 * Props để biến một <div onClick> thành phần tử bấm được bằng bàn phím
 * (Tab tới, Enter/Space để kích hoạt) mà không cần đổi sang <button>.
 * Dùng khi div cần giữ layout/CSS hiện có (ví dụ bóng số dạng inline-flex).
 *
 * Không đặt aria-label: nội dung hiển thị bên trong div (số, thống kê...) đã đủ làm
 * tên truy cập; đặt thêm aria-label ngắn hơn sẽ che mất phần nội dung đó với trình đọc
 * màn hình và vi phạm WCAG 2.5.3 (Label in Name) khi nội dung hiển thị nhiều hơn nhãn.
 */
export function clickableDivProps(onClick: () => void) {
  return {
    role: 'button' as const,
    tabIndex: 0,
    onClick,
    onKeyDown: (e: KeyboardEvent<HTMLElement>) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onClick();
      }
    },
  };
}
