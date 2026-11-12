import React from 'react';
import { Calendar } from 'lucide-react';
import { Card } from '../ui';
import styles from './DrawScheduleWidget.module.css';

interface ScheduleRow {
  label: string;
  days: string;
  time: string;
}

const SCHEDULE: ScheduleRow[] = [
  { label: 'XSMB', days: 'Hằng ngày', time: '18:15' },
  { label: 'Power 6/55', days: 'Thứ 3, Thứ 5, Thứ 7', time: '18:00 - 18:30' },
  { label: 'Mega 6/45', days: 'Thứ 4, Thứ 6, Chủ Nhật', time: '18:00 - 18:30' },
  { label: 'Max 3D', days: 'Thứ 2, Thứ 4, Thứ 6', time: '18:00' },
  { label: 'Max 3D Pro', days: 'Thứ 3, Thứ 5, Thứ 7', time: '18:00' },
  { label: 'Keno', days: 'Hằng ngày, liên tục', time: '06:00 - 21:50 (mỗi 10 phút)' },
];

/** Lịch quay các sản phẩm xổ số kiến thiết và Vietlott (giờ Việt Nam). */
export const DrawScheduleWidget: React.FC = () => (
  <Card icon={<Calendar size={18} color="var(--accent-cyan)" />} title="Lịch Quay Số (Giờ Việt Nam)">
    <div className={styles.grid}>
      {SCHEDULE.map((row) => (
        <div key={row.label} className={styles.row}>
          <span className={styles.label}>{row.label}</span>
          <span className={styles.days}>{row.days}</span>
          <span className={styles.time}>{row.time}</span>
        </div>
      ))}
    </div>
    <p className={styles.hint}>Thời gian mang tính tham khảo, có thể lệch vài phút theo thông báo chính thức.</p>
  </Card>
);
