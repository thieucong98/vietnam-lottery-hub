import React from 'react';
import clsx from 'clsx';
import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'gradient' | 'secondary' | 'ghost' | 'gold' | 'emerald' | 'cyan' | 'link';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Biểu tượng đặt trước nhãn (thường là icon lucide-react) */
  icon?: React.ReactNode;
  /** Chiếm toàn bộ chiều ngang */
  block?: boolean;
  /** Bo tròn hoàn toàn */
  pill?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'secondary', size = 'md', icon, block, pill, className, children, type = 'button', ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      className={clsx(
        styles.button,
        styles[variant],
        variant !== 'link' && styles[size],
        block && styles.block,
        pill && styles.pill,
        className
      )}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
});
