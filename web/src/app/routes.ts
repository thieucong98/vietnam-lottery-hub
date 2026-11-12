/**
 * Bảng URL của ứng dụng (HashRouter, ví dụ https://.../#/so/68).
 * Mọi đường dẫn đều tạo qua các hàm ở đây để giữ URL nhất quán.
 */
import type { LotteryGame, VietlottGame } from '../data/datasets';

export type TabId = 'xsmb' | 'vietlott_655' | 'vietlott_645' | 'keno_3d' | 'heatmap' | 'gan' | 'bacnho' | 'filter' | 'ai';

export const TAB_PATHS: Record<TabId, string> = {
  xsmb: '/',
  vietlott_655: '/vietlott/655',
  vietlott_645: '/vietlott/645',
  keno_3d: '/keno-3d',
  heatmap: '/nhiet',
  gan: '/gan',
  bacnho: '/bac-nho',
  filter: '/loc-ve',
  ai: '/thuat-toan',
};

/** Tab đang chọn trên thanh điều hướng, suy ra từ đường dẫn trang */
export function tabFromPath(pathname: string): TabId {
  if (pathname.startsWith('/vietlott/645')) return 'vietlott_645';
  if (pathname.startsWith('/vietlott')) return 'vietlott_655';
  const first = `/${pathname.split('/')[1] ?? ''}`;
  const match = (Object.entries(TAB_PATHS) as [TabId, string][]).find(([, p]) => p !== '/' && p === first);
  return match ? match[0] : 'xsmb';
}

// ---------- Trang con có URL riêng ----------

export type VietlottTool = 'quick_pick' | 'combo_bao' | 'cooccurrence' | 'history';
export const VIETLOTT_TOOL_SLUGS: Record<VietlottTool, string> = {
  quick_pick: '',
  combo_bao: 'bo-so',
  cooccurrence: 'cap-so',
  history: 'lich-su',
};

export type KenoView = 'keno' | 'max3d' | 'max3d_pro';
export const KENO_VIEW_SLUGS: Record<KenoView, string> = { keno: '', max3d: 'max-3d', max3d_pro: 'max-3d-pro' };

export type FilterView = 'vietlott_filter' | 'checker';
export const FILTER_VIEW_SLUGS: Record<FilterView, string> = { vietlott_filter: '', checker: 'xsmb' };

/** Tra slug -> giá trị; trả undefined nếu slug không hợp lệ */
export function fromSlug<T extends string>(slugs: Record<T, string>, slug: string | undefined): T | undefined {
  return (Object.entries(slugs) as [T, string][]).find(([, s]) => s === (slug ?? ''))?.[0];
}

const withSlug = (base: string, slug: string) => (slug ? `${base}/${slug}` : base);

export const GAME_PARAM: Record<LotteryGame, string> = { xsmb: 'xsmb', vietlott_655: '655', vietlott_645: '645' };

export function gameFromParam(value: string | null | undefined, fallback: LotteryGame = 'xsmb'): LotteryGame {
  const found = (Object.entries(GAME_PARAM) as [LotteryGame, string][]).find(([, v]) => v === value);
  return found ? found[0] : fallback;
}

export const XSMB_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const paths = {
  home: () => '/',
  xsmbDate: (date: string) => `/xsmb/${date}`,
  vietlott: (game: VietlottGame, tool: VietlottTool = 'quick_pick', balls?: number[]) => {
    const base = withSlug(TAB_PATHS[game], VIETLOTT_TOOL_SLUGS[tool]);
    return balls && balls.length ? `${base}?so=${formatNumberList(balls)}` : base;
  },
  keno: (view: KenoView = 'keno') => withSlug(TAB_PATHS.keno_3d, KENO_VIEW_SLUGS[view]),
  filter: (view: FilterView = 'vietlott_filter') => withSlug(TAB_PATHS.filter, FILTER_VIEW_SLUGS[view]),
  legal: () => '/phap-ly',
};

// ---------- Tra cứu (mở dạng hộp thoại phủ lên trang hiện tại) ----------

export type LookupMode = 'single' | 'combination' | 'pair';

export interface LookupTarget {
  mode: LookupMode;
  game: LotteryGame;
  /** Số đã chuẩn hóa 2 chữ số */
  numbers: string[];
}

