/** Diễn giải kết quả kiểm định bằng lời dễ hiểu (dùng chung cho các màn hình phân tích) */

export const formatInt = (n: number) => n.toLocaleString('vi-VN');

export const formatPct = (rate: number, digits = 1) => `${(rate * 100).toLocaleString('vi-VN', { minimumFractionDigits: digits, maximumFractionDigits: digits })}%`;

export const formatNum = (x: number, digits = 2) => x.toLocaleString('vi-VN', { minimumFractionDigits: digits, maximumFractionDigits: digits });

export function formatP(p: number): string {
  if (p < 0.001) return '< 0,001';
  return p.toLocaleString('vi-VN', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
}

/** "2017-08-01" -> "01/08/2017" */
export const formatDate = (iso: string) => iso.split('-').reverse().join('/');

export type Verdict = 'noise' | 'notable';

/** Ngưỡng 0,05 thông dụng. p nhỏ chỉ là "đáng chú ý", không phải bằng chứng có quy luật. */
export const verdictOf = (p: number): Verdict => (p < 0.05 ? 'notable' : 'noise');

export function explainP(p: number): string {
  if (p >= 0.05) {
    return `p = ${formatP(p)}: chênh lệch này nằm trong dao động ngẫu nhiên. Nếu kết quả hoàn toàn ngẫu nhiên, chênh lệch cỡ này hoặc lớn hơn xảy ra khoảng ${Math.round(p * 100)}/100 lần.`;
  }
  return `p = ${formatP(p)}: chênh lệch hiếm gặp nếu kết quả hoàn toàn ngẫu nhiên. Khi chạy nhiều kiểm định, khoảng 1/20 kiểm định sẽ cho p < 0,05 chỉ do ngẫu nhiên, nên đây chưa phải bằng chứng có quy luật.`;
}
