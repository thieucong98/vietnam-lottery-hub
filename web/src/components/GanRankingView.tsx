import React, { useState } from 'react';
import { AlertTriangle, TrendingUp, Trophy, ArrowRight } from 'lucide-react';
import { LotteryIndexData } from '../types';

interface GanRankingViewProps {
  xsmbData: LotteryIndexData | null;
  vietlottData: LotteryIndexData | null;
  onSelectNumber: (num: string) => void;
}

export const GanRankingView: React.FC<GanRankingViewProps> = ({
  xsmbData,
  vietlottData,
  onSelectNumber,
}) => {
  const [activeTab, setActiveTab] = useState<'xsmb' | 'vietlott'>('xsmb');

  const currentData = activeTab === 'xsmb' ? xsmbData : vietlottData;

  if (!currentData) {
    return (
      <div className="glass-card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-dim)' }}>
        Đang tải bảng xếp hạng...
      </div>
    );
  }

  const topGan = currentData.top_gan || [];
  const topFreq = currentData.top_frequent || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Switch Tab */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff' }}>
            BẢNG XẾP HẠNG LÔ GAN & TẦN SUẤT
          </h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Theo dõi những con số gan lì nhất và những con số có phong độ nổ nhiều nhất
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8, background: 'rgba(0,0,0,0.4)', padding: 4, borderRadius: 'var(--radius-sm)' }}>
          <button
            className={`tab-btn ${activeTab === 'xsmb' ? 'active' : ''}`}
            onClick={() => setActiveTab('xsmb')}
            style={{ padding: '6px 14px', fontSize: '0.85rem' }}
          >
            Xổ Số Miền Bắc
          </button>
          <button
            className={`tab-btn ${activeTab === 'vietlott' ? 'active' : ''}`}
            onClick={() => setActiveTab('vietlott')}
            style={{ padding: '6px 14px', fontSize: '0.85rem' }}
          >
            Vietlott Power 6/55
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 20 }}>
        {/* Cột 1: Top Lô Gan */}
        <div className="glass-card animate-fade-in" style={{ padding: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <AlertTriangle size={20} color="var(--accent-red)" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff' }}>
              Top Số Lâu Chưa Xuất Hiện (Lô Gan)
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {topGan.map((item, idx) => {
              const numDetail = currentData.numbers?.[item.number];
              const maxGap = item.max_gap || numDetail?.max_gap_historical || 30;
              const ratio = Math.min(100, Math.round((item.days_since / maxGap) * 100));

              return (
                <div
                  key={item.number}
                  onClick={() => onSelectNumber(item.number)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--accent-red)')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: idx < 3 ? 'var(--accent-red)' : 'var(--text-dim)', width: 20 }}>
                      #{idx + 1}
                    </span>
                    <div className="lottery-ball ball-red" style={{ width: 40, height: 40, fontSize: '1.1rem' }}>
                      {item.number}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#ffffff' }}>
                        Số {item.number}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                        Về gần nhất: {item.last_date || 'Không rõ'}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-red)', fontFamily: 'var(--font-mono)' }}>
                      {item.days_since} <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>ngày</span>
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      Kỷ lục: {maxGap} ngày ({ratio}%)
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cột 2: Top Số Về Nhiều Nhất */}
        <div className="glass-card animate-fade-in" style={{ padding: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <TrendingUp size={20} color="var(--accent-gold)" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff' }}>
              Top Số Xuất Hiện Nhiều Nhất (100 Kỳ Gần Đây)
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {topFreq.map((item, idx) => {
              return (
                <div
                  key={item.number}
                  onClick={() => onSelectNumber(item.number)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--accent-gold)')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: idx < 3 ? 'var(--accent-gold)' : 'var(--text-dim)', width: 20 }}>
                      #{idx + 1}
                    </span>
                    <div className="lottery-ball ball-gold" style={{ width: 40, height: 40, fontSize: '1.1rem' }}>
                      {item.number}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#ffffff' }}>
                        Số {item.number}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                        Tổng số lần về: {item.total_hits} lần
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-gold)', fontFamily: 'var(--font-mono)' }}>
                      {item.freq_100d ?? item.total_hits} <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>nháy</span>
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--accent-emerald)' }}>
                      Phong độ rất cao 🔥
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
