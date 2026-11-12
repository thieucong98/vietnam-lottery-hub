import React from 'react';
import clsx from 'clsx';
import styles from './Card.module.css';

export interface CardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  padding?: 'none' | 'sm' | 'md' | 'lg';
  tone?: 'default' | 'gold' | 'red' | 'inset';
  /** Tiêu đề hiển thị ở đầu thẻ */
  title?: React.ReactNode;
  /** Biểu tượng cạnh tiêu đề */
  icon?: React.ReactNode;
  /** Vùng thao tác bên phải tiêu đề (nút, bộ lọc) */
  actions?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  padding = 'md',
  tone = 'default',
  title,
  icon,
  actions,
  className,
  children,
  ...rest
}) => (
  <div
    className={clsx(styles.card, styles[`pad-${padding}`], tone !== 'default' && styles[`tone-${tone}`], className)}
    {...rest}
  >
    {(title || actions) && (
      <div className={styles.header}>
        <div className={styles.title}>
          {icon}
          {title}
        </div>
        {actions}
      </div>
    )}
    {children}
  </div>
);
