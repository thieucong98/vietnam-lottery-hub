import { useState, useMemo } from 'react';
import { useControllableState } from '../../ui/useControllableState';
import type { FilterView } from '../../app/routes';
import {
  LotteryIndexData,
  LatestDrawXSMB,
  VietlottCooccurrenceData,
} from '../../types';
import { formatVND } from '../../utils/lotteryUtils';
import { getVietlottTicketSpec, getGaussSumRange } from './ticketSpec';
import type { VietlottTicketType, GeneratedVietlottTicket } from './ticketSpec';

export interface SmartFilterAndCheckerProps {
  /** Kỳ XSMB mới nhất (summary.json) dùng cho thống kê nhiều số */
  latestXsmb?: LatestDrawXSMB;
  vietlott655Data?: LotteryIndexData | null;
  vietlott645Data?: LotteryIndexData | null;
  cooccurrenceData?: VietlottCooccurrenceData | null;
  onSelectNumber: (num: string) => void;
  onSwitchToVietlottCombo?: (balls: number[], product: '655' | '645') => void;
  view?: FilterView;
  onViewChange?: (view: FilterView) => void;
}

export function useTicketFilter(props: SmartFilterAndCheckerProps) {
  const {
    latestXsmb,
    vietlott655Data,
    vietlott645Data,
    cooccurrenceData,
    onSelectNumber,
    onSwitchToVietlottCombo,
    view,
    onViewChange,
  } = props;
  const [activeSubTab, setActiveSubTab] = useControllableState<FilterView>(view, onViewChange, 'vietlott_filter');

  // ==========================================
  // STATE CHO TẠO & LỌC VÉ VIETLOTT
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

  // 2. Logic Sinh Vé Vietlott Theo Bộ Lọc
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

  const latestXSMB = latestXsmb;
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

  return {
    latestXsmb,
    vietlott655Data,
    vietlott645Data,
    cooccurrenceData,
    onSelectNumber,
    onSwitchToVietlottCombo,
    activeSubTab,
    setActiveSubTab,
    vietlottProduct,
    setVietlottProduct,
    vTicketType,
    setVTicketType,
    vTicketCount,
    setVTicketCount,
    vSumRange,
    setVSumRange,
    vParityRatio,
    setVParityRatio,
    vLowHighRatio,
    setVLowHighRatio,
    vExcludeGanLimit,
    setVExcludeGanLimit,
    vSelectedPair,
    setVSelectedPair,
    generatedTickets,
    setGeneratedTickets,
    vGenerationEmpty,
    setVGenerationEmpty,
    vCopiedNotice,
    setVCopiedNotice,
    ticketInput,
    setTicketInput,
    customSpecialInput,
    setCustomSpecialInput,
    maxBall,
    midBall,
    activeVietlottIdx,
    coocPairs,
    currentTicketSpec,
    currentGaussRange,
    handleGenerateVietlottTickets,
    handleCopyAllVietlottTickets,
    parsedTickets,
    latestXSMB,
    lotoResults,
    specialPrizeNumber,
    checkerReport,
  };
}

export type SmartFilterAndCheckerModel = ReturnType<typeof useTicketFilter>;
