import React, { useState } from 'react';
import { Calendar, Trophy, Sparkles, ChevronRight, Award, Flame, Dice5 } from 'lucide-react';
import { LatestDrawXSMB, LatestDrawVietlott, LatestDraw3D, LatestDrawKeno } from '../types';

interface LiveResultsBoardProps {
  gameType: 'xsmb' | 'vietlott_655' | 'vietlott_645';
  drawData: any;
  onSelectNumber: (num: string) => void;
  latest3D?: LatestDraw3D;
  latestKeno?: LatestDrawKeno;
}

export const LiveResultsBoard: React.FC<LiveResultsBoardProps> = ({
  gameType,
  drawData,
  onSelectNumber,
  latest3D,
  latestKeno,
}) => {
  const [hoveredNumber, setHoveredNumber] = useState<string | null>(null);

  if (!drawData) {
    return (
      <div className="glass-card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-dim)' }}>
        Đang tải kết quả mở thưởng...
      </div>
    );
  }

  // Chế độ Vietlott
  if (gameType === 'vietlott_655' || gameType === 'vietlott_645') {
    const is655 = gameType === 'vietlott_655';
    const mainNumbers = is655 ? drawData.result.slice(0, 6) : drawData.result.slice(0, 6);
    const jackpot2Number = is655 && drawData.result.length > 6 ? drawData.result[6] : null;

    return (
      <div className="glass-card animate-fade-in" style={{ padding: 28, position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute',
          top: -40,
          right: -40,
          width: 150,
          height: 150,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(245, 158, 11, 0.15) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff' }}>
                {is655 ? 'KẾT QUẢ VIETLOTT POWER 6/55' : 'KẾT QUẢ VIETLOTT MEGA 6/45'}
              </h2>
              <span className="badge badge-hot">KỲ #{drawData.id}</span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <Calendar size={14} />
              Ngày mở thưởng: <strong>{drawData.date}</strong>
            </p>
          </div>

          <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
            Bấm vào bóng số để xem thống kê chu kỳ gan
          </div>
        </div>

        {/* Dãy bóng số kết quả */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', padding: '16px 0' }}>
          {mainNumbers.map((num: number, idx: number) => {
            const numStr = num.toString().padStart(2, '0');
            return (
              <div
                key={idx}
                className="lottery-ball ball-gold"
                style={{ width: 62, height: 62, fontSize: '1.6rem', cursor: 'pointer' }}
                onClick={() => onSelectNumber(numStr)}
                title={`Bấm để xem lịch sử số ${numStr}`}
              >
                {numStr}
              </div>
            );
          })}

          {jackpot2Number !== null && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginLeft: 10 }}>
              <div style={{ width: 2, height: 40, background: 'rgba(255,255,255,0.1)' }} />
              <div style={{ textAlign: 'center' }}>
                <div
                  className="lottery-ball ball-jackpot2"
                  style={{ width: 62, height: 62, fontSize: '1.6rem', cursor: 'pointer' }}
                  onClick={() => onSelectNumber(jackpot2Number.toString().padStart(2, '0'))}
                  title={`Bóng đặc biệt Jackpot 2: số ${jackpot2Number}`}
                >
                  {jackpot2Number.toString().padStart(2, '0')}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#fb7185', fontWeight: 700, marginTop: 4 }}>
                  JACKPOT 2
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Các sản phẩm Vietlott đồng hành: Max 3D & Keno */}
        <CompanionVietlottGames latest3D={latest3D} latestKeno={latestKeno} />
      </div>
    );
  }

  // Chế độ XSMB
  const xsmb = drawData as LatestDrawXSMB;
  const p = xsmb.raw_prizes || {};

  // Hàm kiểm tra xem giải này có chứa số 2 chữ số đang hover không
  const checkMatchesHover = (prizeValue: any) => {
    if (!hoveredNumber || prizeValue === undefined || prizeValue === null) return false;
    const str = prizeValue.toString();
    return str.endsWith(hoveredNumber);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 }}>
      {/* Cột 1: Bảng 27 giải thưởng truyền thống */}
      <div className="glass-card animate-fade-in" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Trophy size={20} color="var(--accent-gold)" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff' }}>
              BẢNG MỞ THƯỞNG XSMB
            </h2>
          </div>
          <span className="badge badge-normal" style={{ fontSize: '0.8rem' }}>
            {xsmb.date}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Giải Đặc Biệt */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: 'linear-gradient(90deg, rgba(239, 68, 68, 0.2), rgba(245, 158, 11, 0.15))',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: 'var(--radius-sm)',
            padding: '10px 16px',
            justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#fca5a5', textTransform: 'uppercase' }}>
              Giải Đặc Biệt
            </span>
            <span 
              className={`mono ${checkMatchesHover(p.special) ? 'highlighted-prize' : ''}`}
              style={{ fontSize: '1.75rem', fontWeight: 900, color: '#ef4444', letterSpacing: '0.12em', cursor: 'pointer' }}
              onClick={() => onSelectNumber((p.special % 100).toString().padStart(2, '0'))}
            >
              {p.special.toString().padStart(5, '0')}
            </span>
          </div>

          {/* Giải Nhất */}
          <PrizeRow label="Giải Nhất" prizes={[p.prize1]} hoveredNumber={hoveredNumber} onSelectNumber={onSelectNumber} />
          
          {/* Giải Nhì */}
          <PrizeRow label="Giải Nhì" prizes={[p.prize2_1, p.prize2_2]} hoveredNumber={hoveredNumber} onSelectNumber={onSelectNumber} />

          {/* Giải Ba */}
          <PrizeRow label="Giải Ba" prizes={[p.prize3_1, p.prize3_2, p.prize3_3, p.prize3_4, p.prize3_5, p.prize3_6]} hoveredNumber={hoveredNumber} onSelectNumber={onSelectNumber} />

          {/* Giải Tư */}
          <PrizeRow label="Giải Tư" prizes={[p.prize4_1, p.prize4_2, p.prize4_3, p.prize4_4]} hoveredNumber={hoveredNumber} onSelectNumber={onSelectNumber} />

          {/* Giải Năm */}
          <PrizeRow label="Giải Năm" prizes={[p.prize5_1, p.prize5_2, p.prize5_3, p.prize5_4, p.prize5_5, p.prize5_6]} hoveredNumber={hoveredNumber} onSelectNumber={onSelectNumber} />

          {/* Giải Sáu */}
          <PrizeRow label="Giải Sáu" prizes={[p.prize6_1, p.prize6_2, p.prize6_3]} hoveredNumber={hoveredNumber} onSelectNumber={onSelectNumber} />

          {/* Giải Bảy */}
          <PrizeRow label="Giải Bảy" prizes={[p.prize7_1, p.prize7_2, p.prize7_3, p.prize7_4]} hoveredNumber={hoveredNumber} onSelectNumber={onSelectNumber} isLast />
        </div>
      </div>

      {/* Cột 2: Bảng Lô Tô Đầu - Đuôi 2 Số */}
      <div className="glass-card animate-fade-in" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={20} color="var(--accent-emerald)" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff' }}>
              BẢNG LÔ TÔ ĐẦU - ĐUÔI
            </h2>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
            Rê chuột vào số để phát sáng giải tương ứng
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-dim)', textAlign: 'left' }}>
                <th style={{ padding: '8px 12px', width: '22%' }}>Đầu</th>
                <th style={{ padding: '8px 12px' }}>Đuôi Lô Tô (2 số cuối)</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(xsmb.heads || {}).map(([head, tails]) => (
                <tr key={head} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '8px 12px' }}>
                    <span className="lottery-ball ball-slate" style={{ width: 28, height: 28, fontSize: '0.85rem' }}>
                      {head}
                    </span>
                  </td>
                  <td style={{ padding: '8px 12px' }}>
                    {tails.length === 0 ? (
                      <span style={{ color: 'var(--text-dim)' }}>- (Câm)</span>
                    ) : (
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {tails.map((t, idx) => {
                          const fullNumber = `${head}${t}`;
                          const isHovered = hoveredNumber === fullNumber;
                          return (
                            <button
                              key={idx}
                              className={`mono ${isHovered ? 'highlighted-prize' : ''}`}
                              onMouseEnter={() => setHoveredNumber(fullNumber)}
                              onMouseLeave={() => setHoveredNumber(null)}
                              onClick={() => onSelectNumber(fullNumber)}
                              style={{
                                padding: '3px 8px',
                                borderRadius: 'var(--radius-sm)',
                                background: isHovered ? 'var(--accent-gold)' : 'rgba(255, 255, 255, 0.05)',
                                color: isHovered ? '#000000' : 'var(--text-main)',
                                border: '1px solid var(--border-subtle)',
                                fontWeight: 700,
                                fontSize: '0.88rem',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                              }}
                            >
                              {t}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* Các sản phẩm Vietlott đồng hành: Max 3D & Keno */}
      <div style={{ gridColumn: '1 / -1' }}>
        <CompanionVietlottGames latest3D={latest3D} latestKeno={latestKeno} />
      </div>
    </div>
  );
};

const CompanionVietlottGames: React.FC<{ latest3D?: LatestDraw3D; latestKeno?: LatestDrawKeno }> = ({
  latest3D,
  latestKeno,
}) => {
  if (!latest3D && !latestKeno) return null;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16, marginTop: 16 }}>
      {/* Max 3D */}
      {latest3D && (
        <div className="glass-card" style={{ padding: 18, background: 'rgba(30, 41, 59, 0.7)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Dice5 size={18} color="var(--accent-gold)" />
              <h3 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#ffffff' }}>VIETLOTT MAX 3D</h3>
            </div>
            <span className="badge badge-normal" style={{ fontSize: '0.72rem' }}>
              KỲ #{latest3D.id} ({latest3D.date})
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginBottom: 4 }}>Giải Đặc Biệt (2 bộ 3 số):</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {(latest3D.result?.['Giải Đặc biệt'] || []).map((num, i) => (
                  <span key={i} className="badge badge-hot" style={{ fontSize: '1rem', fontWeight: 800, letterSpacing: '0.05em', padding: '3px 8px' }}>
                    {num}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginBottom: 4 }}>Giải Nhất (4 bộ):</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {(latest3D.result?.['Giải Nhất'] || []).map((num, i) => (
                  <span key={i} className="badge badge-normal" style={{ fontSize: '0.82rem', fontWeight: 700 }}>
                    {num}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginBottom: 4 }}>Giải Nhì (6 bộ):</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {(latest3D.result?.['Giải Nhì'] || []).map((num, i) => (
                  <span key={i} style={{ fontSize: '0.8rem', color: 'var(--text-main)', fontFamily: 'var(--font-mono)', padding: '2px 5px', background: 'rgba(255,255,255,0.05)', borderRadius: 3 }}>
                    {num}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Keno */}
      {latestKeno && (
        <div className="glass-card" style={{ padding: 18, background: 'rgba(30, 41, 59, 0.7)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Flame size={18} color="#ef4444" />
              <h3 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#ffffff' }}>VIETLOTT KENO (QUAY NHANH)</h3>
            </div>
            <span className="badge badge-hot" style={{ fontSize: '0.72rem' }}>
              KỲ {latestKeno.id} ({latestKeno.date})
            </span>
          </div>

          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginBottom: 6 }}>
            20 con số trúng thưởng kỳ quay gần nhất:
          </div>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 12 }}>
            {(latestKeno.result || []).map((num, i) => (
              <span
                key={i}
                className="lottery-ball ball-gold"
                style={{ width: 28, height: 28, fontSize: '0.75rem', fontWeight: 700 }}
              >
                {num.toString().padStart(2, '0')}
              </span>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {latestKeno.big_small && (
              <span className="badge badge-normal" style={{ fontSize: '0.72rem' }}>
                Quy luật: <strong>{latestKeno.big_small}</strong>
              </span>
            )}
            {latestKeno.odd_even && (
              <span className="badge badge-normal" style={{ fontSize: '0.72rem' }}>
                Chẵn/Lẻ: <strong>{latestKeno.odd_even}</strong>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

interface PrizeRowProps {
  label: string;
  prizes: any[];
  hoveredNumber: string | null;
  onSelectNumber: (num: string) => void;
  isLast?: boolean;
}

const PrizeRow: React.FC<PrizeRowProps> = ({
  label,
  prizes,
  hoveredNumber,
  onSelectNumber,
  isLast,
}) => {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      padding: '8px 12px',
      background: 'rgba(255, 255, 255, 0.02)',
      borderBottom: isLast ? 'none' : '1px solid rgba(255, 255, 255, 0.04)',
      justifyContent: 'space-between',
      borderRadius: 'var(--radius-sm)',
    }}>
      <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', width: '22%' }}>{label}</span>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'flex-end', flex: 1 }}>
        {prizes.map((val, idx) => {
          if (val === undefined || val === null) return null;
          const expectedLen = label === 'Giải Bảy' ? 2 : label === 'Giải Sáu' ? 3 : (label === 'Giải Tư' || label === 'Giải Năm') ? 4 : 5;
          const displayVal = val.toString().padStart(expectedLen, '0');
          const last2 = displayVal.slice(-2);
          const isHighlighted = hoveredNumber === last2;

          return (
            <span
              key={idx}
              className={`mono ${isHighlighted ? 'highlighted-prize' : ''}`}
              onClick={() => onSelectNumber(last2)}
              style={{
                fontSize: '1.05rem',
                fontWeight: 700,
                color: isHighlighted ? 'var(--accent-gold)' : 'var(--text-main)',
                cursor: 'pointer',
                padding: '2px 6px',
                borderRadius: 4,
                transition: 'all 0.15s',
              }}
              title={`Số đuôi: ${last2} (bấm để xem phân tích)`}
            >
              {displayVal}
            </span>
          );
        })}
      </div>
    </div>
  );
};
