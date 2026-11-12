import {
  fromSlug,
  isOverlayPath,
  lookupPath,
  lookupTargetFromText,
  parseLookupLocation,
  paths,
  tabFromPath,
  VIETLOTT_TOOL_SLUGS,
} from './routes';

describe('tabFromPath', () => {
  it.each([
    ['/', 'xsmb'],
    ['/xsmb/2026-11-11', 'xsmb'],
    ['/vietlott/655', 'vietlott_655'],
    ['/vietlott/645/lich-su', 'vietlott_645'],
    ['/keno-3d/max-3d', 'keno_3d'],
    ['/nhiet', 'heatmap'],
    ['/loc-ve/xsmb', 'filter'],
    ['/khong-co', 'xsmb'],
  ])('%s -> %s', (path, tab) => expect(tabFromPath(path)).toBe(tab));
});

describe('paths', () => {
  it('tạo URL theo kế hoạch', () => {
    expect(paths.xsmbDate('2026-11-11')).toBe('/xsmb/2026-11-11');
    expect(paths.vietlott('vietlott_655')).toBe('/vietlott/655');
    expect(paths.vietlott('vietlott_645', 'combo_bao', [3, 11])).toBe('/vietlott/645/bo-so?so=03-11');
    expect(paths.keno('max3d_pro')).toBe('/keno-3d/max-3d-pro');
  });
  it('fromSlug trả undefined khi slug lạ', () => {
    expect(fromSlug(VIETLOTT_TOOL_SLUGS, undefined)).toBe('quick_pick');
    expect(fromSlug(VIETLOTT_TOOL_SLUGS, 'lich-su')).toBe('history');
    expect(fromSlug(VIETLOTT_TOOL_SLUGS, 'abc')).toBeUndefined();
  });
});

describe('URL tra cứu', () => {
  it.each([
    [{ mode: 'single', game: 'xsmb', numbers: ['68'] }, '/so/68'],
    [{ mode: 'single', game: 'vietlott_655', numbers: ['07'] }, '/so/07?game=655'],
    [{ mode: 'single', game: 'xsmb', numbers: [] }, '/tra-cuu'],
    [{ mode: 'combination', game: 'vietlott_645', numbers: ['03', '11'] }, '/tra-cuu/bo-so?game=645&so=03-11'],
    [{ mode: 'pair', game: 'xsmb', numbers: ['68', '86'] }, '/tra-cuu/cap?game=xsmb&so=68-86'],
  ] as const)('%o <-> %s', (target, path) => {
    expect(lookupPath({ ...target, numbers: [...target.numbers] })).toBe(path);
    const [pathname, qs = ''] = path.split('?');
    expect(parseLookupLocation(pathname, new URLSearchParams(qs))).toEqual(target);
    expect(isOverlayPath(pathname)).toBe(true);
  });

  it('bộ số luôn là Vietlott (XSMB -> 6/55)', () => {
    expect(parseLookupLocation('/tra-cuu/bo-so', new URLSearchParams('game=xsmb&so=1-2-3'))?.game).toBe('vietlott_655');
  });

  it('chọn chế độ theo số lượng số nhập vào', () => {
    expect(lookupTargetFromText('68')).toEqual({ mode: 'single', game: 'xsmb', numbers: ['68'] });
    expect(lookupTargetFromText('68 86')).toEqual({ mode: 'pair', game: 'xsmb', numbers: ['68', '86'] });
    expect(lookupTargetFromText('7, 18, 24, 35, 41, 55')).toEqual({
      mode: 'combination',
      game: 'vietlott_655',
      numbers: ['07', '18', '24', '35', '41', '55'],
    });
    // Số Max 3D (3 chữ số) không tra cứu đơn số
    expect(lookupTargetFromText('710').numbers).toEqual([]);
  });

  it('trang thường không phải hộp thoại', () => {
    expect(isOverlayPath('/vietlott/655')).toBe(false);
    expect(isOverlayPath('/phap-ly')).toBe(true);
  });

  it.each(['/so/abc', '/so/100', '/tra-cuu/xyz', '/phap-ly/x'])('đường dẫn hộp thoại sai %s -> trang 404', (path) => {
    expect(isOverlayPath(path)).toBe(false);
  });

  it('bỏ số ngoài phạm vi và số trùng trong ?so=', () => {
    expect(parseLookupLocation('/tra-cuu/bo-so', new URLSearchParams('game=655&so=99-07-07-00-55'))?.numbers).toEqual(['07', '55']);
    expect(parseLookupLocation('/tra-cuu/cap', new URLSearchParams('game=645&so=50-07-12'))?.numbers).toEqual(['07', '12']);
    expect(parseLookupLocation('/tra-cuu/cap', new URLSearchParams('game=xsmb&so=00-99'))?.numbers).toEqual(['00', '99']);
  });
});
