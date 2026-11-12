import React, { useId } from 'react';
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
  if (!open) return null;

  return (
    <div className={`${styles.overlay} ${className ?? ''}`} onClick={onClose}>
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={styles.panel}
        onClick={(e) => e.stopPropagation()}
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
