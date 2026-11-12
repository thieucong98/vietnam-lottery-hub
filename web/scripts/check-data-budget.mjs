// Kiểm tra ngân sách dung lượng của bản build (chạy sau `npm run build`).
// Dữ liệu tải lúc mở trang chủ là summary.json + bundles/xsmb_draws_recent.json
// (xem src/pages/XsmbPage.tsx); tổng phải < 100 KB theo tiêu chí Phase 1.
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const dist = path.resolve(import.meta.dirname, '../dist');
const KB = 1024;

const INITIAL_DATA = ['data/summary.json', 'bundles/xsmb_draws_recent.json'];
const INITIAL_DATA_BUDGET = 100 * KB;
// Mỗi gói tải theo màn hình (chưa nén) không vượt quá mức này
const BUNDLE_FILE_BUDGET = 150 * KB;
// JS chung tải lúc mở trang (đã gzip)
const ENTRY_JS_GZIP_BUDGET = 100 * KB;

const size = (rel) => fs.statSync(path.join(dist, rel)).size;
const failures = [];
const report = [];

const initial = INITIAL_DATA.reduce((sum, rel) => sum + size(rel), 0);
report.push(`Dữ liệu lúc mở trang: ${(initial / KB).toFixed(1)} KB / ${INITIAL_DATA_BUDGET / KB} KB (${INITIAL_DATA.join(', ')})`);
if (initial > INITIAL_DATA_BUDGET) failures.push('Dữ liệu lúc mở trang vượt ngân sách');

for (const file of fs.readdirSync(path.join(dist, 'bundles'))) {
  if (!file.endsWith('.json')) continue;
  const bytes = size(`bundles/${file}`);
  if (bytes > BUNDLE_FILE_BUDGET) failures.push(`bundles/${file}: ${(bytes / KB).toFixed(1)} KB > ${BUNDLE_FILE_BUDGET / KB} KB`);
}

const html = fs.readFileSync(path.join(dist, 'index.html'), 'utf-8');
const entry = html.match(/src="\.\/(assets\/index-[^"]+\.js)"/)?.[1];
if (!entry) {
  failures.push('Không tìm thấy JS chính trong index.html');
} else {
  const gz = zlib.gzipSync(fs.readFileSync(path.join(dist, entry))).length;
  report.push(`JS chính (gzip): ${(gz / KB).toFixed(1)} KB / ${ENTRY_JS_GZIP_BUDGET / KB} KB`);
  if (gz > ENTRY_JS_GZIP_BUDGET) failures.push('JS chính vượt ngân sách');
}

console.log(report.join('\n'));
if (failures.length) {
  console.error(`\nVượt ngân sách:\n- ${failures.join('\n- ')}`);
  process.exit(1);
}
console.log('Ngân sách dung lượng: OK');
