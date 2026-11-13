import React, { useEffect, useMemo, useState } from 'react';
import { CalendarClock, ExternalLink, Trophy } from 'lucide-react';
import { Card, Table } from '../ui';
import { ToolsLayout } from '../features/tools/ToolsLayout';
import { useDataset } from '../data/useData';
import {
  countdownTo,
  DRAW_SCHEDULES,
  formatCountdown,
  formatDrawClock,
  formatDrawDays,
  formatVnDate,
  nextDrawTime,
  ScheduledGame,
  upcomingDrawDates,
  vnDateString,
} from '../utils/drawSchedule';
import { formatVND } from '../utils/lotteryUtils';
import { VIETLOTT_JACKPOT_ODDS } from '../utils/vietlottTicket';
import { VIETLOTT_PRIZE_VALUES } from '../utils/ticketCheck';
import type { JackpotRecord } from '../types';
import styles from '../features/tools/tools.module.css';

const GAMES: ScheduledGame[] = ['xsmb', 'vietlott_655', 'vietlott_645', 'max3d', 'max3d_pro'];

/** Đồng hồ cập nhật mỗi giây (dừng khi tab bị ẩn để tiết kiệm pin) */
function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    let id: number | undefined;
    const start = () => {
      setNow(new Date());
      id = window.setInterval(() => setNow(new Date()), intervalMs);
    };
    const stop = () => window.clearInterval(id);
    const onVisibility = () => (document.hidden ? stop() : start());
    start();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [intervalMs]);
  return now;
}

const formatBillion = (v: number) => `${(v / 1_000_000_000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} tỷ`;

const JackpotCard: React.FC<{ game: 'vietlott_655' | 'vietlott_645'; history: JackpotRecord[] | undefined; loading: boolean }> = ({
  game,
  history,
  loading,
}) => {
  const latest = history?.[0];
  const recent = useMemo(() => (history ?? []).slice(0, 60).reverse(), [history]);
  const max = Math.max(1, ...recent.map((r) => r.jackpot1));
  const label = game === 'vietlott_655' ? 'Power 6/55' : 'Mega 6/45';
  return (
    <Card title={`Jackpot ${label}`} icon={<Trophy size={16} color="var(--accent-gold)" />}>
      <div className={styles.stack}>
        {latest ? (
          <>
            <div>
              <div className={styles.statLabel}>Jackpot 1 kỳ #{latest.id} ({formatVnDate(latest.date)})</div>
              <div className={styles.statValue}>{formatVND(latest.jackpot1)}</div>
              {game === 'vietlott_655' && latest.jackpot2 != null && (
                <div className={styles.small}>Jackpot 2: {formatVND(latest.jackpot2)}</div>
              )}
            </div>
            {recent.length > 1 && (
              <figure>
                <div className={styles.bars} role="img" aria-label={`Giá trị Jackpot 1 của ${recent.length} kỳ gần nhất, cao nhất ${formatBillion(max)}`}>
                  {recent.map((r) => (
                    <div
                      key={r.id}
                      className={styles.bar}
                      style={{ '--h': `${Math.max(4, (r.jackpot1 / max) * 100)}%` } as React.CSSProperties}
                      title={`#${r.id} ${r.date}: ${formatVND(r.jackpot1)}`}
                    />
                  ))}
                </div>
                <figcaption className={styles.hint}>Giá trị Jackpot 1 của {recent.length} kỳ gần nhất (cũ bên trái, mới bên phải).</figcaption>
              </figure>
            )}
            <Table
              caption={`Lịch sử Jackpot ${label}`}
              maxHeight={240}
              rows={(history ?? []).slice(0, 30)}
              rowKey={(r) => r.id}
              columns={[
                { key: 'id', header: 'Kỳ', mono: true, render: (r) => `#${r.id}` },
                { key: 'date', header: 'Ngày', mono: true, render: (r) => r.date },
                { key: 'jp1', header: 'Jackpot 1', align: 'right', render: (r) => formatVND(r.jackpot1) },
                ...(game === 'vietlott_655'
                  ? [{ key: 'jp2', header: 'Jackpot 2', align: 'right' as const, render: (r: JackpotRecord) => (r.jackpot2 != null ? formatVND(r.jackpot2) : '-') }]
                  : []),
              ]}
            />
          </>
        ) : (
          <div className={styles.notice}>
            {loading
              ? 'Đang tải giá trị Jackpot...'
              : 'Chưa có dữ liệu giá trị Jackpot (nguồn vietlott.vn có thể chặn truy cập tự động). Xem giá trị hiện tại trên trang chính thức.'}{' '}
            Jackpot 1 khởi điểm: {formatBillion(VIETLOTT_PRIZE_VALUES[game].jackpot1)} đồng.
          </div>
        )}
        <div className={styles.small}>
          Xác suất một vé 6 số trúng Jackpot 1: <strong>{VIETLOTT_JACKPOT_ODDS[game]}</strong>, không đổi dù Jackpot lớn hay nhỏ. Jackpot lớn
          thường có nhiều người mua hơn nên khả năng phải chia giải cũng cao hơn.
        </div>
        <a className={styles.small} href={`https://vietlott.vn/vi/trung-thuong/ket-qua-trung-thuong/${game === 'vietlott_655' ? '655' : '645'}`} target="_blank" rel="noopener noreferrer">
          Kết quả và Jackpot chính thức trên vietlott.vn <ExternalLink size={12} />
        </a>
      </div>
    </Card>
  );
};

