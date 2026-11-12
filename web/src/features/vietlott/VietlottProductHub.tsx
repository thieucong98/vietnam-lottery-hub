import React from 'react';
import { Calendar, Trophy, Dice5, CheckCircle2, Clock, Flame, Layers } from 'lucide-react';
import { OfficialResultsLink } from '../../components/OfficialResultsLink';
import { useVietlottHub } from './useVietlottHub';
import { QuickPickPanel } from './QuickPickPanel';
import { ComboBaoPanel } from './ComboBaoPanel';
import { CooccurrencePanel } from './CooccurrencePanel';
import { DrawHistoryPanel } from './DrawHistoryPanel';
export type { VietlottProductHubProps } from './useVietlottHub';
import type { VietlottProductHubProps } from './useVietlottHub';

export const VietlottProductHub: React.FC<VietlottProductHubProps> = (props) => {
  const model = useVietlottHub(props);
  const { onSelectNumber, activeTool, setActiveTool, selectedBalls, is655, gameName, scheduleInfo, sortedDraws, latestDraw, handleTransferToComboBao } = model;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* 1. HERO BANNER: KẾT QUẢ MỚI NHẤT & QUỸ THƯỞNG JACKPOT */}
      <div
        className="glass-card animate-fade-in"
        style={{
          padding: '24px 28px',
          position: 'relative',
          overflow: 'hidden',
          background: is655
            ? 'linear-gradient(135deg, rgba(244, 63, 94, 0.12) 0%, rgba(15, 23, 42, 0.95) 70%)'
            : 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(15, 23, 42, 0.95) 70%)',
          border: is655 ? '1px solid rgba(244, 63, 94, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span
                style={{
                  padding: '4px 12px',
                  borderRadius: 'var(--radius-full)',
                  background: is655 ? '#f43f5e' : '#f59e0b',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  letterSpacing: '0.05em',
                }}
              >
                VIETLOTT CHÍNH THỨC
              </span>
              <h1 style={{ fontSize: '1.45rem', fontWeight: 900, color: '#ffffff' }}>
                Xổ Số Tự Chọn {gameName}
              </h1>
              {latestDraw && (
                <span className="badge badge-hot" style={{ fontSize: '0.84rem' }}>
                  Kỳ #{latestDraw.id}
                </span>
              )}
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
              <Clock size={14} color="var(--accent-gold)" />
              <span>{scheduleInfo}</span>
              {latestDraw && (
                <>
                  <span style={{ opacity: 0.4 }}>•</span>
                  <span>Mở thưởng ngày: <strong style={{ color: '#ffffff' }}>{latestDraw.date}</strong></span>
                </>
              )}
            </p>
          </div>

          {/* Ước lượng giải Jackpot tích lũy */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              background: 'rgba(0,0,0,0.4)',
              padding: '10px 18px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase' }}>
                {is655 ? 'Jackpot 1 Khởi Điểm' : 'Jackpot Khởi Điểm'}
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--accent-gold)' }}>
                {is655 ? '30+ TỶ ĐỒNG' : '12+ TỶ ĐỒNG'}
              </div>
            </div>
            {is655 && (
              <>
                <div style={{ width: 1, height: 32, background: 'rgba(255,255,255,0.1)' }} />
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase' }}>
                    Jackpot 2 Khởi Điểm
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#fb7185' }}>
                    3+ TỶ ĐỒNG
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Dãy bóng số kết quả kỳ mới nhất */}
        {latestDraw && (
          <div style={{ marginTop: 20, paddingTop: 18, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Trophy size={14} color="var(--accent-gold)" />
              <span>Bộ số trúng thưởng kỳ gần nhất (Bấm bóng để xem chu kỳ 20 năm):</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              {latestDraw.balls.map((num, idx) => {
                const numStr = num.toString().padStart(2, '0');
                return (
                  <div
                    key={idx}
                    className="lottery-ball ball-gold"
                    style={{ width: 56, height: 56, fontSize: '1.45rem', cursor: 'pointer' }}
                    onClick={() => onSelectNumber(numStr)}
                    title={`Bấm để xem phân tích số ${numStr}`}
                  >
                    {numStr}
                  </div>
                );
              })}

              {is655 && latestDraw.special && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 8 }}>
                  <div style={{ width: 2, height: 36, background: 'rgba(255,255,255,0.15)' }} />
                  <div style={{ textAlign: 'center' }}>
                    <div
                      className="lottery-ball ball-jackpot2"
                      style={{ width: 56, height: 56, fontSize: '1.45rem', cursor: 'pointer' }}
                      onClick={() => onSelectNumber(latestDraw.special!.toString().padStart(2, '0'))}
                      title={`Bóng đặc biệt Jackpot 2: số ${latestDraw.special}`}
                    >
                      {latestDraw.special.toString().padStart(2, '0')}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: '#fb7185', fontWeight: 800, marginTop: 4 }}>
                      JACKPOT 2
                    </div>
                  </div>
                </div>
              )}

              {/* Nút hành động nhanh */}
              <div style={{ display: 'flex', gap: 8, marginLeft: 'auto', flexWrap: 'wrap' }}>
                <button
                  onClick={() => handleTransferToComboBao(latestDraw.balls)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid var(--border-subtle)',
                    color: '#ffffff',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <CheckCircle2 size={14} color="var(--accent-emerald)" />
                  <span>Dò tổ hợp kỳ này</span>
                </button>
              </div>
            </div>
            <OfficialResultsLink sources={['vietlott']} />
          </div>
        )}
      </div>

      {/* 2. THANH ĐIỀU HƯỚNG CÔNG CỤ TẠI CHỖ (4 MODULAR SEGMENTS) */}
      <div
        className="glass-card"
        style={{
          padding: 8,
          display: 'flex',
          gap: 8,
          borderRadius: 'var(--radius-md)',
          background: 'rgba(15, 23, 42, 0.8)',
          border: '1px solid var(--border-subtle)',
          overflowX: 'auto',
        }}
      >
        {/* TAB 1: GỢI Ý SỐ */}
        <button
          onClick={() => setActiveTool('quick_pick')}
          style={{
            flex: 1,
            padding: '12px 16px',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            background: activeTool === 'quick_pick' ? 'linear-gradient(135deg, #f59e0b, #ef4444)' : 'transparent',
            color: activeTool === 'quick_pick' ? '#ffffff' : 'var(--text-muted)',
            fontWeight: 700,
            fontSize: '0.88rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 7,
            whiteSpace: 'nowrap',
            transition: 'all 0.2s ease',
          }}
        >
          <Dice5 size={17} />
          <span>Gợi Ý Số (Quick Pick)</span>
        </button>

        {/* TAB 2: TRA CỨU BỘ SỐ & VÉ BAO */}
        <button
          onClick={() => setActiveTool('combo_bao')}
          style={{
            flex: 1,
            padding: '12px 16px',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            background: activeTool === 'combo_bao' ? 'linear-gradient(135deg, #10b981, #06b6d4)' : 'transparent',
            color: activeTool === 'combo_bao' ? '#ffffff' : 'var(--text-muted)',
            fontWeight: 700,
            fontSize: '0.88rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 7,
            whiteSpace: 'nowrap',
            transition: 'all 0.2s ease',
          }}
        >
          <Layers size={17} />
          <span>Bộ Số & Vé Bao ({selectedBalls.length} bóng)</span>
        </button>

        {/* TAB 3: MA TRẬN CẶP & BỘ BA */}
        <button
          onClick={() => setActiveTool('cooccurrence')}
          style={{
            flex: 1,
            padding: '12px 16px',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            background: activeTool === 'cooccurrence' ? 'linear-gradient(135deg, #ec4899, #8b5cf6)' : 'transparent',
            color: activeTool === 'cooccurrence' ? '#ffffff' : 'var(--text-muted)',
            fontWeight: 700,
            fontSize: '0.88rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 7,
            whiteSpace: 'nowrap',
            transition: 'all 0.2s ease',
          }}
        >
          <Flame size={17} />
          <span>Cặp & Bộ Ba Đi Cùng Nhau</span>
        </button>

        {/* TAB 4: KHO LỊCH SỬ KỲ QUAY */}
        <button
          onClick={() => setActiveTool('history')}
          style={{
            flex: 1,
            padding: '12px 16px',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            background: activeTool === 'history' ? 'linear-gradient(135deg, #8b5cf6, #3b82f6)' : 'transparent',
            color: activeTool === 'history' ? '#ffffff' : 'var(--text-muted)',
            fontWeight: 700,
            fontSize: '0.88rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 7,
            whiteSpace: 'nowrap',
            transition: 'all 0.2s ease',
          }}
        >
          <Calendar size={17} />
          <span>Kho Lịch Sử ({sortedDraws.length} kỳ)</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* MODULE 1: 🎲 QUICK PICK PRO                             */}
      {/* ======================================================== */}
      {activeTool === 'quick_pick' && <QuickPickPanel model={model} />}

      {/* ======================================================== */}
      {/* MODULE 2: 🔍 TRA CỨU BỘ SỐ & VÉ BAO (SYSTEM BET)          */}
      {/* ======================================================== */}
      {activeTool === 'combo_bao' && <ComboBaoPanel model={model} />}

      {/* ======================================================== */}
      {/* MODULE 3: 📊 MA TRẬN CẶP & BỘ BA ĐI CÙNG NHAU           */}
      {/* ======================================================== */}
      {activeTool === 'cooccurrence' && <CooccurrencePanel model={model} />}

      {/* ======================================================== */}
      {/* MODULE 4: 📜 KHO LỊCH SỬ KỲ QUAY TOÀN DIỆN              */}
      {/* ======================================================== */}
      {activeTool === 'history' && <DrawHistoryPanel model={model} />}
    </div>
  );
};

