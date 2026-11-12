import React from 'react';
import clsx from 'clsx';
import { Info } from 'lucide-react';
import styles from './ChartNote.module.css';

export const DEFAULT_CHART_WARNING =
  'Thống kê mô tả dữ liệu lịch sử. Các kỳ quay độc lập, nên biểu đồ không cho biết trước kết quả kỳ sau và không làm tăng xác suất trúng.';

export interface ChartNoteProps {
  /** Cỡ mẫu, ví dụ "1.422 kỳ (01/08/2017 - 10/11/2026)" */
  sample: React.ReactNode;
  /** Cảnh báo riêng; mặc định là DEFAULT_CHART_WARNING */
  warning?: React.ReactNode;
  className?: string;
}

/** Chú thích bắt buộc dưới mọi biểu đồ: cỡ mẫu và cảnh báo */
export const ChartNote: React.FC<ChartNoteProps> = ({ sample, warning = DEFAULT_CHART_WARNING, className }) => (
  <p className={clsx(styles.note, className)}>
    <Info size={13} className={styles.icon} aria-hidden />
    <span>
      <strong>Cỡ mẫu:</strong> {sample}. {warning}
    </span>
  </p>
);
