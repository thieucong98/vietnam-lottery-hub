import { useState, useMemo } from 'react';
import { useControllableState } from '../../ui/useControllableState';
import type { KenoView } from '../../app/routes';
import { LatestDrawKeno, LatestDraw3D } from '../../types';

export interface KenoAndMax3DViewProps {
  latestKeno?: LatestDrawKeno;
  latest3D?: LatestDraw3D;
  latest3DPro?: LatestDraw3D;
  onSelectNumber: (num: string) => void;
  view?: KenoView;
  onViewChange?: (view: KenoView) => void;
}

export function useKeno3D(props: KenoAndMax3DViewProps) {
  const {
    latestKeno,
    latest3D,
    latest3DPro,
    onSelectNumber,
    view,
    onViewChange,
  } = props;
  const [subTab, setSubTab] = useControllableState<KenoView>(view, onViewChange, 'keno');
  const [userKenoPicks, setUserKenoPicks] = useState<number[]>([]);
  const [kenoPickWarning, setKenoPickWarning] = useState<string | null>(null);

  // ========================================================
  // KENO ANALYTICS LOGIC
  // ========================================================
  const kenoBalls = useMemo(() => {
    return latestKeno?.result || [];
  }, [latestKeno]);

  const kenoStats = useMemo(() => {
    if (!kenoBalls.length) {
      return {
        totalSum: 0,
        evenCount: 0,
        oddCount: 0,
        smallCount: 0, // 01 - 40
        bigCount: 0,   // 41 - 80
        taiXiuVerdict: 'N/A',
        chanLeVerdict: 'N/A',
      };
    }

    const totalSum = kenoBalls.reduce((acc, b) => acc + b, 0);
    const evenCount = kenoBalls.filter((b) => b % 2 === 0).length;
    const oddCount = kenoBalls.length - evenCount;
    const smallCount = kenoBalls.filter((b) => b <= 40).length;
    const bigCount = kenoBalls.length - smallCount;

    let taiXiuVerdict = 'Hòa';
    if (smallCount > bigCount) taiXiuVerdict = `Xỉu (${smallCount} số)`;
    else if (bigCount > smallCount) taiXiuVerdict = `Tài (${bigCount} số)`;

    let chanLeVerdict = 'Chẵn Lẻ Hòa';
    if (evenCount > oddCount) chanLeVerdict = `Chẵn (${evenCount} số)`;
    else if (oddCount > evenCount) chanLeVerdict = `Lẻ (${oddCount} số)`;

    return {
      totalSum,
      evenCount,
      oddCount,
      smallCount,
      bigCount,
      taiXiuVerdict,
      chanLeVerdict,
    };
  }, [kenoBalls]);

  // Bộ chọn số thử vé Keno (Tối đa 10 số)
  const toggleKenoPick = (num: number) => {
    setKenoPickWarning(null);
    if (userKenoPicks.includes(num)) {
      setUserKenoPicks(userKenoPicks.filter((n) => n !== num));
    } else {
      if (userKenoPicks.length >= 10) {
        setKenoPickWarning('Bạn chỉ có thể chọn tối đa 10 số cho một vé Keno (Bậc 1 đến Bậc 10)!');
        return;
      }
      setUserKenoPicks([...userKenoPicks, num].sort((a, b) => a - b));
    }
  };

  const matchedUserKeno = useMemo(() => {
    const kenoSet = new Set(kenoBalls);
    return userKenoPicks.filter((p) => kenoSet.has(p));
  }, [userKenoPicks, kenoBalls]);

  const quickPickKeno = (count: number) => {
    setKenoPickWarning(null);
    const pool = Array.from({ length: 80 }, (_, i) => i + 1);
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    setUserKenoPicks(pool.slice(0, count).sort((a, b) => a - b));
  };

  // ========================================================
  // MAX 3D DIGIT FREQUENCY LOGIC
  // ========================================================
  const current3DData = subTab === 'max3d' ? latest3D : latest3DPro;

  const digitFrequency3D = useMemo(() => {
    if (!current3DData?.result) return Array(10).fill(0);
    const counts = Array(10).fill(0);
    Object.values(current3DData.result).forEach((prizes) => {
      prizes.forEach((numStr) => {
        for (const char of numStr) {
          const digit = parseInt(char, 10);
          if (!isNaN(digit)) counts[digit]++;
        }
      });
    });
    return counts;
  }, [current3DData]);

  const maxDigitCount = Math.max(...digitFrequency3D, 1);

  return {
    latestKeno,
    latest3D,
    latest3DPro,
    onSelectNumber,
    subTab,
    setSubTab,
    userKenoPicks,
    setUserKenoPicks,
    kenoPickWarning,
    setKenoPickWarning,
    kenoBalls,
    kenoStats,
    toggleKenoPick,
    matchedUserKeno,
    quickPickKeno,
    current3DData,
    digitFrequency3D,
    maxDigitCount,
  };
}

export type KenoAndMax3DViewModel = ReturnType<typeof useKeno3D>;
