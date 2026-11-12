/**
 * Chọn số ngẫu nhiên có tùy chọn (Quick Pick) và nhận diện bộ số phổ biến.
 *
 * Mọi bộ số k số có cùng xác suất trúng. Các tùy chọn ở đây chỉ giới hạn tập bộ số được
 * chọn; trong tập đó, mỗi bộ có cùng khả năng được chọn (lấy mẫu loại bỏ).
 */

/** Hàm sinh số ngẫu nhiên trong [0, 1) */
export type RandomSource = () => number;

/** Nguồn ngẫu nhiên mật mã của trình duyệt; dự phòng Math.random nếu không có */
export const secureRandom: RandomSource = () => {
  const c = globalThis.crypto;
  if (c?.getRandomValues) {
    const buf = new Uint32Array(1);
    c.getRandomValues(buf);
    return buf[0] / 2 ** 32;
  }
  return Math.random();
};

/** Chọn ngẫu nhiên `count` phần tử khác nhau từ `pool` (Fisher-Yates từng phần) */
export function sampleWithoutReplacement<T>(pool: readonly T[], count: number, rand: RandomSource = secureRandom): T[] {
  const arr = [...pool];
  const n = Math.min(count, arr.length);
  for (let i = 0; i < n; i++) {
    const j = i + Math.floor(rand() * (arr.length - i));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, n);
}

// ---------- Bộ số phổ biến (ảnh hưởng tới việc chia Jackpot, không ảnh hưởng xác suất trúng) ----------

export type PopularPattern = 'birthday' | 'consecutive' | 'arithmetic' | 'same_decade' | 'same_last_digit' | 'repeat_last_draw';

export const POPULAR_PATTERN_LABELS: Record<PopularPattern, string> = {
  birthday: 'Toàn bộ số từ 1 đến 31 (hay được chọn theo ngày sinh, ngày kỷ niệm)',
  consecutive: 'Có 3 số liên tiếp trở lên (ví dụ 07-08-09)',
  arithmetic: 'Cả bộ cách đều nhau (ví dụ 05-10-15-20-25-30)',
  same_decade: 'Từ 4 số trở lên cùng hàng chục (ví dụ 20-29)',
  same_last_digit: 'Từ 4 số trở lên cùng chữ số cuối (ví dụ 03-13-23-33)',
  repeat_last_draw: 'Trùng từ 4 số trở lên với kỳ vừa quay',
};

export function popularPatterns(numbers: readonly number[], lastDraw: readonly number[] = []): PopularPattern[] {
  const nums = [...numbers].sort((a, b) => a - b);
  if (nums.length === 0) return [];
  const found: PopularPattern[] = [];

  if (nums.every((n) => n <= 31)) found.push('birthday');

  let run = 1;
  let longest = 1;
  for (let i = 1; i < nums.length; i++) {
    run = nums[i] === nums[i - 1] + 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
  }
  if (longest >= 3) found.push('consecutive');

  if (nums.length >= 3) {
    const step = nums[1] - nums[0];
    if (nums.every((n, i) => i === 0 || n - nums[i - 1] === step)) found.push('arithmetic');
  }

  const maxGroup = (key: (n: number) => number) => {
    const counts = new Map<number, number>();
    nums.forEach((n) => counts.set(key(n), (counts.get(key(n)) ?? 0) + 1));
    return Math.max(...counts.values());
  };
  if (maxGroup((n) => Math.floor(n / 10)) >= 4) found.push('same_decade');
  if (maxGroup((n) => n % 10) >= 4) found.push('same_last_digit');

  if (lastDraw.length) {
    const last = new Set(lastDraw);
    if (nums.filter((n) => last.has(n)).length >= 4) found.push('repeat_last_draw');
  }
  return found;
}

// ---------- Quick Pick có tùy chọn ----------

export interface QuickPickOptions {
  maxNumber: number;
  /** Số lượng số mỗi bộ (mặc định 6) */
  count?: number;
  /** Số người dùng ghim (luôn có trong bộ) */
  pinned?: readonly number[];
  /** Số người dùng không muốn chọn */
  excluded?: readonly number[];
  /** Tổng các số nằm trong [min, max] */
  sumRange?: readonly [number, number] | null;
  /** Đúng bao nhiêu số chẵn */
  evenCount?: number | null;
  /** Loại các bộ có mẫu phổ biến (xem popularPatterns) */
  avoidPopular?: boolean;
  /** Kỳ vừa quay, dùng cho mẫu "trùng kỳ vừa quay" */
  lastDraw?: readonly number[];
}

export type QuickPickResult = { ok: true; numbers: number[]; attempts: number } | { ok: false; reason: string };

export function validateQuickPick(opts: QuickPickOptions): string | null {
  const count = opts.count ?? 6;
  const pinned = new Set(opts.pinned ?? []);
  const excluded = new Set(opts.excluded ?? []);
  if ([...pinned].some((n) => excluded.has(n))) return 'Một số vừa được ghim vừa bị loại.';
  if (pinned.size > count) return `Chỉ ghim được tối đa ${count} số.`;
  const available = opts.maxNumber - excluded.size - pinned.size;
  if (available < count - pinned.size) return `Còn quá ít số để chọn (${Math.max(0, available)} số khả dụng).`;
  if (opts.evenCount != null) {
    if (opts.evenCount < 0 || opts.evenCount > count) return `Số lượng số chẵn phải từ 0 đến ${count}.`;
    const pinnedEven = [...pinned].filter((n) => n % 2 === 0).length;
    if (pinnedEven > opts.evenCount || pinned.size - pinnedEven > count - opts.evenCount) {
      return 'Số đã ghim không khớp với số lượng chẵn/lẻ đã chọn.';
    }
  }
  if (opts.sumRange) {
    const [lo, hi] = opts.sumRange;
    const minSum = (count * (count + 1)) / 2;
    const maxSum = count * opts.maxNumber - (count * (count - 1)) / 2;
    if (lo > hi) return 'Tổng nhỏ nhất phải không lớn hơn tổng lớn nhất.';
    if (hi < minSum || lo > maxSum) return `Tổng của ${count} số chỉ nằm trong khoảng ${minSum}-${maxSum}.`;
  }
  return null;
}

export function quickPick(opts: QuickPickOptions, rand: RandomSource = secureRandom, maxAttempts = 50_000): QuickPickResult {
  const invalid = validateQuickPick(opts);
  if (invalid) return { ok: false, reason: invalid };

  const count = opts.count ?? 6;
  const pinned = [...new Set(opts.pinned ?? [])];
  const excluded = new Set(opts.excluded ?? []);
  const pool = Array.from({ length: opts.maxNumber }, (_, i) => i + 1).filter((n) => !excluded.has(n) && !pinned.includes(n));

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const numbers = [...pinned, ...sampleWithoutReplacement(pool, count - pinned.length, rand)].sort((a, b) => a - b);
    if (opts.sumRange) {
      const sum = numbers.reduce((a, b) => a + b, 0);
      if (sum < opts.sumRange[0] || sum > opts.sumRange[1]) continue;
    }
    if (opts.evenCount != null && numbers.filter((n) => n % 2 === 0).length !== opts.evenCount) continue;
    if (opts.avoidPopular && popularPatterns(numbers, opts.lastDraw).length > 0) continue;
    return { ok: true, numbers, attempts: attempt };
  }
  return { ok: false, reason: 'Không tìm được bộ số thỏa mọi điều kiện. Hãy nới khoảng tổng hoặc bớt số bị loại.' };
}
