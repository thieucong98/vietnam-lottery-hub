import { useEffect, useMemo, useState } from 'react';
import { NumberAppearance, NumberDetail } from '../../types';
import { DRAWS_DATASET, LotteryGame, numberDetailUrl, numberHistoryUrl, VietlottGame } from '../../data/datasets';
import { useDataset, useJson } from '../../data/useData';
import type { LookupMode, LookupTarget } from '../../app/routes';
import {
  evaluateVietlottHistory,
  findPairCoOccurrences,
  formatBallList,
  parseNumberList,
  VietlottPrizeTier,
} from '../../utils/ticketCheck';

export interface InstantLookupModalProps {
  /** Chế độ, trò chơi và số đang tra cứu, đọc từ URL */
  target: LookupTarget;
  /** Ghi lại lựa chọn mới vào URL */
  onChangeTarget: (target: LookupTarget) => void;
  onClose: () => void;
}

export const DEFAULT_COMBO = [7, 18, 24, 35, 41, 55];
const DEFAULT_PAIR: [string, string] = ['07', '35'];
const COMBO_MIN = 2;
const COMBO_MAX = 18;

export const TIER_LABELS: Record<VietlottGame, Record<VietlottPrizeTier, string>> = {
  vietlott_655: {
    jackpot1: 'Jackpot 1 (Trúng 6/6 số)',
    jackpot2: 'Jackpot 2 (Trúng 5 số + Bóng Đặc Biệt)',
    prize1: 'Giải Nhất (Trúng 5/6 số)',
    prize2: 'Giải Nhì (Trúng 4/6 số)',
    prize3: 'Giải Ba (Trúng 3/6 số)',
  },
  vietlott_645: {
    jackpot1: 'Jackpot (Trúng 6/6 số)',
    jackpot2: 'Jackpot 2',
    prize1: 'Giải Nhất (Trúng 5/6 số)',
    prize2: 'Giải Nhì (Trúng 4/6 số)',
    prize3: 'Giải Ba (Trúng 3/6 số)',
  },
};

export const TIER_BADGES: Record<VietlottPrizeTier, string> = {
  jackpot1: 'badge-gold',
  jackpot2: 'badge-hot',
  prize1: 'badge-normal',
  prize2: 'badge-cyan',
  prize3: 'badge-slate',
};

export const QUICK_PICKS: Record<LotteryGame, string[]> = {
  xsmb: ['68', '86', '79', '39', '18', '51', '04', '99'],
  vietlott_655: ['07', '18', '24', '35', '41', '13', '02', '55'],
  vietlott_645: ['07', '18', '24', '35', '41', '13', '02', '45'],
};

const FIRST_YEAR: Record<LotteryGame, number> = { xsmb: 2005, vietlott_655: 2017, vietlott_645: 2016 };

export const gameRange = (game: LotteryGame) => ({
  min: game === 'xsmb' ? 0 : 1,
  max: game === 'xsmb' ? 99 : game === 'vietlott_655' ? 55 : 45,
});

const pad2 = (n: number | string) => String(n).padStart(2, '0');
const sameList = (a: string[], b: string[]) => a.length === b.length && a.every((v, i) => v === b[i]);

