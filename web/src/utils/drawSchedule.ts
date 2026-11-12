/**
 * Lịch quay số theo giờ Việt Nam (UTC+7, không có giờ mùa hè). Hàm thuần, có test trong drawSchedule.test.ts.
 *
 * Nguồn lịch: trang kết quả vietlott.vn ("18h00 – 18h30 Thứ 3 - Thứ 5 - Thứ 7" cho Power 6/55) và
 * ngày quay thực tế trong data/vietlott/*.jsonl; XSMB quay 18h15 hằng ngày, đài theo thứ (data/xsmbDraws.ts).
 */
export type ScheduledGame = 'xsmb' | 'vietlott_655' | 'vietlott_645' | 'max3d' | 'max3d_pro';

export interface GameSchedule {
  label: string;
  /** Thứ trong tuần có quay (0 = Chủ Nhật) */
  days: number[];
  hour: number;
  minute: number;
}

export const DRAW_SCHEDULES: Record<ScheduledGame, GameSchedule> = {
  xsmb: { label: 'XSKT miền Bắc', days: [0, 1, 2, 3, 4, 5, 6], hour: 18, minute: 15 },
  vietlott_655: { label: 'Power 6/55', days: [2, 4, 6], hour: 18, minute: 0 },
  vietlott_645: { label: 'Mega 6/45', days: [0, 3, 5], hour: 18, minute: 0 },
  max3d: { label: 'Max 3D', days: [1, 3, 5], hour: 18, minute: 0 },
  max3d_pro: { label: 'Max 3D Pro', days: [2, 4, 6], hour: 18, minute: 0 },
};

export const WEEKDAY_LABELS = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];

const VN_OFFSET_MS = 7 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

const pad2 = (n: number) => String(n).padStart(2, '0');

/** Ngày theo giờ Việt Nam, dạng YYYY-MM-DD */
export function vnDateString(at: Date = new Date()): string {
  const vn = new Date(at.getTime() + VN_OFFSET_MS);
  return `${vn.getUTCFullYear()}-${pad2(vn.getUTCMonth() + 1)}-${pad2(vn.getUTCDate())}`;
}

/** Thứ trong tuần của một ngày YYYY-MM-DD (0 = Chủ Nhật); -1 nếu sai định dạng */
export function weekdayOf(date: string): number {
  const m = DATE_RE.exec(date);
  if (!m) return -1;
  return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])).getUTCDay();
}

export function isValidDate(date: string): boolean {
  const m = DATE_RE.exec(date);
  if (!m) return false;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return d.getUTCFullYear() === +m[1] && d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3];
}

export function isDrawDay(game: ScheduledGame, date: string): boolean {
  return isValidDate(date) && DRAW_SCHEDULES[game].days.includes(weekdayOf(date));
}

function addDays(date: string, days: number): string {
  const m = DATE_RE.exec(date)!;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]) + days * DAY_MS);
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
}

/** Thời điểm quay (UTC) của ngày YYYY-MM-DD theo lịch của trò chơi */
export function drawTimeOn(game: ScheduledGame, date: string): Date {
  const m = DATE_RE.exec(date)!;
  const { hour, minute } = DRAW_SCHEDULES[game];
  return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], hour, minute) - VN_OFFSET_MS);
}

/** Kỳ quay kế tiếp sau thời điểm `now` (nếu đúng giờ quay thì tính kỳ sau) */
export function nextDrawTime(game: ScheduledGame, now: Date = new Date()): Date {
  const today = vnDateString(now);
  for (let i = 0; i <= 7; i++) {
    const date = addDays(today, i);
    if (!isDrawDay(game, date)) continue;
    const at = drawTimeOn(game, date);
    if (at.getTime() > now.getTime()) return at;
  }
  // Không xảy ra với lịch có ít nhất một ngày quay mỗi tuần
  throw new Error(`Không có lịch quay cho ${game}`);
}

/** Các ngày quay từ `fromDate` (tính cả ngày đó nếu có quay), tối đa `count` ngày */
export function upcomingDrawDates(game: ScheduledGame, fromDate: string, count: number): string[] {
  const out: string[] = [];
  if (!isValidDate(fromDate)) return out;
  for (let i = 0; out.length < count && i < count * 7 + 7; i++) {
    const date = addDays(fromDate, i);
    if (isDrawDay(game, date)) out.push(date);
  }
  return out;
}

/** Ngày quay gần nhất trước hoặc bằng `date` */
export function previousDrawDate(game: ScheduledGame, date: string): string | null {
  if (!isValidDate(date)) return null;
  for (let i = 0; i <= 7; i++) {
    const d = addDays(date, -i);
    if (isDrawDay(game, d)) return d;
  }
  return null;
}

export interface Countdown {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
}

export function countdownTo(target: Date, now: Date = new Date()): Countdown {
  const totalMs = Math.max(0, target.getTime() - now.getTime());
  const totalSeconds = Math.floor(totalMs / 1000);
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    totalMs,
  };
}

/** "1 ngày 06:05:09" hoặc "06:05:09" */
export function formatCountdown(c: Countdown): string {
  const clock = `${pad2(c.hours)}:${pad2(c.minutes)}:${pad2(c.seconds)}`;
  return c.days > 0 ? `${c.days} ngày ${clock}` : clock;
}

/** "Thứ Bảy, 14/11/2026" */
export function formatVnDate(date: string): string {
  const m = DATE_RE.exec(date);
  if (!m) return date;
  return `${WEEKDAY_LABELS[weekdayOf(date)]}, ${m[3]}/${m[2]}/${m[1]}`;
}

/** Giờ quay dạng "18:15" */
export function formatDrawClock(game: ScheduledGame): string {
  const { hour, minute } = DRAW_SCHEDULES[game];
  return `${pad2(hour)}:${pad2(minute)}`;
}

/** "Thứ Ba, Thứ Năm, Thứ Bảy" hoặc "Hằng ngày" */
export function formatDrawDays(game: ScheduledGame): string {
  const { days } = DRAW_SCHEDULES[game];
  if (days.length === 7) return 'Hằng ngày';
  // Thứ Hai trước, Chủ Nhật cuối như cách viết thông thường
  return [...days].sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7)).map((d) => WEEKDAY_LABELS[d]).join(', ');
}
