import React from 'react';
import { HeatmapMatrix } from '../components/HeatmapMatrix';
import { useDataset } from '../data/useData';
import { useAppNavigation } from '../app/navigation';

/** Ma trận nhiệt XSMB. URL: `/nhiet` */
export default function HeatmapPage() {
  const nav = useAppNavigation();
  const stats = useDataset('xsmbStats');
  return <HeatmapMatrix data={stats.data} onSelectNumber={(n) => nav.openNumber(n, 'xsmb')} />;
}
