import { popularPatterns, quickPick, sampleWithoutReplacement, validateQuickPick } from './quickPick';

/** Nguồn ngẫu nhiên có seed (mulberry32) để test lặp lại được */
function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe('sampleWithoutReplacement', () => {
  it('trả đúng số phần tử, không trùng', () => {
    const out = sampleWithoutReplacement([1, 2, 3, 4, 5, 6, 7, 8], 5, seeded(1));
    expect(out).toHaveLength(5);
    expect(new Set(out).size).toBe(5);
  });
  it('mỗi số có khả năng được chọn như nhau', () => {
    const rand = seeded(2);
    const counts = new Array(10).fill(0);
    for (let i = 0; i < 20_000; i++) sampleWithoutReplacement([0, 1, 2, 3, 4, 5, 6, 7, 8, 9], 3, rand).forEach((n) => counts[n]++);
    // Kỳ vọng 6.000 mỗi số; sai lệch 5% là quá xa so với dao động ngẫu nhiên (~1%)
    counts.forEach((c) => expect(Math.abs(c - 6000)).toBeLessThan(300));
  });
});

describe('popularPatterns', () => {
  it('nhận diện bộ ngày sinh, dãy liên tiếp, cách đều', () => {
    expect(popularPatterns([1, 7, 12, 19, 25, 31])).toContain('birthday');
    expect(popularPatterns([7, 8, 9, 30, 41, 50])).toContain('consecutive');
    expect(popularPatterns([5, 10, 15, 20, 25, 30])).toEqual(expect.arrayContaining(['arithmetic', 'birthday']));
    expect(popularPatterns([20, 22, 25, 28, 40, 51])).toContain('same_decade');
    expect(popularPatterns([3, 13, 23, 33, 40, 51])).toContain('same_last_digit');
    expect(popularPatterns([3, 11, 16, 22, 35, 41], [3, 11, 16, 22, 50, 52])).toContain('repeat_last_draw');
  });
  it('bộ số trải đều không có mẫu phổ biến', () => {
    expect(popularPatterns([4, 17, 29, 36, 44, 53])).toEqual([]);
  });
});

describe('quickPick', () => {
  it('giữ số đã ghim và không chọn số bị loại', () => {
    const rand = seeded(3);
    for (let i = 0; i < 200; i++) {
      const res = quickPick({ maxNumber: 55, pinned: [7, 42], excluded: [1, 2, 3, 4, 5] }, rand);
      expect(res.ok).toBe(true);
      if (!res.ok) return;
      expect(res.numbers).toHaveLength(6);
      expect(res.numbers).toEqual(expect.arrayContaining([7, 42]));
      expect(res.numbers.some((n) => n <= 5)).toBe(false);
      expect([...res.numbers].sort((a, b) => a - b)).toEqual(res.numbers);
    }
  });

  it('tôn trọng khoảng tổng, số chẵn và tránh bộ phổ biến', () => {
    const rand = seeded(4);
    for (let i = 0; i < 100; i++) {
      const res = quickPick({ maxNumber: 45, sumRange: [120, 160], evenCount: 3, avoidPopular: true }, rand);
      expect(res.ok).toBe(true);
      if (!res.ok) return;
      const sum = res.numbers.reduce((a, b) => a + b, 0);
      expect(sum).toBeGreaterThanOrEqual(120);
      expect(sum).toBeLessThanOrEqual(160);
      expect(res.numbers.filter((n) => n % 2 === 0)).toHaveLength(3);
      expect(popularPatterns(res.numbers)).toEqual([]);
    }
  });

  it('báo lỗi khi điều kiện mâu thuẫn', () => {
    expect(validateQuickPick({ maxNumber: 55, pinned: [3], excluded: [3] })).toMatch(/ghim/);
    expect(validateQuickPick({ maxNumber: 45, sumRange: [300, 400] })).toMatch(/Tổng/);
    expect(validateQuickPick({ maxNumber: 45, pinned: [2, 4, 6], evenCount: 2 })).toMatch(/chẵn/);
    expect(validateQuickPick({ maxNumber: 10, excluded: [1, 2, 3, 4, 5] })).toMatch(/quá ít/);
    const res = quickPick({ maxNumber: 45, pinned: [3], excluded: [3] });
    expect(res.ok).toBe(false);
  });

  it('báo lỗi ngay khi số đã ghim đã thuộc bộ phổ biến mà vẫn bật tránh bộ phổ biến', () => {
    expect(validateQuickPick({ maxNumber: 55, pinned: [7, 8, 9], avoidPopular: true })).toMatch(/Số đã ghim/);
    expect(validateQuickPick({ maxNumber: 55, pinned: [1, 2, 3, 4, 5, 6], avoidPopular: true })).toMatch(/Số đã ghim/);
    // Ghim toàn số nhỏ hoặc cách đều vẫn chọn được vì số chọn thêm có thể phá mẫu
    expect(validateQuickPick({ maxNumber: 55, pinned: [5, 10, 15], avoidPopular: true })).toBeNull();
    expect(validateQuickPick({ maxNumber: 55, pinned: [7, 8, 9] })).toBeNull();
    const res = quickPick({ maxNumber: 55, pinned: [5, 10, 15], avoidPopular: true }, seeded(5));
    expect(res.ok).toBe(true);
  });
});
