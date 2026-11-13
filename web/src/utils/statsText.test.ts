import { explainP, formatDate, formatP, formatPct, verdictOf } from './statsText';

describe('statsText', () => {
  it('định dạng p-value và tỷ lệ theo kiểu Việt Nam', () => {
    expect(formatP(0.3901)).toBe('0,390');
    expect(formatP(0.0004)).toBe('< 0,001');
    expect(formatPct(0.10909)).toBe('10,9%');
    expect(formatDate('2017-08-01')).toBe('01/08/2017');
  });

  it('diễn giải p >= 0,05 là dao động ngẫu nhiên', () => {
    expect(verdictOf(0.39)).toBe('noise');
    expect(explainP(0.39)).toMatch(/nằm trong dao động ngẫu nhiên/);
    expect(explainP(0.39)).toMatch(/39\/100/);
  });

  it('p < 0,05 vẫn nhắc về nhiều phép kiểm định', () => {
    expect(verdictOf(0.01)).toBe('notable');
    expect(explainP(0.01)).toMatch(/chưa phải bằng chứng/);
  });
});
