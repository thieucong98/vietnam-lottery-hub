import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { buildDataBundles, slimIndex } from './dataBundles';

describe('slimIndex', () => {
  it('bỏ các trường nặng theo từng số, giữ phần còn lại', () => {
    const slim = slimIndex({
      metadata: { latest_date: '2026-11-11' },
      top_gan: [],
      numbers: { '68': { number: '68', total_hits: 10, recent_history: [1], top_pairs: [2], yearly_distribution: { '2026': 3 } } },
    });
    expect(slim.metadata).toEqual({ latest_date: '2026-11-11' });
    expect(slim.numbers).toEqual({ '68': { number: '68', total_hits: 10 } });
  });
});

describe('buildDataBundles', () => {
  it('sinh đủ gói từ thư mục dữ liệu, bỏ qua file nguồn thiếu', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'vlh-'));
    fs.writeFileSync(
      path.join(dir, 'xsmb_index.json'),
      JSON.stringify({ metadata: {}, numbers: { '00': { number: '00', recent_history: [] }, '01': { number: '01' } } })
    );
    fs.writeFileSync(
      path.join(dir, 'vietlott_full_draws.json'),
      JSON.stringify({ metadata: { generated_at: 'x' }, vietlott_655: [{ id: '1', date: 'd', balls: [1] }], vietlott_645: [] })
    );
    const out = buildDataBundles(dir);
    expect(() => buildDataBundles(dir, { strict: true })).toThrow(/xsmb_recent_draws\.json/);
    expect([...out.keys()].sort()).toEqual([
      'detail/xsmb/00.json',
      'detail/xsmb/01.json',
      'vietlott_645_draws.json',
      'vietlott_655_draws.json',
      'xsmb_stats.json',
    ]);
    expect(JSON.parse(out.get('vietlott_655_draws.json')!).metadata.total).toBe(1);
    fs.rmSync(dir, { recursive: true });
  });

  it('báo giải XSMB thiếu hoặc không phải số khi strict', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'vlh-'));
    for (const name of ['xsmb_index.json', 'vietlott_655_index.json', 'vietlott_645_index.json']) {
      fs.writeFileSync(path.join(dir, name), JSON.stringify({ numbers: {} }));
    }
    fs.writeFileSync(path.join(dir, 'vietlott_full_draws.json'), JSON.stringify({ vietlott_655: [], vietlott_645: [] }));
    fs.writeFileSync(path.join(dir, 'xsmb_recent_draws.json'), JSON.stringify([{ date: '2026-11-11', raw_prizes: { special: 1 } }]));
    expect(() => buildDataBundles(dir, { strict: true })).toThrow(/kỳ 2026-11-11 thiếu hoặc sai giải prize1/);
    fs.rmSync(dir, { recursive: true });
  });

  it('chạy được trên dữ liệu thật trong public/data', () => {
    const out = buildDataBundles(path.resolve(__dirname, '../public/data'), { strict: true });
    const stats = JSON.parse(out.get('xsmb_stats.json')!);
    expect(Object.keys(stats.numbers)).toHaveLength(100);
    expect(out.get('xsmb_draws_recent.json')!.length).toBeLessThan(20 * 1024);
  });
});
