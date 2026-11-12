import { useState, useMemo } from 'react';
import { useControllableState } from '../../ui/useControllableState';
import {
  SummaryData,
  LatestDrawXSMB,
  XSMBHistoricalDraw,
} from '../../types';

export interface XSMBProductHubProps {
  summaryData: SummaryData | null;
  historicalDraws?: XSMBHistoricalDraw[];
  onSelectNumber: (num: string) => void;
  onSelectHistoricalDraw?: (draw: XSMBHistoricalDraw) => void;
  selectedDrawDate?: string;
  onTabChange?: (tab: XSMBHubTab) => void;
}

export type XSMBHubTab = 'quick_checker' | 'history';
export type HistoryTimeRange = '7' | '30' | '90' | 'all';

export function useXsmbHub(props: XSMBProductHubProps) {
  const {
    summaryData,
    historicalDraws = [],
    onSelectNumber,
    onSelectHistoricalDraw,
    selectedDrawDate,
    onTabChange,
  } = props;
  const [activeTab, setActiveTab] = useControllableState<XSMBHubTab>(undefined, onTabChange, 'quick_checker');

  // --- HISTORY STATE ---
  const [historySearch, setHistorySearch] = useState<string>('');
  const [historyRange, setHistoryRange] = useState<HistoryTimeRange>('30');
  const [historyPage, setHistoryPage] = useState<number>(1);
  const [expandedDrawDate, setExpandedDrawDate] = useState<string | null>(null);

  // --- CHECKER STATE ---
  const [checkInput, setCheckInput] = useState<string>('');
  const [checkResult, setCheckResult] = useState<{
    query: string;
    hits: number;
    prizes: string[];
    isSpecial: boolean;
  } | null>(null);

  // Lọc danh sách lịch sử kỳ quay
  const filteredHistory = useMemo(() => {
    const list = historicalDraws || [];

    // Nếu người dùng đang tìm kiếm, tìm kiếm trên toàn bộ kỳ quay đã nạp
    if (historySearch.trim()) {
      const query = historySearch.trim().toLowerCase();
      return list.filter((draw) => {
        if (draw.date.includes(query)) return true;
        if (draw.day_of_week?.toLowerCase().includes(query)) return true;
        if (draw.province?.toLowerCase().includes(query)) return true;
        if (draw.special_2d === query) return true;
        if (draw.special?.includes(query)) return true;
        if (draw.prize1?.includes(query)) return true;
        return false;
      });
    }

    // Nếu không tìm kiếm, áp dụng bộ lọc khoảng thời gian nhanh (7, 30, 90, all)
    if (historyRange === '7') {
      return list.slice(0, 7);
    } else if (historyRange === '30') {
      return list.slice(0, 30);
    } else if (historyRange === '90') {
      return list.slice(0, 90);
    }
    return list;
  }, [historicalDraws, historyRange, historySearch]);

  const historyPageSize = 8;
  const totalHistoryPages = Math.max(1, Math.ceil(filteredHistory.length / historyPageSize));
  const paginatedHistory = useMemo(() => {
    const start = (historyPage - 1) * historyPageSize;
    return filteredHistory.slice(start, start + historyPageSize);
  }, [filteredHistory, historyPage]);


  // Lấy dữ liệu mở thưởng mới nhất
  const latestDraw = summaryData?.xsmb_latest as LatestDrawXSMB | undefined;
  const lotoList = latestDraw?.loto_numbers || [];
  const rawPrizes = latestDraw?.raw_prizes || {};

  // Dò vé XSMB
  const handleCheck = () => {
    const raw = checkInput.trim();
    if (!raw) return;

    // Lấy 2 chữ số cuối
    const last2 = raw.length >= 2 ? raw.slice(-2) : raw.padStart(2, '0');

    // Đếm số lần 2 số cuối xuất hiện trong 27 giải
    const hits = lotoList.filter((n) => n === last2).length;

    // Tìm các giải thưởng cụ thể
    const matchedPrizes: string[] = [];
    let isSpecial = false;

    for (const [pKey, pVal] of Object.entries(rawPrizes)) {
      if (pVal === null || pVal === undefined) continue;
      const strVal = pVal.toString();
      if (strVal.endsWith(last2)) {
        let pLabel = pKey;
        if (pKey === 'special') {
          pLabel = 'Giải Đặc Biệt';
          isSpecial = true;
        } else if (pKey === 'prize1') pLabel = 'Giải Nhất';
        else if (pKey.startsWith('prize2')) pLabel = 'Giải Nhì';
        else if (pKey.startsWith('prize3')) pLabel = 'Giải Ba';
        else if (pKey.startsWith('prize4')) pLabel = 'Giải Tư';
        else if (pKey.startsWith('prize5')) pLabel = 'Giải Năm';
        else if (pKey.startsWith('prize6')) pLabel = 'Giải Sáu';
        else if (pKey.startsWith('prize7')) pLabel = 'Giải Bảy';
        matchedPrizes.push(`${pLabel} (${strVal})`);
      }
    }

    setCheckResult({
      query: raw,
      hits,
      prizes: matchedPrizes,
      isSpecial,
    });
  };

  return {
    summaryData,
    historicalDraws,
    onSelectNumber,
    onSelectHistoricalDraw,
    selectedDrawDate,
    activeTab,
    setActiveTab,
    historySearch,
    setHistorySearch,
    historyRange,
    setHistoryRange,
    historyPage,
    setHistoryPage,
    expandedDrawDate,
    setExpandedDrawDate,
    checkInput,
    setCheckInput,
    checkResult,
    setCheckResult,
    filteredHistory,
    historyPageSize,
    totalHistoryPages,
    paginatedHistory,
    latestDraw,
    lotoList,
    rawPrizes,
    handleCheck,
  };
}

export type XSMBProductHubModel = ReturnType<typeof useXsmbHub>;
