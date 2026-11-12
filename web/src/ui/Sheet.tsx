import React, { useId, useRef } from 'react';
import { X } from 'lucide-react';
import styles from './Sheet.module.css';
import { useDialogBehavior } from './useDialogBehavior';

export interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

/** Bảng trượt từ đáy màn hình, dùng cho menu và bộ lọc trên di động. */
export const Sheet: React.FC<SheetProps> = ({ open, onClose, title, subtitle, children, className }) => {
  const titleId = useId();
  const panelRef = useDialogBehavior<HTMLDivElement>(open, onClose);
  // Chỉ đóng khi bấm cả xuống và lên trên nền (kéo chọn chữ trong bảng ra ngoài không đóng)
  const pressedOverlay = useRef(false);
  if (!open) return null;

  return (
    <div
      className={`${styles.overlay} ${className ?? ''}`}
      onMouseDown={(e) => {
        pressedOverlay.current = e.target === e.currentTarget;
      }}
      onClick={(e) => {
        if (pressedOverlay.current && e.target === e.currentTarget) onClose();
        pressedOverlay.current = false;
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={styles.panel}
      >
        <div className={styles.header}>
          <div>
            <h3 id={titleId} className={styles.title}>
              {title}
            </h3>
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          </div>
          <button type="button" className={styles.close} onClick={onClose} aria-label="Đóng">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};
