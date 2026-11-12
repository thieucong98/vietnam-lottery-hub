import React from 'react';
import { AIStrategyHub } from '../components/AIStrategyHub';
import { useDataset } from '../data/useData';
import { useAppNavigation } from '../app/navigation';

/** Thuật toán mẫu & backtest. URL: `/thuat-toan` */
export default function AiPage() {
  const nav = useAppNavigation();
  const ml = useDataset('mlInsights');
  return <AIStrategyHub mlData={ml.data} onSelectNumber={(n) => nav.openNumber(n, 'vietlott_655')} />;
}