const pad2 = (n: number | string) => String(n).padStart(2, '0');
export const formatNumberList = (nums: (number | string)[]) => nums.map(pad2).join('-');

export function lookupPath({ mode, game, numbers }: LookupTarget): string {
  const query = new URLSearchParams();
  if (mode === 'single') {
    if (game !== 'xsmb') query.set('game', GAME_PARAM[game]);
    const qs = query.toString() ? `?${query}` : '';
    return numbers[0] ? `/so/${numbers[0]}${qs}` : `/tra-cuu${qs}`;
  }
  query.set('game', GAME_PARAM[game]);
  if (numbers.length) query.set('so', numbers.join('-'));
  return `/tra-cuu/${mode === 'combination' ? 'bo-so' : 'cap'}?${query}`;
}

const GAME_MAX: Record<LotteryGame, number> = { xsmb: 99, vietlott_655: 55, vietlott_645: 45 };

/** Danh sách số trong `?so=`: bỏ số ngoài phạm vi của trò chơi và số trùng */
function parseSoParam(value: string | null, game: LotteryGame): string[] {
  const min = game === 'xsmb' ? 0 : 1;
  const nums = (value ?? '')
    .split(/[-,\s]+/)
    .filter((t) => /^\d{1,2}$/.test(t))
    .map((t) => parseInt(t, 10))
    .filter((n) => n >= min && n <= GAME_MAX[game]);
  return Array.from(new Set(nums)).map(pad2);
}

export function parseLookupLocation(pathname: string, search: URLSearchParams): LookupTarget | null {
  const single = pathname.match(/^\/so\/(\d{1,2})$/);
  if (single) return { mode: 'single', game: gameFromParam(search.get('game')), numbers: [pad2(single[1])] };
  if (pathname === '/tra-cuu') return { mode: 'single', game: gameFromParam(search.get('game')), numbers: [] };
  if (pathname === '/tra-cuu/bo-so') {
    const param = gameFromParam(search.get('game'), 'vietlott_655');
    const game = param === 'xsmb' ? 'vietlott_655' : param;
    return { mode: 'combination', game, numbers: parseSoParam(search.get('so'), game) };
  }
  if (pathname === '/tra-cuu/cap') {
    const game = gameFromParam(search.get('game'));
    return { mode: 'pair', game, numbers: parseSoParam(search.get('so'), game).slice(0, 2) };
  }
  return null;
}

/**
 * Chọn chế độ tra cứu theo chuỗi người dùng nhập (giống hành vi cũ của InstantLookupModal):
 * >= 3 số: tra bộ số Vietlott; 2 số: cặp số; 1 số: tra đơn số.
 */
export function lookupTargetFromText(text: string, game: LotteryGame = 'xsmb'): LookupTarget {
  const tokens = text.replace(/[,.-]/g, ' ').trim().split(/\s+/).filter((t) => /^\d+$/.test(t));
  if (tokens.length >= 3) {
    const nums = tokens.map((t) => parseInt(t, 10)).filter((n) => n >= 1 && n <= 55);
    if (nums.length >= 3) {
      return { mode: 'combination', game: game === 'xsmb' ? 'vietlott_655' : game, numbers: nums.map(pad2) };
    }
  }
  if (tokens.length === 2) return { mode: 'pair', game, numbers: tokens.map((t) => pad2(t.slice(-2))) };
  const first = tokens[0];
  return { mode: 'single', game, numbers: first && first.length <= 2 ? [pad2(first)] : [] };
}

/** Đường dẫn của hộp thoại. Đường dẫn sai (vd. /so/abc, /tra-cuu/xyz) không phải hộp thoại nên rơi vào trang 404. */
const OVERLAY_PATH_PATTERN = /^\/(so\/\d{1,2}|tra-cuu(\/(bo-so|cap))?|phap-ly)$/;
export const isOverlayPath = (pathname: string) => OVERLAY_PATH_PATTERN.test(pathname);

/** Hỗ trợ link cũ dạng ?tab=heatmap (trước khi có router) */
export const LEGACY_TAB_PARAM: Record<string, string> = {
  ...TAB_PATHS,
  vietlott_combo: paths.vietlott('vietlott_655', 'combo_bao'),
};
