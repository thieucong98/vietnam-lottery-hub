import React from 'react';
import { Brain, Cpu, ShieldCheck, Sparkles } from 'lucide-react';
import { MLInsightsData } from '../types';
import { clickableDivProps } from '../ui/clickableDiv';

interface AIStrategyHubProps {
  mlData: MLInsightsData | null;
  onSelectNumber: (num: string) => void;
}

export const AIStrategyHub: React.FC<AIStrategyHubProps> = ({
  mlData,
  onSelectNumber,
}) => {
  if (!mlData) {
    return (
      <div className="glass-card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-dim)' }}>
        Đang tải bộ số mẫu & Backtest...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Banner Giới thiệu */}
      <div className="glass-card animate-fade-in" style={{
        padding: 24,
        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(6, 182, 212, 0.1))',
        border: '1px solid rgba(139, 92, 246, 0.3)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <Brain size={26} color="var(--accent-purple)" />
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)' }}>
            PHÒNG THÍ NGHIỆM THUẬT TOÁN & KIỂM THỬ BACKTEST
          </h2>
        </div>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', maxWidth: 850 }}>
          Trang này minh họa cách một số thuật toán thống kê (Chuỗi Markov, Suy giảm số mũ, Tần suất trượt) chọn số từ dữ liệu lịch sử, và đo lại kết quả của chúng trên các kỳ đã quay so với cách chọn ngẫu nhiên. Kết quả backtest cho thấy không thuật toán nào vượt trội so với chọn ngẫu nhiên.
        </p>
      </div>

      {/* Grid 4 bộ số mẫu theo thuật toán (chỉ minh họa) */}
      <div>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sparkles size={18} color="var(--accent-gold)" />
          Bộ Số Mẫu Theo Thuật Toán (Chỉ Minh Họa) – {mlData.product}
        </h3>

        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 14 }}>
          {mlData.disclaimer} Xác suất trúng Jackpot 1 của mọi bộ 6 số luôn là <strong>{mlData.jackpot_odds}</strong>.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          {mlData.sample_sets.map((p, idx) => (
            <div key={idx} className="glass-card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)' }}>{p.name}</span>
                <span className="badge badge-hot" style={{ fontSize: '0.68rem' }}>MẪU #{idx + 1}</span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: 16 }}>
                {p.description}
              </p>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {p.sample_picks.map((num) => (
                  <div
                    key={num}
                    className="lottery-ball ball-gold"
                    {...clickableDivProps(() => onSelectNumber(num))}
                    style={{ width: 44, height: 44, fontSize: '1.1rem', cursor: 'pointer' }}
                    title={`Bấm để xem chi tiết số ${num}`}
                  >
                    {num}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bảng Kiểm thử Hiệu suất Backtesting */}
      <div className="glass-card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <Cpu size={20} color="var(--accent-cyan)" />
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>
              Bảng Đo Lường Hiệu Suất Thực Tế (Walk-Forward Backtesting 50 Kỳ Gần Nhất)
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
              Mỗi thuật toán được chạy thử nghiệm trên 50 kỳ đã qua để tính tỷ lệ khớp thực tế và so sánh với mức ngẫu nhiên (Random Baseline).
            </p>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-dim)', textAlign: 'left' }}>
                <th style={{ padding: '10px 14px' }}>Chiến Lược (Strategy)</th>
                <th style={{ padding: '10px 14px' }}>Số Kỳ Kiểm Thử</th>
                <th style={{ padding: '10px 14px' }}>Trung Bình Trúng / Kỳ</th>
                <th style={{ padding: '10px 14px' }}>Trúng Nhiều Nhất / 1 Kỳ</th>
                <th style={{ padding: '10px 14px' }}>Tỷ Lệ Trúng ≥ 3 Số</th>
                <th style={{ padding: '10px 14px' }}>Tỷ Lệ Trúng ≥ 4 Số</th>
              </tr>
            </thead>
            <tbody>
              {mlData.backtest_report.map((item, idx) => {
                const isRandom = item.strategy_name.includes('Random');
                return (
                  <tr 
                    key={idx}
                    style={{
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      background: idx === 0 ? 'rgba(245, 158, 11, 0.08)' : (isRandom ? 'rgba(255,255,255,0.02)' : 'transparent'),
                    }}
                  >
                    <td style={{ padding: '12px 14px', fontWeight: 700, color: idx === 0 ? 'var(--accent-gold)' : (isRandom ? 'var(--text-dim)' : 'var(--text-main)') }}>
                      {item.strategy_name}
                      {isRandom && ' (Đối chứng)'}
                    </td>
                    <td style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)' }}>
                      {item.test_draws} kỳ
                    </td>
                    <td style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--accent-emerald)' }}>
                      {item.average_matches} số
                    </td>
                    <td style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-gold)' }}>
                      {item.max_match_in_one_draw} số
                    </td>
                    <td style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)' }}>
                      {item.hit_rate_at_least_3}
                    </td>
                    <td style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)', color: item.hit_rate_at_least_4 !== '0.0%' ? 'var(--accent-emerald)' : 'var(--text-dim)' }}>
                      {item.hit_rate_at_least_4}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tuyên bố Khách Quan & Trách Nhiệm */}
      <div style={{
        padding: 16,
        borderRadius: 'var(--radius-sm)',
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px dashed var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        fontSize: '0.8rem',
        color: 'var(--text-dim)',
      }}>
        <ShieldCheck size={20} color="var(--accent-emerald)" style={{ flexShrink: 0 }} />
        <span>
          <strong>Lưu ý khoa học:</strong> Xổ số là trò chơi may rủi độc lập (I.I.D). Bộ số mẫu và bảng backtest chỉ là thống kê mô tả dữ liệu lịch sử. Không thuật toán nào làm tăng xác suất trúng. Hãy chơi có trách nhiệm.
        </span>
      </div>
    </div>
  );
};
