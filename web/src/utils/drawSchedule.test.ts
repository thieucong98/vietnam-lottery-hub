import {
  countdownTo,
  drawTimeOn,
  formatCountdown,
  formatDrawDays,
  formatVnDate,
  isDrawDay,
  isValidDate,
  nextDrawTime,
  previousDrawDate,
  upcomingDrawDates,
  vnDateString,
} from './drawSchedule';

// 2026-11-12 là Thứ Năm
const vn = (date: string, time: string) => new Date(`${date}T${time}:00+07:00`);

describe('vnDateString', () => {
  it('đổi sang ngày theo giờ Việt Nam', () => {
    expect(vnDateString(new Date('2026-11-12T16:59:00Z'))).toBe('2026-11-12');
    expect(vnDateString(new Date('2026-11-12T17:00:00Z'))).toBe('2026-11-13');
  });
});

describe('isDrawDay', () => {
  it('khớp ngày quay thật trong dữ liệu', () => {
    expect(isDrawDay('vietlott_655', '2026-11-10')).toBe(true); // Thứ Ba, kỳ 01422
    expect(isDrawDay('vietlott_645', '2026-11-11')).toBe(true); // Thứ Tư, kỳ 01587
    expect(isDrawDay('vietlott_645', '2026-11-10')).toBe(false);
    expect(isDrawDay('xsmb', '2026-11-10')).toBe(true);
  });
  it('từ chối ngày không hợp lệ', () => {
    expect(isValidDate('2026-02-30')).toBe(false);
    expect(isDrawDay('xsmb', '2026-13-01')).toBe(false);
  });
});

describe('nextDrawTime', () => {
  it('kỳ trong ngày nếu chưa tới giờ quay', () => {
    expect(nextDrawTime('vietlott_655', vn('2026-11-12', '10:00'))).toEqual(vn('2026-11-12', '18:00'));
    expect(nextDrawTime('xsmb', vn('2026-11-12', '18:14'))).toEqual(vn('2026-11-12', '18:15'));
  });
  it('sang kỳ sau khi đã qua giờ quay', () => {
    expect(nextDrawTime('vietlott_655', vn('2026-11-12', '18:00'))).toEqual(vn('2026-11-14', '18:00'));
    expect(nextDrawTime('vietlott_645', vn('2026-11-12', '20:00'))).toEqual(vn('2026-11-13', '18:00'));
    expect(nextDrawTime('xsmb', vn('2026-11-12', '23:30'))).toEqual(vn('2026-11-13', '18:15'));
  });
  it('qua tuần mới', () => {
    expect(nextDrawTime('vietlott_655', vn('2026-11-14', '19:00'))).toEqual(vn('2026-11-17', '18:00'));
  });
});

describe('upcomingDrawDates / previousDrawDate', () => {
  it('liệt kê ngày quay', () => {
    expect(upcomingDrawDates('vietlott_645', '2026-11-12', 3)).toEqual(['2026-11-13', '2026-11-15', '2026-11-18']);
    expect(upcomingDrawDates('vietlott_655', '2026-11-12', 1)).toEqual(['2026-11-12']);
  });
  it('ngày quay gần nhất trước đó', () => {
    expect(previousDrawDate('vietlott_655', '2026-11-13')).toBe('2026-11-12');
    expect(previousDrawDate('vietlott_645', '2026-11-12')).toBe('2026-11-11');
  });
});

describe('định dạng', () => {
  it('đếm ngược', () => {
    const c = countdownTo(vn('2026-11-14', '18:00'), vn('2026-11-13', '11:54'));
    expect(c.days).toBe(1);
    expect(formatCountdown(c)).toBe('1 ngày 06:06:00');
    expect(formatCountdown(countdownTo(vn('2026-11-12', '18:00'), vn('2026-11-12', '19:00')))).toBe('00:00:00');
  });
  it('ngày và lịch', () => {
    expect(formatVnDate('2026-11-14')).toBe('Thứ Bảy, 14/11/2026');
    expect(formatDrawDays('vietlott_645')).toBe('Thứ Tư, Thứ Sáu, Chủ Nhật');
    expect(formatDrawDays('xsmb')).toBe('Hằng ngày');
    expect(drawTimeOn('xsmb', '2026-11-12').toISOString()).toBe('2026-11-12T11:15:00.000Z');
  });
});
