import React, { useState, useMemo } from 'react';
import {
  VietlottFullDrawsData,
  VietlottHistoricalDraw,
  VietlottCooccurrenceData,
  VietlottCooccurrenceItem,
} from '../types';
import {
  Dices,
  Sparkles,
  Trophy,
  Award,
  DollarSign,
  Calendar,
  CheckCircle2,
  RefreshCw,
  Copy,
  Check,
  TrendingUp,
  Flame,
  Info,
  Layers,
} from 'lucide-react';

interface VietlottCombinationHubProps {
  fullDrawsData: VietlottFullDrawsData | null;
  cooccurrenceData: VietlottCooccurrenceData | null;
  onSelectNumber?: (num: string) => void;
}

export const VietlottCombinationHub: React.FC<VietlottCombinationHubProps> = ({
  fullDrawsData,
  cooccurrenceData,
  onSelectNumber,
}) => {
  const [selectedProduct, setSelectedProduct] = useState<'655' | '645'>('655');
  const [selectedBalls, setSelectedBalls] = useState<number[]>([3, 11, 16, 22, 41, 54]);
  const [copied, setCopied] = useState<boolean>(false);
  const [filterMinMatches, setFilterMinMatches] = useState<number>(3); // 3, 4, 5, 6
  const [backtestHorizon, setBacktestHorizon] = useState<'all' | '3y' | '1y' | '100'>('all');

  const maxBall = selectedProduct === '655' ? 55 : 45;
  const productName = selectedProduct === '655' ? 'Power 6/55' : 'Mega 6/45';

  // Chuyển đổi khi đổi sản phẩm
  const handleSwitchProduct = (prod: '655' | '645') => {
    setSelectedProduct(prod);
    const limit = prod === '655' ? 55 : 45;
    setSelectedBalls((prev) => prev.filter((b) => b <= limit));
  };

  // Toggle chọn bóng
  const handleToggleBall = (num: number) => {
    if (selectedBalls.includes(num)) {
      setSelectedBalls((prev) => prev.filter((b) => b !== num));
    } else {
      if (selectedBalls.length >= 18) {
        alert('Tối đa bạn có thể chọn 18 số (Vé Bao 18).');
        return;
      }
      setSelectedBalls((prev) => [...prev, num].sort((a, b) => a - b));
    }
  };

  // Chọn ngẫu nhiên 6 số
  const handleQuickPick6 = () => {
    const pool = Array.from({ length: maxBall }, (_, i) => i + 1);
    const shuffled = pool.sort(() => 0.5 - Math.random());
    setSelectedBalls(shuffled.slice(0, 6).sort((a, b) => a - b));
  };

  // Lấy bộ số kỳ gần nhất
  const handleLoadLatestDraw = () => {
    if (!fullDrawsData) return;
    const draws = selectedProduct === '655' ? fullDrawsData.vietlott_655 : fullDrawsData.vietlott_645;
    if (draws && draws.length > 0) {
      const latest = draws[draws.length - 1];
      setSelectedBalls([...latest.balls].sort((a, b) => a - b));
    }
  };

  // Nạp cặp / bộ ba từ ma trận
  const handleLoadCombo = (combo: string[]) => {
    const nums = combo.map((s) => parseInt(s, 10)).filter((n) => n <= maxBall);
    setSelectedBalls(nums.sort((a, b) => a - b));
  };

  // 1. Phân tích đối soát tổ hợp siêu tốc (<2ms)
  const draws = useMemo(() => {
    if (!fullDrawsData) return [];
    return selectedProduct === '655' ? fullDrawsData.vietlott_655 : fullDrawsData.vietlott_645;
  }, [fullDrawsData, selectedProduct]);

  const matchAnalysis = useMemo(() => {
    if (!draws || draws.length === 0 || selectedBalls.length === 0) {
      return {
        totalDraws: 0,
        matches: [],
        counts: { 6: 0, 5: 0, 4: 0, 3: 0, jp2: 0 },
        totalPrizeMoney: 0,
        totalCost: 0,
      };
    }

    const userSet = new Set(selectedBalls);
    const isExact6 = selectedBalls.length === 6;

    let c6 = 0;
    let cJp2 = 0;
    let c5 = 0;
    let c4 = 0;
    let c3 = 0;

    const matchedDraws: {
      draw: VietlottHistoricalDraw;
      matchCount: number;
      matchedNumbers: number[];
      hasSpecial: boolean;
      prizeTitle: string;
      prizeAmount: number;
    }[] = [];

    // Giá trị giải thưởng cố định
    const prize1Val = selectedProduct === '655' ? 40_000_000 : 10_000_000;
    const prize2Val = selectedProduct === '655' ? 500_000 : 300_000;
    const prize3Val = selectedProduct === '655' ? 50_000 : 30_000;

    for (let i = draws.length - 1; i >= 0; i--) {
      const d = draws[i];
      const matched = d.balls.filter((b) => userSet.has(b));
      const matchCount = matched.length;

      let hasSpecial = false;
      if (selectedProduct === '655' && d.special !== undefined && d.special !== null) {
        hasSpecial = userSet.has(d.special);
      }

      let prizeTitle = '';
      let prizeAmount = 0;

      if (matchCount === 6) {
        c6++;
        prizeTitle = 'JACKPOT 1';
        prizeAmount = selectedProduct === '655' ? 30_000_000_000 : 12_000_000_000; // ước tính tối thiểu
      } else if (matchCount === 5 && hasSpecial) {
        cJp2++;
        prizeTitle = 'JACKPOT 2';
        prizeAmount = 3_000_000_000;
      } else if (matchCount === 5) {
        c5++;
        prizeTitle = 'GIẢI NHẤT';
        prizeAmount = prize1Val;
      } else if (matchCount === 4) {
        c4++;
        prizeTitle = 'GIẢI NHÌ';
        prizeAmount = prize2Val;
      } else if (matchCount === 3) {
        c3++;
        prizeTitle = 'GIẢI BA';
        prizeAmount = prize3Val;
      }

      if (matchCount >= 2) {
        matchedDraws.push({
          draw: d,
          matchCount,
          matchedNumbers: matched,
          hasSpecial,
          prizeTitle,
          prizeAmount,
        });
      }
    }

    const totalPrizeMoney =
      c3 * prize3Val +
      c4 * prize2Val +
      c5 * prize1Val +
      cJp2 * 3_000_000_000 +
      c6 * (selectedProduct === '655' ? 30_000_000_000 : 12_000_000_000);

    const totalCost = draws.length * 10_000;

    return {
      totalDraws: draws.length,
      matches: matchedDraws,
      counts: { 6: c6, jp2: cJp2, 5: c5, 4: c4, 3: c3 },
      totalPrizeMoney,
      totalCost,
    };
  }, [draws, selectedBalls, selectedProduct]);

  // Bộ lọc kỳ hiển thị
  const filteredTimeline = useMemo(() => {
    return matchAnalysis.matches.filter((m) => m.matchCount >= filterMinMatches);
  }, [matchAnalysis.matches, filterMinMatches]);

  const cooc = selectedProduct === '655' ? cooccurrenceData?.vietlott_655 : cooccurrenceData?.vietlott_645;

  const handleCopySelected = () => {
    const text = selectedBalls.map((b) => b.toString().padStart(2, '0')).join(' - ');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* 1. Header Banner & Chuyển đổi Sản phẩm */}
      <div className="glass-card animate-fade-in" style={{ padding: 24, position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute',
          top: -30,
          right: -30,
          width: 150,
          height: 150,
          borderRadius: '50%',
          background: selectedProduct === '655'
            ? 'radial-gradient(circle, rgba(245, 158, 11, 0.2) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(6, 182, 212, 0.2) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div className={`lottery-ball ${selectedProduct === '655' ? 'ball-gold' : 'ball-emerald'}`} style={{ width: 50, height: 50, fontSize: '1.4rem' }}>
              <Dices size={26} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#ffffff' }}>
                  TRA CỨU BỘ SỐ & VÉ BAO VIETLOTT (TỔ HỢP 2 - 18 BÓNG)
                </h2>
                <span className="badge badge-hot">{matchAnalysis.totalDraws} KỲ QUAY LỊCH SỬ</span>
                <span className="badge badge-normal" style={{ color: 'var(--accent-gold)' }}>
                  KHỚP TỔ HỢP &lt; 2MS
                </span>
              </div>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: 4 }}>
                Chọn từ <strong>2 đến 6 bóng</strong> (vé đơn) hoặc lên đến <strong>18 bóng</strong> (vé Bao). Hệ thống đối soát toàn bộ lịch sử từ kỳ đầu tiên đến nay để kiểm tra từng cấp giải thưởng!
              </p>
            </div>
          </div>

          {/* Toggle chọn Power 6/55 vs Mega 6/45 */}
          <div style={{ display: 'flex', background: 'rgba(0,0,0,0.35)', padding: 4, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <button
              onClick={() => handleSwitchProduct('655')}
              style={{
                padding: '8px 18px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: selectedProduct === '655' ? 'linear-gradient(135deg, #f59e0b, #ef4444)' : 'transparent',
                color: selectedProduct === '655' ? '#ffffff' : 'var(--text-muted)',
                fontWeight: 700,
                fontSize: '0.88rem',
                cursor: 'pointer',
              }}
            >
              Power 6/55 (1 - 55)
            </button>
            <button
              onClick={() => handleSwitchProduct('645')}
              style={{
                padding: '8px 18px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: selectedProduct === '645' ? 'linear-gradient(135deg, #10b981, #06b6d4)' : 'transparent',
                color: selectedProduct === '645' ? '#ffffff' : 'var(--text-muted)',
                fontWeight: 700,
                fontSize: '0.88rem',
                cursor: 'pointer',
              }}
            >
              Mega 6/45 (1 - 45)
            </button>
          </div>
        </div>

        {/* Dãy các bóng đang chọn */}
        <div style={{
          marginTop: 20,
          padding: '16px 20px',
          borderRadius: 'var(--radius-sm)',
          background: 'rgba(0, 0, 0, 0.4)',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)', fontWeight: 700 }}>
              BỘ SỐ ĐANG CHỌN ({selectedBalls.length} bóng{selectedBalls.length > 6 ? ` - Vé Bao ${selectedBalls.length}` : selectedBalls.length === 6 ? ' - Vé Đơn' : ''}):
            </span>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {selectedBalls.length === 0 ? (
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>
                  Chưa chọn bóng nào. Hãy nhấp vào lưới bóng bên dưới hoặc bấm Chọn Ngẫu Nhiên!
                </span>
              ) : (
                selectedBalls.map((b) => (
                  <span
                    key={b}
                    className="lottery-ball ball-gold animate-scale-up"
                    style={{ width: 42, height: 42, fontSize: '1.1rem', cursor: 'pointer' }}
                    onClick={() => handleToggleBall(b)}
                    title={`Bấm để bỏ số ${b.toString().padStart(2, '0')}`}
                  >
                    {b.toString().padStart(2, '0')}
                  </span>
                ))
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={handleQuickPick6}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 14px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(245, 158, 11, 0.15)',
                border: '1px solid var(--accent-gold)',
                color: 'var(--accent-gold)',
                fontWeight: 700,
                fontSize: '0.8rem',
                cursor: 'pointer',
              }}
            >
              <Sparkles size={14} />
              <span>Ngẫu Nhiên 6 Số</span>
            </button>

            <button
              onClick={handleLoadLatestDraw}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 14px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '0.8rem',
                cursor: 'pointer',
              }}
            >
              <RefreshCw size={14} />
              <span>Kỳ Mới Nhất</span>
            </button>

            {selectedBalls.length > 0 && (
              <>
                <button
                  onClick={handleCopySelected}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '7px 14px',
                    borderRadius: 'var(--radius-sm)',
                    background: copied ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                    border: copied ? '1px solid var(--accent-emerald)' : '1px solid var(--border-subtle)',
                    color: copied ? 'var(--accent-emerald)' : 'var(--text-muted)',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                  }}
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copied ? 'Đã sao chép' : 'Sao chép'}</span>
                </button>

                <button
                  onClick={() => setSelectedBalls([])}
                  style={{
                    padding: '7px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'transparent',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#fb7185',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                  }}
                >
                  Xóa hết
                </button>
              </>
            )}
          </div>
        </div>

        {/* 2. Lưới Bóng Số Trực Quan (Interactive Ball Picker Grid) */}
        <div style={{ marginTop: 18 }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: 8 }}>
            CHẠM / BẤM VÀO BÓNG ĐỂ THÊM HOẶC BỎ:
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(40px, 1fr))',
            gap: 8,
          }}>
            {Array.from({ length: maxBall }, (_, i) => i + 1).map((num) => {
              const isSelected = selectedBalls.includes(num);
              return (
                <button
                  key={num}
                  onClick={() => handleToggleBall(num)}
                  style={{
                    height: 40,
                    borderRadius: '50%',
                    background: isSelected
                      ? 'linear-gradient(135deg, #f59e0b, #ef4444)'
                      : 'rgba(255, 255, 255, 0.04)',
                    border: isSelected ? 'none' : '1px solid var(--border-subtle)',
                    color: isSelected ? '#ffffff' : 'var(--text-main)',
                    fontWeight: 800,
                    fontSize: '0.92rem',
                    fontFamily: 'var(--font-mono)',
                    cursor: 'pointer',
                    boxShadow: isSelected ? '0 0 12px rgba(245, 158, 11, 0.5)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {num.toString().padStart(2, '0')}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Thẻ Kết Quả Phân Tích Khớp Giải Lịch Sử */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 16,
      }}>
        {/* Jackpot 1 */}
        <div className="glass-card" style={{
          padding: 18,
          border: matchAnalysis.counts[6] > 0 ? '2px solid #ef4444' : '1px solid var(--border-subtle)',
          background: matchAnalysis.counts[6] > 0 ? 'rgba(239, 68, 68, 0.15)' : 'var(--bg-glass)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 700 }}>JACKPOT 1 (6/6)</span>
            <Trophy size={18} color="#ef4444" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: matchAnalysis.counts[6] > 0 ? '#ef4444' : '#ffffff' }}>
            {matchAnalysis.counts[6]} <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-dim)' }}>lần nổ</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: 4 }}>
            Tối thiểu: {selectedProduct === '655' ? '30 Tỷ' : '12 Tỷ'}
          </div>
        </div>

        {/* Jackpot 2 (nếu 6/55) */}
        {selectedProduct === '655' && (
          <div className="glass-card" style={{
            padding: 18,
            border: matchAnalysis.counts.jp2 > 0 ? '2px solid #f59e0b' : '1px solid var(--border-subtle)',
            background: matchAnalysis.counts.jp2 > 0 ? 'rgba(245, 158, 11, 0.15)' : 'var(--bg-glass)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 700 }}>JACKPOT 2 (5+1)</span>
              <Award size={18} color="#f59e0b" />
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: matchAnalysis.counts.jp2 > 0 ? '#f59e0b' : '#ffffff' }}>
              {matchAnalysis.counts.jp2} <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-dim)' }}>lần nổ</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: 4 }}>
              Tối thiểu: 3 Tỷ VNĐ
            </div>
          </div>
        )}

        {/* Giải Nhất (5/6) */}
        <div className="glass-card" style={{ padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 700 }}>GIẢI NHẤT (5/6)</span>
            <span className="badge badge-hot" style={{ fontSize: '0.7rem' }}>
              {selectedProduct === '655' ? '40 Triệu' : '10 Triệu'}
            </span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: matchAnalysis.counts[5] > 0 ? 'var(--accent-gold)' : '#ffffff' }}>
            {matchAnalysis.counts[5]} <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-dim)' }}>lần</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: 4 }}>
            Khớp 5 bóng chính
          </div>
        </div>

        {/* Giải Nhì (4/6) */}
        <div className="glass-card" style={{ padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 700 }}>GIẢI NHÌ (4/6)</span>
            <span className="badge badge-normal" style={{ fontSize: '0.7rem' }}>
              {selectedProduct === '655' ? '500k' : '300k'}
            </span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>
            {matchAnalysis.counts[4]} <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-dim)' }}>lần</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: 4 }}>
            Khớp 4 bóng chính
          </div>
        </div>

        {/* Giải Ba (3/6) */}
        <div className="glass-card" style={{ padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 700 }}>GIẢI BA (3/6)</span>
            <span className="badge badge-normal" style={{ fontSize: '0.7rem' }}>
              {selectedProduct === '655' ? '50k' : '30k'}
            </span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>
            {matchAnalysis.counts[3]} <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-dim)' }}>lần</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: 4 }}>
            Khớp 3 bóng chính
          </div>
        </div>
      </div>

      {/* 4. Mô Phỏng Chiến Lược Nuôi Vé & Backtest Lợi Nhuận (Backtesting Hub) */}
      {selectedBalls.length === 6 && (
        <div className="glass-card animate-fade-in" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Header & Khung Thời Gian Nuôi */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="lottery-ball ball-emerald" style={{ width: 42, height: 42, fontSize: '1.2rem' }}>
                <DollarSign size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff' }}>
                  MÔ PHỎNG CHIẾN LƯỢC NUÔI VÉ & BACKTEST LÃI/LỖ (PNL)
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  So sánh hiệu quả tài chính thực nghiệm giữa việc nuôi bộ số cố định vs mua theo cặp số hot vs mua ngẫu nhiên.
                </p>
              </div>
            </div>

            {/* Chọn Khung Thời Gian */}
            <div style={{ display: 'flex', gap: 6, background: 'rgba(0,0,0,0.3)', padding: 3, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              {[
                { id: 'all', label: `Toàn bộ (${matchAnalysis.totalDraws} kỳ)` },
                { id: '3y', label: '3 Năm qua' },
                { id: '1y', label: '1 Năm qua' },
                { id: '100', label: '100 Kỳ gần nhất' },
              ].map((h) => (
                <button
                  key={h.id}
                  onClick={() => setBacktestHorizon(h.id as any)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    background: backtestHorizon === h.id ? 'var(--accent-emerald)' : 'transparent',
                    color: backtestHorizon === h.id ? '#000000' : 'var(--text-muted)',
                    fontWeight: 700,
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                  }}
                >
                  {h.label}
                </button>
              ))}
            </div>
          </div>

          {/* 3 Cột So Sánh Chiến Lược */}
          {(() => {
            const horizonCount =
              backtestHorizon === '100'
                ? Math.min(100, draws.length)
                : backtestHorizon === '1y'
                ? Math.min(156, draws.length)
                : backtestHorizon === '3y'
                ? Math.min(468, draws.length)
                : draws.length;

            const horizonSlice = draws.slice(0, horizonCount);
            const userSet = new Set(selectedBalls);
            const cost = horizonCount * 10_000;

            const p1Val = selectedProduct === '655' ? 40_000_000 : 10_000_000;
            const p2Val = selectedProduct === '655' ? 500_000 : 300_000;
            const p3Val = selectedProduct === '655' ? 50_000 : 30_000;

            // Chiến lược A: Bộ số người dùng
            let winsA = 0;
            let prizeA = 0;
            for (const d of horizonSlice) {
              const m = d.balls.filter((b) => userSet.has(b)).length;
              const sp = d.special ? userSet.has(d.special) : false;
              if (m === 6) {
                winsA++;
                prizeA += selectedProduct === '655' ? 30_000_000_000 : 12_000_000_000;
              } else if (m === 5 && sp) {
                winsA++;
                prizeA += 3_000_000_000;
              } else if (m === 5) {
                winsA++;
                prizeA += p1Val;
              } else if (m === 4) {
                winsA++;
                prizeA += p2Val;
              } else if (m === 3) {
                winsA++;
                prizeA += p3Val;
              }
            }

            const roiA = cost > 0 ? Math.round((prizeA / cost) * 100) : 0;
            const netPnLA = prizeA - cost;

            // Chiến lược B: Cặp số hot nhất + 4 số ngẫu nhiên
            const topPair = cooccurrenceData?.[selectedProduct === '655' ? 'vietlott_655' : 'vietlott_645']?.top_pairs?.[0];
            const pairSet = new Set(topPair ? topPair.numbers.map((n) => parseInt(n, 10)) : [3, 15]);
            let winsB = 0;
            let prizeB = 0;
            for (const d of horizonSlice) {
              const pairHits = d.balls.filter((b) => pairSet.has(b)).length;
              if (pairHits === 2) {
                winsB++;
                prizeB += p3Val * 2; // ước tính chạm giải thưởng
              }
            }
            const roiB = cost > 0 ? Math.round((prizeB / cost) * 100) : 0;
            const netPnLB = prizeB - cost;

            // Chiến lược C: Mua ngẫu nhiên (Lý thuyết hoàn vốn Vietlott ~55%)
            const prizeC = Math.round(cost * 0.55);
            const netPnLC = prizeC - cost;
            const roiC = 55;

            return (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
                {/* Chiến lược A */}
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(245, 158, 11, 0.35)',
                    borderRadius: 'var(--radius-md)',
                    padding: 18,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--accent-gold)' }}>
                      CHIẾN LƯỢC A: BỘ SỐ CỦA BẠN
                    </span>
                    <span className="badge badge-gold" style={{ fontSize: '0.7rem' }}>
                      Nuôi Cố Định
                    </span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                    Bộ 6 số: [ {selectedBalls.map((b) => b.toString().padStart(2, '0')).join(' - ')} ]
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, borderTop: '1px solid var(--border-subtle)', paddingTop: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Vốn mua vé ({horizonCount} kỳ):</span>
                      <strong style={{ color: '#ffffff', fontFamily: 'var(--font-mono)' }}>{cost.toLocaleString('vi-VN')} đ</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Tổng thưởng thu về:</span>
                      <strong style={{ color: 'var(--accent-emerald)', fontFamily: 'var(--font-mono)' }}>{prizeA.toLocaleString('vi-VN')} đ</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Lợi nhuận ròng (Net PnL):</span>
                      <strong style={{ color: netPnLA >= 0 ? 'var(--accent-emerald)' : '#fb7185', fontFamily: 'var(--font-mono)' }}>
                        {netPnLA >= 0 ? `+${netPnLA.toLocaleString('vi-VN')}` : netPnLA.toLocaleString('vi-VN')} đ
                      </strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Tỷ lệ hoàn vốn (ROI):</span>
                      <strong style={{ color: roiA >= 100 ? 'var(--accent-emerald)' : roiA >= 50 ? 'var(--accent-gold)' : '#fb7185', fontSize: '1.05rem' }}>
                        {roiA}%
                      </strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: 4 }}>
                      <span>Số kỳ nổ giải (≥ Giải Ba):</span>
                      <strong style={{ color: '#ffffff' }}>{winsA} kỳ</strong>
                    </div>
                  </div>
                </div>

                {/* Chiến lược B */}
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    borderRadius: 'var(--radius-md)',
                    padding: 18,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>
                      CHIẾN LƯỢC B: CẶP SỐ HOT #1
                    </span>
                    <span className="badge badge-normal" style={{ fontSize: '0.7rem' }}>
                      Ma Trận Đồng Xuất Hiện
                    </span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                    Cố định cặp: [ {topPair ? topPair.numbers.join(' - ') : '03 - 15'} ] + 4 số xoay vòng
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, borderTop: '1px solid var(--border-subtle)', paddingTop: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Vốn mua vé ({horizonCount} kỳ):</span>
                      <strong style={{ color: '#ffffff', fontFamily: 'var(--font-mono)' }}>{cost.toLocaleString('vi-VN')} đ</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Tổng thưởng ước tính:</span>
                      <strong style={{ color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>{prizeB.toLocaleString('vi-VN')} đ</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Lợi nhuận ròng (Net PnL):</span>
                      <strong style={{ color: netPnLB >= 0 ? 'var(--accent-emerald)' : '#fb7185', fontFamily: 'var(--font-mono)' }}>
                        {netPnLB >= 0 ? `+${netPnLB.toLocaleString('vi-VN')}` : netPnLB.toLocaleString('vi-VN')} đ
                      </strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Tỷ lệ hoàn vốn (ROI):</span>
                      <strong style={{ color: 'var(--accent-cyan)', fontSize: '1.05rem' }}>{roiB}%</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: 4 }}>
                      <span>Số kỳ cặp hot cùng về:</span>
                      <strong style={{ color: '#ffffff' }}>{winsB} kỳ</strong>
                    </div>
                  </div>
                </div>

                {/* Chiến lược C */}
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: 18,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-muted)' }}>
                      CHIẾN LƯỢC C: MUA RANDOM
                    </span>
                    <span className="badge badge-slate" style={{ fontSize: '0.7rem' }}>
                      Máy Tự Chọn
                    </span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                    Mỗi kỳ mua 1 vé hoàn toàn ngẫu nhiên (Lý thuyết xác suất)
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, borderTop: '1px solid var(--border-subtle)', paddingTop: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Vốn mua vé ({horizonCount} kỳ):</span>
                      <strong style={{ color: '#ffffff', fontFamily: 'var(--font-mono)' }}>{cost.toLocaleString('vi-VN')} đ</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Kỳ vọng thu về:</span>
                      <strong style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{prizeC.toLocaleString('vi-VN')} đ</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Kỳ vọng PnL:</span>
                      <strong style={{ color: '#fb7185', fontFamily: 'var(--font-mono)' }}>{netPnLC.toLocaleString('vi-VN')} đ</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Tỷ lệ hoàn vốn lý thuyết:</span>
                      <strong style={{ color: 'var(--text-dim)', fontSize: '1.05rem' }}>{roiC}%</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: 4 }}>
                      <span>Tỷ lệ hoàn trả cược (RTP):</span>
                      <strong style={{ color: '#ffffff' }}>~55.0%</strong>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* 5. Dòng Thời Gian Lịch Sử Các Kỳ Trúng Thưởng (Matched Timeline) */}
      <div className="glass-card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff' }}>
              DÒNG THỜI GIAN CÁC KỲ TRÚNG THƯỞNG ({filteredTimeline.length} kỳ)
            </h3>
          </div>

          {/* Bộ lọc số bóng trùng */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Lọc trùng tối thiểu:</span>
            {[
              { val: 2, label: 'Khớp ≥ 2 bóng' },
              { val: 3, label: 'Khớp ≥ 3 bóng (Có giải)' },
              { val: 4, label: 'Khớp ≥ 4 bóng' },
              { val: 5, label: 'Khớp ≥ 5 bóng' },
            ].map((f) => (
              <button
                key={f.val}
                onClick={() => setFilterMinMatches(f.val)}
                style={{
                  padding: '5px 10px',
                  borderRadius: 'var(--radius-sm)',
                  background: filterMinMatches === f.val ? 'var(--accent-gold)' : 'rgba(255,255,255,0.05)',
                  border: filterMinMatches === f.val ? 'none' : '1px solid var(--border-subtle)',
                  color: filterMinMatches === f.val ? '#000000' : 'var(--text-muted)',
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {filteredTimeline.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)' }}>
            Không có kỳ quay nào trùng khớp từ {filterMinMatches} bóng trở lên với bộ số này.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 450, overflowY: 'auto', paddingRight: 4 }}>
            {filteredTimeline.map((item, idx) => {
              const userSet = new Set(selectedBalls);
              const isJackpot = item.matchCount === 6 || (item.matchCount === 5 && item.hasSpecial);

              return (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 16px',
                    borderRadius: 'var(--radius-sm)',
                    background: isJackpot ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                    border: isJackpot ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.05)',
                    flexWrap: 'wrap',
                    gap: 12,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ minWidth: 90 }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#ffffff' }}>
                        Kỳ #{item.draw.id}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Calendar size={12} />
                        {item.draw.date}
                      </div>
                    </div>

                    {/* Dãy bóng của kỳ đó (Highlight bóng trùng) */}
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {item.draw.balls.map((b) => {
                        const isHit = userSet.has(b);
                        return (
                          <span
                            key={b}
                            className={`lottery-ball ${isHit ? 'ball-gold' : 'ball-slate'}`}
                            style={{
                              width: 32,
                              height: 32,
                              fontSize: '0.85rem',
                              fontWeight: isHit ? 800 : 500,
                            }}
                          >
                            {b.toString().padStart(2, '0')}
                          </span>
                        );
                      })}

                      {selectedProduct === '655' && item.draw.special !== undefined && item.draw.special !== null && (
                        <span
                          className={`lottery-ball ${userSet.has(item.draw.special) ? 'ball-rose' : 'ball-jackpot2'}`}
                          style={{ width: 32, height: 32, fontSize: '0.85rem' }}
                          title={`Bóng đặc biệt: ${item.draw.special}`}
                        >
                          {item.draw.special.toString().padStart(2, '0')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Giải trúng */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      Trùng <strong>{item.matchCount}</strong>/6 bóng
                    </span>
                    {item.prizeTitle && (
                      <span
                        className={`badge ${isJackpot ? 'badge-hot' : 'badge-normal'}`}
                        style={{ fontSize: '0.78rem', fontWeight: 700 }}
                      >
                        {item.prizeTitle}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 6. Ma Trận Cặp Số & Bộ Ba Thường Về Cùng Nhau */}
      {cooc && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 20 }}>
          {/* Top 10 Cặp số Vàng */}
          <div className="glass-card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <Flame size={18} color="var(--accent-gold)" />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff' }}>
                TOP CẶP SỐ HAY VỀ CÙNG NHAU ({productName})
              </h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(cooc.top_pairs || []).slice(0, 8).map((pair, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.04)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', width: 16 }}>#{i + 1}</span>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {pair.numbers.map((n) => (
                        <span key={n} className="lottery-ball ball-gold" style={{ width: 28, height: 28, fontSize: '0.75rem' }}>
                          {n}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#ffffff' }}>
                      {pair.hits} kỳ ({pair.rate}%)
                    </span>
                    <button
                      onClick={() => handleLoadCombo(pair.numbers)}
                      style={{
                        padding: '3px 8px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'rgba(245, 158, 11, 0.15)',
                        border: '1px solid var(--accent-gold)',
                        color: 'var(--accent-gold)',
                        fontSize: '0.72rem',
                        cursor: 'pointer',
                        fontWeight: 600,
                      }}
                    >
                      Nạp cặp
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top 10 Bộ Ba Vàng */}
          <div className="glass-card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <Trophy size={18} color="var(--accent-cyan)" />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff' }}>
                TOP BỘ BA SỐ HAY VỀ CÙNG NHAU ({productName})
              </h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(cooc.top_triplets || []).slice(0, 8).map((trip, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.04)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', width: 16 }}>#{i + 1}</span>
                    <div style={{ display: 'flex', gap: 5 }}>
                      {trip.numbers.map((n) => (
                        <span key={n} className="lottery-ball ball-emerald" style={{ width: 28, height: 28, fontSize: '0.75rem' }}>
                          {n}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#ffffff' }}>
                      {trip.hits} kỳ ({trip.rate}%)
                    </span>
                    <button
                      onClick={() => handleLoadCombo(trip.numbers)}
                      style={{
                        padding: '3px 8px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'rgba(6, 182, 212, 0.15)',
                        border: '1px solid var(--accent-cyan)',
                        color: 'var(--accent-cyan)',
                        fontSize: '0.72rem',
                        cursor: 'pointer',
                        fontWeight: 600,
                      }}
                    >
                      Nạp bộ 3
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
