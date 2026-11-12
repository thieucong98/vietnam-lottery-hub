import React from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { KenoAndMax3DView } from '../features/keno-3d/KenoAndMax3DView';
import { fromSlug, KENO_VIEW_SLUGS, paths } from '../app/routes';
import { useAppNavigation } from '../app/navigation';
import { useSummary } from './useSummary';
import { TabFallback } from './TabFallback';

/** Keno, Max 3D, Max 3D Pro. URL: `/keno-3d`, `/keno-3d/max-3d`, `/keno-3d/max-3d-pro` */
export default function KenoPage() {
  const { view: slug } = useParams();
  const navigate = useNavigate();
  const nav = useAppNavigation();
  const view = fromSlug(KENO_VIEW_SLUGS, slug);
  const summary = useSummary();

  if (!view) return <Navigate to={paths.keno()} replace />;
  if (!summary.data) return <TabFallback />;
  return (
    <KenoAndMax3DView
      latestKeno={summary.data.vietlott_keno_latest}
      latest3D={summary.data.vietlott_3d_latest}
      latest3DPro={summary.data.vietlott_3d_pro_latest}
      onSelectNumber={(n) => nav.openNumber(n, 'xsmb')}
      view={view}
      onViewChange={(next) => navigate(paths.keno(next), { replace: true })}
    />
  );
}
