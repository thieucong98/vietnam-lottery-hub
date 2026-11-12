import React, { useId } from 'react';
import clsx from 'clsx';
import { X } from 'lucide-react';
import styles from './Modal.module.css';
import { useDialogBehavior } from './useDialogBehavior';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  /** Biểu tượng cạnh tiêu đề */
  icon?: React.ReactNode;
  /** Thanh công cụ ngay dưới tiêu đề (ví dụ Tabs) */
  toolbar?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ open, onClose, title, subtitle, icon, toolbar, size = 'lg', children }) => {
  const titleId = useId();
  const dialogRef = useDialogBehavior<HTMLDivElement>(open, onClose);
  if (!open) return null;

  return (
    <div
      className={styles.overlay}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={clsx(styles.dialog, styles[size])}
      >
        <div className={styles.header}>
          <div className={styles.heading}>
            {icon}
            <div>
              <h2 id={titleId} className={styles.title}>
                {title}
              </h2>
              {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
            </div>
          </div>
          <button type="button" className={styles.close} onClick={onClose} aria-label="Đóng">
            <X size={20} />
          </button>
        </div>
        {toolbar && <div className={styles.toolbar}>{toolbar}</div>}
        <div className={styles.body}>{children}</div>
      </div>
    </div>
  );
};
