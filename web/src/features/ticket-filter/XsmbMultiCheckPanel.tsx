import React from 'react';
import type { SmartFilterAndCheckerModel } from './useTicketFilter';

export const XsmbMultiCheckPanel: React.FC<{ model: SmartFilterAndCheckerModel }> = ({ model }) => {
  const { onSelectNumber, ticketInput, setTicketInput, specialPrizeNumber, checkerReport } = model;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="glass-card animate-fade-in" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff' }}>THỐNG KÊ NHIỀU SỐ TRONG KỲ XSMB MỚI NHẤT</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Nhập nhiều số 2 chữ số để xem mỗi số xuất hiện bao nhiêu lần trong 27 giải của kỳ mới nhất. Đây là thống kê dữ liệu; vé XSKT miền Bắc hợp pháp là vé 5 chữ số, hãy dò vé tại tab XSMB.
          </p>
        </div>

        <div>
          <textarea
            value={ticketInput}
            onChange={(e) => setTicketInput(e.target.value)}
            placeholder="Nhập các số 2 chữ số (cách nhau bởi dấu phẩy, khoảng trắng hoặc dấu gạch)..."
            rows={3}
            style={{
              width: '100%',
              padding: 12,
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(30, 41, 59, 0.7)',
              border: '1px solid var(--border-subtle)',
              color: '#ffffff',
              fontSize: '0.95rem',
              fontFamily: 'var(--font-mono)',
              outline: 'none',
              resize: 'vertical',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            onClick={() => setTicketInput('03, 14, 28, 51, 68, 86, 89, 90')}
            style={{
              padding: '4px 10px',
              borderRadius: 4,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-dim)',
              fontSize: '0.75rem',
              cursor: 'pointer',
            }}
          >
            Ví dụ 8 số
          </button>
          <button
            onClick={() => setTicketInput('00, 11, 22, 33, 44, 55, 66, 77, 88, 99')}
            style={{
              padding: '4px 10px',
              borderRadius: 4,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-dim)',
              fontSize: '0.75rem',
              cursor: 'pointer',
            }}
          >
            Ví dụ số kép
          </button>
          <button
            onClick={() => setTicketInput('')}
            style={{
              padding: '4px 10px',
              borderRadius: 4,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--accent-red)',
              fontSize: '0.75rem',
              cursor: 'pointer',
            }}
          >
            Xóa sạch
          </button>
        </div>
      </div>

      {/* Báo cáo kết quả so vé */}
      <div className="glass-card animate-fade-in" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
          <div>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff' }}>KẾT QUẢ THỐNG KÊ</h4>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 4 }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Tổng số đã nhập: <strong>{checkerReport.totalTickets}</strong>
              </span>
              <span>•</span>
              <span style={{ fontSize: '0.85rem', color: 'var(--accent-emerald)', fontWeight: 700 }}>
                Có xuất hiện: {checkerReport.matchCount} / {checkerReport.totalTickets} ({checkerReport.rate}%)
              </span>
              <span>•</span>
              <span style={{ fontSize: '0.85rem', color: 'var(--accent-gold)', fontWeight: 700 }}>
                Tổng số lần xuất hiện: {checkerReport.totalHits}
              </span>
            </div>
          </div>

          {checkerReport.hitSpecial && (
            <div className="badge badge-hot" style={{ fontSize: '0.9rem', padding: '6px 14px' }}>
              Có số trùng 2 số cuối Giải Đặc Biệt ({specialPrizeNumber})
            </div>
          )}
        </div>

        {/* Chi tiết từng số */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
            gap: 12,
          }}
        >
          {checkerReport.details.map((item) => (
            <div
              key={item.number}
              className="glass-card"
              onClick={() => onSelectNumber(item.number)}
              style={{
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                background: item.isWin
                  ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(6, 182, 212, 0.15))'
                  : 'rgba(255, 255, 255, 0.02)',
                border: item.isSpecial
                  ? '2px solid #ef4444'
                  : item.isWin
                  ? '1px solid var(--accent-emerald)'
                  : '1px solid var(--border-subtle)',
              }}
              title="Bấm để xem lịch sử số"
            >
              <div
                className={`lottery-ball ${item.isSpecial ? 'ball-rose' : item.isWin ? 'ball-gold' : 'ball-slate'}`}
                style={{ width: 36, height: 36, fontSize: '1rem' }}
              >
                {item.number}
              </div>

              <div style={{ textAlign: 'right' }}>
                {item.isSpecial ? (
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--accent-rose)' }}>
                    2 SỐ CUỐI ĐB
                  </div>
                ) : item.isWin ? (
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>
                    {item.hits} LẦN
                  </div>
                ) : (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                    Không có
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
