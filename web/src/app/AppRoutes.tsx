import React, { Suspense, lazy } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { TabFallback } from '../pages/TabFallback';
import { getBackgroundLocation, useAppNavigation } from './navigation';
import { isOverlayPath, LookupTarget, lookupPath, parseLookupLocation } from './routes';

// Mỗi màn hình là một chunk riêng, chỉ tải khi vào URL tương ứng
const XsmbPage = lazy(() => import('../pages/XsmbPage'));
const VietlottPage = lazy(() => import('../pages/VietlottPage'));
const KenoPage = lazy(() => import('../pages/KenoPage'));
const HeatmapPage = lazy(() => import('../pages/HeatmapPage'));
const GanPage = lazy(() => import('../pages/GanPage'));
const BacNhoPage = lazy(() => import('../pages/BacNhoPage'));
const FilterPage = lazy(() => import('../pages/FilterPage'));
const AiPage = lazy(() => import('../pages/AiPage'));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'));
const LegalComplianceModal = lazy(() =>
  import('../components/LegalComplianceModal').then((m) => ({ default: m.LegalComplianceModal }))
);
const InstantLookupModal = lazy(() =>
  import('../features/lookup/InstantLookupModal').then((m) => ({ default: m.InstantLookupModal }))
);

/** Các trang. Khi đang mở hộp thoại, hiển thị trang phía sau (hoặc trang chủ nếu mở thẳng link hộp thoại). */
export const PageRoutes: React.FC = () => {
  const location = useLocation();
  const background = getBackgroundLocation(location);
  const pageLocation = isOverlayPath(location.pathname) ? background ?? { ...location, pathname: '/', search: '' } : location;

  return (
    <Suspense fallback={<TabFallback />}>
      <Routes location={pageLocation}>
        <Route path="/" element={<XsmbPage />} />
        <Route path="/xsmb" element={<Navigate to="/" replace />} />
        <Route path="/xsmb/:date" element={<XsmbPage />} />
        <Route path="/vietlott" element={<Navigate to="/vietlott/655" replace />} />
        <Route path="/vietlott/655/:tool?" element={<VietlottPage game="vietlott_655" />} />
        <Route path="/vietlott/645/:tool?" element={<VietlottPage game="vietlott_645" />} />
        <Route path="/keno-3d/:view?" element={<KenoPage />} />
        <Route path="/nhiet" element={<HeatmapPage />} />
        <Route path="/gan" element={<GanPage />} />
        <Route path="/bac-nho" element={<BacNhoPage />} />
        <Route path="/loc-ve/:view?" element={<FilterPage />} />
        <Route path="/thuat-toan" element={<AiPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
};

/** Hộp thoại có URL riêng: /so/68, /tra-cuu/bo-so?game=655&so=..., /tra-cuu/cap?..., /phap-ly */
export const OverlayRoutes: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const nav = useAppNavigation();

  if (location.pathname === '/phap-ly') {
    return (
      <Suspense fallback={null}>
        <LegalComplianceModal isOpen onClose={nav.closeOverlay} />
      </Suspense>
    );
  }

  const target = parseLookupLocation(location.pathname, new URLSearchParams(location.search));
  if (!target) return null;

  const onChangeTarget = (next: LookupTarget) => navigate(lookupPath(next), { replace: true, state: location.state });
  return (
    <Suspense fallback={null}>
      <InstantLookupModal target={target} onChangeTarget={onChangeTarget} onClose={nav.closeOverlay} />
    </Suspense>
  );
};
