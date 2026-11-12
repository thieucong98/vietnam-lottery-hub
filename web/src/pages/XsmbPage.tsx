import React, { Suspense, lazy, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { LiveResultsBoard } from '../components/LiveResultsBoard';
import { UniversalQuickChecker } from '../components/UniversalQuickChecker';
import { BentoInsightsGrid } from '../components/BentoInsightsGrid';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { XSMBProductHub } from '../features/xsmb/XSMBProductHub';
import { useDataset } from '../data/useData';
import { useInView } from '../data/useInView';
import { useAppNavigation } from '../app/navigation';
import { paths, XSMB_DATE_PATTERN } from '../app/routes';
import { useSummary } from './useSummary';
import { LoadError, TabFallback } from './TabFallback';
import styles from './pages.module.css';

const HeatmapMatrix = lazy(() => import('../components/HeatmapMatrix').then((m) => ({ default: m.HeatmapMatrix })));

/** Trang chủ / XSMB. URL: `/` (kỳ mới nhất) hoặc `/xsmb/2026-11-11` */
export default function XsmbPage() {
  const { date } = useParams();
  const navigate = useNavigate();
  const nav = useAppNavigation();
  const selectedDate = date && XSMB_DATE_PATTERN.test(date) ? date : null;

  const summary = useSummary();
  const recent = useDataset('xsmbDrawsRecent');
  const [historyOpen, setHistoryOpen] = useState(false);
  const notInRecent = Boolean(selectedDate && recent.data && !recent.data.some((d) => d.date === selectedDate));
  // 365 kỳ chỉ tải khi mở tab Lịch Sử hoặc khi ngày trên URL nằm ngoài 30 kỳ gần nhất
  const full = useDataset('xsmbDraws', historyOpen || notInRecent);
  const draws = useMemo(() => full.data ?? recent.data ?? [], [full.data, recent.data]);

  const [mlRef, mlInView] = useInView<HTMLDivElement>();
  const ml = useDataset('mlInsights', mlInView);
  const [heatRef, heatInView] = useInView<HTMLDivElement>();
  const stats = useDataset('xsmbStats', heatInView);

  const latest = summary.data?.xsmb_latest;
  const found = selectedDate ? draws.find((d) => d.date === selectedDate) : undefined;
  const missingDate = Boolean(selectedDate && !found && (full.data || full.error));
  const activeDraw = found ?? latest;

  const availableDates = useMemo(() => draws.map((d) => d.date), [draws]);

  if (summary.error) return <LoadError what="kết quả mới nhất" />;
  if (!summary.data) return <SkeletonLoader />;

  return (
    <div className={styles.stack}>
      {missingDate && (
        <div className={`glass-card ${styles.notice} ${styles.noticeWarn}`} role="status">
          Không có dữ liệu kỳ {selectedDate} trong 365 kỳ gần nhất. Đang hiển thị kỳ mới nhất.
        </div>
      )}

      <XSMBProductHub
        summaryData={summary.data}
        historicalDraws={draws}
        onSelectNumber={(n) => nav.openNumber(n, 'xsmb')}
        onSelectHistoricalDraw={(draw) => {
          navigate(paths.xsmbDate(draw.date));
          document.getElementById('xsmb-live-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }}
        selectedDrawDate={activeDraw?.date}
        onTabChange={(tab) => tab === 'history' && setHistoryOpen(true)}
      />

      <UniversalQuickChecker summaryData={summary.data} onOpenDeepLookup={(text) => nav.openLookupText(text, 'xsmb')} />

      <LiveResultsBoard
        gameType="xsmb"
        drawData={activeDraw}
        onSelectNumber={(n) => nav.openNumber(n, 'xsmb')}
        latest3D={summary.data.vietlott_3d_latest}
        latestKeno={summary.data.vietlott_keno_latest}
        availableDates={availableDates}
        currentDate={activeDraw?.date}
        onNavigateDate={(d) => navigate(d === latest?.date ? paths.home() : paths.xsmbDate(d))}
        isHistorical={Boolean(found && found.date !== latest?.date)}
        onResetToLatest={() => navigate(paths.home())}
      />

      <div ref={mlRef}>
        <BentoInsightsGrid
          xsmbData={stats.data}
          summaryData={summary.data}
          mlData={ml.data}
          onSelectNumber={(n) => nav.openNumber(n, 'xsmb')}
          onViewAllGan={() => nav.goTab('gan')}
          onViewAllHeatmap={() => nav.goTab('heatmap')}
          onViewAI={() => nav.goTab('ai')}
        />
      </div>

      <div ref={heatRef} className={styles.lazyBlock}>
        {heatInView && (
          <Suspense fallback={<TabFallback />}>
            <HeatmapMatrix data={stats.data} onSelectNumber={(n) => nav.openNumber(n, 'xsmb')} />
          </Suspense>
        )}
      </div>
    </div>
  );
}
