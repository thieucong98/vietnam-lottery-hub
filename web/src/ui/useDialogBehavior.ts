import { useEffect, useRef } from 'react';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Các hộp thoại đang mở. Hộp thoại trên cùng (layer cao nhất, cùng layer thì mở sau) nhận Esc và Tab.
interface OpenDialog {
  layer: number;
}
const openDialogs: OpenDialog[] = [];

function topDialog(): OpenDialog | undefined {
  let top: OpenDialog | undefined;
  for (const d of openDialogs) if (!top || d.layer >= top.layer) top = d;
  return top;
}
// Khóa cuộn dùng chung: chỉ trả lại overflow cũ khi hộp thoại cuối cùng đóng
let scrollLocks = 0;
let savedOverflow = '';

function lockScroll() {
  if (scrollLocks++ === 0) {
    savedOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }
}

function unlockScroll() {
  if (--scrollLocks === 0) document.body.style.overflow = savedOverflow;
}

/**
 * Hành vi chung của Modal/Sheet: Esc đóng, Tab không ra khỏi hộp thoại, khóa cuộn trang nền,
 * đưa focus vào hộp thoại khi mở và trả focus về phần tử đã mở nó khi đóng.
 */
export interface DialogBehaviorOptions {
  /** Thứ tự hiển thị, nên bằng z-index của lớp phủ (Modal 100, cổng 18+ 105, pháp lý 110) */
  layer?: number;
}

export function useDialogBehavior<T extends HTMLElement>(open: boolean, onClose: () => void, { layer = 100 }: DialogBehaviorOptions = {}) {
  const ref = useRef<T | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Ghi lại phần tử đang có focus ngay lúc render mở, trước khi React gắn autoFocus vào ô nhập bên trong
  const previousFocus = useRef<HTMLElement | null>(null);
  const wasOpen = useRef(false);
  if (open && !wasOpen.current && typeof document !== 'undefined') {
    previousFocus.current = document.activeElement as HTMLElement | null;
  }
  wasOpen.current = open;

  useEffect(() => {
    if (!open) return;
    const token: OpenDialog = { layer };
    openDialogs.push(token);
    const isTop = () => topDialog() === token;
    lockScroll();
    if (isTop() && ref.current && !ref.current.contains(document.activeElement)) ref.current.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isTop()) return;
      if (e.key === 'Escape') {
        onCloseRef.current();
        return;
      }
      const dialog = ref.current;
      if (e.key !== 'Tab' || !dialog) return;
      const items = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.getClientRects().length > 0);
      if (items.length === 0) {
        e.preventDefault();
        dialog.focus();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      const outside = !dialog.contains(active);
      if (e.shiftKey && (outside || active === first || active === dialog)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (outside || active === last)) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    const opener = previousFocus.current;
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      const i = openDialogs.indexOf(token);
      if (i !== -1) openDialogs.splice(i, 1);
      unlockScroll();
      if (opener && opener.isConnected) opener.focus();
    };
  }, [open, layer]);

  return ref;
}
