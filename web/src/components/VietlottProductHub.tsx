import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Trophy,
  Sparkles,
  Search,
  Dice5,
  CheckCircle2,
  Copy,
  Check,
  RefreshCw,
  Filter,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Clock,
  Flame,
  Award,
  Zap,
  Lock,
  Unlock,
  DollarSign,
  Layers,
  Dices,
  Info,
} from 'lucide-react';
import {
  LotteryIndexData,
  VietlottHistoricalDraw,
  SummaryData,
  VietlottCooccurrenceItem,
} from '../types';

interface VietlottProductHubProps {
  gameType: 'vietlott_655' | 'vietlott_645';
  indexData: LotteryIndexData | null;
  historicalDraws: VietlottHistoricalDraw[];
  cooccurrence?: {
    top_pairs: VietlottCooccurrenceItem[];
    top_triplets: VietlottCooccurrenceItem[];
  } | null;
  summaryData: SummaryData | null;
  onSelectNumber: (num: string) => void;
}

type GeneratorMode = 'random' | 'balanced' | 'golden_sum' | 'hot_bias';
type ActiveTool = 'quick_pick' | 'combo_bao' | 'cooccurrence' | 'history';
type BacktestHorizon = 'all' | '3y' | '1y' | '100';

export const VietlottProductHub: React.FC<VietlottProductHubProps> = ({
  gameType,
  indexData,
  historicalDraws,
  cooccurrence,
  summaryData,
  onSelectNumber,
}) => {
  const is655 = gameType === 'vietlott_655';
  const maxNumber = is655 ? 55 : 45;
  const gameName = is655 ? 'Power 6/55' : 'Mega 6/45';
  const scheduleInfo = is655
    ? 'Thứ 3, Thứ 5, Thứ 7 hàng tuần (18:00 - 18:30)'
    : 'Thứ 4, Thứ 6, Chủ Nhật hàng tuần (18:00 - 18:30)';

  // Sub-tabs nội bộ hợp nhất trên màn hình sản phẩm
  const [activeTool, setActiveTool] = useState<ActiveTool>('quick_pick');

  // --- TOOL 1: QUICK PICK PRO STATE ---
  const [generatorMode, setGeneratorMode] = useState<GeneratorMode>('balanced');
  const [pinnedNumbers, setPinnedNumbers] = useState<number[]>([]);
  const [generatedNumbers, setGeneratedNumbers] = useState<number[]>([]);
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [quickPickCopied, setQuickPickCopied] = useState<boolean>(false);

  // --- TOOL 2: TRA CỨU BỘ SỐ & VÉ BAO STATE ---
  const [selectedBalls, setSelectedBalls] = useState<number[]>([3, 11, 16, 22, 35, 41]);
  const [comboCopied, setComboCopied] = useState<boolean>(false);
  const [filterMinMatches, setFilterMinMatches] = useState<number>(3);
  const [backtestHorizon, setBacktestHorizon] = useState<BacktestHorizon>('all');

  // --- TOOL 4: HISTORY EXPLORER STATE ---
  const [historySearch, setHistorySearch] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 12;

  // Sắp xếp lịch sử quay thưởng mới nhất lên đầu
  const sortedDraws = useMemo(() => {
    if (!historicalDraws || historicalDraws.length === 0) return [];
    return [...historicalDraws].reverse();
  }, [historicalDraws]);

  // Lấy kỳ quay mới nhất từ data hoặc summary
  const latestDraw = useMemo(() => {
    if (sortedDraws.length > 0) return sortedDraws[0];
    const sumLatest = is655 ? summaryData?.vietlott_655_latest : summaryData?.vietlott_645_latest;
    if (sumLatest) {
      return {
        id: sumLatest.id,
        date: sumLatest.date,
        balls: sumLatest.result.slice(0, 6),
        special: is655 && sumLatest.result.length > 6 ? sumLatest.result[6] : null,
      } as VietlottHistoricalDraw;
    }
    return null;
  }, [sortedDraws, is655, summaryData]);

  // Danh sách các số Hot và Gan từ indexData
  const topGanSet = useMemo(() => {
    const list = indexData?.top_gan?.slice(0, 8).map((g) => parseInt(g.number, 10)) || [];
    return new Set(list);
  }, [indexData]);

  const topHotList = useMemo(() => {
    return indexData?.top_frequent?.slice(0, 10).map((f) => parseInt(f.number, 10)) || [];
  }, [indexData]);

  // ==========================================
  // THUẬT TOÁN 1: QUICK PICK PRO
  // ==========================================
  const handleGenerateNumbers = () => {
    setIsRolling(true);
    setQuickPickCopied(false);

    setTimeout(() => {
      const availableNumbers = Array.from({ length: maxNumber }, (_, i) => i + 1).filter(
        (n) => !pinnedNumbers.includes(n)
      );

      const neededCount = 6 - pinnedNumbers.length;
      if (neededCount <= 0) {
        setGeneratedNumbers([...pinnedNumbers].sort((a, b) => a - b));
        setIsRolling(false);
        return;
      }

      let selected: number[] = [];

      if (generatorMode === 'hot_bias') {
        const hotAvailable = topHotList.filter((n) => availableNumbers.includes(n));
        const regularAvailable = availableNumbers.filter((n) => !topHotList.includes(n));
        const hotCount = Math.min(neededCount, Math.floor(Math.random() * 2) + 2);
        const shuffledHot = [...hotAvailable].sort(() => 0.5 - Math.random());
        const shuffledRegular = [...regularAvailable].sort(() => 0.5 - Math.random());

        selected = [...shuffledHot.slice(0, hotCount), ...shuffledRegular.slice(0, neededCount - hotCount)];
        while (selected.length < neededCount && shuffledRegular.length > 0) {
          const next = shuffledRegular.pop();
          if (next && !selected.includes(next)) selected.push(next);
        }
      } else if (generatorMode === 'balanced') {
        const currentOdds = pinnedNumbers.filter((n) => n % 2 !== 0).length;
        const targetOdds = 3;
        const needOdds = Math.max(0, targetOdds - currentOdds);
        const needEvens = Math.max(0, 3 - pinnedNumbers.filter((n) => n % 2 === 0).length);

        const odds = availableNumbers.filter((n) => n % 2 !== 0).sort(() => 0.5 - Math.random());
        const evens = availableNumbers.filter((n) => n % 2 === 0).sort(() => 0.5 - Math.random());

        selected = [...odds.slice(0, needOdds), ...evens.slice(0, needEvens)];
        const remaining = availableNumbers.filter((n) => !selected.includes(n)).sort(() => 0.5 - Math.random());
        while (selected.length < neededCount && remaining.length > 0) {
          const n = remaining.pop();
          if (n) selected.push(n);
        }
      } else if (generatorMode === 'golden_sum') {
        const targetMin = is655 ? 140 : 110;
        const targetMax = is655 ? 200 : 165;
        let attempts = 0;
        while (attempts < 100) {
          attempts++;
          const shuffled = [...availableNumbers].sort(() => 0.5 - Math.random()).slice(0, neededCount);
          const trial = [...pinnedNumbers, ...shuffled];
          const sum = trial.reduce((a, b) => a + b, 0);
          if (sum >= targetMin && sum <= targetMax) {
            selected = shuffled;
            break;
          }
        }
        if (selected.length === 0) {
          selected = [...availableNumbers].sort(() => 0.5 - Math.random()).slice(0, neededCount);
        }
      } else {
        selected = [...availableNumbers].sort(() => 0.5 - Math.random()).slice(0, neededCount);
      }

      const finalCombo = [...pinnedNumbers, ...selected].sort((a, b) => a - b);
      setGeneratedNumbers(finalCombo);
      setIsRolling(false);
    }, 280);
  };

  const handleTogglePin = (num: number) => {
    if (pinnedNumbers.includes(num)) {
      setPinnedNumbers((prev) => prev.filter((n) => n !== num));
    } else {
      if (pinnedNumbers.length >= 5) {
        alert('Bạn chỉ có thể ghim tối đa 5 số!');
        return;
      }
      setPinnedNumbers((prev) => [...prev, num].sort((a, b) => a - b));
    }
  };

  const handleCopyQuickPick = () => {
    if (generatedNumbers.length === 0) return;
    const txt = generatedNumbers.map((n) => n.toString().padStart(2, '0')).join(' - ');
    navigator.clipboard.writeText(`${gameName}: ${txt}`);
    setQuickPickCopied(true);
    setTimeout(() => setQuickPickCopied(false), 2000);
  };

  const handleTransferToComboBao = (numbers: number[]) => {
    setSelectedBalls(numbers);
    setActiveTool('combo_bao');
  };

  // ==========================================
  // THUẬT TOÁN 2: BỘ SỐ, VÉ BAO & BACKTEST LÃI/LỖ
  // ==========================================
  const handleToggleComboBall = (num: number) => {
    const maxAllowed = is655 ? 18 : 15;
    if (selectedBalls.includes(num)) {
      setSelectedBalls((prev) => prev.filter((b) => b !== num));
    } else {
      if (selectedBalls.length >= maxAllowed) {
        alert(`Tối đa bạn có thể chọn ${maxAllowed} bóng (Vé Bao ${maxAllowed}).`);
        return;
      }
      setSelectedBalls((prev) => [...prev, num].sort((a, b) => a - b));
    }
  };

  const handleQuickPickCombo6 = () => {
    const pool = Array.from({ length: maxNumber }, (_, i) => i + 1);
    const shuffled = pool.sort(() => 0.5 - Math.random());
    setSelectedBalls(shuffled.slice(0, 6).sort((a, b) => a - b));
  };

  const handleLoadComboNumbers = (numbers: number[]) => {
    const filtered = numbers.filter((n) => n <= maxNumber);
    setSelectedBalls(filtered.sort((a, b) => a - b));
    setActiveTool('combo_bao');
  };

  const handleCopyComboBalls = () => {
    const text = selectedBalls.map((b) => b.toString().padStart(2, '0')).join(' - ');
    navigator.clipboard.writeText(`${gameName}: ${text}`);
    setComboCopied(true);
    setTimeout(() => setComboCopied(false), 2000);
  };

  // Phân tích đối soát tổ hợp siêu tốc (<2ms) qua toàn bộ lịch sử
  const matchAnalysis = useMemo(() => {
    if (!sortedDraws || sortedDraws.length === 0 || selectedBalls.length === 0) {
      return {
        totalDraws: 0,
        matches: [],
        counts: { 6: 0, jp2: 0, 5: 0, 4: 0, 3: 0 },
        totalPrizeMoney: 0,
        totalCost: 0,
      };
    }

    const userSet = new Set(selectedBalls);
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

    const prize1Val = is655 ? 40_000_000 : 10_000_000;
    const prize2Val = is655 ? 500_000 : 300_000;
    const prize3Val = is655 ? 50_000 : 30_000;

    for (const d of sortedDraws) {
      const matched = d.balls.filter((b) => userSet.has(b));
      const matchCount = matched.length;

      let hasSpecial = false;
      if (is655 && d.special !== undefined && d.special !== null) {
        hasSpecial = userSet.has(d.special);
      }

      let prizeTitle = '';
      let prizeAmount = 0;

      if (matchCount === 6) {
        c6++;
        prizeTitle = is655 ? 'JACKPOT 1' : 'JACKPOT';
        prizeAmount = is655 ? 30_000_000_000 : 12_000_000_000;
      } else if (is655 && matchCount === 5 && hasSpecial) {
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
      c6 * (is655 ? 30_000_000_000 : 12_000_000_000);

    const totalCost = sortedDraws.length * 10_000;

    return {
      totalDraws: sortedDraws.length,
      matches: matchedDraws,
      counts: { 6: c6, jp2: cJp2, 5: c5, 4: c4, 3: c3 },
      totalPrizeMoney,
      totalCost,
    };
  }, [sortedDraws, selectedBalls, is655]);

  const filteredTimeline = useMemo(() => {
    return matchAnalysis.matches.filter((m) => m.matchCount >= filterMinMatches);
  }, [matchAnalysis.matches, filterMinMatches]);

  // Bộ lọc lịch sử
  const filteredHistory = useMemo(() => {
    if (!historySearch.trim()) return sortedDraws;
    const q = historySearch.trim().toLowerCase();

    return sortedDraws.filter((d) => {
      if (d.id.includes(q)) return true;
      if (d.date.includes(q)) return true;
      const numMatch = d.balls.some((b) => b.toString().padStart(2, '0') === q || b.toString() === q);
      if (numMatch) return true;
      return false;
    });
  }, [sortedDraws, historySearch]);

  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);
  const paginatedHistory = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredHistory.slice(start, start + itemsPerPage);
  }, [filteredHistory, currentPage, itemsPerPage]);

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
      {activeTool === 'quick_pick' && (
        <div className="glass-card animate-fade-in" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Sparkles size={20} color="var(--accent-gold)" />
                <span>Trình Tạo Bộ Số Ngẫu Nhiên Thông Minh ({gameName})</span>
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 4 }}>
                Chọn tiêu chuẩn phân phối toán học hoặc ghim những con số may mắn của riêng bạn.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {[
                { id: 'balanced', label: '⚖️ Cân Bằng Chẵn Lẻ (3C - 3L)' },
                { id: 'golden_sum', label: '🎯 Tổng Điểm Vàng' },
                { id: 'hot_bias', label: '🔥 Ưu Tiên Số Nóng (Hot)' },
                { id: 'random', label: '🎲 Thuần Ngẫu Nhiên' },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setGeneratorMode(m.id as GeneratorMode)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-full)',
                    border: '1px solid',
                    borderColor: generatorMode === m.id ? 'var(--accent-gold)' : 'var(--border-subtle)',
                    background: generatorMode === m.id ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
                    color: generatorMode === m.id ? 'var(--accent-gold)' : 'var(--text-muted)',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div
            style={{
              padding: '24px 20px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(0, 0, 0, 0.35)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 20,
              minHeight: 160,
            }}
          >
            {generatedNumbers.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-dim)' }}>
                <Dice5 size={40} style={{ margin: '0 auto 10px', opacity: 0.5 }} />
                <p>Nhấn nút "Tạo Bộ Số Ngẫu Nhiên" bên dưới để nhận gợi ý tối ưu.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
                {generatedNumbers.map((num, idx) => {
                  const isPinned = pinnedNumbers.includes(num);
                  return (
                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                      <div
                        className="lottery-ball ball-gold"
                        style={{
                          width: 58,
                          height: 58,
                          fontSize: '1.5rem',
                          cursor: 'pointer',
                          border: isPinned ? '2px solid #10b981' : undefined,
                          boxShadow: isPinned ? '0 0 12px rgba(16, 185, 129, 0.6)' : undefined,
                          animation: isRolling ? 'pulse-ring 0.4s infinite' : undefined,
                        }}
                        onClick={() => handleTogglePin(num)}
                        title={isPinned ? 'Số đã ghim (bấm để bỏ ghim)' : 'Bấm để ghim số này'}
                      >
                        {num.toString().padStart(2, '0')}
                      </div>
                      <button
                        onClick={() => handleTogglePin(num)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: isPinned ? '#10b981' : 'var(--text-dim)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                          fontSize: '0.68rem',
                          fontWeight: 700,
                        }}
                      >
                        {isPinned ? <Lock size={11} /> : <Unlock size={11} />}
                        <span>{isPinned ? 'Đã ghim' : 'Ghim'}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {generatedNumbers.length === 6 && (
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <span>
                  Tổng điểm: <strong style={{ color: '#ffffff' }}>{generatedNumbers.reduce((a, b) => a + b, 0)}</strong>
                </span>
                <span>•</span>
                <span>
                  Chẵn/Lẻ:{' '}
                  <strong style={{ color: '#ffffff' }}>
                    {generatedNumbers.filter((n) => n % 2 === 0).length} Chẵn -{' '}
                    {generatedNumbers.filter((n) => n % 2 !== 0).length} Lẻ
                  </strong>
                </span>
              </div>
            )}

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
              <button
                onClick={handleGenerateNumbers}
                disabled={isRolling}
                style={{
                  padding: '12px 24px',
                  borderRadius: 'var(--radius-full)',
                  background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                  border: 'none',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.92rem',
                  cursor: isRolling ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow: '0 4px 16px rgba(245, 158, 11, 0.4)',
                }}
              >
                <RefreshCw size={17} style={{ animation: isRolling ? 'spin 0.6s linear infinite' : undefined }} />
                <span>{generatedNumbers.length === 0 ? 'Tạo Bộ Số Ngẫu Nhiên' : 'Tạo Lại Bộ Khác'}</span>
              </button>

              {generatedNumbers.length === 6 && (
                <>
                  <button
                    onClick={handleCopyQuickPick}
                    style={{
                      padding: '12px 18px',
                      borderRadius: 'var(--radius-full)',
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid var(--border-subtle)',
                      color: '#ffffff',
                      fontWeight: 600,
                      fontSize: '0.88rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    {quickPickCopied ? <Check size={16} color="var(--accent-emerald)" /> : <Copy size={16} />}
                    <span>{quickPickCopied ? 'Đã sao chép!' : 'Sao chép'}</span>
                  </button>

                  <button
                    onClick={() => handleTransferToComboBao(generatedNumbers)}
                    style={{
                      padding: '12px 18px',
                      borderRadius: 'var(--radius-full)',
                      background: 'rgba(16, 185, 129, 0.15)',
                      border: '1px solid rgba(16, 185, 129, 0.4)',
                      color: '#34d399',
                      fontWeight: 600,
                      fontSize: '0.88rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <Layers size={16} />
                    <span>Nạp Sang Phân Tích Vé Bao</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODULE 2: 🔍 TRA CỨU BỘ SỐ & VÉ BAO (SYSTEM BET & ROI)   */}
      {/* ======================================================== */}
      {activeTool === 'combo_bao' && (
        <div className="glass-card animate-fade-in" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 22 }}>
          {/* Header Module Vé Bao */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Layers size={20} color="var(--accent-emerald)" />
                <span>Tra Cứu Bộ Số & Vé Bao (Tổ Hợp 2 - {is655 ? '18' : '15'} Bóng)</span>
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 4 }}>
                Chọn từ <strong>2 đến 6 bóng</strong> (vé đơn) hoặc lên đến <strong>{is655 ? '18' : '15'} bóng</strong> (vé Bao). Hệ thống đối soát toàn bộ {sortedDraws.length} kỳ quay lịch sử để tính ROI và các cấp giải thưởng!
              </p>
            </div>

            {/* Thông tin loại vé */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="badge badge-hot" style={{ fontSize: '0.82rem' }}>
                {selectedBalls.length < 6
                  ? `Bộ ${selectedBalls.length} Số (Chưa đủ vé đơn)`
                  : selectedBalls.length === 6
                  ? 'Vé Đơn Tiêu Chuẩn (6 Bóng)'
                  : `Vé Bao ${selectedBalls.length} (${selectedBalls.length} Bóng)`}
              </span>
            </div>
          </div>

          {/* Dàn bóng đang chọn & Thanh công cụ thao tác nhanh */}
          <div
            style={{
              padding: '16px 20px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(0, 0, 0, 0.4)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 14,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                Bóng đã chọn ({selectedBalls.length}/{is655 ? '18' : '15'}):
              </span>
              {selectedBalls.length === 0 ? (
                <span style={{ color: 'var(--text-dim)', fontSize: '0.82rem', fontStyle: 'italic' }}>
                  Chưa chọn bóng nào. Bấm vào các quả bóng bên dưới để chọn.
                </span>
              ) : (
                selectedBalls.map((b) => (
                  <span
                    key={b}
                    className="lottery-ball ball-gold"
                    style={{ width: 42, height: 42, fontSize: '1.1rem', cursor: 'pointer' }}
                    onClick={() => handleToggleComboBall(b)}
                    title={`Bấm để bỏ số ${b}`}
                  >
                    {b.toString().padStart(2, '0')}
                  </span>
                ))
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <button
                onClick={handleQuickPickCombo6}
                style={{
                  padding: '7px 14px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(245, 158, 11, 0.15)',
                  border: '1px solid var(--accent-gold)',
                  color: 'var(--accent-gold)',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Sparkles size={14} />
                <span>Ngẫu Nhiên 6 Số</span>
              </button>

              {latestDraw && (
                <button
                  onClick={() => setSelectedBalls([...latestDraw.balls].sort((a, b) => a - b))}
                  style={{
                    padding: '7px 14px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-muted)',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <RefreshCw size={14} />
                  <span>Kỳ Mới Nhất</span>
                </button>
              )}

              {selectedBalls.length > 0 && (
                <>
                  <button
                    onClick={handleCopyComboBalls}
                    style={{
                      padding: '7px 14px',
                      borderRadius: 'var(--radius-sm)',
                      background: comboCopied ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                      border: comboCopied ? '1px solid var(--accent-emerald)' : '1px solid var(--border-subtle)',
                      color: comboCopied ? 'var(--accent-emerald)' : 'var(--text-muted)',
                      fontWeight: 600,
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    {comboCopied ? <Check size={14} /> : <Copy size={14} />}
                    <span>{comboCopied ? 'Đã sao chép' : 'Sao chép'}</span>
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

          {/* Lưới chọn bóng số 01 - 55 / 01 - 45 */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(40px, 1fr))',
              gap: 8,
              padding: 16,
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
            }}
          >
            {Array.from({ length: maxNumber }, (_, i) => i + 1).map((num) => {
              const isSelected = selectedBalls.includes(num);
              return (
                <button
                  key={num}
                  onClick={() => handleToggleComboBall(num)}
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

          {/* Thẻ Thống Kê Số Lần Trúng Giải Qua Lịch Sử */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
            {/* Jackpot 1 */}
            <div
              className="glass-card"
              style={{
                padding: 16,
                border: matchAnalysis.counts[6] > 0 ? '2px solid #ef4444' : '1px solid var(--border-subtle)',
                background: matchAnalysis.counts[6] > 0 ? 'rgba(239, 68, 68, 0.15)' : 'var(--bg-glass)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontWeight: 700 }}>
                  {is655 ? 'JACKPOT 1 (6/6)' : 'JACKPOT (6/6)'}
                </span>
                <Trophy size={15} color="#ef4444" />
              </div>
              <div style={{ fontSize: '1.7rem', fontWeight: 900, color: '#ef4444' }}>
                {matchAnalysis.counts[6]}{' '}
                <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-dim)' }}>lần</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: 2 }}>
                {is655 ? 'Từ 30+ Tỷ VNĐ' : 'Từ 12+ Tỷ VNĐ'}
              </div>
            </div>

            {/* Jackpot 2 (Chỉ có ở 6/55) */}
            {is655 && (
              <div
                className="glass-card"
                style={{
                  padding: 16,
                  border: matchAnalysis.counts.jp2 > 0 ? '2px solid #f43f5e' : '1px solid var(--border-subtle)',
                  background: matchAnalysis.counts.jp2 > 0 ? 'rgba(244, 63, 94, 0.15)' : 'var(--bg-glass)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontWeight: 700 }}>JACKPOT 2 (5+1)</span>
                  <Award size={15} color="#f43f5e" />
                </div>
                <div style={{ fontSize: '1.7rem', fontWeight: 900, color: '#f43f5e' }}>
                  {matchAnalysis.counts.jp2}{' '}
                  <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-dim)' }}>lần</span>
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: 2 }}>
                  Từ 3+ Tỷ VNĐ
                </div>
              </div>
            )}

            {/* Giải Nhất (5/6) */}
            <div className="glass-card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontWeight: 700 }}>GIẢI NHẤT (5/6)</span>
                <span className="badge badge-normal" style={{ fontSize: '0.7rem' }}>
                  {is655 ? '40tr' : '10tr'}
                </span>
              </div>
              <div style={{ fontSize: '1.7rem', fontWeight: 900, color: 'var(--accent-gold)' }}>
                {matchAnalysis.counts[5]}{' '}
                <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-dim)' }}>lần</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: 2 }}>
                Trùng 5 bóng chính
              </div>
            </div>

            {/* Giải Nhì (4/6) */}
            <div className="glass-card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontWeight: 700 }}>GIẢI NHÌ (4/6)</span>
                <span className="badge badge-normal" style={{ fontSize: '0.7rem' }}>
                  {is655 ? '500k' : '300k'}
                </span>
              </div>
              <div style={{ fontSize: '1.7rem', fontWeight: 900, color: 'var(--accent-emerald)' }}>
                {matchAnalysis.counts[4]}{' '}
                <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-dim)' }}>lần</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: 2 }}>
                Trùng 4 bóng chính
              </div>
            </div>

            {/* Giải Ba (3/6) */}
            <div className="glass-card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontWeight: 700 }}>GIẢI BA (3/6)</span>
                <span className="badge badge-normal" style={{ fontSize: '0.7rem' }}>
                  {is655 ? '50k' : '30k'}
                </span>
              </div>
              <div style={{ fontSize: '1.7rem', fontWeight: 900, color: 'var(--accent-cyan)' }}>
                {matchAnalysis.counts[3]}{' '}
                <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-dim)' }}>lần</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: 2 }}>
                Trùng 3 bóng chính
              </div>
            </div>
          </div>

          {/* Mô Phỏng Chiến Lược Nuôi Vé & Backtest Lợi Nhuận (PnL) */}
          {selectedBalls.length === 6 && (
            <div className="glass-card animate-fade-in" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className="lottery-ball ball-emerald" style={{ width: 38, height: 38, fontSize: '1.1rem' }}>
                    <DollarSign size={18} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff' }}>
                      Mô Phỏng Nuôi Bộ Số & Backtest Hiệu Quả Tài Chính (PnL)
                    </h4>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      So sánh hiệu quả nuôi cố định vs mua theo cặp hot vs mua ngẫu nhiên.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 4, background: 'rgba(0,0,0,0.3)', padding: 3, borderRadius: 'var(--radius-sm)' }}>
                  {[
                    { id: 'all', label: `Toàn bộ (${sortedDraws.length} kỳ)` },
                    { id: '3y', label: '3 Năm' },
                    { id: '1y', label: '1 Năm' },
                    { id: '100', label: '100 Kỳ' },
                  ].map((h) => (
                    <button
                      key={h.id}
                      onClick={() => setBacktestHorizon(h.id as BacktestHorizon)}
                      style={{
                        padding: '5px 10px',
                        borderRadius: 'var(--radius-sm)',
                        border: 'none',
                        background: backtestHorizon === h.id ? 'var(--accent-emerald)' : 'transparent',
                        color: backtestHorizon === h.id ? '#000000' : 'var(--text-muted)',
                        fontWeight: 700,
                        fontSize: '0.76rem',
                        cursor: 'pointer',
                      }}
                    >
                      {h.label}
                    </button>
                  ))}
                </div>
              </div>

              {(() => {
                const horizonCount =
                  backtestHorizon === '100'
                    ? Math.min(100, sortedDraws.length)
                    : backtestHorizon === '1y'
                    ? Math.min(156, sortedDraws.length)
                    : backtestHorizon === '3y'
                    ? Math.min(468, sortedDraws.length)
                    : sortedDraws.length;

                const horizonSlice = sortedDraws.slice(0, horizonCount);
                const userSet = new Set(selectedBalls);
                const cost = horizonCount * 10_000;

                const p1Val = is655 ? 40_000_000 : 10_000_000;
                const p2Val = is655 ? 500_000 : 300_000;
                const p3Val = is655 ? 50_000 : 30_000;

                let winsA = 0;
                let prizeA = 0;
                for (const d of horizonSlice) {
                  const m = d.balls.filter((b) => userSet.has(b)).length;
                  const sp = is655 && d.special ? userSet.has(d.special) : false;
                  if (m === 6) {
                    winsA++;
                    prizeA += is655 ? 30_000_000_000 : 12_000_000_000;
                  } else if (is655 && m === 5 && sp) {
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

                return (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
                    <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(245, 158, 11, 0.35)', borderRadius: 'var(--radius-sm)', padding: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 8 }}>
                        <strong style={{ color: 'var(--accent-gold)' }}>BỘ SỐ CỦA BẠN</strong>
                        <span className="badge badge-gold" style={{ fontSize: '0.68rem' }}>Nuôi Cố Định</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.8rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Vốn ({horizonCount} kỳ):</span>
                          <strong>{cost.toLocaleString('vi-VN')} đ</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Thưởng thu về:</span>
                          <strong style={{ color: 'var(--accent-emerald)' }}>{prizeA.toLocaleString('vi-VN')} đ</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Lợi nhuận ròng:</span>
                          <strong style={{ color: netPnLA >= 0 ? 'var(--accent-emerald)' : '#fb7185' }}>
                            {netPnLA >= 0 ? `+${netPnLA.toLocaleString('vi-VN')}` : netPnLA.toLocaleString('vi-VN')} đ
                          </strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Tỷ lệ hoàn vốn:</span>
                          <strong style={{ color: roiA >= 100 ? 'var(--accent-emerald)' : roiA >= 50 ? 'var(--accent-gold)' : '#fb7185' }}>
                            {roiA}%
                          </strong>
                        </div>
                      </div>
                    </div>

                    <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 8 }}>
                        <strong style={{ color: 'var(--text-muted)' }}>MUA RANDOM (LÝ THUYẾT)</strong>
                        <span className="badge badge-slate" style={{ fontSize: '0.68rem' }}>Xác Suất</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.8rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Vốn ({horizonCount} kỳ):</span>
                          <strong>{cost.toLocaleString('vi-VN')} đ</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Kỳ vọng thu về:</span>
                          <strong style={{ color: 'var(--text-dim)' }}>{(cost * 0.55).toLocaleString('vi-VN')} đ</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Kỳ vọng PnL:</span>
                          <strong style={{ color: '#fb7185' }}>{((cost * 0.55) - cost).toLocaleString('vi-VN')} đ</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Tỷ lệ hoàn trả (RTP):</span>
                          <strong style={{ color: 'var(--text-dim)' }}>~55.0%</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Dòng Thời Gian Các Kỳ Trúng Thưởng (Matched Timeline) */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
              <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#ffffff' }}>
                Danh Sách Kỳ Quay Từng Trúng Thưởng ({filteredTimeline.length} kỳ)
              </h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {[
                  { val: 2, label: '≥ 2 bóng' },
                  { val: 3, label: '≥ 3 bóng (Có giải)' },
                  { val: 4, label: '≥ 4 bóng' },
                  { val: 5, label: '≥ 5 bóng' },
                ].map((f) => (
                  <button
                    key={f.val}
                    onClick={() => setFilterMinMatches(f.val)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-sm)',
                      background: filterMinMatches === f.val ? 'var(--accent-gold)' : 'rgba(255,255,255,0.05)',
                      border: filterMinMatches === f.val ? 'none' : '1px solid var(--border-subtle)',
                      color: filterMinMatches === f.val ? '#000000' : 'var(--text-muted)',
                      fontWeight: 700,
                      fontSize: '0.76rem',
                      cursor: 'pointer',
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {filteredTimeline.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-dim)', fontSize: '0.84rem' }}>
                Không có kỳ quay nào trùng khớp từ {filterMinMatches} bóng trở lên với bộ số này.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 360, overflowY: 'auto' }}>
                {filteredTimeline.slice(0, 50).map((item, idx) => {
                  const userSet = new Set(selectedBalls);
                  const isJackpot = item.matchCount === 6 || (item.matchCount === 5 && item.hasSpecial);

                  return (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-sm)',
                        background: isJackpot ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                        border: isJackpot ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.05)',
                        flexWrap: 'wrap',
                        gap: 10,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ minWidth: 80 }}>
                          <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#ffffff' }}>
                            #{item.draw.id}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                            {item.draw.date}
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                          {item.draw.balls.map((b) => {
                            const isHit = userSet.has(b);
                            return (
                              <span
                                key={b}
                                className={`lottery-ball ${isHit ? 'ball-gold' : 'ball-slate'}`}
                                style={{ width: 30, height: 30, fontSize: '0.8rem', fontWeight: isHit ? 800 : 500 }}
                              >
                                {b.toString().padStart(2, '0')}
                              </span>
                            );
                          })}
                          {is655 && item.draw.special && (
                            <span
                              className={`lottery-ball ${userSet.has(item.draw.special) ? 'ball-red' : 'ball-jackpot2'}`}
                              style={{ width: 30, height: 30, fontSize: '0.8rem' }}
                            >
                              {item.draw.special.toString().padStart(2, '0')}
                            </span>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          Trùng <strong>{item.matchCount}</strong> bóng
                        </span>
                        {item.prizeTitle && (
                          <span className={`badge ${isJackpot ? 'badge-hot' : 'badge-normal'}`} style={{ fontSize: '0.75rem' }}>
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
        </div>
      )}

      {/* ======================================================== */}
      {/* MODULE 3: 📊 MA TRẬN CẶP & BỘ BA ĐI CÙNG NHAU           */}
      {/* ======================================================== */}
      {activeTool === 'cooccurrence' && (
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
      )}

      {/* ======================================================== */}
      {/* MODULE 4: 📜 KHO LỊCH SỬ KỲ QUAY TOÀN DIỆN              */}
      {/* ======================================================== */}
      {activeTool === 'history' && (
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
      )}
    </div>
  );
};
