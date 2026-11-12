import React, { useMemo, useState } from 'react';
import { GitBranch } from 'lucide-react';
import { BacNhoData, BacNhoItem } from '../types';
import { Ball, ChartNote, Tabs } from '../ui';
import { formatDate, formatInt, formatP } from '../utils/statsText';
import { Verdict } from '../features/analysis/Verdict';
import styles from '../features/analysis/analysis.module.css';

interface BacNhoHubProps {
  bacNhoData: BacNhoData | null;
  onSelectNumber: (num: string) => void;
}

type Mode = 'special' | 'loto';

const pct = (x: number) => `${x.toLocaleString('vi-VN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;

/** Thống kê có điều kiện XSMB: sau ngày có điều kiện X, tỷ lệ số Y về ngày kế tiếp, luôn so với tần suất nền. URL: `/bac-nho` */
export const BacNhoHub: React.FC<BacNhoHubProps> = ({ bacNhoData, onSelectNumber }) => {
  const [mode, setMode] = useState<Mode>('special');
  const [input, setInput] = useState<string | null>(null);
  // Mặc định: 2 số cuối giải ĐB của kỳ mới nhất
  const selectedNum = input ?? bacNhoData?.metadata?.latest_special_2d ?? '00';

  const currentItem: BacNhoItem | undefined = useMemo(() => {
    if (!bacNhoData || !selectedNum) return undefined;
    const key = selectedNum.padStart(2, '0');
    return mode === 'special' ? bacNhoData.by_special?.[key] : bacNhoData.by_loto?.[key];
  }, [bacNhoData, mode, selectedNum]);

  if (!bacNhoData) {
    return (
      <div className={`glass-card ${styles.card}`} style={{ textAlign: 'center', color: 'var(--text-dim)' }}>
        Đang tải thống kê có điều kiện...
      </div>
    );
  }

  const meta = bacNhoData.metadata;
  const num = selectedNum.padStart(2, '0');
  const followers = currentItem?.top_followers ?? [];
  const minAdjP = followers.length ? Math.min(...followers.map((f) => f.p_value_adjusted)) : 1;
  const condition = mode === 'special' ? `2 số cuối giải Đặc Biệt là ${num}` : `số ${num} xuất hiện trong 27 giải`;
  const smallSample = currentItem && currentItem.total_triggers < 100;

  return (
    <div className={styles.stack}>
      <div className={`glass-card ${styles.intro}`}>
        <h2 className={styles.h2}><GitBranch size={24} color="var(--accent-purple)" />Thống Kê Có Điều Kiện (XSMB)</h2>
        <p className={styles.lead}>
          Câu hỏi: <em>sau những ngày có điều kiện X, mỗi số Y xuất hiện vào ngày kế tiếp với tỷ lệ bao nhiêu?</em> Mỗi tỷ lệ luôn được đặt cạnh{' '}
          <strong>tần suất nền</strong>, tức tỷ lệ số Y xuất hiện vào một ngày bất kỳ (khoảng 24%). Nếu hai con số gần nhau, điều kiện X không nói thêm
          điều gì. {bacNhoData.disclaimer}
        </p>

        <div className={styles.row} style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', marginTop: 16 }}>
          <Tabs<Mode>
            ariaLabel="Loại điều kiện"
            value={mode}
            onChange={setMode}
            items={[
              { id: 'special', label: 'Theo 2 số cuối giải Đặc Biệt' },
              { id: 'loto', label: 'Theo số xuất hiện trong 27 giải' },
            ]}
          />
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', color: 'var(--text-dim)' }}>
            {mode === 'special' ? 'Hôm trước 2 số cuối ĐB là' : 'Hôm trước có số'}
            <input
              type="text"
              inputMode="numeric"
              maxLength={2}
              value={selectedNum}
              onChange={(e) => setInput(e.target.value.replace(/\D/g, ''))}
              style={{ width: 60, textAlign: 'center', padding: '6px 10px', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.08)', border: '1px solid var(--accent-gold)', color: '#ffffff', fontFamily: 'var(--font-mono)', fontSize: '1.1rem', fontWeight: 800 }}
            />
          </label>
          <button type="button" className="tab-btn" onClick={() => setInput(null)}>
            Kỳ mới nhất: {meta.latest_special_2d} ({formatDate(meta.latest_date)})
          </button>
        </div>
      </div>

      {currentItem ? (
        <div className={`glass-card ${styles.card}`}>
          <h3 className={styles.h3}>Sau những ngày {condition}</h3>
          <div className={styles.kpis}>
            <div className={styles.kpi}>Số ngày thỏa điều kiện (cỡ mẫu)<strong>{formatInt(currentItem.total_triggers)} ngày</strong></div>
            <div className={styles.kpi}>Tần suất nền tính trên<strong>{formatInt(meta.base_sample)} ngày</strong></div>
            <div className={styles.kpi}>p nhỏ nhất (đã hiệu chỉnh 100 phép so sánh)<strong>{formatP(minAdjP)}</strong></div>
          </div>
          {smallSample && (
            <p className={`${styles.verdict} ${styles.verdictNotable}`}>
              Cỡ mẫu nhỏ ({currentItem.total_triggers} ngày): khoảng tin cậy rộng, tỷ lệ có điều kiện dao động mạnh. Đừng đọc chênh lệch lớn ở đây như một quy luật.
            </p>
          )}
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <caption className="sr-only">10 số có tỷ lệ ngày kế tiếp cao nhất sau những ngày {condition}</caption>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Số</th>
                  <th>Ngày kế tiếp có số này</th>
                  <th>Tỷ lệ có điều kiện</th>
                  <th>Khoảng tin cậy 95%</th>
                  <th>Tần suất nền</th>
                  <th>Chênh lệch</th>
                  <th>p (đã hiệu chỉnh)</th>
                </tr>
              </thead>
              <tbody>
                {followers.map((f, idx) => {
                  const diff = f.rate - f.base_rate;
                  return (
                    <tr key={f.number}>
                      <td className={styles.mono}>{idx + 1}</td>
                      <td><Ball value={f.number} size="sm" tone="slate" onClick={() => onSelectNumber(f.number)} title={`Xem thống kê số ${f.number}`} /></td>
                      <td className={styles.mono}>{formatInt(f.hits)} / {formatInt(currentItem.total_triggers)}</td>
                      <td className={styles.mono}><strong>{pct(f.rate)}</strong></td>
                      <td className={styles.mono}>{pct(f.ci_low)} - {pct(f.ci_high)}</td>
                      <td className={styles.mono}>{pct(f.base_rate)}</td>
                      <td className={styles.mono}>{diff >= 0 ? '+' : ''}{diff.toLocaleString('vi-VN', { maximumFractionDigits: 1 })} điểm %</td>
                      <td className={styles.mono}>{formatP(f.p_value_adjusted)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Verdict p={minAdjP} label="So với tần suất nền" />
          <p className={styles.muted} style={{ marginTop: 8 }}>
            Bảng chỉ hiện 10 số cao nhất trong 100 số, nên tỷ lệ của chúng luôn nhỉnh hơn tần suất nền dù kết quả hoàn toàn ngẫu nhiên. Vì vậy p-value được nhân
            với 100 (hiệu chỉnh Bonferroni). Khi tần suất nền nằm trong khoảng tin cậy 95%, chênh lệch không khác gì may rủi.
          </p>
          <ChartNote
            sample={`${formatInt(currentItem.total_triggers)} ngày thỏa điều kiện trong ${formatInt(meta.total_draws_analyzed)} kỳ XSMB đến ${formatDate(meta.latest_date)}`}
          />
        </div>
      ) : (
        <div className={`glass-card ${styles.card}`} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
          Không có dữ liệu cho số {selectedNum || '(trống)'}. Vui lòng nhập số từ 00 đến 99.
        </div>
      )}
    </div>
  );
};
