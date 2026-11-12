import React from 'react';
import { GanRankingView } from '../components/GanRankingView';
import { useDataset } from '../data/useData';
import { useAppNavigation } from '../app/navigation';

/** Bảng số lâu chưa về. URL: `/gan` */
export default function GanPage() {
  const nav = useAppNavigation();
  const xsmb = useDataset('xsmbStats');
  const v655 = useDataset('vietlott655Stats');
  return <GanRankingView xsmbData={xsmb.data} vietlottData={v655.data} onSelectNumber={(n, source) => nav.openNumber(n, source === 'vietlott' ? 'vietlott_655' : 'xsmb')} />;
}
