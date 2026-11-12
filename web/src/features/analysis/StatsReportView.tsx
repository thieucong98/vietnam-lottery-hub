import React, { useMemo, useState } from 'react';
import { BarChart3, ShieldCheck } from 'lucide-react';
import { BarChart, ChartNote, Tabs } from '../../ui';
import type { FrequencyStats, GameStatsReport, StatsGameKey, StatsReportData } from '../../types';
import { formatDate, formatInt, formatNum, formatP, formatPct } from '../../utils/statsText';
import { Verdict } from './Verdict';
import styles from './analysis.module.css';

const GAME_TABS: { id: StatsGameKey; label: string }[] = [
  { id: 'vietlott_655', label: 'Power 6/55' },
  { id: 'vietlott_645', label: 'Mega 6/45' },
  { id: 'xsmb', label: 'XSMB' },
];

const sampleText = (g: GameStatsReport, draws = g.sample.draws, from = g.sample.from) =>
  `${formatInt(draws)} kỳ (${formatDate(from)} - ${formatDate(g.sample.to)})`;

/** Thanh khoảng tin cậy: vùng xanh là khoảng 95%, vạch trắng là tỷ lệ quan sát, vạch vàng là kỳ vọng */
const CiBar: React.FC<{ low: number; high: number; value: number; base: number; scaleMax: number }> = ({ low, high, value, base, scaleMax }) => {
  const pct = (x: number) => `${Math.min(100, (x / scaleMax) * 100)}%`;
  return (
    <div className={styles.ciBar} aria-hidden>
      <div className={styles.ciRange} style={{ left: pct(low), width: `calc(${pct(high)} - ${pct(low)})` }} />
      <div className={styles.ciPoint} style={{ left: pct(value) }} />
      <div className={styles.ciBase} style={{ left: pct(base) }} />
    </div>
  );
};

const FrequencyBlock: React.FC<{ game: GameStatsReport; freq: FrequencyStats; title: string; sample: string }> = ({ game, freq, title, sample }) => {
  const [showAll, setShowAll] = useState(false);
  const sorted = useMemo(() => [...freq.numbers].sort((a, b) => b.rate - a.rate), [freq.numbers]);
  const rows = showAll ? sorted : [...sorted.slice(0, 5), ...sorted.slice(-5)];
  const scaleMax = Math.max(...freq.numbers.map((n) => n.ci_high)) * 1.05;
  const unit = freq.trial_unit;
  return (
    <div className={`glass-card ${styles.card}`}>
      <h3 className={styles.h3}><BarChart3 size={18} color="var(--accent-cyan)" />{title}</h3>
      <p className={styles.muted}>
        Tỷ lệ = số lần về / số {unit}. Nếu mọi số có cùng khả năng, tỷ lệ kỳ vọng của mỗi số là <strong>{formatPct(freq.expected_rate, 2)}</strong>.
        Khoảng tin cậy 95% (Wilson) cho biết tỷ lệ thật có thể nằm ở đâu với cỡ mẫu này.
      </p>
      <div className={styles.kpis}>
        <div className={styles.kpi}>Số ngoài khoảng tin cậy<strong>{freq.outside_ci} / {freq.numbers.length}</strong></div>
        <div className={styles.kpi}>Kỳ vọng do ngẫu nhiên<strong>≈ {formatNum(freq.expected_outside_ci, 1)}</strong></div>
        <div className={styles.kpi}>Chi-square (df {freq.chi_square.df})<strong>{formatNum(freq.chi_square.statistic, 1)}</strong></div>
        <div className={styles.kpi}>p-value<strong>{formatP(freq.chi_square.p_value)}</strong></div>
      </div>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <caption className="sr-only">{title}</caption>
          <thead>
            <tr><th>Số</th><th>Số lần về</th><th>Tỷ lệ</th><th>Khoảng tin cậy 95%</th><th aria-hidden>So với kỳ vọng</th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.number}>
                <td className={styles.mono}><strong>{r.number}</strong></td>
                <td className={styles.mono}>{formatInt(r.hits)}</td>
                <td className={styles.mono}>{formatPct(r.rate, 2)}</td>
                <td className={styles.mono}>{formatPct(r.ci_low, 2)} - {formatPct(r.ci_high, 2)}</td>
                <td><CiBar low={r.ci_low} high={r.ci_high} value={r.rate} base={freq.expected_rate} scaleMax={scaleMax} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button type="button" className="tab-btn" style={{ marginTop: 10 }} onClick={() => setShowAll((v) => !v)}>
        {showAll ? 'Chỉ hiện 5 số cao nhất và 5 số thấp nhất' : `Hiện cả ${freq.numbers.length} số`}
      </button>
      <Verdict p={freq.chi_square.p_value} label="Kiểm định chi-square tần suất đồng đều" />
      <p className={styles.muted} style={{ marginTop: 8 }}>
        Luôn có số về nhiều hơn và số về ít hơn. Với {freq.numbers.length} số, khoảng {formatNum(freq.expected_outside_ci, 1)} số nằm ngoài khoảng tin cậy
        95% là bình thường, kể cả khi kết quả hoàn toàn ngẫu nhiên.{game.model === 'không hoàn lại' ? ' Kiểm định đã hiệu chỉnh cho việc mỗi kỳ quay 6 số khác nhau.' : ''}
      </p>
      <ChartNote sample={sample} />
    </div>
  );
};

