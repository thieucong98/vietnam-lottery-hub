import React from 'react';
import { Brain, Cpu, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';
import { MLInsightsData } from '../types';

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
        Đang tải phân tích AI & Backtest...
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
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#ffffff' }}>
            HỆ THỐNG PHÂN TÍCH THUẬT TOÁN AI & KIỂM THỬ BACKTEST
          </h2>
        </div>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', maxWidth: 850 }}>
          Hệ thống áp dụng các mô hình xác suất thống kê hiện đại (Chuỗi Markov, Suy giảm số mũ Exponential Decay, Tần suất trượt) để phân tích phân phối kỳ quay tiếp theo, đồng thời kiểm định (Backtesting) minh bạch so với kết quả ngẫu nhiên để đảm bảo tính khách quan.
        </p>
      </div>

      {/* Grid 4 Chiến lược Dự đoán */}
      <div>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sparkles size={18} color="var(--accent-gold)" />
          Bộ Số Gợi Ý Dựa Trên Thuật Toán Cho Kỳ Tiếp Theo ({mlData.product})
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          {mlData.predictions.map((p, idx) => (
            <div key={idx} className="glass-card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: '1rem', fontWeight: 800, color: '#ffffff' }}>{p.name}</span>
                <span className="badge badge-hot" style={{ fontSize: '0.68rem' }}>MÔ HÌNH #{idx + 1}</span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: 16 }}>
                {p.description}
              </p>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {p.predicted_numbers.map((num) => (
                  <div
                    key={num}
                    className="lottery-ball ball-gold"
                    onClick={() => onSelectNumber(num)}
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
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff' }}>
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
                    <td style={{ padding: '12px 14px', fontWeight: 700, color: idx === 0 ? 'var(--accent-gold)' : (isRandom ? 'var(--text-dim)' : '#ffffff') }}>
                      {idx === 0 && '👑 '}
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
          <strong>Lưu ý khoa học:</strong> Xổ số là trò chơi may rủi độc lập (I.I.D). Mọi dự đoán và phân tích chỉ mang tính chất nghiên cứu thống kê thực nghiệm và tham khảo giải trí, không đảm bảo trúng thưởng 100%. Hãy chơi có trách nhiệm và vui vẻ!
        </span>
      </div>
    </div>
  );
};
