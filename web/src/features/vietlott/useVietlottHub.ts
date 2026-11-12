import { useState, useMemo, useEffect } from 'react';
import { useControllableState } from '../../ui/useControllableState';
import {
  LotteryIndexData,
  VietlottHistoricalDraw,
  SummaryData,
  VietlottCooccurrenceItem,
} from '../../types';
import { getVietlottBaoCost } from '../../utils/lotteryUtils';

export interface VietlottProductHubProps {
  gameType: 'vietlott_655' | 'vietlott_645';
  indexData: LotteryIndexData | null;
  historicalDraws: VietlottHistoricalDraw[];
  cooccurrence?: {
    top_pairs: VietlottCooccurrenceItem[];
    top_triplets: VietlottCooccurrenceItem[];
  } | null;
  summaryData: SummaryData | null;
  onSelectNumber: (num: string) => void;
  /** Công cụ đang mở (do URL điều khiển) */
  tool?: ActiveTool;
  onToolChange?: (tool: ActiveTool) => void;
  /** Bộ số nạp sẵn vào công cụ Bộ Số & Vé Bao (từ ?so=) */
  initialBalls?: number[];
}

export type GeneratorMode = 'random' | 'balanced' | 'golden_sum' | 'hot_bias';
export type ActiveTool = 'quick_pick' | 'combo_bao' | 'cooccurrence' | 'history';
export type BacktestHorizon = 'all' | '3y' | '1y' | '100';

export function useVietlottHub(props: VietlottProductHubProps) {
  const {
    gameType,
    indexData,
    historicalDraws,
    cooccurrence,
    summaryData,
    onSelectNumber,
    tool,
    onToolChange,
    initialBalls,
  } = props;
  const is655 = gameType === 'vietlott_655';
  const maxNumber = is655 ? 55 : 45;
  const gameName = is655 ? 'Power 6/55' : 'Mega 6/45';
  const scheduleInfo = is655
    ? 'Thứ 3, Thứ 5, Thứ 7 hàng tuần (18:00 - 18:30)'
    : 'Thứ 4, Thứ 6, Chủ Nhật hàng tuần (18:00 - 18:30)';

  // Sub-tabs nội bộ hợp nhất trên màn hình sản phẩm
  const [activeTool, setActiveTool] = useControllableState<ActiveTool>(tool, onToolChange, 'quick_pick');

  // --- TOOL 1: QUICK PICK PRO STATE ---
  const [generatorMode, setGeneratorMode] = useState<GeneratorMode>('balanced');
  const [pinnedNumbers, setPinnedNumbers] = useState<number[]>([]);
  const [generatedNumbers, setGeneratedNumbers] = useState<number[]>([]);
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [quickPickCopied, setQuickPickCopied] = useState<boolean>(false);

  // --- TOOL 2: TRA CỨU BỘ SỐ & VÉ BAO STATE ---
  const [selectedBalls, setSelectedBalls] = useState<number[]>(initialBalls?.length ? initialBalls : [3, 11, 16, 22, 35, 41]);
  const initialKey = initialBalls?.join('-') ?? '';
  useEffect(() => {
    if (initialBalls?.length) setSelectedBalls([...initialBalls].sort((a, b) => a - b));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialKey]);
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

    const costPerDraw = getVietlottBaoCost(selectedBalls.length, maxNumber);
    const totalCost = sortedDraws.length * costPerDraw;

    return {
      totalDraws: sortedDraws.length,
      matches: matchedDraws,
      counts: { 6: c6, jp2: cJp2, 5: c5, 4: c4, 3: c3 },
      totalPrizeMoney,
      totalCost,
    };
  }, [sortedDraws, selectedBalls, is655, maxNumber]);

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

  return {
    gameType,
    indexData,
    historicalDraws,
    cooccurrence,
    summaryData,
    onSelectNumber,
    activeTool,
    setActiveTool,
    generatorMode,
    setGeneratorMode,
    pinnedNumbers,
    setPinnedNumbers,
    generatedNumbers,
    setGeneratedNumbers,
    isRolling,
    setIsRolling,
    quickPickCopied,
    setQuickPickCopied,
    selectedBalls,
    setSelectedBalls,
    comboCopied,
    setComboCopied,
    filterMinMatches,
    setFilterMinMatches,
    backtestHorizon,
    setBacktestHorizon,
    historySearch,
    setHistorySearch,
    currentPage,
    setCurrentPage,
    is655,
    maxNumber,
    gameName,
    scheduleInfo,
    itemsPerPage,
    sortedDraws,
    latestDraw,
    topGanSet,
    topHotList,
    handleGenerateNumbers,
    handleTogglePin,
    handleCopyQuickPick,
    handleTransferToComboBao,
    handleToggleComboBall,
    handleQuickPickCombo6,
    handleLoadComboNumbers,
    handleCopyComboBalls,
    matchAnalysis,
    filteredTimeline,
    filteredHistory,
    totalPages,
    paginatedHistory,
  };
}

export type VietlottProductHubModel = ReturnType<typeof useVietlottHub>;
