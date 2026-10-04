import React, { useState } from 'react';
import { Flame, Eye, Sparkles } from 'lucide-react';
import { LotteryIndexData } from '../types';

interface HeatmapMatrixProps {
  data: LotteryIndexData | null;
  onSelectNumber: (num: string) => void;
}

export const HeatmapMatrix: React.FC<HeatmapMatrixProps> = ({
  data,
  onSelectNumber,
}) => {
  const [mode, setMode] = useState<'freq' | 'gan'>('freq');

  if (!data || !data.numbers) {
    return (
      <div className="glass-card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-dim)' }}>
        Đang tải ma trận nhiệt...
      </div>
    );
  }

  // Tìm min, max để tính dải màu
  const values = Object.values(data.numbers);
  const maxFreq = Math.max(...values.map(v => v.freq_100d || 0), 1);
  const minFreq = Math.min(...values.map(v => v.freq_100d || 0), 0);
  const maxGan = Math.max(...values.map(v => v.days_since_last || 0), 1);

  // Tính màu sắc cho từng ô
  const getCellColor = (numStr: string) => {
    const item = data.numbers[numStr];
    if (!item) return { bg: 'rgba(255,255,255,0.03)', text: '#ffffff' };

    if (mode === 'freq') {
      // Tần suất: từ slate tối đến vàng kim rực rỡ
      const ratio = Math.max(0, Math.min(1, (item.freq_100d - minFreq) / (maxFreq - minFreq)));
      if (ratio > 0.75) {
        return { bg: 'rgba(245, 158, 11, 0.45)', text: '#fbbf24', border: 'rgba(245, 158, 11, 0.8)' };
      } else if (ratio > 0.45) {
        return { bg: 'rgba(16, 185, 129, 0.3)', text: '#34d399', border: 'rgba(16, 185, 129, 0.5)' };
      } else if (ratio > 0.2) {
        return { bg: 'rgba(6, 182, 212, 0.2)', text: '#38bdf8', border: 'rgba(6, 182, 212, 0.3)' };
      } else {
        return { bg: 'rgba(255, 255, 255, 0.04)', text: '#94a3b8', border: 'rgba(255, 255, 255, 0.08)' };
      }
    } else {
      // Lô Gan: từ xanh lục (vừa về) -> vàng -> đỏ rực (lô gan)
      const ratio = item.days_since_last / Math.max(1, maxGan);
      if (item.days_since_last === 0) {
        return { bg: 'rgba(16, 185, 129, 0.4)', text: '#6ee7b7', border: '#10b981' };
      } else if (ratio > 0.6) {
        return { bg: 'rgba(239, 68, 68, 0.5)', text: '#fca5a5', border: '#ef4444' };
      } else if (ratio > 0.35) {
        return { bg: 'rgba(245, 158, 11, 0.35)', text: '#fcd34d', border: '#f59e0b' };
      } else {
        return { bg: 'rgba(255, 255, 255, 0.05)', text: '#cbd5e1', border: 'rgba(255, 255, 255, 0.08)' };
      }
    }
  };

  return (
    <div className="glass-card animate-fade-in" style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 14 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Flame size={22} color="var(--accent-gold)" />
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#ffffff' }}>
              MA TRẬN NHIỆT ĐỘ 100 SỐ (00 - 99)
            </h2>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>
            Nhìn tổng quan nhiệt độ các số, bấm vào bất kỳ ô nào để tra cứu tức thì
          </p>
        </div>

        {/* Chuyển chế độ xem */}
        <div style={{ display: 'flex', gap: 8, background: 'rgba(0,0,0,0.3)', padding: 4, borderRadius: 'var(--radius-sm)' }}>
          <button
            className={`tab-btn ${mode === 'freq' ? 'active' : ''}`}
            style={{ padding: '6px 14px', fontSize: '0.85rem' }}
            onClick={() => setMode('freq')}
          >
            <Sparkles size={14} />
            <span>Tần Suất 100 Ngày</span>
          </button>
          <button
            className={`tab-btn ${mode === 'gan' ? 'active' : ''}`}
            style={{ padding: '6px 14px', fontSize: '0.85rem' }}
            onClick={() => setMode('gan')}
          >
            <Eye size={14} />
            <span>Độ Gan (Số ngày chưa về)</span>
          </button>
        </div>
      </div>

      {/* Lưới 10x10 */}
      <div className="heatmap-grid">
        {Array.from({ length: 100 }).map((_, idx) => {
          const numStr = idx.toString().padStart(2, '0');
          const item = data.numbers[numStr];
          const colors = getCellColor(numStr);

          return (
            <div
              key={numStr}
              className="heatmap-cell"
              onClick={() => onSelectNumber(numStr)}
              style={{
                background: colors.bg,
                borderColor: colors.border,
                color: colors.text,
              }}
              title={`Số ${numStr}: Vắng ${item?.days_since_last || 0} ngày, Tần suất 100d: ${item?.freq_100d || 0} nháy`}
            >
              <span style={{ fontSize: '0.95rem', fontWeight: 800 }}>{numStr}</span>
              <span style={{ fontSize: '0.65rem', opacity: 0.85 }}>
                {mode === 'freq' ? `${item?.freq_100d || 0}` : `${item?.days_since_last || 0}d`}
              </span>
            </div>
          );
        })}
      </div>

      {/* Ghi chú màu sắc */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 16, marginTop: 16, fontSize: '0.75rem', color: 'var(--text-dim)', flexWrap: 'wrap' }}>
        {mode === 'freq' ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 12, height: 12, background: 'rgba(255,255,255,0.05)', borderRadius: 2 }} />
              <span>Ít về (Lạnh)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 12, height: 12, background: 'rgba(6, 182, 212, 0.4)', borderRadius: 2 }} />
              <span>Bình thường</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 12, height: 12, background: 'rgba(245, 158, 11, 0.6)', borderRadius: 2 }} />
              <span>Về nhiều (Rất Nóng 🔥)</span>
            </div>
          </>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 12, height: 12, background: 'rgba(16, 185, 129, 0.5)', borderRadius: 2 }} />
              <span>Vừa về (0-2 ngày)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 12, height: 12, background: 'rgba(245, 158, 11, 0.5)', borderRadius: 2 }} />
              <span>Chớm gan (7-15 ngày)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 12, height: 12, background: 'rgba(239, 68, 68, 0.7)', borderRadius: 2 }} />
              <span>Lô Gan cực đại ⚠️</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
