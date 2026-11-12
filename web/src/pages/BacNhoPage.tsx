import React from 'react';
import { BacNhoHub } from '../components/BacNhoHub';
import { useDataset } from '../data/useData';
import { useAppNavigation } from '../app/navigation';

/** Thống kê có điều kiện XSMB. URL: `/bac-nho` */
export default function BacNhoPage() {
  const nav = useAppNavigation();
  const data = useDataset('bacNho');
  return <BacNhoHub bacNhoData={data.data} onSelectNumber={(n) => nav.openNumber(n, 'xsmb')} />;
}
