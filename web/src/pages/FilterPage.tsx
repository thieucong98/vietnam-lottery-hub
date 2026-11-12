import React from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { SmartFilterAndChecker } from '../features/ticket-filter/SmartFilterAndChecker';
import { useDataset } from '../data/useData';
import { useAppNavigation } from '../app/navigation';
import { FILTER_VIEW_SLUGS, fromSlug, paths } from '../app/routes';
import { useSummary } from './useSummary';

/** Bộ lọc vé Vietlott và thống kê nhiều số XSMB. URL: `/loc-ve`, `/loc-ve/xsmb` */
export default function FilterPage() {
  const { view: slug } = useParams();
  const navigate = useNavigate();
  const nav = useAppNavigation();
  const view = fromSlug(FILTER_VIEW_SLUGS, slug);
  const summary = useSummary();
  const isVietlott = view === 'vietlott_filter';
  const v655 = useDataset('vietlott655Stats', isVietlott);
  const v645 = useDataset('vietlott645Stats', isVietlott);
  const cooccurrence = useDataset('cooccurrence', isVietlott);

  if (!view) return <Navigate to={paths.filter()} replace />;
  return (
    <SmartFilterAndChecker
      latestXsmb={summary.data?.xsmb_latest}
      vietlott655Data={v655.data}
      vietlott645Data={v645.data}
      cooccurrenceData={cooccurrence.data}
      onSelectNumber={(n) => nav.openNumber(n, 'xsmb')}
      onSwitchToVietlottCombo={(balls, product) =>
        navigate(paths.vietlott(product === '655' ? 'vietlott_655' : 'vietlott_645', 'combo_bao', balls))
      }
      view={view}
      onViewChange={(next) => navigate(paths.filter(next), { replace: true })}
    />
  );
}
