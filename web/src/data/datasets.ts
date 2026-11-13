import {
  BacNhoData,
  JackpotData,
  LotteryIndexData,
  MLInsightsData,
  NumberAppearance,
  NumberDetail,
  SummaryData,
  VietlottCooccurrenceData,
  VietlottHistoricalDraw,
  XSMBHistoricalDraw,
} from '../types';
import { bundleUrl, dataUrl } from './api';
import { decodeXsmbDraws } from './xsmbDraws';

export type LotteryGame = 'xsmb' | 'vietlott_655' | 'vietlott_645';
export type VietlottGame = Exclude<LotteryGame, 'xsmb'>;

export interface VietlottDrawsData {
  metadata: { generated_at?: string; total: number };
  draws: VietlottHistoricalDraw[];
}

/** Kiểu dữ liệu của từng dataset tải theo màn hình */
export interface DatasetMap {
  summary: SummaryData;
  mlInsights: MLInsightsData;
  bacNho: BacNhoData;
  cooccurrence: VietlottCooccurrenceData;
  xsmbStats: LotteryIndexData;
  vietlott655Stats: LotteryIndexData;
  vietlott645Stats: LotteryIndexData;
  xsmbDrawsRecent: XSMBHistoricalDraw[];
  xsmbDraws: XSMBHistoricalDraw[];
  vietlott655Draws: VietlottDrawsData;
  vietlott645Draws: VietlottDrawsData;
  jackpot: JackpotData;
}

export type DatasetKey = keyof DatasetMap;

interface DatasetSpec<T> {
  url: string;
  parse?: (raw: unknown) => T;
}

export const DATASETS: { [K in DatasetKey]: DatasetSpec<DatasetMap[K]> } = {
  summary: { url: dataUrl('summary.json') },
  mlInsights: { url: dataUrl('ml_insights.json') },
  bacNho: { url: dataUrl('bac_nho.json') },
  cooccurrence: { url: dataUrl('vietlott_cooccurrence.json') },
  xsmbStats: { url: bundleUrl('xsmb_stats.json') },
  vietlott655Stats: { url: bundleUrl('vietlott_655_stats.json') },
  vietlott645Stats: { url: bundleUrl('vietlott_645_stats.json') },
  xsmbDrawsRecent: { url: bundleUrl('xsmb_draws_recent.json'), parse: decodeXsmbDraws },
  xsmbDraws: { url: bundleUrl('xsmb_draws.json'), parse: decodeXsmbDraws },
  vietlott655Draws: { url: bundleUrl('vietlott_655_draws.json') },
  vietlott645Draws: { url: bundleUrl('vietlott_645_draws.json') },
  jackpot: { url: dataUrl('jackpot.json') },
};

export const STATS_DATASET: Record<LotteryGame, DatasetKey & `${string}Stats`> = {
  xsmb: 'xsmbStats',
  vietlott_655: 'vietlott655Stats',
  vietlott_645: 'vietlott645Stats',
};

export const DRAWS_DATASET: Record<VietlottGame, 'vietlott655Draws' | 'vietlott645Draws'> = {
  vietlott_655: 'vietlott655Draws',
  vietlott_645: 'vietlott645Draws',
};

/** Thống kê đầy đủ của một số (tải khi mở màn hình tra cứu số đó) */
export const numberDetailUrl = (game: LotteryGame, num: string) => bundleUrl(`detail/${game}/${num}.json`);
/** Toàn bộ lịch sử xuất hiện của một số */
export const numberHistoryUrl = (game: LotteryGame, num: string) => dataUrl(`history/${game}/${num}.json`);

export type { NumberDetail, NumberAppearance };
