import React from 'react';
import { Trophy, Flame, CheckCircle2, Calendar, Info } from 'lucide-react';
import type { KenoAndMax3DViewModel } from './useKeno3D';

export const KenoPanel: React.FC<{ model: KenoAndMax3DViewModel }> = ({ model }) => {
  const { latestKeno, onSelectNumber, userKenoPicks, setUserKenoPicks, kenoPickWarning, kenoBalls, kenoStats, toggleKenoPick, matchedUserKeno, quickPickKeno } = model;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* 1. Keno Live Result Board */}
      <div className="glass-card animate-fade-in" style={{ padding: 28, position: 'relative', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14, marginBottom: 20 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#ffffff' }}>
                KẾT QUẢ VIETLOTT KENO MỚI NHẤT
              </h3>
              <span className="badge badge-hot">
                KỲ {latestKeno?.id?.startsWith('#') ? latestKeno.id : `#${latestKeno?.id || '0297327'}`}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              <Calendar size={14} />
              <span>Ngày quay: <strong>{latestKeno?.date || 'Hôm nay'}</strong></span>
              <span>•</span>
              <span>Chu kỳ quay: <strong>10 phút / kỳ (06h00 - 21h50 hàng ngày)</strong></span>
            </div>
          </div>

          {/* Tóm Tắt Kèo Phụ (Side Bets) */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <div
              style={{
                padding: '8px 14px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                color: '#34d399',
                fontSize: '0.84rem',
                fontWeight: 700,
              }}
            >
              Thuộc Tính Chẵn/Lẻ: {latestKeno?.odd_even || kenoStats.chanLeVerdict}
            </div>
            <div
              style={{
                padding: '8px 14px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(6, 182, 212, 0.15)',
                border: '1px solid rgba(6, 182, 212, 0.4)',
                color: '#22d3ee',
                fontSize: '0.84rem',
                fontWeight: 700,
              }}
            >
              Thuộc Tính Lớn/Nhỏ: {latestKeno?.big_small || kenoStats.taiXiuVerdict}
            </div>
            <div
              style={{
                padding: '8px 14px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(245, 158, 11, 0.15)',
                border: '1px solid rgba(245, 158, 11, 0.4)',
                color: 'var(--accent-gold)',
                fontSize: '0.84rem',
                fontWeight: 700,
              }}
            >
              Tổng 20 bóng: {kenoStats.totalSum} {kenoStats.totalSum > 810 ? '(Tài)' : '(Xỉu)'}
            </div>
          </div>
        </div>

        {/* Dãy 20 quả bóng Keno 3D rực rỡ */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(52px, 1fr))',
            gap: 12,
            padding: '20px 0',
            borderTop: '1px solid var(--border-subtle)',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          {kenoBalls.map((num) => {
            const numStr = num.toString().padStart(2, '0');
            const isEven = num % 2 === 0;
            return (
              <div
                key={num}
                className={`lottery-ball ${isEven ? 'ball-gold' : 'ball-cyan'}`}
                style={{
                  width: 54,
                  height: 54,
                  fontSize: '1.35rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: isEven ? '0 4px 15px rgba(245, 158, 11, 0.35)' : '0 4px 15px rgba(6, 182, 212, 0.35)',
                }}
                onClick={() => onSelectNumber(numStr)}
                title={`Bóng #${numStr} (${isEven ? 'Chẵn' : 'Lẻ'}) - Bấm để tra cứu chi tiết`}
              >
                {numStr}
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
          <span>💡 Bóng vàng: Số Chẵn ({kenoStats.evenCount}) • Bóng xanh: Số Lẻ ({kenoStats.oddCount})</span>
          <span>Bấm vào từng bóng số để mở trung tâm tra cứu lịch sử 20 năm</span>
        </div>
      </div>

      {/* 2. Bàn Cờ Keno 80 Số & Trình Thử Vé Mô Phỏng */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
          gap: 24,
        }}
      >
        {/* Cột Trái: Bàn Cờ Ma Trận 80 Số */}
        <div className="glass-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Flame size={18} color="var(--accent-red)" />
              BÀN CỜ NHIỆT KENO (1 - 80)
            </h4>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Highlight 20 số vừa quay
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(10, 1fr)',
              gap: 6,
              padding: 10,
              background: 'rgba(15, 23, 42, 0.7)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              overflowX: 'auto',
            }}
          >
            {Array.from({ length: 80 }, (_, i) => i + 1).map((n) => {
              const isHit = kenoBalls.includes(n);
              const isPicked = userKenoPicks.includes(n);
              const nStr = n.toString().padStart(2, '0');

              let bg = 'rgba(255, 255, 255, 0.03)';
              let color = 'var(--text-muted)';
              let border = '1px solid rgba(255, 255, 255, 0.06)';

              if (isHit && isPicked) {
                bg = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
                color = '#ffffff';
                border = '1px solid #34d399';
              } else if (isHit) {
                bg = 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
                color = '#ffffff';
                border = '1px solid #fbbf24';
              } else if (isPicked) {
                bg = 'rgba(56, 189, 248, 0.2)';
                color = 'var(--accent-cyan)';
                border = '1px solid var(--accent-cyan)';
              }

              return (
                <button
                  key={n}
                  onClick={() => toggleKenoPick(n)}
                  style={{
                    height: 38,
                    borderRadius: 6,
                    background: bg,
                    color: color,
                    border: border,
                    fontWeight: isHit || isPicked ? 800 : 500,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s ease',
                    boxShadow: isHit ? '0 2px 8px rgba(245, 158, 11, 0.3)' : 'none',
                  }}
                  title={`Số ${nStr}: Bấm để chọn thử vé`}
                >
                  {nStr}
                </button>
              );
            })}
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: '0.78rem', color: 'var(--text-dim)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 12, height: 12, borderRadius: 3, background: 'var(--accent-gold)' }}></span>
              Bóng trúng kỳ này
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 12, height: 12, borderRadius: 3, background: 'var(--accent-cyan)' }}></span>
              Số bạn đang chọn
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 12, height: 12, borderRadius: 3, background: 'var(--accent-emerald)' }}></span>
              Số bạn chọn ĐÃ TRÚNG!
            </span>
          </div>
        </div>

        {/* Cột Phải: Bộ Thử Vé & Mô Phỏng Bậc 1 - 10 */}
        <div className="glass-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Trophy size={18} color="var(--accent-gold)" />
              ĐỐI SOÁT & THỬ VÉ KENO (BẬC 1 - 10)
            </h4>
            {userKenoPicks.length > 0 && (
              <button
                onClick={() => setUserKenoPicks([])}
                style={{ background: 'none', border: 'none', color: 'var(--accent-red)', cursor: 'pointer', fontSize: '0.8rem' }}
              >
                Xóa chọn
              </button>
            )}
          </div>

          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Chọn từ 1 đến 10 con số trực tiếp trên bàn cờ hoặc bấm chọn nhanh để thử đối soát xem vé của bạn trúng bao nhiêu con số ở kỳ này:
          </p>

          {/* Nút Chọn Nhanh Vé Bậc 1 - 10 */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[1, 2, 4, 6, 8, 10].map((bậc) => (
              <button
                key={bậc}
                className="tab-btn"
                onClick={() => quickPickKeno(bậc)}
                style={{ fontSize: '0.78rem', padding: '6px 12px' }}
              >
                Random Bậc {bậc}
              </button>
            ))}
          </div>

          {/* Danh Sách Số Bạn Đã Chọn */}
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.8)',
              padding: '14px 18px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>
                Vé Bạn Chọn ({userKenoPicks.length}/10 số - Keno Bậc {userKenoPicks.length || 0}):
              </span>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: matchedUserKeno.length > 0 ? 'var(--accent-emerald)' : 'var(--text-dim)' }}>
                Trúng: {matchedUserKeno.length} / {userKenoPicks.length} số
              </span>
            </div>

            {userKenoPicks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                Chưa có số nào được chọn. Hãy bấm vào các ô trên bàn cờ hoặc bấm "Random Bậc X".
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {userKenoPicks.map((pick) => {
                  const isHit = kenoBalls.includes(pick);
                  return (
                    <div
                      key={pick}
                      className={`lottery-ball ${isHit ? 'ball-emerald' : 'ball-slate'}`}
                      style={{ width: 40, height: 40, fontSize: '1rem', fontWeight: 800 }}
                    >
                      {pick.toString().padStart(2, '0')}
                    </div>
                  );
                })}
              </div>
            )}

            {kenoPickWarning && (
              <div style={{ fontSize: '0.8rem', color: 'var(--accent-red)', fontWeight: 600 }}>
                ⚠️ {kenoPickWarning}
              </div>
            )}
          </div>

          {/* Kết Quả Trúng Thưởng Mô Phỏng */}
          {userKenoPicks.length > 0 && (
            <div
              style={{
                padding: '14px 18px',
                borderRadius: 'var(--radius-md)',
                background: matchedUserKeno.length >= Math.ceil(userKenoPicks.length / 2) ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.1)',
                border: `1px solid ${matchedUserKeno.length >= Math.ceil(userKenoPicks.length / 2) ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.3)'}`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {matchedUserKeno.length >= Math.ceil(userKenoPicks.length / 2) ? (
                  <CheckCircle2 size={18} color="var(--accent-emerald)" />
                ) : (
                  <Info size={18} color="var(--accent-red)" />
                )}
                <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#ffffff' }}>
                  {matchedUserKeno.length === userKenoPicks.length
                    ? `🎉 XUẤT SẮC! Trúng 100% (${matchedUserKeno.length}/${userKenoPicks.length}) con số đã chọn!`
                    : matchedUserKeno.length > 0
                    ? `Khớp ${matchedUserKeno.length} con số [ ${matchedUserKeno.map((n) => n.toString().padStart(2, '0')).join(', ')} ]`
                    : 'Chưa trùng con số nào trong kỳ quay này.'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
