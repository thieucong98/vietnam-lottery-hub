/**
 * "Vé của tôi": vé người dùng lưu trên máy (localStorage), xuất/nhập file JSON, lệnh dò vé cho Telegram bot.
 * Không có tài khoản, không gửi dữ liệu đi đâu. Hàm thuần, test trong myTickets.test.ts.
 */
import { isValidDate } from './drawSchedule';
import { isXsmbTicket } from './xsmbTicket';
import { parseVietlottTicket, VIETLOTT_GAME_LABEL } from './vietlottTicket';
import type { VietlottGameId } from './ticketCheck';

export type TicketGame = 'xsmb' | VietlottGameId;

export interface SavedTicket {
  id: string;
  game: TicketGame;
  /** XSMB: "74129"; Vietlott: "01-02-21-38-39-51" (đã sắp xếp) */
  numbers: string;
  /** Ngày quay của vé, YYYY-MM-DD */
  drawDate: string;
  label?: string;
  createdAt: string;
  /** Lần đầu người dùng xem kết quả của vé (để không nhắc lại) */
  seenAt?: string;
}

export const TICKET_GAMES: TicketGame[] = ['xsmb', 'vietlott_655', 'vietlott_645'];
export const TICKET_GAME_LABEL: Record<TicketGame, string> = { xsmb: 'XSMB', ...VIETLOTT_GAME_LABEL };
/** Mã trò chơi dùng trong file xuất và lệnh Telegram */
export const TICKET_GAME_CODE: Record<TicketGame, string> = { xsmb: 'xsmb', vietlott_655: '655', vietlott_645: '645' };
export const MAX_SAVED_TICKETS = 500;
export const MAX_IMPORT_BYTES = 512 * 1024;
const MAX_LABEL = 40;

export const EXPORT_FORMAT = 'vietnam-lottery-hub/my-tickets';

const newId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
const pad2 = (n: number) => String(n).padStart(2, '0');

export function gameFromCode(code: string): TicketGame | null {
  const c = code.trim().toLowerCase();
  if (c === 'xsmb' || c === 'mb') return 'xsmb';
  if (c === '655' || c === 'power' || c === 'vietlott_655') return 'vietlott_655';
  if (c === '645' || c === 'mega' || c === 'vietlott_645') return 'vietlott_645';
  return null;
}

/** Chuẩn hóa số trên vé; trả lỗi bằng tiếng Việt nếu không hợp lệ */
export function normalizeTicketNumbers(game: TicketGame, input: string): { numbers: string } | { error: string } {
  if (game === 'xsmb') {
    const digits = input.replace(/\s+/g, '');
    return isXsmbTicket(digits) ? { numbers: digits } : { error: 'Vé XSMB cần đúng 5 chữ số' };
  }
  const parsed = parseVietlottTicket(input, game);
  if (parsed.error) return { error: parsed.error };
  return { numbers: parsed.balls.map(pad2).join('-') };
}

export const ticketBalls = (t: SavedTicket) => t.numbers.split('-').map((n) => parseInt(n, 10));

const ticketKey = (t: Pick<SavedTicket, 'game' | 'numbers' | 'drawDate'>) => `${t.game}|${t.numbers}|${t.drawDate}`;

export function createTicket(
  game: TicketGame,
  input: string,
  drawDate: string,
  label?: string,
  now: Date = new Date()
): SavedTicket | { error: string } {
  if (!isValidDate(drawDate)) return { error: 'Ngày quay không hợp lệ' };
  const n = normalizeTicketNumbers(game, input);
  if ('error' in n) return n;
  const cleanLabel = label?.trim().slice(0, MAX_LABEL);
  return { id: newId(), game, numbers: n.numbers, drawDate, createdAt: now.toISOString(), ...(cleanLabel ? { label: cleanLabel } : {}) };
}

/** Thêm vé, bỏ vé trùng (cùng trò chơi, cùng số, cùng ngày quay). Vé mới đứng đầu. */
export function addTickets(list: SavedTicket[], tickets: SavedTicket[]): { list: SavedTicket[]; added: number; duplicates: number } {
  const keys = new Set(list.map(ticketKey));
  const fresh: SavedTicket[] = [];
  let duplicates = 0;
  for (const t of tickets) {
    const k = ticketKey(t);
    if (keys.has(k)) {
      duplicates++;
      continue;
    }
    keys.add(k);
    fresh.push(t);
  }
  const room = Math.max(0, MAX_SAVED_TICKETS - list.length);
  const accepted = fresh.slice(0, room);
  return { list: [...accepted, ...list], added: accepted.length, duplicates: duplicates + (fresh.length - accepted.length) };
}

