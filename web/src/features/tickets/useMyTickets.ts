import { useMemo } from 'react';
import { MY_TICKETS_KEY, useLocalStore } from '../../data/useLocalStore';
import { LatestDates, sanitizeTickets } from '../../utils/myTickets';
import type { SummaryData } from '../../types';

/** Danh sách "Vé của tôi" trong localStorage */
export const useMyTickets = () => useLocalStore(MY_TICKETS_KEY, sanitizeTickets);

/** Ngày quay mới nhất có kết quả của từng trò chơi, đọc từ summary.json */
export function useLatestDates(summary: SummaryData | null | undefined): LatestDates {
  return useMemo(
    () => ({
      xsmb: summary?.xsmb_latest?.date,
      vietlott_655: summary?.vietlott_655_latest?.date,
      vietlott_645: summary?.vietlott_645_latest?.date,
    }),
    [summary]
  );
}
