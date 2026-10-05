import React, { useState, useMemo } from 'react';
import {
  LotteryIndexData,
  VietlottFullDrawsData,
  VietlottCooccurrenceData,
} from '../types';
import {
  CheckCircle2,
  Filter,
  Copy,
  Check,
  Sparkles,
  RefreshCw,
  Layers,
  Award,
  AlertCircle,
  AlertTriangle,
  Trophy,
  Dices,
  ArrowRight,
  TrendingUp,
  Flame,
} from 'lucide-react';

export type VietlottTicketType =
  | 'single'
  | 'bao5'
  | 'bao7'
  | 'bao8'
  | 'bao9'
  | 'bao10'
  | 'bao11'
  | 'bao12'
  | 'bao13'
  | 'bao14'
  | 'bao15'
  | 'bao18';

export interface VietlottTicketSpec {
  type: VietlottTicketType;
  label: string;
  size: number;
  subTickets: number;
  cost: number;
}

export interface GeneratedVietlottTicket {
  id: number;
  balls: number[];
  sum: number;
  evenCount: number;
  lowCount: number;
  ticketTypeLabel: string;
  ticketSize: number;
  subTickets: number;
  cost: number;
}

export function calcCombinations(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  if (k === 0 || k === n) return 1;
  let c = 1;
  for (let i = 1; i <= k; i++) {
    c = (c * (n - (k - i))) / i;
  }
  return Math.round(c);
}

export function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(amount);
}

export function getVietlottTicketSpec(product: '655' | '645', type: VietlottTicketType): VietlottTicketSpec {
  const maxBall = product === '655' ? 55 : 45;
  if (type === 'single') {
    return { type, label: 'Vé Đơn (6 Số)', size: 6, subTickets: 1, cost: 10_000 };
  }
  if (type === 'bao5') {
    const subTickets = maxBall - 5;
    return { type, label: 'Bao 5 (5 Số)', size: 5, subTickets, cost: subTickets * 10_000 };
  }
  const sizeMap: Record<string, number> = {
    bao7: 7,
    bao8: 8,
    bao9: 9,
    bao10: 10,
    bao11: 11,
    bao12: 12,
    bao13: 13,
    bao14: 14,
    bao15: 15,
    bao18: 18,
  };
  const size = sizeMap[type] || 6;
  const subTickets = calcCombinations(size, 6);
  return {
    type,
    label: `Bao ${size} (${size} Số)`,
    size,
    subTickets,
    cost: subTickets * 10_000,
  };
}

export function getGaussSumRange(product: '655' | '645', size: number): { min: number; max: number; mean: number } {
  const maxBall = product === '655' ? 55 : 45;
  const mean1 = (maxBall + 1) / 2;
  const meanTotal = size * mean1;
  const var1 = (maxBall * maxBall - 1) / 12;
  const correction = (maxBall - size) / (maxBall - 1);
  const stdTotal = Math.sqrt(size * var1 * Math.max(0.1, correction));
  const min = Math.max(Math.round((size * (size + 1)) / 2), Math.round(meanTotal - 1.35 * stdTotal));
  const max = Math.min(Math.round(size * maxBall - (size * (size - 1)) / 2), Math.round(meanTotal + 1.35 * stdTotal));
  return { min, max, mean: Math.round(meanTotal) };
}

interface SmartFilterAndCheckerProps {
  xsmbData: LotteryIndexData | null;
  vietlott655Data?: LotteryIndexData | null;
  vietlott645Data?: LotteryIndexData | null;
  fullDrawsData?: VietlottFullDrawsData | null;
  cooccurrenceData?: VietlottCooccurrenceData | null;
  onSelectNumber: (num: string) => void;
  onSwitchToVietlottCombo?: (balls: number[]) => void;
}