export function useInstantLookup({ target, onChangeTarget }: InstantLookupModalProps) {
  const activeTabMode: LookupMode = target.mode;
  const selectedGame: LotteryGame = target.game;
  const isVietlott = selectedGame !== 'xsmb';
  const { min: minNumber, max: maxNumber } = gameRange(selectedGame);
  const gameUnit = isVietlott ? 'kỳ' : 'lần';

  const update = (next: Partial<LookupTarget>) => {
    const merged = { ...target, ...next };
    if (merged.mode !== target.mode || merged.game !== target.game || !sameList(merged.numbers, target.numbers)) {
      onChangeTarget(merged);
    }
  };

  // ---------------- Tab 1: tra cứu đơn số ----------------
  const [searchQuery, setSearchQuery] = useState(target.mode === 'single' ? target.numbers[0] ?? '' : '');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [onlySpecial, setOnlySpecial] = useState(false);
  const [onlyMultiHits, setOnlyMultiHits] = useState(false);
  const [onlyJackpot2Ball, setOnlyJackpot2Ball] = useState(false);
  const [fullHistoryKey, setFullHistoryKey] = useState<string | null>(null);
  const [copiedNotice, setCopiedNotice] = useState(false);

  const formattedNumber = useMemo(() => {
    const num = parseInt(searchQuery.trim(), 10);
    if (isNaN(num) || num < minNumber || num > maxNumber) return '';
    return pad2(num);
  }, [searchQuery, minNumber, maxNumber]);

  // Ô tìm kiếm -> URL (thay URL tại chỗ, không thêm lịch sử)
  useEffect(() => {
    if (target.mode !== 'single') return;
    update({ numbers: formattedNumber ? [formattedNumber] : [] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formattedNumber]);

  // URL -> ô tìm kiếm (khi bấm back/forward hoặc mở số khác từ trang)
  const urlNumber = target.mode === 'single' ? target.numbers[0] ?? '' : null;
  useEffect(() => {
    if (urlNumber !== null && urlNumber !== formattedNumber) setSearchQuery(urlNumber);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlNumber, selectedGame]);

  const detectedMultiNumbers = useMemo(() => {
    const tokens = searchQuery.trim().split(/[\s,;.-]+/).filter(Boolean);
    return tokens.length >= 2 ? parseNumberList(searchQuery, minNumber, maxNumber) : [];
  }, [searchQuery, minNumber, maxNumber]);

  const detailState = useJson<NumberDetail>(
    activeTabMode === 'single' && formattedNumber ? numberDetailUrl(selectedGame, formattedNumber) : null
  );
  const detail = detailState.data ?? undefined;

  const historyKey = `${selectedGame}_${formattedNumber}`;
  const fullHistoryState = useJson<NumberAppearance[]>(
    fullHistoryKey === historyKey && formattedNumber ? numberHistoryUrl(selectedGame, formattedNumber) : null
  );
  const loadedFullList = fullHistoryKey === historyKey ? fullHistoryState.data ?? undefined : undefined;
  const loadingFullHistory = fullHistoryState.loading;
  const loadFullHistory = () => setFullHistoryKey(historyKey);

  const validYears = useMemo(() => {
    const years = ['all'];
    for (let y = new Date().getFullYear(); y >= FIRST_YEAR[selectedGame]; y--) years.push(y.toString());
    return years;
  }, [selectedGame]);

  const filteredHistory = useMemo(() => {
    let list = [...(loadedFullList || detail?.recent_history || [])];
    if (selectedYear !== 'all') list = list.filter((item) => item.date.startsWith(selectedYear));
    if (selectedGame === 'xsmb') {
      if (onlySpecial) list = list.filter((item) => item.is_special);
      if (onlyMultiHits) list = list.filter((item) => (item.hits || 1) >= 2);
    } else if (selectedGame === 'vietlott_655' && onlyJackpot2Ball) {
      // Power 6/55: bóng thứ 7 (index 6) là bóng Jackpot 2
      const targetNum = parseInt(formattedNumber, 10);
      list = list.filter((item) => item.result && item.result.length > 6 && item.result[6] === targetNum);
    }
    return list;
  }, [loadedFullList, detail, selectedYear, selectedGame, onlySpecial, onlyMultiHits, onlyJackpot2Ball, formattedNumber]);

  const handleSelectYear = (year: string) => {
    setSelectedYear(year);
    if (year !== 'all' && !loadedFullList) loadFullHistory();
  };

  const handleExportCSV = () => {
    if (filteredHistory.length === 0) return;
    const headers = isVietlott
      ? 'Ngày quay,Kỳ quay,Vị trí bóng,Chi tiết bộ số\n'
      : 'Ngày quay,Số lần xuất hiện,Chi tiết giải thưởng,Giải Đặc Biệt\n';
    const rows = filteredHistory
      .map((item) => {
        if (isVietlott) {
          const isJp2 = item.result && item.result.length > 6 && item.result[6] === parseInt(formattedNumber, 10);
          const pos = isJp2 ? 'Bóng Đặc Biệt (Jackpot 2)' : 'Bóng Chính (Jackpot 1)';
          return `"${item.date}","Kỳ #${item.id || ''}","${pos}","${item.result ? item.result.join(' - ') : ''}"`;
        }
        return `"${item.date}",${item.hits || 1},"${(item.prizes || []).join('; ')}","${item.is_special ? 'Có' : 'Không'}"`;
      })
      .join('\n');

    const blob = new Blob(['\uFEFF' + headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${selectedGame}_so_${formattedNumber}_lich_su.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopySummary = () => {
    if (!detail) return;
    const text = isVietlott
      ? `Thống kê bóng ${detail.number} (${selectedGame.toUpperCase()}): Đã về ${detail.total_hits} kỳ, lần gần nhất: ${detail.last_seen_date} (${detail.days_since_last} ngày trước), kỷ lục gan: ${detail.max_gap_historical} ngày, chu kỳ trung bình: ${detail.average_gap} ngày/lần.`
      : `Thống kê số ${detail.number} (XSMB): Đã xuất hiện ${detail.total_hits} lần, lần gần nhất: ${detail.last_seen_date} (${detail.days_since_last} ngày trước), kỷ lục gan: ${detail.max_gap_historical} ngày, chu kỳ trung bình: ${detail.average_gap} ngày/lần.`;
    navigator.clipboard?.writeText(text);
    setCopiedNotice(true);
    setTimeout(() => setCopiedNotice(false), 2000);
  };

  // ---------------- Tab 2: bộ số / vé bao ----------------
  // Khóa theo chuỗi số: target được tạo lại mỗi lần render nên mảng numbers luôn là mảng mới
  const comboKey = activeTabMode === 'combination' ? target.numbers.join('-') : '';
  const comboBalls = useMemo(() => {
    const nums = comboKey ? comboKey.split('-').map((n) => parseInt(n, 10)) : [];
    return nums.length >= COMBO_MIN ? nums.sort((a, b) => a - b) : DEFAULT_COMBO;
  }, [comboKey]);
  const setComboBalls = (nums: number[]) =>
    update({ mode: 'combination', numbers: [...nums].sort((a, b) => a - b).map(pad2) });

  const [comboInputText, setComboInputText] = useState(formatBallList(comboBalls));
  useEffect(() => setComboInputText(formatBallList(comboBalls)), [comboBalls]);
  const [minMatchFilter, setMinMatchFilter] = useState(3);
  const [showBallPickerGrid, setShowBallPickerGrid] = useState(true);

  const handleToggleComboBall = (num: number) => {
    if (comboBalls.includes(num)) {
      if (comboBalls.length <= COMBO_MIN) return;
      setComboBalls(comboBalls.filter((n) => n !== num));
    } else {
      if (comboBalls.length >= COMBO_MAX) return;
      setComboBalls([...comboBalls, num]);
    }
  };

  const handleApplyComboInput = () => {
    const unique = parseNumberList(comboInputText, minNumber, maxNumber);
    if (unique.length >= COMBO_MIN) setComboBalls(unique.sort((a, b) => a - b).slice(0, COMBO_MAX));
  };

  const handleRandomCombo = () => {
    const nums: number[] = [];
    while (nums.length < 6) {
      const r = Math.floor(Math.random() * (maxNumber - minNumber + 1)) + minNumber;
      if (!nums.includes(r)) nums.push(r);
    }
    setComboBalls(nums);
  };

  const handleSwitchToComboFromInput = () => {
    if (detectedMultiNumbers.length < COMBO_MIN) return;
    update({
      mode: 'combination',
      game: isVietlott ? selectedGame : 'vietlott_655',
      numbers: [...detectedMultiNumbers].sort((a, b) => a - b).slice(0, COMBO_MAX).map(pad2),
    });
  };

  const comboGame: VietlottGame = selectedGame === 'vietlott_645' ? 'vietlott_645' : 'vietlott_655';
  const drawsState = useDataset(DRAWS_DATASET[comboGame], activeTabMode === 'combination');
  const comboHistoricalDraws = useMemo(() => drawsState.data?.draws ?? [], [drawsState.data]);
  const comboLoading = drawsState.loading;

  const comboEvaluationResults = useMemo(() => {
    const evaluation = evaluateVietlottHistory(comboGame, comboHistoricalDraws, comboBalls, minMatchFilter);
    return {
      jackpot1Count: evaluation.counts.jackpot1,
      jackpot2Count: evaluation.counts.jackpot2,
      prize1Count: evaluation.counts.prize1,
      prize2Count: evaluation.counts.prize2,
      prize3Count: evaluation.counts.prize3,
      totalWinningDraws: evaluation.totalWinningDraws,
      matchingDraws: evaluation.matches.map((m) => {
        const total = m.matchedMain.length + (m.matchedSpecial ? 1 : 0);
        return {
          ...m,
          prizeTitle: m.tier ? TIER_LABELS[comboGame][m.tier] : `Trùng ${total} số`,
          prizeBadge: m.tier ? TIER_BADGES[m.tier] : 'badge-slate',
        };
      }),
    };
  }, [comboGame, comboHistoricalDraws, comboBalls, minMatchFilter]);

  // ---------------- Tab 3: cặp số cùng xuất hiện ----------------
  const urlPair = activeTabMode === 'pair' && target.numbers.length === 2 ? target.numbers : null;
  const [pairNum1, setPairNum1] = useState(urlPair?.[0] ?? DEFAULT_PAIR[0]);
  const [pairNum2, setPairNum2] = useState(urlPair?.[1] ?? DEFAULT_PAIR[1]);
  useEffect(() => {
    if (!urlPair) return;
    setPairNum1(urlPair[0]);
    setPairNum2(urlPair[1]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlPair?.join('-')]);

  const pairReady = Boolean(urlPair && urlPair[0] !== urlPair[1]);
  const hist1 = useJson<NumberAppearance[]>(pairReady ? numberHistoryUrl(selectedGame, urlPair![0]) : null);
  const hist2 = useJson<NumberAppearance[]>(pairReady ? numberHistoryUrl(selectedGame, urlPair![1]) : null);
  const pairLoading = hist1.loading || hist2.loading;
  const pairMatches = useMemo(
    () => (urlPair && hist1.data && hist2.data ? findPairCoOccurrences(hist1.data, hist2.data, urlPair[0], urlPair[1]) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [hist1.data, hist2.data, urlPair?.join('-')]
  );

  const handleCheckPair = () => {
    const n1 = pad2(pairNum1.trim().slice(-2));
    const n2 = pad2(pairNum2.trim().slice(-2));
    if (n1 === n2) return;
    update({ mode: 'pair', numbers: [n1, n2] });
  };

  // ---------------- Chuyển tab & trò chơi ----------------
  const setActiveTabMode = (mode: LookupMode) => {
    if (mode === 'single') update({ mode, numbers: formattedNumber ? [formattedNumber] : [] });
    else if (mode === 'combination')
      update({ mode, game: isVietlott ? selectedGame : 'vietlott_655', numbers: comboBalls.map(pad2) });
    else update({ mode, numbers: [pad2(pairNum1), pad2(pairNum2)] });
  };

  const setSelectedGame = (game: LotteryGame) => update({ game });

  const { data: cooccurrenceData } = useDataset('cooccurrence', activeTabMode !== 'single');

  return {
    activeTabMode,
    setActiveTabMode,
    selectedGame,
    setSelectedGame,
    isVietlott,
    minNumber,
    maxNumber,
    gameUnit,
    quickPicks: QUICK_PICKS[selectedGame],
    cooccurrenceData,
    // Tab 1
    searchQuery,
    setSearchQuery,
    formattedNumber,
    detectedMultiNumbers,
    handleSwitchToComboFromInput,
    detail,
    detailLoading: detailState.loading,
    detailError: detailState.error,
    validYears,
    selectedYear,
    setSelectedYear: handleSelectYear,
    onlySpecial,
    setOnlySpecial,
    onlyMultiHits,
    setOnlyMultiHits,
    onlyJackpot2Ball,
    setOnlyJackpot2Ball,
    loadedFullList,
    loadingFullHistory,
    loadFullHistory,
    filteredHistory,
    handleExportCSV,
    handleCopySummary,
    copiedNotice,
    // Tab 2
    comboGame,
    comboBalls,
    setComboBalls,
    comboInputText,
    setComboInputText,
    minMatchFilter,
    setMinMatchFilter,
    showBallPickerGrid,
    setShowBallPickerGrid,
    handleToggleComboBall,
    handleApplyComboInput,
    handleRandomCombo,
    comboLoading,
    comboTotalDraws: comboHistoricalDraws.length,
    comboEvaluationResults,
    // Tab 3
    pairNum1,
    setPairNum1,
    pairNum2,
    setPairNum2,
    pairLoading,
    pairMatches,
    handleCheckPair,
  };
}

export type InstantLookupModalModel = ReturnType<typeof useInstantLookup>;
