import React from 'react';
import styles from './pages.module.css';

/** Khung chờ khi đang tải mã của một màn hình hoặc một khối nặng */
export const TabFallback: React.FC<{ label?: string }> = ({ label = 'Đang tải...' }) => (
  <div className={`glass-card animate-fade-in ${styles.fallback}`} role="status" aria-label={label}>
    <div className={`lottery-ball ball-gold ${styles.fallbackBall}`}>88</div>
    <div className={`skeleton-box ${styles.fallbackLine}`} />
    <div className={`skeleton-box ${styles.fallbackLineShort}`} />
  </div>
);

export const LoadError: React.FC<{ what: string }> = ({ what }) => (
  <div className={`glass-card ${styles.notice}`} role="alert">
    Không tải được {what}. Kiểm tra kết nối mạng rồi tải lại trang.
  </div>
);
