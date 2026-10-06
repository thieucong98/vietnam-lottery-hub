import React, { useMemo } from 'react';
import {
  Flame,
  AlertTriangle,
  Brain,
  ArrowRight,
  TrendingUp,
  Sparkles,
  BarChart3,
  Calendar,
  Zap,
} from 'lucide-react';
import { SummaryData, MLInsightsData, LotteryIndexData } from '../types';

interface BentoInsightsGridProps {
  xsmbData: LotteryIndexData | null;
  summaryData: SummaryData | null;
  mlData: MLInsightsData | null;
  onSelectNumber: (num: string) => void;
  onViewAllGan: () => void;
  onViewAllHeatmap: () => void;
  onViewAI: () => void;
}

export const BentoInsightsGrid: React.FC<BentoInsightsGridProps> = ({
  xsmbData,
  summaryData,
  mlData,
  onSelectNumber,
  onViewAllGan,
  onViewAllHeatmap,
  onViewAI,
}) => {
  // 1. Phân tích Top Cầu Nóng (Hot Numbers 100 ngày)
  const topHotNumbers = useMemo(() => {
    return (xsmbData?.top_frequent || []).slice(0, 3);
  }, [xsmbData]);

  // 2. Phân tích Top Lô Gan & Tiến độ chạm kỷ lục
  const topGanNumbers = useMemo(() => {
    return (xsmbData?.top_gan || []).slice(0, 3);
  }, [xsmbData]);

  // 3. Data Storytelling: Tự động phân tích câu chuyện dữ liệu hôm nay
  const dailyInsights = useMemo(() => {
    const xsmb = summaryData?.xsmb_latest;
    if (!xsmb) return null;

    // Tìm đầu số về nhiều nhất
    let maxHead = '0';
    let maxHeadCount = 0;
    if (xsmb.heads) {
      Object.entries(xsmb.heads).forEach(([head, tails]) => {
        if (tails.length > maxHeadCount) {
          maxHeadCount = tails.length;
          maxHead = head;
        }
      });
    }

    // Đếm chẵn/lẻ trong 27 giải
    let evenCount = 0;
    let oddCount = 0;
    (xsmb.loto_numbers || []).forEach((n) => {
      const val = parseInt(n, 10);
      if (!isNaN(val)) {
        if (val % 2 === 0) evenCount++;
        else oddCount++;
      }
    });

    // Trích xuất dự đoán từ AI Model (Markov / Frequency)
    const markovPred = mlData?.predictions?.find((p) => p.name.includes('Markov')) || mlData?.predictions?.[0];
    const topPredictions = markovPred ? markovPred.predicted_numbers.slice(0, 4) : ['11', '22', '33', '44'];

    return {
      maxHead,
      maxHeadCount,
      evenCount,
      oddCount,
      topPredictions,
      markovName: markovPred?.name || 'Mô hình Markov Bậc 1',
    };
  }, [summaryData, mlData]);

  if (!xsmbData && !summaryData) return null;

  return (
    <div className="bento-grid bento-grid-3 animate-fade-in" style={{ width: '100%' }}>
      {/* THẺ 1: TOP CẦU NÓNG HÔM NAY (HOT NUMBERS) */}
      <div className="bento-card">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="lottery-ball ball-gold" style={{ width: 36, height: 36, fontSize: '0.95rem' }}>
                <Flame size={18} color="#0f172a" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.02rem', fontWeight: 800, color: '#ffffff' }}>Cầu Số Nổi Bật</h3>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Tần suất cao nhất 100 kỳ qua</span>
              </div>
            </div>
            <span className="badge badge-hot" style={{ fontSize: '0.68rem' }}>100 KỲ</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
            {topHotNumbers.map((item, idx) => {
              const freq = item.freq_100d || 0;
              const rate = Math.round((freq / 100) * 100);
              return (
                <div
                  key={idx}
                  onClick={() => onSelectNumber(item.number)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(245, 158, 11, 0.08)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="lottery-ball ball-gold" style={{ width: 34, height: 34, fontSize: '1rem', fontWeight: 800 }}>
                      {item.number}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#ffffff' }}>
                        Nổ <strong>{freq}</strong> nháy
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                        Tổng 20 năm: {item.total_hits.toLocaleString()} lần
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span className="badge badge-normal" style={{ color: 'var(--accent-gold)', borderColor: 'rgba(245, 158, 11, 0.3)' }}>
                      {rate}% kỳ nổ
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <button
          onClick={onViewAllHeatmap}
          style={{
            marginTop: 18,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'none',
            border: 'none',
            color: 'var(--accent-gold)',
            fontSize: '0.82rem',
            fontWeight: 700,
            cursor: 'pointer',
            padding: '4px 0',
          }}
        >
          <span>Xem bản đồ nhiệt 100 số</span>
          <ArrowRight size={14} />
        </button>
      </div>

      {/* THẺ 2: CẢNH BÁO LÔ GAN CỰC ĐẠI (MAX GAP ALERT) */}
      <div className="bento-card">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="lottery-ball ball-slate" style={{ width: 36, height: 36, fontSize: '0.95rem', background: '#334155' }}>
                <AlertTriangle size={18} color="#f59e0b" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.02rem', fontWeight: 800, color: '#ffffff' }}>Cảnh Báo Lô Gan</h3>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Tiến trình so với kỷ lục 20 năm</span>
              </div>
            </div>
            <span className="badge badge-normal" style={{ fontSize: '0.68rem', color: '#f59e0b', borderColor: 'rgba(245, 158, 11, 0.3)' }}>
              CẢNH BÁO
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
            {topGanNumbers.map((item, idx) => {
              const maxG = item.max_gap || 30;
              const currentG = item.days_since || 0;
              const ratio = Math.min(100, Math.round((currentG / maxG) * 100));
              const fillColor = ratio >= 70 ? 'var(--accent-red)' : ratio >= 45 ? 'var(--accent-gold)' : 'var(--accent-emerald)';

              return (
                <div
                  key={idx}
                  onClick={() => onSelectNumber(item.number)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="lottery-ball ball-slate" style={{ width: 32, height: 32, fontSize: '0.95rem', fontWeight: 800 }}>
                        {item.number}
                      </div>
                      <span style={{ fontSize: '0.86rem', fontWeight: 700, color: '#ffffff' }}>
                        Gan <strong>{currentG}</strong> ngày
                      </span>
                    </div>

                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                      Kỷ lục: {maxG} ngày ({ratio}%)
                    </span>
                  </div>

                  {/* Visual Gauge Bar */}
                  <div className="gauge-track">
                    <div
                      className="gauge-fill"
                      style={{
                        width: `${ratio}%`,
                        background: `linear-gradient(90deg, ${fillColor} 0%, rgba(239, 68, 68, 0.8) 100%)`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <button
          onClick={onViewAllGan}
          style={{
            marginTop: 18,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'none',
            border: 'none',
            color: 'var(--accent-gold)',
            fontSize: '0.82rem',
            fontWeight: 700,
            cursor: 'pointer',
            padding: '4px 0',
          }}
        >
          <span>Xem bảng xếp hạng 100 số gan</span>
          <ArrowRight size={14} />
        </button>
      </div>

      {/* THẺ 3: BẢN TIN PHÂN TÍCH XÁC SUẤT HÀNG NGÀY (DATA STORYTELLING) */}
      <div className="bento-card">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="lottery-ball ball-emerald" style={{ width: 36, height: 36, fontSize: '0.95rem' }}>
                <Brain size={18} color="#0f172a" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.02rem', fontWeight: 800, color: '#ffffff' }}>Bản Tin Toán Học</h3>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Tóm tắt dữ liệu & xác suất AI</span>
              </div>
            </div>
            <span className="badge badge-normal" style={{ fontSize: '0.68rem', color: 'var(--accent-emerald)', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
              DATA STORY
            </span>
          </div>

          {dailyInsights && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
              {/* Insight 1: Xu hướng đầu số */}
              <div
                style={{
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', fontWeight: 700, color: '#38bdf8', marginBottom: 2 }}>
                  <TrendingUp size={14} />
                  <span>Mật Độ Đầu Lô Tô</span>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Đầu <strong>{dailyInsights.maxHead}</strong> có mật độ cao nhất kỳ qua với <strong>{dailyInsights.maxHeadCount} nháy</strong>.
                </p>
              </div>

              {/* Insight 2: Cân bằng Chẵn Lẻ */}
              <div
                style={{
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', fontWeight: 700, color: '#34d399', marginBottom: 2 }}>
                  <BarChart3 size={14} />
                  <span>Phân Bố Chẵn / Lẻ</span>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Tỷ lệ 27 giải: <strong>{dailyInsights.evenCount} Chẵn</strong> - <strong>{dailyInsights.oddCount} Lẻ</strong> ({Math.round((dailyInsights.evenCount / (dailyInsights.evenCount + dailyInsights.oddCount || 1)) * 100)}% chẵn).
                </p>
              </div>

              {/* Insight 3: Gợi ý mô hình Markov */}
              <div
                style={{
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', fontWeight: 700, color: '#fbbf24', marginBottom: 4 }}>
                  <Sparkles size={14} />
                  <span>Gợi Ý Chuyển Dịch Markov</span>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {dailyInsights.topPredictions.map((num, i) => (
                    <span
                      key={i}
                      onClick={() => onSelectNumber(num)}
                      className="mono"
                      style={{
                        padding: '2px 7px',
                        borderRadius: 4,
                        background: 'rgba(251, 191, 36, 0.15)',
                        border: '1px solid rgba(251, 191, 36, 0.3)',
                        color: '#fbbf24',
                        fontSize: '0.8rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                      }}
                      title={`Bấm tra cứu số ${num}`}
                    >
                      {num}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={onViewAI}
          style={{
            marginTop: 18,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'none',
            border: 'none',
            color: 'var(--accent-emerald)',
            fontSize: '0.82rem',
            fontWeight: 700,
            cursor: 'pointer',
            padding: '4px 0',
          }}
        >
          <span>Khám phá phòng Lab AI & Backtest</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
};
