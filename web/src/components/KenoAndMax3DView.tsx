import React, { useState, useMemo } from 'react';
import {
  Zap,
  Sparkles,
  Trophy,
  Flame,
  CheckCircle2,
  Calendar,
  Layers,
  Award,
  Dice5,
  TrendingUp,
  BarChart3,
  Dices,
  RefreshCw,
  Info,
} from 'lucide-react';
import { LatestDrawKeno, LatestDraw3D } from '../types';

interface KenoAndMax3DViewProps {
  latestKeno?: LatestDrawKeno;
  latest3D?: LatestDraw3D;
  latest3DPro?: LatestDraw3D;
  onSelectNumber: (num: string) => void;
}

export const KenoAndMax3DView: React.FC<KenoAndMax3DViewProps> = ({
  latestKeno,
  latest3D,
  latest3DPro,
  onSelectNumber,
}) => {
  const [subTab, setSubTab] = useState<'keno' | 'max3d' | 'max3d_pro'>('keno');
  const [userKenoPicks, setUserKenoPicks] = useState<number[]>([]);
  const [kenoPickWarning, setKenoPickWarning] = useState<string | null>(null);

  // ========================================================
  // KENO ANALYTICS LOGIC
  // ========================================================
  const kenoBalls = useMemo(() => {
    return latestKeno?.result || [];
  }, [latestKeno]);

  const kenoStats = useMemo(() => {
    if (!kenoBalls.length) {
      return {
        totalSum: 0,
        evenCount: 0,
        oddCount: 0,
        smallCount: 0, // 01 - 40
        bigCount: 0,   // 41 - 80
        taiXiuVerdict: 'N/A',
        chanLeVerdict: 'N/A',
      };
    }

    const totalSum = kenoBalls.reduce((acc, b) => acc + b, 0);
    const evenCount = kenoBalls.filter((b) => b % 2 === 0).length;
    const oddCount = kenoBalls.length - evenCount;
    const smallCount = kenoBalls.filter((b) => b <= 40).length;
    const bigCount = kenoBalls.length - smallCount;

    let taiXiuVerdict = 'Hòa';
    if (smallCount > bigCount) taiXiuVerdict = `Xỉu (${smallCount} số)`;
    else if (bigCount > smallCount) taiXiuVerdict = `Tài (${bigCount} số)`;

    let chanLeVerdict = 'Chẵn Lẻ Hòa';
    if (evenCount > oddCount) chanLeVerdict = `Chẵn (${evenCount} số)`;
    else if (oddCount > evenCount) chanLeVerdict = `Lẻ (${oddCount} số)`;

    return {
      totalSum,
      evenCount,
      oddCount,
      smallCount,
      bigCount,
      taiXiuVerdict,
      chanLeVerdict,
    };
  }, [kenoBalls]);

  // Bộ chọn số thử vé Keno (Tối đa 10 số)
  const toggleKenoPick = (num: number) => {
    setKenoPickWarning(null);
    if (userKenoPicks.includes(num)) {
      setUserKenoPicks(userKenoPicks.filter((n) => n !== num));
    } else {
      if (userKenoPicks.length >= 10) {
        setKenoPickWarning('Bạn chỉ có thể chọn tối đa 10 số cho một vé Keno (Bậc 1 đến Bậc 10)!');
        return;
      }
      setUserKenoPicks([...userKenoPicks, num].sort((a, b) => a - b));
    }
  };

  const matchedUserKeno = useMemo(() => {
    const kenoSet = new Set(kenoBalls);
    return userKenoPicks.filter((p) => kenoSet.has(p));
  }, [userKenoPicks, kenoBalls]);

  const quickPickKeno = (count: number) => {
    setKenoPickWarning(null);
    const pool = Array.from({ length: 80 }, (_, i) => i + 1);
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    setUserKenoPicks(pool.slice(0, count).sort((a, b) => a - b));
  };

  // ========================================================
  // MAX 3D DIGIT FREQUENCY LOGIC
  // ========================================================
  const current3DData = subTab === 'max3d' ? latest3D : latest3DPro;

  const digitFrequency3D = useMemo(() => {
    if (!current3DData?.result) return Array(10).fill(0);
    const counts = Array(10).fill(0);
    Object.values(current3DData.result).forEach((prizes) => {
      prizes.forEach((numStr) => {
        for (const char of numStr) {
          const digit = parseInt(char, 10);
          if (!isNaN(digit)) counts[digit]++;
        }
      });
    });
    return counts;
  }, [current3DData]);

  const maxDigitCount = Math.max(...digitFrequency3D, 1);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* HEADER & TABS CHUYỂN ĐỔI GAME */}
      <div
        className="glass-card"
        style={{
          padding: '24px 28px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.8) 100%)',
          border: '1px solid rgba(245, 158, 11, 0.25)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            className="lottery-ball ball-gold"
            style={{ width: 50, height: 50, fontSize: '1.3rem', boxShadow: '0 0 25px rgba(245, 158, 11, 0.4)' }}
          >
            <Zap size={24} color="#0f172a" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
                TRUNG TÂM VIETLOTT KENO & MAX 3D / 3D PRO
              </h2>
              <span className="badge badge-hot">QUAY NHANH & 3 CHỮ SỐ</span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4 }}>
              Theo dõi kết quả Keno 10 phút/kỳ (20 số bóng, tỷ lệ Chẵn/Lẻ/Tài/Xỉu) và cơ cấu giải thưởng bộ ba số Max 3D & Max 3D Pro.
            </p>
          </div>
        </div>

        {/* Nút Tab Chuyển Đổi 3 Trò Chơi */}
        <div style={{ display: 'flex', gap: 8, background: 'rgba(0, 0, 0, 0.3)', padding: 5, borderRadius: 'var(--radius-md)' }}>
          <button
            className={`tab-btn ${subTab === 'keno' ? 'active' : ''}`}
            onClick={() => setSubTab('keno')}
            style={{ fontSize: '0.86rem', padding: '8px 18px' }}
          >
            <Zap size={16} />
            <span>Keno (20 Bóng)</span>
          </button>
          <button
            className={`tab-btn ${subTab === 'max3d' ? 'active' : ''}`}
            onClick={() => setSubTab('max3d')}
            style={{ fontSize: '0.86rem', padding: '8px 18px' }}
          >
            <Dices size={16} />
            <span>Max 3D</span>
          </button>
          <button
            className={`tab-btn ${subTab === 'max3d_pro' ? 'active' : ''}`}
            onClick={() => setSubTab('max3d_pro')}
            style={{ fontSize: '0.86rem', padding: '8px 18px' }}
          >
            <Sparkles size={16} color="var(--accent-gold)" />
            <span>Max 3D Pro</span>
          </button>
        </div>
      </div>

      {/* ========================================================
          PHÂN HỆ 1: VIETLOTT KENO (QUAY NHANH 10 PHÚT/KỲ)
          ======================================================== */}
      {subTab === 'keno' && (
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
                  Highlight 20 bóng vừa nổ
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
      )}

      {/* ========================================================
          PHÂN HỆ 2: VIETLOTT MAX 3D & MAX 3D PRO
          ======================================================== */}
      {(subTab === 'max3d' || subTab === 'max3d_pro') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Bảng Mở Thưởng Max 3D / Max 3D Pro */}
          <div className="glass-card animate-fade-in" style={{ padding: 28, position: 'relative', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14, marginBottom: 20 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#ffffff' }}>
                    {subTab === 'max3d' ? 'BẢNG MỞ THƯỞNG VIETLOTT MAX 3D' : 'BẢNG MỞ THƯỞNG VIETLOTT MAX 3D PRO'}
                  </h3>
                  <span className="badge badge-hot">KỲ #{current3DData?.id || '#00784'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  <Calendar size={14} />
                  <span>Ngày mở thưởng: <strong>{current3DData?.date || 'Gần nhất'}</strong></span>
                  <span>•</span>
                  <span>
                    {subTab === 'max3d'
                      ? 'Quay thưởng Thứ 2, Thứ 4, Thứ 6 hàng tuần lúc 18h00'
                      : 'Quay thưởng Thứ 3, Thứ 5, Thứ 7 hàng tuần lúc 18h00'}
                  </span>
                </div>
              </div>

              <span className="badge badge-normal" style={{ fontSize: '0.82rem' }}>
                Trúng 1 tỷ - 2 tỷ đồng / vé 10.000đ
              </span>
            </div>

            {/* Các Hạng Giải Thưởng Chuẩn Vietlott */}
            {current3DData?.result ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* 1. GIẢI ĐẶC BIỆT */}
                <div
                  style={{
                    background: 'rgba(245, 158, 11, 0.12)',
                    border: '1px solid rgba(245, 158, 11, 0.45)',
                    borderRadius: 'var(--radius-md)',
                    padding: '20px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 16,
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Trophy size={20} color="var(--accent-gold)" />
                      <strong style={{ fontSize: '1.15rem', color: 'var(--accent-gold)', letterSpacing: 0.5 }}>
                        GIẢI ĐẶC BIỆT
                      </strong>
                    </div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {subTab === 'max3d' ? 'Trúng 2 bộ ba số (1 tỷ đồng/vé)' : 'Trúng 2 bộ ba số theo thứ tự (2 tỷ đồng/vé)'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    {(current3DData.result['Giải Đặc biệt'] || []).map((set, idx) => (
                      <div
                        key={idx}
                        className="lottery-ball ball-gold"
                        style={{
                          width: 'auto',
                          minWidth: 90,
                          height: 52,
                          padding: '0 18px',
                          borderRadius: 26,
                          fontSize: '1.6rem',
                          fontWeight: 900,
                          boxShadow: '0 6px 20px rgba(245, 158, 11, 0.4)',
                        }}
                      >
                        {set}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. GIẢI NHẤT */}
                <div
                  style={{
                    background: 'rgba(56, 189, 248, 0.08)',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    borderRadius: 'var(--radius-md)',
                    padding: '18px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 16,
                  }}
                >
                  <div>
                    <strong style={{ fontSize: '1rem', color: 'var(--accent-cyan)' }}>
                      GIẢI NHẤT (4 BỘ BA SỐ)
                    </strong>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Trúng bất kỳ 2 trong 4 bộ ba số
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    {(current3DData.result['Giải Nhất'] || []).map((set, idx) => (
                      <div
                        key={idx}
                        className="lottery-ball ball-cyan"
                        style={{
                          width: 'auto',
                          minWidth: 76,
                          height: 46,
                          padding: '0 14px',
                          borderRadius: 23,
                          fontSize: '1.35rem',
                          fontWeight: 800,
                        }}
                      >
                        {set}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. GIẢI NHÌ */}
                <div
                  style={{
                    background: 'rgba(16, 185, 129, 0.06)',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    borderRadius: 'var(--radius-md)',
                    padding: '18px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 16,
                  }}
                >
                  <div>
                    <strong style={{ fontSize: '1rem', color: '#34d399' }}>
                      GIẢI NHÌ (6 BỘ BA SỐ)
                    </strong>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Trúng bất kỳ 2 trong 6 bộ ba số
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    {(current3DData.result['Giải Nhì'] || []).map((set, idx) => (
                      <div
                        key={idx}
                        className="lottery-ball ball-emerald"
                        style={{
                          width: 'auto',
                          minWidth: 70,
                          height: 42,
                          padding: '0 12px',
                          borderRadius: 21,
                          fontSize: '1.25rem',
                          fontWeight: 700,
                        }}
                      >
                        {set}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. GIẢI BA */}
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '18px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 16,
                  }}
                >
                  <div>
                    <strong style={{ fontSize: '1rem', color: 'var(--text-main)' }}>
                      GIẢI BA (8 BỘ BA SỐ)
                    </strong>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Trúng bất kỳ 2 trong 8 bộ ba số
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {(current3DData.result['Giải ba'] || []).map((set, idx) => (
                      <div
                        key={idx}
                        className="lottery-ball ball-slate"
                        style={{
                          width: 'auto',
                          minWidth: 64,
                          height: 40,
                          padding: '0 10px',
                          borderRadius: 20,
                          fontSize: '1.15rem',
                          fontWeight: 700,
                        }}
                      >
                        {set}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-dim)' }}>
                Đang cập nhật dữ liệu bảng giải Max 3D...
              </div>
            )}
          </div>

          {/* Biểu đồ phân bổ chữ số 0 - 9 trong kỳ mở thưởng Max 3D */}
          <div className="glass-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: 8 }}>
                <BarChart3 size={18} color="var(--accent-cyan)" />
                PHÂN BỔ TẦN SUẤT CHỮ SỐ (0 - 9) TRONG KỲ NÀY
              </h4>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                Tổng cộng {digitFrequency3D.reduce((a, b) => a + b, 0)} lượt xuất hiện chữ số
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 10 }}>
              {digitFrequency3D.map((count, digit) => {
                const pct = (count / maxDigitCount) * 100;
                return (
                  <div
                    key={digit}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 8,
                      background: 'rgba(15, 23, 42, 0.6)',
                      padding: '12px 6px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <span style={{ fontSize: '0.78rem', color: count > 0 ? 'var(--accent-gold)' : 'var(--text-dim)', fontWeight: 700 }}>
                      {count} lần
                    </span>
                    <div
                      style={{
                        width: 14,
                        height: 70,
                        background: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: 7,
                        display: 'flex',
                        alignItems: 'flex-end',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: '100%',
                          height: `${pct}%`,
                          background: count > 3 ? 'var(--accent-gold)' : count > 0 ? 'var(--accent-cyan)' : 'transparent',
                          borderRadius: 7,
                          transition: 'height 0.4s ease',
                        }}
                      />
                    </div>
                    <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff' }}>
                      {digit}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
