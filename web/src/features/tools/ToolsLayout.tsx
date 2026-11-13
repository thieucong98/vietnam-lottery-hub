import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarClock, HeartHandshake, ListChecks, Search, Ticket } from 'lucide-react';
import { Tabs } from '../../ui';
import { ToolId, TOOL_PATHS } from '../../app/routes';
import styles from './tools.module.css';

const TOOL_TABS: { id: ToolId; label: string; icon: React.ReactNode }[] = [
  { id: 'check', label: 'Dò vé', icon: <ListChecks size={15} /> },
  { id: 'my_tickets', label: 'Vé của tôi', icon: <Ticket size={15} /> },
  { id: 'schedule', label: 'Lịch quay & Jackpot', icon: <CalendarClock size={15} /> },
  { id: 'results', label: 'Tra cứu kỳ', icon: <Search size={15} /> },
  { id: 'budget', label: 'Chơi có trách nhiệm', icon: <HeartHandshake size={15} /> },
];

/** Khung chung của các trang tiện ích: tiêu đề, thanh chuyển công cụ */
export const ToolsLayout: React.FC<{ active: ToolId; title: string; intro: React.ReactNode; children: React.ReactNode }> = ({
  active,
  title,
  intro,
  children,
}) => {
  const navigate = useNavigate();
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.tabsScroll}>
          <Tabs<ToolId> ariaLabel="Công cụ tiện ích" value={active} onChange={(id) => navigate(TOOL_PATHS[id])} items={TOOL_TABS} />
        </div>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.intro}>{intro}</p>
      </div>
      {children}
    </div>
  );
};

/** Ô chọn trò chơi dùng chung */
export const GameSelect: React.FC<{
  id: string;
  value: string;
  onChange: (v: 'xsmb' | 'vietlott_655' | 'vietlott_645') => void;
}> = ({ id, value, onChange }) => (
  <select id={id} className={styles.select} value={value} onChange={(e) => onChange(e.target.value as 'xsmb')}>
    <option value="xsmb">XSKT miền Bắc (vé 5 số)</option>
    <option value="vietlott_655">Vietlott Power 6/55</option>
    <option value="vietlott_645">Vietlott Mega 6/45</option>
  </select>
);
