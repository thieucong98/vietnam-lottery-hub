import { useCallback, useMemo } from 'react';
import { Location, useLocation, useNavigate } from 'react-router-dom';
import type { LotteryGame } from '../data/datasets';
import { isOverlayPath, LookupTarget, lookupPath, lookupTargetFromText, paths, TAB_PATHS, TabId } from './routes';

/** State gắn vào URL của hộp thoại: trang nằm phía sau hộp thoại */
export interface OverlayState {
  backgroundLocation: Location | null;
}

export function getBackgroundLocation(location: Location): Location | null | undefined {
  return (location.state as OverlayState | null)?.backgroundLocation;
}

export function useAppNavigation() {
  const navigate = useNavigate();
  const location = useLocation();

  const openOverlay = useCallback(
    (to: string) => {
      const inOverlay = isOverlayPath(location.pathname);
      // Đang ở trong hộp thoại: thay URL tại chỗ, giữ nguyên trang phía sau
      const backgroundLocation = inOverlay ? getBackgroundLocation(location) ?? null : location;
      navigate(to, { replace: inOverlay, state: { backgroundLocation } satisfies OverlayState });
    },
    [location, navigate]
  );

  const closeOverlay = useCallback(() => {
    if (getBackgroundLocation(location)) navigate(-1);
    else navigate(paths.home(), { replace: true });
  }, [location, navigate]);

  return useMemo(
    () => ({
      goTab: (tab: TabId) => navigate(TAB_PATHS[tab]),
      openLookup: (target: LookupTarget) => openOverlay(lookupPath(target)),
      openNumber: (num: string, game: LotteryGame = 'xsmb') =>
        openOverlay(lookupPath({ mode: 'single', game, numbers: [num.padStart(2, '0')] })),
      openLookupText: (text: string, game: LotteryGame = 'xsmb') => openOverlay(lookupPath(lookupTargetFromText(text, game))),
      openSearch: (game: LotteryGame = 'xsmb') => openOverlay(lookupPath({ mode: 'single', game, numbers: [] })),
      openLegal: () => openOverlay(paths.legal()),
      closeOverlay,
      isOverlayOpen: isOverlayPath(location.pathname),
    }),
    [navigate, openOverlay, closeOverlay, location.pathname]
  );
}