export const StatsReportView: React.FC<{ data: StatsReportData | null; error?: Error | null }> = ({ data, error }) => {
  const [gameKey, setGameKey] = useState<StatsGameKey>('vietlott_655');

  if (error) return <div className={`glass-card ${styles.card}`}>Không tải được dữ liệu phân tích. Vui lòng thử lại sau.</div>;
  if (!data) return <div className={`glass-card ${styles.card}`} style={{ textAlign: 'center', color: 'var(--text-dim)' }}>Đang tải phân tích...</div>;

  const g = data.games[gameKey];
  const sample = sampleText(g);
  const isXsmb = gameKey === 'xsmb';
  const drawDesc = isXsmb ? '2 số cuối của 27 giải mỗi ngày (mỗi giải là một số 00-99 độc lập)' : `${g.draw_size} số khác nhau trong ${g.numbers_range[0]}-${g.numbers_range[1]} mỗi kỳ`;

  return (
    <div className={styles.stack}>
      <div className={`glass-card ${styles.intro}`}>
        <h2 className={styles.h2}><ShieldCheck size={24} color="var(--accent-emerald)" />Phân Tích Minh Bạch</h2>
        <p className={styles.lead}>
          Trang này so sánh dữ liệu đã quay với những gì một quá trình hoàn toàn ngẫu nhiên tạo ra. Mỗi bảng có cỡ mẫu, khoảng tin cậy và
          kiểm định thống kê kèm lời giải thích. Mục đích là để bạn tự thấy: các chênh lệch "số nóng", "số lâu chưa về" đều nằm trong mức dao
          động ngẫu nhiên thông thường. {data.disclaimer}
        </p>
        <div className={styles.tabs} style={{ marginTop: 14 }}>
          <Tabs<StatsGameKey> ariaLabel="Chọn loại xổ số" value={gameKey} onChange={setGameKey} items={GAME_TABS} />
        </div>
        <p className={styles.muted} style={{ marginTop: 10 }}>
          <strong>{g.name}</strong>: {drawDesc}. Mẫu phân tích: {sample}.
          {g.jackpot_odds && <> Xác suất trúng Jackpot{gameKey === 'vietlott_655' ? ' 1' : ''} của mọi bộ 6 số: <strong>{g.jackpot_odds}</strong>.</>}
        </p>
      </div>

      <FrequencyBlock game={g} freq={g.frequency} title="1. Tần suất từng số (toàn bộ lịch sử)" sample={sample} />
      <FrequencyBlock
        game={g}
        freq={g.frequency_recent}
        title={`Tần suất ${formatInt(g.frequency_recent.draws)} kỳ gần nhất`}
        sample={sampleText(g, g.frequency_recent.draws, g.frequency_recent.from ?? g.sample.from)}
      />

      <div className={`glass-card ${styles.card}`}>
        <h3 className={styles.h3}>2. Khoảng cách giữa các lần về</h3>
        <p className={styles.muted}>
          Khoảng cách = số kỳ liên tiếp một số vắng mặt trước khi về lại. Nếu ngẫu nhiên, mỗi kỳ một số có mặt với xác suất{' '}
          {formatPct(g.gaps.presence_rate)} bất kể nó đã vắng bao lâu, nên khoảng cách theo phân bố hình học với trung bình{' '}
          <strong>{formatNum(g.gaps.expected_mean_gap)} kỳ</strong>. Quan sát: <strong>{g.gaps.observed_mean_gap != null ? formatNum(g.gaps.observed_mean_gap) : '-'} kỳ</strong>{' '}
          trên {formatInt(g.gaps.gap_count)} khoảng cách.
        </p>
        <BarChart
          ariaLabel="Phân bố khoảng cách giữa các lần về, quan sát so với kỳ vọng"
          labels={g.gaps.histogram.labels}
          observed={g.gaps.histogram.observed}
          expected={g.gaps.histogram.expected}
        />
        <Verdict p={g.gaps.chi_square.p_value} label="Kiểm định chi-square phân bố khoảng cách" />
        <p className={styles.muted} style={{ marginTop: 8 }}>
          Số đang vắng lâu nhất: <strong>{g.gaps.longest_current.number}</strong> ({g.gaps.longest_current.gap} kỳ). Với {g.frequency.numbers.length} số, xác
          suất có ít nhất một số vắng từ {g.gaps.longest_current.gap} kỳ trở lên là khoảng <strong>{formatPct(g.gaps.longest_current.prob_any_number, 0)}</strong>.
          Số vắng lâu không "đến lượt" về: kỳ tới nó vẫn có xác suất {formatPct(g.gaps.presence_rate)} như mọi số khác.
        </p>
        <p className={styles.muted} style={{ marginTop: 8 }}>
          Runs test cho từng số (kiểm tra số có về dồn cục hoặc luân phiên bất thường không): {g.gaps.runs_per_number.below_0_05}/{g.gaps.runs_per_number.tested} số
          có p &lt; 0,05, kỳ vọng do ngẫu nhiên khoảng {formatNum(g.gaps.runs_per_number.expected_below_0_05, 1)} số.
        </p>
        <ChartNote sample={`${sample}, ${formatInt(g.gaps.gap_count)} khoảng cách`} />
      </div>

      <div className={styles.grid2}>
        <div className={`glass-card ${styles.card}`}>
          <h3 className={styles.h3}>3. Phân bố tổng {isXsmb ? '27 số' : '6 số'}</h3>
          <p className={styles.muted}>
            Tổng trung bình kỳ vọng <strong>{formatNum(g.sums.expected_mean, 1)}</strong>, quan sát <strong>{formatNum(g.sums.observed_mean, 1)}</strong> (khoảng tin
            cậy 95%: {formatNum(g.sums.mean_ci_low, 1)} - {formatNum(g.sums.mean_ci_high, 1)}). Tổng ở giữa xuất hiện nhiều hơn vì có nhiều bộ số cho tổng đó hơn,
            không phải vì bộ số có tổng ở giữa dễ trúng hơn.
          </p>
          <BarChart ariaLabel="Phân bố tổng, quan sát so với kỳ vọng" labels={g.sums.histogram.labels} observed={g.sums.histogram.observed} expected={g.sums.histogram.expected} />
          <Verdict p={g.sums.chi_square.p_value} label="Chi-square phân bố tổng" />
          <Verdict p={g.sums.runs_test.p_value} label="Runs test tổng trên/dưới trung bình qua các kỳ" />
          <ChartNote sample={sample} />
        </div>

        <div className={`glass-card ${styles.card}`}>
          <h3 className={styles.h3}>4. Chẵn / lẻ</h3>
          <p className={styles.muted}>
            Tỷ lệ số chẵn quan sát <strong>{formatPct(g.parity.even_share)}</strong> (khoảng tin cậy 95%: {formatPct(g.parity.even_share_ci_low)} -{' '}
            {formatPct(g.parity.even_share_ci_high)}), kỳ vọng {formatPct(g.parity.expected_even_share)}.
          </p>
          <BarChart ariaLabel="Số lượng số chẵn mỗi kỳ, quan sát so với kỳ vọng" labels={g.parity.histogram.labels} observed={g.parity.histogram.observed} expected={g.parity.histogram.expected} />
          <Verdict p={g.parity.chi_square.p_value} label="Chi-square số lượng số chẵn mỗi kỳ" />
          <ChartNote sample={sample} />
        </div>
      </div>

      <div className={styles.footnote}>
        <strong>Đọc kết quả thế nào?</strong> p-value là xác suất thấy chênh lệch lớn như vậy (hoặc lớn hơn) nếu kết quả hoàn toàn ngẫu nhiên. p lớn hơn 0,05 nghĩa là
        chênh lệch nằm trong dao động ngẫu nhiên. Trang này chạy hàng chục kiểm định, nên vài kiểm định có p nhỏ hơn 0,05 chỉ do may rủi là chuyện bình thường. Không kiểm định nào
        cho biết trước kết quả kỳ sau. Công thức: <code>engine/analytics/stats.py</code>, cập nhật lần cuối {data.generated_at.slice(0, 10)}.
      </div>
    </div>
  );
};
