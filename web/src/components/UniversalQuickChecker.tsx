import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Search,
  Sparkles,
  Trophy,
  HelpCircle,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';
import { SummaryData } from '../types';

interface UniversalQuickCheckerProps {
  summaryData: SummaryData | null;
  onOpenDeepLookup: (num: string) => void;
}

export const UniversalQuickChecker: React.FC<UniversalQuickCheckerProps> = ({
  summaryData,
  onOpenDeepLookup,
}) => {
  const [inputText, setInputText] = useState<string>('');
  const [hasChecked, setHasChecked] = useState<boolean>(false);
  const [showConfetti, setShowConfetti] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Hiệu ứng ăn mừng Pháo Hoa Confetti bằng HTML5 Canvas siêu nhẹ (0 dependency)
  useEffect(() => {
    if (!showConfetti || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.parentElement?.clientWidth || 600;
    canvas.height = canvas.parentElement?.clientHeight || 200;

    const colors = ['#f59e0b', '#ef4444', '#10b981', '#06b6d4', '#fbbf24', '#a855f7'];
    const particles = Array.from({ length: 65 }, () => ({
      x: canvas.width / 2,
      y: canvas.height / 2,
      vx: (Math.random() - 0.5) * 14,
      vy: (Math.random() - 0.5) * 14 - 3,
      size: Math.random() * 6 + 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: 1,
      rotation: Math.random() * 360,
      vRotation: (Math.random() - 0.5) * 10,
    }));

    let animationFrameId: number;
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let aliveCount = 0;

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.25; // Trọng lực
        p.alpha -= 0.015;
        p.rotation += p.vRotation;

        if (p.alpha > 0) {
          aliveCount++;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.globalAlpha = Math.max(p.alpha, 0);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
          ctx.restore();
        }
      });

      if (aliveCount > 0) {
        animationFrameId = requestAnimationFrame(render);
      } else {
        setShowConfetti(false);
      }
    };

    animationFrameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrameId);
  }, [showConfetti]);

  // Phân tích và bóc tách các con số từ chuỗi nhập vào
  const parsedTokens = useMemo(() => {
    return inputText
      .replace(/[,.-]/g, ' ')
      .trim()
      .split(/\s+/)
      .filter((t) => /^\d+$/.test(t));
  }, [inputText]);

  // Đánh giá kết quả tức thì đối soát với summaryData
  const evaluation = useMemo(() => {
    if (!hasChecked || !parsedTokens.length || !summaryData) return null;

    const xsmb = summaryData.xsmb_latest;
    const v655 = summaryData.vietlott_655_latest;
    const v645 = summaryData.vietlott_645_latest;
    const keno = summaryData.vietlott_keno_latest;
    const v3d = summaryData.vietlott_3d_latest;

    // TRƯỜNG HỢP 1: BỘ SỐ NHIỀU BÓNG (>= 3 số) -> So Vietlott Power 6/55 & Mega 6/45
    if (parsedTokens.length >= 3) {
      const userNums = parsedTokens
        .map((t) => parseInt(t, 10))
        .filter((n) => n >= 1 && n <= 55);
      const userSet = new Set(userNums);

      // So khớp Power 6/55
      let res655 = null;
      if (v655?.result) {
        const mainBalls = v655.result.slice(0, 6);
        const bonusBall = v655.result.length > 6 ? v655.result[6] : null;
        const mainHits = mainBalls.filter((b) => userSet.has(b));
        const hasBonus = bonusBall ? userSet.has(bonusBall) : false;

        let prizeTier = 'Không trúng giải';
        let isWin = false;
        if (mainHits.length === 6) {
          prizeTier = '🏆 TRÚNG JACKPOT 1 (Tối thiểu 30 Tỷ)!';
          isWin = true;
        } else if (mainHits.length === 5 && hasBonus) {
          prizeTier = '🥈 TRÚNG JACKPOT 2 (Tối thiểu 3 Tỷ)!';
          isWin = true;
        } else if (mainHits.length === 5) {
          prizeTier = '⭐ TRÚNG GIẢI NHẤT (40 Triệu đồng)!';
          isWin = true;
        } else if (mainHits.length === 4) {
          prizeTier = '🔹 TRÚNG GIẢI NHÌ (500.000 đồng)!';
          isWin = true;
        } else if (mainHits.length === 3) {
          prizeTier = '🔸 TRÚNG GIẢI BA (50.000 đồng)!';
          isWin = true;
        }

        res655 = {
          game: 'Power 6/55',
          date: v655.date,
          drawId: v655.id,
          matchedCount: mainHits.length,
          matchedBalls: mainHits,
          hasBonus,
          prizeTier,
          isWin,
        };
      }

      // So khớp Mega 6/45
      let res645 = null;
      if (v645?.result) {
        const mainHits = v645.result.slice(0, 6).filter((b) => userSet.has(b));
        let prizeTier = 'Không trúng giải';
        let isWin = false;
        if (mainHits.length === 6) {
          prizeTier = '🏆 TRÚNG JACKPOT (Tối thiểu 12 Tỷ)!';
          isWin = true;
        } else if (mainHits.length === 5) {
          prizeTier = '⭐ TRÚNG GIẢI NHẤT (10 Triệu đồng)!';
          isWin = true;
        } else if (mainHits.length === 4) {
          prizeTier = '🔹 TRÚNG GIẢI NHÌ (300.000 đồng)!';
          isWin = true;
        } else if (mainHits.length === 3) {
          prizeTier = '🔸 TRÚNG GIẢI BA (30.000 đồng)!';
          isWin = true;
        }

        res645 = {
          game: 'Mega 6/45',
          date: v645.date,
          drawId: v645.id,
          matchedCount: mainHits.length,
          matchedBalls: mainHits,
          prizeTier,
          isWin,
        };
      }

      const anyWin = Boolean((res655 && res655.isWin) || (res645 && res645.isWin));
      return {
        type: 'combo',
        tokens: userNums,
        res655,
        res645,
        anyWin,
        isWin: anyWin,
      };
    }

    // TRƯỜNG HỢP 2: BỘ 3 CHỮ SỐ DUY NHẤT (VD: 710) -> So Vietlott Max 3D / 3D Pro
    if (parsedTokens.length === 1 && parsedTokens[0].length === 3) {
      const num3d = parsedTokens[0];
      let prizeTier = 'Chưa trúng giải kỳ này';
      let isWin = false;

      if (v3d?.result) {
        const special = v3d.result['Giải Đặc biệt'] || [];
        const prize1 = v3d.result['Giải Nhất'] || [];
        const prize2 = v3d.result['Giải Nhì'] || [];
        const prize3 = v3d.result['Giải ba'] || [];

        if (special.includes(num3d)) {
          prizeTier = '🏆 TRÚNG GIẢI ĐẶC BIỆT MAX 3D (1 Tỷ - 2 Tỷ)!';
          isWin = true;
        } else if (prize1.includes(num3d)) {
          prizeTier = '🥇 TRÚNG GIẢI NHẤT MAX 3D!';
          isWin = true;
        } else if (prize2.includes(num3d)) {
          prizeTier = '🥈 TRÚNG GIẢI NHÌ MAX 3D!';
          isWin = true;
        } else if (prize3.includes(num3d)) {
          prizeTier = '🥉 TRÚNG GIẢI BA MAX 3D!';
          isWin = true;
        }
      }

      return {
        type: 'max3d',
        number: num3d,
        date: v3d?.date,
        drawId: v3d?.id,
        prizeTier,
        isWin,
        anyWin: isWin,
      };
    }

    // TRƯỜNG HỢP 3: CẶP SỐ / XIÊN 2 (VD: 68 86) -> So XSMB & Keno
    if (parsedTokens.length === 2) {
      const n1 = parsedTokens[0].padStart(2, '0');
      const n2 = parsedTokens[1].padStart(2, '0');
      let hits1 = 0;
      let hits2 = 0;
      let spec1 = false;
      let spec2 = false;

      if (xsmb) {
        const specStr = xsmb.raw_prizes?.special?.toString() || '';
        if (specStr.endsWith(n1)) spec1 = true;
        if (specStr.endsWith(n2)) spec2 = true;
        hits1 = (xsmb.loto_numbers || []).filter((n) => n === n1).length;
        hits2 = (xsmb.loto_numbers || []).filter((n) => n === n2).length;
      }

      const int1 = parseInt(n1, 10);
      const int2 = parseInt(n2, 10);
      const keno1 = Boolean(keno?.result && keno.result.includes(int1));
      const keno2 = Boolean(keno?.result && keno.result.includes(int2));

      const bothHits = hits1 > 0 && hits2 > 0;
      const isWin = bothHits || hits1 > 0 || hits2 > 0 || keno1 || keno2;

      return {
        type: 'pair',
        n1,
        n2,
        hits1,
        hits2,
        spec1,
        spec2,
        keno1,
        keno2,
        bothHits,
        date: xsmb?.date,
        isWin,
        anyWin: isWin,
      };
    }

    // TRƯỜNG HỢP 4: 1 SỐ 2 CHỮ SỐ (VD: 68) -> So XSMB & Keno & Lô Tô
    const num2d = parsedTokens[0].padStart(2, '0');
    let xsmbSpecial = false;
    let xsmbHits = 0;
    let inKeno = false;

    if (xsmb) {
      const specStr = xsmb.raw_prizes?.special?.toString() || '';
      if (specStr.endsWith(num2d)) {
        xsmbSpecial = true;
      }
      xsmbHits = (xsmb.loto_numbers || []).filter((n) => n === num2d).length;
    }

    const intNum = parseInt(num2d, 10);
    if (keno?.result && keno.result.includes(intNum)) {
      inKeno = true;
    }

    const isWin = xsmbSpecial || xsmbHits > 0 || inKeno;

    return {
      type: 'single',
      number: num2d,
      date: xsmb?.date,
      xsmbSpecial,
      xsmbHits,
      inKeno,
      isWin,
      anyWin: isWin,
    };
  }, [hasChecked, parsedTokens, summaryData]);

  // Tự động kích hoạt hiệu ứng pháo hoa khi người dùng trúng thưởng
  useEffect(() => {
    if (hasChecked && evaluation && (evaluation.anyWin || evaluation.isWin)) {
      setShowConfetti(true);
    }
  }, [hasChecked, evaluation]);

  const handleCheck = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;
    setHasChecked(true);
  };

  const handleSetQuickExample = (example: string) => {
    setInputText(example);
    setHasChecked(true);
  };

  return (
    <div
      className="glass-card animate-fade-in"
      style={{
        position: 'relative',
        overflow: 'hidden',
        padding: '24px 28px',
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.7) 100%)',
        border: '1px solid rgba(245, 158, 11, 0.35)',
        boxShadow: '0 12px 35px -10px rgba(0, 0, 0, 0.7), 0 0 25px -5px rgba(245, 158, 11, 0.2)',
      }}
    >
      {/* Canvas Confetti ăn mừng */}
      {showConfetti && (
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 15,
          }}
        />
      )}

      {/* Header Widget */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            className="lottery-ball ball-gold"
            style={{ width: 44, height: 44, fontSize: '1.2rem', boxShadow: '0 0 20px rgba(245, 158, 11, 0.4)' }}
          >
            <Sparkles size={22} color="#0f172a" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.01em' }}>
                DÒ VÉ SIÊU TỐC 3 GIÂY
              </h2>
              <span className="badge badge-hot" style={{ fontSize: '0.68rem' }}>
                TỰ ĐỘNG NHẬN DIỆN VÉ
              </span>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 2 }}>
              Dán dãy số bất kỳ — Hệ thống tự động so khớp đồng thời với XSMB, Vietlott 6/55, 6/45, Keno & Max 3D!
            </p>
          </div>
        </div>

        {/* Nút reset */}
        {hasChecked && (
          <button
            onClick={() => {
              setHasChecked(false);
              setInputText('');
              setShowConfetti(false);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'none',
              border: 'none',
              color: 'var(--text-dim)',
              fontSize: '0.8rem',
              cursor: 'pointer',
              padding: '6px 10px',
            }}
          >
            <RotateCcw size={14} />
            <span>Xóa kết quả</span>
          </button>
        )}
      </div>

      {/* Form Nhập Số Dò Vé */}
      <form onSubmit={handleCheck} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
          <input
            type="text"
            placeholder="Nhập hoặc dán số vé (VD: 68 hoặc 68 86 hoặc 710 hoặc 07 18 24 35 41 55)..."
            value={inputText}
            onChange={(e) => {
              setInputText(e.target.value);
              setHasChecked(false);
            }}
            style={{
              width: '100%',
              padding: '12px 18px 12px 42px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(0, 0, 0, 0.45)',
              border: '1.5px solid var(--accent-gold)',
              color: '#ffffff',
              fontSize: '0.98rem',
              fontWeight: 600,
              fontFamily: 'var(--font-mono)',
              outline: 'none',
              boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.5)',
            }}
          />
          <Search size={18} color="var(--accent-gold)" style={{ position: 'absolute', left: 14, top: 14 }} />
        </div>

        <button
          type="submit"
          style={{
            padding: '12px 28px',
            borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
            border: 'none',
            color: '#ffffff',
            fontWeight: 800,
            fontSize: '0.95rem',
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(245, 158, 11, 0.4)',
            transition: 'all 0.2s ease',
            whiteSpace: 'nowrap',
          }}
        >
          Dò Ngay
        </button>
      </form>

      {/* Gợi Ý Thử Nhanh (Quick Chips) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: '0.78rem' }}>
        <span style={{ color: 'var(--text-dim)' }}>Gợi ý thử:</span>
        <button
          type="button"
          onClick={() => handleSetQuickExample('68')}
          style={{
            padding: '4px 10px',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-main)',
            cursor: 'pointer',
          }}
        >
          Lô tô <strong>68</strong>
        </button>
        <button
          type="button"
          onClick={() => handleSetQuickExample('68 86')}
          style={{
            padding: '4px 10px',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-main)',
            cursor: 'pointer',
          }}
        >
          Xiên 2 <strong>68 - 86</strong>
        </button>
        <button
          type="button"
          onClick={() => handleSetQuickExample('710')}
          style={{
            padding: '4px 10px',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-main)',
            cursor: 'pointer',
          }}
        >
          Max 3D <strong>710</strong>
        </button>
        <button
          type="button"
          onClick={() => handleSetQuickExample('07 18 24 35 41 55')}
          style={{
            padding: '4px 10px',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-main)',
            cursor: 'pointer',
          }}
        >
          Vietlott 6 số <strong>07 18 24 35 41 55</strong>
        </button>
      </div>

      {/* KẾT QUẢ DÒ VÉ TỨC THÌ (KHI ĐÃ BẤM DÒ) */}
      {hasChecked && evaluation && (
        <div
          className="animate-fade-in"
          style={{
            marginTop: 18,
            padding: '18px 20px',
            borderRadius: 'var(--radius-md)',
            background: evaluation.anyWin || evaluation.isWin ? 'rgba(16, 185, 129, 0.12)' : 'rgba(15, 23, 42, 0.8)',
            border: `1.5px solid ${evaluation.anyWin || evaluation.isWin ? 'rgba(16, 185, 129, 0.5)' : 'rgba(255, 255, 255, 0.1)'}`,
          }}
        >
          {/* 1. KẾT QUẢ BỘ NHIỀU SỐ (VIETLOTT) */}
          {evaluation.type === 'combo' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {evaluation.anyWin ? (
                    <Trophy size={22} color="var(--accent-gold)" />
                  ) : (
                    <HelpCircle size={22} color="var(--text-dim)" />
                  )}
                  <strong style={{ fontSize: '1.05rem', color: '#ffffff' }}>
                    Kết quả so khớp bộ số Vietlott: [ {evaluation.tokens.map((n: number) => n.toString().padStart(2, '0')).join(' - ')} ]
                  </strong>
                </div>
                <button
                  onClick={() => onOpenDeepLookup(evaluation.tokens.map((n: number) => n.toString().padStart(2, '0')).join(' '))}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent-gold)',
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <span>Xem lịch sử 20 năm của bộ số này</span>
                  <ArrowRight size={14} />
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
                {/* Power 6/55 Card */}
                {evaluation.res655 && (
                  <div
                    style={{
                      background: 'rgba(0, 0, 0, 0.3)',
                      padding: '12px 16px',
                      borderRadius: 'var(--radius-sm)',
                      border: `1px solid ${evaluation.res655.isWin ? 'var(--accent-gold)' : 'var(--border-subtle)'}`,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, color: 'var(--accent-gold)', fontSize: '0.88rem' }}>
                        Vietlott Power 6/55 (Kỳ #{evaluation.res655.drawId})
                      </span>
                      <span className={evaluation.res655.isWin ? 'badge badge-hot' : 'badge badge-normal'}>
                        Khớp {evaluation.res655.matchedCount}/6 bóng
                      </span>
                    </div>
                    <div style={{ marginTop: 6, fontWeight: 800, fontSize: '0.98rem', color: evaluation.res655.isWin ? '#fbbf24' : 'var(--text-muted)' }}>
                      {evaluation.res655.prizeTier}
                    </div>
                  </div>
                )}

                {/* Mega 6/45 Card */}
                {evaluation.res645 && (
                  <div
                    style={{
                      background: 'rgba(0, 0, 0, 0.3)',
                      padding: '12px 16px',
                      borderRadius: 'var(--radius-sm)',
                      border: `1px solid ${evaluation.res645.isWin ? 'var(--accent-cyan)' : 'var(--border-subtle)'}`,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, color: 'var(--accent-cyan)', fontSize: '0.88rem' }}>
                        Vietlott Mega 6/45 (Kỳ #{evaluation.res645.drawId})
                      </span>
                      <span className={evaluation.res645.isWin ? 'badge badge-hot' : 'badge badge-normal'}>
                        Khớp {evaluation.res645.matchedCount}/6 bóng
                      </span>
                    </div>
                    <div style={{ marginTop: 6, fontWeight: 800, fontSize: '0.98rem', color: evaluation.res645.isWin ? '#22d3ee' : 'var(--text-muted)' }}>
                      {evaluation.res645.prizeTier}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 2. KẾT QUẢ SỐ 3 CHỮ SỐ (MAX 3D) */}
          {evaluation.type === 'max3d' && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  className="lottery-ball ball-gold"
                  style={{ width: 44, height: 44, fontSize: '1.25rem', fontWeight: 900 }}
                >
                  {evaluation.number}
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1.05rem', color: evaluation.isWin ? 'var(--accent-gold)' : 'var(--text-main)' }}>
                    Vietlott Max 3D (Kỳ #{evaluation.drawId} - {evaluation.date}): {evaluation.prizeTier}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    {evaluation.isWin ? '🎉 Xin chúc mừng bộ ba số của bạn đã trúng thưởng!' : 'Bộ ba số này chưa trùng với bảng giải mở thưởng kỳ gần nhất.'}
                  </div>
                </div>
              </div>

              <button
                onClick={() => onOpenDeepLookup(evaluation.number)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent-gold)',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <span>Xem tần suất 3D</span>
                <ArrowRight size={14} />
              </button>
            </div>
          )}

          {/* 3. KẾT QUẢ CẶP SỐ / XIÊN 2 (XSMB & KENO) */}
          {evaluation.type === 'pair' && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ display: 'flex', gap: 6 }}>
                  <div
                    className={`lottery-ball ${evaluation.hits1 > 0 ? 'ball-gold' : 'ball-slate'}`}
                    style={{ width: 42, height: 42, fontSize: '1.15rem', fontWeight: 900 }}
                  >
                    {evaluation.n1}
                  </div>
                  <div
                    className={`lottery-ball ${evaluation.hits2 > 0 ? 'ball-gold' : 'ball-slate'}`}
                    style={{ width: 42, height: 42, fontSize: '1.15rem', fontWeight: 900 }}
                  >
                    {evaluation.n2}
                  </div>
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#ffffff' }}>
                    {evaluation.bothHits
                      ? `🎉 CHÚC MỪNG TRÚNG XIÊN 2 XSMB (Cả 2 số [${evaluation.n1} - ${evaluation.n2}] cùng nổ)!`
                      : evaluation.hits1 > 0 || evaluation.hits2 > 0
                      ? `🔥 NỔ ${evaluation.hits1 > 0 ? `Số ${evaluation.n1} (${evaluation.hits1} nháy)` : ''}${evaluation.hits1 > 0 && evaluation.hits2 > 0 ? ' & ' : ''}${evaluation.hits2 > 0 ? `Số ${evaluation.n2} (${evaluation.hits2} nháy)` : ''}!`
                      : evaluation.keno1 || evaluation.keno2
                      ? `🟢 Có số nổ trong 20 bóng Keno hôm nay!`
                      : `Cặp số [${evaluation.n1} - ${evaluation.n2}] chưa nổ trong kỳ XSMB hôm nay (${evaluation.date})`}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    {evaluation.spec1 ? `• Số ${evaluation.n1} trúng Giải Đặc Biệt! ` : ''}
                    {evaluation.spec2 ? `• Số ${evaluation.n2} trúng Giải Đặc Biệt! ` : ''}
                    {evaluation.keno1 && evaluation.keno2 ? '• Cả 2 số cùng có mặt trong Keno kỳ mới nhất. ' : ''}
                    • Bấm xem thống kê 20 năm tần suất cặp số này cùng về.
                  </div>
                </div>
              </div>

              <button
                onClick={() => onOpenDeepLookup(`${evaluation.n1} ${evaluation.n2}`)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent-gold)',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <span>Xem lịch sử cặp số {evaluation.n1} - {evaluation.n2}</span>
                <ArrowRight size={14} />
              </button>
            </div>
          )}

          {/* 4. KẾT QUẢ ĐƠN SỐ 2 CHỮ SỐ (XSMB & KENO) */}
          {evaluation.type === 'single' && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  className={`lottery-ball ${evaluation.isWin ? 'ball-gold' : 'ball-slate'}`}
                  style={{ width: 44, height: 44, fontSize: '1.3rem', fontWeight: 900 }}
                >
                  {evaluation.number}
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#ffffff' }}>
                    {evaluation.xsmbSpecial
                      ? `🎉 TRÚNG GIẢI ĐẶC BIỆT XSMB (Đề: ${evaluation.number})!`
                      : evaluation.xsmbHits > 0
                      ? `🔥 NỔ ${evaluation.xsmbHits} NHÁY LÔ TÔ XSMB!`
                      : evaluation.inKeno
                      ? `🟢 NỔ TRONG 20 BÓNG KENO HÔM NAY!`
                      : `Chưa nổ trong kỳ mở thưởng XSMB hôm nay (${evaluation.date})`}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    {evaluation.inKeno ? '• Có mặt trong 20 số Keno kỳ mới nhất. ' : ''}
                    {evaluation.xsmbHits > 0 ? `• Về ${evaluation.xsmbHits} lần trong 27 giải miền Bắc.` : '• Theo dõi chu kỳ gan hoặc xem thống kê 20 năm bên dưới.'}
                  </div>
                </div>
              </div>

              <button
                onClick={() => onOpenDeepLookup(evaluation.number)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent-gold)',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <span>Xem lịch sử 20 năm của số {evaluation.number}</span>
                <ArrowRight size={14} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