/** Lịch quay, đếm ngược và Jackpot. URL: /lich-quay */
export default function SchedulePage() {
  const now = useNow();
  const jackpot = useDataset('jackpot');
  const today = vnDateString(now);

  return (
    <ToolsLayout
      active="schedule"
      title="Lịch quay & Jackpot"
      intro="Giờ quay theo giờ Việt Nam. Lịch có thể thay đổi vào dịp Tết hoặc khi đơn vị phát hành thông báo; đối chiếu với thông báo chính thức của đơn vị phát hành."
    >
      <Card title="Kỳ quay sắp tới" icon={<CalendarClock size={16} />}>
        <div className={styles.grid3}>
          {GAMES.map((g) => {
            const next = nextDrawTime(g, now);
            const nextDate = vnDateString(next);
            return (
              <div key={g} className={styles.item} data-testid={`countdown-${g}`}>
                <div className={styles.itemTitle}>{DRAW_SCHEDULES[g].label}</div>
                <div className={styles.countdown} aria-live="off">
                  {formatCountdown(countdownTo(next, now))}
                </div>
                <div className={styles.small}>
                  {nextDate === today ? 'Hôm nay' : formatVnDate(nextDate)} lúc {formatDrawClock(g)}
                </div>
                <div className={styles.hint}>
                  {formatDrawDays(g)}, {formatDrawClock(g)}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <div className={styles.grid2}>
        <JackpotCard game="vietlott_655" history={jackpot.data?.vietlott_655.history} loading={jackpot.loading} />
        <JackpotCard game="vietlott_645" history={jackpot.data?.vietlott_645.history} loading={jackpot.loading} />
      </div>

      <Card title="Lịch 14 ngày tới">
        <Table
          caption="Lịch quay 14 ngày tới"
          rows={Array.from({ length: 14 }, (_, i) => upcomingDrawDates('xsmb', today, 14)[i])}
          rowKey={(d) => d}
          columns={[
            { key: 'date', header: 'Ngày', render: (d) => formatVnDate(d) },
            {
              key: 'games',
              header: 'Kỳ quay',
              render: (d) =>
                GAMES.filter((g) => upcomingDrawDates(g, d, 1)[0] === d)
                  .map((g) => DRAW_SCHEDULES[g].label)
                  .join(', '),
            },
          ]}
        />
      </Card>
    </ToolsLayout>
  );
}
