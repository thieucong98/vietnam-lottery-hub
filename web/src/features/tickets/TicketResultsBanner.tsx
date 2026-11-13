import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Ticket } from 'lucide-react';
import { Button } from '../../ui';
import { paths, TOOL_PATHS } from '../../app/routes';
import { unseenResults } from '../../utils/myTickets';
import type { SummaryData } from '../../types';
import { useLatestDates, useMyTickets } from './useMyTickets';
import styles from './TicketResultsBanner.module.css';

/**
 * Nhắc khi vé đã lưu có kết quả mới. Chỉ dùng summary.json đã tải sẵn, không tải thêm dữ liệu;
 * việc dò chi tiết diễn ra khi mở "Vé của tôi".
 */
export const TicketResultsBanner: React.FC<{ summary: SummaryData | null | undefined }> = ({ summary }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const latest = useLatestDates(summary);
  const { value: tickets } = useMyTickets();
  if (!summary || location.pathname === TOOL_PATHS.my_tickets) return null;
  const pending = unseenResults(tickets, latest);
  if (!pending.length) return null;
  return (
    <div className={styles.banner} role="status" data-testid="ticket-results-banner">
      <span>
        <Ticket size={15} /> {pending.length} vé đã lưu vừa có kết quả kỳ quay.
      </span>
      <Button size="sm" variant="emerald" onClick={() => navigate(paths.myTickets())}>
        Xem kết quả
      </Button>
    </div>
  );
};
