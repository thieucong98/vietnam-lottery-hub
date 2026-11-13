import { useMemo } from 'react';
import { useDataset } from '../../data/useData';
import type { TicketGame } from '../../utils/myTickets';
import type { DrawLookup } from './evaluate';

/**
 * Tải kết quả kỳ quay cho các trò chơi cần dò: XSMB 365 kỳ (~54 KB), Power/Mega toàn bộ lịch sử (~100 KB mỗi trò).
 * Chỉ tải trò chơi có trong `games`.
 */
export function useDrawLookup(games: Iterable<TicketGame>): { lookup: DrawLookup; error: boolean } {
  const need = new Set(games);
  const xsmb = useDataset('xsmbDraws', need.has('xsmb'));
  const v655 = useDataset('vietlott655Draws', need.has('vietlott_655'));
  const v645 = useDataset('vietlott645Draws', need.has('vietlott_645'));
  const lookup = useMemo<DrawLookup>(
    () => ({ xsmb: xsmb.data, vietlott_655: v655.data?.draws ?? null, vietlott_645: v645.data?.draws ?? null }),
    [xsmb.data, v655.data, v645.data]
  );
  return { lookup, error: Boolean(xsmb.error || v655.error || v645.error) };
}