export const removeTicket = (list: SavedTicket[], id: string) => list.filter((t) => t.id !== id);

export function markSeen(list: SavedTicket[], ids: string[], now: Date = new Date()): SavedTicket[] {
  const set = new Set(ids);
  let changed = false;
  const next = list.map((t) => {
    if (!set.has(t.id) || t.seenAt) return t;
    changed = true;
    return { ...t, seenAt: now.toISOString() };
  });
  return changed ? next : list;
}

function sanitizeTicket(raw: unknown): SavedTicket | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const game = typeof r.game === 'string' ? gameFromCode(r.game) : null;
  if (!game || typeof r.numbers !== 'string' || typeof r.drawDate !== 'string' || !isValidDate(r.drawDate)) return null;
  const n = normalizeTicketNumbers(game, r.numbers.replace(/-/g, ' '));
  if ('error' in n) return null;
  const createdAt = typeof r.createdAt === 'string' && !isNaN(Date.parse(r.createdAt)) ? r.createdAt : new Date().toISOString();
  const label = typeof r.label === 'string' && r.label.trim() ? r.label.trim().slice(0, MAX_LABEL) : undefined;
  const seenAt = typeof r.seenAt === 'string' && !isNaN(Date.parse(r.seenAt)) ? r.seenAt : undefined;
  return {
    id: typeof r.id === 'string' && r.id ? r.id.slice(0, 40) : newId(),
    game,
    numbers: n.numbers,
    drawDate: r.drawDate,
    createdAt,
    ...(label ? { label } : {}),
    ...(seenAt ? { seenAt } : {}),
  };
}

/** Đọc danh sách vé đã lưu, bỏ phần hỏng */
export function sanitizeTickets(raw: unknown): SavedTicket[] {
  if (!Array.isArray(raw)) return [];
  return addTickets([], raw.map(sanitizeTicket).filter((t): t is SavedTicket => t !== null)).list;
}

export function exportTickets(list: SavedTicket[], now: Date = new Date()): string {
  return JSON.stringify(
    {
      format: EXPORT_FORMAT,
      version: 1,
      exportedAt: now.toISOString(),
      tickets: list.map(({ seenAt: _seenAt, ...t }) => ({ ...t, game: TICKET_GAME_CODE[t.game] })),
    },
    null,
    2
  );
}

export interface ImportResult {
  list: SavedTicket[];
  added: number;
  duplicates: number;
  invalid: number;
  error?: string;
}

/** Nhập file JSON do exportTickets tạo (hoặc một mảng vé). Gộp với danh sách hiện có. */
export function importTickets(text: string, existing: SavedTicket[]): ImportResult {
  const fail = (error: string): ImportResult => ({ list: existing, added: 0, duplicates: 0, invalid: 0, error });
  if (text.length > MAX_IMPORT_BYTES) return fail('File quá lớn (tối đa 512 KB)');
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return fail('File không phải JSON hợp lệ');
  }
  const rawList = Array.isArray(parsed)
    ? parsed
    : parsed && typeof parsed === 'object' && Array.isArray((parsed as Record<string, unknown>).tickets)
      ? ((parsed as Record<string, unknown>).tickets as unknown[])
      : null;
  if (!rawList) return fail('Không tìm thấy danh sách vé trong file');
  const valid = rawList.map(sanitizeTicket).filter((t): t is SavedTicket => t !== null);
  const merged = addTickets(existing, valid);
  return { list: merged.list, added: merged.added, duplicates: merged.duplicates, invalid: rawList.length - valid.length };
}

/** Ngày quay mới nhất có kết quả của từng trò chơi (từ summary.json) */
export type LatestDates = Partial<Record<TicketGame, string>>;

export type TicketStatus = 'waiting' | 'ready';

export const ticketStatus = (t: SavedTicket, latest: LatestDates): TicketStatus => {
  const last = latest[t.game];
  return last && t.drawDate <= last ? 'ready' : 'waiting';
};

/** Vé đã có kết quả nhưng người dùng chưa xem */
export const unseenResults = (list: SavedTicket[], latest: LatestDates) =>
  list.filter((t) => !t.seenAt && ticketStatus(t, latest) === 'ready');

/** Lệnh gửi cho Telegram bot để dò các vé (bot không lưu vé) */
export function telegramCommand(list: SavedTicket[]): string {
  const lines = list.map((t) => `${TICKET_GAME_CODE[t.game]} ${t.drawDate} ${t.game === 'xsmb' ? t.numbers : t.numbers.replace(/-/g, ' ')}`);
  return ['/dove', ...lines].join('\n');
}
