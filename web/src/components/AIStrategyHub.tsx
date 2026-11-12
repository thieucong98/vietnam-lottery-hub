import React, { useState } from 'react';
import { FlaskConical, ShieldCheck, Sparkles } from 'lucide-react';
import { MLInsightsData } from '../types';
import { Ball, BarChart, ChartNote, Tabs } from '../ui';
import { formatInt, formatNum, formatP, formatPct } from '../utils/statsText';
import { Verdict } from '../features/analysis/Verdict';
import styles from '../features/analysis/analysis.module.css';

interface AIStrategyHubProps {
  mlData: MLInsightsData | null;
  onSelectNumber: (num: string) => void;
}

/** Phòng thí nghiệm xác suất: backtest các thuật toán chọn số so với 1.000 lần chọn ngẫu nhiên. URL: `/thuat-toan` */
export const AIStrategyHub: React.FC<AIStrategyHubProps> = ({ mlData, onSelectNumber }) => {
  const [runIdx, setRunIdx] = useState(0);

  if (!mlData) {
    return (
      <div className={`glass-card ${styles.card}`} style={{ textAlign: 'center', color: 'var(--text-dim)' }}>
        Đang tải phòng thí nghiệm xác suất...
      </div>
    );
  }

  const run = mlData.backtests[Math.min(runIdx, mlData.backtests.length - 1)];
  const best = run.strategies[0];
  const minP = Math.min(...run.strategies.map((s) => s.p_value));
  const hist = run.random.histogram;
  const bestIdx = hist.average_matches.reduce((acc, v, i) => (Math.abs(v - best.average_matches) < Math.abs(hist.average_matches[acc] - best.average_matches) ? i : acc), 0);
  const sample = `${run.test_draws} kỳ ${mlData.product} gần nhất (đến kỳ #${mlData.latest_id}, ${mlData.latest_date}), ${formatInt(run.simulations)} lần chọn ngẫu nhiên`;

  return (
    <div className={styles.stack}>
      <div className={`glass-card ${styles.intro}`}>
        <h2 className={styles.h2}><FlaskConical size={24} color="var(--accent-purple)" />Phòng Thí Nghiệm Xác Suất</h2>
        <p className={styles.lead}>
          Mỗi thuật toán chọn 6 số cho từng kỳ chỉ dựa vào các kỳ trước đó, rồi đếm số trùng với kết quả thật. Để biết kết quả đó có hơn may rủi
          không, cùng các kỳ đó được chọn ngẫu nhiên <strong>{formatInt(run.simulations)} lần</strong>. p-value là tỷ lệ lần chọn ngẫu nhiên đạt bằng hoặc
          hơn thuật toán. Kỳ vọng của chọn ngẫu nhiên: 6 × 6 / 55 ≈ <strong>{formatNum(run.expected_average)}</strong> số trùng mỗi kỳ.
        </p>
        {mlData.backtests.length > 1 && (
          <div className={styles.tabs} style={{ marginTop: 14 }}>
            <Tabs<string>
              ariaLabel="Số kỳ kiểm thử"
              value={String(runIdx)}
              onChange={(v) => setRunIdx(Number(v))}
              items={mlData.backtests.map((b, i) => ({ id: String(i), label: `${b.test_draws} kỳ gần nhất` }))}
            />
          </div>
        )}
      </div>

      <div className={`glass-card ${styles.card}`}>
        <h3 className={styles.h3}>Kết quả backtest {run.test_draws} kỳ</h3>
        <div className={styles.kpis}>
          <div className={styles.kpi}>Ngẫu nhiên, trung bình<strong>{formatNum(run.random.mean_average)} số/kỳ</strong></div>
          <div className={styles.kpi}>95% lần chọn ngẫu nhiên nằm trong<strong>{formatNum(run.random.low_95)} - {formatNum(run.random.high_95)}</strong></div>
          <div className={styles.kpi}>Cao nhất: {best.strategy_name}<strong>{formatNum(best.average_matches)} số/kỳ</strong></div>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <caption className="sr-only">Backtest các thuật toán so với chọn ngẫu nhiên</caption>
            <thead>
              <tr>
                <th>Thuật toán</th>
                <th>Trung bình trùng / kỳ</th>
                <th>Tổng số trùng</th>
                <th>Kỳ trùng ≥ 3 số</th>
                <th>Trùng nhiều nhất</th>
                <th>p-value so với ngẫu nhiên</th>
              </tr>
            </thead>
            <tbody>
              {run.strategies.map((s) => (
                <tr key={s.strategy_name}>
                  <td><strong>{s.strategy_name}</strong></td>
                  <td className={styles.mono}>{formatNum(s.average_matches)}</td>
                  <td className={styles.mono}>{s.total_matches} / {run.test_draws * 6}</td>
                  <td className={styles.mono}>{formatPct(s.hit_rate_at_least_3)}</td>
                  <td className={styles.mono}>{s.max_match_in_one_draw} số</td>
                  <td className={styles.mono}>{formatP(s.p_value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Verdict p={minP} label={`Thuật toán có p nhỏ nhất (${run.strategies.find((s) => s.p_value === minP)?.strategy_name})`} />
        <p className={styles.muted} style={{ marginTop: 8 }}>
          Có {run.strategies.length} thuật toán được so sánh cùng lúc, nên thuật toán đứng đầu luôn nhỉnh hơn ngẫu nhiên một chút chỉ do được chọn ra từ nhiều
          thuật toán. Chạy lại với khoảng kiểm thử khác, thứ hạng thường đổi.
        </p>
      </div>

      <div className={`glass-card ${styles.card}`}>
        <h3 className={styles.h3}>Phân bố {formatInt(run.simulations)} lần chọn ngẫu nhiên</h3>
        <p className={styles.muted}>
          Mỗi cột là số lần chọn ngẫu nhiên đạt mức trùng trung bình đó. Cột vàng là mức của thuật toán cao nhất ({formatNum(best.average_matches)}): nó nằm
          trong vùng mà chọn ngẫu nhiên vẫn thường đạt được.
        </p>
        <BarChart
          ariaLabel="Phân bố trung bình số trùng của các lần chọn ngẫu nhiên"
          labels={hist.average_matches.map((v) => formatNum(v))}
          observed={hist.counts}
          highlightIndex={bestIdx}
        />
        <ChartNote sample={sample} />
      </div>

      <div className={`glass-card ${styles.card}`}>
        <h3 className={styles.h3}><Sparkles size={18} color="var(--accent-gold)" />Bộ số mẫu theo thuật toán (chỉ minh họa)</h3>
        <p className={styles.muted}>
          {mlData.disclaimer} Xác suất trúng Jackpot 1 của mọi bộ 6 số luôn là <strong>{mlData.jackpot_odds}</strong>.
        </p>
        <div className={styles.grid2} style={{ marginTop: 12 }}>
          {mlData.sample_sets.map((p) => (
            <div key={p.name} className={styles.kpi}>
              <span style={{ color: 'var(--text-main)', fontWeight: 700 }}>{p.name}</span>
              <div className={styles.balls}>
                {p.sample_picks.map((num) => (
                  <Ball key={num} value={num} size="md" onClick={() => onSelectNumber(num)} title={`Xem thống kê số ${num}`} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.footnote} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <ShieldCheck size={20} color="var(--accent-emerald)" style={{ flexShrink: 0 }} />
        <span>
          <strong>Kết luận:</strong>{' '}
          {minP >= 0.05
            ? 'trong lần kiểm thử này, không thuật toán nào vượt mức chọn ngẫu nhiên một cách có ý nghĩa thống kê.'
            : 'một thuật toán có p < 0,05 trong lần kiểm thử này. Khi so nhiều thuật toán cùng lúc, kết quả như vậy vẫn xảy ra do may rủi; hãy xem khoảng kiểm thử còn lại.'}{' '}
          Mỗi kỳ quay độc lập với các kỳ trước, nên không thuật toán nào làm tăng xác suất trúng. Hãy chơi có trách nhiệm.
        </span>
      </div>
    </div>
  );
};
