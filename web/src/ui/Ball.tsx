import React from 'react';
import clsx from 'clsx';
import styles from './Ball.module.css';
import { formatBallNumber } from '../utils/lotteryUtils';

/** 3D: dùng class toàn cục .lottery-ball .ball-*; flat-*: bóng phẳng trong bảng */
export type BallTone =
  | 'gold'
  | 'red'
  | 'emerald'
  | 'cyan'
  | 'slate'
  | 'jackpot2'
  | 'flat-muted'
  | 'flat-dim'
  | 'flat-gold'
  | 'flat-special'
  | 'flat-special-hit'
  | 'flat-selected';

export interface BallProps {
  value: number | string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  tone?: BallTone;
  onClick?: () => void;
  title?: string;
  className?: string;
  /** Nội dung thay cho số (ví dụ icon) */
  children?: React.ReactNode;
}

export const Ball: React.FC<BallProps> = ({ value, size = 'md', tone = 'gold', onClick, title, className, children }) => {
  const is3d = !tone.startsWith('flat-');
  const classes = clsx(
    styles.ball,
    styles[size],
    is3d ? ['lottery-ball', `ball-${tone}`] : styles[tone],
    className
  );
  const label = typeof value === 'number' ? formatBallNumber(value) : value;
  if (onClick) {
    return (
      <button type="button" className={classes} onClick={onClick} title={title} aria-label={title ?? `Số ${label}`}>
        {children ?? label}
      </button>
    );
  }
  return (
    <span className={classes} title={title}>
      {children ?? label}
    </span>
  );
};
