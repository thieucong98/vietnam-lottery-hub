import { calcCombinations } from '../../utils/lotteryUtils';

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
