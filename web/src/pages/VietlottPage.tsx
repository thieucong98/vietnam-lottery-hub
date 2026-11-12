import React, { Suspense, lazy } from 'react';
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { VietlottProductHub } from '../features/vietlott/VietlottProductHub';
import { DRAWS_DATASET, STATS_DATASET, VietlottGame } from '../data/datasets';
import { useDataset } from '../data/useData';
import { useIdle } from '../data/useIdle';
import { useInView } from '../data/useInView';
import { useAppNavigation } from '../app/navigation';
import { fromSlug, paths, VIETLOTT_TOOL_SLUGS } from '../app/routes';
import { parseNumberList } from '../utils/ticketCheck';
import { useSummary } from './useSummary';
import { TabFallback } from './TabFallback';
import styles from './pages.module.css';

const GanRankingView = lazy(() => import('../components/GanRankingView').then((m) => ({ default: m.GanRankingView })));

/** Power 6/55 và Mega 6/45. URL: `/vietlott/655`, `/vietlott/655/bo-so?so=03-11-16-22-35-41`, `/vietlott/645/lich-su` */
export default function VietlottPage({ game }: { game: VietlottGame }) {
  const { tool: toolSlug } = useParams();
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const nav = useAppNavigation();
  const tool = fromSlug(VIETLOTT_TOOL_SLUGS, toolSlug);
  const maxBall = game === 'vietlott_655' ? 55 : 45;
  // Vé Bao tối đa 18 bóng (6/55) hoặc 15 bóng (6/45), giống giới hạn khi bấm chọn trên bàn số
  const maxBao = game === 'vietlott_655' ? 18 : 15;
  const initialBalls = parseNumberList(search.get('so') ?? '', 1, maxBall).sort((a, b) => a - b).slice(0, maxBao);

  const summary = useSummary();
  const stats = useDataset(STATS_DATASET[game]);
  const idle = useIdle();
  // Lịch sử kỳ quay (~100 KB) tải khi trình duyệt rảnh hoặc ngay khi mở công cụ cần nó
  const draws = useDataset(DRAWS_DATASET[game], idle || (tool !== undefined && tool !== 'quick_pick'));
  const cooccurrence = useDataset('cooccurrence', tool === 'cooccurrence');
  const [ganRef, ganInView] = useInView<HTMLDivElement>();
  const xsmbStats = useDataset('xsmbStats', ganInView);

  if (!tool) return <Navigate to={paths.vietlott(game)} replace />;

  return (
    <div className={styles.stack}>
      <VietlottProductHub
        key={game}
        gameType={game}
        indexData={stats.data}
        historicalDraws={draws.data?.draws ?? []}
        cooccurrence={cooccurrence.data?.[game]}
        summaryData={summary.data}
        onSelectNumber={(n) => nav.openNumber(n, game)}
        tool={tool}
        onToolChange={(next) => navigate(paths.vietlott(game, next), { replace: true })}
        initialBalls={initialBalls}
      />

      <div ref={ganRef} className={styles.lazyBlock}>
        {ganInView && (
          <Suspense fallback={<TabFallback />}>
            <GanRankingView
              xsmbData={xsmbStats.data}
              vietlottData={stats.data}
              onSelectNumber={(n, source) => nav.openNumber(n, source === 'vietlott' ? game : 'xsmb')}
            />
          </Suspense>
        )}
      </div>
    </div>
  );
}
