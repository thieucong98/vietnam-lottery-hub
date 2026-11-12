import React from 'react';
import { Flame } from 'lucide-react';
import type { VietlottProductHubModel } from './useVietlottHub';

export const CooccurrencePanel: React.FC<{ model: VietlottProductHubModel }> = ({ model }) => {
  const { cooccurrence, gameName, sortedDraws, handleLoadComboNumbers } = model;
  return (
    <div className="glass-card animate-fade-in" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Flame size={20} color="var(--accent-gold)" />
            <span>Ma Trận Đồng Xuất Hiện: Cặp Số & Bộ Ba Thường Về Cùng Nhau ({gameName})</span>
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 4 }}>
            Dữ liệu thống kê xác suất toàn diện qua {sortedDraws.length} kỳ quay lịch sử. Bấm nút nạp để đưa trực tiếp vào phân tích Vé Bao!
          </p>
        </div>
      </div>

      {!cooccurrence ? (
        <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-dim)' }}>
          Đang tải dữ liệu ma trận đồng xuất hiện...
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 20 }}>
          {/* TOP CẶP SỐ HAY VỀ CÙNG NHAU */}
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: 18, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <span className="badge badge-gold" style={{ fontSize: '0.75rem' }}>TOP CẶP SỐ</span>
              <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#ffffff' }}>Cặp 2 Số Xuất Hiện Cùng Nhau Nhiều Nhất</h4>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(cooccurrence.top_pairs || []).slice(0, 10).map((pair, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    gap: 10,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', width: 20 }}>#{idx + 1}</span>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {pair.numbers.map((n) => (
                        <span key={n} className="lottery-ball ball-gold" style={{ width: 34, height: 34, fontSize: '0.9rem' }}>
                          {n.padStart(2, '0')}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.86rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>
                        {pair.hits} <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>lần</span>
                      </div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>
                        Gần nhất: {pair.last_seen?.date || 'N/A'}
                      </div>
                    </div>

                    <button
                      onClick={() => handleLoadComboNumbers(pair.numbers.map((n) => parseInt(n, 10)))}
                      style={{
                        padding: '5px 10px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'rgba(245, 158, 11, 0.15)',
                        border: '1px solid var(--accent-gold)',
                        color: 'var(--accent-gold)',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Nạp cặp này
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* TOP BỘ BA HAY VỀ CÙNG NHAU */}
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: 18, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <span className="badge badge-hot" style={{ fontSize: '0.75rem' }}>TOP BỘ BA</span>
              <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#ffffff' }}>Bộ 3 Số Xuất Hiện Cùng Nhau Nhiều Nhất</h4>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(cooccurrence.top_triplets || []).slice(0, 10).map((triplet, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    gap: 10,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', width: 20 }}>#{idx + 1}</span>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {triplet.numbers.map((n) => (
                        <span key={n} className="lottery-ball ball-gold" style={{ width: 34, height: 34, fontSize: '0.9rem' }}>
                          {n.padStart(2, '0')}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#38bdf8' }}>
                        {triplet.hits} <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>lần</span>
                      </div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>
                        Gần nhất: {triplet.last_seen?.date || 'N/A'}
                      </div>
                    </div>

                    <button
                      onClick={() => handleLoadComboNumbers(triplet.numbers.map((n) => parseInt(n, 10)))}
                      style={{
                        padding: '5px 10px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'rgba(56, 189, 248, 0.15)',
                        border: '1px solid #38bdf8',
                        color: '#38bdf8',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Nạp bộ ba này
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