export const SmartFilterAndChecker: React.FC<SmartFilterAndCheckerProps> = ({
  xsmbData,
  vietlott655Data,
  vietlott645Data,
  fullDrawsData,
  cooccurrenceData,
  onSelectNumber,
  onSwitchToVietlottCombo,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'xsmb_filter' | 'vietlott_filter' | 'checker'>('vietlott_filter');

  // ==========================================
  // STATE CHO BỘ LỌC DÀN SỐ XSMB
  // ==========================================
  const [selectedChams, setSelectedChams] = useState<number[]>([]);
  const [selectedTongs, setSelectedTongs] = useState<number[]>([]);
  const [tongParity, setTongParity] = useState<'all' | 'even' | 'odd'>('all');
  const [tongSize, setTongSize] = useState<'all' | 'small' | 'large'>('all'); // small < 10, large >= 10
  const [includeKiepBang, setIncludeKiepBang] = useState<boolean>(true);
  const [excludeGanDays, setExcludeGanDays] = useState<number>(0); // 0: không loại, 10: loại gan > 10d, 15: loại gan > 15d
  const [filterCopied, setFilterCopied] = useState<boolean>(false);

  // ==========================================
  // STATE CHO TẠO DÀN & LỌC VÉ VIETLOTT
  // ==========================================
  const [vietlottProduct, setVietlottProduct] = useState<'655' | '645'>('655');
  const [vTicketType, setVTicketType] = useState<VietlottTicketType>('single');
  const [vTicketCount, setVTicketCount] = useState<number>(5);
  const [vSumRange, setVSumRange] = useState<'gauss' | 'low' | 'high' | 'all'>('gauss');
  const [vParityRatio, setVParityRatio] = useState<string>('balanced');
  const [vLowHighRatio, setVLowHighRatio] = useState<string>('balanced');
  const [vExcludeGanLimit, setVExcludeGanLimit] = useState<number>(20);
  const [vSelectedPair, setVSelectedPair] = useState<string[] | null>(null);
  const [generatedTickets, setGeneratedTickets] = useState<GeneratedVietlottTicket[]>([]);
  const [vGenerationEmpty, setVGenerationEmpty] = useState<boolean>(false);
  const [vCopiedNotice, setVCopiedNotice] = useState<boolean>(false);

  // ==========================================
  // STATE CHO TRÌNH SO VÉ HÀNG LOẠT
  // ==========================================
  const [ticketInput, setTicketInput] = useState<string>('03, 14, 28, 51, 68, 86, 89, 90');
  const [customSpecialInput, setCustomSpecialInput] = useState<string>('');

  // 1. Logic lọc dàn số XSMB
  const filteredNumbers: string[] = useMemo(() => {
    const list: string[] = [];

    for (let i = 0; i < 100; i++) {
      const str = i.toString().padStart(2, '0');
      const d1 = parseInt(str[0], 10);
      const d2 = parseInt(str[1], 10);
      const sum = (d1 + d2) % 10;
      const rawSum = d1 + d2;
      const isKiepBang = d1 === d2;

      // Lọc theo Chạm
      if (selectedChams.length > 0) {
        if (!selectedChams.includes(d1) && !selectedChams.includes(d2)) {
          continue;
        }
      }

      // Lọc theo Tổng cụ thể
      if (selectedTongs.length > 0) {
        if (!selectedTongs.includes(sum)) {
          continue;
        }
      }

      // Lọc theo Chẵn / Lẻ của Tổng
      if (tongParity === 'even' && sum % 2 !== 0) continue;
      if (tongParity === 'odd' && sum % 2 === 0) continue;

      // Lọc theo Tổng bé / lớn
      if (tongSize === 'small' && rawSum >= 10) continue;
      if (tongSize === 'large' && rawSum < 10) continue;

      // Lọc kép bằng
      if (!includeKiepBang && isKiepBang) continue;

      // Loại trừ Lô Gan
      if (excludeGanDays > 0 && xsmbData?.numbers) {
        const numDetail = xsmbData.numbers[str];
        if (numDetail && numDetail.days_since_last > excludeGanDays) {
          continue;
        }
      }

      list.push(str);
    }

    return list;
  }, [selectedChams, selectedTongs, tongParity, tongSize, includeKiepBang, excludeGanDays, xsmbData]);

  const handleCopyFiltered = () => {
    navigator.clipboard.writeText(filteredNumbers.join(', '));
    setFilterCopied(true);
    setTimeout(() => setFilterCopied(false), 2000);
  };

  const handleSendToChecker = () => {
    setTicketInput(filteredNumbers.join(', '));
    setActiveSubTab('checker');
  };

  const handleToggleCham = (c: number) => {
    setSelectedChams((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  };

  const handleToggleTong = (t: number) => {
    setSelectedTongs((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  };

  const handleResetFilter = () => {
    setSelectedChams([]);
    setSelectedTongs([]);
    setTongParity('all');
    setTongSize('all');
    setIncludeKiepBang(true);
    setExcludeGanDays(0);
  };

  // 2. Logic Sinh Dàn Vé Vietlott Thông Minh
  const maxBall = vietlottProduct === '655' ? 55 : 45;
  const midBall = vietlottProduct === '655' ? 27 : 22;
  const activeVietlottIdx = vietlottProduct === '655' ? vietlott655Data : vietlott645Data;
  const coocPairs = cooccurrenceData
    ? cooccurrenceData[vietlottProduct === '655' ? 'vietlott_655' : 'vietlott_645']?.top_pairs || []
    : [];

  const currentTicketSpec = useMemo(() => {
    return getVietlottTicketSpec(vietlottProduct, vTicketType);
  }, [vietlottProduct, vTicketType]);

  const currentGaussRange = useMemo(() => {
    return getGaussSumRange(vietlottProduct, currentTicketSpec.size);
  }, [vietlottProduct, currentTicketSpec.size]);

  const handleGenerateVietlottTickets = (
    overrideCount?: number,
    overrideType?: VietlottTicketType
  ) => {
    setVGenerationEmpty(false);
    const targetType = overrideType || vTicketType;
    const targetCount = overrideCount || vTicketCount;
    const spec = getVietlottTicketSpec(vietlottProduct, targetType);
    const ticketSize = spec.size;
    const gauss = getGaussSumRange(vietlottProduct, ticketSize);

    const ganSet = new Set<number>();
    if (vExcludeGanLimit > 0 && activeVietlottIdx?.top_gan) {
      activeVietlottIdx.top_gan.forEach((g) => {
        if (g.days_since >= vExcludeGanLimit) {
          ganSet.add(parseInt(g.number, 10));
        }
      });
    }

    const availablePool = Array.from({ length: maxBall }, (_, i) => i + 1).filter((n) => !ganSet.has(n));
    if (availablePool.length < ticketSize) {
      alert(`Số lượng bóng khả dụng sau khi lọc gan (${availablePool.length}) không đủ để tạo vé cỡ ${ticketSize}! Hãy giảm bớt giới hạn lọc số gan.`);
      return;
    }

    const tickets: GeneratedVietlottTicket[] = [];

    // Min/Max tổng điểm theo chuẩn Gauss động
    let minSum = 0;
    let maxSum = 9999;
    if (vSumRange === 'gauss') {
      minSum = gauss.min;
      maxSum = gauss.max;
    } else if (vSumRange === 'low') {
      minSum = 0;
      maxSum = gauss.min - 1;
    } else if (vSumRange === 'high') {
      minSum = gauss.max + 1;
      maxSum = 9999;
    }

    let attempts = 0;
    while (tickets.length < targetCount && attempts < 4000) {
      attempts++;
      const currentCombo: number[] = [];

      // Nếu có chọn cặp số bắt buộc
      if (vSelectedPair && vSelectedPair.length === 2) {
        const p1 = parseInt(vSelectedPair[0], 10);
        const p2 = parseInt(vSelectedPair[1], 10);
        if (p1 <= maxBall && p2 <= maxBall && !ganSet.has(p1) && !ganSet.has(p2)) {
          currentCombo.push(p1, p2);
        }
      }

      // Điền tiếp các số còn lại ngẫu nhiên từ availablePool
      const pool = availablePool.filter((n) => !currentCombo.includes(n));
      const shuffled = [...pool].sort(() => 0.5 - Math.random());

      for (const num of shuffled) {
        if (currentCombo.length >= ticketSize) break;
        currentCombo.push(num);
      }

      if (currentCombo.length !== ticketSize) continue;
      currentCombo.sort((a, b) => a - b);

      // Kiểm tra Tổng
      const sum = currentCombo.reduce((a, b) => a + b, 0);
      if (sum < minSum || sum > maxSum) continue;

      // Kiểm tra Chẵn / Lẻ
      const evenCount = currentCombo.filter((n) => n % 2 === 0).length;
      const oddCount = ticketSize - evenCount;

      if (vParityRatio === 'balanced' || vParityRatio === '3_3') {
        if (ticketSize % 2 === 0) {
          if (evenCount !== ticketSize / 2) continue;
        } else {
          const half = Math.floor(ticketSize / 2);
          if (evenCount !== half && evenCount !== half + 1) continue;
        }
      } else if (vParityRatio === 'even_heavy' || vParityRatio === '4_2') {
        if (evenCount <= oddCount) continue;
      } else if (vParityRatio === 'odd_heavy' || vParityRatio === '2_4') {
        if (oddCount <= evenCount) continue;
      }

      // Kiểm tra Nhỏ / Lớn
      const lowCount = currentCombo.filter((n) => n <= midBall).length;
      const highCount = ticketSize - lowCount;

      if (vLowHighRatio === 'balanced' || vLowHighRatio === '3_3') {
        if (ticketSize % 2 === 0) {
          if (lowCount !== ticketSize / 2) continue;
        } else {
          const half = Math.floor(ticketSize / 2);
          if (lowCount !== half && lowCount !== half + 1) continue;
        }
      } else if (vLowHighRatio === 'even_heavy' || vLowHighRatio === 'low_heavy' || vLowHighRatio === '4_2') {
        if (lowCount <= highCount) continue;
      } else if (vLowHighRatio === 'odd_heavy' || vLowHighRatio === 'high_heavy' || vLowHighRatio === '2_4') {
        if (highCount <= lowCount) continue;
      }

      // Đảm bảo không trùng vé
      const key = currentCombo.join('-');
      if (tickets.some((t) => t.balls.join('-') === key)) continue;

      tickets.push({
        id: tickets.length + 1,
        balls: currentCombo,
        sum,
        evenCount,
        lowCount,
        ticketTypeLabel: spec.label,
        ticketSize,
        subTickets: spec.subTickets,
        cost: spec.cost,
      });
    }

    setGeneratedTickets(tickets);
    if (tickets.length === 0) {
      setVGenerationEmpty(true);
    }
  };

  const handleCopyAllVietlottTickets = () => {
    if (generatedTickets.length === 0) return;
    const text = generatedTickets
      .map((t) => `Vé #${t.id} [${t.ticketTypeLabel}]: [ ${t.balls.map((b) => b.toString().padStart(2, '0')).join(' - ')} ] (Tổng ${t.sum} | ${t.subTickets} vé con | ${formatVND(t.cost)})`)
      .join('\n');
    navigator.clipboard.writeText(text);
    setVCopiedNotice(true);
    setTimeout(() => setVCopiedNotice(false), 2000);
  };

  // 3. Logic So Vé Hàng Loạt
  const parsedTickets = useMemo(() => {
    const rawTokens = ticketInput.split(/[\s,;|]+/);
    const valid = rawTokens
      .map((t) => t.trim().padStart(2, '0'))
      .filter((t) => t.length === 2 && !isNaN(Number(t)));
    return Array.from(new Set(valid));
  }, [ticketInput]);

  const latestXSMB = xsmbData?.latest_draw as any;
  const lotoResults: string[] = useMemo(() => {
    return latestXSMB?.loto_numbers || [];
  }, [latestXSMB]);

  const specialPrizeNumber = useMemo(() => {
    const p = latestXSMB?.raw_prizes?.special?.toString() || '';
    return p.length >= 2 ? p.slice(-2) : '';
  }, [latestXSMB]);

  // Phân tích kết quả so vé
  const checkerReport = useMemo(() => {
    let matchCount = 0;
    let totalHits = 0;
    let hitSpecial = false;

    const details = parsedTickets.map((num) => {
      const hits = lotoResults.filter((r) => r === num).length;
      const isSpecial = num === specialPrizeNumber;
      if (hits > 0) {
        matchCount++;
        totalHits += hits;
      }
      if (isSpecial) hitSpecial = true;
      return {
        number: num,
        hits,
        isSpecial,
        isWin: hits > 0,
      };
    });

    return {
      totalTickets: parsedTickets.length,
      matchCount,
      totalHits,
      hitSpecial,
      rate: parsedTickets.length > 0 ? Math.round((matchCount / parsedTickets.length) * 100) : 0,
      details,
    };
  }, [parsedTickets, lotoResults, specialPrizeNumber]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Navigation Switch Sub-tabs */}
      <div
        className="glass-card"
        style={{
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 14,
        }}
      >
        <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', padding: 4, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', flexWrap: 'wrap', gap: 4 }}>
          <button
            onClick={() => setActiveSubTab('vietlott_filter')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 18px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: activeSubTab === 'vietlott_filter' ? 'linear-gradient(135deg, #f59e0b, #ef4444)' : 'transparent',
              color: activeSubTab === 'vietlott_filter' ? '#ffffff' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer',
            }}
          >
            <Trophy size={16} />
            <span>Tạo Dàn & Lọc Vé Vietlott</span>
          </button>

          <button
            onClick={() => setActiveSubTab('xsmb_filter')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 18px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: activeSubTab === 'xsmb_filter' ? 'linear-gradient(135deg, #3b82f6, #06b6d4)' : 'transparent',
              color: activeSubTab === 'xsmb_filter' ? '#ffffff' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer',
            }}
          >
            <Filter size={16} />
            <span>Lọc Dàn XSMB (Đề & Lô)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('checker')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 18px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: activeSubTab === 'checker' ? 'linear-gradient(135deg, #10b981, #06b6d4)' : 'transparent',
              color: activeSubTab === 'checker' ? '#ffffff' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer',
            }}
          >
            <CheckCircle2 size={16} />
            <span>Trình So Vé Hàng Loạt</span>
          </button>
        </div>

        <div style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>
          {activeSubTab === 'vietlott_filter'
            ? 'Tối ưu hóa xác suất trúng theo Phân phối chuẩn Gauss & Cặp Co-occurrence'
            : `Kỳ quay đối soát: ${latestXSMB?.date || 'Mới nhất'} (Đặc biệt: ${specialPrizeNumber || '--'})`}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 1. VIEW: TẠO DÀN & LỌC VÉ VIETLOTT THÔNG MINH (NEW!)      */}
      {/* ========================================================= */}
      {activeSubTab === 'vietlott_filter' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="glass-card animate-fade-in" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Header & Product Switch */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Sparkles size={18} color="var(--accent-gold)" />
                  BỘ TẠO DÀN VÉ VIETLOTT CHUẨN XÁC SUẤT GAUSS
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Lọc bỏ các bộ số bất khả thi (tổng quá lệch, toàn số chẵn/lẻ) và ưu tiên các cặp số có xác suất đồng xuất hiện cao trong 1.400+ kỳ.
                </p>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className={`tab-btn ${vietlottProduct === '655' ? 'active' : ''}`}
                  onClick={() => {
                    setVietlottProduct('655');
                    setGeneratedTickets([]);
                    setVSelectedPair(null);
                    setVGenerationEmpty(false);
                  }}
                  style={{ fontSize: '0.82rem', padding: '6px 14px' }}
                >
                  Power 6/55
                </button>
                <button
                  className={`tab-btn ${vietlottProduct === '645' ? 'active' : ''}`}
                  onClick={() => {
                    setVietlottProduct('645');
                    setGeneratedTickets([]);
                    setVSelectedPair(null);
                    setVGenerationEmpty(false);
                  }}
                  style={{ fontSize: '0.82rem', padding: '6px 14px' }}
                >
                  Mega 6/45
                </button>
              </div>
            </div>

            {/* BỘ CHỌN LOẠI VÉ VIETLOTT & SỐ LƯỢNG VÉ */}
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.75)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(245, 158, 11, 0.25)',
                padding: '16px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
              }}
            >
              {/* Row 1: Danh sách loại vé */}
              <div>
                <div
                  style={{
                    fontSize: '0.82rem',
                    fontWeight: 800,
                    color: 'var(--accent-gold)',
                    marginBottom: 10,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <Layers size={16} />
                  <span>CHỌN LOẠI VÉ VIETLOTT:</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-dim)' }}>
                    (Hệ thống tự động tính toán tổ hợp & dự toán giá theo chuẩn Vietlott)
                  </span>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {(
                    [
                      'single',
                      'bao5',
                      'bao7',
                      'bao8',
                      'bao9',
                      'bao10',
                      'bao11',
                      'bao12',
                      'bao13',
                      'bao14',
                      'bao15',
                      'bao18',
                    ] as VietlottTicketType[]
                  ).map((tType) => {
                    const spec = getVietlottTicketSpec(vietlottProduct, tType);
                    const isSelected = vTicketType === tType;
                    return (
                      <button
                        key={tType}
                        onClick={() => {
                          setVTicketType(tType);
                          setGeneratedTickets([]);
                        }}
                        style={{
                          padding: '7px 13px',
                          borderRadius: 'var(--radius-sm)',
                          background: isSelected
                            ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.25), rgba(239, 68, 68, 0.2))'
                            : 'rgba(255, 255, 255, 0.04)',
                          border: isSelected ? '1px solid var(--accent-gold)' : '1px solid var(--border-subtle)',
                          color: isSelected ? '#ffffff' : 'var(--text-muted)',
                          fontWeight: isSelected ? 800 : 600,
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          transition: 'all 0.15s',
                        }}
                      >
                        <span>{spec.label}</span>
                        <span
                          style={{
                            fontSize: '0.68rem',
                            padding: '1px 5px',
                            borderRadius: 3,
                            background: isSelected ? 'var(--accent-gold)' : 'rgba(255, 255, 255, 0.08)',
                            color: isSelected ? '#000000' : 'var(--text-dim)',
                            fontWeight: 700,
                          }}
                        >
                          {formatVND(spec.cost)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Row 2: Chọn Số Lượng Vé & Thông Số Loại Vé */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 12,
                  paddingTop: 10,
                  borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    Số lượng vé cần sinh:
                  </span>
                  {[1, 3, 5, 10].map((cnt) => (
                    <button
                      key={cnt}
                      onClick={() => setVTicketCount(cnt)}
                      style={{
                        padding: '4px 12px',
                        borderRadius: 'var(--radius-sm)',
                        background: vTicketCount === cnt ? 'var(--accent-gold)' : 'rgba(255,255,255,0.05)',
                        color: vTicketCount === cnt ? '#000000' : 'var(--text-main)',
                        border: '1px solid var(--border-subtle)',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      {cnt} Vé
                    </button>
                  ))}
                </div>

                <div
                  style={{
                    fontSize: '0.78rem',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    flexWrap: 'wrap',
                  }}
                >
                  <span>
                    Quy mô:{' '}
                    <strong style={{ color: 'var(--accent-cyan)' }}>{currentTicketSpec.subTickets} vé con 6 số</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Tổng tiền mua {vTicketCount} vé:{' '}
                    <strong style={{ color: 'var(--accent-emerald)' }}>
                      {formatVND(currentTicketSpec.cost * vTicketCount)}
                    </strong>
                  </span>
                  <span>•</span>
                  <span>
                    Khoảng Gauss chuẩn:{' '}
                    <strong style={{ color: 'var(--accent-gold)' }}>
                      [{currentGaussRange.min} - {currentGaussRange.max} điểm]
                    </strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Các Tiêu Chí Lọc Thông Minh */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
              {/* 1. Tổng điểm */}
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: 14, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-gold)', marginBottom: 8 }}>
                  1. KHOẢNG TỔNG {currentTicketSpec.size} BÓNG:
                </div>
                <select
                  value={vSumRange}
                  onChange={(e) => setVSumRange(e.target.value as any)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 4,
                    background: 'rgba(30, 41, 59, 0.8)',
                    color: '#ffffff',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '0.82rem',
                    outline: 'none',
                  }}
                >
                  <option value="gauss">
                    Chuẩn Gauss ({currentGaussRange.min} - {currentGaussRange.max} điểm) [Chiếm ~80%]
                  </option>
                  <option value="low">Tổng thấp (&lt; {currentGaussRange.min} điểm)</option>
                  <option value="high">Tổng cao (&gt; {currentGaussRange.max} điểm)</option>
                  <option value="all">Tất cả khoảng tổng</option>
                </select>
              </div>

              {/* 2. Tỷ lệ Chẵn / Lẻ */}
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: 14, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: 8 }}>
                  2. TỶ LỆ CHẴN / LẺ:
                </div>
                <select
                  value={vParityRatio}
                  onChange={(e) => setVParityRatio(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 4,
                    background: 'rgba(30, 41, 59, 0.8)',
                    color: '#ffffff',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '0.82rem',
                    outline: 'none',
                  }}
                >
                  <option value="balanced">
                    {currentTicketSpec.size === 6
                      ? 'Cân bằng: 3 Chẵn - 3 Lẻ (Tần suất cao nhất 33%)'
                      : currentTicketSpec.size % 2 === 0
                      ? `Cân bằng: ${currentTicketSpec.size / 2} Chẵn - ${currentTicketSpec.size / 2} Lẻ`
                      : `Cân bằng: ${Math.ceil(currentTicketSpec.size / 2)} - ${Math.floor(currentTicketSpec.size / 2)} (Tỷ lệ cao nhất)`}
                  </option>
                  <option value="even_heavy">Thiên Chẵn (Đa số bóng chẵn)</option>
                  <option value="odd_heavy">Thiên Lẻ (Đa số bóng lẻ)</option>
                  <option value="all">Bất kỳ tỷ lệ nào</option>
                </select>
              </div>

              {/* 3. Tỷ lệ Nhỏ / Lớn */}
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: 14, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-emerald)', marginBottom: 8 }}>
                  3. TỶ LỆ NHỎ / LỚN:
                </div>
                <select
                  value={vLowHighRatio}
                  onChange={(e) => setVLowHighRatio(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 4,
                    background: 'rgba(30, 41, 59, 0.8)',
                    color: '#ffffff',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '0.82rem',
                    outline: 'none',
                  }}
                >
                  <option value="balanced">
                    {currentTicketSpec.size === 6
                      ? `3 Nhỏ (01-${midBall}) - 3 Lớn (${midBall + 1}-${maxBall})`
                      : currentTicketSpec.size % 2 === 0
                      ? `Cân bằng: ${currentTicketSpec.size / 2} Nhỏ - ${currentTicketSpec.size / 2} Lớn`
                      : `Cân bằng: ${Math.ceil(currentTicketSpec.size / 2)} - ${Math.floor(currentTicketSpec.size / 2)}`}
                  </option>
                  <option value="low_heavy">Thiên Nhỏ (Nhiều bóng 01-{midBall})</option>
                  <option value="high_heavy">Thiên Lớn (Nhiều bóng {midBall + 1}-{maxBall})</option>
                  <option value="all">Bất kỳ</option>
                </select>
              </div>

              {/* 4. Loại trừ số gan */}
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: 14, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-red)', marginBottom: 8 }}>
                  4. LOẠI TRỪ SỐ GAN:
                </div>
                <select
                  value={vExcludeGanLimit}
                  onChange={(e) => setVExcludeGanLimit(parseInt(e.target.value, 10))}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 4,
                    background: 'rgba(30, 41, 59, 0.8)',
                    color: '#ffffff',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '0.82rem',
                    outline: 'none',
                  }}
                >
                  <option value={20}>Loại bỏ các bóng gan &gt; 20 kỳ</option>
                  <option value={30}>Loại bỏ các bóng gan &gt; 30 kỳ</option>
                  <option value={15}>Loại bỏ các bóng gan &gt; 15 kỳ (Nghiêm ngặt)</option>
                  <option value={0}>Không loại trừ số gan</option>
                </select>
              </div>
            </div>

            {/* Ưu tiên Cặp số Hot (Co-occurrence) */}
            {coocPairs.length > 0 && (
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--accent-gold)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Flame size={15} color="var(--accent-gold)" />
                  Ép Chọn Cặp Số Hot (Tùy chọn: Vé sinh ra sẽ bắt buộc chứa cặp này):
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    onClick={() => setVSelectedPair(null)}
                    style={{
                      padding: '5px 12px',
                      borderRadius: 'var(--radius-sm)',
                      background: vSelectedPair === null ? 'var(--accent-gold)' : 'rgba(255,255,255,0.05)',
                      color: vSelectedPair === null ? '#000000' : 'var(--text-main)',
                      border: '1px solid var(--border-subtle)',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Ngẫu nhiên tự do
                  </button>
                  {coocPairs.slice(0, 6).map((p, idx) => {
                    const isSelected = vSelectedPair && vSelectedPair[0] === p.numbers[0] && vSelectedPair[1] === p.numbers[1];
                    return (
                      <button
                        key={idx}
                        onClick={() => setVSelectedPair(isSelected ? null : p.numbers)}
                        style={{
                          padding: '5px 12px',
                          borderRadius: 'var(--radius-sm)',
                          background: isSelected ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.04)',
                          color: isSelected ? '#000000' : 'var(--text-main)',
                          border: isSelected ? 'none' : '1px solid var(--border-subtle)',
                          fontSize: '0.78rem',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        [ {p.numbers[0]} - {p.numbers[1]} ] ({p.hits} kỳ)
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Các Nút Bấm Tạo Dàn */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', paddingTop: 8, borderTop: '1px solid var(--border-subtle)' }}>
              <button
                onClick={() => handleGenerateVietlottTickets()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '11px 24px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  color: '#000000',
                  fontWeight: 800,
                  fontSize: '0.92rem',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(245, 158, 11, 0.35)',
                  transition: 'transform 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'none')}
              >
                <Dices size={19} />
                <span>
                  🎲 Tạo {vTicketCount} {currentTicketSpec.label} Chuẩn Bộ Lọc
                </span>
              </button>

              <button
                onClick={() => {
                  setVTicketType('single');
                  setVTicketCount(5);
                  handleGenerateVietlottTickets(5, 'single');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '10px 16px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-main)',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                }}
              >
                <span>5 Vé Đơn (6 Số)</span>
              </button>

              <button
                onClick={() => {
                  setVTicketType('bao7');
                  setVTicketCount(1);
                  handleGenerateVietlottTickets(1, 'bao7');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '10px 16px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(56, 189, 248, 0.12)',
                  border: '1px solid var(--accent-cyan)',
                  color: 'var(--accent-cyan)',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                }}
              >
                <Award size={15} />
                <span>1 Vé Bao 7</span>
              </button>

              <button
                onClick={() => {
                  setVTicketType('bao8');
                  setVTicketCount(1);
                  handleGenerateVietlottTickets(1, 'bao8');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '10px 16px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid var(--accent-emerald)',
                  color: 'var(--accent-emerald)',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                }}
              >
                <Trophy size={15} />
                <span>1 Vé Bao 8</span>
              </button>

              {generatedTickets.length > 0 && (
                <button
                  onClick={handleCopyAllVietlottTickets}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '10px 18px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid var(--border-subtle)',
                    color: vCopiedNotice ? 'var(--accent-emerald)' : 'var(--text-main)',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    marginLeft: 'auto',
                  }}
                >
                  <Copy size={16} />
                  <span>{vCopiedNotice ? 'Đã sao chép tất cả!' : 'Sao chép toàn bộ dàn'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Thông Báo Không Tìm Thấy Vé Phù Hợp */}
          {vGenerationEmpty && (
            <div
              className="glass-card animate-fade-in"
              style={{
                padding: '18px 22px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 14,
              }}
            >
              <AlertTriangle size={22} color="var(--accent-red)" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <h4 style={{ fontSize: '0.98rem', fontWeight: 700, color: '#fca5a5', marginBottom: 6 }}>
                  Không tìm thấy vé thỏa mãn đồng thời các điều kiện lọc (sau 4.000 lần thử ngẫu nhiên)
                </h4>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>
                  Các tiêu chí bạn đang chọn (Tổng Gauss, tỷ lệ Chẵn/Lẻ, Nhỏ/Lớn, Lọc số gan hoặc Cặp số bắt buộc) có thể quá hẹp hoặc xung đột với nhau.
                </p>
                <div style={{ marginTop: 8, fontSize: '0.82rem', color: 'var(--accent-gold)' }}>
                  💡 <strong>Gợi ý:</strong> Hãy nới lỏng các bộ lọc (chọn phân bổ <em>Cân Bằng</em>, giữ <em>Chuẩn Gauss</em> hoặc bỏ cặp số bắt buộc) rồi bấm tạo lại dàn vé.
                </div>
              </div>
            </div>
          )}

          {/* Danh Sách Vé Đã Sinh */}
          {generatedTickets.length > 0 && (
            <div className="glass-card animate-fade-in" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff' }}>
                  DÀN VÉ VỪA SINH ({generatedTickets.length} Vé Thỏa Mãn Tất Cả Tiêu Chí)
                </h4>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                  Bấm "Kiểm tra lịch sử" để đối soát từng vé với toàn bộ 1.400+ kỳ quay!
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {generatedTickets.map((t) => (
                  <div
                    key={t.id}
                    style={{
                      background: 'rgba(30, 41, 59, 0.5)',
                      padding: '14px 18px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 12,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <span style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--accent-gold)' }}>
                          Vé #{t.id}
                        </span>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          <span
                            style={{
                              fontSize: '0.68rem',
                              background: 'rgba(245, 158, 11, 0.15)',
                              color: 'var(--accent-gold)',
                              border: '1px solid rgba(245, 158, 11, 0.3)',
                              padding: '1px 6px',
                              borderRadius: 3,
                              fontWeight: 700,
                            }}
                          >
                            {t.ticketTypeLabel}
                          </span>
                          <span
                            style={{
                              fontSize: '0.68rem',
                              background: 'rgba(56, 189, 248, 0.15)',
                              color: 'var(--accent-cyan)',
                              border: '1px solid rgba(56, 189, 248, 0.3)',
                              padding: '1px 6px',
                              borderRadius: 3,
                              fontWeight: 700,
                            }}
                          >
                            {t.subTickets} vé con
                          </span>
                          <span
                            style={{
                              fontSize: '0.68rem',
                              background: 'rgba(16, 185, 129, 0.15)',
                              color: '#34d399',
                              border: '1px solid rgba(16, 185, 129, 0.3)',
                              padding: '1px 6px',
                              borderRadius: 3,
                              fontWeight: 700,
                            }}
                          >
                            {formatVND(t.cost)}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {t.balls.map((b) => (
                          <div
                            key={b}
                            className="lottery-ball ball-gold"
                            style={{ width: 34, height: 34, fontSize: '0.88rem' }}
                          >
                            {b.toString().padStart(2, '0')}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        Tổng: <strong style={{ color: '#ffffff' }}>{t.sum}</strong> | {t.evenCount}C -{' '}
                        {t.balls.length - t.evenCount}L | {t.lowCount}N - {t.balls.length - t.lowCount}L
                      </div>

                      <button
                        onClick={() => {
                          if (onSwitchToVietlottCombo) {
                            onSwitchToVietlottCombo(t.balls);
                          }
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '6px 14px',
                          borderRadius: 'var(--radius-sm)',
                          background: 'rgba(245, 158, 11, 0.15)',
                          border: '1px solid var(--accent-gold)',
                          color: 'var(--accent-gold)',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        <Trophy size={13} />
                        <span>Kiểm tra lịch sử</span>
                      </button>

                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(t.balls.map((b) => b.toString().padStart(2, '0')).join(', '));
                        }}
                        title="Sao chép vé này"
                        style={{
                          background: 'rgba(255,255,255,0.05)',
                          border: '1px solid var(--border-subtle)',
                          color: 'var(--text-dim)',
                          padding: '6px 10px',
                          borderRadius: 'var(--radius-sm)',
                          cursor: 'pointer',
                        }}
                      >
                        <Copy size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. VIEW: BỘ LỌC DÀN SỐ XSMB                               */}
      {/* ========================================================= */}
      {activeSubTab === 'xsmb_filter' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Cụm điều khiển bộ lọc */}
          <div className="glass-card animate-fade-in" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff' }}>CẤU HÌNH THÔNG SỐ LỌC DÀN XSMB</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Lọc chạm, tổng, loại trừ lô gan để tạo dàn số chuẩn xác cho đề hoặc lô tô.
                </p>
              </div>
              <button
                onClick={handleResetFilter}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-dim)',
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                }}
              >
                <RefreshCw size={13} />
                <span>Đặt lại mặc định</span>
              </button>
            </div>

            {/* Lọc Chạm 0 - 9 */}
            <div>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--accent-gold)', marginBottom: 8 }}>
                1. LỌC THEO CHẠM (Chạm đầu hoặc đuôi):
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((c) => {
                  const isSelected = selectedChams.includes(c);
                  return (
                    <button
                      key={c}
                      onClick={() => handleToggleCham(c)}
                      style={{
                        width: 44,
                        height: 38,
                        borderRadius: 'var(--radius-sm)',
                        background: isSelected ? 'var(--accent-gold)' : 'rgba(255,255,255,0.05)',
                        color: isSelected ? '#000000' : 'var(--text-main)',
                        border: isSelected ? 'none' : '1px solid var(--border-subtle)',
                        fontWeight: 800,
                        fontSize: '0.92rem',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Lọc Tổng 0 - 9 */}
            <div>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: 8 }}>
                2. LỌC THEO TỔNG (Tổng chữ số % 10):
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((t) => {
                  const isSelected = selectedTongs.includes(t);
                  return (
                    <button
                      key={t}
                      onClick={() => handleToggleTong(t)}
                      style={{
                        width: 44,
                        height: 38,
                        borderRadius: 'var(--radius-sm)',
                        background: isSelected ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.05)',
                        color: isSelected ? '#000000' : 'var(--text-main)',
                        border: isSelected ? 'none' : '1px solid var(--border-subtle)',
                        fontWeight: 800,
                        fontSize: '0.92rem',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >
                      T{t}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bộ lọc nâng cao: Chẵn/Lẻ, Kép bằng, Loại gan */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-dim)', marginBottom: 8 }}>
                  3. TỔNG CHẴN / LẺ:
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[
                    { id: 'all', label: 'Tất cả' },
                    { id: 'even', label: 'Tổng Chẵn' },
                    { id: 'odd', label: 'Tổng Lẻ' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setTongParity(p.id as any)}
                      style={{
                        flex: 1,
                        padding: '6px 10px',
                        borderRadius: 'var(--radius-sm)',
                        background: tongParity === p.id ? 'var(--accent-gold)' : 'rgba(255,255,255,0.05)',
                        color: tongParity === p.id ? '#000000' : 'var(--text-main)',
                        border: '1px solid var(--border-subtle)',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-dim)', marginBottom: 8 }}>
                  4. KÉP BẰNG (00, 11, ... 99):
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => setIncludeKiepBang(true)}
                    style={{
                      flex: 1,
                      padding: '6px 10px',
                      borderRadius: 'var(--radius-sm)',
                      background: includeKiepBang ? 'var(--accent-gold)' : 'rgba(255,255,255,0.05)',
                      color: includeKiepBang ? '#000000' : 'var(--text-main)',
                      border: '1px solid var(--border-subtle)',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Lấy kép bằng
                  </button>
                  <button
                    onClick={() => setIncludeKiepBang(false)}
                    style={{
                      flex: 1,
                      padding: '6px 10px',
                      borderRadius: 'var(--radius-sm)',
                      background: !includeKiepBang ? 'var(--accent-gold)' : 'rgba(255,255,255,0.05)',
                      color: !includeKiepBang ? '#000000' : 'var(--text-main)',
                      border: '1px solid var(--border-subtle)',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Bỏ kép bằng
                  </button>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-dim)', marginBottom: 8 }}>
                  5. LOẠI TRỪ LÔ GAN:
                </div>
                <select
                  value={excludeGanDays}
                  onChange={(e) => setExcludeGanDays(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(30, 41, 59, 0.7)',
                    border: '1px solid var(--border-subtle)',
                    color: '#ffffff',
                    fontSize: '0.85rem',
                    outline: 'none',
                  }}
                >
                  <option value={0}>Không loại trừ số gan</option>
                  <option value={10}>Loại bỏ các số gan &gt; 10 ngày</option>
                  <option value={15}>Loại bỏ các số gan &gt; 15 ngày</option>
                  <option value={20}>Loại bỏ các số gan &gt; 20 ngày (An toàn)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Kết quả dàn số */}
          <div className="glass-card animate-fade-in" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff' }}>DÀN SỐ ĐÃ LỌC:</span>
                <span className="badge badge-gold" style={{ fontSize: '0.85rem' }}>
                  {filteredNumbers.length} số (chiếm {filteredNumbers.length}%)
                </span>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={handleCopyFiltered}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid var(--border-subtle)',
                    color: filterCopied ? 'var(--accent-emerald)' : 'var(--text-main)',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {filterCopied ? <Check size={14} /> : <Copy size={14} />}
                  <span>{filterCopied ? 'Đã sao chép!' : 'Sao chép dàn số'}</span>
                </button>

                <button
                  onClick={handleSendToChecker}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'linear-gradient(135deg, #10b981, #06b6d4)',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  <CheckCircle2 size={14} />
                  <span>So khớp dàn này</span>
                </button>
              </div>
            </div>

            {/* Grid các số */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(48px, 1fr))',
                gap: 8,
                maxHeight: 280,
                overflowY: 'auto',
                padding: '4px',
              }}
            >
              {filteredNumbers.map((num) => (
                <button
                  key={num}
                  onClick={() => onSelectNumber(num)}
                  className="lottery-ball ball-gold"
                  style={{
                    width: 44,
                    height: 44,
                    fontSize: '0.95rem',
                    cursor: 'pointer',
                  }}
                  title="Bấm để xem lịch sử số này"
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. VIEW: TRÌNH SO VÉ HÀNG LOẠT (CHECKER)                  */}
      {/* ========================================================= */}
      {activeSubTab === 'checker' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="glass-card animate-fade-in" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff' }}>TRÌNH SO VÉ HÀNG LOẠT TỨC THÌ</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Dán danh sách vé đã mua để kiểm tra xem hôm nay trúng được bao nhiêu con, có nổ Giải Đặc Biệt (Đề) hay không.
              </p>
            </div>

            <div>
              <textarea
                value={ticketInput}
                onChange={(e) => setTicketInput(e.target.value)}
                placeholder="Nhập hoặc dán các con số đã mua (cách nhau bởi dấu phẩy, khoảng trắng hoặc dấu gạch)..."
                rows={3}
                style={{
                  width: '100%',
                  padding: 12,
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(30, 41, 59, 0.7)',
                  border: '1px solid var(--border-subtle)',
                  color: '#ffffff',
                  fontSize: '0.95rem',
                  fontFamily: 'var(--font-mono)',
                  outline: 'none',
                  resize: 'vertical',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button
                onClick={() => setTicketInput('03, 14, 28, 51, 68, 86, 89, 90')}
                style={{
                  padding: '4px 10px',
                  borderRadius: 4,
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-dim)',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                }}
              >
                Mẫu dàn lô 8 số
              </button>
              <button
                onClick={() => setTicketInput('00, 11, 22, 33, 44, 55, 66, 77, 88, 99')}
                style={{
                  padding: '4px 10px',
                  borderRadius: 4,
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-dim)',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                }}
              >
                Mẫu dàn kép bằng
              </button>
              <button
                onClick={() => setTicketInput('')}
                style={{
                  padding: '4px 10px',
                  borderRadius: 4,
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--accent-red)',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                }}
              >
                Xóa sạch
              </button>
            </div>
          </div>

          {/* Báo cáo kết quả so vé */}
          <div className="glass-card animate-fade-in" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
              <div>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff' }}>KẾT QUẢ ĐỐI SOÁT VÉ</h4>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 4 }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Tổng số vé: <strong>{checkerReport.totalTickets}</strong> con
                  </span>
                  <span>•</span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--accent-emerald)', fontWeight: 700 }}>
                    Trúng: {checkerReport.matchCount} / {checkerReport.totalTickets} ({checkerReport.rate}%)
                  </span>
                  <span>•</span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--accent-gold)', fontWeight: 700 }}>
                    Tổng số nháy nổ: {checkerReport.totalHits} nháy
                  </span>
                </div>
              </div>

              {checkerReport.hitSpecial && (
                <div className="badge badge-hot" style={{ fontSize: '0.9rem', padding: '6px 14px' }}>
                  🎉 CHÚC MỪNG: TRÚNG GIẢI ĐẶC BIỆT ({specialPrizeNumber})!
                </div>
              )}
            </div>

            {/* Chi tiết từng con số trong vé */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                gap: 12,
              }}
            >
              {checkerReport.details.map((item) => (
                <div
                  key={item.number}
                  className="glass-card"
                  onClick={() => onSelectNumber(item.number)}
                  style={{
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    background: item.isWin
                      ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(6, 182, 212, 0.15))'
                      : 'rgba(255, 255, 255, 0.02)',
                    border: item.isSpecial
                      ? '2px solid #ef4444'
                      : item.isWin
                      ? '1px solid var(--accent-emerald)'
                      : '1px solid var(--border-subtle)',
                  }}
                  title="Bấm để xem lịch sử số"
                >
                  <div
                    className={`lottery-ball ${item.isSpecial ? 'ball-rose' : item.isWin ? 'ball-gold' : 'ball-slate'}`}
                    style={{ width: 36, height: 36, fontSize: '1rem' }}
                  >
                    {item.number}
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    {item.isSpecial ? (
                      <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--accent-rose)' }}>
                        ĐẶC BIỆT
                      </div>
                    ) : item.isWin ? (
                      <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>
                        {item.hits} NHÁY
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                        Trượt
                      </div>
                    )}
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
