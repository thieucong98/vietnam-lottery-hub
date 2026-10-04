import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Search,
  Calendar,
  Trophy,
  AlertTriangle,
  Flame,
  Layers,
  Sparkles,
  Filter,
  CheckCircle2,
  Clock,
  BarChart2,
  Download,
  Copy,
  RefreshCw,
  Hash,
  Award,
  Star,
  Check,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import {
  LotteryIndexData,
  NumberDetail,
  NumberAppearance,
  VietlottFullDrawsData,
  VietlottCooccurrenceData,
  VietlottHistoricalDraw,
} from '../types';

interface InstantLookupModalProps {
  isOpen: boolean;
  onClose: () => void;
  xsmbData: LotteryIndexData | null;
  vietlott655Data: LotteryIndexData | null;
  vietlott645Data: LotteryIndexData | null;
  fullDrawsData?: VietlottFullDrawsData | null;
  cooccurrenceData?: VietlottCooccurrenceData | null;
  initialNumber?: string;
}

export const InstantLookupModal: React.FC<InstantLookupModalProps> = ({
  isOpen,
  onClose,
  xsmbData,
  vietlott655Data,
  vietlott645Data,
  fullDrawsData,
  cooccurrenceData,
  initialNumber = '',
}) => {
  // 3 Chế độ tra cứu: Đơn số, Bộ số / Vé bao, Cặp số cùng về
  const [activeTabMode, setActiveTabMode] = useState<'single' | 'combination' | 'xien'>('single');
  const [selectedGame, setSelectedGame] = useState<'xsmb' | 'vietlott_655' | 'vietlott_645'>('vietlott_655');
  const [searchQuery, setSearchQuery] = useState(initialNumber);

  // Tab 2: Xiên 2 / Cặp số cùng về
  const [xienNum1, setXienNum1] = useState<string>('07');
  const [xienNum2, setXienNum2] = useState<string>('35');
  const [xienLoading, setXienLoading] = useState<boolean>(false);
  const [xienMatches, setXienMatches] = useState<{ date: string; num1Hits: number; num2Hits: number; isSpecial1?: boolean; isSpecial2?: boolean }[] | null>(null);

  // Tab 3: Tra cứu Bộ số / Vé Bao
  const [comboBalls, setComboBalls] = useState<number[]>([7, 18, 24, 35, 41, 55]);
  const [comboInputText, setComboInputText] = useState<string>('07, 18, 24, 35, 41, 55');
  const [minMatchFilter, setMinMatchFilter] = useState<number>(3);
  const [showBallPickerGrid, setShowBallPickerGrid] = useState<boolean>(true);

  // Bộ lọc lịch sử Tab 1
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [onlySpecial, setOnlySpecial] = useState<boolean>(false);
  const [onlyMultiHits, setOnlyMultiHits] = useState<boolean>(false);
  const [onlyJackpot2Ball, setOnlyJackpot2Ball] = useState<boolean>(false);

  // Lazy loaded full history Tab 1
  const [fullHistoryMap, setFullHistoryMap] = useState<Record<string, NumberAppearance[]>>({});
  const [loadingFullHistory, setLoadingFullHistory] = useState<boolean>(false);
  const [copiedNotice, setCopiedNotice] = useState<boolean>(false);

  // Phím Escape để đóng modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Đồng bộ số tìm kiếm khi mở từ ngoài vào
  useEffect(() => {
    if (initialNumber) {
      setSearchQuery(initialNumber);
    }
  }, [initialNumber]);

  const isVietlott = selectedGame !== 'xsmb';
  const minNumber = isVietlott ? 1 : 0;
  const maxNumber = selectedGame === 'xsmb' ? 99 : selectedGame === 'vietlott_655' ? 55 : 45;
  const gameUnit = isVietlott ? 'kỳ' : 'nháy';

  // Danh sách năm hợp lệ theo từng game
  const validYears = useMemo(() => {
    const startYear = selectedGame === 'xsmb' ? 2005 : selectedGame === 'vietlott_655' ? 2017 : 2016;
    const years = ['all'];
    for (let y = 2026; y >= startYear; y--) {
      years.push(y.toString());
    }
    return years;
  }, [selectedGame]);

  const activeData =
    selectedGame === 'xsmb'
      ? xsmbData
      : selectedGame === 'vietlott_655'
      ? vietlott655Data
      : vietlott645Data;

  // Tự động phát hiện nếu người dùng nhập chuỗi nhiều số trong ô tìm kiếm đơn số
  const detectedMultiNumbers = useMemo(() => {
    const tokens = searchQuery.trim().split(/[\s,;.-]+/).filter(Boolean);
    if (tokens.length >= 2) {
      const parsed = tokens
        .map((t) => parseInt(t, 10))
        .filter((n) => !isNaN(n) && n >= minNumber && n <= maxNumber);
      return Array.from(new Set(parsed));
    }
    return [];
  }, [searchQuery, minNumber, maxNumber]);

  // Chuẩn hóa số tìm kiếm đơn
  const formattedNumber = useMemo(() => {
    const cleaned = searchQuery.trim();
    if (!cleaned) return '';
    const num = parseInt(cleaned, 10);
    if (isNaN(num)) return '';
    if (num < minNumber || num > maxNumber) return '';
    return num.toString().padStart(2, '0');
  }, [searchQuery, minNumber, maxNumber]);

  const detail: NumberDetail | undefined = useMemo(() => {
    if (!activeData || !activeData.numbers || !formattedNumber) return undefined;
    return activeData.numbers[formattedNumber];
  }, [activeData, formattedNumber]);

  // Tải full history khi người dùng chọn lọc năm hoặc yêu cầu
  const loadFullHistory = async (num: string) => {
    const cacheKey = `${selectedGame}_${num}`;
    if (fullHistoryMap[cacheKey]) return fullHistoryMap[cacheKey];

    try {
      setLoadingFullHistory(true);
      const folder =
        selectedGame === 'xsmb' ? 'xsmb' : selectedGame === 'vietlott_655' ? 'vietlott_655' : 'vietlott_645';
      const res = await fetch(`./data/history/${folder}/${num}.json`);
      if (res.ok) {
        const data: NumberAppearance[] = await res.json();
        setFullHistoryMap((prev) => ({ ...prev, [cacheKey]: data }));
        return data;
      }
    } catch (e) {
      console.error('Lỗi tải full history:', e);
    } finally {
      setLoadingFullHistory(false);
    }
    return [];
  };

  // Tính toán danh sách ngày hiển thị dựa trên full history hoặc recent_history
  const cacheKey = `${selectedGame}_${formattedNumber}`;
  const loadedFullList = fullHistoryMap[cacheKey];
  const sourceList = loadedFullList || detail?.recent_history || [];

  const filteredHistory = useMemo(() => {
    let list = [...sourceList];
    if (selectedYear !== 'all') {
      list = list.filter((item) => item.date.startsWith(selectedYear));
    }
    if (selectedGame === 'xsmb') {
      if (onlySpecial) {
        list = list.filter((item) => item.is_special);
      }
      if (onlyMultiHits) {
        list = list.filter((item) => (item.hits || 1) >= 2);
      }
    } else if (selectedGame === 'vietlott_655') {
      if (onlyJackpot2Ball) {
        // Trong Power 6/55, nếu target ball ở vị trí số 7 (index 6) thì là bóng Jackpot 2
        const targetNum = parseInt(formattedNumber, 10);
        list = list.filter((item) => item.result && item.result.length > 6 && item.result[6] === targetNum);
      }
    }
    return list;
  }, [sourceList, selectedYear, selectedGame, onlySpecial, onlyMultiHits, onlyJackpot2Ball, formattedNumber]);

  // Xuất file CSV
  const handleExportCSV = () => {
    if (!filteredHistory || filteredHistory.length === 0) return;
    const headers = isVietlott
      ? 'Ngày quay,Kỳ quay,Vị trí bóng,Chi tiết bộ số\n'
      : 'Ngày quay,Số nháy,Chi tiết giải thưởng,Giải Đặc Biệt\n';
    const rows = filteredHistory
      .map((item) => {
        if (isVietlott) {
          const isJp2 = item.result && item.result.length > 6 && item.result[6] === parseInt(formattedNumber, 10);
          const pos = isJp2 ? 'Bóng Đặc Biệt (Jackpot 2)' : 'Bóng Chính (Jackpot 1)';
          const resStr = item.result ? item.result.join(' - ') : '';
          return `"${item.date}","Kỳ #${item.id || ''}","${pos}","${resStr}"`;
        }
        const prizesStr = (item.prizes || []).join('; ');
        const specialStr = item.is_special ? 'Có' : 'Không';
        return `"${item.date}",${item.hits || 1},"${prizesStr}","${specialStr}"`;
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
  };

  // Sao chép tóm tắt
  const handleCopySummary = () => {
    if (!detail) return;
    const text = isVietlott
      ? `Thống kê bóng ${detail.number} (${selectedGame.toUpperCase()}): Đã về ${detail.total_hits} kỳ, lần gần nhất: ${detail.last_seen_date} (${detail.days_since_last} ngày trước), kỷ lục gan: ${detail.max_gap_historical} ngày, chu kỳ trung bình: ${detail.average_gap} ngày/lần.`
      : `Thống kê số ${detail.number} (XSMB): Đã về ${detail.total_hits} nháy, lần gần nhất: ${detail.last_seen_date} (${detail.days_since_last} ngày trước), kỷ lục gan: ${detail.max_gap_historical} ngày, chu kỳ trung bình: ${detail.average_gap} ngày/lần.`;
    navigator.clipboard.writeText(text);
    setCopiedNotice(true);
    setTimeout(() => setCopiedNotice(false), 2000);
  };

  // Xử lý tra cứu Cặp số cùng về / Xiên 2
  const handleCheckXien = async () => {
    const n1 = xienNum1.trim().padStart(2, '0');
    const n2 = xienNum2.trim().padStart(2, '0');
    if (n1 === n2) return;

    setXienLoading(true);
    try {
      const folder =
        selectedGame === 'xsmb' ? 'xsmb' : selectedGame === 'vietlott_655' ? 'vietlott_655' : 'vietlott_645';
      const [res1, res2] = await Promise.all([
        fetch(`./data/history/${folder}/${n1}.json`),
        fetch(`./data/history/${folder}/${n2}.json`),
      ]);

      if (res1.ok && res2.ok) {
        const hist1: NumberAppearance[] = await res1.json();
        const hist2: NumberAppearance[] = await res2.json();

        const map1 = new Map(hist1.map((item) => [item.date, item]));
        const matches: { date: string; num1Hits: number; num2Hits: number; isSpecial1?: boolean; isSpecial2?: boolean }[] = [];

        for (const item2 of hist2) {
          if (map1.has(item2.date)) {
            const item1 = map1.get(item2.date)!;
            const n1Int = parseInt(n1, 10);
            const n2Int = parseInt(n2, 10);
            const isSp1 = item1.result && item1.result.length > 6 && item1.result[6] === n1Int;
            const isSp2 = item2.result && item2.result.length > 6 && item2.result[6] === n2Int;

            matches.push({
              date: item2.date,
              num1Hits: item1.hits || 1,
              num2Hits: item2.hits || 1,
              isSpecial1: isSp1,
              isSpecial2: isSp2,
            });
          }
        }
        setXienMatches(matches);
      }
    } catch (err) {
      console.error('Lỗi tra cứu cặp số:', err);
    } finally {
      setXienLoading(false);
    }
  };

  // Đồng bộ Text Input và Ball Picker của Tab 3
  const handleToggleComboBall = (num: number) => {
    let updated: number[];
    if (comboBalls.includes(num)) {
      if (comboBalls.length <= 2) return; // Giữ tối thiểu 2 số
      updated = comboBalls.filter((n) => n !== num);
    } else {
      if (comboBalls.length >= 18) return; // Tối đa bao 18
      updated = [...comboBalls, num].sort((a, b) => a - b);
    }
    setComboBalls(updated);
    setComboInputText(updated.map((n) => n.toString().padStart(2, '0')).join(', '));
  };

  const handleApplyComboInput = () => {
    const tokens = comboInputText.trim().split(/[\s,;.-]+/).filter(Boolean);
    const parsed = tokens
      .map((t) => parseInt(t, 10))
      .filter((n) => !isNaN(n) && n >= minNumber && n <= maxNumber);
    const unique = Array.from(new Set(parsed)).sort((a, b) => a - b);
    if (unique.length >= 2) {
      const limited = unique.slice(0, 18);
      setComboBalls(limited);
      setComboInputText(limited.map((n) => n.toString().padStart(2, '0')).join(', '));
    }
  };

  // Chọn nhanh tổ hợp
  const handleRandomCombo = () => {
    const nums: number[] = [];
    while (nums.length < 6) {
      const r = Math.floor(Math.random() * (maxNumber - minNumber + 1)) + minNumber;
      if (!nums.includes(r)) nums.push(r);
    }
    nums.sort((a, b) => a - b);
    setComboBalls(nums);
    setComboInputText(nums.map((n) => n.toString().padStart(2, '0')).join(', '));
  };

  // Chuyển nhanh từ Single Search sang Combination khi phát hiện chuỗi số
  const handleSwitchToComboFromInput = () => {
    if (detectedMultiNumbers.length >= 2) {
      setComboBalls(detectedMultiNumbers.sort((a, b) => a - b));
      setComboInputText(detectedMultiNumbers.map((n) => n.toString().padStart(2, '0')).join(', '));
      setActiveTabMode('combination');
    }
  };

  // TÍNH TOÁN SO KHỚP TỔ HỢP / VÉ BAO (Tab 3)
  const comboHistoricalDraws: VietlottHistoricalDraw[] = useMemo(() => {
    if (!fullDrawsData) return [];
    if (selectedGame === 'vietlott_655') return fullDrawsData.vietlott_655 || [];
    if (selectedGame === 'vietlott_645') return fullDrawsData.vietlott_645 || [];
    return [];
  }, [fullDrawsData, selectedGame]);

  const comboEvaluationResults = useMemo(() => {
    if (comboHistoricalDraws.length === 0 || comboBalls.length < 2) {
      return {
        jackpot1Count: 0,
        jackpot2Count: 0,
        prize1Count: 0,
        prize2Count: 0,
        prize3Count: 0,
        totalWinningDraws: 0,
        matchingDraws: [] as {
          draw: VietlottHistoricalDraw;
          matchedMain: number[];
          matchedSpecial: boolean;
          prizeTitle: string;
          prizeBadge: string;
        }[],
      };
    }

    const selectedSet = new Set(comboBalls);
    let jp1 = 0;
    let jp2 = 0;
    let p1 = 0;
    let p2 = 0;
    let p3 = 0;
    const matches: {
      draw: VietlottHistoricalDraw;
      matchedMain: number[];
      matchedSpecial: boolean;
      prizeTitle: string;
      prizeBadge: string;
    }[] = [];

    for (const draw of comboHistoricalDraws) {
      const matchedMain = draw.balls.filter((b) => selectedSet.has(b));
      const matchedSpecial = Boolean(draw.special && selectedSet.has(draw.special));
      const mainCount = matchedMain.length;

      let prizeTitle = '';
      let prizeBadge = '';

      if (selectedGame === 'vietlott_655') {
        if (mainCount >= 6) {
          jp1++;
          prizeTitle = 'Jackpot 1 (Trúng 6/6 số)';
          prizeBadge = 'badge-gold';
        } else if (mainCount === 5 && matchedSpecial) {
          jp2++;
          prizeTitle = 'Jackpot 2 (Trúng 5 số + Bóng Đặc Biệt)';
          prizeBadge = 'badge-hot';
        } else if (mainCount === 5) {
          p1++;
          prizeTitle = 'Giải Nhất (Trúng 5/6 số)';
          prizeBadge = 'badge-normal';
        } else if (mainCount === 4) {
          p2++;
          prizeTitle = 'Giải Nhì (Trúng 4/6 số)';
          prizeBadge = 'badge-cyan';
        } else if (mainCount === 3) {
          p3++;
          prizeTitle = 'Giải Ba (Trúng 3/6 số)';
          prizeBadge = 'badge-slate';
        }
      } else if (selectedGame === 'vietlott_645') {
        if (mainCount >= 6) {
          jp1++;
          prizeTitle = 'Jackpot (Trúng 6/6 số)';
          prizeBadge = 'badge-gold';
        } else if (mainCount === 5) {
          p1++;
          prizeTitle = 'Giải Nhất (Trúng 5/6 số)';
          prizeBadge = 'badge-normal';
        } else if (mainCount === 4) {
          p2++;
          prizeTitle = 'Giải Nhì (Trúng 4/6 số)';
          prizeBadge = 'badge-cyan';
        } else if (mainCount === 3) {
          p3++;
          prizeTitle = 'Giải Ba (Trúng 3/6 số)';
          prizeBadge = 'badge-slate';
        }
      }

      const totalMatched = mainCount + (matchedSpecial ? 1 : 0);
      if (totalMatched >= minMatchFilter) {
        matches.push({
          draw,
          matchedMain,
          matchedSpecial,
          prizeTitle: prizeTitle || `Trùng ${totalMatched} số`,
          prizeBadge: prizeBadge || 'badge-slate',
        });
      }
    }

    return {
      jackpot1Count: jp1,
      jackpot2Count: jp2,
      prize1Count: p1,
      prize2Count: p2,
      prize3Count: p3,
      totalWinningDraws: jp1 + jp2 + p1 + p2 + p3,
      matchingDraws: matches,
    };
  }, [comboHistoricalDraws, comboBalls, selectedGame, minMatchFilter]);

  if (!isOpen) return null;

  const quickPicks =
    selectedGame === 'xsmb'
      ? ['68', '86', '79', '39', '18', '51', '04', '99']
      : selectedGame === 'vietlott_655'
      ? ['07', '18', '24', '35', '41', '13', '02', '55']
      : ['07', '18', '24', '35', '41', '13', '02', '45'];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        backgroundColor: 'rgba(3, 7, 18, 0.88)',
        backdropFilter: 'blur(14px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        className="glass-card animate-fade-in"
        style={{
          width: '100%',
          maxWidth: 960,
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          border: '1px solid rgba(245, 158, 11, 0.4)',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.9), 0 0 45px -5px rgba(245, 158, 11, 0.25)',
        }}
      >
        {/* Header Modal */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(15, 23, 42, 0.96)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="lottery-ball ball-gold" style={{ width: 38, height: 38, fontSize: '1rem' }}>
              <Search size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff' }}>
                Trung Tâm Tra Cứu Lịch Sử & Kiểm Tra Kết Quả
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Tra cứu xem số hoặc bộ vé đã từng về bao giờ chưa, tỷ lệ nổ Jackpot, chu kỳ gan & lịch sử chi tiết (Phím tắt: <kbd style={{ padding: '2px 5px', background: 'rgba(255,255,255,0.1)', borderRadius: 3, border: '1px solid var(--border-subtle)' }}>Esc</kbd>)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: 6,
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* 3 Tabs Chuyển Đổi Chế Độ */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--border-subtle)',
            background: 'rgba(15, 23, 42, 0.75)',
            padding: '8px 24px',
            gap: 10,
            flexWrap: 'wrap',
          }}
        >
          <button
            className={`tab-btn ${activeTabMode === 'single' ? 'active' : ''}`}
            onClick={() => setActiveTabMode('single')}
            style={{ fontSize: '0.85rem' }}
          >
            <Search size={15} />
            <span>
              {selectedGame === 'xsmb'
                ? 'Tra Cứu Đơn Số (00 - 99)'
                : selectedGame === 'vietlott_655'
                ? 'Tra Cứu Đơn Bóng (01 - 55)'
                : 'Tra Cứu Đơn Bóng (01 - 45)'}
            </span>
          </button>

          <button
            className={`tab-btn ${activeTabMode === 'combination' ? 'active' : ''}`}
            onClick={() => setActiveTabMode('combination')}
            style={{ fontSize: '0.85rem' }}
          >
            <Trophy size={15} />
            <span>Tra Cứu Bộ Số & Vé Bao (2 - 18 Số)</span>
          </button>

          <button
            className={`tab-btn ${activeTabMode === 'xien' ? 'active' : ''}`}
            onClick={() => {
              setActiveTabMode('xien');
              if (!xienMatches) handleCheckXien();
            }}
            style={{ fontSize: '0.85rem' }}
          >
            <Layers size={15} />
            <span>{isVietlott ? 'Cặp Số Cùng Về (Pairs)' : 'Cặp Lô Xiên 2'}</span>
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: 24, overflowY: 'auto', flex: 1 }}>
          {/* ===================== TAB 1: TRA CỨU ĐƠN SỐ ===================== */}
          {activeTabMode === 'single' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Chọn trò chơi (3 game) & Input Search */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button
                    className={`tab-btn ${selectedGame === 'xsmb' ? 'active' : ''}`}
                    style={{ flex: 1, minWidth: 140, justifyContent: 'center' }}
                    onClick={() => setSelectedGame('xsmb')}
                  >
                    XSMB (00 - 99)
                  </button>
                  <button
                    className={`tab-btn ${selectedGame === 'vietlott_655' ? 'active' : ''}`}
                    style={{ flex: 1, minWidth: 160, justifyContent: 'center' }}
                    onClick={() => setSelectedGame('vietlott_655')}
                  >
                    Vietlott Power 6/55 (01 - 55)
                  </button>
                  <button
                    className={`tab-btn ${selectedGame === 'vietlott_645' ? 'active' : ''}`}
                    style={{ flex: 1, minWidth: 160, justifyContent: 'center' }}
                    onClick={() => setSelectedGame('vietlott_645')}
                  >
                    Vietlott Mega 6/45 (01 - 45)
                  </button>
                </div>

                <div style={{ position: 'relative' }}>
                  <Search
                    size={22}
                    style={{
                      position: 'absolute',
                      left: 16,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--accent-gold)',
                    }}
                  />
                  <input
                    type="text"
                    placeholder={
                      selectedGame === 'xsmb'
                        ? 'Nhập số loto cần tra cứu (ví dụ: 68, 51, 99)...'
                        : selectedGame === 'vietlott_655'
                        ? 'Nhập số bóng Power (01 - 55)...'
                        : 'Nhập số bóng Mega (01 - 45)...'
                    }
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                    style={{
                      width: '100%',
                      padding: '14px 16px 14px 50px',
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(30, 41, 59, 0.7)',
                      border: '1px solid rgba(245, 158, 11, 0.4)',
                      color: '#ffffff',
                      fontSize: '1.1rem',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 600,
                      outline: 'none',
                      boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)',
                    }}
                  />
                </div>

                {/* Banner gợi ý thông minh nếu người dùng nhập nhiều số */}
                {detectedMultiNumbers.length >= 2 && (
                  <div
                    style={{
                      background: 'rgba(245, 158, 11, 0.12)',
                      border: '1px solid rgba(245, 158, 11, 0.4)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '10px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 10,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Sparkles size={16} color="var(--accent-gold)" />
                      <span style={{ fontSize: '0.85rem', color: '#ffffff' }}>
                        Phát hiện bạn đang nhập bộ số gồm <strong>{detectedMultiNumbers.length} số</strong> ({detectedMultiNumbers.map((n) => n.toString().padStart(2, '0')).join(', ')}).
                      </span>
                    </div>
                    <button
                      onClick={handleSwitchToComboFromInput}
                      style={{
                        padding: '6px 14px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--accent-gold)',
                        color: '#000000',
                        border: 'none',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <span>Tra Cứu Bộ Số Ngay</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                )}

                {/* Gợi ý số nhanh */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Gợi ý nhanh:</span>
                  {quickPicks.map((num) => (
                    <button
                      key={num}
                      onClick={() => setSearchQuery(num)}
                      style={{
                        padding: '3px 10px',
                        borderRadius: '9999px',
                        background: searchQuery === num ? 'var(--accent-gold)' : 'rgba(255, 255, 255, 0.05)',
                        color: searchQuery === num ? '#000000' : 'var(--text-main)',
                        border: '1px solid var(--border-subtle)',
                        fontSize: '0.8rem',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {/* KẾT QUẢ TRA CỨU ĐƠN SỐ */}
              {detail ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  {/* Banner câu trả lời trực diện */}
                  <div
                    style={{
                      background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.95))',
                      border: '1px solid rgba(245, 158, 11, 0.4)',
                      borderRadius: 'var(--radius-md)',
                      padding: '20px 24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 16,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div
                        className={`lottery-ball ${detail.is_gan ? 'ball-red' : 'ball-gold'}`}
                        style={{ width: 72, height: 72, fontSize: '2rem' }}
                      >
                        {detail.number}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ fontSize: '1.3rem', fontWeight: 800, color: '#ffffff' }}>
                            Số {detail.number}
                          </span>
                          <span className="badge badge-hot" style={{ fontSize: '0.78rem' }}>
                            <CheckCircle2 size={13} />
                            ĐÃ TỪNG VỀ TRONG LỊCH SỬ
                          </span>
                          {detail.is_gan && (
                            <span className="badge badge-gan" style={{ fontSize: '0.78rem' }}>
                              <AlertTriangle size={13} />
                              ĐANG GAN ({detail.days_since_last} ngày)
                            </span>
                          )}
                        </div>

                        <p style={{ fontSize: '0.92rem', color: '#e2e8f0', margin: '4px 0' }}>
                          {detail.days_since_last === 0
                            ? '🔥 ĐÃ VỀ HÔM NAY trong kỳ quay mới nhất!'
                            : detail.days_since_last === 1
                            ? '⭐ Vừa về ngày hôm qua!'
                            : `Lần gần nhất xuất hiện: ${detail.last_seen_date} (Cách đây ${detail.days_since_last} ngày)`}
                        </p>

                        {detail.first_seen_date && (
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            Lần đầu tiên có trong cơ sở dữ liệu: <strong>{detail.first_seen_date}</strong>
                          </p>
                        )}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                      <div
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--text-dim)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                        }}
                      >
                        Tổng số lần đã về
                      </div>
                      <div
                        style={{
                          fontSize: '2.1rem',
                          fontWeight: 800,
                          color: 'var(--accent-gold)',
                          fontFamily: 'var(--font-mono)',
                          lineHeight: 1,
                        }}
                      >
                        {detail.total_hits.toLocaleString()}{' '}
                        <span style={{ fontSize: '1.1rem', color: 'var(--text-muted)' }}>{gameUnit}</span>
                      </div>
                      {selectedGame === 'xsmb' && detail.special_hits !== undefined && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--accent-red)', fontWeight: 600 }}>
                          Trúng Giải Đặc Biệt (Đề): {detail.special_hits} lần
                        </div>
                      )}
                      <button
                        onClick={handleCopySummary}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '4px 8px',
                          borderRadius: 'var(--radius-sm)',
                          background: 'rgba(255,255,255,0.06)',
                          border: '1px solid var(--border-subtle)',
                          color: copiedNotice ? 'var(--accent-emerald)' : 'var(--text-dim)',
                          fontSize: '0.72rem',
                          cursor: 'pointer',
                          marginTop: 4,
                        }}
                      >
                        <Copy size={12} />
                        {copiedNotice ? 'Đã sao chép!' : 'Sao chép tóm tắt'}
                      </button>
                    </div>
                  </div>

                  {/* Grid 4 thẻ thống kê nhịp & tần suất */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
                      gap: 12,
                    }}
                  >
                    <div className="glass-card" style={{ padding: 14 }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Số ngày chưa về (Hiện tại)</div>
                      <div
                        style={{
                          fontSize: '1.4rem',
                          fontWeight: 800,
                          color: detail.is_gan ? 'var(--accent-red)' : '#ffffff',
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        {detail.days_since_last} <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>ngày</span>
                      </div>
                    </div>

                    <div className="glass-card" style={{ padding: 14 }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Kỷ lục gan lớn nhất lịch sử</div>
                      <div
                        style={{
                          fontSize: '1.4rem',
                          fontWeight: 800,
                          color: 'var(--accent-gold)',
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        {detail.max_gap_historical} <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>ngày</span>
                      </div>
                    </div>

                    <div className="glass-card" style={{ padding: 14 }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Chu kỳ nhịp trung bình</div>
                      <div
                        style={{
                          fontSize: '1.4rem',
                          fontWeight: 800,
                          color: 'var(--accent-cyan)',
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        {detail.average_gap} <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>ngày/lần</span>
                      </div>
                    </div>

                    <div className="glass-card" style={{ padding: 14 }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Tần suất 30 ngày qua</div>
                      <div
                        style={{
                          fontSize: '1.4rem',
                          fontWeight: 800,
                          color: 'var(--accent-emerald)',
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        {detail.freq_30d} <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>{gameUnit}</span>
                      </div>
                    </div>
                  </div>

                  {/* Biểu đồ phân bố xuất hiện theo năm (Yearly Distribution) */}
                  {detail.yearly_distribution && Object.keys(detail.yearly_distribution).length > 0 && (
                    <div className="glass-card" style={{ padding: 16 }}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: 12,
                        }}
                      >
                        <span
                          style={{
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                          }}
                        >
                          <BarChart2 size={16} color="var(--accent-cyan)" />
                          Phân Bố Số Lần Về Theo Từng Năm (Click vào năm để lọc)
                        </span>
                        {selectedYear !== 'all' && (
                          <button
                            onClick={() => setSelectedYear('all')}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--accent-gold)',
                              fontSize: '0.75rem',
                              cursor: 'pointer',
                              textDecoration: 'underline',
                            }}
                          >
                            Xóa lọc (Hiện tất cả)
                          </button>
                        )}
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'flex-end',
                          gap: 6,
                          height: 75,
                          paddingTop: 10,
                          overflowX: 'auto',
                        }}
                      >
                        {Object.entries(detail.yearly_distribution).map(([yr, count]) => {
                          const maxCount = Math.max(...Object.values(detail.yearly_distribution || {}));
                          const heightPct = Math.max(15, Math.round((count / (maxCount || 1)) * 100));
                          const isSelected = selectedYear === yr;
                          return (
                            <div
                              key={yr}
                              onClick={async () => {
                                setSelectedYear(isSelected ? 'all' : yr);
                                if (!loadedFullList) await loadFullHistory(detail.number);
                              }}
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: 4,
                                flex: '1 0 28px',
                                cursor: 'pointer',
                              }}
                            >
                              <span style={{ fontSize: '0.65rem', color: 'var(--accent-gold)', fontWeight: 700 }}>
                                {count}
                              </span>
                              <div
                                style={{
                                  width: '100%',
                                  height: `${heightPct}%`,
                                  background: isSelected
                                    ? 'var(--accent-gold)'
                                    : 'linear-gradient(180deg, rgba(56, 189, 248, 0.8), rgba(59, 130, 246, 0.4))',
                                  borderRadius: '3px 3px 0 0',
                                  transition: 'height 0.3s ease',
                                }}
                              />
                              <span
                                style={{
                                  fontSize: '0.65rem',
                                  color: isSelected ? 'var(--accent-gold)' : 'var(--text-dim)',
                                  fontWeight: isSelected ? 800 : 500,
                                }}
                              >
                                {yr.slice(2)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Cặp số hay về cùng */}
                  {detail.top_pairs && detail.top_pairs.length > 0 && (
                    <div className="glass-card" style={{ padding: 16 }}>
                      <div
                        style={{
                          fontSize: '0.85rem',
                          fontWeight: 700,
                          marginBottom: 10,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <Layers size={16} color="var(--accent-cyan)" />
                        Cặp số hay về cùng {detail.number} nhất (Thống kê 1 năm qua)
                      </div>
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        {detail.top_pairs.map((p) => (
                          <div
                            key={p.number}
                            onClick={() => setSearchQuery(p.number)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              padding: '6px 12px',
                              borderRadius: 'var(--radius-sm)',
                              background: 'rgba(255,255,255,0.04)',
                              border: '1px solid var(--border-subtle)',
                              cursor: 'pointer',
                            }}
                          >
                            <span
                              className="lottery-ball ball-slate"
                              style={{ width: 26, height: 26, fontSize: '0.8rem' }}
                            >
                              {p.number}
                            </span>
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                              cùng về <strong style={{ color: 'var(--accent-gold)' }}>{p.co_count}</strong> {gameUnit}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* DÒNG THỜI GIAN TOÀN BỘ CÁC LẦN XUẤT HIỆN */}
                  <div className="glass-card" style={{ padding: 18 }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 10,
                        marginBottom: 14,
                      }}
                    >
                      <div
                        style={{
                          fontSize: '0.9rem',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <Calendar size={17} color="var(--accent-emerald)" />
                        <span>
                          Dòng Thời Gian Xuất Hiện (
                          {loadedFullList
                            ? `Toàn bộ ${filteredHistory.length}/${detail.total_hits} ${gameUnit}`
                            : `Đang xem ${filteredHistory.length} ${gameUnit} gần nhất`}
                          )
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {/* Nút Xuất CSV */}
                        <button
                          onClick={handleExportCSV}
                          title="Tải về file CSV để xem trên Excel"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 5,
                            padding: '6px 12px',
                            borderRadius: 'var(--radius-sm)',
                            background: 'rgba(16, 185, 129, 0.15)',
                            border: '1px solid var(--accent-emerald)',
                            color: 'var(--accent-emerald)',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          <Download size={13} />
                          <span>Xuất CSV</span>
                        </button>

                        {/* Nút tải full lịch sử nếu chưa tải */}
                        {!loadedFullList && (
                          <button
                            onClick={() => loadFullHistory(detail.number)}
                            disabled={loadingFullHistory}
                            style={{
                              padding: '6px 12px',
                              borderRadius: 'var(--radius-sm)',
                              background: 'rgba(56, 189, 248, 0.15)',
                              border: '1px solid var(--accent-cyan)',
                              color: 'var(--accent-cyan)',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            {loadingFullHistory
                              ? 'Đang tải...'
                              : `⚡ Tải Toàn Bộ Lịch Sử (${detail.total_hits} ${gameUnit})`}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Bộ lọc Năm & Tùy chọn game-aware */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        flexWrap: 'wrap',
                        marginBottom: 12,
                        padding: '10px 12px',
                        background: 'rgba(255, 255, 255, 0.02)',
                        borderRadius: 'var(--radius-sm)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Filter size={14} color="var(--text-dim)" />
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Năm:</span>
                        <select
                          value={selectedYear}
                          onChange={async (e) => {
                            const yr = e.target.value;
                            setSelectedYear(yr);
                            if (yr !== 'all' && !loadedFullList) {
                              await loadFullHistory(detail.number);
                            }
                          }}
                          style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            background: 'rgba(30, 41, 59, 0.8)',
                            color: '#ffffff',
                            border: '1px solid var(--border-subtle)',
                            fontSize: '0.8rem',
                            outline: 'none',
                          }}
                        >
                          <option value="all">
                            Tất cả ({validYears[validYears.length - 1]} - 2026)
                          </option>
                          {validYears
                            .filter((y) => y !== 'all')
                            .map((y) => (
                              <option key={y} value={y}>
                                Năm {y}
                              </option>
                            ))}
                        </select>
                      </div>

                      {/* Bộ lọc riêng của XSMB */}
                      {selectedGame === 'xsmb' && (
                        <>
                          <label
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                              fontSize: '0.78rem',
                              color: onlySpecial ? 'var(--accent-red)' : 'var(--text-muted)',
                              cursor: 'pointer',
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={onlySpecial}
                              onChange={(e) => setOnlySpecial(e.target.checked)}
                            />
                            Chỉ hiện Giải Đặc Biệt (Đề)
                          </label>

                          <label
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                              fontSize: '0.78rem',
                              color: onlyMultiHits ? 'var(--accent-gold)' : 'var(--text-muted)',
                              cursor: 'pointer',
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={onlyMultiHits}
                              onChange={(e) => setOnlyMultiHits(e.target.checked)}
                            />
                            Chỉ hiện về ≥ 2 nháy
                          </label>
                        </>
                      )}

                      {/* Bộ lọc riêng của Vietlott Power 6/55 */}
                      {selectedGame === 'vietlott_655' && (
                        <label
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            fontSize: '0.78rem',
                            color: onlyJackpot2Ball ? 'var(--accent-gold)' : 'var(--text-muted)',
                            cursor: 'pointer',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={onlyJackpot2Ball}
                            onChange={(e) => setOnlyJackpot2Ball(e.target.checked)}
                          />
                          ★ Chỉ hiện khi là Bóng Đặc Biệt (Jackpot 2)
                        </label>
                      )}
                    </div>

                    {/* Bảng danh sách các ngày đã về */}
                    <div style={{ maxHeight: 280, overflowY: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                        <thead>
                          <tr
                            style={{
                              borderBottom: '1px solid var(--border-subtle)',
                              color: 'var(--text-dim)',
                              textAlign: 'left',
                            }}
                          >
                            <th style={{ padding: '8px 10px' }}>Ngày quay</th>
                            <th style={{ padding: '8px 10px' }}>
                              {isVietlott ? 'Vị trí bóng' : 'Số nháy'}
                            </th>
                            <th style={{ padding: '8px 10px' }}>
                              {isVietlott ? 'Toàn bộ bộ số kỳ quay' : 'Chi tiết giải trúng'}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredHistory.length > 0 ? (
                            filteredHistory.map((hist, idx) => {
                              const targetNum = parseInt(formattedNumber, 10);
                              const isJp2Ball =
                                isVietlott &&
                                selectedGame === 'vietlott_655' &&
                                hist.result &&
                                hist.result.length > 6 &&
                                hist.result[6] === targetNum;

                              return (
                                <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                  <td style={{ padding: '8px 10px', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                                    {hist.date}
                                  </td>
                                  <td style={{ padding: '8px 10px' }}>
                                    {isVietlott ? (
                                      isJp2Ball ? (
                                        <span
                                          className="badge badge-hot"
                                          style={{
                                            fontSize: '0.72rem',
                                            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                                            color: '#000000',
                                            fontWeight: 800,
                                          }}
                                        >
                                          ★ BÓNG ĐẶC BIỆT (JP2)
                                        </span>
                                      ) : (
                                        <span className="badge badge-normal" style={{ fontSize: '0.72rem' }}>
                                          🎯 Bóng chính (JP1)
                                        </span>
                                      )
                                    ) : (
                                      <span className="badge badge-hot" style={{ fontSize: '0.72rem' }}>
                                        {hist.hits || 1} nháy
                                      </span>
                                    )}
                                  </td>
                                  <td style={{ padding: '8px 10px' }}>
                                    {isVietlott && hist.result ? (
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                        {hist.id && (
                                          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginRight: 4 }}>
                                            Kỳ #{hist.id}:
                                          </span>
                                        )}
                                        {hist.result.slice(0, 6).map((b, bIdx) => (
                                          <span
                                            key={bIdx}
                                            style={{
                                              display: 'inline-flex',
                                              alignItems: 'center',
                                              justifyContent: 'center',
                                              width: 24,
                                              height: 24,
                                              borderRadius: '50%',
                                              background: b === targetNum ? 'var(--accent-gold)' : 'rgba(255,255,255,0.08)',
                                              color: b === targetNum ? '#000000' : '#ffffff',
                                              fontSize: '0.72rem',
                                              fontFamily: 'var(--font-mono)',
                                              fontWeight: 700,
                                            }}
                                          >
                                            {b.toString().padStart(2, '0')}
                                          </span>
                                        ))}
                                        {hist.result.length > 6 && (
                                          <>
                                            <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>+</span>
                                            <span
                                              style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                width: 24,
                                                height: 24,
                                                borderRadius: '50%',
                                                background: hist.result[6] === targetNum ? 'var(--accent-red)' : 'rgba(239, 68, 68, 0.25)',
                                                color: '#ffffff',
                                                border: '1px solid var(--accent-red)',
                                                fontSize: '0.72rem',
                                                fontFamily: 'var(--font-mono)',
                                                fontWeight: 800,
                                              }}
                                              title="Bóng đặc biệt Jackpot 2"
                                            >
                                              {hist.result[6].toString().padStart(2, '0')}
                                            </span>
                                          </>
                                        )}
                                      </div>
                                    ) : (
                                      <div style={{ color: hist.is_special ? 'var(--accent-red)' : 'var(--text-muted)' }}>
                                        {hist.is_special && '★ GIẢI ĐẶC BIỆT (ĐỀ) • '}
                                        {hist.prizes ? hist.prizes.join(', ') : 'Trúng thưởng'}
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              );
                            })
                          ) : (
                            <tr>
                              <td colSpan={3} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-dim)' }}>
                                Không có lần xuất hiện nào khớp với bộ lọc.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : searchQuery ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-dim)' }}>
                  <p style={{ fontSize: '1.1rem', marginBottom: 8 }}>Không tìm thấy dữ liệu cho số "{searchQuery}"</p>
                  <p style={{ fontSize: '0.85rem' }}>Vui lòng nhập một số hợp lệ từ {minNumber.toString().padStart(2, '0')} đến {maxNumber}.</p>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-dim)' }}>
                  <Search size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
                  <p style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>
                    Nhập số bất kỳ ở ô trên để tra cứu ngay lịch sử và chu kỳ gan!
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ===================== TAB 2: TRA CỨU BỘ SỐ & VÉ BAO (2 - 18 SỐ) ===================== */}
          {activeTabMode === 'combination' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Chọn trò chơi Vietlott */}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button
                  className={`tab-btn ${selectedGame === 'vietlott_655' ? 'active' : ''}`}
                  style={{ flex: 1, minWidth: 160, justifyContent: 'center' }}
                  onClick={() => setSelectedGame('vietlott_655')}
                >
                  Vietlott Power 6/55
                </button>
                <button
                  className={`tab-btn ${selectedGame === 'vietlott_645' ? 'active' : ''}`}
                  style={{ flex: 1, minWidth: 160, justifyContent: 'center' }}
                  onClick={() => setSelectedGame('vietlott_645')}
                >
                  Vietlott Mega 6/45
                </button>
              </div>

              {/* Hộp chọn bóng & nhập nhanh */}
              <div
                style={{
                  background: 'rgba(30, 41, 59, 0.5)',
                  padding: 18,
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#ffffff' }}>
                      Bộ Số Đang Chọn: {comboBalls.length} Số{' '}
                      <span style={{ fontSize: '0.8rem', color: 'var(--accent-gold)' }}>
                        {comboBalls.length === 6
                          ? '(Vé đơn 6 số chuẩn)'
                          : comboBalls.length > 6
                          ? `(Vé Bao ${comboBalls.length})`
                          : `(Tổ hợp ${comboBalls.length} số)`}
                      </span>
                    </h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Chọn từ 2 đến 18 số để kiểm tra xem đã từng trúng Jackpot 1, Jackpot 2, Giải Nhất/Nhì/Ba nào trong lịch sử 1.400+ kỳ quay!
                    </p>
                  </div>

                  {/* Các nút preset */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <button
                      onClick={handleRandomCombo}
                      style={{
                        padding: '5px 12px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--text-main)',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                      }}
                    >
                      <RefreshCw size={12} />
                      Random 6 số
                    </button>

                    {cooccurrenceData && (
                      <button
                        onClick={() => {
                          const topP = cooccurrenceData[selectedGame as 'vietlott_655' | 'vietlott_645']?.top_pairs?.[0];
                          if (topP) {
                            const nums = topP.numbers.map((n) => parseInt(n, 10));
                            setComboBalls(nums);
                            setComboInputText(nums.map((n) => n.toString().padStart(2, '0')).join(', '));
                          }
                        }}
                        style={{
                          padding: '5px 12px',
                          borderRadius: 'var(--radius-sm)',
                          background: 'rgba(56, 189, 248, 0.15)',
                          border: '1px solid var(--accent-cyan)',
                          color: 'var(--accent-cyan)',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Nạp Cặp Hot #1
                      </button>
                    )}

                    <button
                      onClick={() => setShowBallPickerGrid((prev) => !prev)}
                      style={{
                        padding: '5px 12px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'rgba(245, 158, 11, 0.15)',
                        border: '1px solid var(--accent-gold)',
                        color: 'var(--accent-gold)',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      {showBallPickerGrid ? 'Thu gọn bàn bóng' : 'Mở bàn bóng'}
                    </button>
                  </div>
                </div>

                {/* Các bóng đang chọn hiển thị to rõ */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  {comboBalls.map((b) => (
                    <div
                      key={b}
                      onClick={() => handleToggleComboBall(b)}
                      title="Click để bỏ bóng này"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                        color: '#000000',
                        fontSize: '1rem',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 800,
                        boxShadow: '0 4px 10px rgba(245, 158, 11, 0.4)',
                        cursor: 'pointer',
                      }}
                    >
                      {b.toString().padStart(2, '0')}
                    </div>
                  ))}
                </div>

                {/* Ô nhập thủ công bằng chuỗi */}
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    type="text"
                    value={comboInputText}
                    onChange={(e) => setComboInputText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleApplyComboInput();
                    }}
                    placeholder="Nhập hoặc dán danh sách số (cách nhau bởi dấu phẩy hoặc khoảng trắng)..."
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid var(--border-subtle)',
                      color: '#ffffff',
                      fontSize: '0.9rem',
                      fontFamily: 'var(--font-mono)',
                    }}
                  />
                  <button
                    onClick={handleApplyComboInput}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--accent-gold)',
                      color: '#000000',
                      border: 'none',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Áp Dụng
                  </button>
                </div>

                {/* Bàn chọn bóng thu nhỏ (Ball Picker Grid) */}
                {showBallPickerGrid && (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(36px, 1fr))',
                      gap: 6,
                      background: 'rgba(15, 23, 42, 0.6)',
                      padding: 12,
                      borderRadius: 'var(--radius-sm)',
                      maxHeight: 180,
                      overflowY: 'auto',
                    }}
                  >
                    {Array.from({ length: maxNumber }, (_, i) => i + 1).map((n) => {
                      const isSelected = comboBalls.includes(n);
                      return (
                        <button
                          key={n}
                          onClick={() => handleToggleComboBall(n)}
                          style={{
                            height: 36,
                            borderRadius: '50%',
                            background: isSelected ? 'var(--accent-gold)' : 'rgba(255,255,255,0.06)',
                            color: isSelected ? '#000000' : 'var(--text-muted)',
                            border: isSelected ? '1px solid #ffffff' : '1px solid var(--border-subtle)',
                            fontWeight: isSelected ? 800 : 500,
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                          }}
                        >
                          {n.toString().padStart(2, '0')}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* BẢNG KẾT QUẢ SO KHỚP TỔ HỢP */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* 5 Thẻ tóm tắt số lần nổ các giải */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                    gap: 10,
                  }}
                >
                  <div
                    className="glass-card"
                    style={{
                      padding: 14,
                      border: comboEvaluationResults.jackpot1Count > 0 ? '1px solid var(--accent-gold)' : undefined,
                      background: comboEvaluationResults.jackpot1Count > 0 ? 'rgba(245, 158, 11, 0.15)' : undefined,
                    }}
                  >
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                      Jackpot 1 (6/6)
                    </div>
                    <div
                      style={{
                        fontSize: '1.6rem',
                        fontWeight: 800,
                        color: 'var(--accent-gold)',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      {comboEvaluationResults.jackpot1Count}{' '}
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>lần</span>
                    </div>
                  </div>

                  {selectedGame === 'vietlott_655' && (
                    <div
                      className="glass-card"
                      style={{
                        padding: 14,
                        border: comboEvaluationResults.jackpot2Count > 0 ? '1px solid var(--accent-red)' : undefined,
                        background: comboEvaluationResults.jackpot2Count > 0 ? 'rgba(239, 68, 68, 0.15)' : undefined,
                      }}
                    >
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                        Jackpot 2 (5+1)
                      </div>
                      <div
                        style={{
                          fontSize: '1.6rem',
                          fontWeight: 800,
                          color: 'var(--accent-red)',
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        {comboEvaluationResults.jackpot2Count}{' '}
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>lần</span>
                      </div>
                    </div>
                  )}

                  <div className="glass-card" style={{ padding: 14 }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                      Giải Nhất (5/6)
                    </div>
                    <div
                      style={{
                        fontSize: '1.6rem',
                        fontWeight: 800,
                        color: 'var(--accent-cyan)',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      {comboEvaluationResults.prize1Count}{' '}
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>lần</span>
                    </div>
                  </div>

                  <div className="glass-card" style={{ padding: 14 }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                      Giải Nhì (4/6)
                    </div>
                    <div
                      style={{
                        fontSize: '1.6rem',
                        fontWeight: 800,
                        color: 'var(--accent-emerald)',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      {comboEvaluationResults.prize2Count}{' '}
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>lần</span>
                    </div>
                  </div>

                  <div className="glass-card" style={{ padding: 14 }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                      Giải Ba (3/6)
                    </div>
                    <div
                      style={{
                        fontSize: '1.6rem',
                        fontWeight: 800,
                        color: '#ffffff',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      {comboEvaluationResults.prize3Count}{' '}
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>lần</span>
                    </div>
                  </div>
                </div>

                {/* Danh sách các kỳ quay trúng thưởng */}
                <div className="glass-card" style={{ padding: 18 }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 10,
                      marginBottom: 12,
                    }}
                  >
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Award size={17} color="var(--accent-gold)" />
                      <span>
                        Lịch Sử Các Kỳ Trúng Thưởng ({comboEvaluationResults.matchingDraws.length} kỳ)
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Lọc mức trúng:</span>
                      <select
                        value={minMatchFilter}
                        onChange={(e) => setMinMatchFilter(parseInt(e.target.value, 10))}
                        style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          background: 'rgba(30, 41, 59, 0.8)',
                          color: '#ffffff',
                          border: '1px solid var(--border-subtle)',
                          fontSize: '0.8rem',
                          outline: 'none',
                        }}
                      >
                        <option value={2}>Trùng từ 2 số trở lên</option>
                        <option value={3}>Trùng từ 3 số (Có giải thưởng)</option>
                        <option value={4}>Trùng từ 4 số (Giải Nhì trở lên)</option>
                        <option value={5}>Trùng từ 5 số (Giải Nhất trở lên)</option>
                        <option value={6}>Trúng Jackpot 1 (Đủ 6 số)</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ maxHeight: 260, overflowY: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                      <thead>
                        <tr
                          style={{
                            borderBottom: '1px solid var(--border-subtle)',
                            color: 'var(--text-dim)',
                            textAlign: 'left',
                          }}
                        >
                          <th style={{ padding: '8px 10px' }}>Kỳ quay & Ngày</th>
                          <th style={{ padding: '8px 10px' }}>Giải thưởng</th>
                          <th style={{ padding: '8px 10px' }}>Bộ số mở thưởng (Số trúng được tô vàng)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {comboEvaluationResults.matchingDraws.length > 0 ? (
                          comboEvaluationResults.matchingDraws.map((m, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                              <td style={{ padding: '8px 10px', fontFamily: 'var(--font-mono)' }}>
                                <strong style={{ color: '#ffffff' }}>#{m.draw.id}</strong>{' '}
                                <span style={{ color: 'var(--text-dim)', fontSize: '0.78rem' }}>({m.draw.date})</span>
                              </td>
                              <td style={{ padding: '8px 10px' }}>
                                <span className={`badge ${m.prizeBadge}`} style={{ fontSize: '0.72rem' }}>
                                  {m.prizeTitle}
                                </span>
                              </td>
                              <td style={{ padding: '8px 10px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                                  {m.draw.balls.map((b, bIdx) => {
                                    const isMatched = comboBalls.includes(b);
                                    return (
                                      <span
                                        key={bIdx}
                                        style={{
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          width: 24,
                                          height: 24,
                                          borderRadius: '50%',
                                          background: isMatched ? 'var(--accent-gold)' : 'rgba(255,255,255,0.06)',
                                          color: isMatched ? '#000000' : 'var(--text-dim)',
                                          fontSize: '0.72rem',
                                          fontFamily: 'var(--font-mono)',
                                          fontWeight: isMatched ? 800 : 500,
                                        }}
                                      >
                                        {b.toString().padStart(2, '0')}
                                      </span>
                                    );
                                  })}
                                  {m.draw.special && (
                                    <>
                                      <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>+</span>
                                      <span
                                        style={{
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          width: 24,
                                          height: 24,
                                          borderRadius: '50%',
                                          background: m.matchedSpecial ? 'var(--accent-red)' : 'rgba(239, 68, 68, 0.2)',
                                          color: '#ffffff',
                                          border: '1px solid var(--accent-red)',
                                          fontSize: '0.72rem',
                                          fontFamily: 'var(--font-mono)',
                                          fontWeight: 800,
                                        }}
                                        title="Bóng đặc biệt Jackpot 2"
                                      >
                                        {m.draw.special.toString().padStart(2, '0')}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={3} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-dim)' }}>
                              Không có kỳ quay nào trùng khớp từ {minMatchFilter} số trở lên.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===================== TAB 3: TRA CỨU CẶP SỐ CÙNG VỀ / XIÊN 2 ===================== */}
          {activeTabMode === 'xien' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Chọn trò chơi */}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button
                  className={`tab-btn ${selectedGame === 'xsmb' ? 'active' : ''}`}
                  style={{ flex: 1, minWidth: 140, justifyContent: 'center' }}
                  onClick={() => setSelectedGame('xsmb')}
                >
                  XSMB (00 - 99)
                </button>
                <button
                  className={`tab-btn ${selectedGame === 'vietlott_655' ? 'active' : ''}`}
                  style={{ flex: 1, minWidth: 160, justifyContent: 'center' }}
                  onClick={() => setSelectedGame('vietlott_655')}
                >
                  Vietlott Power 6/55
                </button>
                <button
                  className={`tab-btn ${selectedGame === 'vietlott_645' ? 'active' : ''}`}
                  style={{ flex: 1, minWidth: 160, justifyContent: 'center' }}
                  onClick={() => setSelectedGame('vietlott_645')}
                >
                  Vietlott Mega 6/45
                </button>
              </div>

              <div
                style={{
                  background: 'rgba(30, 41, 59, 0.5)',
                  padding: 18,
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: 6, color: '#ffffff' }}>
                  {isVietlott ? 'Kiểm Tra Lịch Sử Cặp Số Cùng Về (Pairs)' : 'Kiểm Tra Cặp Lô Xiên (Xiên 2)'}
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 16 }}>
                  Kiểm tra xem 2 số này đã bao giờ cùng xuất hiện trong một kỳ mở thưởng chưa, tổng cộng bao nhiêu lần và lần gần nhất là khi nào.
                </p>

                {/* Top Pairs Presets khi chọn Vietlott */}
                {isVietlott && cooccurrenceData && (
                  <div style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Gợi ý Top Cặp Hot:</span>
                    {(cooccurrenceData[selectedGame as 'vietlott_655' | 'vietlott_645']?.top_pairs || []).slice(0, 5).map((p, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setXienNum1(p.numbers[0]);
                          setXienNum2(p.numbers[1]);
                        }}
                        style={{
                          padding: '3px 8px',
                          borderRadius: 'var(--radius-sm)',
                          background: 'rgba(56, 189, 248, 0.1)',
                          border: '1px solid rgba(56, 189, 248, 0.3)',
                          color: 'var(--accent-cyan)',
                          fontSize: '0.75rem',
                          fontFamily: 'var(--font-mono)',
                          cursor: 'pointer',
                        }}
                      >
                        {p.numbers[0]} - {p.numbers[1]} ({p.hits} {gameUnit})
                      </button>
                    ))}
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Số 1:</span>
                    <input
                      type="number"
                      value={xienNum1}
                      onChange={(e) => setXienNum1(e.target.value)}
                      style={{
                        width: 80,
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'rgba(15, 23, 42, 0.8)',
                        border: '1px solid var(--accent-gold)',
                        color: '#ffffff',
                        fontSize: '1.1rem',
                        fontWeight: 700,
                        fontFamily: 'var(--font-mono)',
                        textAlign: 'center',
                      }}
                    />
                  </div>

                  <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-gold)' }}>+</span>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Số 2:</span>
                    <input
                      type="number"
                      value={xienNum2}
                      onChange={(e) => setXienNum2(e.target.value)}
                      style={{
                        width: 80,
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'rgba(15, 23, 42, 0.8)',
                        border: '1px solid var(--accent-gold)',
                        color: '#ffffff',
                        fontSize: '1.1rem',
                        fontWeight: 700,
                        fontFamily: 'var(--font-mono)',
                        textAlign: 'center',
                      }}
                    />
                  </div>

                  <button
                    onClick={handleCheckXien}
                    disabled={xienLoading}
                    style={{
                      padding: '10px 20px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--accent-gold)',
                      color: '#000000',
                      border: 'none',
                      fontSize: '0.85rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    {xienLoading ? 'Đang phân tích...' : 'Kiểm Tra Cặp Số Ngay'}
                  </button>
                </div>
              </div>

              {/* Kết quả xiên */}
              {xienMatches !== null && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div
                    style={{
                      background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.9))',
                      border: '1px solid rgba(245, 158, 11, 0.35)',
                      borderRadius: 'var(--radius-md)',
                      padding: '20px 24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 16,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <div className="lottery-ball ball-gold" style={{ width: 48, height: 48, fontSize: '1.25rem' }}>
                          {xienNum1.padStart(2, '0')}
                        </div>
                        <div
                          className="lottery-ball ball-gold"
                          style={{ width: 48, height: 48, fontSize: '1.25rem', background: '#3b82f6' }}
                        >
                          {xienNum2.padStart(2, '0')}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff' }}>
                          Cặp {xienNum1.padStart(2, '0')} - {xienNum2.padStart(2, '0')}
                        </div>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                          {xienMatches.length > 0
                            ? `Lần gần nhất cùng về: ${xienMatches[0].date}`
                            : 'Chưa từng cùng xuất hiện trong một kỳ'}
                        </p>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                        Tổng số lần cùng về
                      </div>
                      <div
                        style={{
                          fontSize: '1.8rem',
                          fontWeight: 800,
                          color: 'var(--accent-gold)',
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        {xienMatches.length} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>{gameUnit}</span>
                      </div>
                    </div>
                  </div>

                  {/* Bảng các ngày cùng nổ */}
                  <div className="glass-card" style={{ padding: 16 }}>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, marginBottom: 12 }}>
                      Danh Sách Các Ngày Cả 2 Số Cùng Xuất Hiện ({xienMatches.length} {gameUnit})
                    </div>
                    <div style={{ maxHeight: 240, overflowY: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                        <thead>
                          <tr
                            style={{
                              borderBottom: '1px solid var(--border-subtle)',
                              color: 'var(--text-dim)',
                              textAlign: 'left',
                            }}
                          >
                            <th style={{ padding: '8px 10px' }}>Ngày quay</th>
                            <th style={{ padding: '8px 10px' }}>Số {xienNum1}</th>
                            <th style={{ padding: '8px 10px' }}>Số {xienNum2}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {xienMatches.map((m, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                              <td style={{ padding: '8px 10px', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                                {m.date}
                              </td>
                              <td style={{ padding: '8px 10px' }}>
                                {isVietlott ? (
                                  m.isSpecial1 ? (
                                    <span className="badge badge-hot" style={{ fontSize: '0.72rem' }}>
                                      ★ Bóng JP2
                                    </span>
                                  ) : (
                                    <span className="badge badge-normal" style={{ fontSize: '0.72rem' }}>
                                      🎯 Bóng chính
                                    </span>
                                  )
                                ) : (
                                  <span className="badge badge-hot" style={{ fontSize: '0.72rem' }}>
                                    {m.num1Hits} nháy
                                  </span>
                                )}
                              </td>
                              <td style={{ padding: '8px 10px' }}>
                                {isVietlott ? (
                                  m.isSpecial2 ? (
                                    <span className="badge badge-hot" style={{ fontSize: '0.72rem' }}>
                                      ★ Bóng JP2
                                    </span>
                                  ) : (
                                    <span className="badge badge-normal" style={{ fontSize: '0.72rem' }}>
                                      🎯 Bóng chính
                                    </span>
                                  )
                                ) : (
                                  <span className="badge badge-normal" style={{ fontSize: '0.72rem' }}>
                                    {m.num2Hits} nháy
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
