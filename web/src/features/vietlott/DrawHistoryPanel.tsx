import React from 'react';
import { Calendar, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import type { VietlottProductHubModel } from './useVietlottHub';

export const DrawHistoryPanel: React.FC<{ model: VietlottProductHubModel }> = ({ model }) => {
  const { onSelectNumber, historySearch, setHistorySearch, currentPage, setCurrentPage, is655, handleLoadComboNumbers, filteredHistory, totalPages, paginatedHistory } = model;
  return (
    <div className="glass-card animate-fade-in" style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14, marginBottom: 20 }}>
        <div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Calendar size={20} color="var(--accent-purple)" />
            <span>Kho Lịch Sử Kỳ Quay Toàn Diện ({filteredHistory.length} kỳ)</span>
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 4 }}>
            Tra cứu lại tất cả các kết quả mở thưởng từ kỳ đầu tiên đến nay.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-full)',
              padding: '6px 14px',
              gap: 8,
            }}
          >
            <Search size={15} color="var(--text-dim)" />
            <input
              type="text"
              placeholder="Tìm theo kỳ (01571) hoặc ngày (2026-10-04)..."
              value={historySearch}
              onChange={(e) => {
                setHistorySearch(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: '#ffffff',
                fontSize: '0.84rem',
                width: 260,
              }}
            />
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {paginatedHistory.map((draw) => {
          const sum = draw.balls.reduce((a, b) => a + b, 0);
          const evens = draw.balls.filter((n) => n % 2 === 0).length;
          const odds = draw.balls.filter((n) => n % 2 !== 0).length;

          return (
            <div
              key={draw.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 18px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                flexWrap: 'wrap',
                gap: 14,
                transition: 'all 0.2s ease',
              }}
              className="history-row"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 180 }}>
                <span
                  style={{
                    padding: '3px 8px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(245, 158, 11, 0.15)',
                    color: 'var(--accent-gold)',
                    fontWeight: 800,
                    fontSize: '0.82rem',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  #{draw.id}
                </span>
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#ffffff' }}>
                    {draw.date}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                    Tổng: {sum} • {evens}C - {odds}L
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                {draw.balls.map((num, idx) => (
                  <div
                    key={idx}
                    className="lottery-ball ball-gold"
                    style={{ width: 44, height: 44, fontSize: '1.15rem', cursor: 'pointer' }}
                    onClick={() => onSelectNumber(num.toString().padStart(2, '0'))}
                    title={`Bấm để xem lịch sử số ${num}`}
                  >
                    {num.toString().padStart(2, '0')}
                  </div>
                ))}

                {is655 && draw.special && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 6 }}>
                    <div style={{ width: 1, height: 26, background: 'rgba(255,255,255,0.1)' }} />
                    <div
                      className="lottery-ball ball-jackpot2"
                      style={{ width: 44, height: 44, fontSize: '1.15rem', cursor: 'pointer' }}
                      onClick={() => onSelectNumber(draw.special!.toString().padStart(2, '0'))}
                      title={`Jackpot 2: số ${draw.special}`}
                    >
                      {draw.special.toString().padStart(2, '0')}
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => handleLoadComboNumbers(draw.balls)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-muted)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  So vé kỳ này
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            marginTop: 20,
            paddingTop: 16,
            borderTop: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-subtle)',
              color: currentPage === 1 ? 'var(--text-dim)' : '#ffffff',
              fontSize: '0.82rem',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <ChevronLeft size={15} />
            <span>Trang trước</span>
          </button>

          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Trang <strong style={{ color: '#ffffff' }}>{currentPage}</strong> / {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-subtle)',
              color: currentPage === totalPages ? 'var(--text-dim)' : '#ffffff',
              fontSize: '0.82rem',
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <span>Trang sau</span>
            <ChevronRight size={15} />
          </button>
        </div>
      )}
    </div>
  );
};
