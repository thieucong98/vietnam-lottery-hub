import React from 'react';
import styles from './BarChart.module.css';

export interface BarChartProps {
  labels: string[];
  observed: number[];
  /** Giá trị kỳ vọng nếu kết quả hoàn toàn ngẫu nhiên (vẽ thành vạch) */
  expected?: number[];
  /** Mô tả cho trình đọc màn hình */
  ariaLabel: string;
  height?: number;
  formatValue?: (v: number) => string;
  /** Tô đậm một cột (ví dụ cột chứa giá trị của thuật toán) */
  highlightIndex?: number;
}

/** Biểu đồ cột quan sát so với kỳ vọng. Có bảng ẩn cho trình đọc màn hình. */
export const BarChart: React.FC<BarChartProps> = ({ labels, observed, expected, ariaLabel, height = 160, formatValue = (v) => v.toLocaleString('vi-VN'), highlightIndex }) => {
  const max = Math.max(1, ...observed, ...(expected ?? []));
  return (
    <figure className={styles.figure}>
      <div className={styles.plot} style={{ height }} aria-hidden>
        {labels.map((label, i) => (
          <div key={label} className={styles.col} title={`${label}: ${formatValue(observed[i])}${expected ? ` (kỳ vọng ${formatValue(expected[i])})` : ''}`}>
            <div className={styles.track}>
              <div className={i === highlightIndex ? `${styles.bar} ${styles.highlight}` : styles.bar} style={{ height: `${(observed[i] / max) * 100}%` }} />
              {expected && <div className={styles.expected} style={{ bottom: `${(expected[i] / max) * 100}%` }} />}
            </div>
            <span className={styles.label}>{label}</span>
          </div>
        ))}
      </div>
      {expected && (
        <figcaption className={styles.legend} aria-hidden>
          <span><i className={styles.swatchBar} /> Quan sát</span>
          <span><i className={styles.swatchExpected} /> Kỳ vọng nếu hoàn toàn ngẫu nhiên</span>
        </figcaption>
      )}
      <table className={styles.srOnly}>
        <caption>{ariaLabel}</caption>
        <thead>
          <tr><th>Nhóm</th><th>Quan sát</th>{expected && <th>Kỳ vọng</th>}</tr>
        </thead>
        <tbody>
          {labels.map((label, i) => (
            <tr key={label}><td>{label}</td><td>{formatValue(observed[i])}</td>{expected && <td>{formatValue(expected[i])}</td>}</tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
};
