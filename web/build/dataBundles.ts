/**
 * Gói dữ liệu gọn theo màn hình, sinh lúc build từ các file JSON do engine xuất ra
 * trong public/data. Không commit vào repo: các file này đổi mỗi ngày theo dữ liệu.
 *
 * Đầu ra (đường dẫn tương đối trong dist/, xem BUNDLE_DIR):
 * - <product>_stats.json         chỉ mục bỏ recent_history/top_pairs/yearly_distribution
 * - detail/<product>/<số>.json   thống kê đầy đủ của một số (màn hình tra cứu)
 * - xsmb_draws_recent.json       30 kỳ XSMB gần nhất, dạng mảng
 * - xsmb_draws.json              365 kỳ XSMB, dạng mảng
 * - vietlott_655_draws.json, vietlott_645_draws.json  lịch sử kỳ quay theo sản phẩm
 *
 * Trong dev, plugin phục vụ cùng các đường dẫn qua middleware. Khi build, dữ liệu nguồn thiếu
 * hoặc sai làm build thất bại (xem BuildDataBundlesOptions.strict).
 */
import fs from 'node:fs';
import path from 'node:path';
import type { Plugin } from 'vite';

export const BUNDLE_DIR = 'bundles';
export const XSMB_RECENT_LIMIT = 30;

const HEAVY_NUMBER_FIELDS = new Set(['recent_history', 'top_pairs', 'yearly_distribution']);
const INDEX_PRODUCTS = ['xsmb', 'vietlott_655', 'vietlott_645'] as const;

// Thứ tự 27 giải trong mảng nén, trùng với cột của data/xsmb/xsmb.csv
export const XSMB_PRIZE_FIELDS = [
  'special', 'prize1',
  'prize2_1', 'prize2_2',
  'prize3_1', 'prize3_2', 'prize3_3', 'prize3_4', 'prize3_5', 'prize3_6',
  'prize4_1', 'prize4_2', 'prize4_3', 'prize4_4',
  'prize5_1', 'prize5_2', 'prize5_3', 'prize5_4', 'prize5_5', 'prize5_6',
  'prize6_1', 'prize6_2', 'prize6_3',
  'prize7_1', 'prize7_2', 'prize7_3', 'prize7_4',
] as const;

type Json = Record<string, unknown>;

export function slimIndex(index: Json): Json {
  const { numbers, ...rest } = index as { numbers?: Record<string, Json> };
  const slimNumbers: Record<string, Json> = {};
  for (const [num, detail] of Object.entries(numbers ?? {})) {
    slimNumbers[num] = Object.fromEntries(Object.entries(detail).filter(([k]) => !HEAVY_NUMBER_FIELDS.has(k)));
  }
  return { ...rest, numbers: slimNumbers };
}

interface RawXsmbDraw {
  date: string;
  raw_prizes: Record<string, number>;
}

export function compactXsmbDraws(draws: RawXsmbDraw[], problems: string[] = []) {
  return {
    fields: ['date', ...XSMB_PRIZE_FIELDS],
    draws: draws.map((d) => [
      d.date,
      ...XSMB_PRIZE_FIELDS.map((f) => {
        const value = Number(d.raw_prizes?.[f]);
        if (!Number.isFinite(value)) problems.push(`xsmb_recent_draws.json: kỳ ${d.date} thiếu hoặc sai giải ${f}`);
        return value;
      }),
    ]),
  };
}

export interface BuildDataBundlesOptions {
  /** true: thiếu file nguồn, thiếu sản phẩm hoặc giải không phải số thì báo lỗi (dùng khi build) */
  strict?: boolean;
}

/** Tạo toàn bộ gói từ thư mục dữ liệu. Trả về map: đường dẫn tương đối -> nội dung JSON. */
export function buildDataBundles(dataDir: string, { strict = false }: BuildDataBundlesOptions = {}): Map<string, string> {
  const out = new Map<string, string>();
  const problems: string[] = [];
  const read = (name: string): unknown | null => {
    const file = path.join(dataDir, name);
    if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, 'utf-8'));
    problems.push(`thiếu file nguồn ${name}`);
    return null;
  };
  const put = (name: string, payload: unknown) => out.set(name, JSON.stringify(payload));

  for (const product of INDEX_PRODUCTS) {
    const index = read(`${product}_index.json`) as Json | null;
    if (!index) continue;
    put(`${product}_stats.json`, slimIndex(index));
    for (const [num, detail] of Object.entries((index.numbers as Record<string, Json>) ?? {})) {
      put(`detail/${product}/${num}.json`, detail);
    }
  }

  const recent = read('xsmb_recent_draws.json') as RawXsmbDraw[] | null;
  if (recent) {
    const compact = compactXsmbDraws(recent, problems);
    put('xsmb_draws.json', compact);
    put('xsmb_draws_recent.json', { ...compact, draws: compact.draws.slice(0, XSMB_RECENT_LIMIT) });
  }

  const full = read('vietlott_full_draws.json') as Json | null;
  if (full) {
    const meta = (full.metadata as Json) ?? {};
    for (const product of ['vietlott_655', 'vietlott_645'] as const) {
      if (!Array.isArray(full[product])) problems.push(`vietlott_full_draws.json: thiếu danh sách ${product}`);
      const draws = (full[product] as unknown[]) ?? [];
      put(`${product}_draws.json`, { metadata: { generated_at: meta.generated_at, total: draws.length }, draws });
    }
  }

  if (strict && problems.length) {
    throw new Error(`Dữ liệu nguồn trong ${dataDir} không đủ để sinh gói:\n- ${problems.join('\n- ')}`);
  }
  return out;
}

export function dataBundlesPlugin(options: { dataDir: string }): Plugin {
  let cache: { key: string; bundles: Map<string, string> } | null = null;

  // Khóa cache theo mtime của các file nguồn để dev server luôn trả dữ liệu mới
  const getBundles = () => {
    const key = fs
      .readdirSync(options.dataDir)
      .filter((f) => f.endsWith('.json'))
      .map((f) => `${f}:${fs.statSync(path.join(options.dataDir, f)).mtimeMs}`)
      .join('|');
    if (!cache || cache.key !== key) cache = { key, bundles: buildDataBundles(options.dataDir) };
    return cache.bundles;
  };

  return {
    name: 'vlh-data-bundles',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = (req.url ?? '').split('?')[0];
        const marker = `/${BUNDLE_DIR}/`;
        const at = url.indexOf(marker);
        if (at === -1) return next();
        const body = getBundles().get(decodeURIComponent(url.slice(at + marker.length)));
        if (body === undefined) return next();
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(body);
      });
    },
    generateBundle() {
      // Build: thiếu dữ liệu thì dừng build, không deploy trang với gói rỗng
      let bundles: Map<string, string>;
      try {
        bundles = buildDataBundles(options.dataDir, { strict: true });
      } catch (e) {
        this.error((e as Error).message);
      }
      for (const [name, source] of bundles) {
        this.emitFile({ type: 'asset', fileName: `${BUNDLE_DIR}/${name}`, source });
      }
    },
  };
}
