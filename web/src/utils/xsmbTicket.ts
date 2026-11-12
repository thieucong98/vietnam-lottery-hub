/**
 * Dò vé XSKT miền Bắc (vé 5 chữ số, mệnh giá 10.000đ) theo cơ cấu giải. Hàm thuần, test trong xsmbTicket.test.ts.
 *
 * Cơ cấu giải và giá trị: bảng công bố năm 2022 (VOV, 14/09/2022, trích ở trang Wikipedia "Xổ số kiến thiết miền Bắc").
 * Giá trị chỉ để tham khảo; vé trúng phải đối chiếu với kết quả và quy định của công ty xổ số phát hành.
 * Dữ liệu crawler không có ký hiệu vé, nên vé trùng 5 số Giải Đặc Biệt được báo là "Đặc Biệt hoặc phụ Đặc Biệt".
 */

export type XsmbTier = 'special' | 'prize1' | 'prize2' | 'prize3' | 'prize4' | 'prize5' | 'prize6' | 'prize7' | 'consolation';

export interface XsmbTierSpec {
  tier: XsmbTier;
  label: string;
  /** Số chữ số cuối của vé phải trùng */
  digits: number;
  /** Giá trị một giải (đồng), vé 10.000đ */
  value: number;
  rule: string;
}

export const XSMB_TICKET_PRICE = 10_000;
export const XSMB_SPECIAL_SUB_VALUE = 25_000_000;

export const XSMB_TIERS: XsmbTierSpec[] = [
  { tier: 'special', label: 'Giải Đặc Biệt', digits: 5, value: 500_000_000, rule: 'Trùng 5 số và ký hiệu của Giải Đặc Biệt' },
  { tier: 'prize1', label: 'Giải Nhất', digits: 5, value: 10_000_000, rule: 'Trùng 5 số của Giải Nhất' },
  { tier: 'prize2', label: 'Giải Nhì', digits: 5, value: 5_000_000, rule: 'Trùng 5 số của một trong 2 Giải Nhì' },
  { tier: 'prize3', label: 'Giải Ba', digits: 5, value: 1_000_000, rule: 'Trùng 5 số của một trong 6 Giải Ba' },
  { tier: 'prize4', label: 'Giải Tư', digits: 4, value: 400_000, rule: 'Trùng 4 số cuối của một trong 4 Giải Tư' },
  { tier: 'prize5', label: 'Giải Năm', digits: 4, value: 200_000, rule: 'Trùng 4 số cuối của một trong 6 Giải Năm' },
  { tier: 'prize6', label: 'Giải Sáu', digits: 3, value: 100_000, rule: 'Trùng 3 số cuối của một trong 3 Giải Sáu' },
  { tier: 'prize7', label: 'Giải Bảy', digits: 2, value: 40_000, rule: 'Trùng 2 số cuối của một trong 4 Giải Bảy' },
  {
    tier: 'consolation',
    label: 'Giải Khuyến Khích',
    digits: 2,
    value: 40_000,
    rule: 'Trùng 2 số cuối của Giải Đặc Biệt (không tính vé đã trùng 5 số Giải Đặc Biệt)',
  },
];

const TIER_BY_ID = Object.fromEntries(XSMB_TIERS.map((t) => [t.tier, t])) as Record<XsmbTier, XsmbTierSpec>;

/** Khóa trong raw_prizes ứng với từng hạng giải (special, prize1, prize2_1, ...) */
function tierOfKey(key: string): XsmbTier | null {
  if (key === 'special') return 'special';
  const m = /^prize([1-7])(?:_\d+)?$/.exec(key);
  return m ? (`prize${m[1]}` as XsmbTier) : null;
}

export interface XsmbWin {
  tier: XsmbTier;
  label: string;
  /** Số trúng thưởng đã đủ chữ số (ví dụ 00972) */
  winningNumber: string;
  value: number;
  /** Vé trùng 5 số Giải Đặc Biệt: cần đối chiếu ký hiệu để biết là ĐB hay phụ ĐB */
  needsSeriesCheck?: boolean;
}

