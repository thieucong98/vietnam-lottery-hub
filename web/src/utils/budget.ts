/**
 * Sổ chi tiêu và ngân sách tháng tự đặt (công cụ chơi có trách nhiệm). Dữ liệu chỉ lưu trên máy (localStorage).
 * Hàm thuần, test trong budget.test.ts.
 */
import { isValidDate } from './drawSchedule';

export interface SpendEntry {
  id: string;
  /** YYYY-MM-DD */
  date: string;
  /** Đồng */
  amount: number;
  note?: string;
}

export interface BudgetState {
  version: 1;
  /** Ngân sách tháng (đồng); null = chưa đặt */
  monthlyLimit: number | null;
  entries: SpendEntry[];
}

export const EMPTY_BUDGET: BudgetState = { version: 1, monthlyLimit: null, entries: [] };
/** Mức cảnh báo sớm (tỷ lệ ngân sách đã dùng) */
export const WARNING_RATIO = 0.8;
export const MAX_AMOUNT = 1_000_000_000;
const MAX_ENTRIES = 5000;
const MAX_NOTE = 80;

export type BudgetLevel = 'none' | 'ok' | 'warning' | 'reached' | 'exceeded';

export interface MonthSummary {
  month: string;
  spent: number;
  limit: number | null;
  remaining: number | null;
  /** spent / limit; null khi chưa đặt ngân sách */
  ratio: number | null;
  level: BudgetLevel;
  entries: SpendEntry[];
}

export const monthKey = (date: string) => date.slice(0, 7);

export function budgetLevel(spent: number, limit: number | null): BudgetLevel {
  if (!limit || limit <= 0) return 'none';
  if (spent > limit) return 'exceeded';
  if (spent === limit) return 'reached';
  if (spent >= limit * WARNING_RATIO) return 'warning';
  return 'ok';
}

export function summarizeMonth(state: BudgetState, month: string): MonthSummary {
  const entries = state.entries.filter((e) => monthKey(e.date) === month).sort((a, b) => b.date.localeCompare(a.date));
  const spent = entries.reduce((sum, e) => sum + e.amount, 0);
  const limit = state.monthlyLimit && state.monthlyLimit > 0 ? state.monthlyLimit : null;
  return {
    month,
    spent,
    limit,
    remaining: limit === null ? null : limit - spent,
    ratio: limit === null ? null : spent / limit,
    level: budgetLevel(spent, limit),
    entries,
  };
}

/** Mức ngân sách sau khi thêm một khoản (để cảnh báo trước khi ghi) */
export function levelAfterAdding(state: BudgetState, date: string, amount: number): BudgetLevel {
  const { spent, limit } = summarizeMonth(state, monthKey(date));
  return budgetLevel(spent + amount, limit);
}

/** Tổng chi tiêu của `count` tháng gần nhất tính tới `month`, tháng mới nhất trước */
export function monthlyTotals(state: BudgetState, month: string, count: number): { month: string; spent: number }[] {
  const [y, m] = month.split('-').map(Number);
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(Date.UTC(y, m - 1 - i, 1));
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
    return { month: key, spent: summarizeMonth(state, key).spent };
  });
}

/** "50.000", "50000", "50 000đ" -> 50000; null nếu không hợp lệ */
export function parseAmount(text: string): number | null {
  const digits = text.replace(/[\s.,_đ₫]|vnd/gi, '');
  if (!/^\d+$/.test(digits)) return null;
  const n = parseInt(digits, 10);
  return n > 0 && n <= MAX_AMOUNT ? n : null;
}

export const newId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export function addEntry(state: BudgetState, entry: Omit<SpendEntry, 'id'>): BudgetState {
  const clean = sanitizeEntry({ ...entry, id: newId() });
  if (!clean) throw new Error('Khoản chi không hợp lệ');
  return { ...state, entries: [clean, ...state.entries].slice(0, MAX_ENTRIES) };
}

export function removeEntry(state: BudgetState, id: string): BudgetState {
  return { ...state, entries: state.entries.filter((e) => e.id !== id) };
}

export function setMonthlyLimit(state: BudgetState, limit: number | null): BudgetState {
  return { ...state, monthlyLimit: limit && limit > 0 && limit <= MAX_AMOUNT ? Math.round(limit) : null };
}

function sanitizeEntry(raw: unknown): SpendEntry | null {
  if (!raw || typeof raw !== 'object') return null;
  const e = raw as Record<string, unknown>;
  const amount = typeof e.amount === 'number' ? Math.round(e.amount) : NaN;
  if (typeof e.date !== 'string' || !isValidDate(e.date)) return null;
  if (!Number.isFinite(amount) || amount <= 0 || amount > MAX_AMOUNT) return null;
  const note = typeof e.note === 'string' && e.note.trim() ? e.note.trim().slice(0, MAX_NOTE) : undefined;
  return { id: typeof e.id === 'string' && e.id ? e.id.slice(0, 40) : newId(), date: e.date, amount, ...(note ? { note } : {}) };
}

/** Đọc dữ liệu đã lưu, bỏ phần hỏng thay vì làm hỏng cả trang */
export function sanitizeBudget(raw: unknown): BudgetState {
  if (!raw || typeof raw !== 'object') return EMPTY_BUDGET;
  const r = raw as Record<string, unknown>;
  const limit = typeof r.monthlyLimit === 'number' ? r.monthlyLimit : null;
  const entries = Array.isArray(r.entries) ? r.entries.map(sanitizeEntry).filter((e): e is SpendEntry => e !== null) : [];
  return setMonthlyLimit({ version: 1, monthlyLimit: null, entries: entries.slice(0, MAX_ENTRIES) }, limit);
}
