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

export interface CoOccurrencePairResult {
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

export interface XSMBHistoricalDraw {
  date: string;
  day_of_week: string;
  province: string;
  special: string;
  special_2d: string;
  prize1: string;
  raw_prizes: Record<string, any>;
  loto_numbers: string[];
  heads: Record<string, number[]>;
  tails: Record<string, number[]>;
  silent_heads: number[];
  silent_tails: number[];
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
  xsmb_top_gan?: TopGanItem[];
  xsmb_top_frequent?: TopFreqItem[];
  vietlott_655_latest?: LatestDrawVietlott;
  vietlott_655_top_gan?: TopGanItem[];
  vietlott_645_latest?: LatestDrawVietlott;
  vietlott_645_top_gan?: TopGanItem[];
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

export interface MLSampleSet {
  name: string;
  sample_picks: string[];
  description: string;
}

export interface BacktestStrategyRow {
  strategy_name: string;
  average_matches: number;
  total_matches: number;
  max_match_in_one_draw: number;
  /** Tỷ lệ 0-1 */
  hit_rate_at_least_3: number;
  hit_rate_at_least_4: number;
  /** P(chọn ngẫu nhiên đạt tổng số trùng >= thuật toán) */
  p_value: number;
}

export interface BacktestRun {
  test_draws: number;
  simulations: number;
  expected_average: number;
  random: {
    mean_average: number;
    low_95: number;
    high_95: number;
    histogram: { average_matches: number[]; counts: number[] };
  };
  strategies: BacktestStrategyRow[];
}

// ml_insights.json schema v3 (engine/ml/render_insights.py)
export interface MLInsightsData {
  schema_version: number;
  product: string;
  latest_id: string;
  latest_date: string;
  disclaimer: string;
  jackpot_odds: string;
  sample_sets: MLSampleSet[];
  backtests: BacktestRun[];
}

export interface BacNhoFollower {
  number: string;
  hits: number;
  /** Phần trăm 0-100 */
  rate: number;
  ci_low: number;
  ci_high: number;
  /** Tần suất nền (phần trăm): tỷ lệ ngày có số này, không cần điều kiện */
  base_rate: number;
  /** p-value nhị thức so với nền, đã nhân số phép so sánh (Bonferroni) */
  p_value_adjusted: number;
  days_since_last: number;
}

// ---------- stats_report.json (engine/analytics/transparency.py) ----------

export interface StatTest {
  statistic: number;
  df?: number;
  p_value: number;
}

export interface StatHistogram {
  labels: string[];
  observed: number[];
  expected: number[];
}

export interface FrequencyStats {
  draws: number;
  trials: number;
  trial_unit: string;
  expected_rate: number;
  from?: string;
  numbers: { number: string; hits: number; rate: number; ci_low: number; ci_high: number }[];
  outside_ci: number;
  expected_outside_ci: number;
  chi_square: StatTest;
}

export interface GameStatsReport {
  name: string;
  numbers_range: [string, string];
  draw_size: number;
  model: string;
  jackpot_odds: string | null;
  sample: { draws: number; from: string; to: string };
  frequency: FrequencyStats;
  frequency_recent: FrequencyStats;
  gaps: {
    presence_rate: number;
    expected_mean_gap: number;
    observed_mean_gap: number | null;
    gap_count: number;
    histogram: StatHistogram;
    chi_square: StatTest;
    numbers: { number: string; mean_gap: number | null; max_gap: number | null; current_gap: number; prob_current_gap: number; runs_p: number }[];
    longest_current: { number: string; gap: number; prob_any_number: number };
    runs_per_number: { tested: number; below_0_05: number; expected_below_0_05: number };
  };
  sums: {
    draws: number;
    expected_mean: number;
    observed_mean: number;
    mean_ci_low: number;
    mean_ci_high: number;
    histogram: StatHistogram;
    chi_square: StatTest;
    runs_test: StatTest;
  };
  parity: {
    draws: number;
    histogram: StatHistogram;
    even_share: number;
    even_share_ci_low: number;
    even_share_ci_high: number;
    expected_even_share: number;
    chi_square: StatTest;
  };
}

export type StatsGameKey = 'vietlott_655' | 'vietlott_645' | 'xsmb';

export interface StatsReportData {
  schema_version: number;
  generated_at: string;
  disclaimer: string;
  recent_window: number;
  games: Record<StatsGameKey, GameStatsReport>;
}

export interface BacNhoItem {
  number?: string;
  special_number?: string;
  total_triggers: number;
  top_followers: BacNhoFollower[];
}

// bac_nho.json schema v2 (engine/analytics/bac_nho_analyzer.py)
export interface BacNhoData {
  schema_version: number;
  disclaimer: string;
  metadata: {
    generated_at: string;
    latest_date: string;
    latest_special_2d: string;
    total_draws_analyzed: number;
    /** Số ngày dùng để tính tần suất nền */
    base_sample: number;
  };
  by_loto: Record<string, BacNhoItem>;
  by_special: Record<string, BacNhoItem>;
}

export interface VietlottHistoricalDraw {
  id: string;
  date: string;
  balls: number[];
  special?: number | null;
}

export interface VietlottFullDrawsData {
  metadata: {
    generated_at: string;
    total_655: number;
    total_645: number;
  };
  vietlott_655: VietlottHistoricalDraw[];
  vietlott_645: VietlottHistoricalDraw[];
}

export interface VietlottCooccurrenceItem {
  numbers: string[];
  hits: number;
  rate: number;
  last_seen: {
    date: string;
    id: string;
  };
}

export interface VietlottCooccurrenceData {
  metadata: {
    generated_at: string;
  };
  vietlott_655: {
    top_pairs: VietlottCooccurrenceItem[];
    top_triplets: VietlottCooccurrenceItem[];
  };
  vietlott_645: {
    top_pairs: VietlottCooccurrenceItem[];
    top_triplets: VietlottCooccurrenceItem[];
  };
}