export interface XsmbTicketResult {
  ticket: string;
  wins: XsmbWin[];
  /** Tổng giá trị tối thiểu (vé trùng 5 số ĐB tính theo giải phụ Đặc Biệt) */
  minTotal: number;
}

const pad = (value: unknown, width: number) => String(value ?? '').padStart(width, '0');

export const isXsmbTicket = (ticket: string) => /^\d{5}$/.test(ticket);

/** Đối chiếu một vé 5 chữ số với 27 giải của một kỳ. Một vé trúng nhiều giải được tính đủ các giải. */
export function checkXsmbTicket(ticket: string, rawPrizes: Record<string, unknown>): XsmbTicketResult {
  if (!isXsmbTicket(ticket)) throw new Error(`Vé XSMB phải có đúng 5 chữ số: ${ticket}`);
  const wins: XsmbWin[] = [];
  let special: string | null = null;

  for (const [key, raw] of Object.entries(rawPrizes)) {
    const tier = tierOfKey(key);
    if (!tier || raw === null || raw === undefined || raw === '') continue;
    const spec = TIER_BY_ID[tier];
    const winningNumber = pad(raw, tierWidth(tier));
    if (tier === 'special') special = winningNumber;
    if (ticket.slice(-spec.digits) !== winningNumber.slice(-spec.digits)) continue;
    wins.push(
      tier === 'special'
        ? { tier, label: 'Giải Đặc Biệt hoặc phụ Đặc Biệt', winningNumber, value: XSMB_SPECIAL_SUB_VALUE, needsSeriesCheck: true }
        : { tier, label: spec.label, winningNumber, value: spec.value }
    );
  }

  const hasSpecial = wins.some((w) => w.tier === 'special');
  if (special && !hasSpecial && ticket.slice(-2) === special.slice(-2)) {
    const spec = TIER_BY_ID.consolation;
    wins.push({ tier: 'consolation', label: spec.label, winningNumber: special, value: spec.value });
  }

  const order = XSMB_TIERS.map((t) => t.tier);
  wins.sort((a, b) => order.indexOf(a.tier) - order.indexOf(b.tier));
  return { ticket, wins, minTotal: wins.reduce((sum, w) => sum + w.value, 0) };
}

/** Số chữ số in trên kết quả của từng giải: ĐB-Ba 5 số, Tư-Năm 4 số, Sáu 3 số, Bảy 2 số */
function tierWidth(tier: XsmbTier): number {
  switch (tier) {
    case 'prize4':
    case 'prize5':
      return 4;
    case 'prize6':
      return 3;
    case 'prize7':
      return 2;
    default:
      return 5;
  }
}

export interface ParsedXsmbTickets {
  tickets: string[];
  /** Các chuỗi không phải vé 5 chữ số */
  invalid: string[];
  duplicates: number;
}

export const MAX_TICKETS_PER_CHECK = 50;

/** Tách danh sách vé người dùng dán vào (cách nhau bởi khoảng trắng, dấu phẩy, xuống dòng...). */
export function parseXsmbTickets(text: string, limit = MAX_TICKETS_PER_CHECK): ParsedXsmbTickets {
  const tokens = text.split(/[^0-9]+/).filter(Boolean);
  const invalidRaw = text
    .split(/[\s,;|]+/)
    .map((t) => t.trim())
    .filter((t) => t && !/^\d{5}$/.test(t));
  const seen = new Set<string>();
  const tickets: string[] = [];
  let duplicates = 0;
  for (const t of tokens) {
    if (!isXsmbTicket(t)) continue;
    if (seen.has(t)) {
      duplicates++;
      continue;
    }
    seen.add(t);
    if (tickets.length < limit) tickets.push(t);
  }
  return { tickets, invalid: Array.from(new Set(invalidRaw)), duplicates };
}
