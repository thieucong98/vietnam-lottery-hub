import React from 'react';
import { StatsReportView } from '../features/analysis/StatsReportView';
import { useDataset } from '../data/useData';

/** Phân tích minh bạch: thống kê mô tả có khoảng tin cậy, kiểm định ngẫu nhiên. URL: `/phan-tich` */
export default function AnalysisPage() {
  const report = useDataset('statsReport');
  return <StatsReportView data={report.data} error={report.error} />;
}
