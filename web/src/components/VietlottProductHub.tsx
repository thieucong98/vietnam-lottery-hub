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
} from 'lucide-react';
import { LotteryIndexData, VietlottHistoricalDraw, SummaryData } from '../types';

interface VietlottProductHubProps {
  gameType: 'vietlott_655' | 'vietlott_645';
  indexData: LotteryIndexData | null;
  historicalDraws: VietlottHistoricalDraw[];
  summaryData: SummaryData | null;
  onSelectNumber: (num: string) => void;
}

type GeneratorMode = 'random' | 'balanced' | 'golden_sum' | 'hot_bias';

export const VietlottProductHub: React.FC<VietlottProductHubProps> = ({
  gameType,
  indexData,
  historicalDraws,
  summaryData,
  onSelectNumber,
}) => {
  const is655 = gameType === 'vietlott_655';
  const maxNumber = is655 ? 55 : 45;
  const gameName = is655 ? 'Power 6/55' : 'Mega 6/45';
  const scheduleInfo = is655
    ? 'Thứ 3, Thứ 5, Thứ 7 hàng tuần (18:00 - 18:30)'
    : 'Thứ 4, Thứ 6, Chủ Nhật hàng tuần (18:00 - 18:30)';

  // Sub-tabs nội bộ trên màn hình
  const [activeTool, setActiveTool] = useState<'quick_pick' | 'checker' | 'history'>('quick_pick');

  // --- TOOL 1: QUICK PICK PRO STATE ---
  const [generatorMode, setGeneratorMode] = useState<GeneratorMode>('balanced');
  const [pinnedNumbers, setPinnedNumbers] = useState<number[]>([]);
  const [generatedNumbers, setGeneratedNumbers] = useState<number[]>([]);
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // --- TOOL 2: IN-PAGE CHECKER STATE ---
  const [checkerNumbers, setCheckerNumbers] = useState<number[]>([]);
  const [checkerManualInput, setCheckerManualInput] = useState<string>('');

  // --- TOOL 3: HISTORY EXPLORER STATE ---
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

  // Thuật toán Quick Pick thông minh với các tiêu chí tối ưu
  const handleGenerateNumbers = () => {
    setIsRolling(true);
    setCopied(false);

    setTimeout(() => {
      let candidatePool: number[] = [];
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
        // Ưu tiên số trong topHotList
        const hotAvailable = topHotList.filter((n) => availableNumbers.includes(n));
        const regularAvailable = availableNumbers.filter((n) => !topHotList.includes(n));

        // Lấy 3-4 số hot
        const hotCount = Math.min(neededCount, Math.floor(Math.random() * 2) + 2);
        const shuffledHot = [...hotAvailable].sort(() => 0.5 - Math.random());
        const shuffledRegular = [...regularAvailable].sort(() => 0.5 - Math.random());

        selected = [...shuffledHot.slice(0, hotCount), ...shuffledRegular.slice(0, neededCount - hotCount)];
        while (selected.length < neededCount && shuffledRegular.length > 0) {
          const next = shuffledRegular.pop();
          if (next && !selected.includes(next)) selected.push(next);
        }
      } else if (generatorMode === 'balanced') {
        // Cân bằng Chẵn Lẻ (3 chẵn - 3 lẻ)
        const currentOdds = pinnedNumbers.filter((n) => n % 2 !== 0).length;
        const currentEvens = pinnedNumbers.filter((n) => n % 2 === 0).length;

        const targetOdds = 3;
        const targetEvens = 3;
        const needOdds = Math.max(0, targetOdds - currentOdds);
        const needEvens = Math.max(0, targetEvens - currentEvens);

        const odds = availableNumbers.filter((n) => n % 2 !== 0).sort(() => 0.5 - Math.random());
        const evens = availableNumbers.filter((n) => n % 2 === 0).sort(() => 0.5 - Math.random());

        selected = [...odds.slice(0, needOdds), ...evens.slice(0, needEvens)];

        // Nếu còn thiếu thì lấy thêm bất kỳ
        const remaining = availableNumbers.filter((n) => !selected.includes(n)).sort(() => 0.5 - Math.random());
        while (selected.length < neededCount && remaining.length > 0) {
          const n = remaining.pop();
          if (n) selected.push(n);
        }
      } else if (generatorMode === 'golden_sum') {
        // Tổng điểm kỳ vọng: 6/55: 140-200, 6/45: 110-165
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
        // Pure Random
        selected = [...availableNumbers].sort(() => 0.5 - Math.random()).slice(0, neededCount);
      }

      const finalCombo = [...pinnedNumbers, ...selected].sort((a, b) => a - b);
      setGeneratedNumbers(finalCombo);
      setIsRolling(false);
    }, 280);
  };

  // Toggle ghim số
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

  // Sao chép bộ số
  const handleCopyCombo = () => {
    if (generatedNumbers.length === 0) return;
    const txt = generatedNumbers.map((n) => n.toString().padStart(2, '0')).join(' - ');
    navigator.clipboard.writeText(`${gameName}: ${txt}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Chuyển bộ số sang bộ dò vé
  const handleTransferToChecker = (numbers: number[]) => {
    setCheckerNumbers(numbers);
    setActiveTool('checker');
  };

  // Xử lý dò vé
  const toggleCheckerNumber = (num: number) => {
    if (checkerNumbers.includes(num)) {
      setCheckerNumbers((prev) => prev.filter((n) => n !== num));
    } else {
      if (checkerNumbers.length >= 6) {
        alert('Một bộ vé tiêu chuẩn gồm đúng 6 số!');
        return;
      }
      setCheckerNumbers((prev) => [...prev, num].sort((a, b) => a - b));
    }
  };

  // Kết quả dò vé với kỳ mới nhất
  const checkResult = useMemo(() => {
    if (!latestDraw || checkerNumbers.length === 0) return null;
    const winningMain = latestDraw.balls;
    const matchedMain = checkerNumbers.filter((n) => winningMain.includes(n));
    const matchedCount = matchedMain.length;

    let matchedSpecial = false;
    if (is655 && latestDraw.special) {
      matchedSpecial = checkerNumbers.includes(latestDraw.special);
    }

    let prizeName = 'Chưa trúng thưởng';
    let prizeColor = 'var(--text-muted)';
    let prizeValue = '0 đ';
    let isWinner = false;

    if (is655) {
      if (matchedCount === 6) {
        prizeName = '🏆 TRÚNG JACKPOT 1!';
        prizeColor = '#f59e0b';
        prizeValue = 'Từ 30+ Tỷ VNĐ';
        isWinner = true;
      } else if (matchedCount === 5 && matchedSpecial) {
        prizeName = '💎 TRÚNG JACKPOT 2!';
        prizeColor = '#f43f5e';
        prizeValue = 'Từ 3+ Tỷ VNĐ';
        isWinner = true;
      } else if (matchedCount === 5) {
        prizeName = '🥇 GIẢI NHẤT';
        prizeColor = '#10b981';
        prizeValue = '40.000.000 đ';
        isWinner = true;
      } else if (matchedCount === 4) {
        prizeName = '🥈 GIẢI NHÌ';
        prizeColor = '#06b6d4';
        prizeValue = '500.000 đ';
        isWinner = true;
      } else if (matchedCount === 3) {
        prizeName = '🥉 GIẢI BA';
        prizeColor = '#a855f7';
        prizeValue = '50.000 đ';
        isWinner = true;
      }
    } else {
      // 6/45
      if (matchedCount === 6) {
        prizeName = '🏆 TRÚNG JACKPOT!';
        prizeColor = '#f59e0b';
        prizeValue = 'Từ 12+ Tỷ VNĐ';
        isWinner = true;
      } else if (matchedCount === 5) {
        prizeName = '🥇 GIẢI NHẤT';
        prizeColor = '#10b981';
        prizeValue = '10.000.000 đ';
        isWinner = true;
      } else if (matchedCount === 4) {
        prizeName = '🥈 GIẢI NHÌ';
        prizeColor = '#06b6d4';
        prizeValue = '300.000 đ';
        isWinner = true;
      } else if (matchedCount === 3) {
        prizeName = '🥉 GIẢI BA';
        prizeColor = '#a855f7';
        prizeValue = '30.000 đ';
        isWinner = true;
      }
    }

    return {
      matchedMain,
      matchedCount,
      matchedSpecial,
      prizeName,
      prizeColor,
      prizeValue,
      isWinner,
    };
  }, [checkerNumbers, latestDraw, is655]);

  // Dò vé xuyên suốt lịch sử 1,400+ kỳ
  const historicalMatches = useMemo(() => {
    if (checkerNumbers.length < 3) return [];
    const results: { draw: VietlottHistoricalDraw; matches: number; hasSpecial: boolean }[] = [];

    for (const draw of sortedDraws) {
      const matchCount = checkerNumbers.filter((n) => draw.balls.includes(n)).length;
      const hasSpecial = is655 && draw.special ? checkerNumbers.includes(draw.special) : false;
      if (matchCount >= 3) {
        results.push({ draw, matches: matchCount, hasSpecial });
      }
    }
    return results;
  }, [checkerNumbers, sortedDraws, is655]);

  // Bộ lọc lịch sử
  const filteredHistory = useMemo(() => {
    if (!historySearch.trim()) return sortedDraws;
    const q = historySearch.trim().toLowerCase();

    return sortedDraws.filter((d) => {
      // Tìm theo mã kỳ
      if (d.id.includes(q)) return true;
      // Tìm theo ngày
      if (d.date.includes(q)) return true;
      // Tìm theo số
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
      {/* 1. HERO BANNER: KẾT QUẢ MỚI NHẤT & THÔNG TIN LỊCH QUAY */}
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

              {/* Nút sao chép & dò kỳ này */}
              <div style={{ display: 'flex', gap: 8, marginLeft: 'auto', flexWrap: 'wrap' }}>
                <button
                  onClick={() => handleTransferToChecker(latestDraw.balls)}
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
                  <span>Dò với kỳ này</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. THANH ĐIỀU HƯỚNG CÔNG CỤ TÍCH HỢP TẠI CHỖ (IN-PAGE TOOLBAR) */}
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
        <button
          onClick={() => setActiveTool('quick_pick')}
          style={{
            flex: 1,
            padding: '12px 18px',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            background: activeTool === 'quick_pick' ? 'linear-gradient(135deg, #f59e0b, #ef4444)' : 'transparent',
            color: activeTool === 'quick_pick' ? '#ffffff' : 'var(--text-muted)',
            fontWeight: 700,
            fontSize: '0.9rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            whiteSpace: 'nowrap',
            transition: 'all 0.2s ease',
          }}
        >
          <Dice5 size={18} />
          <span>Gợi Ý Số Nhanh (Quick Pick Pro)</span>
        </button>

        <button
          onClick={() => setActiveTool('checker')}
          style={{
            flex: 1,
            padding: '12px 18px',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            background: activeTool === 'checker' ? 'linear-gradient(135deg, #10b981, #06b6d4)' : 'transparent',
            color: activeTool === 'checker' ? '#ffffff' : 'var(--text-muted)',
            fontWeight: 700,
            fontSize: '0.9rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            whiteSpace: 'nowrap',
            transition: 'all 0.2s ease',
          }}
        >
          <CheckCircle2 size={18} />
          <span>Dò Vé Số Trực Tiếp</span>
          {checkerNumbers.length > 0 && (
            <span style={{ padding: '1px 6px', borderRadius: 10, background: 'rgba(0,0,0,0.3)', fontSize: '0.75rem' }}>
              {checkerNumbers.length}/6
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTool('history')}
          style={{
            flex: 1,
            padding: '12px 18px',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            background: activeTool === 'history' ? 'linear-gradient(135deg, #8b5cf6, #3b82f6)' : 'transparent',
            color: activeTool === 'history' ? '#ffffff' : 'var(--text-muted)',
            fontWeight: 700,
            fontSize: '0.9rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            whiteSpace: 'nowrap',
            transition: 'all 0.2s ease',
          }}
        >
          <Calendar size={18} />
          <span>Bảng Lịch Sử Toàn Bộ Kỳ Quay ({sortedDraws.length})</span>
        </button>
      </div>

      {/* 3. NỘI DUNG CỦA CÔNG CỤ ĐƯỢC CHỌN */}

      {/* --- CÔNG CỤ 1: QUICK PICK PRO --- */}
      {activeTool === 'quick_pick' && (
        <div className="glass-card animate-fade-in" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Sparkles size={20} color="var(--accent-gold)" />
                <span>Trình Tạo Bộ Số Ngẫu Nhiên Thông Minh</span>
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 4 }}>
                Chọn chiến lược tạo số toán học hoặc ghim những con số may mắn của riêng bạn.
              </p>
            </div>

            {/* Chế độ thuật toán */}
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

          {/* Dàn bóng số đã tạo */}
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

            {/* Phân tích nhanh bộ số vừa tạo */}
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
                <span>•</span>
                <span>
                  Khoảng cách đầu-cuối:{' '}
                  <strong style={{ color: '#ffffff' }}>
                    {generatedNumbers[5] - generatedNumbers[0]}
                  </strong>
                </span>
              </div>
            )}

            {/* Nút hành động */}
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
                    onClick={handleCopyCombo}
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
                    {copied ? <Check size={16} color="var(--accent-emerald)" /> : <Copy size={16} />}
                    <span>{copied ? 'Đã sao chép!' : 'Sao chép'}</span>
                  </button>

                  <button
                    onClick={() => handleTransferToChecker(generatedNumbers)}
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
                    <CheckCircle2 size={16} />
                    <span>Dò vé này ngay</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- CÔNG CỤ 2: IN-PAGE TICKET CHECKER --- */}
      {activeTool === 'checker' && (
        <div className="glass-card animate-fade-in" style={{ padding: 24 }}>
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircle2 size={20} color="var(--accent-emerald)" />
              <span>Dò Vé Số Nhanh (Trực Tiếp Trên Màn Hình)</span>
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 4 }}>
              Chọn 6 quả bóng dưới đây để đối soát ngay với kết quả mới nhất và kiểm tra lịch sử 8 năm.
            </p>
          </div>

          {/* Dàn số đang chọn */}
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
              gap: 12,
              marginBottom: 20,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                Bộ số của bạn ({checkerNumbers.length}/6):
              </span>
              {checkerNumbers.length === 0 ? (
                <span style={{ color: 'var(--text-dim)', fontSize: '0.82rem', fontStyle: 'italic' }}>
                  Chưa chọn số nào... Bấm vào các quả bóng bên dưới để chọn.
                </span>
              ) : (
                checkerNumbers.map((n) => (
                  <div
                    key={n}
                    className="lottery-ball ball-gold"
                    style={{ width: 42, height: 42, fontSize: '1.1rem', cursor: 'pointer' }}
                    onClick={() => toggleCheckerNumber(n)}
                    title="Bấm để bỏ số này"
                  >
                    {n.toString().padStart(2, '0')}
                  </div>
                ))
              )}
            </div>

            {checkerNumbers.length > 0 && (
              <button
                onClick={() => setCheckerNumbers([])}
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#f87171',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Xóa làm lại
              </button>
            )}
          </div>

          {/* Bảng chọn bóng số 01 - 55 / 01 - 45 */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(42px, 1fr))',
              gap: 8,
              marginBottom: 24,
              padding: 16,
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
            }}
          >
            {Array.from({ length: maxNumber }, (_, i) => i + 1).map((num) => {
              const isSelected = checkerNumbers.includes(num);
              const isLatestWinning = latestDraw?.balls.includes(num);
              const isSpecial = is655 && latestDraw?.special === num;

              return (
                <div
                  key={num}
                  onClick={() => toggleCheckerNumber(num)}
                  style={{
                    aspectRatio: '1',
                    borderRadius: 'var(--radius-sm)',
                    background: isSelected
                      ? 'linear-gradient(135deg, #f59e0b, #ef4444)'
                      : 'rgba(255, 255, 255, 0.04)',
                    border: isSelected
                      ? '1px solid #fbbf24'
                      : isSpecial
                      ? '1px solid #f43f5e'
                      : isLatestWinning
                      ? '1px solid rgba(245, 158, 11, 0.4)'
                      : '1px solid var(--border-subtle)',
                    color: isSelected ? '#ffffff' : '#e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: isSelected ? '0 0 10px rgba(245, 158, 11, 0.5)' : undefined,
                  }}
                  title={
                    isSpecial
                      ? 'Bóng đặc biệt kỳ trước'
                      : isLatestWinning
                      ? 'Bóng trúng thưởng kỳ trước'
                      : `Số ${num}`
                  }
                >
                  {num.toString().padStart(2, '0')}
                </div>
              );
            })}
          </div>

          {/* Kết quả đối soát */}
          {checkResult && checkerNumbers.length === 6 && (
            <div
              style={{
                padding: '20px 24px',
                borderRadius: 'var(--radius-md)',
                background: checkResult.isWinner
                  ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(15, 23, 42, 0.9))'
                  : 'rgba(0, 0, 0, 0.3)',
                border: checkResult.isWinner ? '1px solid #10b981' : '1px solid var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    Kết quả đối chiếu kỳ mới nhất (#{latestDraw?.id} - {latestDraw?.date}):
                  </div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 900, color: checkResult.prizeColor }}>
                    {checkResult.prizeName}
                  </div>
                </div>

                {checkResult.isWinner && (
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                      Giá trị giải thưởng ước tính
                    </div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--accent-gold)' }}>
                      {checkResult.prizeValue}
                    </div>
                  </div>
                )}
              </div>

              <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                Trùng <strong>{checkResult.matchedCount}</strong> số thông thường: [
                {checkResult.matchedMain.map((n) => n.toString().padStart(2, '0')).join(', ')}]
                {checkResult.matchedSpecial && (
                  <span style={{ color: '#fb7185', fontWeight: 700, marginLeft: 6 }}>
                    + Trùng số đặc biệt Jackpot 2 ({latestDraw?.special})
                  </span>
                )}
              </div>

              {/* Lịch sử trúng thưởng trong 1,400 kỳ */}
              <div style={{ marginTop: 10, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: 6 }}>
                  Tra cứu lịch sử 8 năm: Bộ số này đã về từ 3 số trở lên trong{' '}
                  <strong style={{ color: '#ffffff' }}>{historicalMatches.length}</strong> kỳ quay.
                </div>
                {historicalMatches.length > 0 && (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', maxHeight: 90, overflowY: 'auto' }}>
                    {historicalMatches.slice(0, 10).map((h, i) => (
                      <span
                        key={i}
                        className="badge badge-normal"
                        style={{ fontSize: '0.72rem', background: 'rgba(255,255,255,0.05)' }}
                      >
                        Kỳ #{h.draw.id} ({h.draw.date}): Trùng {h.matches} số
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- CÔNG CỤ 3: TOÀN BỘ LỊCH SỬ CÁC KỲ QUAY (HISTORICAL DRAWS EXPLORER) --- */}
      {activeTool === 'history' && (
        <div className="glass-card animate-fade-in" style={{ padding: 24 }}>
          {/* Thanh tìm kiếm & lọc nhanh */}
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

          {/* Bảng danh sách các kỳ quay */}
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
                  {/* Mã kỳ & Ngày */}
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

                  {/* Dàn bóng số */}
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

                  {/* Hành động nhanh */}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => handleTransferToChecker(draw.balls)}
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

          {/* Phân trang */}
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
