export interface NumberAppearance {
  date: string;
  prizes: string[];
  hits: number;
  is_special?: boolean;
  id?: string;
  result?: number[];
}

export interface PairCompanion {
  number: string;
  co_count: number;
}

export interface NumberDetail {
  number: string;
  total_hits: number;
  special_hits?: number;
  first_seen_date?: string | null;
  last_seen_date: string | null;
  days_since_last: number;
  max_gap_historical: number;
  average_gap: number;
  freq_30d: number;
  freq_60d?: number;
  freq_100d: number;
  freq_365d?: number;
  is_gan?: boolean;
  gan_risk_gauge: number;
  top_pairs?: PairCompanion[];
  yearly_distribution?: Record<string, number>;
  recent_history: NumberAppearance[];
}

export interface XienPairResult {
  num1: string;
  num2: string;
  total_co_hits: number;
  last_co_date: string | null;
  days_since_last_co: number;
  dates: string[];
}

export interface TopGanItem {
  number: string;
  days_since: number;
  last_date: string | null;
  max_gap: number;
}

export interface TopFreqItem {
  number: string;
  freq_100d?: number;
  total_hits: number;
}

export interface LatestDrawXSMB {
  date: string;
  raw_prizes: Record<string, any>;
  loto_numbers: string[];
  heads: Record<string, number[]>;
  tails: Record<string, number[]>;
}

export interface LatestDrawVietlott {
  date: string;
  id: string;
  result: number[];
  jackpot1?: string | number;
  jackpot2?: string | number;
}

export interface LatestDraw3D {
  date: string;
  id: string;
  result: Record<string, string[]>;
}

export interface LatestDrawKeno {
  date: string;
  id: string;
  result: number[];
  big_small?: string;
  odd_even?: string;
}

export interface SummaryData {
  xsmb_latest?: LatestDrawXSMB;
  vietlott_655_latest?: LatestDrawVietlott;
  vietlott_645_latest?: LatestDrawVietlott;
  vietlott_3d_latest?: LatestDraw3D;
  vietlott_3d_pro_latest?: LatestDraw3D;
  vietlott_keno_latest?: LatestDrawKeno;
  generated_at?: string;
}

export interface LotteryIndexData {
  product?: string;
  metadata: {
    latest_date: string;
    total_draws: number;
    generated_at?: string;
    max_number?: number;
    latest_id?: string;
  };
  latest_draw: LatestDrawXSMB | LatestDrawVietlott;
  top_gan: TopGanItem[];
  top_frequent: TopFreqItem[];
  numbers: Record<string, NumberDetail>;
}

export interface MLPrediction {
  name: string;
  predicted_numbers: string[];
  description: string;
}

export interface BacktestItem {
  strategy_name: string;
  test_draws: number;
  average_matches: number;
  max_match_in_one_draw: number;
  hit_rate_at_least_3: string;
  hit_rate_at_least_4: string;
}

export interface MLInsightsData {
  product: string;
  latest_id: string;
  latest_date: string;
  predictions: MLPrediction[];
  backtest_report: BacktestItem[];
}

export interface BacNhoFollower {
  number: string;
  hits: number;
  rate: number;
  days_since_last: number;
}

export interface BacNhoItem {
  number?: string;
  special_number?: string;
  total_triggers: number;
  top_followers: BacNhoFollower[];
}

export interface BacNhoData {
  metadata: {
    generated_at: string;
    latest_date: string;
    latest_special_2d: string;
    total_draws_analyzed: number;
  };
  by_loto: Record<string, BacNhoItem>;
  by_special: Record<string, BacNhoItem>;
}
