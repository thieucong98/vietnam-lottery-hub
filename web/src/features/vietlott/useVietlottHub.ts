import { useState, useMemo, useEffect } from 'react';
import { useControllableState } from '../../ui/useControllableState';
import {
  LotteryIndexData,
  VietlottHistoricalDraw,
  SummaryData,
  VietlottCooccurrenceItem,
} from '../../types';
import { getVietlottBaoCost } from '../../utils/lotteryUtils';
import { popularPatterns, quickPick, QuickPickOptions, validateQuickPick } from '../../utils/quickPick';

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

  // --- TOOL 1: QUICK PICK NGẪU NHIÊN CÓ TÙY CHỌN ---
  const [pinnedNumbers, setPinnedNumbers] = useState<number[]>([]);
  const [excludedNumbers, setExcludedNumbers] = useState<number[]>([]);
  const [sumFilterOn, setSumFilterOn] = useState<boolean>(false);
  // Mặc định: khoảng quanh tổng kỳ vọng 6 x (N + 1) / 2
  const [sumRange, setSumRange] = useState<[number, number]>(is655 ? [138, 198] : [113, 163]);
  const [evenCount, setEvenCount] = useState<number | null>(null);
  const [avoidPopular, setAvoidPopular] = useState<boolean>(false);
  const [generatedNumbers, setGeneratedNumbers] = useState<number[]>([]);
  const [quickPickError, setQuickPickError] = useState<string | null>(null);
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
  // CÔNG CỤ 1: QUICK PICK NGẪU NHIÊN CÓ TÙY CHỌN
  // ==========================================
  // Các tùy chọn chỉ giới hạn tập bộ số; trong tập đó mọi bộ có cùng khả năng được chọn (utils/quickPick.ts)
  const lastDrawBalls = useMemo(() => latestDraw?.balls ?? [], [latestDraw]);
  const pickOptions: QuickPickOptions = {
    maxNumber,
    pinned: pinnedNumbers,
    excluded: excludedNumbers,
    sumRange: sumFilterOn ? sumRange : null,
    evenCount,
    avoidPopular,
    lastDraw: lastDrawBalls,
  };
  const pickOptionsError = validateQuickPick(pickOptions);

  const handleGenerateNumbers = () => {
    setQuickPickCopied(false);
    const res = quickPick(pickOptions);
    if ('reason' in res) {
      setQuickPickError(res.reason);
    } else {
      setGeneratedNumbers(res.numbers);
      setQuickPickError(null);
    }
  };

  const handleToggleExcluded = (num: number) => {
    setExcludedNumbers((prev) => (prev.includes(num) ? prev.filter((n) => n !== num) : [...prev, num].sort((a, b) => a - b)));
  };

  const generatedPatterns = useMemo(() => popularPatterns(generatedNumbers, lastDrawBalls), [generatedNumbers, lastDrawBalls]);

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
    pinnedNumbers,
    setPinnedNumbers,
    excludedNumbers,
    setExcludedNumbers,
    handleToggleExcluded,
    sumFilterOn,
    setSumFilterOn,
    sumRange,
    setSumRange,
    evenCount,
    setEvenCount,
    avoidPopular,
    setAvoidPopular,
    pickOptionsError,
    quickPickError,
    generatedPatterns,
    generatedNumbers,
    setGeneratedNumbers,
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
