import React from 'react';
import { Link } from 'react-router-dom';
import styles from './pages.module.css';

export default function NotFoundPage() {
  return (
    <div className={`glass-card ${styles.notice}`} role="alert">
      Không tìm thấy trang này. <Link to="/">Về trang chủ</Link>
    </div>
  );
}
